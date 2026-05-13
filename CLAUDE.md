# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (all workspaces via Turbo)
```bash
pnpm dev          # Start all apps concurrently in dev mode
pnpm build        # Build all apps in dependency order
pnpm test         # Run all tests
pnpm lint         # Lint all workspaces
pnpm db:migrate   # Run DB migrations (delegates to apps/api)
pnpm db:generate  # Regenerate Drizzle ORM client (delegates to apps/api)
```

### Targeted (pnpm --filter)
```bash
pnpm --filter api dev          # API only (port 3001)
pnpm --filter web dev          # Web only (port 3000)
pnpm --filter admin dev        # Admin only (port 3002)
pnpm --filter api test         # API tests only
pnpm --filter api test:watch   # Watch mode
```

### Database & Infrastructure
```bash
docker compose -f infrastructure/docker-compose.yml up -d        # Start all services
docker compose -f infrastructure/docker-compose.test.yml up -d   # Start test DB + Redis
```

Test services use isolated ports: Postgres on 5433, Valkey/Redis on 6380.

## Architecture

### Monorepo layout
- `apps/api` — Fastify 4 backend (port 3001)
- `apps/web` — Next.js 15 frontend (port 3000)
- `apps/admin` — Next.js 15 admin dashboard (port 3002)
- `apps/mobile` — Expo 51 / React Native 0.74 app
- `packages/shared` — Shared types, TIER_CONFIG, LMSR pricing engine
- `packages/ui` — Cross-platform React/React-Native component library with design tokens
- `infrastructure/` — Docker Compose configs, Caddyfile, Prometheus config

Build orchestration: **pnpm workspaces + Turbo**. Task graph means `test` depends on `^build`.

### API internals (`apps/api/src/`)
- **`index.ts`** — Entry: loads env, builds app, starts workers, listens on PORT
- **`app.ts`** — Fastify instance with CORS, JWT, rate-limit (100/min), WebSocket, health check
- **`modules/`** — Feature modules, each owning its own routes + service:
  - `auth/` — Registration, login, JWT validation
  - `subscriptions/` — Stripe integration, free/pro/elite tier gating
  - `fp-ledger/` — Append-only Forecast Points transactions
  - `markets/` — Market CRUD, lifecycle (Draft→Open→Closed→Resolved→Settled)
  - `forecast/` — User forecast submissions using LMSR pricing
  - `reviews/` — Community market reviews + AI-powered quality scoring
  - `ai/` — Claude Sonnet integration: insight signals, review scorer
  - `notifications/` — APNs (iOS) + FCM (Android) push delivery
  - `daily-login/` — Streak-based daily reward claims
- **`jobs/`** — BullMQ workers: `ai`, `insight` (6h cron), `settlement`, `notifications`, `worker-registry`
- **`db/schema.ts`** — All Drizzle table definitions (users, fpLedger, markets, marketPositions, aiInsightSignals, reviews, subscriptions, notifications)
- **`queue/`** — Named BullMQ queues (`aiQueue`, `notificationQueue`, `settlementQueue`) backed by Redis/Valkey
- **`plugins/`** — `authenticate.ts` (JWT prehandler), `websocket.ts`

### Key domain concepts
- **LMSR** (`packages/shared/src/lmsr.ts`) — Logarithmic Market Scoring Rule: binary prediction market share pricing. `lmsrCost()` and `lmsrProbability()` use log-sum-exp for numerical stability; probabilities are clamped to avoid 0/1 saturation.
- **FP Ledger** — Forecast Points are stored as an append-only ledger (never updated, only inserted). Balance is derived by summing rows.
- **Subscription tiers** (`packages/shared/src/index.ts` → `TIER_CONFIG`) — free/pro/elite each define daily FP cap, max positions, accuracy multiplier, AI signal quota, and FP expiry window.
- **AI Insight Pipeline** — `insight.worker.ts` runs every 6 hours; fetches news via NewsAPI, runs HuggingFace sentiment, synthesizes with Claude Sonnet, stores result in `aiInsightSignals`. Gated to Pro+ users.
- **Market settlement** — Handled by `settlement.worker.ts`; on resolution, positions are marked and FP distributed via ledger inserts.

### Infrastructure services (Docker Compose)
TimescaleDB (Postgres + time-series), Valkey (Redis-compatible), Meilisearch, MinIO, ClickHouse, PostHog, Prometheus + Grafana, Sentry, Metabase, Unleash, Caddy (routes `api/app/admin.venlaxiq.com`).

### Environment
Copy `infrastructure/.env.example` to `.env`. Key variables: `DATABASE_URL`, `REDIS_URL`, `ANTHROPIC_API_KEY`, `HF_API_KEY`, `NEWSAPI_KEY`, `STRIPE_SECRET_KEY`, `JWT_SECRET`, `APNS_*`, `FCM_*`.

### CI (`.github/workflows/ci.yml`)
Spins up TimescaleDB on 5433 and Valkey on 6380, runs `pnpm db:migrate` against `TEST_DATABASE_URL`, then `pnpm test`, then `pnpm build`.
