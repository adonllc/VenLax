import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users, products, reviews, fpLedger } from "../src/db/schema";
import { eq } from "drizzle-orm";

// Mock Anthropic SDK before importing scorer
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ text: JSON.stringify({ score: 85, flags: [] }) }],
      }),
    };
  },
}));

import { processReviewScoring } from "../src/modules/ai/review-scorer";

describe("Review AI Trust Scoring", () => {
  let userId: string;
  let productId: string;
  let reviewId: string;

  beforeEach(async () => {
    await resetDb();

    const [user] = await testDb.insert(users).values({
      email: "aitest@example.com",
      username: "aitest",
    }).returning({ id: users.id });
    userId = user.id;

    const [prod] = await testDb.insert(products).values({
      name: "Test Product",
      category: "electronics",
    }).returning({ id: products.id });
    productId = prod.id;

    const [rev] = await testDb.insert(reviews).values({
      userId,
      productId,
      title: "Great product",
      body: "I have been using this product for months and love it.",
      rating: 5,
      isPublished: false,
      badge: "none",
    }).returning({ id: reviews.id });
    reviewId = rev.id;
  });

  afterAll(async () => { await closeDb(); });

  it("scores a review and publishes it when trust score >= 70", async () => {
    await processReviewScoring(testDb, reviewId, userId);

    const review = await testDb.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
    expect(review?.aiTrustScore).toBe(85);
    expect(review?.isPublished).toBe(true);
  });

  it("credits FP to user after review is published (unverified: 200 FP base)", async () => {
    await processReviewScoring(testDb, reviewId, userId);

    const ledger = await testDb.query.fpLedger.findMany({ where: eq(fpLedger.userId, userId) });
    const fpEntry = ledger.find(e => e.reason === "review_published");
    expect(fpEntry).toBeDefined();
    expect(fpEntry?.amount).toBe(200);
  });

  it("credits 1000 FP for verified reviews (with receipt)", async () => {
    await testDb.update(reviews)
      .set({ receiptUrl: "receipts/user/test.jpg" })
      .where(eq(reviews.id, reviewId));

    await processReviewScoring(testDb, reviewId, userId);

    const ledger = await testDb.query.fpLedger.findMany({ where: eq(fpLedger.userId, userId) });
    const fpEntry = ledger.find(e => e.reason === "review_published");
    expect(fpEntry?.amount).toBe(1000);

    const review = await testDb.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
    expect(review?.badge).toBe("verified");
  });
});
