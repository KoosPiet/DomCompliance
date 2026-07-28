import { z } from "zod";
import type { ComplianceQuestionId } from "@/domain/compliance/questions";

/**
 * Answers to the compliance check. `employsWorker` (the gating question) is
 * required; the remaining measures default to `false` when omitted so a
 * conservative score is always produced.
 *
 * Every question id MUST appear here. Zod strips unknown keys, so a missing
 * entry means the browser's answer is silently discarded before scoring — which
 * is exactly how an unauthorised-worker answer once produced a 100% result. The
 * type assertion below makes that a compile error rather than a silent bug.
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
  isForeignNational: z.boolean().optional(),
  hasValidWorkPermit: z.boolean().optional(),
});
export type ComplianceAnswersInput = z.infer<typeof complianceAnswersSchema>;

/**
 * Compile-time guard: fails to typecheck if a compliance question is missing
 * from the schema above. The error text names the missing question id.
 */
type AssertNoMissingQuestions<T extends never> = T;
type _EveryQuestionIsAccepted = AssertNoMissingQuestions<
  Exclude<ComplianceQuestionId, keyof ComplianceAnswersInput>
>;

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
