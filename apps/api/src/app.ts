import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import { authRoutes } from "./modules/auth/auth.routes";
import { subscriptionRoutes } from "./modules/subscriptions/subscriptions.routes";
import { fpLedgerRoutes } from "./modules/fp-ledger/fp-ledger.routes";
import { marketRoutes } from "./modules/markets/markets.routes";
import { forecastRoutes } from "./modules/forecast/forecast.routes";
import { reviewRoutes } from "./modules/reviews/reviews.routes";
import { websocketPlugin } from "./plugins/websocket";
import { notificationRoutes } from "./modules/notifications/notifications.routes";
import { dailyLoginRoutes } from "./modules/auth/daily-login.routes";
import { adminAuthRoutes } from "./modules/admin-auth/admin-auth.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
import { socialRoutes } from "./modules/social/social.routes";
import { profileRoutes } from "./modules/profile/profile.routes";
import { leaderboardRoutes } from "./modules/leaderboard/leaderboard.routes";
import { gamificationRoutes } from "./modules/gamification/gamification.routes";
import { rewardsRoutes } from "./modules/rewards/rewards.routes";

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  await app.register(cors, { origin: true });

  await app.register(cookie);

  await app.register(websocketPlugin);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    redis: undefined, // set in production via opts
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes);

  await app.register(subscriptionRoutes);

  await app.register(fpLedgerRoutes);

  await app.register(marketRoutes);

  await app.register(forecastRoutes);

  await app.register(reviewRoutes);

  await app.register(notificationRoutes);

  await app.register(dailyLoginRoutes);

  await app.register(adminAuthRoutes);

  await app.register(adminRoutes);

  await app.register(socialRoutes);

  await app.register(profileRoutes);

  await app.register(leaderboardRoutes);

  await app.register(gamificationRoutes);

  await app.register(rewardsRoutes);

  return app;
}
