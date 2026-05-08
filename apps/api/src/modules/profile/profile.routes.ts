import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { getPublicProfile, updateOwnProfile } from "./profile.service";

export async function profileRoutes(app: FastifyInstance) {
  app.get("/profile/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return reply.send(await getPublicProfile(id));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.patch("/profile", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    const input = request.body as { username?: string; avatarUrl?: string };
    await updateOwnProfile(userId, input);
    return reply.send({ ok: true });
  });
}
