import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { config } from "../config";

const client  = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" });
const keypair = Ed25519Keypair.fromSecretKey(config.privateKey);

export interface MintParams {
  producer: string;
  wattHours: number;
  productionDay: number;
  walrusBlobId: string;
}

export interface MintResult {
  certificateId: string;
  digest: string;
}

export async function mintCertificate(params: MintParams): Promise<MintResult> {
  const { producer, wattHours, productionDay, walrusBlobId } = params;

  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::sub::mint_certificate`,
    arguments: [
      tx.object(config.mintCapId),
      tx.object(config.producerRegistryId),
      tx.pure.address(producer),
      tx.pure.u64(wattHours),
      tx.pure.u64(productionDay),
      tx.pure.string(walrusBlobId),
      tx.object(config.clockId),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: { showObjectChanges: true, showEffects: true },
  });

  if (result.effects?.status.status !== "success") {
    const err = result.effects?.status.error ?? "unknown";
    throw new Error(`Transaction failed: ${err}`);
  }

  const certType = `${config.packageId}::sub::SubCertificate`;
  const created  = (result.objectChanges ?? []).find(
    (c) => c.type === "created" && c.objectType === certType,
  );

  if (!created || created.type !== "created") {
    throw new Error(
      `SubCertificate not found in object changes.\n${JSON.stringify(result.objectChanges, null, 2)}`,
    );
  }

  return { certificateId: created.objectId, digest: result.digest };
}
