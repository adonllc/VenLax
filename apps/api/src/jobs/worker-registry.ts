import { settlementWorker } from "./settlement.worker";
import { aiWorker } from "./ai.worker";
import { insightWorker, scheduleInsightJobs } from "./insight.worker";
import { notificationsWorker } from "./notifications.worker";
import { generateAndStoreMarket } from "../modules/ai/insight.service";
import { db } from "../db";

export async function startWorkers(): Promise<void> {
  console.log("Workers started: settlement, ai, insight, notifications");

  await scheduleInsightJobs();

  // Directly generate a market on startup — doesn't rely on BullMQ queue
  generateAndStoreMarket(db).catch((err) =>
    console.error("[startup] generateAndStoreMarket failed:", err.message)
  );

  process.on("SIGTERM", async () => {
    await Promise.allSettled([
      settlementWorker.close(),
      aiWorker.close(),
      insightWorker.close(),
      notificationsWorker.close(),
    ]);
    process.exit(0);
  });
}
