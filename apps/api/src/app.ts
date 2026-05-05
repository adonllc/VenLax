import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import { authRoutes } from "./modules/auth/auth.routes";

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  await app.register(cors, { origin: true });

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

  return app;
}
