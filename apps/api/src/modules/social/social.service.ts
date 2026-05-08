import { db } from "../../db";
import { userFollows, users } from "../../db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export async function followUser(followerId: string, followeeId: string) {
  if (followerId === followeeId) throw { statusCode: 400, message: "Cannot follow yourself" };
  await db.insert(userFollows).values({ followerId, followeeId }).onConflictDoNothing();
}

export async function unfollowUser(followerId: string, followeeId: string) {
  await db.delete(userFollows).where(
    and(eq(userFollows.followerId, followerId), eq(userFollows.followeeId, followeeId))
  );
}

export async function getFollowers(userId: string) {
  return db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
    .from(userFollows)
    .innerJoin(users, eq(userFollows.followerId, users.id))
    .where(eq(userFollows.followeeId, userId))
    .orderBy(desc(userFollows.createdAt))
    .limit(100);
}

export async function getFollowing(userId: string) {
  return db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
    .from(userFollows)
    .innerJoin(users, eq(userFollows.followeeId, users.id))
    .where(eq(userFollows.followerId, userId))
    .orderBy(desc(userFollows.createdAt))
    .limit(100);
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const rows = await db
    .select({ followerId: userFollows.followerId })
    .from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followeeId, followeeId)))
    .limit(1);
  return rows.length > 0;
}

export async function getFollowCounts(userId: string) {
  const [[{ followers }], [{ following }]] = await Promise.all([
    db.select({ followers: count() }).from(userFollows).where(eq(userFollows.followeeId, userId)),
    db.select({ following: count() }).from(userFollows).where(eq(userFollows.followerId, userId)),
  ]);
  return { followers, following };
}
