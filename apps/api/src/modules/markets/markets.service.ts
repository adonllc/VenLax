import { db } from "../../db";
import { markets } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { CreateMarketInput } from "./markets.schema";

export async function createMarket(input: CreateMarketInput & { creatorId?: string }) {
  const [market] = await db.insert(markets).values({
    title: input.title,
    description: input.description,
    category: input.category,
    resolutionCriteria: input.resolutionCriteria,
    resolutionSource: input.resolutionSource,
    closesAt: new Date(input.closesAt),
    resolvesAt: new Date(input.resolvesAt),
    lmsrLiquidity: input.lmsrLiquidity ?? 100,
    listingFeePaid: input.listingFeePaid ?? false,
    creatorId: input.creatorId ?? null,
    status: "draft",
  }).returning();
  return market;
}

export async function listMarkets(status?: string) {
  if (status) {
    return db.query.markets.findMany({
      where: eq(markets.status, status as any),
      orderBy: (m, { asc }) => [asc(m.closesAt)],
    });
  }
  return db.query.markets.findMany({
    where: eq(markets.status, "open"),
    orderBy: (m, { asc }) => [asc(m.closesAt)],
  });
}

export async function getMarket(id: string) {
  return db.query.markets.findFirst({ where: eq(markets.id, id) });
}

export async function changeMarketStatus(id: string, status: string) {
  const [updated] = await db.update(markets)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(markets.id, id))
    .returning();
  return updated;
}
