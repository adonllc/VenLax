import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "admin-dev-secret-change-in-production";

export interface AdminUser {
  adminId: string;
  email: string;
  role: "admin" | "superadmin";
}

export async function getAdminToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value ?? null;
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminUser;
  } catch {
    return null;
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const token = await getAdminToken();
  if (!token) return null;
  return verifyAdminToken(token);
}
