import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { fpLedger } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Daily Login FP", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userToken: string;
  let userId: string;

  beforeAll(async () => { app = await buildApp({ logger: false }); });
  afterAll(async () => { await app.close(); await closeDb(); });

  beforeEach(async () => {
    await resetDb();
    const regRes = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "daily@example.com", username: "dailyuser", password: "Pass123!" },
    });
    const body = JSON.parse(regRes.body);
    userToken = body.token;
    userId = body.user.id;
  });

  it("claims daily FP on first login of the day", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/daily-login",
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.fpGranted).toBeGreaterThanOrEqual(100);
    expect(body.streak).toBe(1);
  });

  it("credits FP to bonus pool", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/daily-login",
      headers: { authorization: `Bearer ${userToken}` },
    });
    const ledger = await testDb.query.fpLedger.findMany({ where: eq(fpLedger.userId, userId) });
    const entry = ledger.find(e => e.reason === "daily_login");
    expect(entry).toBeDefined();
    expect(entry?.poolType).toBe("bonus");
    expect(entry?.amount).toBeGreaterThan(0);
  });

  it("returns 409 if daily FP already claimed today", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/daily-login",
      headers: { authorization: `Bearer ${userToken}` },
    });
    const res = await app.inject({
      method: "POST",
      url: "/auth/daily-login",
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(409);
  });
});
