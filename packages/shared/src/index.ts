export type SubscriptionTier = "free" | "pro" | "elite";

export const TIER_CONFIG: Record<SubscriptionTier, {
  dailyForecastFp: number;
  maxOpenPositions: number;
  accuracyMultiplier: number;
  monthlyBonusFp: number;
  aiSignalsPerDay: number;
  fpExpiryDays: number;
  stripePriceId: string | null;
}> = {
  free: {
    dailyForecastFp: 500,
    maxOpenPositions: 5,
    accuracyMultiplier: 1.0,
    monthlyBonusFp: 0,
    aiSignalsPerDay: 0,
    fpExpiryDays: 60,
    stripePriceId: null,
  },
  pro: {
    dailyForecastFp: 2000,
    maxOpenPositions: 15,
    accuracyMultiplier: 1.25,
    monthlyBonusFp: 5000,
    aiSignalsPerDay: 3,
    fpExpiryDays: 90,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder",
  },
  elite: {
    dailyForecastFp: 6000,
    maxOpenPositions: 50,
    accuracyMultiplier: 1.75,
    monthlyBonusFp: 20000,
    aiSignalsPerDay: 10,
    fpExpiryDays: 180,
    stripePriceId: process.env.STRIPE_ELITE_PRICE_ID ?? "price_elite_placeholder",
  },
};

export * from "./lmsr";
