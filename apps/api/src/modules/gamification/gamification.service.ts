import { db } from "../../db";
import { userBadges, missions, userMissions, users, fpLedger } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const BADGE_DEFINITIONS = [
  { id: "first_forecast", title: "First Forecast", description: "Made your first forecast", iconUrl: null },
  { id: "streak_7", title: "Week Streak", description: "7-day login streak", iconUrl: null },
  { id: "streak_30", title: "Month Streak", description: "30-day login streak", iconUrl: null },
  { id: "accurate_10", title: "Sharp Eye", description: "10 accurate forecasts", iconUrl: null },
  { id: "reviewer", title: "Reviewer", description: "Submitted your first review", iconUrl: null },
  { id: "top_100", title: "Top 100", description: "Ranked in top 100 on leaderboard", iconUrl: null },
] as const;

export async function getBadges(userId: string) {
  const earned = await db.select({ badgeId: userBadges.badgeId, earnedAt: userBadges.earnedAt })
    .from(userBadges).where(eq(userBadges.userId, userId));
  const earnedSet = new Set(earned.map((b) => b.badgeId));
  return BADGE_DEFINITIONS.map((def) => ({
    ...def,
    earned: earnedSet.has(def.id),
    earnedAt: earned.find((b) => b.badgeId === def.id)?.earnedAt ?? null,
  }));
}

export async function getTodayMissions(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const all = await db.select().from(missions).where(eq(missions.isActive, true)).limit(3);
  const completions = await db.select({ missionId: userMissions.missionId })
    .from(userMissions)
    .where(and(eq(userMissions.userId, userId), eq(userMissions.date, today)));
  const completedSet = new Set(completions.map((c) => c.missionId));
  return all.map((m) => ({ ...m, completed: completedSet.has(m.id) }));
}

export async function completeMission(userId: string, missionId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [mission] = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
  if (!mission) throw { statusCode: 404, message: "Mission not found" };

  const [existing] = await db.select()
    .from(userMissions)
    .where(and(eq(userMissions.userId, userId), eq(userMissions.missionId, missionId), eq(userMissions.date, today)))
    .limit(1);
  if (existing?.completedAt) return { alreadyCompleted: true };

  await db.insert(userMissions).values({ userId, missionId, date: today, completedAt: new Date() })
    .onConflictDoNothing();

  if (mission.fpReward > 0) {
    await db.insert(fpLedger).values({
      userId, amount: mission.fpReward, poolType: "achievement",
      reason: `Mission: ${mission.title}`,
    });
  }

  if (mission.xpReward > 0) {
    const [user] = await db.select({ xpTotal: users.xpTotal }).from(users).where(eq(users.id, userId)).limit(1);
    if (user) {
      await db.update(users).set({ xpTotal: user.xpTotal + mission.xpReward }).where(eq(users.id, userId));
    }
  }

  return { ok: true, fpEarned: mission.fpReward };
}

export async function getXP(userId: string) {
  const [user] = await db.select({ xpTotal: users.xpTotal, xpLevel: users.xpLevel })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw { statusCode: 404, message: "User not found" };
  return { xpTotal: user.xpTotal, xpLevel: user.xpLevel };
}
