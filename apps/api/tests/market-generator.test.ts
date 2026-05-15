import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { markets } from "../src/db/schema";
import { eq } from "drizzle-orm";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

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
    expect(inserted?.source).toBe("ai");
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
