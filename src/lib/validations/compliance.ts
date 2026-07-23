import { z } from "zod";

/**
 * Answers to the 8-question compliance check. `employsWorker` (the gating
 * question) is required; the remaining measures default to `false` when
 * omitted so a conservative score is always produced.
 */
export const complianceAnswersSchema = z.object({
  employsWorker: z.boolean(),
  hasContract: z.boolean().optional(),
  issuesPayslips: z.boolean().optional(),
  registeredUif: z.boolean().optional(),
  submitsUif: z.boolean().optional(),
  keepsLeaveRecords: z.boolean().optional(),
  keepsSalaryRecords: z.boolean().optional(),
  hasSignedDocuments: z.boolean().optional(),
});
export type ComplianceAnswersInput = z.infer<typeof complianceAnswersSchema>;

/** Answers to the short 3-question viral compliance checker. */
export const viralAnswersSchema = z.object({
  hasContract: z.boolean(),
  issuesPayslips: z.boolean(),
  registeredUif: z.boolean(),
});
export type ViralAnswersInput = z.infer<typeof viralAnswersSchema>;

export const assessRequestSchema = z.object({
  answers: complianceAnswersSchema,
  source: z.enum(["LANDING", "VIRAL", "DASHBOARD"]).default("LANDING"),
  /** Optional lead capture (viral tool may ask for email before signup). */
  email: z.string().email().optional(),
  name: z.string().max(120).optional(),
});
export type AssessRequestInput = z.infer<typeof assessRequestSchema>;
