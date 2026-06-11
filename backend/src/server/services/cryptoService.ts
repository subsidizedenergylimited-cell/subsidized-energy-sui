import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX   = process.env.WALLET_ENCRYPTION_KEY ?? "";

function getKey(): Buffer {
  if (KEY_HEX.length !== 64) {
    throw new Error("WALLET_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(KEY_HEX, "hex");
}

/** AES-256-GCM encrypt. Returns `iv:authTag:ciphertext` (all hex). */
export function encrypt(plaintext: string): string {
  const iv         = randomBytes(12);
  const cipher     = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted  = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag    = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

/** Decrypt a value produced by encrypt(). */
export function decrypt(blob: string): string {
  const [ivHex, tagHex, ctHex] = blob.split(":");
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
