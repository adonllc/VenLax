import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { getCatalog, redeemReward, getRedemptionHistory } from "./rewards.service";
import { z } from "zod";

const redeemSchema = z.object({ catalogItemId: z.string().uuid() });

export async function rewardsRoutes(app: FastifyInstance) {
  app.get("/rewards/catalog", async (_request, reply) => {
    return reply.send(await getCatalog());
  });

  app.post("/rewards/redeem", { preHandler: [authenticate] }, async (request, reply) => {
    const result = redeemSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const userId = (request as any).user.sub;
    try {
      return reply.code(201).send(await redeemReward(userId, result.data.catalogItemId));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.get("/rewards/history", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    return reply.send(await getRedemptionHistory(userId));
  });
}
