import { Queue, Worker } from "bullmq";
import { redisConnection } from "../queue";
import { db } from "../db";
import { markets } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateAndStoreSignal, generateAndStoreMarket } from "../modules/ai/insight.service";

const insightQueue = new Queue("insight-generation", { connection: redisConnection });

export async function scheduleInsightJobs(): Promise<void> {
  await insightQueue.add(
    "generate-all-signals",
    {},
    {
      repeat: { every: 6 * 60 * 60 * 1000 },
      jobId: "insight-repeatable",
    }
  );
}

export const insightWorker = new Worker(
  "insight-generation",
  async () => {
    const openMarkets = await db.query.markets.findMany({
      where: eq(markets.status, "open"),
    });

    for (const market of openMarkets) {
      await generateAndStoreSignal(db, market.id);
    }

    await generateAndStoreMarket(db);

    return { processed: openMarkets.length };
  },
  { connection: redisConnection, concurrency: 1 }
);

insightWorker.on("failed", (job, err) => {
  console.error("Insight generation job failed:", err.message);
});
