import "dotenv/config";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" });

export interface CertificateFields {
  objectId:      string;
  producer:      string;
  watt_hours:    number;
  production_day: number;
  walrus_blob_id: string;
  minted_at:     number;
}

export async function readCertificate(objectId: string): Promise<CertificateFields> {
  const res = await client.getObject({ id: objectId, options: { showContent: true } });

  if (res.error) {
    throw new Error(`Object fetch error: ${JSON.stringify(res.error)}`);
  }

  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") {
    throw new Error(`Object ${objectId} has no Move content (may not exist or be a package)`);
  }

  // The RPC returns Move struct fields as a plain key→value record.
  // u64 fields arrive as decimal strings; we parse them to numbers here.
  // (Values up to 2^53-1 are safe as JS numbers; watt_hours and YYYYMMDD
  // are far below that ceiling.)
  const f = content.fields as Record<string, unknown>;

  return {
    objectId,
    producer:       f["producer"] as string,
    watt_hours:     Number(f["watt_hours"]),
    production_day: Number(f["production_day"]),
    walrus_blob_id: f["walrus_blob_id"] as string,
    minted_at:      Number(f["minted_at"]),
  };
}
