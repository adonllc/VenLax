import { db } from "../../db";
import { reviews, fpLedger } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { aiQueue } from "../../queue";
import type { SubmitReviewInput } from "./reviews.schema";

export async function submitReview(userId: string, input: SubmitReviewInput) {
  const [review] = await db.insert(reviews).values({
    userId,
    productId: input.productId,
    title: input.title,
    body: input.body,
    rating: input.rating,
    isPublished: false,
    badge: "none",
  }).returning();

  await aiQueue.add("score-review", { reviewId: review.id, userId });

  return review;
}

export async function getProductReviews(productId: string) {
  return db.query.reviews.findMany({
    where: and(eq(reviews.productId, productId), eq(reviews.isPublished, true)),
    orderBy: (r, { desc }) => [desc(r.helpfulVotes)],
  });
}

export async function voteHelpful(
  reviewId: string,
  userId: string,
  helpful: boolean
): Promise<typeof reviews.$inferSelect> {
  const review = await db.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
  if (!review) throw { statusCode: 404, message: "Review not found" };

  const [updated] = await db.update(reviews)
    .set({
      totalVotes: review.totalVotes + 1,
      helpfulVotes: helpful ? review.helpfulVotes + 1 : review.helpfulVotes,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId))
    .returning();

  if (
    updated.badge === "verified" &&
    updated.totalVotes >= 10 &&
    updated.helpfulVotes / updated.totalVotes >= 0.8
  ) {
    const [withBadge] = await db.update(reviews)
      .set({ badge: "community_trusted" })
      .where(eq(reviews.id, reviewId))
      .returning();

    await db.insert(fpLedger).values({
      userId: review.userId,
      poolType: "review",
      amount: 1000,
      reason: "review_community_trusted",
      referenceId: reviewId,
      expiresAt: new Date(Date.now() + 90 * 86400000),
    });

    return withBadge;
  }

  return updated;
}
