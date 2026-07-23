import { z } from "zod";

export const REMINDER_TYPES = [
  { value: "SUBMIT_UIF", label: "Submit UIF" },
  { value: "GENERATE_PAYSLIP", label: "Generate payslip" },
  { value: "PAY_SALARY", label: "Pay salary" },
  { value: "SALARY_REVIEW", label: "Salary review" },
  { value: "CONTRACT_RENEWAL", label: "Contract renewal" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const REMINDER_FREQUENCIES = [
  { value: "ONCE", label: "One-off" },
  { value: "MONTHLY", label: "Every month" },
  { value: "ANNUALLY", label: "Every year" },
] as const;

export function reminderTypeLabel(value: string): string {
  return REMINDER_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const reminderSchema = z.object({
  type: z.enum([
    "SUBMIT_UIF",
    "GENERATE_PAYSLIP",
    "PAY_SALARY",
    "SALARY_REVIEW",
    "CONTRACT_RENEWAL",
    "CUSTOM",
  ]),
  title: z.string().trim().min(2, "Give the reminder a title").max(120),
  description: z.string().trim().max(500).optional(),
  dueDate: z.string().min(1, "Choose a due date"),
  frequency: z.enum(["ONCE", "MONTHLY", "ANNUALLY"]),
  channelEmail: z.boolean(),
  channelWhatsapp: z.boolean(),
});

export type ReminderInput = z.infer<typeof reminderSchema>;
