import type { InverterAdapter } from "./types";

const BASE = "https://monitoringapi.solaredge.com";

function fmtDate(day: number): string {
  // YYYYMMDD -> YYYY-MM-DD
  const s = String(day);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export const solarEdgeAdapter: InverterAdapter = {
  brand: "solaredge",

  async validateCredentials(credentials) {
    const { apiKey, siteId } = credentials;
    if (!apiKey || !siteId) throw new Error("SolarEdge requires apiKey and siteId");

    const res = await fetch(
      `${BASE}/site/${siteId}/details?api_key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (res.status === 403) throw new Error("SolarEdge: invalid API key");
    if (res.status === 404) throw new Error("SolarEdge: site not found");
    if (!res.ok) throw new Error(`SolarEdge: unexpected status ${res.status}`);

    const data = await res.json() as { details?: { name?: string } };
    return data.details?.name ?? `SolarEdge site ${siteId}`;
  },

  async readProduction(credentials, productionDay) {
    const { apiKey, siteId } = credentials;
    const date = fmtDate(productionDay);

    const res = await fetch(
      `${BASE}/site/${siteId}/energy?timeUnit=DAY&startDate=${date}&endDate=${date}&api_key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`SolarEdge energy: HTTP ${res.status}`);

    const data = await res.json() as {
      energy?: { values?: { value?: number | null }[] };
    };
    const wh = data.energy?.values?.[0]?.value ?? 0;
    // API returns Wh; convert nulls to 0.
    return Math.max(0, Math.round(wh ?? 0));
  },
};
