'use client';

import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

const PACKAGE   = '0x62163791a217539103b137252c5d454a0af72a43d5c49561125907ddb8ed04f7';
const CERT_TYPE = `${PACKAGE}::sub::SubCertificate`;
const FULLNODE  = 'https://fullnode.testnet.sui.io:443';
const WALRUS    = 'https://aggregator.walrus-testnet.walrus.space';

export interface OnChainClaim {
  certObjectId: string;
  producer: string;
  wattHours: number;
  productionDay: number;
  walrusBlobId: string;
  mintedAtMs: number;
}

export interface WalrusReading {
  producer: string;
  wattHours: number;
  productionDay: number;
  raw: Record<string, unknown>;
}

export type VerifyOutcome =
  | { status: 'MATCH';            claim: OnChainClaim; walrus: WalrusReading }
  | { status: 'MISMATCH';         claim: OnChainClaim; walrus: WalrusReading; diffs: string[] }
  | { status: 'NOT_FOUND';        message: string }
  | { status: 'BLOB_UNAVAILABLE'; claim: OnChainClaim; message: string }
  | { status: 'ERROR';            message: string };

export async function verifyCertificate(certId: string): Promise<VerifyOutcome> {
  // ── 1. Fetch on-chain object ─────────────────────────────────────────────
  let claim: OnChainClaim;
  try {
    const client = new SuiJsonRpcClient({ url: FULLNODE, network: 'testnet' });
    const obj    = await client.getObject({ id: certId, options: { showContent: true } });

    if (!obj.data) {
      return {
        status: 'NOT_FOUND',
        message: `Object ${certId} was not found on Sui testnet.`,
      };
    }

    const content = obj.data.content;
    if (!content || content.dataType !== 'moveObject') {
      return {
        status: 'NOT_FOUND',
        message: 'Object exists but has no move content (may have been deleted).',
      };
    }
    if (content.type !== CERT_TYPE) {
      return {
        status: 'NOT_FOUND',
        message: `Object is not a SubCertificate.\nActual type: ${content.type}`,
      };
    }

    const f = content.fields as Record<string, unknown>;
    claim = {
      certObjectId:  certId,
      producer:      String(f['producer']       ?? ''),
      wattHours:     Number(f['watt_hours']      ?? 0),
      productionDay: Number(f['production_day']  ?? 0),
      walrusBlobId:  String(f['walrus_blob_id']  ?? ''),
      mintedAtMs:    Number(f['minted_at']       ?? 0),
    };
  } catch (err) {
    return {
      status: 'ERROR',
      message: `Sui RPC error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // ── 2. Fetch Walrus blob ──────────────────────────────────────────────────
  let walrus: WalrusReading;
  try {
    const res = await fetch(`${WALRUS}/v1/blobs/${claim.walrusBlobId}`);

    if (res.status === 404 || res.status === 410) {
      return {
        status: 'BLOB_UNAVAILABLE',
        claim,
        message: `Walrus blob "${claim.walrusBlobId}" is no longer available (HTTP ${res.status}). The blob epoch may have expired.`,
      };
    }
    if (!res.ok) {
      return {
        status: 'BLOB_UNAVAILABLE',
        claim,
        message: `Walrus aggregator returned HTTP ${res.status}.`,
      };
    }

    const raw = await res.json() as Record<string, unknown>;
    walrus = {
      producer:      String(raw['producer']       ?? ''),
      wattHours:     Number(raw['watt_hours']     ?? 0),
      productionDay: Number(raw['production_day'] ?? 0),
      raw,
    };
  } catch (err) {
    return {
      status: 'ERROR',
      message: `Walrus fetch error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // ── 3. Compare ─────────────────────────────────────────────────────────────
  const diffs: string[] = [];
  if (claim.wattHours !== walrus.wattHours)
    diffs.push('watt_hours');
  if (claim.producer.toLowerCase() !== walrus.producer.toLowerCase())
    diffs.push('producer');
  if (claim.productionDay !== walrus.productionDay)
    diffs.push('production_day');

  return diffs.length > 0
    ? { status: 'MISMATCH', claim, walrus, diffs }
    : { status: 'MATCH',    claim, walrus };
}
