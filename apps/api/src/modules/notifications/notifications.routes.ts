import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { z } from "zod";
import { registerToken } from "./notifications.service";

const registerTokenSchema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(["ios", "android"]),
});

export async function notificationRoutes(app: FastifyInstance) {
  app.post("/notifications/register-token", { preHandler: [authenticate] }, async (request, reply) => {
    const result = registerTokenSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const { sub } = request.user as { sub: string };
    await registerToken(sub, result.data.token, result.data.platform);
    return reply.code(201).send({ registered: true });
  });
}
