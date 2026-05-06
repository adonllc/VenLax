import { db } from "../../db";
import { markets, forecastPositions, fpLedger, users } from "../../db/schema";
import { eq, and, sum, isNull, or, gt, sql } from "drizzle-orm";
import { lmsrProbability, lmsrSharesForFp } from "@venlaxiq/shared";
import { TIER_CONFIG, SubscriptionTier } from "@venlaxiq/shared";
import type { EnterForecastInput } from "./forecast.schema";
import { broadcastMarketProbability } from "../markets/market.broadcaster";

export async function enterForecast(userId: string, input: EnterForecastInput) {
  const position = await db.transaction(async (tx) => {
    // 1. Get market
    const market = await tx.query.markets.findFirst({
      where: eq(markets.id, input.marketId),
    });
    if (!market) throw { statusCode: 404, message: "Market not found" };
    if (market.status !== "open") throw { statusCode: 409, message: "Market is not open for forecast entries" };

    // 2. Get user tier for position limit check
    const user = await tx.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw { statusCode: 404, message: "User not found" };
    const tierConfig = TIER_CONFIG[user.subscriptionTier as SubscriptionTier];

    // 3. Check open position count
    const openPositions = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(forecastPositions)
      .where(and(
        eq(forecastPositions.userId, userId),
        eq(forecastPositions.isWithdrawn, false),
        eq(forecastPositions.isSettled, false),
      ));
    if ((openPositions[0]?.count ?? 0) >= tierConfig.maxOpenPositions) {
      throw { statusCode: 409, message: `Open position limit reached (${tierConfig.maxOpenPositions} for your tier)` };
    }

    // 4. Debit FP from daily_forecast pool first (debit-first pattern eliminates TOCTOU race)
    await tx.insert(fpLedger).values({
      userId,
      poolType: "daily_forecast",
      amount: -input.fpAmount,
      reason: "forecast_deployed",
      referenceId: input.marketId,
      expiresAt: null,
    });

    // 5. Verify post-debit balance is still >= 0 (same tx sees the debit we just inserted)
    const postDebitBalance = await tx
      .select({ total: sum(fpLedger.amount).mapWith(Number) })
      .from(fpLedger)
      .where(and(
        eq(fpLedger.userId, userId),
        eq(fpLedger.poolType, "daily_forecast"),
        or(isNull(fpLedger.expiresAt), gt(fpLedger.expiresAt, sql`NOW()`)),
      ));
    const balance = postDebitBalance[0]?.total ?? 0;
    if (balance < 0) {
      throw { statusCode: 409, message: "Insufficient FP balance" };
    }

    // 6. Compute shares via LMSR
    const b = market.lmsrLiquidity;
    const shares = lmsrSharesForFp(b, market.qYes, market.qNo, input.fpAmount, input.side);
    const priceAtEntry = Math.round(lmsrProbability(b, market.qYes, market.qNo) * 100);

    // 7. Create position
    const [pos] = await tx.insert(forecastPositions).values({
      userId,
      marketId: input.marketId,
      side: input.side === "yes",
      shares,
      fpDeployed: input.fpAmount,
      priceAtEntry,
    }).returning();

    // 8. Update market LMSR state
    const newQYes = input.side === "yes" ? market.qYes + shares : market.qYes;
    const newQNo = input.side === "no" ? market.qNo + shares : market.qNo;
    await tx.update(markets)
      .set({ qYes: newQYes, qNo: newQNo, updatedAt: new Date() })
      .where(eq(markets.id, input.marketId));

    return pos;
  });

  // Broadcast new probability outside transaction (non-blocking)
  broadcastMarketProbability(input.marketId).catch(() => {});

  return position;
}

export async function getPositions(userId: string) {
  return db.query.forecastPositions.findMany({
    where: and(
      eq(forecastPositions.userId, userId),
      eq(forecastPositions.isWithdrawn, false),
      eq(forecastPositions.isSettled, false),
    ),
  });
}

export async function withdrawForecast(positionId: string, userId: string) {
  return db.transaction(async (tx) => {
    const position = await tx.query.forecastPositions.findFirst({
      where: and(eq(forecastPositions.id, positionId), eq(forecastPositions.userId, userId)),
    });
    if (!position) throw { statusCode: 404, message: "Position not found" };
    if (position.isWithdrawn) throw { statusCode: 409, message: "Position already withdrawn" };
    if (position.isSettled) throw { statusCode: 409, message: "Position already settled" };

    const market = await tx.query.markets.findFirst({ where: eq(markets.id, position.marketId) });
    if (!market) throw { statusCode: 404, message: "Market not found" };
    if (market.status !== "open") throw { statusCode: 409, message: "Market is not open for withdrawals" };

    // Current withdrawal value based on current probability
    const b = market.lmsrLiquidity;
    const side = position.side ? "yes" : "no";
    const currentProb = position.side
      ? lmsrProbability(b, market.qYes, market.qNo)
      : 1 - lmsrProbability(b, market.qYes, market.qNo);
    const grossReturn = Math.round(position.shares * currentProb * 100);
    const platformAllocation = position.shares; // 1 FP per share
    const netReturn = Math.max(0, grossReturn - platformAllocation);

    // Credit withdrawal return to earned pool
    if (netReturn > 0) {
      await tx.insert(fpLedger).values({
        userId,
        poolType: "earned",
        amount: netReturn,
        reason: "forecast_withdrawn",
        referenceId: positionId,
        expiresAt: new Date(Date.now() + 90 * 86400000),
      });
    }

    // Update market LMSR state (remove shares from pool)
    const newQYes = side === "yes" ? market.qYes - position.shares : market.qYes;
    const newQNo = side === "no" ? market.qNo - position.shares : market.qNo;
    await tx.update(markets)
      .set({ qYes: Math.max(0, newQYes), qNo: Math.max(0, newQNo), updatedAt: new Date() })
      .where(eq(markets.id, position.marketId));

    // Mark position withdrawn
    const [updated] = await tx.update(forecastPositions)
      .set({ isWithdrawn: true })
      .where(eq(forecastPositions.id, positionId))
      .returning();

    return updated;
  });
}
