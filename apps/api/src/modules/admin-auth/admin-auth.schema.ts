import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const adminVerify2faSchema = z.object({
  partialToken: z.string(),
  totpCode: z.string().length(6).regex(/^\d+$/),
});
