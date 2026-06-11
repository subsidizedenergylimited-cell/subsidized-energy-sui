import type { InverterAdapter } from "./types";
import { mockAdapter }      from "./mock";
import { solarEdgeAdapter } from "./solaredge";
import { growattAdapter }   from "./growatt";
import { deyeAdapter }      from "./deye";
import { huaweiAdapter }    from "./huawei";

const adapters: Record<string, InverterAdapter> = {
  mock:      mockAdapter,
  solaredge: solarEdgeAdapter,
  growatt:   growattAdapter,
  deye:      deyeAdapter,
  huawei:    huaweiAdapter,
};

export const SUPPORTED_BRANDS = Object.keys(adapters);

export function getAdapter(brand: string): InverterAdapter {
  const adapter = adapters[brand.toLowerCase()];
  if (!adapter) {
    throw new Error(`Unknown brand "${brand}". Supported: ${SUPPORTED_BRANDS.join(", ")}`);
  }
  return adapter;
}
