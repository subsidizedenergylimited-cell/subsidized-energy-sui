import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { encrypt } from "./cryptoService";

export const prisma = new PrismaClient();

/** Create a custodial user: generate a fresh Sui keypair, encrypt the private key. */
export async function createCustodialUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);

  const keypair    = Ed25519Keypair.generate();
  const suiAddress = keypair.getPublicKey().toSuiAddress();
  // getSecretKey() returns the raw 32-byte private key as a Uint8Array.
  // We hex-encode then AES-256-GCM encrypt it before persisting.
  const rawKey     = Buffer.from(keypair.getSecretKey()).toString("hex");
  const encryptedPrivateKey = encrypt(rawKey);

  return prisma.user.create({
    data: { email, passwordHash, suiAddress, encryptedPrivateKey, custodial: true },
  });
}

/** Find a custodial user by email and validate password. Returns null on mismatch. */
export async function findUserByEmailPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

/** Find or create a non-custodial user record after wallet signature is verified. */
export async function upsertWalletUser(suiAddress: string) {
  return prisma.user.upsert({
    where:  { suiAddress },
    update: {},
    create: { suiAddress, custodial: false },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
