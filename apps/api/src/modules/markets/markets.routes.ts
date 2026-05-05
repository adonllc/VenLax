import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { createMarketSchema, changeStatusSchema } from "./markets.schema";
import { createMarket, listMarkets, getMarket, changeMarketStatus } from "./markets.service";

export async function marketRoutes(app: FastifyInstance) {
  app.get("/markets", async (request, reply) => {
    const { status } = request.query as { status?: string };
    return reply.send(await listMarkets(status));
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
}
