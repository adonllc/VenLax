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
