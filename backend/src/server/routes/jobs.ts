import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { runDailyPipeline, todayUTC } from "../services/dailyPipeline";

export const jobsRouter = Router();
jobsRouter.use(authenticate);

const TriggerBody = z.object({
  productionDay: z.number().int().optional(), // override for testing, defaults to today
});

/**
 * POST /jobs/run-daily
 * Manual trigger for the daily certificate pipeline. JWT-gated (dev/admin use).
 * Runs synchronously and returns per-inverter results.
 */
jobsRouter.post("/run-daily", async (req: Request, res: Response) => {
  const parsed = TriggerBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const productionDay = parsed.data.productionDay ?? todayUTC();
  const results = await runDailyPipeline(productionDay);
  res.json({ productionDay, results });
});
