import { db } from "../../db";
import { users, forecastPositions, userBadges } from "../../db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function getPublicProfile(userId: string, viewerId?: string) {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      subscriptionTier: users.subscriptionTier,
      xpLevel: users.xpLevel,
      xpTotal: users.xpTotal,
      reputationScore: users.reputationScore,
      theme: users.theme,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user) throw { statusCode: 404, message: "User not found" };

  const badges = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));

  const [{ total: totalForecasts }] = await db
    .select({ total: count() })
    .from(forecastPositions)
    .where(eq(forecastPositions.userId, userId));

  return { user, badges, totalForecasts };
}

export async function updateOwnProfile(userId: string, input: { username?: string; avatarUrl?: string }) {
  await db.update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserTheme(userId: string, theme: "dark" | "light") {
  await db.update(users).set({ theme, updatedAt: new Date() }).where(eq(users.id, userId));
}
