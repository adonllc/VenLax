import { Worker } from "bullmq";
import { redisConnection } from "../queue";
import { db } from "../db";
import { settleMarket } from "../modules/markets/settle.service";

export const settlementWorker = new Worker(
  "settlement",
  async (job) => {
    const { marketId } = job.data as { marketId: string };
    await settleMarket(db, marketId);
    return { marketId, settled: true };
  },
  { connection: redisConnection, concurrency: 5 }
);

settlementWorker.on("failed", (job, err) => {
  console.error(`Settlement job failed for market ${job?.data.marketId}:`, err.message);
});
