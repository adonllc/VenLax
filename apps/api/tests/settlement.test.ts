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
      resolvedOutcome: true,
      lmsrLiquidity: 100,
      qYes: 20,
      qNo: 0,
    }).returning({ id: markets.id });
    marketId = market.id;

    const [pos] = await testDb.insert(forecastPositions).values({
      userId,
      marketId,
      side: true,
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
    expect(position?.fpEarned).toBe(1250); // pro: 10 × 100 × 1.25
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
