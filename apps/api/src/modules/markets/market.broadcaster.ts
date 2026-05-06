import { db } from "../../db";
import { markets } from "../../db/schema";
import { eq } from "drizzle-orm";
import { lmsrProbability } from "@venlaxiq/shared";
import { broadcastProbability } from "../../plugins/websocket";

export async function broadcastMarketProbability(marketId: string): Promise<void> {
  const market = await db.query.markets.findFirst({ where: eq(markets.id, marketId) });
  if (!market) return;
  const probability = lmsrProbability(market.lmsrLiquidity, market.qYes, market.qNo);
  broadcastProbability(marketId, Math.round(probability * 100));
}
