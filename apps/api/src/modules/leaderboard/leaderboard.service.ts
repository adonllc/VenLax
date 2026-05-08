import { db } from "../../db";
import { users } from "../../db/schema";
import { desc, eq } from "drizzle-orm";

export async function getLeaderboard(opts: { category?: string; limit?: number }) {
  const limit = Math.min(opts.limit ?? 100, 100);

  const rows = await db.select({
    id: users.id,
    username: users.username,
    avatarUrl: users.avatarUrl,
    subscriptionTier: users.subscriptionTier,
    xpLevel: users.xpLevel,
    xpTotal: users.xpTotal,
    reputationScore: users.reputationScore,
  }).from(users)
    .where(eq(users.isActive, true))
    .orderBy(desc(users.reputationScore))
    .limit(limit);

  return rows.map((u, i) => ({ ...u, rank: i + 1 }));
}
