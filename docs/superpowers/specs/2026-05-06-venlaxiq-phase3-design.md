# VenlaxIQ — Phase 3 Design Spec
**Date:** 2026-05-06
**Status:** Approved for implementation planning
**Scope:** Phase 3 — Frontend layer (packages/ui · apps/admin · apps/web · apps/mobile)
**Prerequisite:** Phase 1 + 2 complete (all backend modules, workers, tests implemented)

---

## 1. Overview

Phase 3 delivers the entire user-facing frontend for VenlaxIQ across three apps plus a shared component library. The backend (Fastify API, all modules, BullMQ workers) is fully operational. Phase 3 wires it to real UIs.

**Tagline:** Predict. Review. Earn.
**Deliverables (in build order):**
1. `packages/ui` — Shared component library (web + React Native variants)
2. `apps/admin` — Internal admin panel (Next.js 15)
3. `apps/web` — Public-facing web product (Next.js 15)
4. `apps/mobile` — iOS + Android app (Expo 51 / React Native 0.74)

**Feature scope:** Full Phase 3 — all features from the design spec including rewards marketplace (backend stub), badge system, XP/missions, social features, and leaderboard.

---

## 2. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Build order | UI library → Admin → Web → Mobile | Component library makes each subsequent app dramatically faster |
| Feature scope | Full (rewards, badges, XP, missions, social) | Nothing deferred to Phase 4 except Tango API live integration |
| Rewards API | Full UI + backend stub | Complete UX now; swap stub for real Tango keys when partnership signed |
| Admin auth | Separate `admin_users` table + JWT secret | Complete isolation — user session compromise cannot escalate to admin |
| Admin 2FA | TOTP enforced at login | Required by spec for all admin mutations |
| Mobile navigation | Expo Router v3 (already configured) | Already set up in package.json as `"main": "expo-router/entry"` |
| Data fetching — web | RSC for public/SEO pages + React Query for authenticated interactive surfaces | SSR for OG sharing + SEO; React Query for real-time forecast entry and wallet |
| Data fetching — mobile | React Query throughout | Same hooks as web interactive surfaces — shared patterns |
| WebSocket | Existing `@fastify/websocket` broadcaster | ForecastEntryWidget subscribes for live probability updates on market detail |

---

## 3. Terminology (enforced in all UI copy)

| Banned | Use Instead |
|---|---|
| stake / wager / bet | FP deployed / forecast entry |
| payout / winnings | FP earned |
| odds | probability estimate |
| Win Multiplier | Accuracy Multiplier |
| early exit / sell | withdraw forecast |

Every review card must render: *"Reviewer earned VenlaxIQ ForecastPoints for this review"* — never optional, never hidden.

---

## 4. New Backend Additions (Phase 3 requires these API routes)

All new routes follow the existing Fastify modular monolith pattern. New modules go in `apps/api/src/modules/`.

### 4.1 Admin Auth Module (`modules/admin-auth/`)
| Method | Route | Description |
|---|---|---|
| `POST` | `/admin/auth/login` | email + password → partial JWT (requires 2FA next) |
| `POST` | `/admin/auth/verify-2fa` | TOTP code → full admin JWT (httpOnly cookie) |
| `POST` | `/admin/auth/logout` | Clear admin cookie |

Schema additions: `admin_users` table (id, email, passwordHash, totpSecret, role: `admin | superadmin`, createdAt).

### 4.2 Admin Module (`modules/admin/`)
| Method | Route | Description |
|---|---|---|
| `GET` | `/admin/users` | Paginated user list with search + tier filter |
| `GET` | `/admin/users/:id` | User detail: subscription, FP balance, forecast history, badges |
| `PATCH` | `/admin/users/:id/suspend` | Suspend / reinstate user (supervisor approval required) |
| `GET` | `/admin/markets` | All markets with status filter |
| `POST` | `/admin/fp/adjust` | Manual FP credit/debit — reason field + supervisor flag — immutably audit-logged |
| `GET` | `/admin/reviews/queue` | Flagged reviews moderation queue |
| `PATCH` | `/admin/reviews/:id` | Approve / reject / escalate review |
| `GET` | `/admin/analytics` | MAU/DAU, subscriptions by tier, FP earn/redeem volume, top markets |

All admin routes protected by `authenticateAdmin` preHandler (verifies admin JWT, separate secret).

### 4.3 Social Module (`modules/social/`)
| Method | Route | Description |
|---|---|---|
| `POST` | `/users/:id/follow` | Follow a user |
| `DELETE` | `/users/:id/follow` | Unfollow a user |
| `GET` | `/users/:id/followers` | Follower list |
| `GET` | `/users/:id/following` | Following list |

Schema addition: `user_follows` table (followerId, followeeId, createdAt).

### 4.4 Profile Module (`modules/profile/`)
| Method | Route | Description |
|---|---|---|
| `GET` | `/profile/:id` | Public profile: accuracy score, tier, XP, badge list, recent forecasts (privacy-gated) |
| `PATCH` | `/profile` | Update own profile: display name, avatar, visibility settings |

### 4.5 Leaderboard Module (`modules/leaderboard/`)
| Method | Route | Description |
|---|---|---|
| `GET` | `/leaderboard` | Top 100 by accuracy score, filterable by category + timeframe |

### 4.6 Gamification Module (`modules/gamification/`)
| Method | Route | Description |
|---|---|---|
| `GET` | `/badges` | All badge definitions + user's earned status |
| `GET` | `/missions/today` | Today's 3 rotating missions + completion status |
| `POST` | `/missions/:id/complete` | Mark mission complete (server validates) |
| `GET` | `/users/:id/xp` | XP total + current level |

Schema additions: `user_badges` (userId, badgeId, earnedAt), `missions` (id, title, fpReward, resetDaily), `user_missions` (userId, missionId, date, completedAt).

### 4.7 Rewards Module (`modules/rewards/`)
| Method | Route | Description |
|---|---|---|
| `GET` | `/rewards/catalog` | Catalog items: gift cards, dining, entertainment — seeded from config |
| `POST` | `/rewards/redeem` | Redeem FP for reward — debit ledger atomically, stub Tango API call |
| `GET` | `/rewards/history` | User's redemption history |

Tango integration: `rewards.service.ts` calls a `TangoProvider` interface. `StubTangoProvider` returns `{ code: "STUB-CODE-123", success: true }`. Real implementation added when API keys available — no other code changes needed.

Schema addition: `reward_catalog` (id, name, category, fpCost, imageUrl, isActive), `reward_redemptions` (id, userId, catalogItemId, fpDebited, code, status, createdAt).

### 4.8 Subscription Checkout
| Method | Route | Description |
|---|---|---|
| `POST` | `/subscriptions/checkout` | Create Stripe Checkout session for Pro/Elite upgrade |
| `GET` | `/subscriptions/portal` | Stripe Customer Portal URL for self-service management |

---

## 5. Component Library — packages/ui

Built first. Web components use React + Tailwind classes. React Native variants live in `packages/ui/src/native/` with identical export names. The existing `tokens.ts` and `theme.tsx` are the single source of truth for all values.

### 5.1 Package Exports Structure
```
packages/ui/src/
  tokens.ts              — existing: colors, typography, spacing, radius
  theme.tsx              — existing: ThemeProvider, ThemeContext
  index.ts               — re-exports all web components
  native/
    index.ts             — re-exports all RN components
  components/
    atoms/
      Button.tsx         — web
      Input.tsx
      Select.tsx
      Avatar.tsx
      Badge.tsx
      Spinner.tsx
      Divider.tsx
      Toast.tsx
    forecast/
      MarketCard.tsx
      ProbabilityBar.tsx
      ForecastEntryWidget.tsx
      PositionRow.tsx
      MarketStatusChip.tsx
      CategoryPill.tsx
      InsightCard.tsx
      SettlementBanner.tsx
    fp-economy/
      FPBadge.tsx
      StreakBanner.tsx
      MissionCard.tsx
      BadgeDisplay.tsx
      XPProgressBar.tsx
      RewardCard.tsx
      WalletSummary.tsx
      SubscriptionBadge.tsx
    reviews/
      ReviewCard.tsx
      VerifiedBadge.tsx
      HelpfulVoteRow.tsx
      ReviewForm.tsx
      TrustSummary.tsx
    social/
      LeaderboardRow.tsx
      ProfileHeader.tsx
      AccuracyGauge.tsx
      ForecastHistoryRow.tsx
      FollowButton.tsx
    layout/
      Sidebar.tsx
      TopBar.tsx
      BottomTabBar.tsx
      PageContainer.tsx
      EmptyState.tsx
      NotificationBell.tsx
  native/
    components/          — RN StyleSheet variants, same names as web
```

### 5.2 Key Component Behaviour Notes

**ProbabilityBar:** Green fill from left (Yes probability), orange from right (No). Width calculated from `yesProb` prop (0–100). Animates on change. Percentage labels in JetBrains Mono.

**ForecastEntryWidget:** YES button (green) / NO button (orange). FP slider (50 FP minimum, tier max). Shows cost in FP, current probability, estimated accuracy multiplier. Submits via React Query mutation. Keyboard shortcuts on web: `Y` / `N` / `Enter`.

**InsightCard:** Shows suggested probability, confidence (1–5 stars), key factors list, 3 source links. Pro+ only — renders locked state with upgrade CTA for free users. First view shows disclaimer modal: *"Not financial advice. For educational purposes only."*

**ReviewCard:** Always renders FTC disclosure text at bottom. Verified badge uses `#00D46A` with glow halo. Unverified reviews render at reduced visual weight (secondary text colour).

**MarketCard:** Probability displayed as large bold percentage — green if >50%, orange if <50%. Closing-soon badge (orange) if <1 hour to close. Category pill. Quick YES/NO entry buttons on hover (web) / long-press (mobile).

**StreakBanner:** Lemon `#FFE600` with flame icon. Shows current day (e.g. Day 5), multiplier (e.g. 1.5×), FP to be earned today. Pulsing lemon glow aura at streaks ≥ 7.

---

## 6. Admin Panel — apps/admin

### 6.1 Stack
- Next.js 15 App Router
- Tailwind CSS (same config as `apps/web`)
- `packages/ui` web components + additional admin-specific components
- Admin JWT stored in httpOnly cookie (separate signing secret from user JWT)
- No React Query — admin is server-rendered with Next.js server actions for mutations

### 6.2 Route Structure
```
apps/admin/app/
  layout.tsx                    — root layout
  (auth)/
    login/page.tsx              — email + password form
    2fa/page.tsx                — TOTP 6-digit input
  (admin)/
    layout.tsx                  — sidebar + topbar, admin JWT guard
    dashboard/page.tsx          — KPI cards + activity log
    markets/
      page.tsx                  — paginated table, filter by status/category
      new/page.tsx              — create market form
      [id]/page.tsx             — detail, status transitions, resolve modal
    users/
      page.tsx                  — search + paginated table
      [id]/page.tsx             — user detail + suspend/reinstate
    fp-adjustments/page.tsx     — manual FP adjustment form
    reviews/page.tsx            — moderation queue + dispute panel
    analytics/page.tsx          — charts (MAU/DAU, subscriptions, FP volume)
    settings/page.tsx           — admin profile, 2FA reset
```

### 6.3 Admin-Specific Components (not in packages/ui — admin only)
- `AdminSidebar` — nav links, active state, logout button
- `SupervisorModal` — confirmation dialog for destructive mutations (resolve market, suspend user, FP adjust). Requires admin to re-enter their password before the mutation fires. Multi-user two-person approval is Phase 4.
- `AuditLogTable` — immutable log viewer (userId, action, timestamp, admin ID)
- `StatCard` — KPI metric display (value, label, trend arrow)
- `UserDetailPanel` — subscription badge, FP balance breakdown, forecast history table
- `DisputePanel` — review text, flags, approve/reject/escalate actions, 48h SLA countdown

### 6.4 Auth Flow Detail
1. `POST /admin/auth/login` → if valid credentials: returns `{ requiresTwoFactor: true, tempToken }`
2. `POST /admin/auth/verify-2fa` with tempToken + TOTP code → returns full admin JWT, set as httpOnly cookie
3. All admin API calls include cookie automatically
4. Admin middleware validates JWT against `ADMIN_JWT_SECRET` env var (separate from `JWT_SECRET`)
5. `superadmin` role required for: market resolution, FP adjustment, user suspension

---

## 7. Web App — apps/web

### 7.1 Stack
- Next.js 15 App Router
- Tailwind CSS
- `packages/ui` web components
- TanStack Query v5 (`@tanstack/react-query`) for all authenticated interactive surfaces
- JWT stored in httpOnly cookie (set by existing `POST /auth/login`)
- `next/headers` cookies read in Server Components for auth state

### 7.2 Route Structure

Route groups `(auth)` and `(protected)` share the root layout but have their own sub-layouts. Public pages (`/markets`, `/reviews`) live outside any route group so they're accessible without auth but share the root layout.

```
apps/web/app/
  layout.tsx                        — root: ThemeProvider, QueryClientProvider
  page.tsx                          — landing page (redirects to /home if authed)
  (auth)/                           — layout: redirect to /home if already authed
    layout.tsx
    login/page.tsx
    register/page.tsx
  markets/                          — public + auth-aware (no route group — SEO accessible)
    page.tsx                        — SSG market browser (revalidate: 60s), works unauthed
    [id]/
      page.tsx                      — SSR market detail + OG meta; ForecastEntryWidget is an auth-gated client island (shows "log in to forecast" if unauthed)
      opengraph-image.tsx           — OG image: probability % + close time
  reviews/                          — public + auth-aware
    [productId]/page.tsx            — SSR product reviews, works unauthed
  (protected)/                      — layout: TopBar + AuthGuard (redirects to /auth/login if no cookie)
    layout.tsx
    home/page.tsx                   — activity feed (RQ: missions, streak, signals, market movements)
    forecast/page.tsx               — open positions + forecast history
    reviews/
      page.tsx                      — review browse (authed — shows submit button)
      new/page.tsx                  — review submission form + receipt upload
    rewards/
      page.tsx                      — wallet summary + reward catalog
      redeem/[id]/page.tsx          — redemption confirmation + KYC gate
    leaderboard/page.tsx            — accuracy leaderboard (filter: category, timeframe)
    profile/
      page.tsx                      — own profile: badges, XP, history
      [userId]/page.tsx             — public profile + follow button
    settings/
      page.tsx                      — account, theme toggle, notifications, privacy
      subscription/page.tsx         — tier upgrade (Stripe Checkout redirect)
```

### 7.3 RSC vs Client Component Split

| Surface | Rendering | Reason |
|---|---|---|
| `/markets` browse | RSC (SSG, 60s revalidate) | SEO — market titles indexed |
| `/markets/[id]` shell | RSC (SSR) | OG meta, initial probability snapshot |
| `ForecastEntryWidget` | Client Component | WebSocket subscription, React Query mutation |
| `InsightCard` | Client Component | Pro+ gate check, disclaimer modal |
| `/reviews/[productId]` | RSC (SSR) | SEO — review content indexed |
| `/home` feed | Client Component (RSC layout) | Real-time updates, streak/mission state |
| `/rewards` catalog | Client Component | React Query for catalog + wallet balance |
| All forms | Client Component | User interaction |

### 7.4 Web-Specific Features
- **Keyboard shortcuts** on `/markets/[id]`: `Y` = Yes, `N` = No, `Enter` = confirm forecast entry
- **OG image generation** per market via `opengraph-image.tsx` — renders probability % + close time
- **Web Push API** opt-in prompt in `/settings` — for settlement alerts
- **CSV export** of forecast history in `/forecast`
- **Multi-chart view** on `/markets/[id]` for wide screens (probability over time)

---

## 8. Mobile App — apps/mobile

### 8.1 Stack
- Expo 51 / React Native 0.74
- Expo Router v3 (already configured: `"main": "expo-router/entry"`)
- `packages/ui/native` components
- TanStack Query v5 (same hooks as web)
- `expo-notifications` for push token registration + deep link handling
- `expo-haptics` for haptic feedback on YES/NO buttons
- `@gorhom/bottom-sheet` for forecast entry + daily login sheets

### 8.2 Route Structure
```
apps/mobile/app/
  _layout.tsx                       — ThemeProvider, QueryClientProvider, AuthProvider
  (auth)/
    _layout.tsx                     — redirect if authed
    login.tsx
    register.tsx
  (tabs)/
    _layout.tsx                     — BottomTabBar (Home · Forecast · Reviews · Rewards · Profile)
    index.tsx                       — Home feed: streak banner, missions, market movements, AI signals
    forecast.tsx                    — Market browser + open positions list
    reviews.tsx                     — Review browse by category
    rewards.tsx                     — Wallet summary + reward catalog
    profile.tsx                     — Own profile: badges, XP bar, history
  markets/
    [id].tsx                        — Market detail + ForecastEntry BottomSheet
  reviews/
    [productId].tsx                 — Product reviews (RN FlatList)
    new.tsx                         — Review form + camera/photo upload for receipt
  profile/
    [userId].tsx                    — Public profile + FollowButton
  leaderboard.tsx
  rewards/
    redeem/
      [id].tsx                      — Redemption confirmation + KYC gate
  settings/
    index.tsx                       — Account, theme toggle, notifications
    subscription.tsx                — Tier upgrade (Stripe via WebView or deep link)
```

### 8.3 Mobile-Specific UX Patterns

**Forecast entry flow:**
1. User taps MarketCard → navigates to `markets/[id]`
2. Taps YES or NO button → ForecastEntry BottomSheet slides up
3. FP slider (50 FP min, tier max), probability preview, cost display
4. Confirms → haptic feedback, React Query mutation, BottomSheet dismisses, MarketCard updates

**Daily login claim:**
- On app foreground (AppState `active` event), check if streak claimed today
- If not: DailyLogin BottomSheet auto-presents showing streak day + FP reward
- User taps "Claim" → `POST /auth/daily-login` → StreakBanner animates with lemon glow

**Push notification deep links (handled in `_layout.tsx`):**
| Notification type | Deep link target |
|---|---|
| Market closing in 1h | `markets/[id]` |
| Forecast settled — you earned FP | `markets/[id]` (shows SettlementBanner) |
| Reward redeemed | `rewards/redeem/[id]` |
| Daily FP unused (8pm local) | `(tabs)/index` |
| Leaderboard rank changed | `leaderboard` |

**Pull-to-refresh:** All list screens (market browser, review browse, leaderboard, reward catalog) use `RefetchControl` with green `#00D46A` tint.

**Skeleton loaders:** MarketCard, ReviewCard, LeaderboardRow, RewardCard all show skeleton state while loading.

**Receipt upload:** `reviews/new.tsx` uses `expo-image-picker` — camera or photo library. Image uploaded to MinIO via `POST /reviews` multipart form (existing endpoint).

---

## 9. New Dependencies to Add

### apps/admin
```json
{ "react-query": "excluded — uses server actions instead" }
```

### apps/web
```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0"
}
```

### apps/mobile
```json
{
  "@tanstack/react-query": "^5.0.0",
  "@gorhom/bottom-sheet": "^4.0.0",
  "expo-notifications": "~0.28.0",
  "expo-haptics": "~13.0.0",
  "expo-image-picker": "~15.0.0",
  "react-native-reanimated": "~3.10.0",
  "react-native-gesture-handler": "~2.16.0"
}
```

### packages/ui
```json
{
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

---

## 10. Build Order Detail

### Step 1: packages/ui (component library)
Build all 30+ components across 6 categories. Web first, then RN variants. Each component has a simple story/test file. No app code yet.

### Step 2: apps/admin (smallest app, fastest win)
- Add `admin_users` table + migration
- Add admin auth routes + module
- Add admin data routes (users, markets, FP adjust, reviews, analytics)
- Build admin Next.js app using `packages/ui` components

### Step 3: apps/web (largest app)
- Add remaining backend modules (social, profile, leaderboard, gamification, rewards, subscription checkout)
- Build web app: RSC public pages first, then authenticated client pages

### Step 4: apps/mobile (Expo, last)
- Add mobile-specific deps
- Build Expo Router screens using `packages/ui/native` components
- Wire push notifications + deep links
- Test on iOS Simulator + Android Emulator via Expo Go / EAS Build

---

## 11. Testing Strategy

- `packages/ui`: Snapshot tests with `@testing-library/react` for web components
- `apps/admin`: E2E with Playwright (login → 2FA → dashboard flow)
- `apps/web`: React Testing Library for interactive client components; Playwright for critical user journeys (register → enter forecast → see settlement)
- `apps/mobile`: Detox for critical flows on iOS Simulator

---

## 12. What Is NOT in Phase 3

- Live Tango/Rybbon API integration (stub only — awaiting commercial partnership)
- Amazon OAuth for retailer account connection (review verification — Phase 4)
- Google/Apple OAuth Sign-In (Phase 4)
- Automated oracle polling for market resolution (Phase 4)
- B2B brand account portal (brand claim, response, analytics — Phase 4)
- Sentry error tracking integration (Phase 4)
- PostHog product analytics integration (Phase 4)
- AdMob free-tier ads (Phase 4)
- Referral tracking UI (Phase 4)
- Social share card generation for forecast results (Phase 4)
