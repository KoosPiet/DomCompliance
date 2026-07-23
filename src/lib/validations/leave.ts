import { z } from "zod";

export const LEAVE_TYPES = [
  { value: "ANNUAL", label: "Annual leave" },
  { value: "SICK", label: "Sick leave" },
  { value: "FAMILY_RESPONSIBILITY", label: "Family responsibility" },
  { value: "MATERNITY", label: "Maternity leave" },
  { value: "UNPAID", label: "Unpaid leave" },
] as const;

export function leaveTypeLabel(value: string): string {
  return LEAVE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const logLeaveSchema = z
  .object({
    employeeId: z.string().uuid("Select an employee"),
    leaveType: z.enum(["ANNUAL", "SICK", "FAMILY_RESPONSIBILITY", "MATERNITY", "UNPAID"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    days: z
      .string()
      .trim()
      .regex(/^\d{1,3}(\.\d)?$/, "Enter the number of days, e.g. 3 or 0.5"),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  })
  .refine((data) => Number(data.days) > 0, {
    message: "Days must be greater than zero",
    path: ["days"],
  });

export type LogLeaveInput = z.infer<typeof logLeaveSchema>;
