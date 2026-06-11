import "dotenv/config";
import cron from "node-cron";
import { app } from "./app";
import { runDailyPipeline } from "./services/dailyPipeline";

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Subsidized Energy API listening on http://localhost:${PORT}`);
});

// Run the certificate pipeline once a day at 23:30 UTC — after inverters have
// had the full day to record end-of-day cumulative production figures.
cron.schedule("30 23 * * *", () => {
  console.log("[cron] Triggering daily certificate pipeline…");
  runDailyPipeline().catch((err) =>
    console.error("[cron] Pipeline error:", err),
  );
}, { timezone: "UTC" });

console.log("[cron] Daily pipeline scheduled for 23:30 UTC");
