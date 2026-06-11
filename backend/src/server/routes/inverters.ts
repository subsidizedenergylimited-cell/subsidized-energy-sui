import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { getAdapter, SUPPORTED_BRANDS } from "../inverters/registry";
import { encrypt } from "../services/cryptoService";
import { prisma } from "../services/userService";

export const invertersRouter = Router();

invertersRouter.use(authenticate);

const INVERTER_BONUS_SRE = 3;

const ConnectBody = z.object({
  brand:       z.string().min(1),
  credentials: z.record(z.string(), z.string()),
});

// ── POST /inverters/connect ───────────────────────────────────────────────────

invertersRouter.post("/connect", async (req: Request, res: Response) => {
  const parsed = ConnectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { brand, credentials } = parsed.data;
  const userId = req.auth!.userId;

  let adapter;
  try {
    adapter = getAdapter(brand);
  } catch (e) {
    res.status(400).json({
      error: (e as Error).message,
      supportedBrands: SUPPORTED_BRANDS,
    });
    return;
  }

  // Validate credentials against the brand's API before persisting anything.
  let label: string;
  try {
    label = await adapter.validateCredentials(credentials);
  } catch (e) {
    res.status(422).json({ error: `Inverter validation failed: ${(e as Error).message}` });
    return;
  }

  const encryptedCredentials = encrypt(JSON.stringify(credentials));

  // Fetch user to check whether the one-time bonus has already been awarded.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const [inverter] = await prisma.$transaction([
    prisma.inverter.create({
      data: { userId, brand: brand.toLowerCase(), label, encryptedCredentials },
    }),
    // Award 3 SRE points exactly once per user, regardless of how many
    // inverters they connect. hasInverterBonus acts as a consumed-flag.
    ...(!user.hasInverterBonus
      ? [
          prisma.user.update({
            where: { id: userId },
            data:  { srePoints: { increment: INVERTER_BONUS_SRE }, hasInverterBonus: true },
          }),
        ]
      : []),
  ]);

  const bonusAwarded = !user.hasInverterBonus;

  res.status(201).json({
    id:           inverter.id,
    brand:        inverter.brand,
    label:        inverter.label,
    status:       inverter.status,
    createdAt:    inverter.createdAt,
    bonusAwarded,
    srePointsAwarded: bonusAwarded ? INVERTER_BONUS_SRE : 0,
  });
});

// ── GET /inverters ────────────────────────────────────────────────────────────

invertersRouter.get("/", async (req: Request, res: Response) => {
  const userId   = req.auth!.userId;
  const inverters = await prisma.inverter.findMany({
    where:   { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id:        true,
      brand:     true,
      label:     true,
      status:    true,
      createdAt: true,
      // encryptedCredentials intentionally excluded
    },
  });
  res.json(inverters);
});
