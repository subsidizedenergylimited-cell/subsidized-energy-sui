import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { prisma } from "../services/userService";

export const certificatesRouter = Router();
certificatesRouter.use(authenticate);

certificatesRouter.get("/", async (req: Request, res: Response) => {
  const certs = await prisma.certificate.findMany({
    where:   { userId: req.auth!.userId },
    orderBy: { productionDay: "desc" },
    select: {
      id:            true,
      productionDay: true,
      wattHours:     true,
      walrusBlobId:  true,
      certObjectId:  true,
      txDigest:      true,
      mintedAt:      true,
      inverter: { select: { brand: true, label: true } },
    },
  });
  res.json(certs);
});
