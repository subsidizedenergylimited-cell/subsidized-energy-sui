import { storeProof, readProof, WALRUS_URLS } from "./walrus/client";
import { sampleReading } from "./walrus/sampleReading";

async function main() {
  console.log("Publisher :", WALRUS_URLS.PUBLISHER);
  console.log("Aggregator:", WALRUS_URLS.AGGREGATOR);
  console.log();

  console.log("Storing reading on Walrus...");
  const blobId = await storeProof(sampleReading);
  console.log("Blob ID   :", blobId);
  console.log();

  console.log("Reading back blob...");
  const retrieved = await readProof(blobId);

  const original   = JSON.stringify(sampleReading);
  const roundTrip  = JSON.stringify(retrieved);

  if (original !== roundTrip) {
    console.error("MISMATCH");
    console.error("Original :", original);
    console.error("Retrieved:", roundTrip);
    process.exit(1);
  }

  console.log(`VERIFIED: blob ${blobId} matches original reading`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
