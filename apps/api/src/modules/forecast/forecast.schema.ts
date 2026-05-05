import { z } from "zod";

export const enterForecastSchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(["yes", "no"]),
  fpAmount: z.number().int().min(50, "Minimum forecast entry is 50 FP"),
});

export type EnterForecastInput = z.infer<typeof enterForecastSchema>;
