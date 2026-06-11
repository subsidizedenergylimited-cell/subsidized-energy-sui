import type { InverterAdapter } from "./types";

const BASE = "https://intl.fusionsolar.huawei.com/thirdData";

export const huaweiAdapter: InverterAdapter = {
  brand: "huawei",

  async validateCredentials(credentials) {
    const { userName, systemCode } = credentials;
    if (!userName || !systemCode) {
      throw new Error("Huawei FusionSolar requires userName and systemCode");
    }

    const res = await fetch(`${BASE}/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userName, systemCode }),
      signal:  AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Huawei: HTTP ${res.status}`);

    const data = await res.json() as { success?: boolean; failCode?: number; message?: string };
    if (!data.success) throw new Error(`Huawei: ${data.message ?? `failCode ${data.failCode}`}`);
    return `Huawei FusionSolar (${userName})`;
  },

  async readProduction(credentials, productionDay) {
    const { userName, systemCode } = credentials;

    // Huawei requires a fresh xsrf token per session
    const loginRes = await fetch(`${BASE}/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userName, systemCode }),
      signal:  AbortSignal.timeout(8000),
    });
    if (!loginRes.ok) throw new Error(`Huawei login: HTTP ${loginRes.status}`);
    const xsrf = loginRes.headers.get("xsrf-token") ?? "";

    const s     = String(productionDay);
    const date  = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

    const energyRes = await fetch(`${BASE}/getKpiInfo`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "xsrf-token": xsrf },
      body:    JSON.stringify({ date, type: "DAY" }),
      signal:  AbortSignal.timeout(8000),
    });
    if (!energyRes.ok) throw new Error(`Huawei kpi: HTTP ${energyRes.status}`);

    const data = await energyRes.json() as { data?: { radiation_intensity?: number } };
    // Huawei returns total yield in kWh under radiation_intensity for day queries
    return Math.round((data.data?.radiation_intensity ?? 0) * 1000);
  },
};
