import type { InverterAdapter } from "./types";

/** Always succeeds — used for demos and local testing. */
export const mockAdapter: InverterAdapter = {
  brand: "mock",

  async validateCredentials(credentials) {
    // Require at least a "serial" field so the request isn't completely empty.
    if (!credentials["serial"]) {
      throw new Error('Mock adapter requires a "serial" field');
    }
    return `Mock Inverter (${credentials["serial"]})`;
  },
};
