import type { InverterAdapter } from "./types";

const BASE = "https://globalapi.solarmanpv.com";

function fmtDate(day: number): { start: number; end: number } {
  // Solarman uses unix timestamps for day boundaries
  const s    = String(day);
  const date = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z`);
  return { start: Math.floor(date.getTime() / 1000), end: Math.floor(date.getTime() / 1000) + 86399 };
}

export const deyeAdapter: InverterAdapter = {
  brand: "deye",

  async validateCredentials(credentials) {
    const { appId, appSecret, email, password } = credentials;
    if (!appId || !appSecret || !email || !password) {
      throw new Error("Deye/Solarman requires appId, appSecret, email, and password");
    }

    const res = await fetch(
      `${BASE}/account/v1.0/token?appId=${appId}&language=en`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ appSecret, email, password }),
        signal:  AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) throw new Error(`Deye/Solarman: HTTP ${res.status}`);

    const data = await res.json() as { success?: boolean; msg?: string; uid?: string };
    if (!data.success) throw new Error(`Deye/Solarman: ${data.msg ?? "auth failed"}`);
    return `Solarman account (uid: ${data.uid ?? "?"})`;
  },

  async readProduction(credentials, productionDay) {
    const { appId, appSecret, email, password } = credentials;
    const tokenRes = await fetch(
      `${BASE}/account/v1.0/token?appId=${appId}&language=en`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ appSecret, email, password }),
        signal:  AbortSignal.timeout(8000),
      },
    );
    if (!tokenRes.ok) throw new Error(`Deye token: HTTP ${tokenRes.status}`);
    const { accessToken } = await tokenRes.json() as { accessToken?: string };
    if (!accessToken) throw new Error("Deye: no accessToken");

    const { start, end } = fmtDate(productionDay);
    const energyRes = await fetch(
      `${BASE}/station/v1.0/energy?language=en`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ startTime: start, endTime: end, timeType: 2 }),
        signal:  AbortSignal.timeout(8000),
      },
    );
    if (!energyRes.ok) throw new Error(`Deye energy: HTTP ${energyRes.status}`);

    const data = await energyRes.json() as { generationValue?: number };
    // generationValue in kWh
    return Math.round((data.generationValue ?? 0) * 1000);
  },
};
