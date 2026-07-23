import { z } from "zod";

export const signContractSchema = z.object({
  signatureName: z
    .string()
    .trim()
    .min(2, "Type your full name to sign")
    .max(120),
  signatureData: z
    .string()
    .startsWith("data:image/", "A signature is required")
    .max(500_000, "Signature image is too large"),
});

export type SignContractInput = z.infer<typeof signContractSchema>;
