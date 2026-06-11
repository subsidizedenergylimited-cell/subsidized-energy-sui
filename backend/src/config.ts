import "dotenv/config";

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const config = {
  privateKey:       required("SUI_PRIVATE_KEY"),
  packageId:        required("PACKAGE_ID"),
  mintCapId:        required("MINT_CAP_ID"),
  producerRegistryId: required("PRODUCER_REGISTRY_ID"),
  clockId:          "0x6",
};
