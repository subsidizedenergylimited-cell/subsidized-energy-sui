import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { z } from "zod";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import {
  createCustodialUser,
  findUserByEmailPassword,
  upsertWalletUser,
  prisma,
} from "../services/userService";

export const authRouter = Router();

const JWT_SECRET  = () => process.env.JWT_SECRET!;
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function issueJwt(userId: string, suiAddress: string) {
  return jwt.sign({ userId, suiAddress }, JWT_SECRET(), { expiresIn: "7d" });
}

// ── Email / password ──────────────────────────────────────────────────────────

const RegisterBody = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

authRouter.post("/register", async (req: Request, res: Response) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const user  = await createCustodialUser(email, password);
  const token = issueJwt(user.id, user.suiAddress);

  res.status(201).json({ token, suiAddress: user.suiAddress, custodial: true });
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;

  const user = await findUserByEmailPassword(email, password);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = issueJwt(user.id, user.suiAddress);
  res.json({ token, suiAddress: user.suiAddress, custodial: user.custodial });
});

// ── Wallet auth ───────────────────────────────────────────────────────────────

const NonceBody = z.object({ address: z.string().min(1) });

// Step 1: client asks for a nonce to sign.
authRouter.post("/wallet/nonce", async (req: Request, res: Response) => {
  const parsed = NonceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { address } = parsed.data;
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.walletNonce.upsert({
    where:  { address },
    update: { nonce, expiresAt },
    create: { address, nonce, expiresAt },
  });

  // The message the client must sign with their Sui wallet.
  const message = `Sign in to Subsidized Energy\nNonce: ${nonce}`;
  res.json({ message });
});

const VerifyBody = z.object({
  address:   z.string().min(1),
  message:   z.string().min(1),
  signature: z.string().min(1), // base64 serialized Sui signature
});

// Step 2: client returns the message + signature; backend verifies and issues JWT.
authRouter.post("/wallet/verify", async (req: Request, res: Response) => {
  const parsed = VerifyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { address, message, signature } = parsed.data;

  // Look up the stored nonce and check expiry.
  const stored = await prisma.walletNonce.findUnique({ where: { address } });
  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: "Nonce not found or expired — request a new one" });
    return;
  }

  // The signed message must contain the stored nonce to prevent replay.
  if (!message.includes(stored.nonce)) {
    res.status(401).json({ error: "Message does not match issued nonce" });
    return;
  }

  // Verify the Sui personal message signature and recover the signer address.
  let signerAddress: string;
  try {
    const pk = await verifyPersonalMessageSignature(
      new TextEncoder().encode(message),
      signature,
    );
    signerAddress = pk.toSuiAddress();
  } catch (e) {
    res.status(401).json({ error: "Signature verification failed" });
    return;
  }

  if (signerAddress !== address) {
    res.status(401).json({ error: "Signature address mismatch" });
    return;
  }

  // Consume the nonce so it can't be reused.
  await prisma.walletNonce.delete({ where: { address } });

  const user  = await upsertWalletUser(address);
  const token = issueJwt(user.id, user.suiAddress);
  res.json({ token, suiAddress: user.suiAddress, custodial: false });
});
