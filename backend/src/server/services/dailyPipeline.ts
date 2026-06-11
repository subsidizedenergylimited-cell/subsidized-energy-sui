import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "./cryptoService";
import { getAdapter } from "../inverters/registry";
import { storeProof } from "../../walrus/client";
import { mintCertificate } from "../../sui/mintCertificate";

const prisma = new PrismaClient();

/** Returns today as YYYYMMDD integer in UTC. */
export function todayUTC(): number {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return Number(`${y}${m}${day}`);
}

export interface InverterResult {
  inverterId:   string;
  inverterLabel: string;
  skipped:      boolean;
  skipReason?:  string;
  certObjectId?: string;
  blobId?:      string;
  txDigest?:    string;
  wattHours?:   number;
  error?:       string;
}

/** Run the mint pipeline for one inverter. Returns a structured result. */
async function processInverter(
  inverterId: string,
  productionDay: number,
): Promise<InverterResult> {
  const inverter = await prisma.inverter.findUniqueOrThrow({
    where:   { id: inverterId },
    include: { user: true },
  });

  const base = { inverterId, inverterLabel: inverter.label };

  // ── DB-level idempotency: skip if already minted today for this user ────────
  const existing = await prisma.certificate.findUnique({
    where: { userId_productionDay: { userId: inverter.userId, productionDay } },
  });
  if (existing) {
    return {
      ...base,
      skipped:    true,
      skipReason: `Certificate already exists for user ${inverter.userId} on day ${productionDay}`,
      certObjectId: existing.certObjectId,
      blobId:       existing.walrusBlobId,
    };
  }

  // ── Decrypt inverter credentials ────────────────────────────────────────────
  const credentials = JSON.parse(decrypt(inverter.encryptedCredentials)) as Record<string, string>;
  const adapter     = getAdapter(inverter.brand);

  // ── Read production from inverter API ───────────────────────────────────────
  const wattHours = await adapter.readProduction(credentials, productionDay);

  if (wattHours <= 0) {
    return { ...base, skipped: true, skipReason: `No production recorded (${wattHours} Wh)` };
  }

  // ── Build reading payload and store on Walrus ────────────────────────────────
  const reading = {
    producer:       inverter.user.suiAddress,
    production_day: productionDay,
    watt_hours:     wattHours,
    inverter: {
      id:    inverter.id,
      brand: inverter.brand,
      label: inverter.label,
    },
  };

  const blobId = await storeProof(reading);

  // ── Mint $SUB certificate on Sui ────────────────────────────────────────────
  const { certificateId: certObjectId, digest: txDigest } = await mintCertificate({
    producer:     inverter.user.suiAddress,
    wattHours,
    productionDay,
    walrusBlobId: blobId,
  });

  // ── Persist Certificate record ───────────────────────────────────────────────
  await prisma.certificate.create({
    data: {
      userId:        inverter.userId,
      inverterId:    inverter.id,
      productionDay,
      wattHours,
      walrusBlobId:  blobId,
      certObjectId,
      txDigest,
    },
  });

  return { ...base, skipped: false, certObjectId, blobId, txDigest, wattHours };
}

/**
 * Run the daily certificate pipeline across ALL active inverters.
 * Each inverter is processed independently — one failure never blocks the rest.
 */
export async function runDailyPipeline(
  productionDay: number = todayUTC(),
): Promise<InverterResult[]> {
  const inverters = await prisma.inverter.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  console.log(
    `[pipeline] Starting daily run for ${productionDay} — ${inverters.length} active inverter(s)`,
  );

  const results: InverterResult[] = [];

  for (const { id } of inverters) {
    try {
      const result = await processInverter(id, productionDay);
      results.push(result);
      if (result.skipped) {
        console.log(`[pipeline] SKIP  ${result.inverterLabel}: ${result.skipReason}`);
      } else {
        console.log(
          `[pipeline] MINT  ${result.inverterLabel}: ${result.wattHours} Wh` +
          ` | cert=${result.certObjectId?.slice(0, 12)}… | blob=${result.blobId?.slice(0, 12)}…`,
        );
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[pipeline] ERROR ${id}: ${error}`);
      results.push({ inverterId: id, inverterLabel: id, skipped: false, error });
    }
  }

  console.log(`[pipeline] Done — ${results.filter(r => !r.skipped && !r.error).length} minted`);
  return results;
}
