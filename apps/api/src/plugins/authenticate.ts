import { FastifyRequest, FastifyReply } from "fastify";

export interface AuthPayload {
  sub: string; // user ID
  email: string;
  tier: "free" | "pro" | "elite";
  iat: number;
  exp: number;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify<AuthPayload>();
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}
