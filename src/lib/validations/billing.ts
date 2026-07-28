import { z } from "zod";

/**
 * Why a customer is cancelling. Kept short and non-judgemental — the point is
 * to learn why people leave, not to talk them out of it.
 */
export const CANCELLATION_REASONS = [
  {
    value: "NO_LONGER_EMPLOY",
    label: "I no longer employ anyone",
    hint: "Your worker has left and you don't need this for now",
  },
  { value: "TOO_EXPENSIVE", label: "Too expensive", hint: "" },
  {
    value: "NOT_USING",
    label: "I'm not using it enough",
    hint: "",
  },
  {
    value: "MISSING_FEATURES",
    label: "Missing something I need",
    hint: "Tell us what — it genuinely shapes what we build",
  },
  { value: "SWITCHING", label: "Switching to something else", hint: "" },
  { value: "OTHER", label: "Other", hint: "Add a short explanation below" },
] as const;

export function cancellationReasonLabel(value?: string | null): string {
  if (!value) return "—";
  return CANCELLATION_REASONS.find((r) => r.value === value)?.label ?? value;
}

export const cancelSubscriptionSchema = z
  .object({
    reason: z.enum([
      "NO_LONGER_EMPLOY",
      "TOO_EXPENSIVE",
      "NOT_USING",
      "MISSING_FEATURES",
      "SWITCHING",
      "OTHER",
    ]),
    note: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.reason !== "OTHER" || Boolean(data.note?.trim()), {
    message: "Please tell us a little more",
    path: ["note"],
  });

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
