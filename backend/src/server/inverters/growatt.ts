import { createHash } from "crypto";
import type { InverterAdapter } from "./types";

const BASE = "https://openapi.growatt.com";

function fmtDate(day: number): string {
  const s = String(day);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export const growattAdapter: InverterAdapter = {
  brand: "growatt",

  async validateCredentials(credentials) {
    const { username, password } = credentials;
    if (!username || !password) throw new Error("Growatt requires username and password");

    const passwordMd5 = createHash("md5").update(password).digest("hex");
    const body        = new URLSearchParams({ account: username, password: passwordMd5 });

    const res = await fetch(`${BASE}/v1/user/session`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Growatt: HTTP ${res.status}`);

    const data = await res.json() as { data?: { user?: { account?: string } }; error?: number };
    if (data.error !== 0) throw new Error(`Growatt: auth failed (error ${data.error})`);
    return `Growatt account: ${data.data?.user?.account ?? username}`;
  },

  async readProduction(credentials, productionDay) {
    const { username, password } = credentials;
    const passwordMd5 = createHash("md5").update(password).digest("hex");

    // Establish session
    const loginRes = await fetch(`${BASE}/v1/user/session`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ account: username, password: passwordMd5 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!loginRes.ok) throw new Error(`Growatt login: HTTP ${loginRes.status}`);

    const date = fmtDate(productionDay);
    const energyRes = await fetch(`${BASE}/v1/plant/energy/day?date=${date}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!energyRes.ok) throw new Error(`Growatt energy: HTTP ${energyRes.status}`);

    const data = await energyRes.json() as { data?: { eToday?: number } };
    // eToday is in kWh; convert to Wh integer
    return Math.round((data.data?.eToday ?? 0) * 1000);
  },
};
