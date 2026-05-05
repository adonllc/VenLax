import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { FastifyInstance } from "fastify";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const hashBuf = Buffer.from(hash, "hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuf, derived);
}

export async function registerUser(
  app: FastifyInstance,
  input: { email: string; username: string; password: string }
) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });
  if (existing) throw { statusCode: 409, message: "Email already registered" };

  const passwordHash = await hashPassword(input.password);

  const [user] = await db.insert(users).values({
    email: input.email.toLowerCase(),
    username: input.username,
    passwordHash,
  }).returning({ id: users.id, email: users.email, subscriptionTier: users.subscriptionTier });

  const token = app.jwt.sign({
    sub: user.id,
    email: user.email,
    tier: user.subscriptionTier,
  }, { expiresIn: "15m" });

  return { token, user: { id: user.id, email: user.email, tier: user.subscriptionTier } };
}

export async function loginUser(
  app: FastifyInstance,
  input: { email: string; password: string }
) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });
  if (!user || !user.passwordHash) throw { statusCode: 401, message: "Invalid credentials" };

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw { statusCode: 401, message: "Invalid credentials" };

  const token = app.jwt.sign({
    sub: user.id,
    email: user.email,
    tier: user.subscriptionTier,
  }, { expiresIn: "15m" });

  return { token };
}
