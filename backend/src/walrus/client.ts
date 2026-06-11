// Walrus public testnet endpoints (verified June 2026).
// Publisher: accepts PUT /v1/blobs to store data.
// Aggregator: accepts GET /v1/blobs/<blobId> to retrieve data.
//
// NOTE: All Walrus blobs are PUBLIC and content-addressed.
// Solar production data is intentionally public for verifiability.
// Any future fields that must remain private (e.g. exact GPS coordinates,
// financial settlement details) must be encrypted BEFORE calling storeProof.
const PUBLISHER  = "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

export const WALRUS_URLS = { PUBLISHER, AGGREGATOR };

// Walrus returns one of two shapes depending on whether the blob already
// existed on the network when this store request arrived.
type NewlyCreated = {
  newlyCreated: {
    blobObject: { blobId: string; [k: string]: unknown };
    [k: string]: unknown;
  };
};
type AlreadyCertified = {
  alreadyCertified: {
    blobId: string;
    [k: string]: unknown;
  };
};
type StoreResponse = NewlyCreated | AlreadyCertified;

/**
 * Store a JSON object on Walrus testnet.
 * Returns the blobId — the permanent, content-addressed identifier.
 */
export async function storeProof(data: object, epochs = 3): Promise<string> {
  const body = JSON.stringify(data);
  const url  = `${PUBLISHER}/v1/blobs?epochs=${epochs}`;

  const res = await fetch(url, {
    method:  "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Walrus store failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as StoreResponse;

  if ("newlyCreated" in json) {
    return json.newlyCreated.blobObject.blobId;
  }
  if ("alreadyCertified" in json) {
    return json.alreadyCertified.blobId;
  }

  throw new Error(`Unexpected Walrus response shape: ${JSON.stringify(json)}`);
}

/**
 * Retrieve and parse a JSON blob from Walrus testnet by its blobId.
 */
export async function readProof(blobId: string): Promise<unknown> {
  const url = `${AGGREGATOR}/v1/blobs/${blobId}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Walrus read failed (${res.status}): ${text}`);
  }

  return res.json();
}
