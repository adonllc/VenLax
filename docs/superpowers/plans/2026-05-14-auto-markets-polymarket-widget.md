# Auto Market Creation + Polymarket Comparison Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-generate prediction markets from news every 6h via the insight worker, and show matching Polymarket probabilities on market detail pages.

**Architecture:** Add `generateAndStoreMarket(db)` to `insight.service.ts` — fetches top headlines, deduplicates against existing markets via Claude, inserts as `status: "open"`. The insight worker calls this after signal generation. Market detail page fetches Polymarket Gamma API and uses Claude to find a semantic match, then renders a comparison card.

**Tech Stack:** BullMQ, Drizzle ORM, Anthropic SDK `claude-sonnet-4-6`, NewsAPI, Polymarket Gamma API, Next.js 15 server components, Vitest

---

## File Map

**Modified:**
- `apps/api/src/modules/ai/insight.service.ts` — add `generateAndStoreMarket(db)`
- `apps/api/src/jobs/insight.worker.ts` — call `generateAndStoreMarket` each run
- `apps/web/app/markets/[id]/page.tsx` — add Polymarket widget section

**Created:**
- `apps/api/tests/market-generator.test.ts` — vitest unit tests for market generation
- `apps/web/lib/polymarket.ts` — Polymarket fetch + Claude matching
- `apps/web/app/markets/[id]/PolymarketComparisonCard.tsx` — display component

---

## Task 1: `generateAndStoreMarket` in insight.service.ts

**Files:**
- Modify: `apps/api/src/modules/ai/insight.service.ts`

- [ ] **Step 1: Add `fetchTopHeadlines` helper and `generateAndStoreMarket` function**

Append to `apps/api/src/modules/ai/insight.service.ts` after the existing `generateAndStoreSignal` function:

```typescript
async function fetchTopHeadlines(): Promise<string[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&apiKey=${apiKey}`
    );
    const data = await res.json() as any;
    return (data.articles ?? []).map((a: any) => a.title as string).filter(Boolean);
  } catch {
    return [];
  }
}

export async function generateAndStoreMarket(db: DB): Promise<void> {
  const headlines = await fetchTopHeadlines();
  if (headlines.length === 0) return;

  const openMarkets = await db.query.markets.findMany({
    where: eq(markets.status, "open"),
    columns: { title: true },
  });
  const existingTitles = openMarkets.map((m) => m.title);

  const today = new Date();
  const defaultClosesAt = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString();

  const response = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system:
      "You are a prediction market operator. Analyze news headlines and generate one new binary prediction market question. Return valid JSON only. No markdown.",
    messages: [
      {
        role: "user",
        content: `Today's top news headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Existing open markets — do NOT create a market covering these topics:
${existingTitles.length > 0 ? existingTitles.map((t) => `- ${t}`).join("\n") : "None"}

Pick the single most interesting headline that forms a clear binary YES/NO prediction market. If any headline's topic overlaps >70% conceptually with an existing market, skip it. If no good candidate exists, set skip to true.

Today: ${today.toISOString().split("T")[0]}
Default closesAt if no specific date known: ${defaultClosesAt}

Return JSON only — one of:
{"skip":false,"title":"Will X do Y by [date]?","description":"2-3 sentence context.","category":"sports"|"politics"|"open","resolutionCriteria":"Exact verifiable YES condition.","resolutionSource":"Reuters","closesAt":"<ISO 8601>"}
{"skip":true,"skipReason":"<reason>"}`,
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") return;

  let parsed: any;
  try {
    parsed = JSON.parse(block.text);
  } catch {
    console.error("[market-gen] Claude returned invalid JSON");
    return;
  }

  if (parsed.skip === true) {
    console.log("[market-gen] Skipped:", parsed.skipReason);
    return;
  }

  if (!parsed.title || !parsed.description || !parsed.resolutionCriteria || !parsed.closesAt) {
    console.error("[market-gen] Claude response missing required fields");
    return;
  }

  const validCategories = ["sports", "politics", "open"] as const;
  const category = validCategories.includes(parsed.category) ? parsed.category : "open";

  try {
    await db.insert(markets).values({
      title: String(parsed.title).slice(0, 200),
      description: String(parsed.description),
      category,
      resolutionCriteria: String(parsed.resolutionCriteria),
      resolutionSource: String(parsed.resolutionSource ?? "News sources").slice(0, 200),
      closesAt: new Date(parsed.closesAt),
      resolvesAt: new Date(parsed.closesAt),
      status: "open",
      lmsrLiquidity: 100,
      listingFeePaid: true,
      creatorId: null,
    });
    console.log("[market-gen] Created market:", parsed.title);
  } catch (err) {
    console.error("[market-gen] DB insert failed:", err);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm --filter api build
```

Expected: no TypeScript errors.

---

## Task 2: Tests for `generateAndStoreMarket`

**Files:**
- Create: `apps/api/tests/market-generator.test.ts`

- [ ] **Step 1: Write the test file**

Create `apps/api/tests/market-generator.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { markets } from "../src/db/schema";
import { eq } from "drizzle-orm";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

// Mock global fetch for NewsAPI
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { generateAndStoreMarket } from "../src/modules/ai/insight.service";

const VALID_MARKET_RESPONSE = {
  skip: false,
  title: "Will the Fed cut interest rates before July 2026?",
  description: "The Federal Reserve is under pressure to cut rates amid slowing growth.",
  category: "politics",
  resolutionCriteria: "YES if the Fed announces a rate cut at any FOMC meeting before July 1, 2026.",
  resolutionSource: "Federal Reserve",
  closesAt: "2026-06-30T23:59:59.000Z",
};

describe("generateAndStoreMarket", () => {
  beforeEach(async () => {
    await resetDb();
    mockFetch.mockReset();
    mockCreate.mockReset();

    // Default: NewsAPI returns headlines
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        articles: [
          { title: "Fed considers rate cut amid economic slowdown" },
          { title: "NBA Finals: Lakers take game 1" },
          { title: "New climate bill passes Senate" },
        ],
      }),
    });
  });

  afterAll(async () => { await closeDb(); });

  it("inserts a new open market when Claude returns a valid market", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(VALID_MARKET_RESPONSE) }],
    });

    await generateAndStoreMarket(testDb);

    const inserted = await testDb.query.markets.findFirst({
      where: eq(markets.title, VALID_MARKET_RESPONSE.title),
    });

    expect(inserted).toBeDefined();
    expect(inserted?.status).toBe("open");
    expect(inserted?.category).toBe("politics");
    expect(inserted?.listingFeePaid).toBe(true);
    expect(inserted?.creatorId).toBeNull();
  });

  it("does not insert when Claude returns skip:true", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ skip: true, skipReason: "All topics covered" }) }],
    });

    await generateAndStoreMarket(testDb);

    const all = await testDb.query.markets.findMany();
    expect(all).toHaveLength(0);
  });

  it("does not insert when Claude returns invalid JSON", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "not json at all" }],
    });

    await generateAndStoreMarket(testDb);

    const all = await testDb.query.markets.findMany();
    expect(all).toHaveLength(0);
  });

  it("does not insert when Claude response is missing required fields", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ skip: false, title: "Only title" }) }],
    });

    await generateAndStoreMarket(testDb);

    const all = await testDb.query.markets.findMany();
    expect(all).toHaveLength(0);
  });

  it("defaults category to 'open' when Claude returns unknown category", async () => {
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({ ...VALID_MARKET_RESPONSE, category: "entertainment" }),
      }],
    });

    await generateAndStoreMarket(testDb);

    const inserted = await testDb.query.markets.findFirst({
      where: eq(markets.title, VALID_MARKET_RESPONSE.title),
    });
    expect(inserted?.category).toBe("open");
  });

  it("does nothing when NewsAPI returns no headlines", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ articles: [] }),
    });

    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(VALID_MARKET_RESPONSE) }],
    });

    await generateAndStoreMarket(testDb);

    const all = await testDb.query.markets.findMany();
    expect(all).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pnpm --filter api test tests/market-generator.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/ai/insight.service.ts apps/api/tests/market-generator.test.ts
git commit -m "feat(api): add generateAndStoreMarket to insight service"
```

---

## Task 3: Wire `generateAndStoreMarket` into the insight worker

**Files:**
- Modify: `apps/api/src/jobs/insight.worker.ts`

- [ ] **Step 1: Add import and call**

Replace the full content of `apps/api/src/jobs/insight.worker.ts`:

```typescript
import { Queue, Worker } from "bullmq";
import { redisConnection } from "../queue";
import { db } from "../db";
import { markets } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateAndStoreSignal, generateAndStoreMarket } from "../modules/ai/insight.service";

const insightQueue = new Queue("insight-generation", { connection: redisConnection });

export async function scheduleInsightJobs(): Promise<void> {
  await insightQueue.add(
    "generate-all-signals",
    {},
    {
      repeat: { every: 6 * 60 * 60 * 1000 },
      jobId: "insight-repeatable",
    }
  );
}

export const insightWorker = new Worker(
  "insight-generation",
  async () => {
    const openMarkets = await db.query.markets.findMany({
      where: eq(markets.status, "open"),
    });

    for (const market of openMarkets) {
      await generateAndStoreSignal(db, market.id);
    }

    await generateAndStoreMarket(db);

    return { processed: openMarkets.length };
  },
  { connection: redisConnection, concurrency: 1 }
);

insightWorker.on("failed", (job, err) => {
  console.error("Insight generation job failed:", err.message);
});
```

- [ ] **Step 2: Build to verify no errors**

```bash
pnpm --filter api build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/jobs/insight.worker.ts
git commit -m "feat(api): auto-create market from news in insight worker"
```

---

## Task 4: Polymarket matching lib in web app

**Files:**
- Create: `apps/web/lib/polymarket.ts`

- [ ] **Step 1: Install Anthropic SDK in web app**

```bash
pnpm --filter web add @anthropic-ai/sdk
```

Expected: `@anthropic-ai/sdk` appears in `apps/web/package.json` dependencies.

- [ ] **Step 2: Create `apps/web/lib/polymarket.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";

export interface PolymarketMatch {
  polyQuestion: string;
  polyYesPercent: number;
  polyUrl: string;
}

interface PolymarketMarket {
  question: string;
  outcomePrices: string;
  slug?: string;
  conditionId?: string;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function findPolymarketMatch(
  marketTitle: string
): Promise<PolymarketMatch | null> {
  let results: PolymarketMarket[] = [];
  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/markets?search=${encodeURIComponent(marketTitle)}&limit=5&active=true`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    results = await res.json();
  } catch {
    return null;
  }

  if (!Array.isArray(results) || results.length === 0) return null;

  let parsed: { match: number | null };
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64,
      system: "You match prediction market questions. Return valid JSON only. No markdown.",
      messages: [
        {
          role: "user",
          content: `VenlaxIQ market: "${marketTitle}"

Polymarket candidates:
${results.map((m, i) => `${i}: ${m.question}`).join("\n")}

Which index (0-${results.length - 1}) best matches with >70% conceptual similarity?
Return {"match":<index>} or {"match":null} if no good match.`,
        },
      ],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") return null;
    parsed = JSON.parse(block.text);
  } catch {
    return null;
  }

  if (parsed.match === null || parsed.match === undefined) return null;

  const matched = results[parsed.match];
  if (!matched) return null;

  let polyYesPercent = 50;
  try {
    const prices: string[] = JSON.parse(matched.outcomePrices);
    polyYesPercent = Math.round(parseFloat(prices[0]) * 100);
    if (isNaN(polyYesPercent)) return null;
  } catch {
    return null;
  }

  const slug = matched.slug ?? matched.conditionId ?? "";
  if (!slug) return null;

  return {
    polyQuestion: matched.question,
    polyYesPercent,
    polyUrl: `https://polymarket.com/event/${slug}`,
  };
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm --filter web build
```

Expected: no type errors related to `polymarket.ts`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/polymarket.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add Polymarket semantic matching lib"
```

---

## Task 5: `PolymarketComparisonCard` component

**Files:**
- Create: `apps/web/app/markets/[id]/PolymarketComparisonCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
interface PolymarketComparisonCardProps {
  polyQuestion: string;
  polyYesPercent: number;
  venlaxYesPercent: number;
  polyUrl: string;
}

export function PolymarketComparisonCard({
  polyQuestion,
  polyYesPercent,
  venlaxYesPercent,
  polyUrl,
}: PolymarketComparisonCardProps) {
  return (
    <div className="mt-4 bg-surface-2 border border-border rounded-xl p-5">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Also trading on Polymarket
      </p>
      <p className="text-sm text-text-primary mb-4 line-clamp-2">{polyQuestion}</p>
      <div className="flex gap-6 items-center">
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-green">{venlaxYesPercent}%</p>
          <p className="text-xs text-text-secondary mt-0.5">VenlaxIQ</p>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-text-primary">{polyYesPercent}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Polymarket</p>
        </div>
      </div>
      <a
        href={polyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-4 text-xs text-text-secondary hover:text-green transition-colors"
      >
        View on Polymarket →
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/markets/[id]/PolymarketComparisonCard.tsx
git commit -m "feat(web): add PolymarketComparisonCard component"
```

---

## Task 6: Wire widget into market detail page

**Files:**
- Modify: `apps/web/app/markets/[id]/page.tsx`

- [ ] **Step 1: Add import and widget call**

Add these two imports at the top of `apps/web/app/markets/[id]/page.tsx`, after the existing imports:

```typescript
import { findPolymarketMatch } from "@/lib/polymarket";
import { PolymarketComparisonCard } from "./PolymarketComparisonCard";
```

- [ ] **Step 2: Fetch Polymarket match in the server component**

Inside `MarketDetailPage`, after this existing line:

```typescript
  const prob = Math.round(
    (market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100
  );
```

Add:

```typescript
  const polyMatch = await findPolymarketMatch(market.title).catch(() => null);
```

- [ ] **Step 3: Render the widget**

Inside the JSX, add the widget directly after the probability bar `</div>` closing tag (after the `<div className="mb-6 bg-surface-2...">` block):

```tsx
        {/* Polymarket comparison widget */}
        {polyMatch && (
          <PolymarketComparisonCard
            polyQuestion={polyMatch.polyQuestion}
            polyYesPercent={polyMatch.polyYesPercent}
            venlaxYesPercent={prob}
            polyUrl={polyMatch.polyUrl}
          />
        )}
```

- [ ] **Step 4: Build to verify no errors**

```bash
pnpm --filter web build
```

Expected: clean build.

- [ ] **Step 5: Manual test**

Open a market detail page. Check two cases:
1. A market with a likely Polymarket equivalent (e.g. Bitcoin price) → widget appears with two percentages
2. A niche market → widget is hidden, page looks identical to before

- [ ] **Step 6: Commit and push**

```bash
git add apps/web/app/markets/[id]/page.tsx
git commit -m "feat(web): show Polymarket comparison widget on market detail"
git push
```

---

## Task 7: Remove debug logging

The debug `console.error` logs added during the auth debugging session are still in production code.

**Files:**
- Modify: `apps/web/app/api/auth/register/route.ts`
- Modify: `apps/web/app/api/auth/login/route.ts`

- [ ] **Step 1: Remove debug logs from register route**

In `apps/web/app/api/auth/register/route.ts`, replace:

```typescript
    } catch (err) {
      console.error("[register] res.json() failed:", err);
      return NextResponse.json({ error: "API unavailable" }, { status: 502 });
    }
```

with:

```typescript
    } catch {
      return NextResponse.json({ error: "API unavailable" }, { status: 502 });
    }
```

And replace:

```typescript
  } catch (err) {
    console.error("[register] outer catch:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
```

with:

```typescript
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
```

- [ ] **Step 2: Remove debug log from login route**

In `apps/web/app/api/auth/login/route.ts`, replace:

```typescript
  } catch (err) {
    console.error("[login] outer catch:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
```

with:

```typescript
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
```

- [ ] **Step 3: Commit and push**

```bash
git add apps/web/app/api/auth/register/route.ts apps/web/app/api/auth/login/route.ts
git commit -m "chore(web): remove debug console.error logs from auth routes"
git push
```
