import { db } from "../../db";
import { adminUsers } from "../../db/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { authenticator } from "otplib";
import jwt from "jsonwebtoken";

const scryptAsync = promisify(scrypt);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "admin-dev-secret-change-in-production";

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

export async function adminLogin(input: { email: string; password: string }) {
  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, input.email.toLowerCase()),
  });
  if (!admin) throw { statusCode: 401, message: "Invalid credentials" };

  const valid = await verifyPassword(input.password, admin.passwordHash);
  if (!valid) throw { statusCode: 401, message: "Invalid credentials" };

  // Partial token — only valid for the 2FA step (5 minutes)
  const partialToken = jwt.sign(
    { adminId: admin.id, step: "2fa" },
    ADMIN_JWT_SECRET,
    { expiresIn: "5m" }
  );

  return { partialToken };
}

export async function adminVerify2fa(input: { partialToken: string; totpCode: string }) {
  let payload: { adminId: string; step: string };
  try {
    payload = jwt.verify(input.partialToken, ADMIN_JWT_SECRET) as { adminId: string; step: string };
  } catch {
    throw { statusCode: 401, message: "Partial token invalid or expired" };
  }
  if (payload.step !== "2fa") throw { statusCode: 401, message: "Invalid token" };

  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, payload.adminId),
  });
  if (!admin || !admin.totpSecret) throw { statusCode: 401, message: "2FA not configured" };

  const isValid = authenticator.verify({ token: input.totpCode, secret: admin.totpSecret });
  if (!isValid) throw { statusCode: 401, message: "Invalid 2FA code" };

  const token = jwt.sign(
    { adminId: admin.id, email: admin.email, role: admin.role },
    ADMIN_JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, admin: { id: admin.id, email: admin.email, role: admin.role } };
}

export async function seedAdmin(email: string, password: string): Promise<string> {
  const existing = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
  if (existing) return existing.totpSecret ?? "already-seeded";

  const passwordHash = await hashPassword(password);
  const totpSecret = authenticator.generateSecret();

  await db.insert(adminUsers).values({ email, passwordHash, totpSecret, role: "superadmin" });

  return totpSecret;
}
