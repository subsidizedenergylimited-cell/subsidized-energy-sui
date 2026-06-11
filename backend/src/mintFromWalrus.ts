import "dotenv/config";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { storeProof } from "./walrus/client";
import { sampleReading } from "./walrus/sampleReading";
import { mintCertificate } from "./sui/mintCertificate";
import { config } from "./config";

// Accept an optional production_day override as a CLI arg (YYYYMMDD).
// Useful for re-testing since the contract rejects re-minting the same day.
const dayArg = process.argv[2];
const productionDay = dayArg ? parseInt(dayArg, 10) : sampleReading.production_day;

if (dayArg && !/^\d{8}$/.test(dayArg)) {
  console.error("Usage: mint:demo [YYYYMMDD]  e.g. npm run mint:demo 20260612");
  process.exit(1);
}

async function main() {
  const producer = Ed25519Keypair.fromSecretKey(config.privateKey)
    .getPublicKey()
    .toSuiAddress();

  const reading = { ...sampleReading, production_day: productionDay };

  console.log("── Step 1: Store reading on Walrus ─────────────────────────");
  const blobId = await storeProof(reading);
  console.log("Blob ID     :", blobId);

  console.log("\n── Step 2: Mint $SUB certificate on Sui testnet ────────────");
  console.log("Producer    :", producer);
  console.log("Day         :", productionDay);
  console.log("Watt-hours  :", reading.watt_hours);

  let certId: string;
  let digest: string;
  try {
    ({ certificateId: certId, digest } = await mintCertificate({
      producer,
      wattHours: reading.watt_hours,
      productionDay,
      walrusBlobId: blobId,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Surface the one-per-day abort as a clear human-readable message.
    if (msg.includes("abort code: 1") || msg.includes("abortCode: 1") || msg.includes("EDayAlreadyMinted")) {
      console.error(
        "\nAborted: a $SUB certificate for day",
        productionDay,
        "already exists for this producer.",
        "\nPass a later day as a CLI arg:  npm run mint:demo YYYYMMDD",
      );
      process.exit(1);
    }
    throw err;
  }

  console.log("\n── Result ───────────────────────────────────────────────────");
  console.log("Blob ID          :", blobId);
  console.log("Certificate ID   :", certId);
  console.log("Tx digest        :", digest);
  console.log("Suiscan          :", `https://suiscan.xyz/testnet/object/${certId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
