import "dotenv/config";
import { readCertificate } from "./sui/readCertificate";
import { readProof } from "./walrus/client";

const certId = process.argv[2];
const tamper  = process.argv.includes("--tamper");

if (!certId) {
  console.error("Usage: npm run verify -- <certificateObjectId> [--tamper]");
  process.exit(1);
}

interface WalrusReading {
  producer:       string;
  production_day: number;
  watt_hours:     number;
  [key: string]:  unknown;
}

async function main() {
  // ── 1. Read the on-chain certificate ───────────────────────────────────────
  console.log("Fetching certificate from Sui testnet…");
  const cert = await readCertificate(certId);

  // ── 2. Fetch the Walrus reading using the blob ID carried by the cert ───────
  // The blob ID is discovered from the certificate itself — no external input.
  console.log(`Fetching Walrus blob ${cert.walrus_blob_id}…\n`);
  const raw     = await readProof(cert.walrus_blob_id);
  let reading   = raw as WalrusReading;

  // ── 3. Optional tamper: mutate the local copy to demo the MISMATCH path ─────
  if (tamper) {
    reading = { ...reading, watt_hours: reading.watt_hours + 9999 };
    console.log("⚠️  --tamper active: watt_hours inflated by 9999 locally\n");
  }

  // ── 4. Report ───────────────────────────────────────────────────────────────
  const mintedDate = new Date(cert.minted_at).toISOString();

  console.log("┌─ On-chain claim (Sui certificate) ──────────────────────────");
  console.log(`│  Object ID      : ${cert.objectId}`);
  console.log(`│  Walrus blob ID : ${cert.walrus_blob_id}`);
  console.log(`│  Producer       : ${cert.producer}`);
  console.log(`│  Production day : ${cert.production_day}`);
  console.log(`│  Watt-hours     : ${cert.watt_hours} Wh`);
  console.log(`│  Minted at      : ${mintedDate}`);
  console.log("│");
  console.log("├─ Walrus original (blob content) ────────────────────────────");
  console.log(`│  Producer       : ${reading.producer}`);
  console.log(`│  Production day : ${reading.production_day}`);
  console.log(`│  Watt-hours     : ${reading.watt_hours} Wh`);
  console.log("│");

  const producerMatch   = cert.producer       === reading.producer;
  const dayMatch        = cert.production_day === reading.production_day;
  const wattHoursMatch  = cert.watt_hours     === reading.watt_hours;
  const allMatch        = producerMatch && dayMatch && wattHoursMatch;

  if (allMatch) {
    console.log(`└─ Verdict: ✅  MATCH — certificate ${cert.objectId} is valid`);
  } else {
    console.log("└─ Verdict: ❌  MISMATCH — fields that differ:");
    if (!producerMatch)  console.log(`   producer       chain=${cert.producer} walrus=${reading.producer}`);
    if (!dayMatch)       console.log(`   production_day chain=${cert.production_day} walrus=${reading.production_day}`);
    if (!wattHoursMatch) console.log(`   watt_hours     chain=${cert.watt_hours} walrus=${reading.watt_hours}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
