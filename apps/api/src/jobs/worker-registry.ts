import { settlementWorker } from "./settlement.worker";
import { aiWorker } from "./ai.worker";
import { insightWorker, scheduleInsightJobs } from "./insight.worker";
import { notificationsWorker } from "./notifications.worker";

export async function startWorkers(): Promise<void> {
  console.log("Workers started: settlement, ai, insight, notifications");

  await scheduleInsightJobs();

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
