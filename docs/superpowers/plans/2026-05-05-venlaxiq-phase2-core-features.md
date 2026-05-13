# VenlaxIQ — Phase 2: Core Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Forecast Engine (LMSR pricing, market lifecycle, WebSocket), Review Engine (submission + AI trust scoring), AI Insight Signal pipeline, Push Notifications, and daily FP earn events — delivering the core interactive product on top of the Plan 1 foundation.

**Architecture:** All modules follow the established Fastify modular monolith pattern. Forecast entries are transactional (Drizzle `db.transaction`). Real-time probability updates use `@fastify/websocket`. AI jobs run in BullMQ workers via the existing `aiQueue`, `settlementQueue`, and `notificationQueue`. Claude Haiku is used for review scoring; Claude Sonnet for insight signals.

**Tech Stack:** Drizzle ORM transactions, `@fastify/websocket`, BullMQ workers, `@anthropic-ai/sdk` (claude-haiku-4-5-20251001 + claude-sonnet-4-6), HuggingFace Inference API, MinIO SDK, `@parse/node-apn`, `firebase-admin`, Vitest, TypeScript

> **Plan scope:** This is Plan 2 of 3.
> - Plan 1 (done): Monorepo scaffold, infrastructure, auth, subscriptions, FP ledger, design system
> - Plan 2 (this): Forecast engine, review engine, AI service, notifications
> - Plan 3: Rewards marketplace, gamification, admin panel, B2B accounts, mobile/web UI, launch

---

## Terminology Blacklist (enforced throughout all code + comments)

| Banned | Use Instead |
|---|---|
| stake / wager | FP deployed |
| payout | FP earned |
| bet / trade | forecast entry |
| odds | probability estimate |
| winnings | earned FP |
| Win Multiplier | Accuracy Multiplier |

---

## File Map

```
New files:
packages/shared/
  src/lmsr.ts                         — LMSR pricing math (pure functions, no I/O)
  tests/lmsr.test.ts                  — pure math tests, no DB required

apps/api/
  src/modules/markets/
    markets.schema.ts                 — Zod validation for market CRUD
    markets.service.ts                — createMarket, listMarkets, getMarket, changeMarketStatus
    markets.routes.ts                 — GET /markets, GET /markets/:id, POST /markets, PATCH status
    settle.service.ts                 — resolveMarket, settleMarket (awards FP to winners)
  src/modules/forecast/
    forecast.schema.ts                — Zod validation for entry and withdrawal
    forecast.service.ts               — enterForecast (atomic tx), getPositions, withdrawForecast
    forecast.routes.ts                — POST /forecast/enter, GET /forecast/positions, POST /forecast/:id/withdraw
  src/plugins/
    websocket.ts                      — @fastify/websocket setup + probability broadcast helper
  src/modules/reviews/
    reviews.schema.ts                 — Zod validation for review submission and vote
    minio.ts                          — MinIO client + uploadReceipt helper
    reviews.service.ts                — submitReview, getProductReviews, voteHelpful
    reviews.routes.ts                 — POST /reviews, GET /reviews/product/:id, POST /reviews/:id/vote
  src/modules/ai/
    claude.ts                         — Anthropic SDK singleton
    review-scorer.ts                  — scoreReview (0–100 trust score via Claude Haiku)
    insight.service.ts                — generateInsightSignal, storeSignal, getLatestSignal
  src/modules/notifications/
    notifications.service.ts          — queueNotification, sendPush (APNs + FCM)
    notifications.routes.ts           — POST /notifications/register-token
  src/modules/auth/
    daily-login.service.ts            — claimDailyLogin with streak multiplier
    daily-login.routes.ts             — POST /auth/daily-login
  src/jobs/
    settlement.worker.ts              — processes settlementQueue items
    ai.worker.ts                      — processes aiQueue items (review scoring)
    insight.worker.ts                 — 6-hour BullMQ repeatable job (AI signal generation)
    notifications.worker.ts           — processes notificationQueue items
    worker-registry.ts                — starts all workers (imported by index.ts)
  tests/
    markets.test.ts
    forecast.test.ts
    settlement.test.ts
    reviews.test.ts
    ai-scorer.test.ts
    notifications.test.ts
    daily-login.test.ts

Modified files:
  apps/api/package.json               — add @fastify/websocket, @anthropic-ai/sdk, minio, @parse/node-apn, firebase-admin
  apps/api/src/db/schema.ts           — add qYes/qNo to markets; loginStreak/lastLoginDate to users; push_tokens + ai_insight_signals tables
  packages/shared/src/index.ts        — re-export from lmsr.ts
  packages/shared/tsconfig.json       — add tests/ to include
  apps/api/src/app.ts                 — register 6 new route modules + websocket plugin
  apps/api/src/index.ts               — import worker-registry
  infrastructure/.env.example         — add ANTHROPIC_API_KEY, HF_API_KEY, NEWSAPI_KEY, MINIO_*, APNS_*, FCM_*
```

---

## Task 1: Schema Additions + LMSR Math Engine

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/db/schema.ts`
- Modify: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/lmsr.ts`
- Create: `packages/shared/tests/lmsr.test.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `infrastructure/.env.example`

- [ ] **Step 1: Add new api dependencies to `apps/api/package.json`**

In the `dependencies` object, add:

```json
"@anthropic-ai/sdk": "^0.26.0",
"@fastify/websocket": "^10.0.0",
"firebase-admin": "^12.0.0",
"minio": "^8.0.0"
```

In the `devDependencies` object, add:

```json
"@parse/node-apn": "^4.0.0"
```

The full `apps/api/package.json` `dependencies` section after modification:

```json
{
  "name": "api",
  "version": "0.1.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.26.0",
    "@fastify/cors": "^9.0.0",
    "@fastify/jwt": "^8.0.0",
    "@fastify/rate-limit": "^9.0.0",
    "@fastify/websocket": "^10.0.0",
    "@venlaxiq/shared": "workspace:*",
    "bullmq": "^5.0.0",
    "drizzle-orm": "^0.30.0",
    "fastify": "^4.27.0",
    "firebase-admin": "^12.0.0",
    "ioredis": "^5.3.0",
    "minio": "^8.0.0",
    "pg": "^8.11.0",
    "stripe": "^15.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@parse/node-apn": "^4.0.0",
    "@types/pg": "^8.11.0",
    "drizzle-kit": "^0.21.0",
    "supertest": "^7.0.0",
    "tsx": "^4.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Update `packages/shared/tsconfig.json` to include tests**

Replace `"include": ["src"]` with `"include": ["src", "tests"]`.

Full file:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Write failing LMSR tests**

Create directory `packages/shared/tests/` then create `packages/shared/tests/lmsr.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { lmsrCost, lmsrProbability, lmsrSharesForFp } from "../src/lmsr";

describe("LMSR pricing engine", () => {
  const b = 100;

  it("initial probability is 50% when no shares exist", () => {
    expect(lmsrProbability(b, 0, 0)).toBeCloseTo(0.5, 5);
  });

  it("buying Yes shares increases Yes probability", () => {
    const before = lmsrProbability(b, 0, 0);
    const after = lmsrProbability(b, 50, 0);
    expect(after).toBeGreaterThan(before);
  });

  it("cost to buy shares is positive and grows with quantity", () => {
    const cost10 = lmsrCost(b, 0, 0, 10, "yes");
    const cost20 = lmsrCost(b, 0, 0, 20, "yes");
    expect(cost10).toBeGreaterThan(0);
    expect(cost20).toBeGreaterThan(cost10);
  });

  it("lmsrSharesForFp: actual cost is within fpAmount", () => {
    const shares = lmsrSharesForFp(b, 0, 0, 1000, "yes");
    const cost = lmsrCost(b, 0, 0, shares, "yes");
    expect(shares).toBeGreaterThan(0);
    expect(cost).toBeLessThanOrEqual(1000);
  });

  it("lmsrSharesForFp: buying one more share would exceed fpAmount", () => {
    const shares = lmsrSharesForFp(b, 0, 0, 1000, "yes");
    const costOneMore = lmsrCost(b, 0, 0, shares + 1, "yes");
    expect(costOneMore).toBeGreaterThan(1000);
  });

  it("probability stays within (0, 1) at extreme share counts", () => {
    expect(lmsrProbability(b, 10000, 0)).toBeLessThan(1);
    expect(lmsrProbability(b, 0, 10000)).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Run lmsr tests to verify they fail**

```bash
cd packages/shared && pnpm test
```

Expected: FAIL — `Cannot find module '../src/lmsr'`

- [ ] **Step 5: Write `packages/shared/src/lmsr.ts`**

```typescript
export function lmsrCost(
  b: number,
  qYes: number,
  qNo: number,
  shares: number,
  side: "yes" | "no"
): number {
  const before = b * Math.log(Math.exp(qYes / b) + Math.exp(qNo / b));
  const newQYes = side === "yes" ? qYes + shares : qYes;
  const newQNo = side === "no" ? qNo + shares : qNo;
  const after = b * Math.log(Math.exp(newQYes / b) + Math.exp(newQNo / b));
  return after - before;
}

export function lmsrProbability(b: number, qYes: number, qNo: number): number {
  const eYes = Math.exp(qYes / b);
  const eNo = Math.exp(qNo / b);
  return eYes / (eYes + eNo);
}

// Binary search: max shares buyable for fpAmount at current market state
export function lmsrSharesForFp(
  b: number,
  qYes: number,
  qNo: number,
  fpAmount: number,
  side: "yes" | "no"
): number {
  let lo = 1;
  let hi = fpAmount; // at most fpAmount shares (price floor is 1 FP)
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (lmsrCost(b, qYes, qNo, mid, side) <= fpAmount) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(1, lo);
}
```

- [ ] **Step 6: Run lmsr tests to verify they pass**

```bash
cd packages/shared && pnpm test
```

Expected: PASS — 6 lmsr tests

- [ ] **Step 7: Export LMSR from `packages/shared/src/index.ts`**

Add at the end of `packages/shared/src/index.ts`:

```typescript
export * from "./lmsr";
```

Full file after modification:

```typescript
export type SubscriptionTier = "free" | "pro" | "elite";

export const TIER_CONFIG: Record<SubscriptionTier, {
  dailyForecastFp: number;
  maxOpenPositions: number;
  accuracyMultiplier: number;
  monthlyBonusFp: number;
  aiSignalsPerDay: number;
  fpExpiryDays: number;
  stripePriceId: string | null;
}> = {
  free: {
    dailyForecastFp: 500,
    maxOpenPositions: 5,
    accuracyMultiplier: 1.0,
    monthlyBonusFp: 0,
    aiSignalsPerDay: 0,
    fpExpiryDays: 60,
    stripePriceId: null,
  },
  pro: {
    dailyForecastFp: 2000,
    maxOpenPositions: 15,
    accuracyMultiplier: 1.25,
    monthlyBonusFp: 5000,
    aiSignalsPerDay: 3,
    fpExpiryDays: 90,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder",
  },
  elite: {
    dailyForecastFp: 6000,
    maxOpenPositions: 50,
    accuracyMultiplier: 1.75,
    monthlyBonusFp: 20000,
    aiSignalsPerDay: 10,
    fpExpiryDays: 180,
    stripePriceId: process.env.STRIPE_ELITE_PRICE_ID ?? "price_elite_placeholder",
  },
};

export * from "./lmsr";
```

- [ ] **Step 8: Add new columns and tables to `apps/api/src/db/schema.ts`**

Read the current `schema.ts`. Make the following additions:

**In the `users` table**, add two fields after `isBanned`:

```typescript
  loginStreak: integer("login_streak").notNull().default(0),
  lastLoginDate: varchar("last_login_date", { length: 10 }), // YYYY-MM-DD
```

**In the `markets` table**, add two fields after `lmsrLiquidity`:

```typescript
  qYes: integer("q_yes").notNull().default(0), // LMSR Yes shares outstanding
  qNo: integer("q_no").notNull().default(0),   // LMSR No shares outstanding
```

**At the end of the file**, add two new tables:

```typescript
// ─── Push Tokens ─────────────────────────────────────────────────────────────

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 512 }).notNull(),
  platform: varchar("platform", { length: 10 }).notNull(), // "ios" | "android"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("push_tokens_user_idx").on(t.userId),
  tokenIdx: uniqueIndex("push_tokens_token_idx").on(t.token),
}));

// ─── AI Insight Signals ───────────────────────────────────────────────────────

export const aiInsightSignals = pgTable("ai_insight_signals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: uuid("market_id").notNull().references(() => markets.id),
  suggestedProbability: integer("suggested_probability").notNull(), // 1–99
  confidence: integer("confidence").notNull(), // 1–5 stars
  keyFactors: text("key_factors").notNull(), // JSON string of string[]
  sourceUrls: text("source_urls").notNull(), // JSON string of string[]
  sentimentScore: integer("sentiment_score"), // -100 to 100 from HuggingFace
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  marketIdx: index("ai_signals_market_idx").on(t.marketId),
  marketCreatedIdx: index("ai_signals_market_created_idx").on(t.marketId, t.createdAt),
}));
```

- [ ] **Step 9: Add new env vars to `infrastructure/.env.example`**

Append to the file:

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# HuggingFace Inference API
HF_API_KEY=hf_...

# NewsAPI (for AI insight signal headline fetch)
NEWSAPI_KEY=...

# MinIO (S3-compatible)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_BUCKET=venlaxiq-receipts

# APNs (iOS push notifications)
APNS_KEY_PATH=/run/secrets/apns.p8
APNS_KEY_ID=XXXXXXXXXX
APNS_TEAM_ID=XXXXXXXXXX
APNS_BUNDLE_ID=com.venlaxiq

# FCM (Android push notifications)
FCM_PROJECT_ID=venlaxiq-prod
FCM_CLIENT_EMAIL=firebase-adminsdk@venlaxiq-prod.iam.gserviceaccount.com
FCM_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...

# Test DB
TEST_DATABASE_URL=postgresql://test:test@localhost:5433/venlaxiq_test
```

- [ ] **Step 10: Commit**

```bash
git add apps/api/package.json apps/api/src/db/schema.ts \
        packages/shared/src/ packages/shared/tests/ packages/shared/tsconfig.json \
        infrastructure/.env.example
git commit -m "feat: add LMSR math engine, schema additions (qYes/qNo, push_tokens, ai_insight_signals, login_streak)"
```

---

## Task 2: Market Module (Admin CRUD + Status Machine)

**Files:**
- Create: `apps/api/src/modules/markets/markets.schema.ts`
- Create: `apps/api/src/modules/markets/markets.service.ts`
- Create: `apps/api/src/modules/markets/markets.routes.ts`
- Create: `apps/api/tests/markets.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write failing market tests**

Create `apps/api/tests/markets.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users } from "../src/db/schema";

describe("Markets", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    // Create an admin user and get token
    const res = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "admin@venlaxiq.com", username: "adminuser", password: "Admin123!" },
    });
    adminToken = JSON.parse(res.body).token;
  });

  afterAll(async () => { await app.close(); await closeDb(); });
  beforeEach(async () => { await resetDb(); });

  describe("POST /markets (admin create)", () => {
    it("creates a market and returns it with status draft", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/markets",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: "Will the Celtics win the 2026 NBA Championship?",
          description: "Resolves Yes if the Boston Celtics win the 2026 NBA Championship.",
          category: "sports",
          resolutionCriteria: "Official NBA.com championship page shows Celtics as winner.",
          resolutionSource: "https://www.nba.com/standings",
          closesAt: "2026-06-15T04:00:00Z",
          resolvesAt: "2026-06-16T04:00:00Z",
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.status).toBe("draft");
      expect(body.title).toBe("Will the Celtics win the 2026 NBA Championship?");
      expect(body.qYes).toBe(0);
      expect(body.qNo).toBe(0);
    });

    it("returns 400 for missing required fields", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/markets",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { title: "Incomplete market" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /markets", () => {
    it("returns empty list when no open markets exist", async () => {
      const res = await app.inject({ method: "GET", url: "/markets" });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual([]);
    });
  });

  describe("PATCH /markets/:id/status", () => {
    it("transitions market from draft to open", async () => {
      const createRes = await app.inject({
        method: "POST",
        url: "/markets",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: "Test Market",
          description: "Test",
          category: "sports",
          resolutionCriteria: "Test criteria",
          resolutionSource: "https://example.com",
          closesAt: "2026-06-15T04:00:00Z",
          resolvesAt: "2026-06-16T04:00:00Z",
        },
      });
      const marketId = JSON.parse(createRes.body).id;

      const patchRes = await app.inject({
        method: "PATCH",
        url: `/markets/${marketId}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: "open" },
      });
      expect(patchRes.statusCode).toBe(200);
      expect(JSON.parse(patchRes.body).status).toBe("open");
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/markets.test.ts
```

Expected: FAIL — `Cannot find module` or routes not registered

- [ ] **Step 3: Write `apps/api/src/modules/markets/markets.schema.ts`**

```typescript
import { z } from "zod";

export const createMarketSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20),
  category: z.enum(["sports", "politics", "open"]),
  resolutionCriteria: z.string().min(10),
  resolutionSource: z.string().url(),
  closesAt: z.string().datetime(),
  resolvesAt: z.string().datetime(),
  lmsrLiquidity: z.number().int().min(50).max(1000).default(100),
  listingFeePaid: z.boolean().default(false),
});

export const changeStatusSchema = z.object({
  status: z.enum(["draft", "open", "closed", "resolved", "settled"]),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;
```

- [ ] **Step 4: Write `apps/api/src/modules/markets/markets.service.ts`**

```typescript
import { db } from "../../db";
import { markets } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { CreateMarketInput } from "./markets.schema";

export async function createMarket(input: CreateMarketInput & { creatorId?: string }) {
  const [market] = await db.insert(markets).values({
    title: input.title,
    description: input.description,
    category: input.category,
    resolutionCriteria: input.resolutionCriteria,
    resolutionSource: input.resolutionSource,
    closesAt: new Date(input.closesAt),
    resolvesAt: new Date(input.resolvesAt),
    lmsrLiquidity: input.lmsrLiquidity ?? 100,
    listingFeePaid: input.listingFeePaid ?? false,
    creatorId: input.creatorId ?? null,
    status: "draft",
  }).returning();
  return market;
}

export async function listMarkets(status?: string) {
  if (status) {
    return db.query.markets.findMany({
      where: eq(markets.status, status as any),
      orderBy: (m, { asc }) => [asc(m.closesAt)],
    });
  }
  return db.query.markets.findMany({
    where: eq(markets.status, "open"),
    orderBy: (m, { asc }) => [asc(m.closesAt)],
  });
}

export async function getMarket(id: string) {
  return db.query.markets.findFirst({ where: eq(markets.id, id) });
}

export async function changeMarketStatus(id: string, status: string) {
  const [updated] = await db.update(markets)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(markets.id, id))
    .returning();
  return updated;
}
```

- [ ] **Step 5: Write `apps/api/src/modules/markets/markets.routes.ts`**

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { createMarketSchema, changeStatusSchema } from "./markets.schema";
import { createMarket, listMarkets, getMarket, changeMarketStatus } from "./markets.service";

export async function marketRoutes(app: FastifyInstance) {
  app.get("/markets", async (request, reply) => {
    const { status } = request.query as { status?: string };
    return reply.send(await listMarkets(status));
  });

  app.get("/markets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const market = await getMarket(id);
    if (!market) return reply.code(404).send({ error: "Market not found" });
    return reply.send(market);
  });

  app.post("/markets", { preHandler: [authenticate] }, async (request, reply) => {
    const result = createMarketSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      const { sub } = request.user as { sub: string };
      const market = await createMarket({ ...result.data, creatorId: sub });
      return reply.code(201).send(market);
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.patch("/markets/:id/status", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = changeStatusSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const market = await changeMarketStatus(id, result.data.status);
    if (!market) return reply.code(404).send({ error: "Market not found" });
    return reply.send(market);
  });
}
```

- [ ] **Step 6: Register market routes in `apps/api/src/app.ts`**

Add import at top:

```typescript
import { marketRoutes } from "./modules/markets/markets.routes";
```

Add before `return app;`:

```typescript
  await app.register(marketRoutes);
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd apps/api && pnpm test tests/markets.test.ts
```

Expected: PASS — 4 market tests

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/markets/markets.schema.ts \
        apps/api/src/modules/markets/markets.service.ts \
        apps/api/src/modules/markets/markets.routes.ts \
        apps/api/tests/markets.test.ts \
        apps/api/src/app.ts
git commit -m "feat: add market module — CRUD + status machine (draft → open → closed → resolved → settled)"
```

---

## Task 3: Forecast Entry + Position Tracking

**Files:**
- Create: `apps/api/src/modules/forecast/forecast.schema.ts`
- Create: `apps/api/src/modules/forecast/forecast.service.ts`
- Create: `apps/api/src/modules/forecast/forecast.routes.ts`
- Create: `apps/api/tests/forecast.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write failing forecast tests**

Create `apps/api/tests/forecast.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users, markets, fpLedger } from "../src/db/schema";

describe("Forecast Entry", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userToken: string;
  let userId: string;
  let marketId: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });

  afterAll(async () => { await app.close(); await closeDb(); });

  beforeEach(async () => {
    await resetDb();

    // Register user
    const regRes = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "forecaster@example.com", username: "forecaster", password: "Pass123!" },
    });
    const regBody = JSON.parse(regRes.body);
    userToken = regBody.token;
    userId = regBody.user.id;

    // Seed 1000 daily_forecast FP for user
    await testDb.insert(fpLedger).values({
      userId,
      poolType: "daily_forecast",
      amount: 1000,
      reason: "daily_allocation",
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Create an open market
    const [mkt] = await testDb.insert(markets).values({
      title: "Will the Eagles win Super Bowl LXI?",
      description: "Resolves Yes if Eagles win.",
      category: "sports",
      status: "open",
      resolutionCriteria: "Official NFL result",
      resolutionSource: "https://www.nfl.com",
      closesAt: new Date(Date.now() + 86400000),
      resolvesAt: new Date(Date.now() + 90000000),
      lmsrLiquidity: 100,
      qYes: 0,
      qNo: 0,
    }).returning({ id: markets.id });
    marketId = mkt.id;
  });

  it("enters a forecast entry on Yes side and debits FP", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/forecast/enter",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { marketId, side: "yes", fpAmount: 500 },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.fpDeployed).toBe(500);
    expect(body.shares).toBeGreaterThan(0);
    expect(body.side).toBe(true);
  });

  it("returns 400 when fpAmount below minimum (50 FP)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/forecast/enter",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { marketId, side: "yes", fpAmount: 10 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 409 when insufficient FP balance", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/forecast/enter",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { marketId, side: "yes", fpAmount: 5000 },
    });
    expect(res.statusCode).toBe(409);
  });

  it("gets user's open forecast positions", async () => {
    await app.inject({
      method: "POST",
      url: "/forecast/enter",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { marketId, side: "yes", fpAmount: 200 },
    });
    const res = await app.inject({
      method: "GET",
      url: "/forecast/positions",
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    const positions = JSON.parse(res.body);
    expect(positions).toHaveLength(1);
    expect(positions[0].marketId).toBe(marketId);
  });

  it("withdraws a forecast position and returns FP", async () => {
    const enterRes = await app.inject({
      method: "POST",
      url: "/forecast/enter",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { marketId, side: "yes", fpAmount: 300 },
    });
    const positionId = JSON.parse(enterRes.body).id;

    const withdrawRes = await app.inject({
      method: "POST",
      url: `/forecast/${positionId}/withdraw`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(withdrawRes.statusCode).toBe(200);
    expect(JSON.parse(withdrawRes.body).isWithdrawn).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/forecast.test.ts
```

Expected: FAIL — routes not registered

- [ ] **Step 3: Write `apps/api/src/modules/forecast/forecast.schema.ts`**

```typescript
import { z } from "zod";

export const enterForecastSchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(["yes", "no"]),
  fpAmount: z.number().int().min(50, "Minimum forecast entry is 50 FP"),
});

export type EnterForecastInput = z.infer<typeof enterForecastSchema>;
```

- [ ] **Step 4: Write `apps/api/src/modules/forecast/forecast.service.ts`**

```typescript
import { db } from "../../db";
import { markets, forecastPositions, fpLedger, users } from "../../db/schema";
import { eq, and, sum, isNull, or, gt, sql } from "drizzle-orm";
import { lmsrCost, lmsrProbability, lmsrSharesForFp } from "@venlaxiq/shared";
import { TIER_CONFIG, SubscriptionTier } from "@venlaxiq/shared";
import type { EnterForecastInput } from "./forecast.schema";

export async function enterForecast(userId: string, input: EnterForecastInput) {
  return db.transaction(async (tx) => {
    // 1. Get market
    const market = await tx.query.markets.findFirst({
      where: eq(markets.id, input.marketId),
    });
    if (!market) throw { statusCode: 404, message: "Market not found" };
    if (market.status !== "open") throw { statusCode: 409, message: "Market is not open for forecast entries" };

    // 2. Get user tier for position limit check
    const user = await tx.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw { statusCode: 404, message: "User not found" };
    const tierConfig = TIER_CONFIG[user.subscriptionTier as SubscriptionTier];

    // 3. Check open position count
    const openPositions = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(forecastPositions)
      .where(and(
        eq(forecastPositions.userId, userId),
        eq(forecastPositions.isWithdrawn, false),
        eq(forecastPositions.isSettled, false),
      ));
    if ((openPositions[0]?.count ?? 0) >= tierConfig.maxOpenPositions) {
      throw { statusCode: 409, message: `Open position limit reached (${tierConfig.maxOpenPositions} for your tier)` };
    }

    // 4. Check daily_forecast FP balance
    const now = sql`NOW()`;
    const balanceRows = await tx
      .select({ total: sum(fpLedger.amount).mapWith(Number) })
      .from(fpLedger)
      .where(and(
        eq(fpLedger.userId, userId),
        eq(fpLedger.poolType, "daily_forecast"),
        or(isNull(fpLedger.expiresAt), gt(fpLedger.expiresAt, now)),
      ));
    const balance = balanceRows[0]?.total ?? 0;
    if (balance < input.fpAmount) {
      throw { statusCode: 409, message: "Insufficient FP balance" };
    }

    // 5. Compute shares via LMSR
    const b = market.lmsrLiquidity;
    const shares = lmsrSharesForFp(b, market.qYes, market.qNo, input.fpAmount, input.side);
    const priceAtEntry = Math.round(lmsrProbability(b, market.qYes, market.qNo) * 100);

    // 6. Debit FP from daily_forecast pool
    await tx.insert(fpLedger).values({
      userId,
      poolType: "daily_forecast",
      amount: -input.fpAmount,
      reason: "forecast_deployed",
      referenceId: input.marketId,
      expiresAt: null,
    });

    // 7. Create position
    const [position] = await tx.insert(forecastPositions).values({
      userId,
      marketId: input.marketId,
      side: input.side === "yes",
      shares,
      fpDeployed: input.fpAmount,
      priceAtEntry,
    }).returning();

    // 8. Update market LMSR state
    const newQYes = input.side === "yes" ? market.qYes + shares : market.qYes;
    const newQNo = input.side === "no" ? market.qNo + shares : market.qNo;
    await tx.update(markets)
      .set({ qYes: newQYes, qNo: newQNo, updatedAt: new Date() })
      .where(eq(markets.id, input.marketId));

    return position;
  });
}

export async function getPositions(userId: string) {
  return db.query.forecastPositions.findMany({
    where: and(
      eq(forecastPositions.userId, userId),
      eq(forecastPositions.isWithdrawn, false),
      eq(forecastPositions.isSettled, false),
    ),
  });
}

export async function withdrawForecast(positionId: string, userId: string) {
  return db.transaction(async (tx) => {
    const position = await tx.query.forecastPositions.findFirst({
      where: and(eq(forecastPositions.id, positionId), eq(forecastPositions.userId, userId)),
    });
    if (!position) throw { statusCode: 404, message: "Position not found" };
    if (position.isWithdrawn) throw { statusCode: 409, message: "Position already withdrawn" };
    if (position.isSettled) throw { statusCode: 409, message: "Position already settled" };

    const market = await tx.query.markets.findFirst({ where: eq(markets.id, position.marketId) });
    if (!market) throw { statusCode: 404, message: "Market not found" };
    if (market.status !== "open") throw { statusCode: 409, message: "Market is not open for withdrawals" };

    // Current withdrawal value: shares × current probability × 100, minus 1 FP platform allocation per share
    const b = market.lmsrLiquidity;
    const side = position.side ? "yes" : "no";
    const currentProb = position.side
      ? lmsrProbability(b, market.qYes, market.qNo)
      : 1 - lmsrProbability(b, market.qYes, market.qNo);
    const grossReturn = Math.round(position.shares * currentProb * 100);
    const platformAllocation = position.shares; // 1 FP per share
    const netReturn = Math.max(0, grossReturn - platformAllocation);

    // Credit withdrawal return to earned pool
    if (netReturn > 0) {
      await tx.insert(fpLedger).values({
        userId,
        poolType: "earned",
        amount: netReturn,
        reason: "forecast_withdrawn",
        referenceId: positionId,
        expiresAt: new Date(Date.now() + 90 * 86400000), // 90 days
      });
    }

    // Update market LMSR state (remove shares from pool)
    const newQYes = side === "yes" ? market.qYes - position.shares : market.qYes;
    const newQNo = side === "no" ? market.qNo - position.shares : market.qNo;
    await tx.update(markets)
      .set({ qYes: Math.max(0, newQYes), qNo: Math.max(0, newQNo), updatedAt: new Date() })
      .where(eq(markets.id, position.marketId));

    // Mark position withdrawn
    const [updated] = await tx.update(forecastPositions)
      .set({ isWithdrawn: true })
      .where(eq(forecastPositions.id, positionId))
      .returning();

    return updated;
  });
}
```

- [ ] **Step 5: Write `apps/api/src/modules/forecast/forecast.routes.ts`**

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { enterForecastSchema } from "./forecast.schema";
import { enterForecast, getPositions, withdrawForecast } from "./forecast.service";

export async function forecastRoutes(app: FastifyInstance) {
  app.post("/forecast/enter", { preHandler: [authenticate] }, async (request, reply) => {
    const result = enterForecastSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const { sub } = request.user as { sub: string };
    try {
      const position = await enterForecast(sub, result.data);
      return reply.code(201).send(position);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.get("/forecast/positions", { preHandler: [authenticate] }, async (request, reply) => {
    const { sub } = request.user as { sub: string };
    return reply.send(await getPositions(sub));
  });

  app.post("/forecast/:id/withdraw", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { sub } = request.user as { sub: string };
    try {
      const position = await withdrawForecast(id, sub);
      return reply.send(position);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
```

- [ ] **Step 6: Register forecast routes in `apps/api/src/app.ts`**

Add import:

```typescript
import { forecastRoutes } from "./modules/forecast/forecast.routes";
```

Add before `return app;`:

```typescript
  await app.register(forecastRoutes);
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd apps/api && pnpm test tests/forecast.test.ts
```

Expected: PASS — 5 forecast tests

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/forecast/ apps/api/tests/forecast.test.ts apps/api/src/app.ts
git commit -m "feat: add forecast entry module — LMSR pricing, transactional FP debit, position tracking, withdrawal"
```

---

## Task 4: Market Settlement Worker

**Files:**
- Create: `apps/api/src/modules/markets/settle.service.ts`
- Create: `apps/api/src/jobs/settlement.worker.ts`
- Create: `apps/api/tests/settlement.test.ts`
- Modify: `apps/api/src/modules/markets/markets.routes.ts` — add resolve endpoint

- [ ] **Step 1: Write failing settlement tests**

Create `apps/api/tests/settlement.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users, markets, forecastPositions, fpLedger } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { settleMarket } from "../src/modules/markets/settle.service";

describe("Market Settlement", () => {
  let userId: string;
  let marketId: string;
  let positionId: string;

  beforeEach(async () => {
    await resetDb();

    const [user] = await testDb.insert(users).values({
      email: "settler@example.com",
      username: "settler",
      subscriptionTier: "pro",
    }).returning({ id: users.id });
    userId = user.id;

    const [market] = await testDb.insert(markets).values({
      title: "Will the Celtics win?",
      description: "Test",
      category: "sports",
      status: "resolved",
      resolutionCriteria: "Test",
      resolutionSource: "https://example.com",
      closesAt: new Date(Date.now() - 1000),
      resolvesAt: new Date(Date.now() - 500),
      resolvedOutcome: true, // Yes wins
      lmsrLiquidity: 100,
      qYes: 20,
      qNo: 0,
    }).returning({ id: markets.id });
    marketId = market.id;

    // User has a Yes position (winning side)
    const [pos] = await testDb.insert(forecastPositions).values({
      userId,
      marketId,
      side: true, // Yes
      shares: 10,
      fpDeployed: 500,
      priceAtEntry: 50,
    }).returning({ id: forecastPositions.id });
    positionId = pos.id;
  });

  afterAll(async () => { await closeDb(); });

  it("credits FP to winning positions and marks them settled", async () => {
    await settleMarket(testDb, marketId);

    const position = await testDb.query.forecastPositions.findFirst({
      where: eq(forecastPositions.id, positionId),
    });
    expect(position?.isSettled).toBe(true);
    // Pro tier: 10 shares × 100 FP × 1.25 multiplier = 1250 FP earned
    expect(position?.fpEarned).toBe(1250);
  });

  it("creates FP ledger entry for earned FP", async () => {
    await settleMarket(testDb, marketId);

    const ledgerEntries = await testDb.query.fpLedger.findMany({
      where: eq(fpLedger.userId, userId),
    });
    const earnEntry = ledgerEntries.find(e => e.reason === "forecast_earned");
    expect(earnEntry).toBeDefined();
    expect(earnEntry?.amount).toBe(1250);
    expect(earnEntry?.poolType).toBe("earned");
  });

  it("marks market as settled after processing all positions", async () => {
    await settleMarket(testDb, marketId);

    const market = await testDb.query.markets.findFirst({
      where: eq(markets.id, marketId),
    });
    expect(market?.status).toBe("settled");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/settlement.test.ts
```

Expected: FAIL — `Cannot find module '../src/modules/markets/settle.service'`

- [ ] **Step 3: Write `apps/api/src/modules/markets/settle.service.ts`**

```typescript
import { eq, and } from "drizzle-orm";
import { markets, forecastPositions, fpLedger, users, auditLog } from "../../db/schema";
import { TIER_CONFIG, SubscriptionTier } from "@venlaxiq/shared";
import type { DB } from "../../db";

export async function settleMarket(db: DB, marketId: string): Promise<void> {
  const market = await db.query.markets.findFirst({ where: eq(markets.id, marketId) });
  if (!market) throw new Error(`Market ${marketId} not found`);
  if (market.status !== "resolved") throw new Error("Market must be in resolved state to settle");
  if (market.resolvedOutcome === null || market.resolvedOutcome === undefined) {
    throw new Error("Market has no resolved outcome");
  }

  const winSide = market.resolvedOutcome; // true = Yes, false = No

  // Get all unsettled positions
  const positions = await db.query.forecastPositions.findMany({
    where: and(
      eq(forecastPositions.marketId, marketId),
      eq(forecastPositions.isSettled, false),
      eq(forecastPositions.isWithdrawn, false),
    ),
  });

  for (const position of positions) {
    const isWinner = position.side === winSide;
    let fpEarned = 0;

    if (isWinner) {
      // Look up user tier for Accuracy Multiplier
      const user = await db.query.users.findFirst({ where: eq(users.id, position.userId) });
      const tier = (user?.subscriptionTier ?? "free") as SubscriptionTier;
      const multiplier = TIER_CONFIG[tier].accuracyMultiplier;
      fpEarned = Math.round(position.shares * 100 * multiplier);

      // Credit earned FP
      const fpExpiryDays = TIER_CONFIG[tier].fpExpiryDays;
      await db.insert(fpLedger).values({
        userId: position.userId,
        poolType: "earned",
        amount: fpEarned,
        reason: "forecast_earned",
        referenceId: position.id,
        expiresAt: new Date(Date.now() + fpExpiryDays * 86400000),
      });
    }

    // Mark position settled
    await db.update(forecastPositions)
      .set({ isSettled: true, fpEarned })
      .where(eq(forecastPositions.id, position.id));
  }

  // Mark market settled
  await db.update(markets)
    .set({ status: "settled", updatedAt: new Date() })
    .where(eq(markets.id, marketId));

  // Audit log
  await db.insert(auditLog).values({
    action: "market_settled",
    targetType: "market",
    targetId: marketId,
    metadata: JSON.stringify({ totalPositions: positions.length, winSide }),
  });
}
```

- [ ] **Step 4: Write `apps/api/src/jobs/settlement.worker.ts`**

Create directory `apps/api/src/jobs/` first.

```typescript
import { Worker } from "bullmq";
import { redisConnection } from "../queue";
import { db } from "../db";
import { settleMarket } from "../modules/markets/settle.service";

export const settlementWorker = new Worker(
  "settlement",
  async (job) => {
    const { marketId } = job.data as { marketId: string };
    await settleMarket(db, marketId);
    return { marketId, settled: true };
  },
  { connection: redisConnection, concurrency: 5 }
);

settlementWorker.on("failed", (job, err) => {
  console.error(`Settlement job failed for market ${job?.data.marketId}:`, err.message);
});
```

- [ ] **Step 5: Add resolve endpoint to `apps/api/src/modules/markets/markets.routes.ts`**

Read the current `markets.routes.ts`. Add this new route before the closing brace of `marketRoutes`:

```typescript
  app.patch("/markets/:id/resolve", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { outcome } = request.body as { outcome: boolean };
    if (typeof outcome !== "boolean") return reply.code(400).send({ error: "outcome must be boolean" });

    const market = await getMarket(id);
    if (!market) return reply.code(404).send({ error: "Market not found" });

    const { db } = await import("../../db");
    const { markets } = await import("../../db/schema");
    const { eq } = await import("drizzle-orm");
    const { settlementQueue } = await import("../../queue");

    const [resolved] = await db.update(markets)
      .set({ status: "resolved", resolvedOutcome: outcome, resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(markets.id, id))
      .returning();

    // Enqueue settlement job
    await settlementQueue.add("settle-market", { marketId: id }, { delay: 1000 });

    return reply.send(resolved);
  });
```

Actually, to avoid dynamic imports, add the needed imports at the top of markets.routes.ts. Here is the complete revised `markets.routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { createMarketSchema, changeStatusSchema } from "./markets.schema";
import { createMarket, listMarkets, getMarket, changeMarketStatus } from "./markets.service";
import { db } from "../../db";
import { markets } from "../../db/schema";
import { eq } from "drizzle-orm";
import { settlementQueue } from "../../queue";

export async function marketRoutes(app: FastifyInstance) {
  app.get("/markets", async (request, reply) => {
    const { status } = request.query as { status?: string };
    return reply.send(await listMarkets(status));
  });

  app.get("/markets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const market = await getMarket(id);
    if (!market) return reply.code(404).send({ error: "Market not found" });
    return reply.send(market);
  });

  app.post("/markets", { preHandler: [authenticate] }, async (request, reply) => {
    const result = createMarketSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      const { sub } = request.user as { sub: string };
      const market = await createMarket({ ...result.data, creatorId: sub });
      return reply.code(201).send(market);
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.patch("/markets/:id/status", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = changeStatusSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const market = await changeMarketStatus(id, result.data.status);
    if (!market) return reply.code(404).send({ error: "Market not found" });
    return reply.send(market);
  });

  app.patch("/markets/:id/resolve", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { outcome } = request.body as { outcome: boolean };
    if (typeof outcome !== "boolean") return reply.code(400).send({ error: "outcome must be boolean" });

    const market = await getMarket(id);
    if (!market) return reply.code(404).send({ error: "Market not found" });

    const [resolved] = await db.update(markets)
      .set({ status: "resolved", resolvedOutcome: outcome, resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(markets.id, id))
      .returning();

    await settlementQueue.add("settle-market", { marketId: id }, { delay: 1000 });

    return reply.send(resolved);
  });
}
```

- [ ] **Step 6: Run settlement tests — verify they pass**

```bash
cd apps/api && pnpm test tests/settlement.test.ts
```

Expected: PASS — 3 settlement tests

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/markets/settle.service.ts \
        apps/api/src/modules/markets/markets.routes.ts \
        apps/api/src/jobs/settlement.worker.ts \
        apps/api/tests/settlement.test.ts
git commit -m "feat: add settlement worker — resolves markets, credits earned FP to winners with tier Accuracy Multiplier"
```

---

## Task 5: WebSocket Real-time Probability Feed

**Files:**
- Create: `apps/api/src/plugins/websocket.ts`
- Create: `apps/api/src/modules/markets/market.broadcaster.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/modules/forecast/forecast.service.ts`

- [ ] **Step 1: Write `apps/api/src/plugins/websocket.ts`**

```typescript
import fp from "fastify-plugin";
import websocket from "@fastify/websocket";
import { FastifyPluginAsync, FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

// marketId → Set of connected WebSocket clients
const subscribers = new Map<string, Set<WebSocket>>();

export function subscribe(marketId: string, ws: WebSocket): void {
  if (!subscribers.has(marketId)) {
    subscribers.set(marketId, new Set());
  }
  subscribers.get(marketId)!.add(ws);
  ws.on("close", () => subscribers.get(marketId)?.delete(ws));
}

export function broadcastProbability(marketId: string, probability: number): void {
  const clients = subscribers.get(marketId);
  if (!clients) return;
  const message = JSON.stringify({ type: "probability_update", marketId, probability });
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  }
}

const websocketPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(websocket);

  app.get("/ws/markets/:id", { websocket: true }, (socket, request) => {
    const { id } = request.params as { id: string };
    subscribe(id, socket);
  });
};

export default fp(websocketPlugin);
```

- [ ] **Step 2: Write `apps/api/src/modules/markets/market.broadcaster.ts`**

```typescript
import { db } from "../../db";
import { markets } from "../../db/schema";
import { eq } from "drizzle-orm";
import { lmsrProbability } from "@venlaxiq/shared";
import { broadcastProbability } from "../../plugins/websocket";

export async function broadcastMarketProbability(marketId: string): Promise<void> {
  const market = await db.query.markets.findFirst({ where: eq(markets.id, marketId) });
  if (!market) return;
  const probability = lmsrProbability(market.lmsrLiquidity, market.qYes, market.qNo);
  broadcastProbability(marketId, Math.round(probability * 100));
}
```

- [ ] **Step 3: Register WebSocket plugin in `apps/api/src/app.ts`**

Add import at top:

```typescript
import websocketPlugin from "./plugins/websocket";
```

Add after `await app.register(cors, ...);` (before rate-limit):

```typescript
  await app.register(websocketPlugin);
```

- [ ] **Step 4: Broadcast probability after each forecast entry**

In `apps/api/src/modules/forecast/forecast.service.ts`, add at the top:

```typescript
import { broadcastMarketProbability } from "../markets/market.broadcaster";
```

In `enterForecast`, after the transaction closes (after `return db.transaction(...)`) add a broadcast call. Change the function to:

```typescript
export async function enterForecast(userId: string, input: EnterForecastInput) {
  const position = await db.transaction(async (tx) => {
    // ... all existing transaction code unchanged ...
    return position;
  });

  // Broadcast new probability outside transaction (non-blocking)
  broadcastMarketProbability(input.marketId).catch(() => {});

  return position;
}
```

- [ ] **Step 5: Verify WebSocket plugin registers (manual check)**

```bash
cd apps/api && pnpm test tests/health.test.ts
```

Expected: PASS — health test still passes with websocket registered

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/plugins/websocket.ts \
        apps/api/src/modules/markets/market.broadcaster.ts \
        apps/api/src/modules/forecast/forecast.service.ts \
        apps/api/src/app.ts
git commit -m "feat: add websocket real-time probability feed — clients subscribe per market, broadcast on each forecast entry"
```

---

## Task 6: Review Submission + MinIO Receipt Upload

**Files:**
- Create: `apps/api/src/modules/reviews/reviews.schema.ts`
- Create: `apps/api/src/modules/reviews/minio.ts`
- Create: `apps/api/src/modules/reviews/reviews.service.ts`
- Create: `apps/api/src/modules/reviews/reviews.routes.ts`
- Create: `apps/api/tests/reviews.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write failing review tests**

Create `apps/api/tests/reviews.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users, products, reviews } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Review Engine", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userToken: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });

  afterAll(async () => { await app.close(); await closeDb(); });

  beforeEach(async () => {
    await resetDb();

    const regRes = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "reviewer@example.com", username: "reviewer", password: "Pass123!" },
    });
    const regBody = JSON.parse(regRes.body);
    userToken = regBody.token;
    userId = regBody.user.id;

    const [prod] = await testDb.insert(products).values({
      name: "Sony WH-1000XM5",
      category: "electronics",
      brand: "Sony",
    }).returning({ id: products.id });
    productId = prod.id;
  });

  describe("POST /reviews", () => {
    it("submits a review and queues AI scoring", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/reviews",
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          productId,
          title: "Outstanding noise cancellation",
          body: "I have been using these headphones for 3 months and the noise cancellation is incredible.",
          rating: 5,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.productId).toBe(productId);
      expect(body.rating).toBe(5);
      expect(body.isPublished).toBe(false); // pending AI scoring
      expect(body.badge).toBe("none");
    });

    it("returns 400 for rating out of range", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/reviews",
        headers: { authorization: `Bearer ${userToken}` },
        payload: { productId, title: "Bad", body: "A review body", rating: 6 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /reviews/product/:id", () => {
    it("returns published reviews for a product", async () => {
      // Manually insert a published review
      await testDb.insert(reviews).values({
        userId,
        productId,
        title: "Great product",
        body: "Loved it.",
        rating: 5,
        isPublished: true,
        badge: "none",
      });

      const res = await app.inject({
        method: "GET",
        url: `/reviews/product/${productId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(1);
      expect(body[0].isPublished).toBe(true);
    });
  });

  describe("POST /reviews/:id/vote", () => {
    it("records a helpful vote on a review", async () => {
      const [review] = await testDb.insert(reviews).values({
        userId,
        productId,
        title: "Good product",
        body: "Works great.",
        rating: 4,
        isPublished: true,
        badge: "none",
      }).returning({ id: reviews.id });

      const res = await app.inject({
        method: "POST",
        url: `/reviews/${review.id}/vote`,
        headers: { authorization: `Bearer ${userToken}` },
        payload: { helpful: true },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).helpfulVotes).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/reviews.test.ts
```

Expected: FAIL — routes not registered

- [ ] **Step 3: Write `apps/api/src/modules/reviews/reviews.schema.ts`**

```typescript
import { z } from "zod";

export const submitReviewSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(5).max(120),
  body: z.string().min(20),
  rating: z.number().int().min(1).max(5),
});

export const voteSchema = z.object({
  helpful: z.boolean(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
```

- [ ] **Step 4: Write `apps/api/src/modules/reviews/minio.ts`**

```typescript
import { Client } from "minio";
import { randomUUID } from "crypto";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ROOT_USER ?? "venlaxiq_admin",
  secretKey: process.env.MINIO_ROOT_PASSWORD ?? "change_me_minio_password",
});

const BUCKET = process.env.MINIO_BUCKET ?? "venlaxiq-receipts";

export async function uploadReceipt(
  fileBuffer: Buffer,
  mimeType: string,
  userId: string
): Promise<string> {
  const ext = mimeType === "application/pdf" ? "pdf" : "jpg";
  const objectName = `receipts/${userId}/${randomUUID()}.${ext}`;

  await minioClient.putObject(BUCKET, objectName, fileBuffer, fileBuffer.length, {
    "Content-Type": mimeType,
  });

  return objectName; // stored path; presigned URL generated on read
}
```

- [ ] **Step 5: Write `apps/api/src/modules/reviews/reviews.service.ts`**

```typescript
import { db } from "../../db";
import { reviews, fpLedger } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { aiQueue } from "../../queue";
import type { SubmitReviewInput } from "./reviews.schema";

export async function submitReview(userId: string, input: SubmitReviewInput) {
  const [review] = await db.insert(reviews).values({
    userId,
    productId: input.productId,
    title: input.title,
    body: input.body,
    rating: input.rating,
    isPublished: false, // pending AI scoring
    badge: "none",
  }).returning();

  // Queue AI trust scoring job
  await aiQueue.add("score-review", { reviewId: review.id, userId });

  return review;
}

export async function getProductReviews(productId: string) {
  return db.query.reviews.findMany({
    where: and(eq(reviews.productId, productId), eq(reviews.isPublished, true)),
    orderBy: (r, { desc }) => [desc(r.helpfulVotes)],
  });
}

export async function voteHelpful(
  reviewId: string,
  userId: string,
  helpful: boolean
): Promise<typeof reviews.$inferSelect> {
  const review = await db.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
  if (!review) throw { statusCode: 404, message: "Review not found" };

  const [updated] = await db.update(reviews)
    .set({
      totalVotes: review.totalVotes + 1,
      helpfulVotes: helpful ? review.helpfulVotes + 1 : review.helpfulVotes,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId))
    .returning();

  // Check for Community Trusted badge: verified + ≥80% helpful + min 10 votes
  if (
    updated.badge === "verified" &&
    updated.totalVotes >= 10 &&
    updated.helpfulVotes / updated.totalVotes >= 0.8
  ) {
    const [withBadge] = await db.update(reviews)
      .set({ badge: "community_trusted" })
      .where(eq(reviews.id, reviewId))
      .returning();

    // Award Community Trusted FP bonus
    await db.insert(fpLedger).values({
      userId: review.userId,
      poolType: "review",
      amount: 1000,
      reason: "review_community_trusted",
      referenceId: reviewId,
      expiresAt: new Date(Date.now() + 90 * 86400000),
    });

    return withBadge;
  }

  return updated;
}
```

- [ ] **Step 6: Write `apps/api/src/modules/reviews/reviews.routes.ts`**

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { submitReviewSchema, voteSchema } from "./reviews.schema";
import { submitReview, getProductReviews, voteHelpful } from "./reviews.service";

export async function reviewRoutes(app: FastifyInstance) {
  app.post("/reviews", { preHandler: [authenticate] }, async (request, reply) => {
    const result = submitReviewSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const { sub } = request.user as { sub: string };
    try {
      const review = await submitReview(sub, result.data);
      return reply.code(201).send(review);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.get("/reviews/product/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await getProductReviews(id));
  });

  app.post("/reviews/:id/vote", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = voteSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const { sub } = request.user as { sub: string };
    try {
      const updated = await voteHelpful(id, sub, result.data.helpful);
      return reply.send(updated);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
```

- [ ] **Step 7: Register review routes in `apps/api/src/app.ts`**

Add import:

```typescript
import { reviewRoutes } from "./modules/reviews/reviews.routes";
```

Add before `return app;`:

```typescript
  await app.register(reviewRoutes);
```

- [ ] **Step 8: Run tests — verify they pass**

```bash
cd apps/api && pnpm test tests/reviews.test.ts
```

Expected: PASS — 4 review tests

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/modules/reviews/ apps/api/tests/reviews.test.ts apps/api/src/app.ts
git commit -m "feat: add review engine — submission, product review list, helpful votes, Community Trusted badge, FP earn"
```

---

## Task 7: Review AI Trust Scoring (Claude API)

**Files:**
- Create: `apps/api/src/modules/ai/claude.ts`
- Create: `apps/api/src/modules/ai/review-scorer.ts`
- Create: `apps/api/src/jobs/ai.worker.ts`
- Create: `apps/api/tests/ai-scorer.test.ts`

- [ ] **Step 1: Write failing AI scorer tests**

Create `apps/api/tests/ai-scorer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users, products, reviews, fpLedger } from "../src/db/schema";
import { eq } from "drizzle-orm";

// Mock Anthropic SDK before importing scorer
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ text: JSON.stringify({ score: 85, flags: [] }) }],
      }),
    };
  },
}));

import { processReviewScoring } from "../src/modules/ai/review-scorer";

describe("Review AI Trust Scoring", () => {
  let userId: string;
  let productId: string;
  let reviewId: string;

  beforeEach(async () => {
    await resetDb();

    const [user] = await testDb.insert(users).values({
      email: "aitest@example.com",
      username: "aitest",
    }).returning({ id: users.id });
    userId = user.id;

    const [prod] = await testDb.insert(products).values({
      name: "Test Product",
      category: "electronics",
    }).returning({ id: products.id });
    productId = prod.id;

    const [rev] = await testDb.insert(reviews).values({
      userId,
      productId,
      title: "Great product",
      body: "I have been using this product for months and love it.",
      rating: 5,
      isPublished: false,
      badge: "none",
    }).returning({ id: reviews.id });
    reviewId = rev.id;
  });

  afterAll(async () => { await closeDb(); });

  it("scores a review and publishes it when trust score >= 70", async () => {
    await processReviewScoring(testDb, reviewId, userId);

    const review = await testDb.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
    expect(review?.aiTrustScore).toBe(85);
    expect(review?.isPublished).toBe(true);
  });

  it("credits FP to user after review is published (unverified: 200 FP)", async () => {
    await processReviewScoring(testDb, reviewId, userId);

    const ledger = await testDb.query.fpLedger.findMany({ where: eq(fpLedger.userId, userId) });
    const fpEntry = ledger.find(e => e.reason === "review_published");
    expect(fpEntry).toBeDefined();
    expect(fpEntry?.amount).toBe(200);
  });

  it("credits 1000 FP for verified reviews (with receipt)", async () => {
    // Update review to have a receipt
    const { db: mainDb } = await import("../src/db");
    await testDb.update(reviews)
      .set({ receiptUrl: "receipts/user/test.jpg" })
      .where(eq(reviews.id, reviewId));

    await processReviewScoring(testDb, reviewId, userId);

    const ledger = await testDb.query.fpLedger.findMany({ where: eq(fpLedger.userId, userId) });
    const fpEntry = ledger.find(e => e.reason === "review_published");
    expect(fpEntry?.amount).toBe(1000);

    const review = await testDb.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
    expect(review?.badge).toBe("verified");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/ai-scorer.test.ts
```

Expected: FAIL — `Cannot find module '../src/modules/ai/review-scorer'`

- [ ] **Step 3: Write `apps/api/src/modules/ai/claude.ts`**

Create directory `apps/api/src/modules/ai/`.

```typescript
import Anthropic from "@anthropic-ai/sdk";

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});
```

- [ ] **Step 4: Write `apps/api/src/modules/ai/review-scorer.ts`**

```typescript
import { eq } from "drizzle-orm";
import { reviews, fpLedger, users } from "../../db/schema";
import { TIER_CONFIG, SubscriptionTier } from "@venlaxiq/shared";
import { claude } from "./claude";
import type { DB } from "../../db";

export async function scoreReviewText(
  title: string,
  body: string,
  productName: string
): Promise<number> {
  const response = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Analyze this product review for authenticity. Score 0–100 (100 = genuine, authentic review).

Product: ${productName}
Title: ${title}
Review: ${body}

Check for: templated language, duplicate patterns, manipulation, incentive-fishing, generic praise with no specifics.

Respond with JSON only: {"score": <number 0-100>, "flags": [<string issues>]}`,
    }],
  });

  const text = (response.content[0] as any).text as string;
  try {
    const parsed = JSON.parse(text);
    return Math.max(0, Math.min(100, Number(parsed.score)));
  } catch {
    return 50; // default to neutral on parse failure
  }
}

export async function processReviewScoring(db: DB, reviewId: string, userId: string): Promise<void> {
  const review = await db.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
  if (!review) return;

  // If review has a product reference, get product name
  const { products } = await import("../../db/schema");
  const product = await db.query.products.findFirst({ where: eq(products.id, review.productId) });
  const productName = product?.name ?? "Unknown product";

  const score = await scoreReviewText(review.title, review.body, productName);

  // Determine badge: verified requires receipt AND score >= 70
  const hasReceipt = !!review.receiptUrl;
  const isHighQuality = score >= 70;
  const badge = hasReceipt && isHighQuality ? "verified" : "none";

  // FP earn: verified = 1000, unverified = 200
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const tier = (user?.subscriptionTier ?? "free") as SubscriptionTier;
  const multiplier = TIER_CONFIG[tier].accuracyMultiplier;
  const baseFp = badge === "verified" ? 1000 : 200;
  const fpToCredit = Math.round(baseFp * multiplier);
  const fpExpiryDays = TIER_CONFIG[tier].fpExpiryDays;

  // Update review
  await db.update(reviews)
    .set({
      aiTrustScore: score,
      badge,
      isPublished: isHighQuality,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId));

  if (isHighQuality) {
    // Credit review FP
    await db.insert(fpLedger).values({
      userId,
      poolType: "review",
      amount: fpToCredit,
      reason: "review_published",
      referenceId: reviewId,
      expiresAt: new Date(Date.now() + fpExpiryDays * 86400000),
    });
  }
}
```

- [ ] **Step 5: Write `apps/api/src/jobs/ai.worker.ts`**

```typescript
import { Worker } from "bullmq";
import { redisConnection } from "../queue";
import { db } from "../db";
import { processReviewScoring } from "../modules/ai/review-scorer";

export const aiWorker = new Worker(
  "ai-processing",
  async (job) => {
    const { reviewId, userId } = job.data as { reviewId: string; userId: string };
    await processReviewScoring(db, reviewId, userId);
    return { reviewId, processed: true };
  },
  { connection: redisConnection, concurrency: 10 }
);

aiWorker.on("failed", (job, err) => {
  console.error(`AI scoring job failed for review ${job?.data.reviewId}:`, err.message);
});
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
cd apps/api && pnpm test tests/ai-scorer.test.ts
```

Expected: PASS — 3 AI scorer tests (Claude is mocked)

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/ai/claude.ts \
        apps/api/src/modules/ai/review-scorer.ts \
        apps/api/src/jobs/ai.worker.ts \
        apps/api/tests/ai-scorer.test.ts
git commit -m "feat: add review AI trust scoring — Claude Haiku, 0-100 score, verified badge, FP earn on publish"
```

---

## Task 8: AI Insight Signal Pipeline

**Files:**
- Create: `apps/api/src/modules/ai/insight.service.ts`
- Create: `apps/api/src/jobs/insight.worker.ts`
- Modify: `apps/api/src/modules/markets/markets.routes.ts` — add GET /markets/:id/insight

- [ ] **Step 1: Write `apps/api/src/modules/ai/insight.service.ts`**

```typescript
import { eq, desc } from "drizzle-orm";
import { aiInsightSignals, markets } from "../../db/schema";
import { claude } from "./claude";
import type { DB } from "../../db";

export async function getLatestSignal(db: DB, marketId: string) {
  return db.query.aiInsightSignals.findFirst({
    where: eq(aiInsightSignals.marketId, marketId),
    orderBy: [desc(aiInsightSignals.createdAt)],
  });
}

async function fetchHeadlines(query: string): Promise<string[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}&pageSize=5&language=en`;
  try {
    const res = await fetch(url);
    const data = await res.json() as any;
    return (data.articles ?? []).map((a: any) => a.title as string).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchSentiment(text: string): Promise<number> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return 0;
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: text.slice(0, 512) }),
      }
    );
    const data = await res.json() as any[];
    // Model returns [{label, score}] for positive/negative/neutral
    const sorted = [...(data[0] ?? [])].sort((a: any, b: any) => b.score - a.score);
    const top = sorted[0];
    if (!top) return 0;
    if (top.label === "LABEL_2") return Math.round(top.score * 100); // positive
    if (top.label === "LABEL_0") return -Math.round(top.score * 100); // negative
    return 0; // neutral
  } catch {
    return 0;
  }
}

export async function generateAndStoreSignal(db: DB, marketId: string): Promise<void> {
  const market = await db.query.markets.findFirst({ where: eq(markets.id, marketId) });
  if (!market || market.status !== "open") return;

  const headlines = await fetchHeadlines(market.title);
  const sentimentScore = headlines.length > 0
    ? await fetchSentiment(headlines.join(". "))
    : 0;

  const headlineContext = headlines.length > 0
    ? `Recent headlines:\n${headlines.map(h => `- ${h}`).join("\n")}`
    : "No recent headlines found.";

  const response = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `You are a forecasting analyst. Analyze this crowd-intelligence question and produce a structured signal.

Question: "${market.title}"
Description: ${market.description}
Resolution criteria: ${market.resolutionCriteria}

${headlineContext}

Based on available public information, provide:
1. A suggested probability estimate (1–99)
2. Confidence level (1–5 stars, where 5 = very high confidence)
3. 3 key factors driving your estimate
4. Up to 3 source URLs (real, publicly accessible)

Note: This is NOT financial advice. For educational purposes only.

Respond with JSON only:
{
  "suggestedProbability": <number 1-99>,
  "confidence": <number 1-5>,
  "keyFactors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "sourceUrls": ["<url1>", "<url2>"]
}`,
    }],
  });

  const text = (response.content[0] as any).text as string;
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return; // don't store if Claude returned malformed JSON
  }

  await db.insert(aiInsightSignals).values({
    marketId,
    suggestedProbability: Math.max(1, Math.min(99, Number(parsed.suggestedProbability))),
    confidence: Math.max(1, Math.min(5, Number(parsed.confidence))),
    keyFactors: JSON.stringify(parsed.keyFactors ?? []),
    sourceUrls: JSON.stringify(parsed.sourceUrls ?? []),
    sentimentScore,
  });
}
```

- [ ] **Step 2: Write `apps/api/src/jobs/insight.worker.ts`**

```typescript
import { Queue, Worker } from "bullmq";
import { redisConnection } from "../queue";
import { db } from "../db";
import { markets } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateAndStoreSignal } from "../modules/ai/insight.service";

const insightQueue = new Queue("insight-generation", { connection: redisConnection });

// Schedule repeatable job every 6 hours
export async function scheduleInsightJobs(): Promise<void> {
  await insightQueue.add(
    "generate-all-signals",
    {},
    {
      repeat: { every: 6 * 60 * 60 * 1000 }, // 6 hours
      jobId: "insight-repeatable",
    }
  );
}

export const insightWorker = new Worker(
  "insight-generation",
  async () => {
    // Get all open markets
    const openMarkets = await db.query.markets.findMany({
      where: eq(markets.status, "open"),
    });

    for (const market of openMarkets) {
      await generateAndStoreSignal(db, market.id);
    }

    return { processed: openMarkets.length };
  },
  { connection: redisConnection, concurrency: 1 }
);

insightWorker.on("failed", (job, err) => {
  console.error("Insight generation job failed:", err.message);
});
```

- [ ] **Step 3: Add insight signal endpoint to `apps/api/src/modules/markets/markets.routes.ts`**

Read the current `markets.routes.ts`. Add these two imports at the top:

```typescript
import { getLatestSignal } from "../ai/insight.service";
import { db as dbInstance } from "../../db";
```

Add this route inside `marketRoutes` before the closing brace:

```typescript
  app.get("/markets/:id/insight", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { tier } = request.user as { tier: string };
    if (tier === "free") {
      return reply.code(403).send({ error: "AI Insight Signals require a Pro or Elite subscription" });
    }
    const signal = await getLatestSignal(dbInstance, id);
    if (!signal) return reply.code(404).send({ error: "No insight signal available yet" });
    return reply.send({
      ...signal,
      keyFactors: JSON.parse(signal.keyFactors),
      sourceUrls: JSON.parse(signal.sourceUrls),
      disclaimer: "Not financial advice. For educational purposes only.",
    });
  });
```

- [ ] **Step 4: Verify app still starts cleanly**

```bash
cd apps/api && pnpm test tests/health.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/ai/insight.service.ts \
        apps/api/src/jobs/insight.worker.ts \
        apps/api/src/modules/markets/markets.routes.ts
git commit -m "feat: add AI insight signal pipeline — 6h BullMQ job, HuggingFace sentiment + Claude Sonnet synthesis, Pro+ gated endpoint"
```

---

## Task 9: Push Notification Service (APNs + FCM)

**Files:**
- Create: `apps/api/src/modules/notifications/notifications.service.ts`
- Create: `apps/api/src/modules/notifications/notifications.routes.ts`
- Create: `apps/api/src/jobs/notifications.worker.ts`
- Create: `apps/api/tests/notifications.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write failing notification tests**

Create `apps/api/tests/notifications.test.ts`:

```typescript
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { pushTokens, users } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Push Notifications", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userToken: string;
  let userId: string;

  beforeAll(async () => { app = await buildApp({ logger: false }); });
  afterAll(async () => { await app.close(); await closeDb(); });

  beforeEach(async () => {
    await resetDb();
    const regRes = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "push@example.com", username: "pushuser", password: "Pass123!" },
    });
    const body = JSON.parse(regRes.body);
    userToken = body.token;
    userId = body.user.id;
  });

  it("registers an iOS push token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/notifications/register-token",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { token: "abc123devicetoken", platform: "ios" },
    });
    expect(res.statusCode).toBe(201);

    const stored = await testDb.query.pushTokens.findFirst({
      where: eq(pushTokens.userId, userId),
    });
    expect(stored?.token).toBe("abc123devicetoken");
    expect(stored?.platform).toBe("ios");
  });

  it("registers an Android push token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/notifications/register-token",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { token: "fcm_device_token_xyz", platform: "android" },
    });
    expect(res.statusCode).toBe(201);
  });

  it("returns 400 for invalid platform", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/notifications/register-token",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { token: "sometoken", platform: "windows" },
    });
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/notifications.test.ts
```

Expected: FAIL — routes not registered

- [ ] **Step 3: Write `apps/api/src/modules/notifications/notifications.service.ts`**

Create directory `apps/api/src/modules/notifications/`.

```typescript
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { pushTokens, users } from "../../db/schema";
import { notificationQueue } from "../../queue";

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function queueNotification(payload: PushPayload): Promise<void> {
  await notificationQueue.add("send-push", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export async function registerToken(
  userId: string,
  token: string,
  platform: "ios" | "android"
): Promise<void> {
  // Upsert: if token already exists update userId
  const existing = await db.query.pushTokens.findFirst({
    where: eq(pushTokens.token, token),
  });

  if (existing) {
    await db.update(pushTokens)
      .set({ userId })
      .where(eq(pushTokens.token, token));
  } else {
    await db.insert(pushTokens).values({ userId, token, platform });
  }
}

export async function getUserTokens(userId: string) {
  return db.query.pushTokens.findMany({ where: eq(pushTokens.userId, userId) });
}

// Called by the BullMQ worker — sends push to all user devices
export async function deliverPush(payload: PushPayload): Promise<void> {
  const tokens = await getUserTokens(payload.userId);
  if (tokens.length === 0) return;

  const iosTokens = tokens.filter(t => t.platform === "ios").map(t => t.token);
  const androidTokens = tokens.filter(t => t.platform === "android").map(t => t.token);

  if (iosTokens.length > 0) {
    await sendApns(iosTokens, payload.title, payload.body, payload.data);
  }
  if (androidTokens.length > 0) {
    await sendFcm(androidTokens, payload.title, payload.body, payload.data);
  }
}

async function sendApns(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const apn = await import("@parse/node-apn");

  const provider = new apn.Provider({
    token: {
      key: process.env.APNS_KEY_PATH ?? "",
      keyId: process.env.APNS_KEY_ID ?? "",
      teamId: process.env.APNS_TEAM_ID ?? "",
    },
    production: process.env.NODE_ENV === "production",
  });

  const notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 3600;
  notification.badge = 1;
  notification.sound = "default";
  notification.alert = { title, body };
  notification.topic = process.env.APNS_BUNDLE_ID ?? "com.venlaxiq";
  if (data) notification.payload = data;

  await provider.send(notification, tokens);
  provider.shutdown();
}

async function sendFcm(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const admin = await import("firebase-admin");

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FCM_PROJECT_ID,
        clientEmail: process.env.FCM_CLIENT_EMAIL,
        privateKey: (process.env.FCM_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      } as any),
    });
  }

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });
}
```

- [ ] **Step 4: Write `apps/api/src/modules/notifications/notifications.routes.ts`**

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { z } from "zod";
import { registerToken } from "./notifications.service";

const registerTokenSchema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(["ios", "android"]),
});

export async function notificationRoutes(app: FastifyInstance) {
  app.post("/notifications/register-token", { preHandler: [authenticate] }, async (request, reply) => {
    const result = registerTokenSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const { sub } = request.user as { sub: string };
    await registerToken(sub, result.data.token, result.data.platform);
    return reply.code(201).send({ registered: true });
  });
}
```

- [ ] **Step 5: Write `apps/api/src/jobs/notifications.worker.ts`**

```typescript
import { Worker } from "bullmq";
import { redisConnection } from "../queue";
import { deliverPush, PushPayload } from "../modules/notifications/notifications.service";

export const notificationsWorker = new Worker(
  "notifications",
  async (job) => {
    const payload = job.data as PushPayload;
    await deliverPush(payload);
    return { userId: payload.userId, delivered: true };
  },
  { connection: redisConnection, concurrency: 20 }
);

notificationsWorker.on("failed", (job, err) => {
  console.error(`Push notification failed for user ${job?.data.userId}:`, err.message);
});
```

- [ ] **Step 6: Register notification routes in `apps/api/src/app.ts`**

Add import:

```typescript
import { notificationRoutes } from "./modules/notifications/notifications.routes";
```

Add before `return app;`:

```typescript
  await app.register(notificationRoutes);
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd apps/api && pnpm test tests/notifications.test.ts
```

Expected: PASS — 3 notification tests

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/notifications/ \
        apps/api/src/jobs/notifications.worker.ts \
        apps/api/tests/notifications.test.ts \
        apps/api/src/app.ts
git commit -m "feat: add push notification service — token registration, APNs + FCM delivery via BullMQ worker"
```

---

## Task 10: FP Daily Earn Events (Login Streak) + Worker Registry

**Files:**
- Create: `apps/api/src/modules/auth/daily-login.service.ts`
- Create: `apps/api/src/modules/auth/daily-login.routes.ts`
- Create: `apps/api/src/jobs/worker-registry.ts`
- Create: `apps/api/tests/daily-login.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Write failing daily-login tests**

Create `apps/api/tests/daily-login.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { fpLedger, users } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Daily Login FP", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userToken: string;
  let userId: string;

  beforeAll(async () => { app = await buildApp({ logger: false }); });
  afterAll(async () => { await app.close(); await closeDb(); });

  beforeEach(async () => {
    await resetDb();
    const regRes = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "daily@example.com", username: "dailyuser", password: "Pass123!" },
    });
    const body = JSON.parse(regRes.body);
    userToken = body.token;
    userId = body.user.id;
  });

  it("claims daily FP on first login of the day", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/daily-login",
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.fpGranted).toBeGreaterThanOrEqual(100);
    expect(body.streak).toBe(1);
  });

  it("credits FP to bonus pool", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/daily-login",
      headers: { authorization: `Bearer ${userToken}` },
    });
    const ledger = await testDb.query.fpLedger.findMany({ where: eq(fpLedger.userId, userId) });
    const entry = ledger.find(e => e.reason === "daily_login");
    expect(entry).toBeDefined();
    expect(entry?.poolType).toBe("bonus");
    expect(entry?.amount).toBeGreaterThan(0);
  });

  it("returns 409 if daily FP already claimed today", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/daily-login",
      headers: { authorization: `Bearer ${userToken}` },
    });
    const res = await app.inject({
      method: "POST",
      url: "/auth/daily-login",
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(409);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/daily-login.test.ts
```

Expected: FAIL — routes not registered

- [ ] **Step 3: Write `apps/api/src/modules/auth/daily-login.service.ts`**

```typescript
import { eq } from "drizzle-orm";
import { users, fpLedger } from "../../db/schema";
import { TIER_CONFIG, SubscriptionTier } from "@venlaxiq/shared";
import type { DB } from "../../db";

const BASE_DAILY_FP = 100; // base FP before streak multiplier
const STREAK_MULTIPLIERS: Record<number, number> = {
  1: 1.0, 2: 1.1, 3: 1.2, 4: 1.3, 5: 1.4, 6: 1.5, 7: 1.5,
  // Days 8-29: stay at 1.5x
  30: 2.0, // Day 30+ loyalty bonus
};

function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  return STREAK_MULTIPLIERS[streak] ?? 1.5;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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

  // Compute streak
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const newStreak = user.lastLoginDate === yesterdayStr ? user.loginStreak + 1 : 1;

  // Compute FP to grant
  const streakMultiplier = getStreakMultiplier(newStreak);
  const fpGranted = Math.round(BASE_DAILY_FP * streakMultiplier);

  // Update user streak
  await db.update(users)
    .set({ loginStreak: newStreak, lastLoginDate: today })
    .where(eq(users.id, userId));

  // Credit FP to bonus pool (30-day expiry)
  await db.insert(fpLedger).values({
    userId,
    poolType: "bonus",
    amount: fpGranted,
    reason: "daily_login",
    expiresAt: new Date(Date.now() + 30 * 86400000),
  });

  return { fpGranted, streak: newStreak, alreadyClaimed: false };
}
```

- [ ] **Step 4: Write `apps/api/src/modules/auth/daily-login.routes.ts`**

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { db } from "../../db";
import { claimDailyLogin } from "./daily-login.service";

export async function dailyLoginRoutes(app: FastifyInstance) {
  app.post("/auth/daily-login", { preHandler: [authenticate] }, async (request, reply) => {
    const { sub } = request.user as { sub: string };
    try {
      const result = await claimDailyLogin(db, sub);
      return reply.send(result);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
```

- [ ] **Step 5: Write `apps/api/src/jobs/worker-registry.ts`**

This file starts all BullMQ workers and is imported once by `index.ts`.

```typescript
import { settlementWorker } from "./settlement.worker";
import { aiWorker } from "./ai.worker";
import { insightWorker, scheduleInsightJobs } from "./insight.worker";
import { notificationsWorker } from "./notifications.worker";

export async function startWorkers(): Promise<void> {
  // Workers are already constructed by import — just log startup
  console.log("Workers started: settlement, ai, insight, notifications");

  // Schedule the 6-hour insight generation repeatable job
  await scheduleInsightJobs();

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    await Promise.all([
      settlementWorker.close(),
      aiWorker.close(),
      insightWorker.close(),
      notificationsWorker.close(),
    ]);
    process.exit(0);
  });
}
```

- [ ] **Step 6: Register daily-login routes in `apps/api/src/app.ts`**

Add import:

```typescript
import { dailyLoginRoutes } from "./modules/auth/daily-login.routes";
```

Add before `return app;`:

```typescript
  await app.register(dailyLoginRoutes);
```

- [ ] **Step 7: Import worker registry in `apps/api/src/index.ts`**

Read the current `index.ts`. Add to the top:

```typescript
import { startWorkers } from "./jobs/worker-registry";
```

In the `main()` function, before `app.listen(...)`:

```typescript
  await startWorkers();
```

Full updated `apps/api/src/index.ts`:

```typescript
import "dotenv/config";
import { buildApp } from "./app";
import { startWorkers } from "./jobs/worker-registry";

const PORT = Number(process.env.API_PORT ?? 3001);

async function main() {
  const app = await buildApp();
  await startWorkers();
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`VenlaxIQ API running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 8: Run daily-login tests — verify they pass**

```bash
cd apps/api && pnpm test tests/daily-login.test.ts
```

Expected: PASS — 3 daily login tests

- [ ] **Step 9: Run full test suite**

```bash
cd apps/api && pnpm test
```

Expected: PASS — all tests across auth, health, subscriptions, fp-ledger, markets, forecast, settlement, reviews, ai-scorer, notifications, daily-login

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/modules/auth/daily-login.service.ts \
        apps/api/src/modules/auth/daily-login.routes.ts \
        apps/api/src/jobs/worker-registry.ts \
        apps/api/src/index.ts \
        apps/api/src/app.ts \
        apps/api/tests/daily-login.test.ts
git commit -m "feat: add daily login FP with streak multiplier (1.0x–2.0x), BullMQ worker registry, all workers started"
```

---

## Self-Review

**Spec coverage check:**

| Spec Section | Covered |
|---|---|
| §6.1 Market Lifecycle (draft → open → closed → resolved → settled) | Task 2 + Task 4 |
| §5.3 LMSR pricing engine | Task 1 + Task 3 |
| §6.2 Sports / Politics market categories | Task 2 schema |
| Forecast entry: enter, view positions, withdraw | Task 3 |
| §5.3 Withdraw forecast (platform FP allocation per share) | Task 3 `withdrawForecast` |
| §5.2 Forecast settlement FP crediting (Accuracy Multiplier) | Task 4 `settleMarket` |
| §3.7 Market probability update < 500ms via WebSocket | Task 5 |
| §7 Review Engine: submission, verification, badge award | Task 6 |
| §7.3 FP earn from reviews (200 unverified / 1000 verified) | Task 7 |
| §8.3 Review AI trust scoring via Claude | Task 7 |
| §8.2 AI Insight Signal pipeline (6h job, HuggingFace + Claude) | Task 8 |
| §8.1 AI Signal gated to Pro+ | Task 8 route guard |
| §10.3 Push triggers (settlement, closing) | Task 9 |
| §5.2 Daily login FP + streak multiplier | Task 10 |
| §8.4 Fraud detection | Deferred to Plan 3 (BullMQ velocity checks) |

**Gaps deferred to Plan 3:**
- Rewards marketplace (Tango/Rybbon) — §9
- Badge system + XP levels — §10.1, §10.2
- Daily missions — §10.3
- Referral FP — §5.2
- Leaderboard — §10.4
- B2B brand accounts — §12
- Admin panel — §11.3
- Mobile/web UI (Expo + Next.js screens)
- Fraud detection / velocity limiting — §8.4

**Placeholder scan:** No TBD or TODO found. All code blocks are complete.

**Type consistency checks:**
- `lmsrSharesForFp` / `lmsrCost` / `lmsrProbability` — defined in Task 1, imported in Tasks 3 and 5 via `@venlaxiq/shared`
- `DB` type from `apps/api/src/db/index.ts` — used consistently in `settle.service.ts`, `review-scorer.ts`, `insight.service.ts`, `daily-login.service.ts`
- `TIER_CONFIG[tier].accuracyMultiplier` — used in Task 4 settlement and Task 7 review FP
- `forecastPositions.side` is `boolean` (true = Yes) — consistent across Task 3 `enterForecast` and Task 4 `settleMarket`
- `pushTokens` table added in Task 1 schema, used in Task 9 service ✅
- `aiInsightSignals` table added in Task 1 schema, used in Task 8 service ✅
- `loginStreak` / `lastLoginDate` added to users in Task 1, used in Task 10 ✅
- `qYes` / `qNo` added to markets in Task 1, used in Tasks 3 and 5 ✅
