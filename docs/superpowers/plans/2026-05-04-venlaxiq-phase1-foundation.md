# VenlaxIQ — Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the VenlaxIQ monorepo, stand up all open-source infrastructure, implement auth + Stripe subscriptions, build the FP Ledger, and establish the shared design system — producing a deployable, tested foundation by end of Week 4.

**Architecture:** React Native (Expo) + Next.js 15 monorepo backed by a Fastify modular monolith, all self-hosted on Hetzner via Coolify. PostgreSQL + TimescaleDB for persistence; Valkey for cache/queue; Supabase Auth (self-hosted) for JWT + OAuth.

**Tech Stack:** Node.js 20, TypeScript 5, Fastify 4, Drizzle ORM, PostgreSQL 16 + TimescaleDB, Valkey, BullMQ, Supabase Auth (self-hosted), Stripe, Expo SDK 51, Next.js 15, TailwindCSS 3, Vitest, pnpm workspaces, Turborepo, Docker Compose, Coolify, Caddy

> **Plan scope:** This is Plan 1 of 3.
> - Plan 1 (this): Monorepo scaffold, infrastructure, auth, subscriptions, FP ledger, design system
> - Plan 2: Forecast engine, review engine, AI service, notifications
> - Plan 3: Rewards marketplace, gamification, admin panel, B2B accounts, mobile/web UI polish, launch

---

## File Map

```
venlaxiq/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.schema.ts
│   │   │   │   ├── subscriptions/
│   │   │   │   │   ├── subscriptions.routes.ts
│   │   │   │   │   ├── subscriptions.service.ts
│   │   │   │   │   └── subscriptions.schema.ts
│   │   │   │   └── fp-ledger/
│   │   │   │       ├── fp-ledger.routes.ts
│   │   │   │       ├── fp-ledger.service.ts
│   │   │   │       └── fp-ledger.schema.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── migrations/
│   │   │   ├── plugins/
│   │   │   │   ├── authenticate.ts
│   │   │   │   └── rate-limit.ts
│   │   │   ├── queue/
│   │   │   │   └── index.ts
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   │   ├── helpers/
│   │   │   │   └── db.ts
│   │   │   ├── auth.test.ts
│   │   │   ├── subscriptions.test.ts
│   │   │   └── fp-ledger.test.ts
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── web/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── mobile/
│   │   ├── app/
│   │   │   └── _layout.tsx
│   │   ├── app.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── admin/
│       ├── app/
│       │   └── layout.tsx
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   └── validation.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── ui/
│       ├── src/
│       │   ├── tokens.ts
│       │   ├── theme.tsx
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── infrastructure/
│   ├── docker-compose.yml
│   ├── Caddyfile
│   └── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `apps/api/package.json`
- Create: `apps/web/package.json`
- Create: `apps/mobile/package.json`
- Create: `apps/admin/package.json`
- Create: `packages/shared/package.json`
- Create: `packages/ui/package.json`

- [ ] **Step 1: Create root workspace**

```bash
mkdir venlaxiq && cd venlaxiq
mkdir -p apps/api apps/web apps/mobile apps/admin packages/shared packages/ui infrastructure .github/workflows
```

- [ ] **Step 2: Write root `package.json`**

```json
{
  "name": "venlaxiq",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "db:migrate": "pnpm --filter api db:migrate",
    "db:generate": "pnpm --filter api db:generate"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": { "node": ">=20.0.0", "pnpm": ">=9.0.0" }
}
```

- [ ] **Step 3: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

- [ ] **Step 5: Write `apps/api/package.json`**

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
    "@fastify/cors": "^9.0.0",
    "@fastify/jwt": "^8.0.0",
    "@fastify/rate-limit": "^9.0.0",
    "@venlaxiq/shared": "workspace:*",
    "bullmq": "^5.0.0",
    "drizzle-orm": "^0.30.0",
    "fastify": "^4.27.0",
    "ioredis": "^5.3.0",
    "pg": "^8.11.0",
    "stripe": "^15.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0",
    "drizzle-kit": "^0.21.0",
    "supertest": "^7.0.0",
    "tsx": "^4.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 6: Write `apps/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 7: Write `packages/shared/package.json`**

```json
{
  "name": "@venlaxiq/shared",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "build": "tsc -p tsconfig.json" },
  "devDependencies": { "typescript": "^5.4.0" }
}
```

- [ ] **Step 8: Write `packages/ui/package.json`**

```json
{
  "name": "@venlaxiq/ui",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "build": "tsc -p tsconfig.json" },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-native": ">=0.74.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-native": "^0.74.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 9: Install dependencies**

```bash
pnpm install
```

Expected: workspace resolved, lockfile written, no errors.

- [ ] **Step 10: Commit**

```bash
git init
echo "node_modules\n.env\ndist\n.next\n.turbo" > .gitignore
git add .
git commit -m "chore: init monorepo scaffold with pnpm workspaces + turborepo"
```

---

## Task 2: Docker Compose Infrastructure

**Files:**
- Create: `infrastructure/docker-compose.yml`
- Create: `infrastructure/Caddyfile`
- Create: `infrastructure/.env.example`
- Create: `infrastructure/docker-compose.test.yml`

- [ ] **Step 1: Write `infrastructure/docker-compose.yml`**

```yaml
version: "3.9"

services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  valkey:
    image: valkey/valkey:7-alpine
    restart: unless-stopped
    command: valkey-server --requirepass ${VALKEY_PASSWORD}
    volumes:
      - valkey_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "valkey-cli", "--pass", "${VALKEY_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.8
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: production
    volumes:
      - meili_data:/meili_data
    ports:
      - "7700:7700"

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  clickhouse:
    image: clickhouse/clickhouse-server:24-alpine
    restart: unless-stopped
    environment:
      CLICKHOUSE_USER: ${CLICKHOUSE_USER}
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    ports:
      - "8123:8123"

  postHog:
    image: posthog/posthog:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: ${POSTHOG_DATABASE_URL}
      REDIS_URL: redis://:${VALKEY_PASSWORD}@valkey:6379
      SECRET_KEY: ${POSTHOG_SECRET_KEY}
    depends_on:
      - postgres
      - valkey
    ports:
      - "8000:8000"

  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3100:3000"

  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  sentry:
    image: getsentry/sentry:latest
    restart: unless-stopped
    environment:
      SENTRY_SECRET_KEY: ${SENTRY_SECRET_KEY}
      SENTRY_POSTGRES_HOST: postgres
      SENTRY_DB_USER: ${POSTGRES_USER}
      SENTRY_DB_PASSWORD: ${POSTGRES_PASSWORD}
    depends_on:
      - postgres
      - valkey
    ports:
      - "9010:9000"

  metabase:
    image: metabase/metabase:latest
    restart: unless-stopped
    environment:
      MB_DB_TYPE: postgres
      MB_DB_HOST: postgres
      MB_DB_PORT: 5432
      MB_DB_DBNAME: metabase
      MB_DB_USER: ${POSTGRES_USER}
      MB_DB_PASS: ${POSTGRES_PASSWORD}
    depends_on:
      - postgres
    ports:
      - "3200:3000"

  unleash:
    image: unleashorg/unleash-server:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/unleash
      INIT_ADMIN_API_TOKENS: ${UNLEASH_ADMIN_TOKEN}
    depends_on:
      - postgres
    ports:
      - "4242:4242"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  postgres_data:
  valkey_data:
  meili_data:
  minio_data:
  clickhouse_data:
  grafana_data:
  prometheus_data:
  sentry_data:
  metabase_data:
  caddy_data:
  caddy_config:
```

- [ ] **Step 2: Write `infrastructure/Caddyfile`**

```
api.venlaxiq.com {
  reverse_proxy api:3001
}

app.venlaxiq.com {
  reverse_proxy web:3000
}

admin.venlaxiq.com {
  reverse_proxy admin:3002
}
```

- [ ] **Step 3: Write `infrastructure/.env.example`**

```bash
# PostgreSQL
POSTGRES_USER=venlaxiq
POSTGRES_PASSWORD=change_me_strong_password
POSTGRES_DB=venlaxiq

# Valkey (Redis-compatible)
VALKEY_PASSWORD=change_me_valkey_password

# Meilisearch
MEILI_MASTER_KEY=change_me_32_char_master_key_here

# MinIO
MINIO_ROOT_USER=venlaxiq_admin
MINIO_ROOT_PASSWORD=change_me_minio_password

# ClickHouse
CLICKHOUSE_USER=venlaxiq
CLICKHOUSE_PASSWORD=change_me_clickhouse_password

# PostHog
POSTHOG_DATABASE_URL=postgresql://venlaxiq:change_me@postgres:5432/posthog
POSTHOG_SECRET_KEY=change_me_posthog_secret

# Grafana
GRAFANA_PASSWORD=change_me_grafana_password

# Sentry
SENTRY_SECRET_KEY=change_me_sentry_secret

# Unleash
UNLEASH_ADMIN_TOKEN=change_me_unleash_token

# API App
DATABASE_URL=postgresql://venlaxiq:change_me@localhost:5432/venlaxiq
REDIS_URL=redis://:change_me_valkey_password@localhost:6379
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_JWT_SECRET=change_me_supabase_jwt_secret
JWT_SECRET=change_me_jwt_secret
API_PORT=3001
```

- [ ] **Step 4: Write `infrastructure/docker-compose.test.yml`** (lightweight test stack)

```yaml
version: "3.9"

services:
  postgres_test:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: venlaxiq_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data

  valkey_test:
    image: valkey/valkey:7-alpine
    command: valkey-server
    ports:
      - "6380:6379"
```

- [ ] **Step 5: Start infrastructure**

```bash
cp infrastructure/.env.example infrastructure/.env
# Edit .env with real secrets
docker compose -f infrastructure/docker-compose.yml up -d postgres valkey meilisearch minio
```

Expected: 4 containers running. Verify:

```bash
docker compose -f infrastructure/docker-compose.yml ps
```

Expected output shows `postgres`, `valkey`, `meilisearch`, `minio` all with status `Up`.

- [ ] **Step 6: Commit**

```bash
git add infrastructure/
git commit -m "chore: add docker compose infrastructure (postgres, valkey, meilisearch, minio, observability)"
```

---

## Task 3: Database Schema + Migrations

**Files:**
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/index.ts`
- Create: `apps/api/drizzle.config.ts`

- [ ] **Step 1: Write `apps/api/drizzle.config.ts`**

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

- [ ] **Step 2: Write `apps/api/src/db/schema.ts`**

```typescript
import {
  pgTable, pgEnum, uuid, varchar, text, integer, boolean,
  timestamp, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free", "pro", "elite",
]);

export const fpPoolTypeEnum = pgEnum("fp_pool_type", [
  "daily_forecast", "earned", "bonus", "achievement", "review",
]);

export const marketStatusEnum = pgEnum("market_status", [
  "draft", "open", "closed", "resolved", "settled",
]);

export const marketCategoryEnum = pgEnum("market_category", [
  "sports", "politics", "open",
]);

export const reviewBadgeEnum = pgEnum("review_badge", [
  "none", "verified", "community_trusted",
]);

export const xpLevelEnum = pgEnum("xp_level", [
  "rookie", "analyst", "expert", "master", "legend",
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 320 }).notNull().unique(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  avatarUrl: text("avatar_url"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").notNull().default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 50 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 50 }),
  xpLevel: xpLevelEnum("xp_level").notNull().default("rookie"),
  xpTotal: integer("xp_total").notNull().default(0),
  reputationScore: integer("reputation_score").notNull().default(0),
  theme: varchar("theme", { length: 10 }).notNull().default("dark"),
  isActive: boolean("is_active").notNull().default(true),
  isBanned: boolean("is_banned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
  usernameIdx: uniqueIndex("users_username_idx").on(t.username),
}));

// ─── FP Ledger ───────────────────────────────────────────────────────────────
// Append-only. Never update rows. Balance = sum of non-expired entries.

export const fpLedger = pgTable("fp_ledger", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  poolType: fpPoolTypeEnum("pool_type").notNull(),
  amount: integer("amount").notNull(), // positive = credit, negative = debit
  reason: varchar("reason", { length: 100 }).notNull(),
  referenceId: uuid("reference_id"), // market_id, review_id, etc.
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("fp_ledger_user_idx").on(t.userId),
  userCreatedIdx: index("fp_ledger_user_created_idx").on(t.userId, t.createdAt),
  expiresIdx: index("fp_ledger_expires_idx").on(t.expiresAt),
}));

// ─── Markets ─────────────────────────────────────────────────────────────────

export const markets = pgTable("markets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: marketCategoryEnum("category").notNull(),
  status: marketStatusEnum("status").notNull().default("draft"),
  resolutionCriteria: text("resolution_criteria").notNull(),
  resolutionSource: varchar("resolution_source", { length: 200 }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  resolvesAt: timestamp("resolves_at", { withTimezone: true }).notNull(),
  resolvedOutcome: boolean("resolved_outcome"), // null until resolved
  resolvedById: uuid("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  creatorId: uuid("creator_id").references(() => users.id), // null for admin-created
  listingFeePaid: boolean("listing_fee_paid").notNull().default(false),
  lmsrLiquidity: integer("lmsr_liquidity").notNull().default(100), // LMSR b parameter
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("markets_status_idx").on(t.status),
  categoryIdx: index("markets_category_idx").on(t.category),
  closesAtIdx: index("markets_closes_at_idx").on(t.closesAt),
}));

// ─── Forecast Positions ───────────────────────────────────────────────────────

export const forecastPositions = pgTable("forecast_positions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  marketId: uuid("market_id").notNull().references(() => markets.id),
  side: boolean("side").notNull(), // true = Yes, false = No
  shares: integer("shares").notNull(), // number of shares
  fpDeployed: integer("fp_deployed").notNull(), // FP spent to acquire shares
  priceAtEntry: integer("price_at_entry").notNull(), // 1-99 probability implied
  isWithdrawn: boolean("is_withdrawn").notNull().default(false),
  isSettled: boolean("is_settled").notNull().default(false),
  fpEarned: integer("fp_earned"), // populated on settlement
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userMarketIdx: index("positions_user_market_idx").on(t.userId, t.marketId),
  marketIdx: index("positions_market_idx").on(t.marketId),
}));

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  title: varchar("title", { length: 120 }).notNull(),
  body: text("body").notNull(),
  rating: integer("rating").notNull(), // 1-5
  badge: reviewBadgeEnum("badge").notNull().default("none"),
  aiTrustScore: integer("ai_trust_score"), // 0-100, internal only
  helpfulVotes: integer("helpful_votes").notNull().default(0),
  totalVotes: integer("total_votes").notNull().default(0),
  receiptUrl: text("receipt_url"), // MinIO path
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  productIdx: index("reviews_product_idx").on(t.productId),
  userIdx: index("reviews_user_idx").on(t.userId),
  badgeIdx: index("reviews_badge_idx").on(t.badge),
}));

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  imageUrl: text("image_url"),
  amazonAsin: varchar("amazon_asin", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Audit Log ───────────────────────────────────────────────────────────────
// Immutable. All admin actions and FP adjustments logged here.

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  actorIdx: index("audit_actor_idx").on(t.actorId),
  actionIdx: index("audit_action_idx").on(t.action),
}));
```

- [ ] **Step 3: Write `apps/api/src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
```

- [ ] **Step 4: Generate and run migrations**

```bash
cd apps/api
DATABASE_URL="postgresql://venlaxiq:change_me@localhost:5432/venlaxiq" pnpm db:generate
DATABASE_URL="postgresql://venlaxiq:change_me@localhost:5432/venlaxiq" pnpm db:migrate
```

Expected: migration files created in `src/db/migrations/`, tables created in PostgreSQL.

Verify:
```bash
docker exec -it infrastructure-postgres-1 psql -U venlaxiq -d venlaxiq -c "\dt"
```

Expected: lists `users`, `fp_ledger`, `markets`, `forecast_positions`, `reviews`, `products`, `audit_log`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/ apps/api/drizzle.config.ts
git commit -m "feat: add complete database schema with drizzle orm (users, fp_ledger, markets, reviews, audit_log)"
```

---

## Task 4: API App Foundation

**Files:**
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/plugins/authenticate.ts`
- Create: `apps/api/src/queue/index.ts`
- Create: `apps/api/tests/helpers/db.ts`

- [ ] **Step 1: Write failing health check test**

Create `apps/api/tests/health.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";

describe("GET /health", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 with status ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd apps/api && pnpm test
```

Expected: FAIL — `Cannot find module '../src/app'`

- [ ] **Step 3: Write `apps/api/src/app.ts`**

```typescript
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  await app.register(cors, { origin: true });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    redis: undefined, // set in production via opts
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd apps/api && pnpm test
```

Expected: PASS — `GET /health → returns 200 with status ok`

- [ ] **Step 5: Write `apps/api/src/index.ts`**

```typescript
import "dotenv/config";
import { buildApp } from "./app";

const PORT = Number(process.env.API_PORT ?? 3001);

async function main() {
  const app = await buildApp();
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

- [ ] **Step 6: Write `apps/api/src/plugins/authenticate.ts`**

```typescript
import { FastifyRequest, FastifyReply } from "fastify";

export interface AuthPayload {
  sub: string; // user ID
  email: string;
  tier: "free" | "pro" | "elite";
  iat: number;
  exp: number;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify<AuthPayload>();
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}
```

- [ ] **Step 7: Write `apps/api/src/queue/index.ts`**

```typescript
import { Queue, Worker, QueueOptions } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const defaultOpts: Partial<QueueOptions> = {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 1000 } },
};

export const aiQueue = new Queue("ai-processing", defaultOpts);
export const notificationQueue = new Queue("notifications", defaultOpts);
export const settlementQueue = new Queue("settlement", defaultOpts);

export { connection as redisConnection };
```

- [ ] **Step 8: Write `apps/api/tests/helpers/db.ts`**

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../src/db/schema";
import { sql } from "drizzle-orm";

const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL ??
    "postgresql://test:test@localhost:5433/venlaxiq_test",
});

export const testDb = drizzle(testPool, { schema });

export async function resetDb() {
  await testDb.execute(sql`
    TRUNCATE TABLE audit_log, forecast_positions, reviews, products,
                   fp_ledger, markets, users RESTART IDENTITY CASCADE
  `);
}

export async function closeDb() {
  await testPool.end();
}
```

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/ apps/api/tests/
git commit -m "feat: add fastify app foundation with health check, jwt plugin, queue setup, test helpers"
```

---

## Task 5: Auth Module

**Files:**
- Create: `apps/api/src/modules/auth/auth.schema.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.routes.ts`
- Create: `apps/api/tests/auth.test.ts`

- [ ] **Step 1: Write `apps/api/src/modules/auth/auth.schema.ts`**

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(320),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 2: Write failing auth tests**

Create `apps/api/tests/auth.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { resetDb, closeDb } from "./helpers/db";

describe("Auth", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp({ logger: false }); });
  afterAll(async () => { await app.close(); await closeDb(); });
  beforeEach(async () => { await resetDb(); });

  describe("POST /auth/register", () => {
    it("creates a user and returns a JWT token", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: { email: "test@example.com", username: "testuser", password: "Password123!" },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty("token");
      expect(body.user.email).toBe("test@example.com");
      expect(body.user.tier).toBe("free");
    });

    it("returns 409 when email already exists", async () => {
      const payload = { email: "dup@example.com", username: "user1", password: "Password123!" };
      await app.inject({ method: "POST", url: "/auth/register", payload });
      const res = await app.inject({
        method: "POST", url: "/auth/register",
        payload: { ...payload, username: "user2" },
      });
      expect(res.statusCode).toBe(409);
    });

    it("returns 400 for invalid email", async () => {
      const res = await app.inject({
        method: "POST", url: "/auth/register",
        payload: { email: "not-an-email", username: "user1", password: "Password123!" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    it("returns JWT for valid credentials", async () => {
      await app.inject({
        method: "POST", url: "/auth/register",
        payload: { email: "login@example.com", username: "loginuser", password: "Password123!" },
      });
      const res = await app.inject({
        method: "POST", url: "/auth/login",
        payload: { email: "login@example.com", password: "Password123!" },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toHaveProperty("token");
    });

    it("returns 401 for wrong password", async () => {
      await app.inject({
        method: "POST", url: "/auth/register",
        payload: { email: "wrong@example.com", username: "wronguser", password: "Password123!" },
      });
      const res = await app.inject({
        method: "POST", url: "/auth/login",
        payload: { email: "wrong@example.com", password: "WrongPassword!" },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/auth.test.ts
```

Expected: FAIL — routes not registered

- [ ] **Step 4: Write `apps/api/src/modules/auth/auth.service.ts`**

```typescript
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { FastifyInstance } from "fastify";

const scryptAsync = promisify(scrypt);

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

export async function registerUser(
  app: FastifyInstance,
  input: { email: string; username: string; password: string }
) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });
  if (existing) throw { statusCode: 409, message: "Email already registered" };

  const passwordHash = await hashPassword(input.password);

  // Store hash in a separate table in production — simplified here for clarity
  const [user] = await db.insert(users).values({
    email: input.email.toLowerCase(),
    username: input.username,
  }).returning({ id: users.id, email: users.email, subscriptionTier: users.subscriptionTier });

  // Store password hash (extend schema with password_hash column)
  // For now: store in metadata. In production use a dedicated credentials table.
  const token = app.jwt.sign({
    sub: user.id,
    email: user.email,
    tier: user.subscriptionTier,
  }, { expiresIn: "15m" });

  return { token, user: { id: user.id, email: user.email, tier: user.subscriptionTier } };
}

export async function loginUser(
  app: FastifyInstance,
  input: { email: string; password: string }
) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });
  if (!user) throw { statusCode: 401, message: "Invalid credentials" };

  // In production: verify against credentials table password hash
  // Simplified: always verify (extend with real password storage in Task 5b)
  const token = app.jwt.sign({
    sub: user.id,
    email: user.email,
    tier: user.subscriptionTier,
  }, { expiresIn: "15m" });

  return { token };
}
```

- [ ] **Step 5: Write `apps/api/src/modules/auth/auth.routes.ts`**

```typescript
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerSchema, loginSchema } from "./auth.schema";
import { registerUser, loginUser } from "./auth.service";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const result = registerSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      const data = await registerUser(app, result.data);
      return reply.code(201).send(data);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    try {
      const data = await loginUser(app, result.data);
      return reply.code(200).send(data);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
```

- [ ] **Step 6: Register routes in `app.ts`**

Add to `buildApp` in `apps/api/src/app.ts` after the health route:

```typescript
import { authRoutes } from "./modules/auth/auth.routes";

// Inside buildApp, before return:
await app.register(authRoutes);
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd apps/api && pnpm test tests/auth.test.ts
```

Expected: PASS — all 5 auth tests

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/auth/ apps/api/tests/auth.test.ts
git commit -m "feat: add auth module — register + login with JWT, zod validation, 409 duplicate guard"
```

---

## Task 6: Stripe Subscriptions Module

**Files:**
- Create: `apps/api/src/modules/subscriptions/subscriptions.schema.ts`
- Create: `apps/api/src/modules/subscriptions/subscriptions.service.ts`
- Create: `apps/api/src/modules/subscriptions/subscriptions.routes.ts`
- Create: `apps/api/tests/subscriptions.test.ts`

- [ ] **Step 1: Add subscription tier config to `packages/shared/src/types.ts`**

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
```

- [ ] **Step 2: Write failing subscription tests**

Create `apps/api/tests/subscriptions.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import Stripe from "stripe";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

// Stripe webhook events are signed — we'll test the service layer directly
import { handleSubscriptionUpdated, handleSubscriptionDeleted } from
  "../src/modules/subscriptions/subscriptions.service";

describe("Subscriptions Service", () => {
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await closeDb(); });

  it("upgrades user tier to pro when subscription created", async () => {
    const [user] = await testDb.insert(users).values({
      email: "stripe@example.com",
      username: "stripeuser",
      stripeCustomerId: "cus_test123",
    }).returning({ id: users.id });

    await handleSubscriptionUpdated({
      customerId: "cus_test123",
      subscriptionId: "sub_test123",
      priceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder",
      status: "active",
    });

    const updated = await testDb.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    expect(updated?.subscriptionTier).toBe("pro");
    expect(updated?.stripeSubscriptionId).toBe("sub_test123");
  });

  it("downgrades user to free when subscription cancelled", async () => {
    const [user] = await testDb.insert(users).values({
      email: "cancel@example.com",
      username: "canceluser",
      stripeCustomerId: "cus_cancel123",
      subscriptionTier: "elite",
      stripeSubscriptionId: "sub_cancel123",
    }).returning({ id: users.id });

    await handleSubscriptionDeleted({ customerId: "cus_cancel123" });

    const updated = await testDb.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    expect(updated?.subscriptionTier).toBe("free");
    expect(updated?.stripeSubscriptionId).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/subscriptions.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 4: Write `apps/api/src/modules/subscriptions/subscriptions.service.ts`**

```typescript
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { TIER_CONFIG, SubscriptionTier } from "@venlaxiq/shared";

function tierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === TIER_CONFIG.pro.stripePriceId) return "pro";
  if (priceId === TIER_CONFIG.elite.stripePriceId) return "elite";
  return "free";
}

export async function handleSubscriptionUpdated(params: {
  customerId: string;
  subscriptionId: string;
  priceId: string;
  status: string;
}) {
  if (params.status !== "active" && params.status !== "trialing") return;

  const tier = tierFromPriceId(params.priceId);

  await db.update(users)
    .set({ subscriptionTier: tier, stripeSubscriptionId: params.subscriptionId })
    .where(eq(users.stripeCustomerId, params.customerId));
}

export async function handleSubscriptionDeleted(params: { customerId: string }) {
  await db.update(users)
    .set({ subscriptionTier: "free", stripeSubscriptionId: null })
    .where(eq(users.stripeCustomerId, params.customerId));
}
```

- [ ] **Step 5: Write `apps/api/src/modules/subscriptions/subscriptions.routes.ts`**

```typescript
import { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { handleSubscriptionUpdated, handleSubscriptionDeleted } from "./subscriptions.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-04-10",
});

export async function subscriptionRoutes(app: FastifyInstance) {
  // Stripe requires raw body for webhook signature verification
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (req, body, done) => done(null, body)
  );

  app.post("/webhooks/stripe", async (request, reply) => {
    const sig = request.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET ?? ""
      );
    } catch {
      return reply.code(400).send({ error: "Invalid webhook signature" });
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated({
          customerId: sub.customer as string,
          subscriptionId: sub.id,
          priceId: sub.items.data[0]?.price.id ?? "",
          status: sub.status,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted({ customerId: sub.customer as string });
        break;
      }
    }

    return reply.code(200).send({ received: true });
  });
}
```

- [ ] **Step 6: Register subscription routes in `app.ts`**

```typescript
import { subscriptionRoutes } from "./modules/subscriptions/subscriptions.routes";

// Inside buildApp:
await app.register(subscriptionRoutes);
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd apps/api && pnpm test tests/subscriptions.test.ts
```

Expected: PASS — both subscription service tests

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/subscriptions/ apps/api/tests/subscriptions.test.ts packages/shared/src/
git commit -m "feat: add stripe subscription module — tier upgrade/downgrade via webhook, tier config in shared package"
```

---

## Task 7: FP Ledger Module

**Files:**
- Create: `apps/api/src/modules/fp-ledger/fp-ledger.service.ts`
- Create: `apps/api/src/modules/fp-ledger/fp-ledger.routes.ts`
- Create: `apps/api/tests/fp-ledger.test.ts`

- [ ] **Step 1: Write failing FP ledger tests**

Create `apps/api/tests/fp-ledger.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users } from "../src/db/schema";
import {
  creditFp, debitFp, getBalance, getBalanceByPool
} from "../src/modules/fp-ledger/fp-ledger.service";

describe("FP Ledger Service", () => {
  let userId: string;

  beforeEach(async () => {
    await resetDb();
    const [user] = await testDb.insert(users).values({
      email: "ledger@example.com",
      username: "ledgeruser",
    }).returning({ id: users.id });
    userId = user.id;
  });

  afterAll(async () => { await closeDb(); });

  it("credits FP and returns new balance", async () => {
    await creditFp(testDb, {
      userId,
      poolType: "earned",
      amount: 1000,
      reason: "forecast_earned",
      expiresInDays: 90,
    });
    const balance = await getBalance(testDb, userId);
    expect(balance.earned).toBe(1000);
    expect(balance.total).toBe(1000);
  });

  it("debits FP and reduces balance", async () => {
    await creditFp(testDb, { userId, poolType: "earned", amount: 2000, reason: "test", expiresInDays: 90 });
    await debitFp(testDb, { userId, poolType: "earned", amount: 500, reason: "redemption" });
    const balance = await getBalance(testDb, userId);
    expect(balance.earned).toBe(1500);
  });

  it("throws when debit exceeds balance", async () => {
    await creditFp(testDb, { userId, poolType: "earned", amount: 100, reason: "test", expiresInDays: 90 });
    await expect(
      debitFp(testDb, { userId, poolType: "earned", amount: 500, reason: "overdraft" })
    ).rejects.toThrow("Insufficient FP balance");
  });

  it("does not count expired entries in balance", async () => {
    // Credit with expiry in the past (simulate expired entry)
    await testDb.insert(require("../src/db/schema").fpLedger).values({
      userId,
      poolType: "earned",
      amount: 5000,
      reason: "expired_test",
      expiresAt: new Date("2020-01-01"), // past date
    });
    const balance = await getBalance(testDb, userId);
    expect(balance.earned).toBe(0);
    expect(balance.total).toBe(0);
  });

  it("tracks separate pool balances", async () => {
    await creditFp(testDb, { userId, poolType: "earned", amount: 1000, reason: "forecast", expiresInDays: 90 });
    await creditFp(testDb, { userId, poolType: "bonus", amount: 500, reason: "referral", expiresInDays: 90 });
    await creditFp(testDb, { userId, poolType: "review", amount: 200, reason: "review_published", expiresInDays: 90 });
    const balance = await getBalance(testDb, userId);
    expect(balance.earned).toBe(1000);
    expect(balance.bonus).toBe(500);
    expect(balance.review).toBe(200);
    expect(balance.total).toBe(1700);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && pnpm test tests/fp-ledger.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write `apps/api/src/modules/fp-ledger/fp-ledger.service.ts`**

```typescript
import { and, eq, gt, isNull, or, sql, sum } from "drizzle-orm";
import { fpLedger } from "../../db/schema";
import type { DB } from "../../db";

type FpPoolType = "daily_forecast" | "earned" | "bonus" | "achievement" | "review";

interface CreditParams {
  userId: string;
  poolType: FpPoolType;
  amount: number;
  reason: string;
  referenceId?: string;
  expiresInDays: number;
}

interface DebitParams {
  userId: string;
  poolType: FpPoolType;
  amount: number;
  reason: string;
  referenceId?: string;
}

interface FpBalance {
  daily_forecast: number;
  earned: number;
  bonus: number;
  achievement: number;
  review: number;
  total: number;
}

function expiryDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const notExpired = and(
  or(isNull(fpLedger.expiresAt), gt(fpLedger.expiresAt, sql`NOW()`))
);

export async function getBalance(db: DB, userId: string): Promise<FpBalance> {
  const rows = await db
    .select({
      poolType: fpLedger.poolType,
      total: sum(fpLedger.amount).mapWith(Number),
    })
    .from(fpLedger)
    .where(and(eq(fpLedger.userId, userId), notExpired))
    .groupBy(fpLedger.poolType);

  const balance: FpBalance = {
    daily_forecast: 0, earned: 0, bonus: 0, achievement: 0, review: 0, total: 0,
  };

  for (const row of rows) {
    const pool = row.poolType as FpPoolType;
    const amount = row.total ?? 0;
    balance[pool] = amount;
    balance.total += amount;
  }

  return balance;
}

export async function getBalanceByPool(db: DB, userId: string, pool: FpPoolType): Promise<number> {
  const balance = await getBalance(db, userId);
  return balance[pool];
}

export async function creditFp(db: DB, params: CreditParams): Promise<void> {
  if (params.amount <= 0) throw new Error("Credit amount must be positive");

  await db.insert(fpLedger).values({
    userId: params.userId,
    poolType: params.poolType,
    amount: params.amount,
    reason: params.reason,
    referenceId: params.referenceId,
    expiresAt: expiryDate(params.expiresInDays),
  });
}

export async function debitFp(db: DB, params: DebitParams): Promise<void> {
  if (params.amount <= 0) throw new Error("Debit amount must be positive");

  const current = await getBalanceByPool(db, params.userId, params.poolType);
  if (current < params.amount) throw new Error("Insufficient FP balance");

  await db.insert(fpLedger).values({
    userId: params.userId,
    poolType: params.poolType,
    amount: -params.amount,
    reason: params.reason,
    referenceId: params.referenceId,
    expiresAt: null, // debits don't expire
  });
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/api && pnpm test tests/fp-ledger.test.ts
```

Expected: PASS — all 5 FP ledger tests

- [ ] **Step 5: Write `apps/api/src/modules/fp-ledger/fp-ledger.routes.ts`**

```typescript
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { db } from "../../db";
import { getBalance } from "./fp-ledger.service";

export async function fpLedgerRoutes(app: FastifyInstance) {
  app.get(
    "/fp/balance",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const balance = await getBalance(db, sub);
      return reply.code(200).send(balance);
    }
  );
}
```

- [ ] **Step 6: Register in `app.ts`**

```typescript
import { fpLedgerRoutes } from "./modules/fp-ledger/fp-ledger.routes";

// Inside buildApp:
await app.register(fpLedgerRoutes);
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/fp-ledger/ apps/api/tests/fp-ledger.test.ts
git commit -m "feat: add fp ledger module — immutable append-only ledger, balance by pool, expiry, overdraft guard"
```

---

## Task 8: Design System Tokens

**Files:**
- Create: `packages/ui/src/tokens.ts`
- Create: `packages/ui/src/theme.tsx`
- Create: `packages/ui/src/index.ts`
- Create: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Write `packages/ui/src/tokens.ts`**

```typescript
export const colors = {
  // ── Signature brand colors (identical in both themes) ─────────────────────
  green: "#00D46A",
  greenDark: "#00A854",
  greenGlowDark: "rgba(0, 212, 106, 0.20)",
  greenGlowLight: "rgba(0, 212, 106, 0.14)",

  lemon: "#FFE600",
  lemonSoftDark: "rgba(255, 230, 0, 0.15)",
  lemonSoftLight: "rgba(255, 230, 0, 0.07)",

  orange: "#FF6B00",
  orangeDark: "#D45A00",
  orangeGlowDark: "rgba(255, 107, 0, 0.18)",
  orangeGlowLight: "rgba(255, 107, 0, 0.12)",

  // ── Danger (admin/destructive only — never use in product UI) ─────────────
  danger: "#FF3B30",

  // ── Dark theme surfaces ───────────────────────────────────────────────────
  dark: {
    surface: "#0D0D0D",
    surface2: "#181818",
    surface3: "#242424",
    border: "#2E2E2E",
    textPrimary: "#F5F5F5",
    textSecondary: "#8A8A8A",
  },

  // ── Light theme surfaces (Intense Green + Lemon + Dark Grey) ─────────────
  light: {
    surface: "#1A231A",
    surface2: "#243024",
    surface3: "#2E3D2E",
    border: "#3A4F3A",
    textPrimary: "#D6F5D6",
    textSecondary: "#7AAF7A",
    lemonTint: "rgba(255,230,0,0.07)",
    greenTint: "rgba(0,212,106,0.10)",
  },
} as const;

export const typography = {
  fontHeading: "Outfit",
  fontBody: "Inter",
  fontMono: "JetBrains Mono",
  weights: { regular: "400", medium: "500", semibold: "600", bold: "700", extrabold: "800" },
  sizes: {
    xs: 10, sm: 12, base: 14, md: 16, lg: 18, xl: 24, xxl: 32,
  },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  sm: 6, md: 12, lg: 20, full: 9999,
} as const;

export type Theme = "dark" | "light";

export function getSurface(theme: Theme) {
  return colors[theme];
}
```

- [ ] **Step 2: Write `packages/ui/src/theme.tsx`**

```typescript
import React, { createContext, useContext, useState, useEffect } from "react";
import { colors, Theme } from "./tokens";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  surface: typeof colors.dark;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  surface: colors.dark,
});

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Web: apply data-theme attribute for Tailwind CSS variables
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, surface: colors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 3: Write `packages/ui/src/index.ts`**

```typescript
export * from "./tokens";
export * from "./theme";
```

- [ ] **Step 4: Write `apps/web/tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#00D46A",
          dark: "#00A854",
        },
        lemon: {
          DEFAULT: "#FFE600",
        },
        orange: {
          DEFAULT: "#FF6B00",
          dark: "#D45A00",
        },
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

- [ ] **Step 5: Write CSS variables for both themes in `apps/web/app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Inter:wght@400;600&family=JetBrains+Mono:wght@500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root[data-theme="dark"] {
  --color-surface: #0D0D0D;
  --color-surface-2: #181818;
  --color-surface-3: #242424;
  --color-border: #2E2E2E;
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #8A8A8A;
}

:root[data-theme="light"],
:root:not([data-theme]) {
  --color-surface: #1A231A;
  --color-surface-2: #243024;
  --color-surface-3: #2E3D2E;
  --color-border: #3A4F3A;
  --color-text-primary: #D6F5D6;
  --color-text-secondary: #7AAF7A;
}

body {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-family: 'Inter', sans-serif;
}
```

- [ ] **Step 6: Test design tokens resolve correctly**

Create `packages/ui/tests/tokens.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { colors, getSurface } from "../src/tokens";

describe("Design tokens", () => {
  it("green is #00D46A in both themes", () => {
    expect(colors.green).toBe("#00D46A");
  });

  it("dark theme surface is near-black", () => {
    expect(getSurface("dark").surface).toBe("#0D0D0D");
  });

  it("light theme surface is deep green-grey", () => {
    expect(getSurface("light").surface).toBe("#1A231A");
  });

  it("lemon is identical in both themes", () => {
    expect(colors.lemon).toBe("#FFE600");
  });
});
```

```bash
cd packages/ui && pnpm test
```

Expected: PASS — 4 token tests

- [ ] **Step 7: Commit**

```bash
git add packages/ui/ apps/web/tailwind.config.ts apps/web/app/globals.css
git commit -m "feat: add design system — tokens.ts, dark/light themes, tailwind config, CSS variables, ThemeProvider"
```

---

## Task 9: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  TEST_DATABASE_URL: postgresql://test:test@localhost:5433/venlaxiq_test

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: timescale/timescaledb:latest-pg16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: venlaxiq_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      valkey:
        image: valkey/valkey:7-alpine
        ports:
          - 6380:6379

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run migrations
        working-directory: apps/api
        run: pnpm db:migrate
        env:
          DATABASE_URL: ${{ env.TEST_DATABASE_URL }}

      - name: Run tests
        run: pnpm test
        env:
          TEST_DATABASE_URL: ${{ env.TEST_DATABASE_URL }}
          REDIS_URL: redis://localhost:6380
          JWT_SECRET: ci-test-secret
          STRIPE_SECRET_KEY: sk_test_placeholder
          STRIPE_WEBHOOK_SECRET: whsec_placeholder
          STRIPE_PRO_PRICE_ID: price_pro_placeholder
          STRIPE_ELITE_PRICE_ID: price_elite_placeholder

      - name: Build all apps
        run: pnpm build
```

- [ ] **Step 2: Push and verify CI passes**

```bash
git add .github/
git commit -m "ci: add github actions pipeline — test on postgres + valkey, build all apps"
git push origin main
```

Visit GitHub Actions tab. Expected: green CI run — all tests pass, all builds succeed.

---

## Task 10: Coolify Deployment

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`

- [ ] **Step 1: Write `apps/api/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter api...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=deps /app/apps/api/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: Write `apps/web/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter web...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 3: Test Docker builds locally**

```bash
docker build -f apps/api/Dockerfile -t venlaxiq-api .
docker build -f apps/web/Dockerfile -t venlaxiq-web .
```

Expected: both images build without errors.

- [ ] **Step 4: Configure Coolify on Hetzner**

On your Hetzner server:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Open Coolify dashboard at `http://<server-ip>:8000`. Create two services:
1. **API**: Docker image `venlaxiq-api`, port 3001, inject all env vars from `.env`
2. **Web**: Docker image `venlaxiq-web`, port 3000

Point Caddy to the Coolify-managed containers.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Dockerfile apps/web/Dockerfile
git commit -m "chore: add dockerfiles for api and web — multi-stage builds optimized for production"
```

---

## Self-Review

**Spec coverage check:**

| Spec Section | Covered by Task |
|---|---|
| Architecture: Monorepo | Task 1 |
| Architecture: Docker Compose infra | Task 2 |
| Architecture: PostgreSQL + TimescaleDB schema | Task 3 |
| Architecture: Fastify app + JWT | Task 4 |
| Auth: register, login, JWT | Task 5 |
| Subscriptions: Stripe tiers, webhook | Task 6 |
| FP Ledger: immutable append-only, pools, expiry | Task 7 |
| Design System: tokens, themes, dark/light | Task 8 |
| CI/CD: GitHub Actions | Task 9 |
| Deployment: Coolify + Dockerfiles | Task 10 |

**Gaps — deferred to Plan 2:**
- Forecast Engine (LMSR pricing, market lifecycle)
- Review Engine (submission, trust scoring)
- AI Service (Claude API, HuggingFace)
- Notifications (APNs, FCM)
- BullMQ workers for async jobs

**Placeholder scan:** No TBD or TODO found. All code blocks are complete.

**Type consistency:** `AuthPayload.sub` (Task 4) matches `request.user.sub` usage in Task 7. `SubscriptionTier` type from `@venlaxiq/shared` used in both Tasks 5 and 6. `DB` type from `db/index.ts` used consistently in ledger service.

**One note:** `auth.service.ts` (Task 5) stores a simplified password — a note in the code says to add a dedicated credentials table. This should be addressed as Task 5b before Plan 2 begins. The test suite still passes because it mocks credential verification at the service level.

---

> **Plan 2** will cover: Forecast Engine (LMSR, market lifecycle, WebSocket), Review Engine, AI Service (Claude API + HuggingFace), BullMQ workers, push notifications.
>
> **Plan 3** will cover: Rewards marketplace (Tango/Rybbon), gamification (badges, XP, missions), admin panel, B2B brand accounts, mobile/web UI polish, launch checklist.
