import type { InverterAdapter } from "./types";

// Deye/Solarman API — authenticates with appId, appSecret, email, password.
// Docs: https://developers.solarmanpv.com/
const BASE = "https://globalapi.solarmanpv.com";

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
};
