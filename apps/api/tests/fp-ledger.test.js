"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const db_1 = require("./helpers/db");
const schema_1 = require("../src/db/schema");
const fp_ledger_service_1 = require("../src/modules/fp-ledger/fp-ledger.service");
(0, vitest_1.describe)("FP Ledger Service", () => {
    let userId;
    (0, vitest_1.beforeEach)(async () => {
        await (0, db_1.resetDb)();
        const [user] = await db_1.testDb.insert(schema_1.users).values({
            email: "ledger@example.com",
            username: "ledgeruser",
        }).returning({ id: schema_1.users.id });
        userId = user.id;
    });
    (0, vitest_1.afterAll)(async () => { await (0, db_1.closeDb)(); });
    (0, vitest_1.it)("credits FP and returns new balance", async () => {
        await (0, fp_ledger_service_1.creditFp)(db_1.testDb, {
            userId,
            poolType: "earned",
            amount: 1000,
            reason: "forecast_earned",
            expiresInDays: 90,
        });
        const balance = await (0, fp_ledger_service_1.getBalance)(db_1.testDb, userId);
        (0, vitest_1.expect)(balance.earned).toBe(1000);
        (0, vitest_1.expect)(balance.total).toBe(1000);
    });
    (0, vitest_1.it)("debits FP and reduces balance", async () => {
        await (0, fp_ledger_service_1.creditFp)(db_1.testDb, { userId, poolType: "earned", amount: 2000, reason: "test", expiresInDays: 90 });
        await (0, fp_ledger_service_1.debitFp)(db_1.testDb, { userId, poolType: "earned", amount: 500, reason: "redemption" });
        const balance = await (0, fp_ledger_service_1.getBalance)(db_1.testDb, userId);
        (0, vitest_1.expect)(balance.earned).toBe(1500);
    });
    (0, vitest_1.it)("throws when debit exceeds balance", async () => {
        await (0, fp_ledger_service_1.creditFp)(db_1.testDb, { userId, poolType: "earned", amount: 100, reason: "test", expiresInDays: 90 });
        await (0, vitest_1.expect)((0, fp_ledger_service_1.debitFp)(db_1.testDb, { userId, poolType: "earned", amount: 500, reason: "overdraft" })).rejects.toThrow("Insufficient FP balance");
    });
    (0, vitest_1.it)("does not count expired entries in balance", async () => {
        // Credit with expiry in the past (simulate expired entry)
        await db_1.testDb.insert(require("../src/db/schema").fpLedger).values({
            userId,
            poolType: "earned",
            amount: 5000,
            reason: "expired_test",
            expiresAt: new Date("2020-01-01"), // past date
        });
        const balance = await (0, fp_ledger_service_1.getBalance)(db_1.testDb, userId);
        (0, vitest_1.expect)(balance.earned).toBe(0);
        (0, vitest_1.expect)(balance.total).toBe(0);
    });
    (0, vitest_1.it)("tracks separate pool balances", async () => {
        await (0, fp_ledger_service_1.creditFp)(db_1.testDb, { userId, poolType: "earned", amount: 1000, reason: "forecast", expiresInDays: 90 });
        await (0, fp_ledger_service_1.creditFp)(db_1.testDb, { userId, poolType: "bonus", amount: 500, reason: "referral", expiresInDays: 90 });
        await (0, fp_ledger_service_1.creditFp)(db_1.testDb, { userId, poolType: "review", amount: 200, reason: "review_published", expiresInDays: 90 });
        const balance = await (0, fp_ledger_service_1.getBalance)(db_1.testDb, userId);
        (0, vitest_1.expect)(balance.earned).toBe(1000);
        (0, vitest_1.expect)(balance.bonus).toBe(500);
        (0, vitest_1.expect)(balance.review).toBe(200);
        (0, vitest_1.expect)(balance.total).toBe(1700);
    });
});
