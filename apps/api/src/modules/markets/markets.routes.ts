import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { createMarketSchema, changeStatusSchema } from "./markets.schema";
import { createMarket, listMarkets, getMarket, changeMarketStatus } from "./markets.service";
import { db } from "../../db";
import { markets } from "../../db/schema";
import { eq } from "drizzle-orm";
import { settlementQueue } from "../../queue";
import { getLatestSignal } from "../ai/insight.service";
import { db as dbInstance } from "../../db";

export async function marketRoutes(app: FastifyInstance) {
  app.get("/markets", async (request, reply) => {
    const { status } = request.query as { status?: string };
    const validStatuses = ["draft", "open", "closed", "resolved", "settled"];
    if (status && !validStatuses.includes(status)) {
      return reply.code(400).send({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }
    return reply.send({ markets: await listMarkets(status) });
  });

  app.get("/markets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const market = await getMarket(id);
    if (!market) return reply.code(404).send({ error: "Market not found" });
    return reply.send(market);
  });

  app.post("/markets", { preHandler: [authenticate] }, async (request, reply) => {
    const result = createMarketSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      const { sub } = request.user as { sub: string };
      const market = await createMarket({ ...result.data, creatorId: sub });
      return reply.code(201).send(market);
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.patch("/markets/:id/status", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = changeStatusSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const market = await changeMarketStatus(id, result.data.status);
    if (!market) return reply.code(404).send({ error: "Market not found" });
    return reply.send(market);
  });

  app.patch("/markets/:id/resolve", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { outcome } = request.body as { outcome: boolean };
    if (typeof outcome !== "boolean") return reply.code(400).send({ error: "outcome must be boolean" });

    const market = await getMarket(id);
    if (!market) return reply.code(404).send({ error: "Market not found" });

    const [resolved] = await db.update(markets)
      .set({ status: "resolved", resolvedOutcome: outcome, resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(markets.id, id))
      .returning();

    await settlementQueue.add("settle-market", { marketId: id }, { delay: 1000 });

    return reply.send(resolved);
  });

  app.get("/markets/:id/insight", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { tier } = request.user as { tier: string };
    if (tier === "free") {
      return reply.code(403).send({ error: "AI Insight Signals require a Pro or Elite subscription" });
    }
    const signal = await getLatestSignal(dbInstance, id);
    if (!signal) return reply.code(404).send({ error: "No insight signal available yet" });
    return reply.send({
      ...signal,
      keyFactors: JSON.parse(signal.keyFactors),
      sourceUrls: JSON.parse(signal.sourceUrls),
      disclaimer: "Not financial advice. For educational purposes only.",
    });
  });
}
