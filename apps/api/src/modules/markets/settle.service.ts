import { eq, and, inArray } from "drizzle-orm";
import { markets, forecastPositions, fpLedger, users, auditLog } from "../../db/schema";
import { TIER_CONFIG, SubscriptionTier } from "@venlaxiq/shared";
import type { DB } from "../../db";

export async function settleMarket(db: DB, marketId: string): Promise<void> {
  const market = await db.query.markets.findFirst({ where: eq(markets.id, marketId) });
  if (!market) throw new Error(`Market ${marketId} not found`);
  if (market.status !== "resolved") throw new Error("Market must be in resolved state to settle");
  if (market.resolvedOutcome === null || market.resolvedOutcome === undefined) {
    throw new Error("Market has no resolved outcome");
  }

  const winSide = market.resolvedOutcome;

  const positions = await db.query.forecastPositions.findMany({
    where: and(
      eq(forecastPositions.marketId, marketId),
      eq(forecastPositions.isSettled, false),
      eq(forecastPositions.isWithdrawn, false),
    ),
  });

  // Batch-fetch all users for winning positions (eliminates N+1)
  const winnerUserIds = [...new Set(
    positions.filter(p => p.side === winSide).map(p => p.userId)
  )];
  const winnerUsers = winnerUserIds.length > 0
    ? await db.query.users.findMany({ where: inArray(users.id, winnerUserIds) })
    : [];
  const userMap = new Map(winnerUsers.map(u => [u.id, u]));

  await db.transaction(async (tx) => {
    for (const position of positions) {
      const isWinner = position.side === winSide;
      let fpEarned = 0;

      if (isWinner) {
        const user = userMap.get(position.userId);
        const tier = (user?.subscriptionTier ?? "free") as SubscriptionTier;
        const multiplier = TIER_CONFIG[tier].accuracyMultiplier;
        fpEarned = Math.round(position.shares * 100 * multiplier);

        const fpExpiryDays = TIER_CONFIG[tier].fpExpiryDays;
        await tx.insert(fpLedger).values({
          userId: position.userId,
          poolType: "earned",
          amount: fpEarned,
          reason: "forecast_earned",
          referenceId: position.id,
          expiresAt: new Date(Date.now() + fpExpiryDays * 86400000),
        });
      }

      await tx.update(forecastPositions)
        .set({ isSettled: true, fpEarned })
        .where(eq(forecastPositions.id, position.id));
    }

    await tx.update(markets)
      .set({ status: "settled", updatedAt: new Date() })
      .where(eq(markets.id, marketId));

    await tx.insert(auditLog).values({
      action: "market_settled",
      targetType: "market",
      targetId: marketId,
      metadata: JSON.stringify({ totalPositions: positions.length, winSide }),
    });
  });
}
