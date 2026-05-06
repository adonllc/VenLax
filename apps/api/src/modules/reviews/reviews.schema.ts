import { z } from "zod";

export const submitReviewSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(5).max(120),
  body: z.string().min(20),
  rating: z.number().int().min(1).max(5),
});

export const voteSchema = z.object({
  helpful: z.boolean(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
