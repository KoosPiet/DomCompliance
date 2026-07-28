import { z } from "zod";

/**
 * Reasons employment can end. Wording is aimed at a homeowner rather than an
 * HR manager, while still mapping to the categories an employer must be able
 * to justify under the LRA and declare on a UI-19 for UIF.
 */
export const TERMINATION_REASONS = [
  { value: "RESIGNED", label: "Resigned", hint: "They gave notice and left" },
  {
    value: "CONTRACT_ENDED",
    label: "Contract ended",
    hint: "A fixed-term or temporary arrangement ran its course",
  },
  {
    value: "MUTUAL_AGREEMENT",
    label: "Mutual agreement",
    hint: "Both of you agreed to end the employment",
  },
  {
    value: "RETRENCHED",
    label: "Retrenched",
    hint: "The role was no longer needed (operational requirements)",
  },
  {
    value: "DISMISSED_MISCONDUCT",
    label: "Dismissed — misconduct",
    hint: "Dismissal after a fair process for misconduct",
  },
  {
    value: "DISMISSED_POOR_PERFORMANCE",
    label: "Dismissed — poor performance",
    hint: "Dismissal after a fair process for performance",
  },
  { value: "ABSCONDED", label: "Absconded", hint: "Stopped arriving without notice" },
  { value: "RETIRED", label: "Retired", hint: "Reached retirement" },
  { value: "DECEASED", label: "Deceased", hint: "" },
  { value: "OTHER", label: "Other", hint: "Add a short explanation below" },
] as const;

export const TERMINATION_REASON_VALUES = TERMINATION_REASONS.map((r) => r.value) as [
  string,
  ...string[],
];

export function terminationReasonLabel(value?: string | null): string {
  if (!value) return "—";
  return TERMINATION_REASONS.find((r) => r.value === value)?.label ?? value;
}

/** Reasons that carry legal risk if the process wasn't fair — we warn on these. */
export const DISMISSAL_REASONS = [
  "DISMISSED_MISCONDUCT",
  "DISMISSED_POOR_PERFORMANCE",
  "RETRENCHED",
] as const;

/** Why someone is being put back on the books. */
export const REINSTATEMENT_REASONS = [
  {
    value: "LOGGED_IN_ERROR",
    label: "Logged in error",
    hint: "The end of employment was recorded by mistake",
  },
  {
    value: "RETURNED",
    label: "Returned to work",
    hint: "They came back after a break",
  },
  {
    value: "REHIRED",
    label: "Re-hired",
    hint: "You employed them again under a new arrangement",
  },
  {
    value: "DISPUTE_RESOLVED",
    label: "Dispute resolved / reinstated",
    hint: "Reinstated after a CCMA ruling or agreement",
  },
  { value: "OTHER", label: "Other", hint: "Add a short explanation below" },
] as const;

export function reinstatementReasonLabel(value?: string | null): string {
  if (!value) return "—";
  return REINSTATEMENT_REASONS.find((r) => r.value === value)?.label ?? value;
}

export const reinstateSchema = z
  .object({
    reason: z.enum([
      "LOGGED_IN_ERROR",
      "RETURNED",
      "REHIRED",
      "DISPUTE_RESOLVED",
      "OTHER",
    ]),
    note: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.reason !== "OTHER" || Boolean(data.note?.trim()), {
    message: "Please explain why they're being reinstated",
    path: ["note"],
  });

export type ReinstateInput = z.infer<typeof reinstateSchema>;

export const endEmploymentSchema = z
  .object({
    reason: z.enum([
      "RESIGNED",
      "DISMISSED_MISCONDUCT",
      "DISMISSED_POOR_PERFORMANCE",
      "RETRENCHED",
      "CONTRACT_ENDED",
      "RETIRED",
      "ABSCONDED",
      "DECEASED",
      "MUTUAL_AGREEMENT",
      "OTHER",
    ]),
    endDate: z.string().min(1, "Choose the last day of employment"),
    note: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.reason !== "OTHER" || Boolean(data.note?.trim()), {
    message: "Please explain why the employment ended",
    path: ["note"],
  });

export type EndEmploymentInput = z.infer<typeof endEmploymentSchema>;
