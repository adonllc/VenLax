# VenlaxIQ — Phase 1 Design Spec
**Date:** 2026-05-04
**Status:** Approved for implementation planning
**Scope:** Phase 1 MVP (Months 1–3)
**Revenue Target:** $1M ARR by end of Phase 1 (12-month runway)
**Geography:** United States only

---

## 1. Product Overview

**VenlaxIQ** is a subscription-gated, skill-based forecasting and verified review platform. Users earn ForecastPoints (FP) by making accurate predictions on real-world events and by submitting quality-verified product reviews. FP accumulates in a Reward Wallet and is redeemable across a curated merchant partner catalog (gift cards, dining, streaming, travel).

**Two content verticals, one FP economy, one reputation system:**
- **Forecasting** — crowd probability estimation on Sports, Politics, and open user-submitted questions
- **Reviews** — verified product reviews with AI trust scoring and community validation

**Tagline:** Predict. Review. Earn.
**Bundle ID:** com.venlaxiq
**Category:** Skill-based forecasting / Loyalty engagement app

---

## 2. Legal & Compliance Architecture

### 2.1 Three-Part Regulatory Test

The platform is designed to pass all three tests used to classify gambling:

| Test | Gambling Definition | VenlaxIQ Design |
|---|---|---|
| Consideration | Real money wagered per trade | Subscription fee only — never per-forecast |
| Chance | Pure randomness / RNG | Outcomes of verifiable public events (skill-based) |
| Prize | Cash payouts | Non-cash FP redeemable for goods only |

### 2.2 ForecastPoints Legal Constraints (Non-Negotiable)

- FP carry **no monetary value** — stated explicitly in ToS, UI, and all marketing copy
- FP **cannot be transferred for cash** by any means — no P2P trading, no secondary market
- FP **expire** (60–365 days by tier) — prevents stored-value classification
- FP redemption is fulfilled exclusively by **merchant partner APIs** — the platform never transfers cash to users
- The platform is a **loyalty program operator**, not a money transmitter — no MTL required
- Charity redemption (Benevity API) is deferred to Phase 2 — not included in Phase 1 catalog

### 2.3 Forecasting Legal Framing

- Forecast questions are **community intelligence surveys** — users submit probability estimates as opinions, not bets
- FP earned reflects **calibration accuracy over time** (a skill metric), not a wager payout
- No single forecast "wins" or "loses" — accuracy is scored cumulatively (Brier score) across many forecasts
- This mirrors the operational model of **Metaculus**, **Good Judgment Open**, and **RAND forecasting platforms** — legally established precedents
- All financial/market forecast questions carry: *"Not financial advice. For educational purposes only."*
- Sports forecast questions are framed as **sports analytics opinions**, not outcome bets

### 2.4 Reviews: FTC Compliance

- Every review displays: *"Reviewer earned VenlaxIQ ForecastPoints for this review"* — rendered by the UI component, never optional
- "Verified" badge is awarded only when purchase/interaction proof is confirmed — not decorative
- Users can flag, dispute, and respond to reviews about their products
- Platform claims Section 230 protection for UGC with a documented moderation policy

### 2.5 Data & Privacy

- **CCPA compliance** from day one
- **18+ age gate** enforced at signup — COPPA: under-13s blocked entirely
- **KYC-lite at redemption**: identity verification (Stripe Identity) triggered when cumulative redemption value exceeds $600/year (IRS 1099-MISC threshold)
- PII encrypted at rest (AES-256) and in transit (TLS 1.3)
- Minimal data collection principle — collect only what the product requires
- **Immutable audit log** for all FP transactions and forecast resolutions — retained 7 years

### 2.6 Terminology Blacklist

These terms are banned from codebase, UI copy, ToS, and marketing:

| Banned | Use Instead |
|---|---|
| stake / wager | FP deployed |
| payout | FP earned |
| house take | platform FP allocation |
| losing FP forfeited | unearned FP returned to pool |
| Win Multiplier | Accuracy Multiplier |
| bet / trade | forecast entry |
| odds | probability estimate |
| early exit / sell position | withdraw forecast |
| winnings | earned FP |

### 2.7 Required Before Launch

1. Legal opinion from a US gaming/fintech attorney on the points-redemption + sports-forecasting combination
2. ToS drafted by counsel — explicitly classifying FP, forecasting mechanics, and reviews
3. Privacy Policy covering CCPA, data retention, and B2B data sharing
4. Merchant partner agreement template for FP redemption partners
5. App Store pre-review submission (Apple) to confirm forecasting + rewards framing is acceptable

---

## 3. Architecture

### 3.1 Pattern

React Native (Expo) + Next.js monorepo, backed by a Node.js modular monolith. Open source stack self-hosted on Hetzner via Coolify. Cloudflare in front for CDN and DDoS protection.

### 3.2 Monorepo Structure

```
/apps
  /mobile       — React Native (Expo), iOS + Android
  /web          — Next.js 15 (App Router, TypeScript)
  /admin        — Next.js (internal admin panel)
/packages
  /shared       — TypeScript types, validation schemas, FP math utilities
  /ui           — shared component library (web + RN platform variants)
```

### 3.3 Backend Modules (Modular Monolith)

| Module | Responsibility | Database |
|---|---|---|
| Auth | Registration, JWT, OAuth, subscription state | PostgreSQL + Valkey |
| Forecast Engine | Question lifecycle, LMSR pricing, resolution, accuracy scoring | PostgreSQL + Valkey |
| FP Ledger | Immutable earn/debit ledger, balance computation, expiry | PostgreSQL (append-only table) |
| Review Engine | Submission, verification tiers, trust scoring pipeline | PostgreSQL |
| AI Service | Claude API calls, HuggingFace sentiment, fraud detection | PostgreSQL + ClickHouse |
| Rewards Service | Catalog management, redemption, merchant partner API calls | PostgreSQL |
| Notification Service | Push (APNs/FCM), email, in-app alerts | Valkey + BullMQ |
| Admin Service | Market management, user management, basic BI | PostgreSQL |

All inter-module communication is direct function calls within the monolith in Phase 1. Event-driven (Kafka) migration deferred to Phase 2.

### 3.4 Open Source Infrastructure Stack

| Component | Solution | Notes |
|---|---|---|
| PaaS / Orchestration | **Coolify** (self-hosted, Docker Compose) | Deployed on Hetzner CCX33 (~$50/mo) |
| Database | **PostgreSQL 16** + **TimescaleDB** | TimescaleDB for FP ledger time-series |
| Cache | **Valkey** (open source Redis fork) | Sessions, hot market data, leaderboard |
| Queue | **BullMQ** + Valkey | Async jobs: AI processing, notifications, settlements |
| Auth | **Supabase Auth** (self-hosted) | JWT, Google OAuth, Apple OAuth |
| Real-time | **Supabase Realtime** (self-hosted) | WebSocket for live market probability updates |
| File Storage | **MinIO** (self-hosted, S3-compatible) | User avatars, review media |
| Search | **Meilisearch** (self-hosted) | Market search, review search, product catalog |
| Reverse Proxy | **Caddy** | Automatic TLS, zero config |
| Secrets | **Infisical** (self-hosted) | Environment secrets management |
| Error Tracking | **Sentry** (self-hosted) | All apps |
| Metrics + APM | **Grafana + Prometheus** | Infrastructure and application metrics |
| Product Analytics | **PostHog** (self-hosted) | User behavior, funnel analysis |
| BI Dashboard | **Metabase** (self-hosted) | Internal KPI dashboards |
| Data Warehouse | **ClickHouse** (self-hosted) | Event analytics, AI training data |
| Log Aggregation | **Grafana Loki** | Centralized logs |
| Feature Flags | **Unleash** (self-hosted) | Gradual rollouts, A/B tests |
| CI/CD | **GitHub Actions** (free tier) | Build, test, deploy |

### 3.5 Components That Cannot Be Open Source

| Component | Reason |
|---|---|
| **Stripe** | US payment processing + App Store/Play Store billing — no viable alternative |
| **Claude API** | AI insight quality is a core product differentiator |
| **APNs / FCM** | iOS and Android push — mandatory platform requirements |
| **Cloudflare** (free tier) | DDoS and CDN — free tier covers Phase 1 |
| **Expo EAS Build** | React Native build pipeline — free tier sufficient |
| **Tango/Rybbon API** | Gift card fulfillment — commercial partnership required |

### 3.6 Security Requirements (Phase 1)

- AES-256 at rest; TLS 1.3 in transit (Caddy handles automatically)
- JWT access tokens: 15-minute expiry; refresh tokens rotate every 7 days
- OAuth 2.0: Google + Apple Sign-In
- Rate limiting on all API endpoints (express-rate-limit + Valkey store)
- OWASP Top 10 compliance enforced in code review checklist
- 2FA required for all admin panel actions
- Immutable audit log: all FP adjustments, market resolutions, admin actions
- Sybil resistance: phone verification at signup, device fingerprinting for fraud signals
- Anti-farming: velocity limits on FP earn actions per user per hour

### 3.7 Performance Targets (Phase 1)

| Metric | Target |
|---|---|
| App cold start | < 2.5s on mid-range device |
| Market probability update latency | < 500ms via WebSocket |
| Forecast entry → confirmation | < 1s (p95) |
| API response time | < 200ms (p95) market data |
| Uptime | 99.5% (Phase 1 SLA) |
| Settlement | < 5 minutes from event result |

### 3.8 Phase 1 Infrastructure Cost

| Item | Monthly Cost |
|---|---|
| Hetzner CCX33 (8 vCPU, 32GB RAM) | ~$50 |
| Cloudflare (free tier) | $0 |
| GitHub Actions (free tier) | $0 |
| Claude API (~10M tokens/mo batch) | ~$30 |
| Domain registration | ~$1 |
| **Total fixed** | **~$81/mo** |

Stripe fees are variable (2.9% + $0.30 per transaction).

---

## 4. Subscription Tiers (Phase 1 — 3 Tiers)

Apex tier deferred to Phase 2.

| Feature | Free (Explorer) | Pro ($9.99/mo) | Elite ($24.99/mo) |
|---|---|---|---|
| Daily Forecast FP | 500 FP | 2,000 FP | 6,000 FP |
| Max Open Forecast Positions | 5 | 15 | 50 |
| Market Categories | Sports + Politics | All Phase 1 categories | All + Early Access |
| Accuracy Multiplier | 1.0x | 1.25x | 1.75x |
| Monthly Bonus FP | 0 | 5,000 FP | 20,000 FP |
| AI Insight Signals/day | 0 | 3 | 10 |
| FP Expiry Window (Earned FP) | 60 days | 90 days | 180 days |
| Ad Experience | Standard | Reduced | Ad-lite |
| Referral Bonus FP | 500 FP | 1,500 FP | 5,000 FP |
| Annual Discount | — | 20% off | 20% off |
| Review FP Earn | Standard | 1.25x | 1.75x |

Annual pricing processed via Stripe. App Store subscriptions via StoreKit 2 (iOS) and Google Play Billing 6+ (Android).

---

## 5. ForecastPoints Economy

### 5.1 FP Pool Types

| Pool | Purpose | Expiry |
|---|---|---|
| Daily Forecast FP | Placing forecast entries on markets | Midnight UTC if unused |
| Earned FP | Accurate prediction rewards | Tier-based (60–180 days) |
| Bonus FP | Referrals, promotions, monthly bonus | 90 days from award |
| Achievement FP | Badges, streaks, level-ups | 180 days from award |
| Review FP | Earned from verified reviews | Same as Earned FP tier |

### 5.2 FP Earn Mechanisms (Phase 1)

| Action | FP Earned | Cap |
|---|---|---|
| Daily login | 100 FP base + streak multiplier (up to +500 FP at Day 7) | 1/day |
| Accurate forecast (after resolution) | 100 FP per share held × Accuracy Multiplier (tier); net return of 100–800% of FP deployed depending on probability price at entry time and tier multiplier | Per market |
| Daily missions (3 rotating micro-tasks) | 200–500 FP each | 3/day |
| Referral (referee completes 3+ forecasts) | Tier-based (500–5,000 FP) | Unlimited |
| Verified review published | 500–2,000 FP based on verification tier | 3 reviews/day |
| Review helpfulness votes received | 25 FP per vote | 20 votes/day |
| Social share of forecast result (verified) | 25 FP | 5/day |
| Achievement badges | 500–5,000 FP (one-time) | Per badge |

### 5.3 LMSR Forecast Pricing Engine

Markets use a **Logarithmic Market Scoring Rule (LMSR)** to price probability estimates:

- Each market is a Yes/No binary question
- Contracts priced 1–99 FP per share (= implied probability 1%–99%)
- FP earned on resolution: winning side receives 100 FP per share (accuracy-scaled by tier multiplier)
- Minimum forecast entry: 50 FP deployed
- Maximum per market per user per day: governed by tier open-position limits
- Withdraw forecast: user may exit before resolution at current probability price (1 FP platform allocation per share)
- Platform FP allocation: 2–5% of settled market's gross FP pool retained for operations
- Pricing updates in real-time via WebSocket as new forecast entries arrive

### 5.4 FP Ledger Architecture

Every FP change is an **immutable ledger entry** — never a mutable balance update:

```
ledger_entries table:
  id            UUID PRIMARY KEY
  user_id       UUID NOT NULL
  pool_type     ENUM(daily_forecast, earned, bonus, achievement, review)
  amount        INTEGER (positive = credit, negative = debit)
  reason        VARCHAR (e.g., 'forecast_earned', 'forecast_deployed', 'review_published')
  reference_id  UUID (market_id, review_id, etc.)
  expires_at    TIMESTAMPTZ
  created_at    TIMESTAMPTZ DEFAULT NOW()
```

Current balance is computed from ledger sum, filtered by non-expired entries. This provides a complete audit trail and makes balance disputes trivially resolvable.

---

## 6. Forecast Engine (Phase 1)

### 6.1 Market Lifecycle

```
Create → Open → Close → Resolve → Settle → [Dispute Window 24h]
```

1. **Create**: Admin defines title, description, resolution criteria, data source, close time, resolution time, category
2. **Open**: Users submit forecast entries; LMSR pricing adjusts in real-time via WebSocket
3. **Close**: No new forecast entries after close time; existing positions held
4. **Resolve**: Admin polls data source and marks outcome Yes/No; auto-resolution available for supported oracle sources
5. **Settle**: Earned FP credited to winning positions within 5 minutes; unearned FP returned to platform pool
6. **Dispute**: 24-hour dispute window; users may flag with evidence; admin reviews and may override

### 6.2 Phase 1 Market Categories

| Category | Examples | Resolution Source | Tier Access |
|---|---|---|---|
| Sports | NFL game outcomes, NBA game results, tournament round winners | ESPN API, Sportradar | All tiers |
| Politics | Senate votes, bill passage, approval rating thresholds | AP Elections API, Ballotpedia | Pro+ |
| Open (User-submitted) | Any verifiable public event; creator pays listing fee | Creator-specified + admin-verified | Pro+ |

**Phase 1 launch target: 20 active markets** across Sports and Politics. Open listings available but moderated.

### 6.3 User-Submitted Question Listing

- Any Pro+ user may submit a forecast question by paying a listing fee ($5–$25 flat, processed via Stripe)
- Questions enter a moderation queue — admin reviews resolution criteria, source, and category fit
- Fee is non-refundable for rejected questions (stated in ToS)
- Approved questions go live within 24 hours
- Creator earns 500 Bonus FP when their question attracts 10+ forecast entries

### 6.4 Oracle & Resolution

Phase 1 uses **manual resolution with admin override**:
- Admin checks official source (ESPN, AP, Ballotpedia) and marks outcome
- Supervisor approval required for any manual override of auto-resolution
- All resolution events logged to immutable audit log with admin ID, timestamp, source URL

Phase 2 introduces automated oracle polling.

---

## 7. Review System (Phase 1)

### 7.1 Verification Stack

Reviews go through three layers before earning a Verified badge:

1. **Purchase/interaction proof**: User uploads receipt image or connects supported retailer account (OAuth). Receipt parsed via Claude API for product match.
2. **Behavioral signals**: Edit history, time-on-review, account age, device consistency checked before publish
3. **AI trust score**: Claude API analyzes review text for templated language, duplicate fingerprints, sentiment manipulation, and incentive-fishing patterns. Score is internal — not shown to users as a raw number.

### 7.2 Review Badge Tiers

| Badge | Requirements |
|---|---|
| Verified | Purchase/interaction proof confirmed |
| Community Trusted | Verified + high helpfulness vote ratio (≥ 80% helpful, min 10 votes) |
| None | Submitted but unverified — shown with lower visual weight |

### 7.3 FP Earn from Reviews

| Action | FP |
|---|---|
| Unverified review published | 200 FP |
| Verified review published | 1,000 FP |
| Community Trusted review | Additional 1,000 FP (awarded when threshold crossed) |
| Each helpfulness vote received | 25 FP (cap: 20/day across all reviews) |

FTC disclosure: *"Reviewer earned VenlaxIQ ForecastPoints for this review"* rendered on every review card — not optional.

### 7.4 Brand Response

- Brand accounts (B2B tier) can respond publicly to reviews of their products
- Brands can flag a review for moderation (not for removal — flags trigger admin review)
- Review disputes resolved by admin within 48 hours

### 7.5 Phase 1 Review Scope

- Product categories: Consumer electronics, apps/software, food & beverage, fitness, entertainment
- No real estate, medical, legal, or financial product reviews in Phase 1 (liability scope)
- Retailer OAuth connections: Amazon (Phase 1); Target, Walmart added in Phase 2

---

## 8. AI Insights Engine (Phase 1)

### 8.1 Consumer-Facing Features

| Feature | Description | Trigger |
|---|---|---|
| Market summary | "The crowd gives this a 73% probability — here's why top forecasters lean Yes" | On market detail page load |
| Review summary | "Based on 200 verified reviews: users praise battery life, criticize customer support" | When review count ≥ 50 |
| AI Insight Signal | Suggested probability estimate, confidence (1–5 stars), key factors, sources | Pro+ subscribers, 3–10/day |

### 8.2 AI Insight Signal Pipeline

1. BullMQ job runs every 6 hours per active market
2. Pulls: NewsAPI headlines, Reddit mention volume, Google Trends index for market topic
3. HuggingFace sentiment model (`cardiffnlp/twitter-roberta-base-sentiment`) scores sentiment
4. Claude API synthesizes into a structured signal: suggested probability, confidence, key factors, 3 source links
5. Signal stored in PostgreSQL; served to eligible users via API
6. Users must acknowledge *"Not financial advice. For educational purposes only."* on first signal access

### 8.3 Review AI Processing

1. On review submission → BullMQ job queued
2. Claude API analyzes: template detection, duplicate fingerprint, manipulation score, quality score
3. Trust score written to review record; gates Verified badge workflow
4. Batch re-scoring runs nightly for all reviews (catches newly detected patterns)

### 8.4 Fraud Detection (Phase 1)

- scikit-learn anomaly detection model on FP earn velocity per user
- Rule-based filters: >3 FP earn events per minute, >10 referrals per day, same device on multiple accounts
- Flagged accounts enter review queue; platform FP allocation suspended during review

---

## 9. Rewards Marketplace (Phase 1 — 3 Categories)

### 9.1 Phase 1 Catalog

| Category | Examples | FP Cost Range | Fulfillment |
|---|---|---|---|
| E-Commerce Gift Cards | Amazon, Target, Walmart, Best Buy | 5,000–100,000 FP | Tango/Rybbon API |
| Dining & Food Delivery | DoorDash, Uber Eats, OpenTable | 2,000–20,000 FP | API promo code delivery |
| Entertainment | Netflix, Spotify, Disney+, gaming credits | 3,000–30,000 FP | Digital code delivery |

**FP conversion rate:** ~1,000 FP = $0.10 redemption value (internal catalog pricing only — **never advertised to users as a cash value**).

### 9.2 Redemption Flow

1. User selects reward from catalog
2. Platform checks: sufficient Earned FP balance, account in good standing, KYC status if >$600 cumulative
3. FP debit entered as ledger entry (atomic — if partner API fails, debit is rolled back)
4. Partner API called (Tango/Rybbon) → digital code delivered via push + email
5. Redemption confirmation stored; user sees history in Reward Wallet

### 9.3 Reward Wallet UI

- Current redeemable FP balance (Earned FP only, not Daily Forecast FP)
- FP expiry dates and countdown alerts
- Full redemption history
- Catalog filtered by category, FP cost, availability

---

## 10. Gamification & Retention (Phase 1)

### 10.1 Badge System (Phase 1 Subset)

| Badge | Criteria | FP Reward |
|---|---|---|
| Sharpshooter | 80%+ accuracy over 20 forecasts | 5,000 FP |
| Hot Streak | 5 consecutive correct forecasts | 1,500 FP |
| First Forecast | Complete first forecast entry | 500 FP |
| First Review | Publish first verified review | 1,000 FP |
| Day 30 Loyalty | Active 30 consecutive days | 5,000 FP |
| Recruiter | 5 successful referrals | 3,000 FP |
| Sports Analyst | 20 forecasts in Sports category | 2,000 FP |

### 10.2 XP Level System (Non-Redeemable Prestige)

Rookie → Analyst → Expert → Master → Legend

Earned from all engagement actions. Unlocks: profile flair, early market access, cosmetic features. **XP is never redeemable** — it is a trust/prestige signal only.

### 10.3 Daily Engagement Loops

- **Daily Missions**: 3 rotating micro-tasks worth 200–500 FP each (e.g., "Make 2 forecast entries today", "Vote helpful/unhelpful on 3 reviews")
- **Login Streak Multiplier**: Day 1 = 1.0x → Day 7 = 1.5x → Day 30 = 2.0x on daily login FP
- **Push Triggers**: Market closing in 1 hour, forecast settlement result, leaderboard rank changed, daily FP unused at 8 PM local time

### 10.4 Social Features (Phase 1 Subset)

- Follow/unfollow other forecasters
- Public profile: accuracy score, reputation tier, recent forecasts (privacy: user controls visibility)
- Global leaderboard (accuracy-based, not FP-balance-based)
- Shareable forecast result cards (auto-generated OG image for social sharing)

---

## 11. Design System & Brand Identity

### 11.1 Color Palette

Three-color signature palette. Dark background surfaces make all three pop at maximum intensity.

| Token | Hex | Role |
|---|---|---|
| `--color-green` | `#00D46A` | Primary action — CTAs, confirm buttons, "Yes" forecast side, accuracy indicators, verified badges, positive trend arrows |
| `--color-green-dark` | `#00A854` | Pressed/hover state for green elements, active tab indicator |
| `--color-green-glow` | `rgba(0, 212, 106, 0.20)` | Card highlights, focused input rings, streak aura |
| `--color-lemon` | `#FFE600` | Energy accent — streak multiplier flames, badge glows, featured market highlight, leaderboard crown, daily mission indicator |
| `--color-lemon-soft` | `rgba(255, 230, 0, 0.15)` | Background tint for streak cards and achievement panels |
| `--color-orange` | `#FF6B00` | Urgency & activity — "No" forecast side, closing-soon countdown, notification badges, hot market indicator, XP progress bar fill |
| `--color-orange-dark` | `#D45A00` | Pressed/hover state for orange elements |
| `--color-orange-glow` | `rgba(255, 107, 0, 0.18)` | Urgency card tint, dispute warning backgrounds |
| `--color-surface` | `#0D0D0D` | App background (near-black) — makes vivid colors pop |
| `--color-surface-2` | `#181818` | Card backgrounds, bottom sheets |
| `--color-surface-3` | `#242424` | Input fields, secondary cards |
| `--color-border` | `#2E2E2E` | Dividers, card borders |
| `--color-text-primary` | `#F5F5F5` | Body text on dark surfaces |
| `--color-text-secondary` | `#8A8A8A` | Captions, metadata, timestamps |

### 11.2 Color Semantics (How Colors Map to Product Concepts)

| Concept | Color | Rationale |
|---|---|---|
| "Yes" / Optimistic forecast | Green `#00D46A` | Universal positive signal |
| "No" / Pessimistic forecast | Orange `#FF6B00` | High-energy contrast, not red (avoids loss/danger framing) |
| Streak / Daily energy | Lemon `#FFE600` | Fire/energy — daily habit urgency |
| Verified / Trusted | Green `#00D46A` | Trust = green across all cultures |
| Closing soon / Urgency | Orange `#FF6B00` | Action-required signal |
| Earned FP / Reward | Lemon `#FFE600` | Gold/reward association |
| Accuracy score (high) | Green gradient `#00D46A → #00A854` | Calibration excellence |
| Accuracy score (low) | Orange `#FF6B00` | Needs improvement, not failure |
| Admin / Danger | Red `#FF3B30` | Only color outside palette; reserved for destructive actions only |

### 11.3 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| App wordmark | **Outfit** | 800 ExtraBold | Display |
| Headings | **Outfit** | 700 Bold | 24–32px |
| Body | **Inter** | 400 Regular | 14–16px |
| Data / Numbers | **JetBrains Mono** | 500 Medium | 12–18px |
| Labels / Caps | **Inter** | 600 SemiBold uppercase | 10–12px |

Numbers (FP balances, probabilities, prices) use JetBrains Mono for tabular alignment and a data-forward feel consistent with financial/analytics apps.

### 11.4 Theme System — Dark & Light

Users can toggle between Dark and Light themes in Profile → Appearance. System default follows device OS preference on first launch.

**Dark Theme (default):**

| Token | Dark Value |
|---|---|
| `--color-surface` | `#0D0D0D` |
| `--color-surface-2` | `#181818` |
| `--color-surface-3` | `#242424` |
| `--color-border` | `#2E2E2E` |
| `--color-text-primary` | `#F5F5F5` |
| `--color-text-secondary` | `#8A8A8A` |

**Light Theme — Intense Green + Lemon + Dark Grey:**

The light theme is not white. Surfaces use a deep green-tinted grey palette, making the intense green and lemon feel native to the background rather than overlaid on it. Text is dark grey (not black) to soften contrast on the green-tinted surfaces.

| Token | Light Value | Note |
|---|---|---|
| `--color-surface` | `#1A231A` | Deep forest grey-green — app background |
| `--color-surface-2` | `#243024` | Card backgrounds, bottom sheets |
| `--color-surface-3` | `#2E3D2E` | Input fields, secondary cards |
| `--color-border` | `#3A4F3A` | Dividers, card borders — green-tinted |
| `--color-text-primary` | `#D6F5D6` | Light green-white — primary text |
| `--color-text-secondary` | `#7AAF7A` | Muted green — captions, metadata |
| `--color-surface-lemon-tint` | `rgba(255,230,0,0.07)` | Subtle lemon wash on featured cards |
| `--color-surface-green-tint` | `rgba(0,212,106,0.10)` | Active state background tint |

The three signature colors remain identical across both themes:

| Color | Hex | Both Themes |
|---|---|---|
| Intense Green | `#00D46A` | Unchanged |
| Lemon | `#FFE600` | Unchanged |
| Orange | `#FF6B00` | Unchanged |

**Theme character summary:**
- **Dark theme** — near-black `#0D0D0D` surfaces, colours pop like neon on midnight. Maximum contrast, high energy.
- **Light theme** — deep green-grey `#1A231A` surfaces, lemon and green feel embedded in the environment. Forest-at-dusk feel — darker than a conventional light theme but clearly distinct from dark mode.

Glow/translucent variants: dark theme uses 20% opacity; light theme uses 14% (green-tinted surfaces already carry ambient warmth, so lighter glows prevent muddiness).

**Implementation:** CSS custom properties on `:root` swapped by a `data-theme="dark|light"` attribute on `<html>`. React Native uses a `ThemeContext` with the same token names, switching between two StyleSheet objects. The `/packages/ui` shared `tokens.ts` exports both theme objects — single source of truth.

Theme preference stored in user profile (PostgreSQL) so it syncs across devices after login.

### 11.6 Visual Identity Rules

- Probabilities displayed as large, bold percentage numbers in green (above 50%) or orange (below 50%), never neutral grey
- FP balance always displayed with the lemon `#FFE600` color and a small ⚡ icon
- Verified badge: green checkmark with `--color-green-glow` halo
- Never use all three signature colors simultaneously in a single component — max two per component to maintain hierarchy
- Gradients allowed between green and lemon only (for achievement/level-up moments); orange stands alone

### 11.7 Component Library

Built as a shared `/packages/ui` library with platform variants:
- Web: React components + TailwindCSS (custom theme with the above tokens)
- Mobile: React Native StyleSheet with the same token names
- Design tokens exported as a single `tokens.ts` file consumed by both platforms — single source of truth for all colors, spacing, and typography

---

## 12. Navigation & UX

### 11.1 Mobile Bottom Tab Bar

**Home | Forecast | Reviews | Rewards | Profile**

- **Home**: Activity feed — market movements, friend activity, daily missions, AI signals
- **Forecast**: Market browser by category, search, featured markets, personal forecast history
- **Reviews**: Browse and submit reviews by product category; personal review history
- **Rewards**: Reward Wallet, catalog, wishlist, redemption history
- **Profile**: Reputation tier, badges, XP level, settings, subscription management

### 11.2 Web-Specific

- Full parity with mobile on all core Phase 1 features
- Enhanced: multi-chart market view, full forecast history export (CSV)
- SSR for market detail pages (Open Graph for social sharing)
- SSG for category browse pages (SEO)
- Auto-generated OG share images per market (probability + close time)
- Web Push API for settlement alerts
- Keyboard shortcuts: J/K for Yes/No forecast entry, Enter to confirm

### 11.3 Admin Panel

| Feature | Detail |
|---|---|
| Market management | Create, edit, schedule, close markets; manual resolution with supervisor approval |
| User management | Search by email/ID; view subscription, FP balances, forecast history; suspend/reinstate |
| FP adjustment | Manual FP credit/debit with mandatory reason field + supervisor approval |
| Review moderation | Flag queue, dispute resolution, brand response management |
| Basic analytics | MAU/DAU, subscription counts by tier, FP earn/redeem volume, top markets |

---

## 12. B2B Layer (Phase 1 — Foundations Only)

Phase 1 establishes the B2B foundation; full B2B product launches in Phase 4.

- **Brand accounts**: Brands can claim their product pages, respond to reviews, view basic review analytics (volume, average trust score, recent reviews)
- **Pricing**: Starter brand account — $199/mo (includes up to 3 product pages, review dashboard, response capability)
- **No API access in Phase 1** — raw data export via CSV only
- **Aggregate forecast data**: Brands in Pro+ markets can see aggregate probability estimates for questions about their product category — no individual user data

---

## 13. Monetization & Revenue Path to $1M

### 13.1 Revenue Streams (Phase 1)

| Stream | Mechanism | Monthly Target (Month 12) |
|---|---|---|
| Subscriptions | Pro ($9.99) + Elite ($24.99) monthly/annual | $115,000 |
| B2B Brand Accounts | $199/mo starter | $20,000 |
| Rewards Affiliate | 5–20% margin on fulfilled redemptions | $17,000 |
| In-App Advertising | Free-tier display ads (Google AdMob) | $13,000 |
| Question Listing Fees | $5–$25 per user-submitted question | $8,000 |
| **Total MRR** | | **~$173,000** |
| **Run-rate ARR** | Month 12 MRR × 12 | **~$2.1M** |

### 13.2 Subscriber Mix to Hit $1M ARR

The $1M ARR milestone is crossed during ramp-up, not at Month 12 steady state:

- 4,000 Pro subscribers × $9.99 = $479K ARR
- 1,500 Elite subscribers × $24.99 = $449K ARR
- 100 B2B brands × $199/mo = $239K ARR
- Affiliate + ads + listing fees = ~$200K ARR
- **Year 1 blended total: ~$1.37M** (accounts for subscriber ramp from zero) — achievable with 120K MAU at 4.5% paid conversion by Month 12

### 13.3 Unit Economics

| Metric | Free | Pro | Elite |
|---|---|---|---|
| ARPU (monthly) | $1.30 (ads) | $12.69 | $30.04 |
| Target CAC | $3.00 | $15.00 | $30.00 |
| LTV (12-month) | $15.60 | $152.28 | $360.48 |
| LTV:CAC | 5.2x | 10.2x | 12.0x |

---

## 14. Phase 1 KPIs

| Category | KPI | Month 3 | Month 6 | Month 12 |
|---|---|---|---|---|
| Growth | MAU | 10,000 | 40,000 | 100,000 |
| Growth | DAU | 2,500 | 10,000 | 25,000 |
| Revenue | MRR | $15,000 | $60,000 | $173,000 |
| Retention | D30 Retention | 30% | 35% | 40% |
| Retention | Monthly Churn | < 8% | < 7% | < 6% |
| Engagement | Daily FP Utilization | > 50% | > 60% | > 65% |
| Monetization | Free-to-Pro Conversion | 5% | 7% | 9% |
| Integrity | Market Dispute Rate | < 1% | < 0.7% | < 0.5% |
| Reviews | Verified Review Rate | > 40% | > 55% | > 65% |

---

## 15. Development Timeline (Phase 1 — 12 Weeks)

### Month 1: Foundation

- Monorepo scaffold (React Native Expo + Next.js + Node.js)
- Coolify + Hetzner infrastructure setup; all open source services deployed
- Supabase Auth: email/password + Google + Apple OAuth
- Stripe subscriptions: Free, Pro, Elite tiers (web + StoreKit 2 + Google Play Billing)
- PostgreSQL schema: users, subscriptions, FP ledger, markets, reviews
- FP Ledger service: earn/debit with expiry, balance computation
- Admin panel: basic user management

### Month 2: Core Features

- Forecast Engine: market CRUD, LMSR pricing, WebSocket real-time updates
- Market categories: Sports + Politics (20 markets at launch)
- Forecast entry flow (mobile + web): browse, enter FP, view positions, withdraw
- Review Engine: submission, receipt upload, Claude API trust scoring, badge award
- FP earn events: daily login, forecast resolution, review publish, referral
- BullMQ jobs: AI processing queue, settlement job, notification dispatch
- Push notifications: APNs + FCM integration

### Month 3: Product Polish + Launch

- Rewards catalog: 3 categories (gift cards, dining, entertainment) via Tango/Rybbon
- Reward Wallet UI: balance, history, redemption flow, KYC trigger
- Gamification: badges (Phase 1 set), XP levels, daily missions, streak multiplier
- Leaderboards: global accuracy leaderboard
- B2B brand accounts: claim product page, review dashboard, respond to reviews
- AI Insight Signals: Pro/Elite subscribers, 6-hour pipeline via BullMQ
- Admin panel: market management, resolution workflow, basic analytics
- Compliance checklist: legal review, ToS finalization, App Store submission
- Load testing, security audit, soft launch (invite-only), public launch

---

## 16. Out of Scope for Phase 1

The following are explicitly deferred to later phases:

- Apex subscription tier
- Finance, Technology, Weather, Geopolitics, Pop Culture market categories
- Automated oracle polling (all resolution is manual in Phase 1)
- Native iOS (Swift) / Android (Kotlin) apps — React Native covers Phase 1 and 2
- Kafka event streaming — BullMQ sufficient for Phase 1 load
- AWS EKS — Coolify/Hetzner sufficient for Phase 1
- Full social features: private leagues, season tournaments, threaded market comments
- B2B data licensing API
- Sponsored markets
- Partner surveys
- White-label product
- International expansion
- Live Activities (Dynamic Island), App Clips, Android Widgets
- Competitor benchmarking for B2B

---

## 17. Risk Register (Phase 1)

| Risk | Likelihood | Mitigation |
|---|---|---|
| App Store rejection (gambling-adjacent) | Low-Medium | Legal pre-review; cleaned terminology; present as "skill forecasting + loyalty rewards" |
| State regulatory reclassification | Medium | Legal opinion before launch; geofencing for any newly restricted states; no FP cash value |
| Weak rewards catalog — low redemption appeal | Medium | Pre-sign 3+ Tier-1 brand partners before launch |
| Oracle failure / wrong market resolution | Low | Manual resolution with supervisor approval; 24h dispute window |
| Free-tier abuse without conversion | High | Strict daily FP cap; strong feature gating; referral FP released only after 3 forecast entries |
| High churn post-trial | Medium | Strong onboarding; daily habit loops; Day 7 and Day 14 re-engagement push |
| AI trust score false positives on reviews | Low-Medium | Human review queue for borderline scores; user appeal process |
| Infrastructure overload at launch | Low | Load test to 10K concurrent before launch; Coolify horizontal scaling available |
