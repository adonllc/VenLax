import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { db } from "../../db";
import { claimDailyLogin } from "./daily-login.service";

export async function dailyLoginRoutes(app: FastifyInstance) {
  app.post("/auth/daily-login", { preHandler: [authenticate] }, async (request, reply) => {
    const { sub } = request.user as { sub: string };
    try {
      const result = await claimDailyLogin(db, sub);
      return reply.send(result);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
