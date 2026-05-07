import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export interface AdminPayload {
  adminId: string;
  email: string;
  role: "admin" | "superadmin";
}

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "admin-dev-secret-change-in-production";

export function verifyAdminToken(token: string): AdminPayload {
  return jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;
}

export function signAdminToken(payload: AdminPayload, expiresIn = "8h"): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn });
}

export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
  try {
    const payload = verifyAdminToken(token);
    if ((payload as any).step === "2fa") {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    (request as any).adminUser = payload;
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}
