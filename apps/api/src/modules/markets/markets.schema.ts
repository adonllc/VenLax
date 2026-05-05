import { z } from "zod";

export const createMarketSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20),
  category: z.enum(["sports", "politics", "open"]),
  resolutionCriteria: z.string().min(10),
  resolutionSource: z.string().url(),
  closesAt: z.string().datetime(),
  resolvesAt: z.string().datetime(),
  lmsrLiquidity: z.number().int().min(50).max(1000).default(100),
  listingFeePaid: z.boolean().default(false),
});

export const changeStatusSchema = z.object({
  status: z.enum(["draft", "open", "closed", "resolved", "settled"]),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;
