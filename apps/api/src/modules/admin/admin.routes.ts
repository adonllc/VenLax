import { FastifyInstance } from "fastify";
import { authenticateAdmin, AdminPayload } from "../../plugins/authenticate-admin";
import {
  listUsers,
  getUserDetail,
  suspendUser,
  listMarkets,
  getMarketDetail,
  createMarket,
  resolveMarket,
  adjustFP,
  getReviewQueue,
  moderateReview,
  getAnalytics,
} from "./admin.service";
import { z } from "zod";

const createMarketSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(["sports", "politics", "open"]),
  closesAt: z.string().datetime(),
  resolvesAt: z.string().datetime(),
  resolutionCriteria: z.string().min(10),
  resolutionSource: z.string().min(5),
});

const fpAdjustSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be 0"),
  poolType: z.enum(["bonus", "achievement"]),
  reason: z.string().min(10),
});

const moderateSchema = z.object({
  action: z.enum(["approved", "rejected"]),
});

const suspendSchema = z.object({ suspend: z.boolean() });
const resolveSchema = z.object({ outcome: z.enum(["yes", "no"]) });

export async function adminRoutes(app: FastifyInstance) {
  const preHandler = [authenticateAdmin];

  // ── Users ─────────────────────────────────────────────────────────────────

  app.get("/admin/users", { preHandler }, async (request, reply) => {
    const { page = "1", search, tier, status } = request.query as any;
    return reply.send(await listUsers({ page: Number(page), search, tier, status }));
  });

  app.get("/admin/users/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return reply.send(await getUserDetail(id));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.patch("/admin/users/:id/suspend", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = suspendSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    await suspendUser(id, result.data.suspend);
    return reply.send({ ok: true });
  });

  // ── Markets ───────────────────────────────────────────────────────────────

  app.get("/admin/markets", { preHandler }, async (request, reply) => {
    const { page = "1", status, category } = request.query as any;
    return reply.send(await listMarkets({ page: Number(page), status, category }));
  });

  app.get("/admin/markets/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return reply.send(await getMarketDetail(id));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.post("/admin/markets", { preHandler }, async (request, reply) => {
    const result = createMarketSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      return reply.code(201).send(await createMarket(result.data));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.patch("/admin/markets/:id/resolve", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = resolveSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    await resolveMarket(id, result.data.outcome);
    return reply.send({ ok: true });
  });

  // ── FP Adjustments ────────────────────────────────────────────────────────

  app.post("/admin/fp/adjust", { preHandler }, async (request, reply) => {
    const result = fpAdjustSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const adminUser = (request as any).adminUser as AdminPayload;
    try {
      await adjustFP({ ...result.data, adminId: adminUser.adminId });
      return reply.send({ ok: true });
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  // ── Review Moderation ─────────────────────────────────────────────────────

  app.get("/admin/reviews/queue", { preHandler }, async (request, reply) => {
    const { page = "1" } = request.query as any;
    return reply.send(await getReviewQueue(Number(page)));
  });

  app.patch("/admin/reviews/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = moderateSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    await moderateReview(id, result.data.action);
    return reply.send({ ok: true });
  });

  // ── Analytics ─────────────────────────────────────────────────────────────

  app.get("/admin/analytics", { preHandler }, async (_request, reply) => {
    return reply.send(await getAnalytics());
  });
}
