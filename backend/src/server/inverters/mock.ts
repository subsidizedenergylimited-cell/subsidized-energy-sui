import type { InverterAdapter } from "./types";

/** Always succeeds — used for demos and local testing. */
export const mockAdapter: InverterAdapter = {
  brand: "mock",

  async validateCredentials(credentials) {
    if (!credentials["serial"]) {
      throw new Error('Mock adapter requires a "serial" field');
    }
    return `Mock Inverter (${credentials["serial"]})`;
  },

  async readProduction(_credentials, productionDay) {
    // Deterministic demo value: seed from the day so re-runs are stable.
    // 5 000 – 9 999 Wh depending on the date digit sum.
    const digitSum = String(productionDay)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
    return 5000 + (digitSum % 5) * 1000;
  },
};
