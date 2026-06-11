import { createHash } from "crypto";
import type { InverterAdapter } from "./types";

// Growatt OpenAPI — authenticates with username + MD5-hashed password.
// Docs: https://www.growatt.com/document/download
const BASE = "https://openapi.growatt.com";

export const growattAdapter: InverterAdapter = {
  brand: "growatt",

  async validateCredentials(credentials) {
    const { username, password } = credentials;
    if (!username || !password) {
      throw new Error("Growatt requires username and password");
    }

    const passwordMd5 = createHash("md5").update(password).digest("hex");
    const body        = new URLSearchParams({ account: username, password: passwordMd5 });

    const res = await fetch(`${BASE}/v1/user/session`, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Growatt: HTTP ${res.status}`);

    const data = await res.json() as { data?: { user?: { account?: string } }; error?: number };
    if (data.error !== 0) throw new Error(`Growatt: auth failed (error ${data.error})`);

    return `Growatt account: ${data.data?.user?.account ?? username}`;
  },
};
