import { Worker } from "bullmq";
import { redisConnection } from "../queue";
import { deliverPush, PushPayload } from "../modules/notifications/notifications.service";

export const notificationsWorker = new Worker(
  "notifications",
  async (job) => {
    const payload = job.data as PushPayload;
    await deliverPush(payload);
    return { userId: payload.userId, delivered: true };
  },
  { connection: redisConnection, concurrency: 20 }
);

notificationsWorker.on("failed", (job, err) => {
  console.error(`Push notification failed for user ${job?.data.userId}:`, err.message);
});
