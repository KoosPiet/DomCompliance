import { z } from "zod";
import { SA_PROVINCES } from "@/lib/validations/employer";

/**
 * Employee (domestic worker) input schema.
 *
 * Following the project convention, we avoid `.transform()` so Zod's input and
 * output types stay identical for the react-hook-form resolver. Numeric fields
 * are captured as validated strings and converted to numbers/Decimals in the
 * service layer — this sidesteps the NaN pitfalls of number inputs and keeps
 * the form defaultValues strongly typed.
 */

export const OCCUPATIONS = [
  { value: "DOMESTIC_WORKER", label: "Domestic Worker" },
  { value: "GARDENER", label: "Gardener" },
  { value: "NANNY", label: "Nanny" },
  { value: "CAREGIVER", label: "Caregiver" },
  { value: "DRIVER", label: "Driver" },
  { value: "OTHER", label: "Other" },
] as const;

export const PAY_FREQUENCIES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "WEEKLY", label: "Weekly" },
] as const;

export const OCCUPATION_VALUES = OCCUPATIONS.map((o) => o.value) as [
  string,
  ...string[],
];

const optionalString = z.string().trim().max(200).optional();
const money = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter a valid amount, e.g. 4500 or 4500.00");

export const employeeSchema = z.object({
  // Identity
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  idNumber: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "A South African ID number is 13 digits")
    .optional()
    .or(z.literal("")),
  passportNumber: z.string().trim().max(30).optional(),

  // Contact
  phone: optionalString,
  whatsapp: optionalString,
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),

  // Address
  addressLine1: optionalString,
  addressLine2: optionalString,
  city: optionalString,
  province: z.enum(SA_PROVINCES).optional().or(z.literal("")),
  postalCode: optionalString,

  // Employment
  occupation: z.enum([
    "DOMESTIC_WORKER",
    "GARDENER",
    "NANNY",
    "CAREGIVER",
    "DRIVER",
    "OTHER",
  ]),
  otherOccupation: optionalString,
  startDate: z.string().min(1, "Start date is required"),
  salary: money,
  payFrequency: z.enum(["MONTHLY", "FORTNIGHTLY", "WEEKLY"]),
  workingDaysPerWeek: z.enum(["1", "2", "3", "4", "5", "6", "7"]),
  ordinaryHoursDay: z
    .string()
    .trim()
    .regex(/^\d{1,2}(\.\d{1,2})?$/, "Enter valid hours, e.g. 9 or 8.5"),
  scheduleNote: optionalString,

  // Banking
  bankName: optionalString,
  bankAccountHolder: optionalString,
  bankAccountNumber: z.string().trim().max(34).optional(),
  bankBranchCode: optionalString,
  bankAccountType: optionalString,

  // Emergency contact
  emergencyName: optionalString,
  emergencyPhone: optionalString,
  emergencyRelationship: optionalString,

  notes: z.string().trim().max(2000).optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

/** Sensible defaults for the "add employee" form. */
export const employeeFormDefaults: Partial<EmployeeInput> = {
  occupation: "DOMESTIC_WORKER",
  payFrequency: "MONTHLY",
  workingDaysPerWeek: "5",
  ordinaryHoursDay: "9",
};

/** Human label for an occupation (falls back to the free-text "other" value). */
export function occupationLabel(value: string, other?: string | null): string {
  if (value === "OTHER" && other) return other;
  return OCCUPATIONS.find((o) => o.value === value)?.label ?? value;
}
