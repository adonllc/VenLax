import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { getPublicProfile, updateOwnProfile, updateUserTheme } from "./profile.service";

export async function profileRoutes(app: FastifyInstance) {
  app.get("/profile/me", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    try {
      return reply.send(await getPublicProfile(userId, userId));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

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

  app.patch("/profile/theme", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    const { theme } = request.body as { theme: string };
    if (theme !== "dark" && theme !== "light") {
      return reply.code(400).send({ error: "theme must be 'dark' or 'light'" });
    }
    await updateUserTheme(userId, theme);
    return reply.send({ ok: true, theme });
  });
}
