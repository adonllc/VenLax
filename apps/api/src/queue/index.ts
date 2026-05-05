import { Queue, QueueOptions } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const defaultOpts: Partial<QueueOptions> = {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 1000 } },
};

export const aiQueue = new Queue("ai-processing", defaultOpts);
export const notificationQueue = new Queue("notifications", defaultOpts);
export const settlementQueue = new Queue("settlement", defaultOpts);

export { connection as redisConnection };
