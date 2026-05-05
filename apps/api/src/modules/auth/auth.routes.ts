import { FastifyInstance } from "fastify";
import { registerSchema, loginSchema } from "./auth.schema";
import { registerUser, loginUser } from "./auth.service";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const result = registerSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      const data = await registerUser(app, result.data);
      return reply.code(201).send(data);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      const data = await loginUser(app, result.data);
      return reply.code(200).send(data);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
