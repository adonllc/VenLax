# VenlaxIQ Phase 3B — Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the internal admin panel — API backend additions (admin_users schema, admin-auth module, admin data module) and the full apps/admin Next.js 15 app with login, 2FA, and all 8 protected pages.

**Architecture:** New backend modules (`admin-auth`, `admin`) are registered in `apps/api/src/app.ts` alongside existing user routes. The Next.js admin app (port 3002) is server-rendered with Server Actions for mutations — no React Query. The admin JWT is signed with a separate `ADMIN_JWT_SECRET`; stored in an httpOnly cookie set by the admin app itself after verifying the API response.

**Tech Stack:** Fastify 4 · Drizzle ORM · `otplib` (TOTP) · `jsonwebtoken` · Next.js 15 App Router · Tailwind CSS · `@venlaxiq/ui` (web components)

---

## File Map

**Backend — new files:**
- `apps/api/src/db/schema.ts` — MODIFY: add `adminRoleEnum`, `adminUsers` table
- `apps/api/src/plugins/authenticate-admin.ts` — CREATE: `authenticateAdmin` preHandler
- `apps/api/src/modules/admin-auth/admin-auth.schema.ts` — CREATE: Zod schemas
- `apps/api/src/modules/admin-auth/admin-auth.service.ts` — CREATE: login, verify2fa, seedAdmin
- `apps/api/src/modules/admin-auth/admin-auth.routes.ts` — CREATE: 3 routes
- `apps/api/src/modules/admin/admin.service.ts` — CREATE: all admin DB queries
- `apps/api/src/modules/admin/admin.routes.ts` — CREATE: all admin routes
- `apps/api/src/app.ts` — MODIFY: register `@fastify/cookie`, admin-auth, admin routes

**Frontend — new files:**
- `apps/admin/package.json` — MODIFY: add tailwindcss, postcss, @venlaxiq/ui, jsonwebtoken, clsx
- `apps/admin/tailwind.config.ts` — CREATE
- `apps/admin/postcss.config.js` — CREATE
- `apps/admin/next.config.ts` — CREATE
- `apps/admin/middleware.ts` — CREATE: redirect non-authed to /login
- `apps/admin/app/layout.tsx` — CREATE: root layout (dark theme)
- `apps/admin/app/globals.css` — CREATE: same design tokens as web
- `apps/admin/app/(auth)/login/page.tsx` — CREATE
- `apps/admin/app/(auth)/2fa/page.tsx` — CREATE
- `apps/admin/app/(admin)/layout.tsx` — CREATE: sidebar + admin JWT guard (server component)
- `apps/admin/app/(admin)/dashboard/page.tsx` — CREATE
- `apps/admin/app/(admin)/markets/page.tsx` — CREATE
- `apps/admin/app/(admin)/markets/new/page.tsx` — CREATE
- `apps/admin/app/(admin)/markets/[id]/page.tsx` — CREATE
- `apps/admin/app/(admin)/users/page.tsx` — CREATE
- `apps/admin/app/(admin)/users/[id]/page.tsx` — CREATE
- `apps/admin/app/(admin)/fp-adjustments/page.tsx` — CREATE
- `apps/admin/app/(admin)/reviews/page.tsx` — CREATE
- `apps/admin/app/(admin)/analytics/page.tsx` — CREATE
- `apps/admin/app/(admin)/settings/page.tsx` — CREATE
- `apps/admin/components/AdminSidebar.tsx` — CREATE
- `apps/admin/components/SupervisorModal.tsx` — CREATE: password re-entry modal
- `apps/admin/components/StatCard.tsx` — CREATE
- `apps/admin/components/AuditLogTable.tsx` — CREATE
- `apps/admin/components/UserDetailPanel.tsx` — CREATE
- `apps/admin/components/DisputePanel.tsx` — CREATE
- `apps/admin/lib/admin-api.ts` — CREATE: fetch helpers (reads cookie, passes Bearer token)
- `apps/admin/lib/auth.ts` — CREATE: getAdminToken() from cookies, verifyAdminToken()

---

## Task 1: DB Schema — admin_users table

**Files:**
- Modify: `apps/api/src/db/schema.ts`

- [ ] **Step 1: Add adminRoleEnum and adminUsers to schema**

Add to `apps/api/src/db/schema.ts` after the `xpLevelEnum` block:

```typescript
export const adminRoleEnum = pgEnum("admin_role", ["admin", "superadmin"]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 256 }).notNull(),
  totpSecret: varchar("totp_secret", { length: 64 }),
  role: adminRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("admin_users_email_idx").on(t.email),
}));
```

- [ ] **Step 2: Generate migration**

```bash
pnpm --filter api db:generate
```

Expected: new file in `apps/api/drizzle/` with `CREATE TABLE admin_users` and `CREATE TYPE admin_role`.

- [ ] **Step 3: Run migration against dev DB**

```bash
pnpm --filter api db:migrate
```

Expected: Migration applied successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/drizzle/
git commit -m "feat(db): add admin_users table with TOTP secret + role"
```

---

## Task 2: Install API deps + authenticateAdmin plugin

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/plugins/authenticate-admin.ts`

- [ ] **Step 1: Add jsonwebtoken, otplib, @fastify/cookie to API**

```bash
pnpm --filter api add jsonwebtoken otplib @fastify/cookie
pnpm --filter api add -D @types/jsonwebtoken
```

- [ ] **Step 2: Write the authenticateAdmin preHandler**

Create `apps/api/src/plugins/authenticate-admin.ts`:

```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export interface AdminPayload {
  adminId: string;
  email: string;
  role: "admin" | "superadmin";
}

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "admin-dev-secret-change-in-production";

export function verifyAdminToken(token: string): AdminPayload {
  return jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;
}

export function signAdminToken(payload: AdminPayload, expiresIn = "8h"): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn });
}

export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
  try {
    (request as any).adminUser = verifyAdminToken(token);
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/plugins/authenticate-admin.ts apps/api/package.json
git commit -m "feat(api): add authenticateAdmin plugin + jsonwebtoken/otplib deps"
```

---

## Task 3: admin-auth module (backend)

**Files:**
- Create: `apps/api/src/modules/admin-auth/admin-auth.schema.ts`
- Create: `apps/api/src/modules/admin-auth/admin-auth.service.ts`
- Create: `apps/api/src/modules/admin-auth/admin-auth.routes.ts`

- [ ] **Step 1: Write Zod schemas**

Create `apps/api/src/modules/admin-auth/admin-auth.schema.ts`:

```typescript
import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const adminVerify2faSchema = z.object({
  partialToken: z.string(),
  totpCode: z.string().length(6).regex(/^\d+$/),
});
```

- [ ] **Step 2: Write admin-auth service**

Create `apps/api/src/modules/admin-auth/admin-auth.service.ts`:

```typescript
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
```

- [ ] **Step 3: Write admin-auth routes**

Create `apps/api/src/modules/admin-auth/admin-auth.routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { adminLoginSchema, adminVerify2faSchema } from "./admin-auth.schema";
import { adminLogin, adminVerify2fa } from "./admin-auth.service";
import { authenticateAdmin } from "../../plugins/authenticate-admin";

export async function adminAuthRoutes(app: FastifyInstance) {
  app.post("/admin/auth/login", async (request, reply) => {
    const result = adminLoginSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      return reply.code(200).send(await adminLogin(result.data));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.post("/admin/auth/verify-2fa", async (request, reply) => {
    const result = adminVerify2faSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      return reply.code(200).send(await adminVerify2fa(result.data));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.post("/admin/auth/logout", { preHandler: [authenticateAdmin] }, async (_request, reply) => {
    return reply.code(200).send({ ok: true });
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/admin-auth/
git commit -m "feat(api): add admin-auth module — login, verify-2fa, TOTP"
```

---

## Task 4: admin data module — users + markets routes

**Files:**
- Create: `apps/api/src/modules/admin/admin.service.ts`
- Create: `apps/api/src/modules/admin/admin.routes.ts`

- [ ] **Step 1: Write admin.service.ts (users + markets queries)**

Create `apps/api/src/modules/admin/admin.service.ts`:

```typescript
import { db } from "../../db";
import {
  users, markets, fpLedger, reviews, auditLog,
  marketStatusEnum, subscriptionTierEnum,
} from "../../db/schema";
import { eq, ilike, and, desc, sql, count, sum } from "drizzle-orm";

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listUsers(opts: {
  page: number;
  search?: string;
  tier?: string;
  status?: string;
}) {
  const limit = 20;
  const offset = (opts.page - 1) * limit;

  const conditions = [];
  if (opts.search) {
    conditions.push(ilike(users.email, `%${opts.search}%`));
  }
  if (opts.tier) {
    conditions.push(eq(users.subscriptionTier, opts.tier as any));
  }
  if (opts.status === "suspended") {
    conditions.push(eq(users.isBanned, true));
  } else if (opts.status === "active") {
    conditions.push(eq(users.isActive, true));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      subscriptionTier: users.subscriptionTier,
      xpLevel: users.xpLevel,
      isActive: users.isActive,
      isBanned: users.isBanned,
      createdAt: users.createdAt,
    }).from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return { users: rows, total, page: opts.page, pages: Math.ceil(total / limit) };
}

export async function getUserDetail(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw { statusCode: 404, message: "User not found" };

  const [fpRows] = await db
    .select({ balance: sum(fpLedger.amount) })
    .from(fpLedger)
    .where(eq(fpLedger.userId, userId));

  return { user, fpBalance: Number(fpRows?.balance ?? 0) };
}

export async function suspendUser(userId: string, suspend: boolean) {
  await db.update(users).set({ isBanned: suspend, isActive: !suspend }).where(eq(users.id, userId));
}

// ── Markets ──────────────────────────────────────────────────────────────────

export async function listMarkets(opts: { page: number; status?: string; category?: string }) {
  const limit = 20;
  const offset = (opts.page - 1) * limit;

  const conditions = [];
  if (opts.status) conditions.push(eq(markets.status, opts.status as any));
  if (opts.category) conditions.push(eq(markets.category, opts.category as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(markets).where(where).orderBy(desc(markets.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(markets).where(where),
  ]);

  return { markets: rows, total, page: opts.page, pages: Math.ceil(total / limit) };
}

export async function createMarket(input: {
  title: string;
  description: string;
  category: string;
  closesAt: string;
  resolutionCriteria: string;
}) {
  const [market] = await db.insert(markets).values({
    title: input.title,
    description: input.description,
    category: input.category as any,
    closesAt: new Date(input.closesAt),
    resolutionCriteria: input.resolutionCriteria,
    status: "open",
    createdBy: "admin",
  }).returning();
  return market;
}

export async function resolveMarket(marketId: string, outcome: "yes" | "no") {
  await db.update(markets)
    .set({ status: "resolved", resolvedOutcome: outcome, resolvedAt: new Date() })
    .where(eq(markets.id, marketId));
}

// ── FP Adjustments ───────────────────────────────────────────────────────────

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
    referenceId: undefined,
  });

  await db.insert(auditLog).values({
    actorId: input.adminId,
    targetId: input.userId,
    action: `fp_adjust:${input.amount > 0 ? "credit" : "debit"}`,
    meta: JSON.stringify({ amount: input.amount, reason: input.reason, poolType: input.poolType }),
  });
}

// ── Reviews moderation ───────────────────────────────────────────────────────

export async function getReviewQueue(page: number) {
  const limit = 20;
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(reviews)
      .where(eq(reviews.status, "flagged" as any))
      .orderBy(desc(reviews.createdAt))
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(reviews).where(eq(reviews.status, "flagged" as any)),
  ]);

  return { reviews: rows, total, page, pages: Math.ceil(total / limit) };
}

export async function moderateReview(reviewId: string, action: "approved" | "rejected") {
  await db.update(reviews).set({ status: action as any }).where(eq(reviews.id, reviewId));
}

// ── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics() {
  const [
    [{ mau }],
    [{ dau }],
    tierCounts,
    fpVolume,
    topMarkets,
  ] = await Promise.all([
    db.select({ mau: count() }).from(users).where(
      sql`${users.updatedAt} > now() - interval '30 days'`
    ),
    db.select({ dau: count() }).from(users).where(
      sql`${users.updatedAt} > now() - interval '1 day'`
    ),
    db.select({ tier: users.subscriptionTier, total: count() })
      .from(users).groupBy(users.subscriptionTier),
    db.select({
      poolType: fpLedger.poolType,
      volume: sum(fpLedger.amount),
    }).from(fpLedger)
      .where(sql`${fpLedger.createdAt} > now() - interval '7 days'`)
      .groupBy(fpLedger.poolType),
    db.select({ id: markets.id, title: markets.title })
      .from(markets)
      .where(eq(markets.status, "open"))
      .limit(5),
  ]);

  return { mau, dau, tierCounts, fpVolume, topMarkets };
}
```

- [ ] **Step 2: Write admin.routes.ts**

Create `apps/api/src/modules/admin/admin.routes.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { authenticateAdmin, AdminPayload } from "../../plugins/authenticate-admin";
import {
  listUsers, getUserDetail, suspendUser,
  listMarkets, createMarket, resolveMarket,
  adjustFP, getReviewQueue, moderateReview, getAnalytics,
} from "./admin.service";
import { z } from "zod";

const createMarketSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(["sports", "politics", "open"]),
  closesAt: z.string().datetime(),
  resolutionCriteria: z.string().min(10),
});

const fpAdjustSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be 0"),
  poolType: z.enum(["bonus", "achievement"]),
  reason: z.string().min(10),
});

const moderateSchema = z.object({ action: z.enum(["approved", "rejected"]) });

export async function adminRoutes(app: FastifyInstance) {
  const preHandler = [authenticateAdmin];

  // Users
  app.get("/admin/users", { preHandler }, async (request, reply) => {
    const { page = "1", search, tier, status } = request.query as any;
    return reply.send(await listUsers({ page: Number(page), search, tier, status }));
  });

  app.get("/admin/users/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return reply.send(await getUserDetail(id));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.patch("/admin/users/:id/suspend", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { suspend } = request.body as { suspend: boolean };
    await suspendUser(id, suspend);
    return reply.send({ ok: true });
  });

  // Markets
  app.get("/admin/markets", { preHandler }, async (request, reply) => {
    const { page = "1", status, category } = request.query as any;
    return reply.send(await listMarkets({ page: Number(page), status, category }));
  });

  app.post("/admin/markets", { preHandler }, async (request, reply) => {
    const result = createMarketSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      return reply.code(201).send(await createMarket(result.data));
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.patch("/admin/markets/:id/resolve", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { outcome } = request.body as { outcome: "yes" | "no" };
    await resolveMarket(id, outcome);
    return reply.send({ ok: true });
  });

  // FP Adjustments
  app.post("/admin/fp/adjust", { preHandler }, async (request, reply) => {
    const result = fpAdjustSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const adminUser = (request as any).adminUser as AdminPayload;
    try {
      await adjustFP({ ...result.data, adminId: adminUser.adminId });
      return reply.send({ ok: true });
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  // Reviews
  app.get("/admin/reviews/queue", { preHandler }, async (request, reply) => {
    const { page = "1" } = request.query as any;
    return reply.send(await getReviewQueue(Number(page)));
  });

  app.patch("/admin/reviews/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = moderateSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    await moderateReview(id, result.data.action);
    return reply.send({ ok: true });
  });

  // Analytics
  app.get("/admin/analytics", { preHandler }, async (_request, reply) => {
    return reply.send(await getAnalytics());
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/admin/
git commit -m "feat(api): add admin module — users, markets, fp-adjust, reviews, analytics"
```

---

## Task 5: Register admin routes in app.ts

**Files:**
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Register @fastify/cookie and admin routes**

In `apps/api/src/app.ts`, add imports after existing ones:

```typescript
import cookie from "@fastify/cookie";
import { adminAuthRoutes } from "./modules/admin-auth/admin-auth.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
```

After `await app.register(dailyLoginRoutes);`, add:

```typescript
  await app.register(cookie);

  await app.register(adminAuthRoutes);

  await app.register(adminRoutes);
```

- [ ] **Step 2: Add ADMIN_JWT_SECRET to .env.example**

In `infrastructure/.env.example`, add:

```
ADMIN_JWT_SECRET=admin-dev-secret-change-in-production
```

- [ ] **Step 3: Start API and verify routes exist**

```bash
pnpm --filter api dev
```

Open another terminal and run:

```bash
curl -X POST http://localhost:3001/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"wrongpassword"}'
```

Expected: `{"error":"Invalid credentials"}` (401) — route is registered and reachable.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/app.ts infrastructure/.env.example
git commit -m "feat(api): register admin-auth and admin routes in app"
```

---

## Task 6: Create a seed-admin script

**Files:**
- Create: `apps/api/scripts/seed-admin.ts`

- [ ] **Step 1: Write seed script**

Create `apps/api/scripts/seed-admin.ts`:

```typescript
import "dotenv/config";
import { seedAdmin } from "../src/modules/admin-auth/admin-auth.service";
import { authenticator } from "otplib";
import qrcode from "qrcode-terminal";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@venlaxiq.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123!";

  const totpSecret = await seedAdmin(email, password);
  const otpAuthUrl = authenticator.keyuri(email, "VenlaxIQ Admin", totpSecret);

  console.log("\n=== Admin user created ===");
  console.log(`Email:       ${email}`);
  console.log(`TOTP secret: ${totpSecret}`);
  console.log("\nScan this QR code with your authenticator app:\n");
  qrcode.generate(otpAuthUrl, { small: true });
  console.log("\nAdd TOTP secret to your authenticator app manually if QR scan fails.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Install qrcode-terminal**

```bash
pnpm --filter api add -D qrcode-terminal @types/qrcode-terminal
```

- [ ] **Step 3: Add seed script to package.json**

In `apps/api/package.json`, add to `scripts`:

```json
"seed:admin": "tsx scripts/seed-admin.ts"
```

- [ ] **Step 4: Run the seed**

```bash
pnpm --filter api seed:admin
```

Expected: Admin user created, TOTP secret printed + QR code displayed. Save the TOTP secret to your authenticator app.

- [ ] **Step 5: Commit**

```bash
git add apps/api/scripts/seed-admin.ts apps/api/package.json
git commit -m "feat(api): add seed-admin script with TOTP QR code output"
```

---

## Task 7: apps/admin — package setup + tailwind + next.config

**Files:**
- Modify: `apps/admin/package.json`
- Create: `apps/admin/tailwind.config.ts`
- Create: `apps/admin/postcss.config.js`
- Create: `apps/admin/next.config.ts`

- [ ] **Step 1: Update apps/admin/package.json**

Replace the entire file:

```json
{
  "name": "admin",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002"
  },
  "dependencies": {
    "@venlaxiq/shared": "workspace:*",
    "@venlaxiq/ui": "workspace:*",
    "clsx": "^2.1.0",
    "jsonwebtoken": "^9.0.0",
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create tailwind.config.ts**

Create `apps/admin/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: { DEFAULT: "#00D46A", dark: "#00A854" },
        lemon: { DEFAULT: "#FFE600" },
        orange: { DEFAULT: "#FF6B00", dark: "#D45A00" },
        surface: {
          DEFAULT: "var(--color-surface)",
          2: "var(--color-surface-2)",
          3: "var(--color-surface-3)",
        },
        border: "var(--color-border)",
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
        },
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Create postcss.config.js**

Create `apps/admin/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: Create next.config.ts**

Create `apps/admin/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@venlaxiq/ui"],
};

export default nextConfig;
```

- [ ] **Step 5: Install packages**

```bash
pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add apps/admin/package.json apps/admin/tailwind.config.ts apps/admin/postcss.config.js apps/admin/next.config.ts
git commit -m "feat(admin): add Tailwind, @venlaxiq/ui, next.config"
```

---

## Task 8: apps/admin — root layout, globals.css, lib/auth.ts, middleware

**Files:**
- Create: `apps/admin/app/globals.css`
- Create: `apps/admin/app/layout.tsx`
- Create: `apps/admin/lib/auth.ts`
- Create: `apps/admin/lib/admin-api.ts`
- Create: `apps/admin/middleware.ts`

- [ ] **Step 1: Create globals.css**

Create `apps/admin/app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Inter:wght@400;600&family=JetBrains+Mono:wght@500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-surface: #0D0D0D;
  --color-surface-2: #181818;
  --color-surface-3: #242424;
  --color-border: #2E2E2E;
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #8A8A8A;
}

body {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: 'Inter', sans-serif;
}
```

- [ ] **Step 2: Create root layout**

Create `apps/admin/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VenlaxIQ Admin",
  description: "Internal admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create lib/auth.ts**

Create `apps/admin/lib/auth.ts`:

```typescript
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "admin-dev-secret-change-in-production";

export interface AdminUser {
  adminId: string;
  email: string;
  role: "admin" | "superadmin";
}

export function getAdminToken(): string | null {
  const cookieStore = cookies();
  return cookieStore.get("admin_token")?.value ?? null;
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminUser;
  } catch {
    return null;
  }
}

export function getAdminUser(): AdminUser | null {
  const token = getAdminToken();
  if (!token) return null;
  return verifyAdminToken(token);
}
```

- [ ] **Step 4: Create lib/admin-api.ts**

Create `apps/admin/lib/admin-api.ts`:

```typescript
import { getAdminToken } from "./auth";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
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

export const adminApi = {
  login: (email: string, password: string) =>
    adminFetch<{ partialToken: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verify2fa: (partialToken: string, totpCode: string) =>
    adminFetch<{ token: string; admin: { id: string; email: string; role: string } }>("/admin/auth/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ partialToken, totpCode }),
    }),

  users: (params: Record<string, string>) =>
    adminFetch<any>(`/admin/users?${new URLSearchParams(params)}`),

  userDetail: (id: string) => adminFetch<any>(`/admin/users/${id}`),

  suspendUser: (id: string, suspend: boolean) =>
    adminFetch<any>(`/admin/users/${id}/suspend`, { method: "PATCH", body: JSON.stringify({ suspend }) }),

  markets: (params: Record<string, string>) =>
    adminFetch<any>(`/admin/markets?${new URLSearchParams(params)}`),

  createMarket: (data: any) =>
    adminFetch<any>("/admin/markets", { method: "POST", body: JSON.stringify(data) }),

  resolveMarket: (id: string, outcome: "yes" | "no") =>
    adminFetch<any>(`/admin/markets/${id}/resolve`, { method: "PATCH", body: JSON.stringify({ outcome }) }),

  adjustFP: (data: any) =>
    adminFetch<any>("/admin/fp/adjust", { method: "POST", body: JSON.stringify(data) }),

  reviewQueue: (page: string) =>
    adminFetch<any>(`/admin/reviews/queue?page=${page}`),

  moderateReview: (id: string, action: "approved" | "rejected") =>
    adminFetch<any>(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),

  analytics: () => adminFetch<any>("/admin/analytics"),
};
```

- [ ] **Step 5: Create middleware.ts**

Create `apps/admin/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/2fa");

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/globals.css apps/admin/app/layout.tsx apps/admin/lib/ apps/admin/middleware.ts
git commit -m "feat(admin): root layout, globals.css, auth helpers, API client, middleware"
```

---

## Task 9: AdminSidebar + auth pages (login + 2fa)

**Files:**
- Create: `apps/admin/components/AdminSidebar.tsx`
- Create: `apps/admin/app/(auth)/login/page.tsx`
- Create: `apps/admin/app/(auth)/2fa/page.tsx`
- Create: `apps/admin/app/(auth)/layout.tsx`

- [ ] **Step 1: Create AdminSidebar**

Create `apps/admin/components/AdminSidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/markets", icon: "📈", label: "Markets" },
  { href: "/users", icon: "👤", label: "Users" },
  { href: "/fp-adjustments", icon: "⚡", label: "FP Adjustments" },
  { href: "/reviews", icon: "🔍", label: "Reviews" },
  { href: "/analytics", icon: "📉", label: "Analytics" },
  { href: "/settings", icon: "⚙", label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) window.location.href = "/login";
  }

  return (
    <aside className="w-56 min-h-screen bg-surface-2 border-r border-border flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <span className="font-heading font-bold text-lg text-text-primary">VenlaxIQ</span>
        <span className="ml-2 text-xs text-orange font-semibold uppercase tracking-wider">Admin</span>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-text-primary bg-surface-3"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
            )}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-text-secondary hover:text-orange transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create auth layout**

Create `apps/admin/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create login page (client component for form)**

Create `apps/admin/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      // Store partialToken in sessionStorage for the 2FA step
      sessionStorage.setItem("admin_partial_token", data.partialToken);
      router.push("/2fa");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface-2 border border-border rounded-xl p-8">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-1">Admin Login</h1>
        <p className="text-text-secondary text-sm mb-6">VenlaxIQ internal panel</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-orange transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-orange transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange hover:bg-orange-dark text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create 2FA page**

Create `apps/admin/app/(auth)/2fa/page.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TwoFAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Guard: must have partial token from login step
    if (!sessionStorage.getItem("admin_partial_token")) {
      router.replace("/login");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const partialToken = sessionStorage.getItem("admin_partial_token") ?? "";
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partialToken, totpCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      sessionStorage.removeItem("admin_partial_token");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface-2 border border-border rounded-xl p-8">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-1">Two-Factor Auth</h1>
        <p className="text-text-secondary text-sm mb-6">Enter the 6-digit code from your authenticator app.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-3 text-center text-2xl font-mono text-text-primary tracking-[0.5em] outline-none focus:border-orange transition-colors"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-orange hover:bg-orange-dark text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>
        <button
          onClick={() => router.push("/login")}
          className="w-full mt-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back to login
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create API route handlers for auth (cookie management)**

Create `apps/admin/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

Create `apps/admin/app/api/auth/verify-2fa/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API_BASE}/admin/auth/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("admin_token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}
```

Create `apps/admin/app/api/logout/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
  return response;
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/admin/components/AdminSidebar.tsx apps/admin/app/\(auth\)/ apps/admin/app/api/
git commit -m "feat(admin): AdminSidebar, login page, 2FA page, auth API routes"
```

---

## Task 10: Protected layout + Dashboard page + StatCard

**Files:**
- Create: `apps/admin/app/(admin)/layout.tsx`
- Create: `apps/admin/components/StatCard.tsx`
- Create: `apps/admin/app/(admin)/dashboard/page.tsx`

- [ ] **Step 1: Create protected layout**

Create `apps/admin/app/(admin)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = getAdminUser();
  if (!admin) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create StatCard**

Create `apps/admin/components/StatCard.tsx`:

```tsx
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  color?: "green" | "orange" | "lemon" | "default";
}

export function StatCard({ label, value, trend, color = "default" }: StatCardProps) {
  const colorMap = {
    green: "border-green/30 text-green",
    orange: "border-orange/30 text-orange",
    lemon: "border-lemon/30 text-lemon",
    default: "border-border text-text-primary",
  };

  return (
    <div className={clsx("bg-surface-2 rounded-xl p-5 border", colorMap[color])}>
      <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-heading font-bold">{value}</p>
      {trend !== undefined && (
        <p className={clsx("text-xs mt-1 font-semibold", trend >= 0 ? "text-green" : "text-red-400")}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last period
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create dashboard page**

Create `apps/admin/app/(admin)/dashboard/page.tsx`:

```tsx
import { adminApi } from "@/lib/admin-api";
import { StatCard } from "@/components/StatCard";

export default async function DashboardPage() {
  const analytics = await adminApi.analytics().catch(() => null);

  const tierMap: Record<string, number> = {};
  analytics?.tierCounts?.forEach((t: any) => { tierMap[t.tier] = Number(t.total); });

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard label="Monthly Active Users" value={analytics?.mau ?? "—"} color="green" />
        <StatCard label="Daily Active Users" value={analytics?.dau ?? "—"} color="green" />
        <StatCard label="Pro Subscribers" value={tierMap["pro"] ?? "—"} color="orange" />
        <StatCard label="Elite Subscribers" value={tierMap["elite"] ?? "—"} color="lemon" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Top Active Markets</h2>
          {analytics?.topMarkets?.length ? (
            <ul className="space-y-2">
              {analytics.topMarkets.map((m: any) => (
                <li key={m.id} className="text-sm text-text-primary">{m.title}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No data</p>
          )}
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Subscriptions by Tier</h2>
          {["free", "pro", "elite"].map((tier) => (
            <div key={tier} className="flex justify-between text-sm py-1">
              <span className="text-text-secondary capitalize">{tier}</span>
              <span className="text-text-primary font-semibold font-mono">{tierMap[tier] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify admin app starts**

```bash
pnpm --filter admin dev
```

Open http://localhost:3002/login — should render the login form.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/\(admin\)/ apps/admin/components/StatCard.tsx
git commit -m "feat(admin): protected layout, StatCard, dashboard page"
```

---

## Task 11: Markets pages

**Files:**
- Create: `apps/admin/app/(admin)/markets/page.tsx`
- Create: `apps/admin/app/(admin)/markets/new/page.tsx`
- Create: `apps/admin/app/(admin)/markets/[id]/page.tsx`
- Create: `apps/admin/components/SupervisorModal.tsx`

- [ ] **Step 1: Create SupervisorModal**

Create `apps/admin/components/SupervisorModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import clsx from "clsx";

interface SupervisorModalProps {
  title: string;
  description: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function SupervisorModal({ title, description, onConfirm, onCancel }: SupervisorModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!password) { setError("Password required"); return; }
    setLoading(true);
    setError("");
    try {
      await onConfirm(password);
    } catch (err: any) {
      setError(err.message ?? "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-surface-2 border border-border rounded-xl p-6">
        <h2 className="font-heading font-bold text-lg text-text-primary mb-1">{title}</h2>
        <p className="text-sm text-text-secondary mb-5">{description}</p>
        <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">
          Re-enter your password to confirm
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-orange transition-colors mb-3"
        />
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-orange hover:bg-orange-dark text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Confirming…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create markets list page**

Create `apps/admin/app/(admin)/markets/page.tsx`:

```tsx
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";

interface PageProps {
  searchParams: { page?: string; status?: string; category?: string };
}

export default async function MarketsPage({ searchParams }: PageProps) {
  const params: Record<string, string> = {};
  if (searchParams.page) params.page = searchParams.page;
  if (searchParams.status) params.status = searchParams.status;
  if (searchParams.category) params.category = searchParams.category;

  const data = await adminApi.markets(params).catch(() => ({ markets: [], total: 0, pages: 1 }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary">Markets</h1>
        <Link
          href="/markets/new"
          className="px-4 py-2 bg-green hover:bg-green-dark text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + New market
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        {["", "open", "closed", "resolved", "settled"].map((s) => (
          <Link
            key={s}
            href={s ? `/markets?status=${s}` : "/markets"}
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
              (searchParams.status ?? "") === s
                ? "border-orange text-orange"
                : "border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
              <th className="text-left p-4">Title</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Closes At</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.markets.map((m: any) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-3 transition-colors">
                <td className="p-4 text-text-primary font-medium">{m.title}</td>
                <td className="p-4 text-text-secondary capitalize">{m.category}</td>
                <td className="p-4">
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                    m.status === "open" ? "bg-green/20 text-green" :
                    m.status === "resolved" ? "bg-orange/20 text-orange" :
                    "bg-surface-3 text-text-secondary"
                  }`}>{m.status}</span>
                </td>
                <td className="p-4 text-text-secondary font-mono text-xs">
                  {new Date(m.closesAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <Link href={`/markets/${m.id}`} className="text-orange text-xs hover:underline">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create new market form page**

Create `apps/admin/app/(admin)/markets/new/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewMarketPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", category: "open", closesAt: "", resolutionCriteria: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, closesAt: new Date(form.closesAt).toISOString() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create market");
      }
      router.push("/markets");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-green transition-colors";
  const labelClass = "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  return (
    <div className="max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">New Market</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Title</label>
          <input className={fieldClass} value={form.title} onChange={set("title")} required minLength={5} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={fieldClass} value={form.description} onChange={set("description")} rows={3} required minLength={10} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={fieldClass} value={form.category} onChange={set("category")}>
            <option value="open">Open</option>
            <option value="sports">Sports</option>
            <option value="politics">Politics</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Closes At</label>
          <input type="datetime-local" className={fieldClass} value={form.closesAt} onChange={set("closesAt")} required />
        </div>
        <div>
          <label className={labelClass}>Resolution Criteria</label>
          <textarea className={fieldClass} value={form.resolutionCriteria} onChange={set("resolutionCriteria")} rows={3} required minLength={10} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-green hover:bg-green-dark text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create market"}
        </button>
      </form>
    </div>
  );
}
```

Create `apps/admin/app/api/markets/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const market = await adminApi.createMarket(body);
    return NextResponse.json(market, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

- [ ] **Step 4: Create market detail page with resolve**

Create `apps/admin/app/(admin)/markets/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SupervisorModal } from "@/components/SupervisorModal";

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [market, setMarket] = useState<any>(null);
  const [showResolve, setShowResolve] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState<"yes" | "no">("yes");

  useEffect(() => {
    fetch(`/api/markets/${id}`).then((r) => r.json()).then(setMarket);
  }, [id]);

  async function handleResolve(_password: string) {
    const res = await fetch(`/api/markets/${id}/resolve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: resolveOutcome }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? "Failed to resolve");
    }
    setShowResolve(false);
    router.push("/markets");
  }

  if (!market) return <p className="text-text-secondary text-sm">Loading…</p>;

  return (
    <div className="max-w-xl">
      {showResolve && (
        <SupervisorModal
          title="Resolve Market"
          description={`You are resolving "${market.title}" as ${resolveOutcome.toUpperCase()}. This cannot be undone.`}
          onConfirm={handleResolve}
          onCancel={() => setShowResolve(false)}
        />
      )}

      <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">{market.title}</h1>
      <p className="text-text-secondary text-sm mb-6">{market.description}</p>

      <div className="bg-surface-2 border border-border rounded-xl p-5 mb-6 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-text-secondary">Status</span><span className="text-text-primary capitalize">{market.status}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Category</span><span className="text-text-primary capitalize">{market.category}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Closes</span><span className="font-mono text-xs text-text-primary">{new Date(market.closesAt).toLocaleString()}</span></div>
      </div>

      {market.status === "closed" && (
        <div className="flex gap-3">
          <select
            value={resolveOutcome}
            onChange={(e) => setResolveOutcome(e.target.value as "yes" | "no")}
            className="flex-1 bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary"
          >
            <option value="yes">Resolve YES</option>
            <option value="no">Resolve NO</option>
          </select>
          <button
            onClick={() => setShowResolve(true)}
            className="px-5 py-2.5 bg-orange hover:bg-orange-dark text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}
```

Create `apps/admin/app/api/markets/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const data = await adminApi.markets({ id: params.id });
  return NextResponse.json(data);
}
```

Create `apps/admin/app/api/markets/[id]/resolve/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  try {
    await adminApi.resolveMarket(params.id, body.outcome);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/components/SupervisorModal.tsx apps/admin/app/\(admin\)/markets/ apps/admin/app/api/markets/
git commit -m "feat(admin): markets pages — list, new market form, detail + resolve with SupervisorModal"
```

---

## Task 12: Users pages

**Files:**
- Create: `apps/admin/app/(admin)/users/page.tsx`
- Create: `apps/admin/app/(admin)/users/[id]/page.tsx`
- Create: `apps/admin/components/UserDetailPanel.tsx`

- [ ] **Step 1: Create UserDetailPanel**

Create `apps/admin/components/UserDetailPanel.tsx`:

```tsx
interface UserDetailPanelProps {
  user: {
    id: string;
    email: string;
    username: string;
    subscriptionTier: string;
    xpLevel: string;
    xpTotal: number;
    isActive: boolean;
    isBanned: boolean;
    createdAt: string;
  };
  fpBalance: number;
}

export function UserDetailPanel({ user, fpBalance }: UserDetailPanelProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5 space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-text-secondary">Email</span>
        <span className="text-text-primary font-mono text-xs">{user.email}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Username</span>
        <span className="text-text-primary">@{user.username}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Subscription</span>
        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
          user.subscriptionTier === "elite" ? "bg-lemon/20 text-lemon" :
          user.subscriptionTier === "pro" ? "bg-orange/20 text-orange" :
          "bg-surface-3 text-text-secondary"
        }`}>{user.subscriptionTier}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">FP Balance</span>
        <span className="text-green font-semibold font-mono">⚡ {fpBalance.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">XP</span>
        <span className="text-text-primary font-mono">{user.xpTotal.toLocaleString()} ({user.xpLevel})</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Status</span>
        <span className={user.isBanned ? "text-red-400 font-semibold" : user.isActive ? "text-green font-semibold" : "text-text-secondary"}>
          {user.isBanned ? "Suspended" : user.isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Joined</span>
        <span className="font-mono text-xs text-text-secondary">{new Date(user.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create users list page**

Create `apps/admin/app/(admin)/users/page.tsx`:

```tsx
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";

interface PageProps {
  searchParams: { page?: string; search?: string; tier?: string; status?: string };
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params: Record<string, string> = {};
  if (searchParams.page) params.page = searchParams.page;
  if (searchParams.search) params.search = searchParams.search;
  if (searchParams.tier) params.tier = searchParams.tier;
  if (searchParams.status) params.status = searchParams.status;

  const data = await adminApi.users(params).catch(() => ({ users: [], total: 0, pages: 1 }));

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Users</h1>

      <form method="GET" className="flex gap-3 mb-5">
        <input
          name="search"
          defaultValue={searchParams.search}
          placeholder="Search by email…"
          className="flex-1 bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-orange"
        />
        <select name="tier" defaultValue={searchParams.tier ?? ""} className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
          <option value="">All tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-orange text-white text-sm font-semibold rounded-lg">Search</button>
      </form>

      <p className="text-xs text-text-secondary mb-3">{data.total} users found</p>

      <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Tier</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Joined</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-3 transition-colors">
                <td className="p-4 text-text-primary">{u.email}</td>
                <td className="p-4">
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                    u.subscriptionTier === "elite" ? "bg-lemon/20 text-lemon" :
                    u.subscriptionTier === "pro" ? "bg-orange/20 text-orange" :
                    "bg-surface-3 text-text-secondary"
                  }`}>{u.subscriptionTier}</span>
                </td>
                <td className="p-4">
                  <span className={u.isBanned ? "text-red-400 text-xs font-semibold" : "text-green text-xs font-semibold"}>
                    {u.isBanned ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-text-secondary">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <Link href={`/users/${u.id}`} className="text-orange text-xs hover:underline">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create user detail page**

Create `apps/admin/app/(admin)/users/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserDetailPanel } from "@/components/UserDetailPanel";
import { SupervisorModal } from "@/components/SupervisorModal";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [modal, setModal] = useState<"suspend" | "reinstate" | null>(null);

  useEffect(() => {
    fetch(`/api/users/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  async function handleSuspend(_password: string) {
    const suspend = modal === "suspend";
    const res = await fetch(`/api/users/${id}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? "Action failed");
    }
    setModal(null);
    // Refetch
    fetch(`/api/users/${id}`).then((r) => r.json()).then(setData);
  }

  if (!data) return <p className="text-text-secondary text-sm">Loading…</p>;

  return (
    <div className="max-w-xl">
      {modal && (
        <SupervisorModal
          title={modal === "suspend" ? "Suspend User" : "Reinstate User"}
          description={`You are about to ${modal} ${data.user.email}. Confirm with your password.`}
          onConfirm={handleSuspend}
          onCancel={() => setModal(null)}
        />
      )}

      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">{data.user.username}</h1>

      <UserDetailPanel user={data.user} fpBalance={data.fpBalance} />

      <div className="mt-6 flex gap-3">
        {data.user.isBanned ? (
          <button
            onClick={() => setModal("reinstate")}
            className="px-5 py-2.5 bg-green hover:bg-green-dark text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Reinstate user
          </button>
        ) : (
          <button
            onClick={() => setModal("suspend")}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Suspend user
          </button>
        )}
      </div>
    </div>
  );
}
```

Create `apps/admin/app/api/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await adminApi.userDetail(params.id);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
```

Create `apps/admin/app/api/users/[id]/suspend/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  try {
    await adminApi.suspendUser(params.id, body.suspend);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/UserDetailPanel.tsx apps/admin/app/\(admin\)/users/ apps/admin/app/api/users/
git commit -m "feat(admin): users list + detail pages with suspend/reinstate via SupervisorModal"
```

---

## Task 13: FP Adjustments page + Reviews moderation page + DisputePanel

**Files:**
- Create: `apps/admin/app/(admin)/fp-adjustments/page.tsx`
- Create: `apps/admin/app/(admin)/reviews/page.tsx`
- Create: `apps/admin/components/DisputePanel.tsx`

- [ ] **Step 1: Create FP Adjustments page**

Create `apps/admin/app/(admin)/fp-adjustments/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { SupervisorModal } from "@/components/SupervisorModal";

export default function FPAdjustmentsPage() {
  const [form, setForm] = useState({
    userId: "",
    amount: "",
    poolType: "bonus" as "bonus" | "achievement",
    reason: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleConfirm(_password: string) {
    const res = await fetch("/api/fp/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed");
    setShowModal(false);
    setSuccess(true);
    setForm({ userId: "", amount: "", poolType: "bonus", reason: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!form.userId || !form.amount || !form.reason) {
      setError("All fields required");
      return;
    }
    if (Number(form.amount) === 0) {
      setError("Amount cannot be 0");
      return;
    }
    setShowModal(true);
  }

  const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-orange transition-colors";
  const labelClass = "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  return (
    <div className="max-w-lg">
      {showModal && (
        <SupervisorModal
          title="FP Adjustment"
          description={`You are ${Number(form.amount) > 0 ? "crediting" : "debiting"} ${Math.abs(Number(form.amount))} FP ${Number(form.amount) > 0 ? "to" : "from"} user ${form.userId}. This is immutably audit-logged.`}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">FP Adjustments</h1>
      <p className="text-sm text-text-secondary mb-6">Manual FP credits and debits are immutably audit-logged. Negative amounts = debit.</p>

      {success && (
        <div className="mb-4 p-3 bg-green/10 border border-green/30 rounded-lg text-sm text-green font-semibold">
          FP adjustment recorded successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>User ID</label>
          <input className={fieldClass} value={form.userId} onChange={set("userId")} placeholder="uuid" required />
        </div>
        <div>
          <label className={labelClass}>Amount (+ credit / − debit)</label>
          <input type="number" className={fieldClass} value={form.amount} onChange={set("amount")} placeholder="e.g. 500 or -200" required />
        </div>
        <div>
          <label className={labelClass}>Pool Type</label>
          <select className={fieldClass} value={form.poolType} onChange={set("poolType")}>
            <option value="bonus">Bonus</option>
            <option value="achievement">Achievement</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Reason (min 10 chars)</label>
          <textarea className={fieldClass} value={form.reason} onChange={set("reason")} rows={2} minLength={10} required />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="px-5 py-2.5 bg-orange hover:bg-orange-dark text-white font-semibold rounded-lg text-sm transition-colors"
        >
          Submit adjustment
        </button>
      </form>
    </div>
  );
}
```

Create `apps/admin/app/api/fp/adjust/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    await adminApi.adjustFP(body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Create DisputePanel**

Create `apps/admin/components/DisputePanel.tsx`:

```tsx
"use client";

import { useState } from "react";

interface Review {
  id: string;
  productId: string;
  userId: string;
  body: string;
  rating: number;
  status: string;
  createdAt: string;
}

interface DisputePanelProps {
  review: Review;
  onAction: (id: string, action: "approved" | "rejected") => Promise<void>;
}

export function DisputePanel({ review, onAction }: DisputePanelProps) {
  const [loading, setLoading] = useState(false);

  const hoursSinceCreated = Math.floor((Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60));
  const slaHoursLeft = Math.max(0, 48 - hoursSinceCreated);

  async function handle(action: "approved" | "rejected") {
    setLoading(true);
    try {
      await onAction(review.id, action);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-text-secondary font-mono">{review.id.slice(0, 8)}…</p>
          <p className="text-xs text-text-secondary mt-0.5">Rating: {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          slaHoursLeft <= 6 ? "bg-red-500/20 text-red-400" : "bg-orange/20 text-orange"
        }`}>
          {slaHoursLeft}h SLA
        </span>
      </div>
      <p className="text-sm text-text-primary mb-4 leading-relaxed">{review.body}</p>
      <div className="flex gap-3">
        <button
          onClick={() => handle("approved")}
          disabled={loading}
          className="flex-1 py-2 text-sm font-semibold bg-green hover:bg-green-dark text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => handle("rejected")}
          disabled={loading}
          className="flex-1 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create reviews moderation page**

Create `apps/admin/app/(admin)/reviews/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { DisputePanel } from "@/components/DisputePanel";

export default function ReviewsPage() {
  const [data, setData] = useState<any>({ reviews: [], total: 0 });

  async function load() {
    const res = await fetch("/api/reviews/queue");
    const d = await res.json();
    setData(d);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: "approved" | "rejected") {
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">Review Moderation</h1>
      <p className="text-sm text-text-secondary mb-6">{data.total} flagged reviews in queue</p>

      {data.reviews.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm">Queue is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.reviews.map((r: any) => (
            <DisputePanel key={r.id} review={r} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `apps/admin/app/api/reviews/queue/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function GET() {
  const data = await adminApi.reviewQueue("1");
  return NextResponse.json(data);
}
```

Create `apps/admin/app/api/reviews/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  try {
    await adminApi.moderateReview(params.id, body.action);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/app/\(admin\)/fp-adjustments/ apps/admin/app/\(admin\)/reviews/ apps/admin/components/DisputePanel.tsx apps/admin/app/api/fp/ apps/admin/app/api/reviews/
git commit -m "feat(admin): FP adjustments form + reviews moderation queue with DisputePanel"
```

---

## Task 14: Analytics + Settings + AuditLogTable

**Files:**
- Create: `apps/admin/app/(admin)/analytics/page.tsx`
- Create: `apps/admin/app/(admin)/settings/page.tsx`
- Create: `apps/admin/components/AuditLogTable.tsx`

- [ ] **Step 1: Create AuditLogTable**

Create `apps/admin/components/AuditLogTable.tsx`:

```tsx
interface AuditEntry {
  id: string;
  actorId: string;
  targetId: string;
  action: string;
  meta: string;
  createdAt: string;
}

interface AuditLogTableProps {
  entries: AuditEntry[];
}

export function AuditLogTable({ entries }: AuditLogTableProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
            <th className="text-left p-4">Action</th>
            <th className="text-left p-4">Admin</th>
            <th className="text-left p-4">Target</th>
            <th className="text-left p-4">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-0">
              <td className="p-4 font-mono text-xs text-orange">{e.action}</td>
              <td className="p-4 font-mono text-xs text-text-secondary">{e.actorId.slice(0, 8)}…</td>
              <td className="p-4 font-mono text-xs text-text-secondary">{e.targetId.slice(0, 8)}…</td>
              <td className="p-4 font-mono text-xs text-text-secondary">
                {new Date(e.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 && (
        <p className="text-center text-text-secondary text-sm py-8">No audit entries</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create analytics page**

Create `apps/admin/app/(admin)/analytics/page.tsx`:

```tsx
import { adminApi } from "@/lib/admin-api";
import { StatCard } from "@/components/StatCard";

export default async function AnalyticsPage() {
  const analytics = await adminApi.analytics().catch(() => null);

  const tierMap: Record<string, number> = {};
  analytics?.tierCounts?.forEach((t: any) => { tierMap[t.tier] = Number(t.total); });

  const fpByType: Record<string, number> = {};
  analytics?.fpVolume?.forEach((f: any) => { fpByType[f.poolType] = Number(f.volume); });

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard label="30-day MAU" value={analytics?.mau ?? "—"} color="green" />
        <StatCard label="Daily AU" value={analytics?.dau ?? "—"} color="green" />
        <StatCard label="Pro users" value={tierMap["pro"] ?? 0} color="orange" />
        <StatCard label="Elite users" value={tierMap["elite"] ?? 0} color="lemon" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Subscriptions by Tier</h2>
          <div className="space-y-3">
            {["free", "pro", "elite"].map((tier) => {
              const total = (tierMap["free"] ?? 0) + (tierMap["pro"] ?? 0) + (tierMap["elite"] ?? 0);
              const val = tierMap[tier] ?? 0;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <div key={tier}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary capitalize">{tier}</span>
                    <span className="font-mono text-text-primary">{val} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier === "elite" ? "bg-lemon" : tier === "pro" ? "bg-orange" : "bg-green"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">FP Volume (7-day) by Pool</h2>
          <div className="space-y-2">
            {Object.entries(fpByType).map(([type, vol]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-text-secondary capitalize">{type.replace("_", " ")}</span>
                <span className="font-mono text-green">⚡ {vol.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(fpByType).length === 0 && (
              <p className="text-sm text-text-secondary">No data for the last 7 days</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create settings page**

Create `apps/admin/app/(admin)/settings/page.tsx`:

```tsx
import { getAdminUser } from "@/lib/auth";

export default function SettingsPage() {
  const admin = getAdminUser();

  return (
    <div className="max-w-lg">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Settings</h1>

      <div className="bg-surface-2 border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Admin Profile</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Email</span>
            <span className="font-mono text-text-primary">{admin?.email ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Role</span>
            <span className="text-orange font-semibold uppercase text-xs">{admin?.role ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-2 border border-orange/20 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-orange uppercase tracking-wider mb-2">2FA Reset</h2>
        <p className="text-sm text-text-secondary mb-4">
          To reset your TOTP 2FA, contact a superadmin. They will run the seed-admin script with your email to regenerate a new TOTP secret.
        </p>
        <p className="text-xs text-text-secondary font-mono bg-surface-3 px-3 py-2 rounded-lg">
          pnpm --filter api seed:admin
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add a root redirect (/) to /dashboard**

Create `apps/admin/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/components/AuditLogTable.tsx apps/admin/app/\(admin\)/analytics/ apps/admin/app/\(admin\)/settings/ apps/admin/app/page.tsx
git commit -m "feat(admin): analytics page, settings page, AuditLogTable, root redirect"
```

---

## Task 15: End-to-end smoke test

- [ ] **Step 1: Start Docker services + API**

```bash
docker compose -f infrastructure/docker-compose.yml up -d
pnpm --filter api dev
```

- [ ] **Step 2: Seed admin user**

```bash
pnpm --filter api seed:admin
```

Save the TOTP secret shown in the terminal to your authenticator app.

- [ ] **Step 3: Start admin app**

```bash
pnpm --filter admin dev
```

Open http://localhost:3002

- [ ] **Step 4: Full login flow**

1. Navigate to http://localhost:3002 — should redirect to `/login`
2. Enter the seeded admin email and password → click Sign in
3. Should redirect to `/2fa` — enter the 6-digit TOTP code from your authenticator app
4. Should redirect to `/dashboard` — KPI cards visible
5. Navigate to `/markets` → should show market list (empty or with seeded data)
6. Navigate to `/users` → should show user list
7. Navigate to `/fp-adjustments` → form renders
8. Navigate to `/reviews` → shows queue (likely empty)
9. Navigate to `/analytics` → shows analytics cards
10. Navigate to `/settings` → shows admin profile

- [ ] **Step 5: Verify SupervisorModal**

On the `/fp-adjustments` page:
1. Fill in a userId, amount (e.g. `100`), reason (`Test adjustment reason`), click Submit adjustment
2. SupervisorModal should appear asking to re-enter password
3. Enter admin password → FP adjustment recorded

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat(admin): Phase 3B complete — admin panel with 8 pages, login/2FA, supervisor confirmation"
```
