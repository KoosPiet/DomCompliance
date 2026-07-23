import { z } from "zod";

export const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

export function monthLabel(month: number): string {
  return MONTHS.find((m) => m.value === String(month))?.label ?? String(month);
}

const money = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter a valid amount, e.g. 4500 or 4500.00");
const moneyOptional = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter a valid amount")
  .optional()
  .or(z.literal(""));

export const payslipSchema = z.object({
  employeeId: z.string().uuid("Select an employee"),
  periodMonth: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]),
  periodYear: z.string().regex(/^\d{4}$/, "Select a valid year"),
  payDate: z.string().min(1, "Pay date is required"),
  basicSalary: money,
  overtime: moneyOptional,
  allowances: moneyOptional,
  bonuses: moneyOptional,
  otherEarnings: moneyOptional,
  otherDeductions: moneyOptional,
  applyUif: z.boolean(),
  applyPaye: z.boolean(),
  notes: z.string().trim().max(500).optional(),
});

export type PayslipInput = z.infer<typeof payslipSchema>;

/** Parse a money string ("" -> 0) to a number. */
export function toAmount(value?: string): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
