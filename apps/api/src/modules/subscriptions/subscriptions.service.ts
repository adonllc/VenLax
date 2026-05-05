import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { TIER_CONFIG, SubscriptionTier } from "@venlaxiq/shared";

function tierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === TIER_CONFIG.pro.stripePriceId) return "pro";
  if (priceId === TIER_CONFIG.elite.stripePriceId) return "elite";
  return "free";
}

export async function handleSubscriptionUpdated(params: {
  customerId: string;
  subscriptionId: string;
  priceId: string;
  status: string;
}) {
  if (params.status !== "active" && params.status !== "trialing") return;

  const tier = tierFromPriceId(params.priceId);

  await db.update(users)
    .set({ subscriptionTier: tier, stripeSubscriptionId: params.subscriptionId })
    .where(eq(users.stripeCustomerId, params.customerId));
}

export async function handleSubscriptionDeleted(params: { customerId: string }) {
  await db.update(users)
    .set({ subscriptionTier: "free", stripeSubscriptionId: null })
    .where(eq(users.stripeCustomerId, params.customerId));
}
