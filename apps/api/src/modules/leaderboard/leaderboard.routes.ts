import { FastifyInstance } from "fastify";
import { getLeaderboard } from "./leaderboard.service";

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get("/leaderboard", async (request, reply) => {
    const { category, limit } = request.query as { category?: string; limit?: string };
    return reply.send(await getLeaderboard({ category, limit: limit ? Number(limit) : undefined }));
  });
}
