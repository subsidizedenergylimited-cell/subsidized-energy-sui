import type { InverterAdapter } from "./types";

// Huawei FusionSolar Northbound API — username + system code.
// Docs: https://intl.fusionsolar.huawei.com/thirdData/northboundInterface
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
    if (!data.success) {
      throw new Error(`Huawei: ${data.message ?? `failCode ${data.failCode}`}`);
    }

    return `Huawei FusionSolar (${userName})`;
  },
};
