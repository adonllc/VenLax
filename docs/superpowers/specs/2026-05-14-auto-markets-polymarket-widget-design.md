# Design: Auto Market Creation + Polymarket Comparison Widget

**Date:** 2026-05-14  
**Status:** Approved

---

## Overview

Two features to bootstrap user engagement at launch:

1. **Auto Market Creation** — insight worker generates and auto-publishes prediction markets from news every 6 hours using Claude
2. **Polymarket Comparison Widget** — market detail page shows matching Polymarket probability for context and credibility

---

## Feature 1: Auto Market Creation

### Goals
- Keep the platform stocked with fresh, relevant markets without manual admin effort
- Avoid duplicate markets across runs
- Produce well-formed markets (clear resolution criteria, realistic deadlines)

### Architecture

**Where:** Extend `apps/api/src/jobs/insight.worker.ts` with a second scheduled job `generate-market`, running on the same 6h cadence as `generate-all-signals`.

**Flow:**
```
[insight.worker] every 6h
  → fetch top 10 headlines from NewsAPI (reuse existing fetch logic)
  → query open market titles from DB
  → single Claude call (claude-sonnet-4-6)
      input: headlines array + existing market titles array
      task:
        - semantically check if any headline matches an existing market
        - pick the single best headline suitable for a binary prediction market
        - if no suitable/non-duplicate headline → return { skip: true, skipReason }
        - otherwise → return structured market JSON
  → if skip: true → log reason, exit
  → insert market into DB as status="open"
```

**Claude output schema (JSON):**
```ts
{
  skip: boolean;
  skipReason?: string;         // only when skip: true
  title?: string;              // max 200 chars, binary question form ("Will X do Y?")
  description?: string;        // 2-3 sentence context
  category?: "sports" | "politics" | "open";
  resolutionCriteria?: string; // explicit, verifiable criteria
  resolutionSource?: string;   // e.g. "Reuters", "ESPN", "AP"
  closesAt?: string;           // ISO 8601 — game date, election date, or +3 weeks
}
```

**Prompt strategy:** Single Claude call handles both semantic dedup and generation. Claude receives full existing market titles as context and is instructed to skip if similarity is high.

**DB insert defaults:**
- `status: "open"`
- `creatorId: null`
- `qYes: 100`, `qNo: 100` (50% starting probability)
- `lmsrLiquidity: 100`
- `listingFeePaid: true`

**Implementation location:**
- New function `generateAndStoreMarket()` in `apps/api/src/modules/ai/insight.service.ts`
- Called from `insight.worker.ts` after existing signal generation

### Error Handling
- Claude call fails → log error, skip silently (don't crash worker)
- Claude returns invalid JSON → log, skip
- DB insert fails → log, skip
- Never throws — worker continues to next scheduled run

---

## Feature 2: Polymarket Comparison Widget

### Goals
- Add credibility by showing users how VenlaxIQ probabilities compare to a real-money market
- Attract users familiar with Polymarket
- Zero maintenance — fully automated matching

### Architecture

**Where:** `apps/web/app/markets/[id]/page.tsx` — new server-side section below the probability bar.

**Flow:**
```
[MarketDetailPage] on render
  → fetch Polymarket Gamma API (5-min Next.js cache)
      GET https://gamma-api.polymarket.com/markets
          ?search=<url-encoded market title>
          &limit=5
          &active=true
  → if fetch fails → render page without widget (silent)
  → single Claude call (claude-sonnet-4-6)
      input: VenlaxIQ market title + top 5 Polymarket results
      task: pick best semantic match or return null
      threshold: >70% conceptual similarity required
  → if null → render page without widget
  → render PolymarketComparisonCard component
```

**PolymarketComparisonCard props:**
```ts
{
  polyQuestion: string;       // Polymarket market question (truncated to 100 chars)
  polyYesPercent: number;     // from JSON.parse(outcomePrices)[0] * 100 (Polymarket returns JSON string)
  venlaxYesPercent: number;   // current VenlaxIQ probability
  polyUrl: string;            // https://polymarket.com/event/<slug>
}
```

**Caching:**
- Polymarket fetch: `next: { revalidate: 300 }` (5 min)
- Claude call: not cached (fast, ~300 tokens, result depends on Polymarket data)

**Rendering:**
- Shown: comparison card with both probabilities side by side, "Also trading on Polymarket" label, link to Polymarket
- Hidden: if no match found or any error — page renders identically to current state
- No empty state, no loading spinners (server rendered)

**New files:**
- `apps/web/app/markets/[id]/PolymarketComparisonCard.tsx` — display component

**Implementation location:**
- Polymarket fetch + Claude matching logic as `findPolymarketMatch()` in `apps/web/lib/polymarket.ts`
- Called from `MarketDetailPage` server component

### Error Handling
- Entire widget wrapped in try/catch — any failure silently skips the widget
- Polymarket API rate limits: 5-min cache significantly reduces call volume
- Claude failure: caught, widget hidden

---

## Dependencies

| Dependency | Already available? |
|---|---|
| Claude SDK (`@anthropic-ai/sdk`) | Yes — used in `apps/api/src/modules/ai/` |
| `ANTHROPIC_API_KEY` env var | Yes |
| NewsAPI fetch | Yes — in insight service |
| Polymarket Gamma API | Public, no auth required |
| BullMQ / insight worker | Yes |

---

## Out of Scope

- Manifold Markets integration (Phase 3)
- Auto-resolution of AI-created markets (Phase 3)
- Admin notifications for auto-created markets
- Polymarket data persistence/caching in DB
