import { eq } from "drizzle-orm";
import { users, fpLedger } from "../../db/schema";
import type { DB } from "../../db";

const BASE_DAILY_FP = 100;
const STREAK_MULTIPLIERS: Record<number, number> = {
  1: 1.0, 2: 1.1, 3: 1.2, 4: 1.3, 5: 1.4, 6: 1.5, 7: 1.5,
};

function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  return STREAK_MULTIPLIERS[streak] ?? 1.5;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function claimDailyLogin(
  db: DB,
  userId: string
): Promise<{ fpGranted: number; streak: number; alreadyClaimed: false }> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw { statusCode: 404, message: "User not found" };

  const today = todayUTC();
  if (user.lastLoginDate === today) {
    throw { statusCode: 409, message: "Daily FP already claimed today" };
  }

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const newStreak = user.lastLoginDate === yesterdayStr ? user.loginStreak + 1 : 1;

  const streakMultiplier = getStreakMultiplier(newStreak);
  const fpGranted = Math.round(BASE_DAILY_FP * streakMultiplier);

  await db.update(users)
    .set({ loginStreak: newStreak, lastLoginDate: today })
    .where(eq(users.id, userId));

  await db.insert(fpLedger).values({
    userId,
    poolType: "bonus",
    amount: fpGranted,
    reason: "daily_login",
    expiresAt: new Date(Date.now() + 30 * 86400000),
  });

  return { fpGranted, streak: newStreak, alreadyClaimed: false };
}
