import { Worker } from "bullmq";
import { redisConnection } from "../queue";
import { db } from "../db";
import { processReviewScoring } from "../modules/ai/review-scorer";

export const aiWorker = new Worker(
  "ai-processing",
  async (job) => {
    const { reviewId, userId } = job.data as { reviewId: string; userId: string };
    await processReviewScoring(db, reviewId, userId);
    return { reviewId, processed: true };
  },
  { connection: redisConnection, concurrency: 10 }
);

aiWorker.on("failed", (job, err) => {
  console.error(`AI scoring job failed for review ${job?.data.reviewId}:`, err.message);
});
