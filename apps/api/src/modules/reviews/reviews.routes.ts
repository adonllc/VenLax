import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { submitReviewSchema, voteSchema } from "./reviews.schema";
import { submitReview, getProductReviews, voteHelpful } from "./reviews.service";

export async function reviewRoutes(app: FastifyInstance) {
  app.post("/reviews", { preHandler: [authenticate] }, async (request, reply) => {
    const result = submitReviewSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const { sub } = request.user as { sub: string };
    try {
      const review = await submitReview(sub, result.data);
      return reply.code(201).send(review);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.get("/reviews/product/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await getProductReviews(id));
  });

  app.post("/reviews/:id/vote", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = voteSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const { sub } = request.user as { sub: string };
    try {
      const updated = await voteHelpful(id, sub, result.data.helpful);
      return reply.send(updated);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
