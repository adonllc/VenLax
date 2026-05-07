import { db } from "../../db";
import {
  users, markets, fpLedger, reviews, auditLog,
} from "../../db/schema";
import { eq, ilike, and, desc, sql, count, sum } from "drizzle-orm";

export async function listUsers(opts: {
  page: number;
  search?: string;
  tier?: string;
  status?: string;
}) {
  const limit = 20;
  const offset = (opts.page - 1) * limit;
  const conditions = [];
  if (opts.search) conditions.push(ilike(users.email, `%${opts.search}%`));
  if (opts.tier) conditions.push(eq(users.subscriptionTier, opts.tier as any));
  if (opts.status === "suspended") conditions.push(eq(users.isBanned, true));
  else if (opts.status === "active") conditions.push(eq(users.isActive, true));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        subscriptionTier: users.subscriptionTier,
        xpLevel: users.xpLevel,
        isActive: users.isActive,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);
  return { users: rows, total, page: opts.page, pages: Math.ceil(total / limit) };
}

export async function getUserDetail(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw { statusCode: 404, message: "User not found" };
  const [fpRow] = await db
    .select({ balance: sum(fpLedger.amount) })
    .from(fpLedger)
    .where(eq(fpLedger.userId, userId));
  return { user, fpBalance: Number(fpRow?.balance ?? 0) };
}

export async function suspendUser(userId: string, suspend: boolean) {
  await db
    .update(users)
    .set({ isBanned: suspend, isActive: !suspend })
    .where(eq(users.id, userId));
}

export async function listMarkets(opts: {
  page: number;
  status?: string;
  category?: string;
}) {
  const limit = 20;
  const offset = (opts.page - 1) * limit;
  const conditions = [];
  if (opts.status) conditions.push(eq(markets.status, opts.status as any));
  if (opts.category) conditions.push(eq(markets.category, opts.category as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(markets)
      .where(where)
      .orderBy(desc(markets.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(markets).where(where),
  ]);
  return { markets: rows, total, page: opts.page, pages: Math.ceil(total / limit) };
}

export async function createMarket(input: {
  title: string;
  description: string;
  category: string;
  closesAt: string;
  resolvesAt: string;
  resolutionCriteria: string;
  resolutionSource: string;
}) {
  const [market] = await db
    .insert(markets)
    .values({
      title: input.title,
      description: input.description,
      category: input.category as any,
      closesAt: new Date(input.closesAt),
      resolvesAt: new Date(input.resolvesAt),
      resolutionCriteria: input.resolutionCriteria,
      resolutionSource: input.resolutionSource,
      status: "open",
      creatorId: null, // admin-created markets have no user creatorId
    })
    .returning();
  return market;
}

// resolvedOutcome is boolean in schema: true = yes, false = no
export async function resolveMarket(marketId: string, outcome: "yes" | "no") {
  await db
    .update(markets)
    .set({
      status: "resolved",
      resolvedOutcome: outcome === "yes",
      resolvedAt: new Date(),
    })
    .where(eq(markets.id, marketId));
}

export async function adjustFP(input: {
  userId: string;
  amount: number;
  poolType: string;
  reason: string;
  adminId: string;
}) {
  await db.insert(fpLedger).values({
    userId: input.userId,
    amount: input.amount,
    poolType: input.poolType as any,
    reason: input.reason,
  });

  // Audit log: actorId is nullable (admin users live in adminUsers table, not users),
  // so we store null for actorId and put adminId in metadata.
  await db.insert(auditLog).values({
    actorId: null,
    action: `fp_adjust:${input.amount > 0 ? "credit" : "debit"}`,
    targetType: "user",
    targetId: input.userId,
    metadata: JSON.stringify({
      adminId: input.adminId,
      amount: input.amount,
      reason: input.reason,
      poolType: input.poolType,
    }),
  });
}

// Reviews have no "status" column. Use isPublished=false as the moderation queue
// (unpublished reviews awaiting approval).
export async function getReviewQueue(page: number) {
  const limit = 20;
  const offset = (page - 1) * limit;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(eq(reviews.isPublished, false))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(reviews).where(eq(reviews.isPublished, false)),
  ]);
  return { reviews: rows, total, page, pages: Math.ceil(total / limit) };
}

// action "approved" → isPublished=true; action "rejected" → isPublished stays false (already false),
// but we still update updatedAt to signal it was processed.
export async function moderateReview(
  reviewId: string,
  action: "approved" | "rejected"
) {
  await db
    .update(reviews)
    .set({ isPublished: action === "approved", updatedAt: new Date() })
    .where(eq(reviews.id, reviewId));
}

export async function getAnalytics() {
  const [
    [{ mau }],
    [{ dau }],
    tierCounts,
    fpVolume,
    topMarkets,
  ] = await Promise.all([
    db
      .select({ mau: count() })
      .from(users)
      .where(sql`${users.updatedAt} > now() - interval '30 days'`),
    db
      .select({ dau: count() })
      .from(users)
      .where(sql`${users.updatedAt} > now() - interval '1 day'`),
    db
      .select({ tier: users.subscriptionTier, total: count() })
      .from(users)
      .groupBy(users.subscriptionTier),
    db
      .select({ poolType: fpLedger.poolType, volume: sum(fpLedger.amount) })
      .from(fpLedger)
      .where(sql`${fpLedger.createdAt} > now() - interval '7 days'`)
      .groupBy(fpLedger.poolType),
    db
      .select({ id: markets.id, title: markets.title })
      .from(markets)
      .where(eq(markets.status, "open"))
      .limit(5),
  ]);
  return { mau, dau, tierCounts, fpVolume, topMarkets };
}
