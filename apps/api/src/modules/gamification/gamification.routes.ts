import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { getBadges, getTodayMissions, completeMission, getXP } from "./gamification.service";

export async function gamificationRoutes(app: FastifyInstance) {
  app.get("/badges", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    return reply.send(await getBadges(userId));
  });

  app.get("/missions/today", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    return reply.send(await getTodayMissions(userId));
  });

  app.post("/missions/:id/complete", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    const { id } = request.params as { id: string };
    try {
      return reply.send(await completeMission(userId, id));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.get("/users/:id/xp", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return reply.send(await getXP(id));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
