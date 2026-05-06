"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const db_1 = require("./helpers/db");
const schema_1 = require("../src/db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const subscriptions_service_1 = require("../src/modules/subscriptions/subscriptions.service");
(0, vitest_1.describe)("Subscriptions Service", () => {
    (0, vitest_1.beforeEach)(async () => { await (0, db_1.resetDb)(); });
    (0, vitest_1.afterAll)(async () => { await (0, db_1.closeDb)(); });
    (0, vitest_1.it)("upgrades user tier to pro when subscription created", async () => {
        const [user] = await db_1.testDb.insert(schema_1.users).values({
            email: "stripe@example.com",
            username: "stripeuser",
            stripeCustomerId: "cus_test123",
        }).returning({ id: schema_1.users.id });
        await (0, subscriptions_service_1.handleSubscriptionUpdated)({
            customerId: "cus_test123",
            subscriptionId: "sub_test123",
            priceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder",
            status: "active",
        });
        const updated = await db_1.testDb.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, user.id),
        });
        (0, vitest_1.expect)(updated?.subscriptionTier).toBe("pro");
        (0, vitest_1.expect)(updated?.stripeSubscriptionId).toBe("sub_test123");
    });
    (0, vitest_1.it)("downgrades user to free when subscription cancelled", async () => {
        const [user] = await db_1.testDb.insert(schema_1.users).values({
            email: "cancel@example.com",
            username: "canceluser",
            stripeCustomerId: "cus_cancel123",
            subscriptionTier: "elite",
            stripeSubscriptionId: "sub_cancel123",
        }).returning({ id: schema_1.users.id });
        await (0, subscriptions_service_1.handleSubscriptionDeleted)({ customerId: "cus_cancel123" });
        const updated = await db_1.testDb.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, user.id),
        });
        (0, vitest_1.expect)(updated?.subscriptionTier).toBe("free");
        (0, vitest_1.expect)(updated?.stripeSubscriptionId).toBeNull();
    });
});
