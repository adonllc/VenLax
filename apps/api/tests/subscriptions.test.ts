import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

import { handleSubscriptionUpdated, handleSubscriptionDeleted } from
  "../src/modules/subscriptions/subscriptions.service";

describe("Subscriptions Service", () => {
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await closeDb(); });

  it("upgrades user tier to pro when subscription created", async () => {
    const [user] = await testDb.insert(users).values({
      email: "stripe@example.com",
      username: "stripeuser",
      stripeCustomerId: "cus_test123",
    }).returning({ id: users.id });

    await handleSubscriptionUpdated({
      customerId: "cus_test123",
      subscriptionId: "sub_test123",
      priceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder",
      status: "active",
    });

    const updated = await testDb.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    expect(updated?.subscriptionTier).toBe("pro");
    expect(updated?.stripeSubscriptionId).toBe("sub_test123");
  });

  it("downgrades user to free when subscription cancelled", async () => {
    const [user] = await testDb.insert(users).values({
      email: "cancel@example.com",
      username: "canceluser",
      stripeCustomerId: "cus_cancel123",
      subscriptionTier: "elite",
      stripeSubscriptionId: "sub_cancel123",
    }).returning({ id: users.id });

    await handleSubscriptionDeleted({ customerId: "cus_cancel123" });

    const updated = await testDb.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    expect(updated?.subscriptionTier).toBe("free");
    expect(updated?.stripeSubscriptionId).toBeNull();
  });
});
