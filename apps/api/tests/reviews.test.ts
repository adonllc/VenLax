import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users, products, reviews } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Review Engine", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userToken: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });

  afterAll(async () => { await app.close(); await closeDb(); });

  beforeEach(async () => {
    await resetDb();

    const regRes = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "reviewer@example.com", username: "reviewer", password: "Pass123!" },
    });
    const regBody = JSON.parse(regRes.body);
    userToken = regBody.token;
    userId = regBody.user.id;

    const [prod] = await testDb.insert(products).values({
      name: "Sony WH-1000XM5",
      category: "electronics",
      brand: "Sony",
    }).returning({ id: products.id });
    productId = prod.id;
  });

  describe("POST /reviews", () => {
    it("submits a review and queues AI scoring", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/reviews",
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          productId,
          title: "Outstanding noise cancellation",
          body: "I have been using these headphones for 3 months and the noise cancellation is incredible.",
          rating: 5,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.productId).toBe(productId);
      expect(body.rating).toBe(5);
      expect(body.isPublished).toBe(false);
      expect(body.badge).toBe("none");
    });

    it("returns 400 for rating out of range", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/reviews",
        headers: { authorization: `Bearer ${userToken}` },
        payload: { productId, title: "Bad", body: "A review body", rating: 6 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /reviews/product/:id", () => {
    it("returns published reviews for a product", async () => {
      await testDb.insert(reviews).values({
        userId,
        productId,
        title: "Great product",
        body: "Loved it.",
        rating: 5,
        isPublished: true,
        badge: "none",
      });

      const res = await app.inject({
        method: "GET",
        url: `/reviews/product/${productId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(1);
      expect(body[0].isPublished).toBe(true);
    });
  });

  describe("POST /reviews/:id/vote", () => {
    it("records a helpful vote on a review", async () => {
      const [review] = await testDb.insert(reviews).values({
        userId,
        productId,
        title: "Good product",
        body: "Works great.",
        rating: 4,
        isPublished: true,
        badge: "none",
      }).returning({ id: reviews.id });

      const res = await app.inject({
        method: "POST",
        url: `/reviews/${review.id}/vote`,
        headers: { authorization: `Bearer ${userToken}` },
        payload: { helpful: true },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).helpfulVotes).toBe(1);
    });
  });
});
