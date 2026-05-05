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
