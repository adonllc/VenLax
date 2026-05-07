import { FastifyInstance } from "fastify";
import { adminLoginSchema, adminVerify2faSchema } from "./admin-auth.schema";
import { adminLogin, adminVerify2fa } from "./admin-auth.service";
import { authenticateAdmin } from "../../plugins/authenticate-admin";

export async function adminAuthRoutes(app: FastifyInstance) {
  app.post("/admin/auth/login", async (request, reply) => {
    const result = adminLoginSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      return reply.code(200).send(await adminLogin(result.data));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.post("/admin/auth/verify-2fa", async (request, reply) => {
    const result = adminVerify2faSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      return reply.code(200).send(await adminVerify2fa(result.data));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.post("/admin/auth/logout", { preHandler: [authenticateAdmin] }, async (_request, reply) => {
    return reply.code(200).send({ ok: true });
  });
}
