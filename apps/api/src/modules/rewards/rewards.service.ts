import { db } from "../../db";
import { rewardCatalog, rewardRedemptions, fpLedger } from "../../db/schema";
import { eq, desc, sum } from "drizzle-orm";

interface TangoProvider {
  issue(itemId: string, fpCost: number): Promise<{ code: string; success: boolean }>;
}

class StubTangoProvider implements TangoProvider {
  async issue(_itemId: string, _fpCost: number) {
    return { code: "STUB-CODE-123", success: true };
  }
}

const tangoProvider: TangoProvider = new StubTangoProvider();

export async function getCatalog() {
  return db.select().from(rewardCatalog).where(eq(rewardCatalog.isActive, true)).orderBy(rewardCatalog.fpCost);
}

export async function redeemReward(userId: string, catalogItemId: string) {
  const [item] = await db.select().from(rewardCatalog).where(eq(rewardCatalog.id, catalogItemId)).limit(1);
  if (!item || !item.isActive) throw { statusCode: 404, message: "Reward not found" };

  const [{ balance }] = await db.select({ balance: sum(fpLedger.amount) })
    .from(fpLedger).where(eq(fpLedger.userId, userId));

  if (Number(balance ?? 0) < item.fpCost) {
    throw { statusCode: 402, message: "Insufficient FP balance" };
  }

  const { code, success } = await tangoProvider.issue(item.id, item.fpCost);
  if (!success) throw { statusCode: 502, message: "Reward provider unavailable" };

  await db.transaction(async (tx) => {
    await tx.insert(fpLedger).values({
      userId, amount: -item.fpCost, poolType: "earned",
      reason: `Redeemed: ${item.name}`,
    });
    await tx.insert(rewardRedemptions).values({
      userId, catalogItemId, fpDebited: item.fpCost, code, status: "completed",
    });
  });

  return { code, itemName: item.name, fpDebited: item.fpCost };
}

export async function getRedemptionHistory(userId: string) {
  return db.select({
    id: rewardRedemptions.id,
    fpDebited: rewardRedemptions.fpDebited,
    code: rewardRedemptions.code,
    status: rewardRedemptions.status,
    createdAt: rewardRedemptions.createdAt,
    itemName: rewardCatalog.name,
    itemCategory: rewardCatalog.category,
  }).from(rewardRedemptions)
    .innerJoin(rewardCatalog, eq(rewardRedemptions.catalogItemId, rewardCatalog.id))
    .where(eq(rewardRedemptions.userId, userId))
    .orderBy(desc(rewardRedemptions.createdAt))
    .limit(50);
}

export async function seedRewardCatalog() {
  const items = [
    { name: "$5 Amazon Gift Card", category: "gift_cards", fpCost: 500, description: "Digital code delivered instantly" },
    { name: "$10 Amazon Gift Card", category: "gift_cards", fpCost: 950, description: "Digital code delivered instantly" },
    { name: "$5 Starbucks Gift Card", category: "dining", fpCost: 500, description: "Redeemable at any Starbucks" },
    { name: "$10 DoorDash Credit", category: "dining", fpCost: 950, description: "Valid on your next order" },
    { name: "1 Month Netflix", category: "entertainment", fpCost: 1500, description: "Standard plan gift code" },
    { name: "1 Month Spotify Premium", category: "entertainment", fpCost: 1000, description: "Individual plan gift code" },
  ];
  await db.insert(rewardCatalog).values(items).onConflictDoNothing();
}
