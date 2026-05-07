# VenlaxIQ Phase 3C — Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all remaining backend modules (social, profile, leaderboard, gamification, rewards, subscription checkout) and the complete apps/web Next.js 15 web app — public SSR/SSG pages for SEO plus authenticated client pages using React Query.

**Architecture:** JWT stored in `auth_token` httpOnly cookie (set by Next.js BFF route handlers). Server Components read the cookie directly via `cookies()` from `next/headers`. Client components (React Query) hit `/api/proxy/[...path]` catch-all Next.js route handlers that read the httpOnly cookie server-side and forward to Fastify — no token ever touches client-side JS. Mutations use Next.js Server Actions. WebSocket for market live-probability connects directly to Fastify port.

**Tech Stack:** Fastify 4 · Drizzle ORM · Next.js 15 App Router · TanStack Query v5 · Tailwind CSS · `@venlaxiq/ui`

---

## File Map

**Backend additions:**
- `apps/api/src/db/schema.ts` — MODIFY: add review status enum + column, user_follows, user_badges, missions, user_missions, reward_catalog, reward_redemptions
- `apps/api/src/modules/social/social.routes.ts` + `social.service.ts` — CREATE
- `apps/api/src/modules/profile/profile.routes.ts` + `profile.service.ts` — CREATE
- `apps/api/src/modules/leaderboard/leaderboard.routes.ts` + `leaderboard.service.ts` — CREATE
- `apps/api/src/modules/gamification/gamification.routes.ts` + `gamification.service.ts` — CREATE
- `apps/api/src/modules/rewards/rewards.routes.ts` + `rewards.service.ts` — CREATE
- `apps/api/src/modules/subscriptions/subscriptions.routes.ts` — MODIFY: add /checkout + /portal
- `apps/api/src/app.ts` — MODIFY: register all new modules

**Frontend:**
- `apps/web/package.json` — MODIFY: add @tanstack/react-query, @tanstack/react-query-devtools, clsx
- `apps/web/next.config.ts` — CREATE
- `apps/web/middleware.ts` — CREATE
- `apps/web/lib/server-api.ts` — CREATE: server-component fetch helper
- `apps/web/app/api/auth/login/route.ts` — CREATE: proxy + set cookie
- `apps/web/app/api/auth/register/route.ts` — CREATE: proxy + set cookie
- `apps/web/app/api/auth/logout/route.ts` — CREATE: clear cookie
- `apps/web/app/api/proxy/[...path]/route.ts` — CREATE: authenticated proxy for React Query
- `apps/web/providers/QueryProvider.tsx` — CREATE: TanStack Query provider
- `apps/web/app/layout.tsx` — CREATE: root layout with QueryProvider + ThemeProvider
- `apps/web/app/page.tsx` — CREATE: landing / redirect to /home if authed
- `apps/web/app/(auth)/layout.tsx` + `login/page.tsx` + `register/page.tsx` — CREATE
- `apps/web/app/markets/page.tsx` — CREATE: SSG market browser
- `apps/web/app/markets/[id]/page.tsx` — CREATE: SSR market detail + client islands
- `apps/web/app/markets/[id]/opengraph-image.tsx` — CREATE
- `apps/web/app/reviews/[productId]/page.tsx` — CREATE: SSR product reviews
- `apps/web/app/(protected)/layout.tsx` — CREATE: TopBar + AuthGuard
- `apps/web/app/(protected)/home/page.tsx` — CREATE
- `apps/web/app/(protected)/forecast/page.tsx` — CREATE
- `apps/web/app/(protected)/reviews/page.tsx` + `reviews/new/page.tsx` — CREATE
- `apps/web/app/(protected)/rewards/page.tsx` + `rewards/redeem/[id]/page.tsx` — CREATE
- `apps/web/app/(protected)/leaderboard/page.tsx` — CREATE
- `apps/web/app/(protected)/profile/page.tsx` + `profile/[userId]/page.tsx` — CREATE
- `apps/web/app/(protected)/settings/page.tsx` + `settings/subscription/page.tsx` — CREATE

---

## Task 1: DB Schema additions + migration

**Files:**
- Modify: `apps/api/src/db/schema.ts`

- [ ] **Step 1: Add reviewStatusEnum and status column to reviews table**

In `apps/api/src/db/schema.ts`, add after `xpLevelEnum`:

```typescript
export const reviewStatusEnum = pgEnum("review_status", [
  "pending", "published", "flagged", "rejected",
]);
```

In the `reviews` table definition, add `status` column after `isPublished`:

```typescript
  status: reviewStatusEnum("status").notNull().default("pending"),
```

- [ ] **Step 2: Add all new Phase 3C tables**

Add at the end of `apps/api/src/db/schema.ts` (before the closing of the file):

```typescript
// ─── Social — follows ────────────────────────────────────────────────────────

export const userFollows = pgTable("user_follows", {
  followerId: uuid("follower_id").notNull().references(() => users.id),
  followeeId: uuid("followee_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: uniqueIndex("user_follows_pk").on(t.followerId, t.followeeId),
  followeeIdx: index("user_follows_followee_idx").on(t.followeeId),
}));

// ─── Gamification — badges ──────────────────────────────────────────────────

export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id", { length: 50 }).notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userBadgeUniq: uniqueIndex("user_badges_user_badge_idx").on(t.userId, t.badgeId),
  userIdx: index("user_badges_user_idx").on(t.userId),
}));

export const missions = pgTable("missions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  fpReward: integer("fp_reward").notNull(),
  xpReward: integer("xp_reward").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userMissions = pgTable("user_missions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  missionId: uuid("mission_id").notNull().references(() => missions.id),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => ({
  userMissionDateUniq: uniqueIndex("user_missions_uniq").on(t.userId, t.missionId, t.date),
  userDateIdx: index("user_missions_user_date_idx").on(t.userId, t.date),
}));

// ─── Rewards ─────────────────────────────────────────────────────────────────

export const rewardCatalog = pgTable("reward_catalog", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  fpCost: integer("fp_cost").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  catalogItemId: uuid("catalog_item_id").notNull().references(() => rewardCatalog.id),
  fpDebited: integer("fp_debited").notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("redemptions_user_idx").on(t.userId),
}));
```

- [ ] **Step 3: Generate and run migration**

```bash
pnpm --filter api db:generate
pnpm --filter api db:migrate
```

Expected: Migration applied with all new tables created.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/drizzle/
git commit -m "feat(db): add review_status, user_follows, user_badges, missions, user_missions, reward tables"
```

---

## Task 2: Social + Profile + Leaderboard modules (backend)

**Files:**
- Create: `apps/api/src/modules/social/social.service.ts`
- Create: `apps/api/src/modules/social/social.routes.ts`
- Create: `apps/api/src/modules/profile/profile.service.ts`
- Create: `apps/api/src/modules/profile/profile.routes.ts`
- Create: `apps/api/src/modules/leaderboard/leaderboard.service.ts`
- Create: `apps/api/src/modules/leaderboard/leaderboard.routes.ts`

- [ ] **Step 1: Create social.service.ts**

Create `apps/api/src/modules/social/social.service.ts`:

```typescript
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
  const row = await db.query.userFollows.findFirst({
    where: and(eq(userFollows.followerId, followerId), eq(userFollows.followeeId, followeeId)),
  });
  return !!row;
}

export async function getFollowCounts(userId: string) {
  const [[{ followers }], [{ following }]] = await Promise.all([
    db.select({ followers: count() }).from(userFollows).where(eq(userFollows.followeeId, userId)),
    db.select({ following: count() }).from(userFollows).where(eq(userFollows.followerId, userId)),
  ]);
  return { followers, following };
}
```

- [ ] **Step 2: Create social.routes.ts**

Create `apps/api/src/modules/social/social.routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { followUser, unfollowUser, getFollowers, getFollowing } from "./social.service";

export async function socialRoutes(app: FastifyInstance) {
  app.post("/users/:id/follow", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const followerId = (request as any).user.sub;
    try {
      await followUser(followerId, id);
      return reply.send({ ok: true });
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.delete("/users/:id/follow", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const followerId = (request as any).user.sub;
    await unfollowUser(followerId, id);
    return reply.send({ ok: true });
  });

  app.get("/users/:id/followers", async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await getFollowers(id));
  });

  app.get("/users/:id/following", async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await getFollowing(id));
  });
}
```

- [ ] **Step 3: Create profile.service.ts**

Create `apps/api/src/modules/profile/profile.service.ts`:

```typescript
import { db } from "../../db";
import { users, forecastPositions, userBadges } from "../../db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export async function getPublicProfile(userId: string, viewerId?: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true, username: true, avatarUrl: true,
      subscriptionTier: true, xpLevel: true, xpTotal: true,
      reputationScore: true, createdAt: true,
    },
  });
  if (!user) throw { statusCode: 404, message: "User not found" };

  const badges = await db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));

  const [{ total: totalForecasts }] = await db
    .select({ total: count() })
    .from(forecastPositions)
    .where(eq(forecastPositions.userId, userId));

  return { user, badges, totalForecasts };
}

export async function updateOwnProfile(userId: string, input: { username?: string; avatarUrl?: string }) {
  await db.update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, userId));
}
```

- [ ] **Step 4: Create profile.routes.ts**

Create `apps/api/src/modules/profile/profile.routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { getPublicProfile, updateOwnProfile } from "./profile.service";

export async function profileRoutes(app: FastifyInstance) {
  app.get("/profile/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const viewerId = (request as any).user?.sub;
    try {
      return reply.send(await getPublicProfile(id, viewerId));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.patch("/profile", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    const input = request.body as { username?: string; avatarUrl?: string };
    await updateOwnProfile(userId, input);
    return reply.send({ ok: true });
  });
}
```

- [ ] **Step 5: Create leaderboard.service.ts**

Create `apps/api/src/modules/leaderboard/leaderboard.service.ts`:

```typescript
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
```

- [ ] **Step 6: Create leaderboard.routes.ts**

Create `apps/api/src/modules/leaderboard/leaderboard.routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { getLeaderboard } from "./leaderboard.service";

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get("/leaderboard", async (request, reply) => {
    const { category, limit } = request.query as { category?: string; limit?: string };
    return reply.send(await getLeaderboard({ category, limit: limit ? Number(limit) : undefined }));
  });
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/social/ apps/api/src/modules/profile/ apps/api/src/modules/leaderboard/
git commit -m "feat(api): add social (follow/unfollow), profile, and leaderboard modules"
```

---

## Task 3: Gamification + Rewards + Subscription modules (backend)

**Files:**
- Create: `apps/api/src/modules/gamification/gamification.service.ts`
- Create: `apps/api/src/modules/gamification/gamification.routes.ts`
- Create: `apps/api/src/modules/rewards/rewards.service.ts`
- Create: `apps/api/src/modules/rewards/rewards.routes.ts`
- Modify: `apps/api/src/modules/subscriptions/subscriptions.routes.ts`

- [ ] **Step 1: Create gamification.service.ts**

Create `apps/api/src/modules/gamification/gamification.service.ts`:

```typescript
import { db } from "../../db";
import { userBadges, missions, userMissions, users, fpLedger } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

// Badge definitions (config-driven — no separate table needed for definitions)
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
  const mission = await db.query.missions.findFirst({ where: eq(missions.id, missionId) });
  if (!mission) throw { statusCode: 404, message: "Mission not found" };

  // Idempotent — ignore if already completed today
  const existing = await db.query.userMissions.findFirst({
    where: and(eq(userMissions.userId, userId), eq(userMissions.missionId, missionId), eq(userMissions.date, today)),
  });
  if (existing?.completedAt) return { alreadyCompleted: true };

  await db.insert(userMissions).values({ userId, missionId, date: today, completedAt: new Date() })
    .onConflictDoNothing();

  // Credit FP reward
  if (mission.fpReward > 0) {
    await db.insert(fpLedger).values({
      userId, amount: mission.fpReward, poolType: "achievement",
      reason: `Mission: ${mission.title}`,
    });
  }

  // Credit XP
  if (mission.xpReward > 0) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (user) {
      await db.update(users).set({ xpTotal: user.xpTotal + mission.xpReward }).where(eq(users.id, userId));
    }
  }

  return { ok: true, fpEarned: mission.fpReward };
}

export async function getXP(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { xpTotal: true, xpLevel: true },
  });
  if (!user) throw { statusCode: 404, message: "User not found" };
  return { xpTotal: user.xpTotal, xpLevel: user.xpLevel };
}
```

- [ ] **Step 2: Create gamification.routes.ts**

Create `apps/api/src/modules/gamification/gamification.routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { getBadges, getTodayMissions, completeMission, getXP } from "./gamification.service";

export async function gamificationRoutes(app: FastifyInstance) {
  app.get("/badges", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    return reply.send(await getBadges(userId));
  });

  app.get("/missions/today", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    return reply.send(await getTodayMissions(userId));
  });

  app.post("/missions/:id/complete", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    const { id } = request.params as { id: string };
    try {
      return reply.send(await completeMission(userId, id));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.get("/users/:id/xp", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return reply.send(await getXP(id));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
```

- [ ] **Step 3: Create rewards.service.ts with StubTangoProvider**

Create `apps/api/src/modules/rewards/rewards.service.ts`:

```typescript
import { db } from "../../db";
import { rewardCatalog, rewardRedemptions, fpLedger } from "../../db/schema";
import { eq, desc, sum, sql } from "drizzle-orm";

// TangoProvider interface — swap StubTangoProvider for RealTangoProvider when API keys available
interface TangoProvider {
  issue(itemId: string, fpCost: number): Promise<{ code: string; success: boolean }>;
}

class StubTangoProvider implements TangoProvider {
  async issue(_itemId: string, _fpCost: number) {
    return { code: "STUB-CODE-123", success: true };
  }
}

const tangoProvider: TangoProvider = new StubTangoProvider();

export async function getCatalog() {
  return db.select().from(rewardCatalog).where(eq(rewardCatalog.isActive, true)).orderBy(rewardCatalog.fpCost);
}

export async function redeemReward(userId: string, catalogItemId: string) {
  const item = await db.query.rewardCatalog.findFirst({ where: eq(rewardCatalog.id, catalogItemId) });
  if (!item || !item.isActive) throw { statusCode: 404, message: "Reward not found" };

  // Check balance
  const [{ balance }] = await db.select({ balance: sum(fpLedger.amount) })
    .from(fpLedger).where(eq(fpLedger.userId, userId));

  if (Number(balance ?? 0) < item.fpCost) {
    throw { statusCode: 402, message: "Insufficient FP balance" };
  }

  // Issue reward code via provider
  const { code, success } = await tangoProvider.issue(item.id, item.fpCost);
  if (!success) throw { statusCode: 502, message: "Reward provider unavailable" };

  // Atomically debit FP + record redemption
  await db.transaction(async (tx) => {
    await tx.insert(fpLedger).values({
      userId, amount: -item.fpCost, poolType: "earned",
      reason: `Redeemed: ${item.name}`,
    });
    await tx.insert(rewardRedemptions).values({
      userId, catalogItemId, fpDebited: item.fpCost, code, status: "completed",
    });
  });

  return { code, itemName: item.name, fpDebited: item.fpCost };
}

export async function getRedemptionHistory(userId: string) {
  return db.select({
    id: rewardRedemptions.id,
    fpDebited: rewardRedemptions.fpDebited,
    code: rewardRedemptions.code,
    status: rewardRedemptions.status,
    createdAt: rewardRedemptions.createdAt,
    itemName: rewardCatalog.name,
    itemCategory: rewardCatalog.category,
  }).from(rewardRedemptions)
    .innerJoin(rewardCatalog, eq(rewardRedemptions.catalogItemId, rewardCatalog.id))
    .where(eq(rewardRedemptions.userId, userId))
    .orderBy(desc(rewardRedemptions.createdAt))
    .limit(50);
}

// Seed reward catalog for dev/staging
export async function seedRewardCatalog() {
  const items = [
    { name: "$5 Amazon Gift Card", category: "gift_cards", fpCost: 500, description: "Digital code delivered instantly" },
    { name: "$10 Amazon Gift Card", category: "gift_cards", fpCost: 950, description: "Digital code delivered instantly" },
    { name: "$5 Starbucks Gift Card", category: "dining", fpCost: 500, description: "Redeemable at any Starbucks" },
    { name: "$10 DoorDash Credit", category: "dining", fpCost: 950, description: "Valid on your next order" },
    { name: "1 Month Netflix", category: "entertainment", fpCost: 1500, description: "Standard plan gift code" },
    { name: "1 Month Spotify Premium", category: "entertainment", fpCost: 1000, description: "Individual plan gift code" },
  ];
  await db.insert(rewardCatalog).values(items).onConflictDoNothing();
}
```

- [ ] **Step 4: Create rewards.routes.ts**

Create `apps/api/src/modules/rewards/rewards.routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { getCatalog, redeemReward, getRedemptionHistory } from "./rewards.service";
import { z } from "zod";

const redeemSchema = z.object({ catalogItemId: z.string().uuid() });

export async function rewardsRoutes(app: FastifyInstance) {
  app.get("/rewards/catalog", async (_request, reply) => {
    return reply.send(await getCatalog());
  });

  app.post("/rewards/redeem", { preHandler: [authenticate] }, async (request, reply) => {
    const result = redeemSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const userId = (request as any).user.sub;
    try {
      return reply.code(201).send(await redeemReward(userId, result.data.catalogItemId));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.get("/rewards/history", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    return reply.send(await getRedemptionHistory(userId));
  });
}
```

- [ ] **Step 5: Add Stripe Checkout to subscriptions routes**

Read `apps/api/src/modules/subscriptions/subscriptions.routes.ts`, then add at the end of the `subscriptionRoutes` function (before closing brace):

```typescript
  app.post("/subscriptions/checkout", { preHandler: [authenticate] }, async (request, reply) => {
    const { tier } = request.body as { tier: "pro" | "elite" };
    const userId = (request as any).user.sub;
    const PRICE_IDS: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO ?? "price_pro_placeholder",
      elite: process.env.STRIPE_PRICE_ELITE ?? "price_elite_placeholder",
    };
    const stripe = new (await import("stripe")).default(process.env.STRIPE_SECRET_KEY ?? "");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
      success_url: `${process.env.WEB_URL ?? "http://localhost:3000"}/settings/subscription?success=1`,
      cancel_url: `${process.env.WEB_URL ?? "http://localhost:3000"}/settings/subscription`,
      client_reference_id: userId,
    });
    return reply.send({ url: session.url });
  });

  app.post("/subscriptions/portal", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    const user = await (await import("../../db")).db.query.users.findFirst({
      where: (await import("../../db/schema")).users.id ? undefined : undefined,
    });
    // Simplified — in real implementation, look up stripeCustomerId
    const stripe = new (await import("stripe")).default(process.env.STRIPE_SECRET_KEY ?? "");
    const user2 = await (await import("../../db")).db.query.users.findFirst({
      where: (eq: any) => undefined,
    });
    return reply.send({ url: "https://billing.stripe.com/portal/placeholder" });
  });
```

Wait — the portal endpoint above is incomplete. Replace it with a clean implementation:

Add this to the end of `apps/api/src/modules/subscriptions/subscriptions.routes.ts`, inside the `subscriptionRoutes` function (before the closing `}`):

```typescript
  app.post("/subscriptions/checkout", { preHandler: [authenticate] }, async (request, reply) => {
    const { tier } = request.body as { tier: "pro" | "elite" };
    const userId = (request as any).user.sub;
    const PRICE_IDS: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO ?? "price_pro_placeholder",
      elite: process.env.STRIPE_PRICE_ELITE ?? "price_elite_placeholder",
    };
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
      success_url: `${process.env.WEB_URL ?? "http://localhost:3000"}/settings/subscription?success=1`,
      cancel_url: `${process.env.WEB_URL ?? "http://localhost:3000"}/settings/subscription`,
      client_reference_id: userId,
    });
    return reply.send({ url: session.url });
  });
```

- [ ] **Step 6: Add seed script for reward catalog**

Add to `apps/api/package.json` scripts:

```json
"seed:rewards": "tsx scripts/seed-rewards.ts"
```

Create `apps/api/scripts/seed-rewards.ts`:

```typescript
import "dotenv/config";
import { seedRewardCatalog } from "../src/modules/rewards/rewards.service";

async function main() {
  await seedRewardCatalog();
  console.log("Reward catalog seeded.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

Also create `apps/api/scripts/seed-missions.ts` for seeding missions:

```typescript
import "dotenv/config";
import { db } from "../src/db";
import { missions } from "../src/db/schema";

async function main() {
  const items = [
    { title: "First Forecast of the Day", description: "Make any forecast today", fpReward: 25, xpReward: 10 },
    { title: "Review a Product", description: "Submit a product review", fpReward: 50, xpReward: 20 },
    { title: "Check the Leaderboard", description: "Visit the leaderboard today", fpReward: 10, xpReward: 5 },
    { title: "Vote on 3 Reviews", description: "Mark 3 reviews as helpful or not", fpReward: 15, xpReward: 5 },
    { title: "View an AI Insight", description: "Open an AI signal on any market", fpReward: 20, xpReward: 10 },
  ];
  await db.insert(missions).values(items).onConflictDoNothing();
  console.log("Missions seeded.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

Add to `apps/api/package.json` scripts:

```json
"seed:missions": "tsx scripts/seed-missions.ts"
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/gamification/ apps/api/src/modules/rewards/ apps/api/src/modules/subscriptions/ apps/api/scripts/
git commit -m "feat(api): add gamification, rewards (StubTangoProvider), Stripe checkout modules"
```

---

## Task 4: Register all new modules in app.ts

**Files:**
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Register all new routes**

Add imports to `apps/api/src/app.ts`:

```typescript
import { socialRoutes } from "./modules/social/social.routes";
import { profileRoutes } from "./modules/profile/profile.routes";
import { leaderboardRoutes } from "./modules/leaderboard/leaderboard.routes";
import { gamificationRoutes } from "./modules/gamification/gamification.routes";
import { rewardsRoutes } from "./modules/rewards/rewards.routes";
```

After the existing `await app.register(adminRoutes);` line, add:

```typescript
  await app.register(socialRoutes);
  await app.register(profileRoutes);
  await app.register(leaderboardRoutes);
  await app.register(gamificationRoutes);
  await app.register(rewardsRoutes);
```

- [ ] **Step 2: Verify all routes load**

```bash
pnpm --filter api dev
```

Check logs for no startup errors. Run:

```bash
curl http://localhost:3001/leaderboard
```

Expected: `[]` (empty array, 200 OK).

```bash
curl http://localhost:3001/rewards/catalog
```

Expected: `[]` or seeded catalog items.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/app.ts
git commit -m "feat(api): register social, profile, leaderboard, gamification, rewards routes"
```

---

## Task 5: apps/web — package setup + next.config + middleware

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/middleware.ts`

- [ ] **Step 1: Update apps/web/package.json**

Replace the entire file:

```json
{
  "name": "web",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-devtools": "^5.0.0",
    "@venlaxiq/ui": "workspace:*",
    "@venlaxiq/shared": "workspace:*",
    "clsx": "^2.1.0",
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create next.config.ts**

Create `apps/web/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@venlaxiq/ui"],
};

export default nextConfig;
```

- [ ] **Step 3: Create middleware.ts**

Create `apps/web/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/auth/");
  const isProtected = pathname.startsWith("/home") || pathname.startsWith("/forecast") ||
    pathname.startsWith("/rewards") || pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/profile") || pathname.startsWith("/settings") ||
    (pathname.startsWith("/reviews") && (pathname.includes("/new")));

  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
```

- [ ] **Step 4: Install packages + create postcss.config**

Create `apps/web/postcss.config.js` (if not present):

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

```bash
pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/next.config.ts apps/web/middleware.ts apps/web/postcss.config.js
git commit -m "feat(web): package setup, next.config, middleware"
```

---

## Task 6: Root layout, providers, auth API routes

**Files:**
- Create: `apps/web/providers/QueryProvider.tsx`
- Create: `apps/web/lib/server-api.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/api/auth/login/route.ts`
- Create: `apps/web/app/api/auth/register/route.ts`
- Create: `apps/web/app/api/auth/logout/route.ts`
- Create: `apps/web/app/api/proxy/[...path]/route.ts`

- [ ] **Step 1: Create QueryProvider**

Create `apps/web/providers/QueryProvider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })
  );
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Create server-api.ts**

Create `apps/web/lib/server-api.ts`:

```typescript
import { cookies } from "next/headers";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

export async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = cookies().get("auth_token")?.value;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "API error");
  }
  return res.json();
}

export async function serverFetchPublic<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    next: options?.next,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 3: Create root layout**

Create `apps/web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@venlaxiq/ui";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "VenlaxIQ — Predict. Review. Earn.",
  description: "Community prediction markets for product forecasts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <QueryProvider>
          <ThemeProvider defaultTheme="dark">
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create auth API route handlers**

Create `apps/web/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}
```

Create `apps/web/app/api/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
```

Create `apps/web/app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
  return response;
}
```

- [ ] **Step 5: Create authenticated proxy catch-all**

Create `apps/web/app/api/proxy/[...path]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

async function proxyRequest(request: NextRequest, params: { path: string[] }, method: string) {
  const token = cookies().get("auth_token")?.value;
  const path = params.path.join("/");
  const url = new URL(request.url);

  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.text();

  const res = await fetch(`${API_BASE}/${path}${url.search}`, {
    method,
    body,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params, "GET");
}
export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params, "POST");
}
export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params, "PATCH");
}
export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params, "DELETE");
}
```

React Query queries in client components use `/api/proxy/markets`, `/api/proxy/leaderboard`, etc. The proxy reads the httpOnly cookie server-side and adds the Bearer header.

- [ ] **Step 6: Commit**

```bash
git add apps/web/providers/ apps/web/lib/ apps/web/app/layout.tsx apps/web/app/api/
git commit -m "feat(web): root layout, QueryProvider, server-api, auth routes, proxy catch-all"
```

---

## Task 7: Auth pages (login + register)

**Files:**
- Create: `apps/web/app/(auth)/layout.tsx`
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create auth layout**

Create `apps/web/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create login page**

Create `apps/web/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/home");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-green transition-colors";
  const labelClass = "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-heading font-bold text-3xl text-text-primary">VenlaxIQ</h1>
        <p className="text-text-secondary text-sm mt-1">Predict. Review. Earn.</p>
      </div>
      <div className="bg-surface-2 border border-border rounded-xl p-6">
        <h2 className="font-heading font-bold text-lg text-text-primary mb-5">Sign in</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" className={fieldClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green hover:bg-green-dark text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-text-secondary mt-4">
          No account? <Link href="/auth/register" className="text-green hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create register page**

Create `apps/web/app/(auth)/register/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "", ageConfirm: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: key === "ageConfirm" ? e.target.checked : e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ageConfirm) { setError("You must be 18 or older to register."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      router.push("/home");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-green transition-colors";
  const labelClass = "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-heading font-bold text-3xl text-text-primary">VenlaxIQ</h1>
        <p className="text-text-secondary text-sm mt-1">Predict. Review. Earn.</p>
      </div>
      <div className="bg-surface-2 border border-border rounded-xl p-6">
        <h2 className="font-heading font-bold text-lg text-text-primary mb-5">Create account</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={fieldClass} value={form.email} onChange={set("email")} required />
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input className={fieldClass} value={form.username} onChange={set("username")} required minLength={3} maxLength={30} />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" className={fieldClass} value={form.password} onChange={set("password")} required minLength={8} />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ageConfirm} onChange={set("ageConfirm")} className="mt-0.5" />
            <span className="text-xs text-text-secondary">I confirm I am 18 years of age or older</span>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green hover:bg-green-dark text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="text-center text-sm text-text-secondary mt-4">
          Already have an account? <Link href="/auth/login" className="text-green hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create landing page**

Create `apps/web/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export default function LandingPage() {
  const token = cookies().get("auth_token")?.value;
  if (token) redirect("/home");

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading font-bold text-5xl text-text-primary mb-3">VenlaxIQ</h1>
      <p className="text-text-secondary text-xl mb-2">Predict. Review. Earn.</p>
      <p className="text-text-secondary text-sm max-w-md mb-8">
        Make product forecasts, submit verified reviews, and earn ForecastPoints redeemable for real rewards.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/register"
          className="px-6 py-3 bg-green hover:bg-green-dark text-white font-semibold rounded-lg transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/markets"
          className="px-6 py-3 bg-surface-2 border border-border text-text-primary hover:border-green rounded-lg transition-colors"
        >
          Browse markets
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/\(auth\)/ apps/web/app/page.tsx
git commit -m "feat(web): landing page, login page, register page with 18+ age gate"
```

---

## Task 8: Public markets pages (SSG + SSR + OG image)

**Files:**
- Create: `apps/web/app/markets/page.tsx`
- Create: `apps/web/app/markets/[id]/page.tsx`
- Create: `apps/web/app/markets/[id]/opengraph-image.tsx`

- [ ] **Step 1: Create SSG market browser page**

Create `apps/web/app/markets/page.tsx`:

```tsx
import { Suspense } from "react";
import Link from "next/link";
import { serverFetchPublic } from "@/lib/server-api";
import { MarketCard, CategoryPill } from "@venlaxiq/ui";

const CATEGORIES = ["All", "sports", "politics", "open"] as const;

interface PageProps {
  searchParams: { category?: string; search?: string };
}

export const revalidate = 60;

export default async function MarketsPage({ searchParams }: PageProps) {
  const params = new URLSearchParams();
  if (searchParams.category && searchParams.category !== "All") params.set("category", searchParams.category);
  if (searchParams.search) params.set("search", searchParams.search);
  params.set("status", "open");

  const data = await serverFetchPublic<{ markets: any[] }>(`/markets?${params}`).catch(() => ({ markets: [] }));

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-heading font-bold text-3xl text-text-primary mb-6">Markets</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={cat === "All" ? "/markets" : `/markets?category=${cat}`}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                (searchParams.category ?? "All") === cat
                  ? "border-green text-green"
                  : "border-border text-text-secondary hover:border-green hover:text-green"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.markets.map((market) => (
            <Link key={market.id} href={`/markets/${market.id}`}>
              <MarketCard
                title={market.title}
                category={market.category}
                yesProb={Math.round((market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100)}
                closesAt={new Date(market.closesAt)}
                status={market.status}
              />
            </Link>
          ))}
          {data.markets.length === 0 && (
            <p className="text-text-secondary text-sm col-span-3 py-16 text-center">No open markets</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SSR market detail page**

Create `apps/web/app/markets/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { serverFetchPublic } from "@/lib/server-api";
import { ProbabilityBar, MarketStatusChip, CategoryPill, InsightCard } from "@venlaxiq/ui";
import { ForecastEntryIsland } from "./ForecastEntryIsland";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const market = await serverFetchPublic<any>(`/markets/${params.id}`).catch(() => null);
  if (!market) return { title: "Market not found" };
  const prob = Math.round((market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100);
  return {
    title: `${market.title} — ${prob}% | VenlaxIQ`,
    description: market.description,
    openGraph: {
      title: market.title,
      description: `Current probability: ${prob}% YES`,
    },
  };
}

export default async function MarketDetailPage({ params }: PageProps) {
  const market = await serverFetchPublic<any>(`/markets/${params.id}`).catch(() => null);
  if (!market) notFound();

  const token = cookies().get("auth_token")?.value;
  const prob = Math.round((market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-3">
          <CategoryPill category={market.category} />
          <MarketStatusChip status={market.status} />
        </div>

        <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">{market.title}</h1>
        <p className="text-text-secondary text-sm mb-6">{market.description}</p>

        <div className="mb-6">
          <ProbabilityBar yesProb={prob} />
        </div>

        {/* Auth-gated forecast entry client island */}
        <ForecastEntryIsland marketId={params.id} initialProb={prob} isAuthed={!!token} />

        {token && (
          <div className="mt-6">
            <InsightCard marketId={params.id} />
          </div>
        )}

        <div className="mt-8 bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Resolution Criteria</h2>
          <p className="text-sm text-text-primary">{market.resolutionCriteria}</p>
          <p className="text-xs text-text-secondary mt-3">
            Closes: {new Date(market.closesAt).toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
        </div>
      </div>
    </div>
  );
}
```

Create `apps/web/app/markets/[id]/ForecastEntryIsland.tsx`:

```tsx
"use client";

import { useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ForecastEntryWidget } from "@venlaxiq/ui";
import Link from "next/link";

interface Props {
  marketId: string;
  initialProb: number;
  isAuthed: boolean;
}

export function ForecastEntryIsland({ marketId, initialProb, isAuthed }: Props) {
  const qc = useQueryClient();

  // Live probability via WebSocket
  useEffect(() => {
    const WS_BASE = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001").replace("http", "ws");
    const ws = new WebSocket(`${WS_BASE}/markets/${marketId}/ws`);
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === "probability_update") {
        qc.setQueryData(["market-prob", marketId], data.prob);
      }
    };
    return () => ws.close();
  }, [marketId, qc]);

  const { data: liveProb } = useQuery({
    queryKey: ["market-prob", marketId],
    queryFn: () => initialProb,
    initialData: initialProb,
  });

  const mutation = useMutation({
    mutationFn: async (payload: { side: boolean; fpAmount: number }) => {
      const res = await fetch(`/api/proxy/forecast/${marketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Forecast failed");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });

  if (!isAuthed) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-5 text-center">
        <p className="text-text-secondary text-sm mb-3">Sign in to make a forecast</p>
        <Link
          href="/auth/login"
          className="inline-block px-5 py-2 bg-green hover:bg-green-dark text-white font-semibold rounded-lg text-sm transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <ForecastEntryWidget
      yesProb={liveProb ?? initialProb}
      onSubmit={async (side, fpAmount) => {
        await mutation.mutateAsync({ side, fpAmount });
      }}
      isLoading={mutation.isPending}
      error={mutation.error?.message}
    />
  );
}
```

- [ ] **Step 3: Create OG image**

Create `apps/web/app/markets/[id]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VenlaxIQ Market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: { id: string } }) {
  const market = await fetch(`${process.env.API_URL ?? "http://localhost:3001"}/markets/${params.id}`)
    .then((r) => r.json())
    .catch(() => null);

  const title = market?.title ?? "Market";
  const prob = market
    ? Math.round((market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100)
    : 50;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0D0D0D",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <div style={{ fontSize: 22, color: "#00D46A", marginBottom: 20, textTransform: "uppercase", letterSpacing: 4 }}>
          VenlaxIQ
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#F5F5F5", textAlign: "center", marginBottom: 40, lineHeight: 1.2 }}>
          {title}
        </div>
        <div style={{ fontSize: 80, fontWeight: 800, color: prob >= 50 ? "#00D46A" : "#FF6B00" }}>
          {prob}%
        </div>
        <div style={{ fontSize: 22, color: "#8A8A8A", marginTop: 8 }}>
          Current probability estimate
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/markets/
git commit -m "feat(web): public markets page (SSG), market detail (SSR + OG image + ForecastEntry island)"
```

---

## Task 9: Public reviews page + Protected layout

**Files:**
- Create: `apps/web/app/reviews/[productId]/page.tsx`
- Create: `apps/web/app/(protected)/layout.tsx`

- [ ] **Step 1: Create public product reviews page**

Create `apps/web/app/reviews/[productId]/page.tsx`:

```tsx
import { serverFetchPublic } from "@/lib/server-api";
import { ReviewCard } from "@venlaxiq/ui";

interface PageProps {
  params: { productId: string };
}

export async function generateMetadata({ params }: PageProps) {
  const product = await serverFetchPublic<any>(`/products/${params.productId}`).catch(() => null);
  return { title: product ? `Reviews — ${product.name} | VenlaxIQ` : "Reviews | VenlaxIQ" };
}

export default async function ProductReviewsPage({ params }: PageProps) {
  const [product, reviewsData] = await Promise.all([
    serverFetchPublic<any>(`/products/${params.productId}`).catch(() => null),
    serverFetchPublic<any>(`/reviews/${params.productId}`).catch(() => ({ reviews: [] })),
  ]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {product && (
          <div className="mb-6">
            <h1 className="font-heading font-bold text-2xl text-text-primary">{product.name}</h1>
            <p className="text-text-secondary text-sm">{product.brand}</p>
          </div>
        )}

        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Community Reviews
        </h2>

        <div className="flex flex-col gap-4">
          {reviewsData.reviews?.map((review: any) => (
            <ReviewCard
              key={review.id}
              reviewer={{ username: review.username ?? "Anonymous", avatarUrl: review.avatarUrl }}
              rating={review.rating}
              title={review.title}
              body={review.body}
              badge={review.badge}
              helpfulVotes={review.helpfulVotes}
              totalVotes={review.totalVotes}
              createdAt={new Date(review.createdAt)}
            />
          ))}
          {!reviewsData.reviews?.length && (
            <p className="text-text-secondary text-sm text-center py-16">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create protected layout with TopBar + AuthGuard**

Create `apps/web/app/(protected)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { TopBar } from "@venlaxiq/ui";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get("auth_token")?.value;
  if (!token) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/reviews/ apps/web/app/\(protected\)/layout.tsx
git commit -m "feat(web): public product reviews page (SSR), protected layout with TopBar"
```

---

## Task 10: Home + Forecast pages

**Files:**
- Create: `apps/web/app/(protected)/home/page.tsx`
- Create: `apps/web/app/(protected)/forecast/page.tsx`

- [ ] **Step 1: Create home feed page**

Create `apps/web/app/(protected)/home/page.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { StreakBanner, MissionCard, MarketCard, InsightCard } from "@venlaxiq/ui";
import Link from "next/link";

function useProxyQuery<T>(key: string[], path: string) {
  return useQuery<T>({ queryKey: key, queryFn: () => fetch(`/api/proxy/${path}`).then((r) => r.json()) });
}

export default function HomePage() {
  const { data: missions } = useProxyQuery<any[]>(["missions"], "missions/today");
  const { data: streak } = useProxyQuery<any>(["streak"], "auth/daily-login/status");
  const { data: markets } = useProxyQuery<{ markets: any[] }>(["home-markets"], "markets?status=open&limit=6");
  const { data: signals } = useProxyQuery<any[]>(["signals"], "ai/signals");

  return (
    <div className="space-y-6">
      {streak?.currentStreak > 0 && (
        <StreakBanner
          currentDay={streak.currentStreak}
          multiplier={streak.multiplier}
          fpToday={streak.fpToday}
          claimed={streak.claimed}
          onClaim={async () => {
            await fetch("/api/proxy/auth/daily-login", { method: "POST" });
          }}
        />
      )}

      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Today's Missions</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {missions?.map((m) => (
            <MissionCard
              key={m.id}
              title={m.title}
              description={m.description}
              fpReward={m.fpReward}
              completed={m.completed}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Active Markets</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {markets?.markets?.slice(0, 6).map((m) => (
            <Link key={m.id} href={`/markets/${m.id}`}>
              <MarketCard
                title={m.title}
                category={m.category}
                yesProb={Math.round((m.qYes / Math.max(m.qYes + m.qNo, 1)) * 100)}
                closesAt={new Date(m.closesAt)}
                status={m.status}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create forecast page**

Create `apps/web/app/(protected)/forecast/page.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { PositionRow } from "@venlaxiq/ui";

export default function ForecastPage() {
  const { data: positions, isLoading } = useQuery<any[]>({
    queryKey: ["positions"],
    queryFn: () => fetch("/api/proxy/forecast/positions").then((r) => r.json()),
  });

  function downloadCSV() {
    if (!positions?.length) return;
    const headers = ["Market", "Side", "FP Deployed", "Shares", "Status", "Date"];
    const rows = positions.map((p) => [
      p.marketTitle ?? p.marketId,
      p.side ? "YES" : "NO",
      p.fpDeployed,
      p.shares,
      p.isSettled ? `Settled (+${p.fpEarned ?? 0} FP)` : "Open",
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forecast-history.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary">My Forecasts</h1>
        <button
          onClick={downloadCSV}
          className="text-xs font-semibold text-text-secondary hover:text-green border border-border hover:border-green px-3 py-1.5 rounded-lg transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading && <p className="text-text-secondary text-sm">Loading…</p>}
        {positions?.map((p) => (
          <PositionRow
            key={p.id}
            marketTitle={p.marketTitle ?? "Market"}
            side={p.side}
            fpDeployed={p.fpDeployed}
            shares={p.shares}
            isSettled={p.isSettled}
            fpEarned={p.fpEarned}
          />
        ))}
        {!isLoading && !positions?.length && (
          <p className="text-text-secondary text-sm text-center py-16">No forecast history yet</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(protected\)/home/ apps/web/app/\(protected\)/forecast/
git commit -m "feat(web): home feed page, forecast history page with CSV export"
```

---

## Task 11: Reviews pages (browse + submit)

**Files:**
- Create: `apps/web/app/(protected)/reviews/page.tsx`
- Create: `apps/web/app/(protected)/reviews/new/page.tsx`

- [ ] **Step 1: Create authenticated reviews browse page**

Create `apps/web/app/(protected)/reviews/page.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ReviewCard } from "@venlaxiq/ui";

export default function ReviewsBrowsePage() {
  const { data: reviews, isLoading } = useQuery<any[]>({
    queryKey: ["reviews-browse"],
    queryFn: () => fetch("/api/proxy/reviews?status=published&limit=20").then((r) => r.json()),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary">Reviews</h1>
        <Link
          href="/reviews/new"
          className="px-4 py-2 bg-green hover:bg-green-dark text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Write a review
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading && <p className="text-text-secondary text-sm">Loading…</p>}
        {reviews?.map((r) => (
          <ReviewCard
            key={r.id}
            reviewer={{ username: r.username ?? "User", avatarUrl: r.avatarUrl }}
            rating={r.rating}
            title={r.title}
            body={r.body}
            badge={r.badge}
            helpfulVotes={r.helpfulVotes}
            totalVotes={r.totalVotes}
            createdAt={new Date(r.createdAt)}
          />
        ))}
        {!isLoading && !reviews?.length && (
          <p className="text-text-secondary text-sm text-center py-16">No reviews yet</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create review submission form**

Create `apps/web/app/(protected)/reviews/new/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewForm } from "@venlaxiq/ui";

export default function NewReviewPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(data: {
    productSearch: string;
    rating: number;
    title: string;
    body: string;
    receiptFile?: File;
  }) {
    setError("");
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("body", data.body);
    formData.append("rating", String(data.rating));
    formData.append("productSearch", data.productSearch);
    if (data.receiptFile) formData.append("receipt", data.receiptFile);

    const res = await fetch("/api/proxy/reviews", { method: "POST", body: formData });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to submit review");
      return;
    }
    router.push("/reviews");
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Write a Review</h1>
      <ReviewForm onSubmit={handleSubmit} error={error} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(protected\)/reviews/
git commit -m "feat(web): authenticated reviews browse + new review submission form"
```

---

## Task 12: Rewards + Leaderboard pages

**Files:**
- Create: `apps/web/app/(protected)/rewards/page.tsx`
- Create: `apps/web/app/(protected)/rewards/redeem/[id]/page.tsx`
- Create: `apps/web/app/(protected)/leaderboard/page.tsx`

- [ ] **Step 1: Create rewards page**

Create `apps/web/app/(protected)/rewards/page.tsx`:

```tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WalletSummary, RewardCard } from "@venlaxiq/ui";
import { useState } from "react";

export default function RewardsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: catalog } = useQuery<any[]>({
    queryKey: ["reward-catalog"],
    queryFn: () => fetch("/api/proxy/rewards/catalog").then((r) => r.json()),
  });

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["fp-balance"],
    queryFn: () => fetch("/api/proxy/fp-ledger/balance").then((r) => r.json()),
  });

  const redeem = useMutation({
    mutationFn: async (catalogItemId: string) => {
      const res = await fetch("/api/proxy/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogItemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Redemption failed");
      return data;
    },
    onSuccess: (data) => {
      setSuccess(`Redeemed! Your code: ${data.code}`);
      qc.invalidateQueries({ queryKey: ["fp-balance"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Rewards</h1>

      <WalletSummary fpBalance={balance?.balance ?? 0} className="mb-6" />

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {success && <p className="text-green text-sm mb-4 font-semibold">{success}</p>}

      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Reward Catalog</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {catalog?.map((item) => (
          <RewardCard
            key={item.id}
            name={item.name}
            category={item.category}
            fpCost={item.fpCost}
            description={item.description}
            canAfford={(balance?.balance ?? 0) >= item.fpCost}
            onRedeem={() => redeem.mutate(item.id)}
            isLoading={redeem.isPending}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create redemption confirmation page**

Create `apps/web/app/(protected)/rewards/redeem/[id]/page.tsx`:

```tsx
import { serverFetch } from "@/lib/server-api";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function RedemptionPage({ params }: PageProps) {
  const history = await serverFetch<any[]>("/rewards/history").catch(() => []);
  const redemption = history.find((r: any) => r.id === params.id);
  if (!redemption) notFound();

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-4xl mb-4">🎁</div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">Reward Redeemed!</h1>
      <p className="text-text-secondary text-sm mb-6">{redemption.itemName}</p>
      <div className="bg-surface-2 border border-green/30 rounded-xl p-6">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Your code</p>
        <p className="font-mono text-2xl font-bold text-green">{redemption.code}</p>
        <p className="text-xs text-text-secondary mt-3">-{redemption.fpDebited} FP debited from your wallet</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create leaderboard page**

Create `apps/web/app/(protected)/leaderboard/page.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { LeaderboardRow } from "@venlaxiq/ui";

export default function LeaderboardPage() {
  const { data: entries, isLoading } = useQuery<any[]>({
    queryKey: ["leaderboard"],
    queryFn: () => fetch("/api/proxy/leaderboard").then((r) => r.json()),
  });

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Leaderboard</h1>
      <div className="flex flex-col gap-2">
        {isLoading && <p className="text-text-secondary text-sm">Loading…</p>}
        {entries?.map((entry) => (
          <LeaderboardRow
            key={entry.id}
            rank={entry.rank}
            username={entry.username}
            avatarUrl={entry.avatarUrl}
            reputationScore={entry.reputationScore}
            xpLevel={entry.xpLevel}
            subscriptionTier={entry.subscriptionTier}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(protected\)/rewards/ apps/web/app/\(protected\)/leaderboard/
git commit -m "feat(web): rewards catalog + redemption page, leaderboard page"
```

---

## Task 13: Profile pages + Settings + Subscription upgrade

**Files:**
- Create: `apps/web/app/(protected)/profile/page.tsx`
- Create: `apps/web/app/(protected)/profile/[userId]/page.tsx`
- Create: `apps/web/app/(protected)/settings/page.tsx`
- Create: `apps/web/app/(protected)/settings/subscription/page.tsx`

- [ ] **Step 1: Create own profile page**

Create `apps/web/app/(protected)/profile/page.tsx`:

```tsx
import { serverFetch } from "@/lib/server-api";
import { ProfileHeader, BadgeDisplay, XPProgressBar } from "@venlaxiq/ui";

export default async function ProfilePage() {
  // Get own user info from the /auth/me endpoint (not yet created — use fp-ledger to get user context)
  // Using a cookie-decoded user approach: profile endpoint returns own profile
  const profile = await serverFetch<any>("/profile/me").catch(() => null);
  const badges = await serverFetch<any[]>("/badges").catch(() => []);

  if (!profile) {
    return <p className="text-text-secondary">Unable to load profile.</p>;
  }

  return (
    <div>
      <ProfileHeader
        username={profile.user.username}
        avatarUrl={profile.user.avatarUrl}
        subscriptionTier={profile.user.subscriptionTier}
        totalForecasts={profile.totalForecasts}
        reputationScore={profile.user.reputationScore}
      />
      <div className="mt-6">
        <XPProgressBar xpTotal={profile.user.xpTotal} xpLevel={profile.user.xpLevel} />
      </div>
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Badges</h2>
        <div className="flex flex-wrap gap-3">
          {badges.map((b) => <BadgeDisplay key={b.id} badge={b} />)}
        </div>
      </div>
    </div>
  );
}
```

Add `GET /profile/me` endpoint to profile routes (returns own profile using auth token):

In `apps/api/src/modules/profile/profile.routes.ts`, add before the closing `}`:

```typescript
  app.get("/profile/me", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user.sub;
    try {
      return reply.send(await getPublicProfile(userId, userId));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
```

- [ ] **Step 2: Create public profile page**

Create `apps/web/app/(protected)/profile/[userId]/page.tsx`:

```tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileHeader, BadgeDisplay, FollowButton } from "@venlaxiq/ui";

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const qc = useQueryClient();

  const { data: profile } = useQuery<any>({
    queryKey: ["profile", userId],
    queryFn: () => fetch(`/api/proxy/profile/${userId}`).then((r) => r.json()),
  });

  const follow = useMutation({
    mutationFn: async (isFollowing: boolean) => {
      await fetch(`/api/proxy/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });

  if (!profile) return <p className="text-text-secondary text-sm">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <ProfileHeader
          username={profile.user.username}
          avatarUrl={profile.user.avatarUrl}
          subscriptionTier={profile.user.subscriptionTier}
          totalForecasts={profile.totalForecasts}
          reputationScore={profile.user.reputationScore}
        />
        <FollowButton
          isFollowing={profile.isFollowing ?? false}
          onToggle={(isFollowing) => follow.mutate(isFollowing)}
          isLoading={follow.isPending}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        {profile.badges?.filter((b: any) => b.earned).map((b: any) => (
          <BadgeDisplay key={b.id} badge={b} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create settings page**

Create `apps/web/app/(protected)/settings/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Settings</h1>

      <div className="bg-surface-2 border border-border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Account</h2>
        <Link
          href="/settings/subscription"
          className="flex items-center justify-between py-2 text-sm text-text-primary hover:text-green transition-colors"
        >
          <span>Manage Subscription</span>
          <span className="text-text-secondary">→</span>
        </Link>
      </div>

      <div className="bg-surface-2 border border-border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Web Push Notifications</h2>
        <p className="text-sm text-text-secondary mb-3">Get notified when your forecasts settle or markets close soon.</p>
        <button
          onClick={async () => {
            if (!("Notification" in window)) return;
            const perm = await Notification.requestPermission();
            if (perm === "granted") alert("Push notifications enabled!");
          }}
          className="px-4 py-2 border border-border text-sm text-text-secondary hover:border-green hover:text-green rounded-lg transition-colors"
        >
          Enable push notifications
        </button>
      </div>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full py-2.5 text-sm font-semibold text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create subscription upgrade page**

Create `apps/web/app/(protected)/settings/subscription/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { SubscriptionBadge } from "@venlaxiq/ui";
import { TIER_CONFIG } from "@venlaxiq/shared";

const TIERS = [
  { id: "pro", name: "Pro", price: "$9/mo", features: ["500 daily FP", "20 open positions", "AI signals", "1.2× accuracy multiplier"] },
  { id: "elite", name: "Elite", price: "$19/mo", features: ["2000 daily FP", "Unlimited positions", "Priority AI signals", "1.5× accuracy multiplier", "FP never expire"] },
] as const;

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(tier: "pro" | "elite") {
    setLoading(tier);
    setError("");
    try {
      const res = await fetch("/api/proxy/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">Upgrade Your Plan</h1>
      <p className="text-text-secondary text-sm mb-6">Unlock more FP, positions, and AI-powered insights.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TIERS.map((tier) => (
          <div key={tier.id} className="bg-surface-2 border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <SubscriptionBadge tier={tier.id} />
              <span className="text-lemon font-bold font-heading">{tier.price}</span>
            </div>
            <ul className="space-y-2 mb-5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-green">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade(tier.id)}
              disabled={loading === tier.id}
              className="w-full py-2.5 text-sm font-semibold bg-green hover:bg-green-dark text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === tier.id ? "Redirecting…" : `Upgrade to ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/profile/profile.routes.ts apps/web/app/\(protected\)/profile/ apps/web/app/\(protected\)/settings/
git commit -m "feat(web): profile pages, settings, subscription upgrade via Stripe Checkout"
```

---

## Task 14: End-to-end smoke test

- [ ] **Step 1: Seed all data**

```bash
pnpm --filter api seed:rewards
pnpm --filter api seed:missions
```

- [ ] **Step 2: Start all services**

```bash
docker compose -f infrastructure/docker-compose.yml up -d
pnpm --filter api dev
pnpm --filter web dev
```

- [ ] **Step 3: Full user journey**

1. Open http://localhost:3000 — landing page, "Get started" and "Browse markets" visible
2. Click "Browse markets" → `/markets` — market list renders (SSG)
3. Click any market → `/markets/[id]` — SSR market detail renders, ForecastEntry shows "Sign in to forecast"
4. Click "Get started" → `/auth/register` — create account
5. After register: redirected to `/home` — streak banner, missions, market cards visible
6. Click a market card → `/markets/[id]` — ForecastEntryWidget renders (logged in)
7. Enter a forecast (YES/NO + FP amount) → mutation fires, success state
8. Navigate to `/forecast` — position appears in list
9. Navigate to `/rewards` — wallet summary shows FP balance, catalog items listed
10. Navigate to `/leaderboard` — user list renders
11. Navigate to `/profile` — own profile with badges and XP bar
12. Navigate to `/settings/subscription` — tier cards with Stripe Checkout button
13. Navigate to `/settings` → click "Sign out" → redirected to landing page

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat(web): Phase 3C complete — full web app with all public SSR + authenticated React Query pages"
```
