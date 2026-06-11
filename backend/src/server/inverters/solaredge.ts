import type { InverterAdapter } from "./types";

// SolarEdge Monitoring API v1 — requires an API key and site ID.
// Docs: https://knowledge-center.solaredge.com/sites/kc/files/se_monitoring_api.pdf
const BASE = "https://monitoringapi.solaredge.com";

export const solarEdgeAdapter: InverterAdapter = {
  brand: "solaredge",

  async validateCredentials(credentials) {
    const { apiKey, siteId } = credentials;
    if (!apiKey || !siteId) {
      throw new Error("SolarEdge requires apiKey and siteId");
    }

    const url = `${BASE}/site/${siteId}/details?api_key=${apiKey}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (res.status === 403) throw new Error("SolarEdge: invalid API key");
    if (res.status === 404) throw new Error("SolarEdge: site not found");
    if (!res.ok) throw new Error(`SolarEdge: unexpected status ${res.status}`);

    const data = await res.json() as { details?: { name?: string } };
    return data.details?.name ?? `SolarEdge site ${siteId}`;
  },
};
