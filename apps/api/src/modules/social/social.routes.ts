import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { followUser, unfollowUser, getFollowers, getFollowing } from "./social.service";

export async function socialRoutes(app: FastifyInstance) {
  app.post("/users/:id/follow", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const followerId = (request as any).user.sub;
    try {
      await followUser(followerId, id);
      return reply.send({ ok: true });
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.delete("/users/:id/follow", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const followerId = (request as any).user.sub;
    await unfollowUser(followerId, id);
    return reply.send({ ok: true });
  });

  app.get("/users/:id/followers", async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await getFollowers(id));
  });

  app.get("/users/:id/following", async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await getFollowing(id));
  });
}
