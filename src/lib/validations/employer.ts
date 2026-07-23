import { z } from "zod";

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

// NOTE: no `.transform()` here — a transform makes Zod's input and output
// types diverge, which breaks the react-hook-form resolver typing. Empty
// strings are accepted at the edge and normalised to `undefined` in the
// server action (see normaliseEmployerProfile).
const optionalString = z.string().trim().max(200).optional();

export const employerProfileSchema = z.object({
  employerName: z
    .string()
    .trim()
    .min(2, "Enter the name that will appear on contracts")
    .max(160),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  addressLine1: optionalString,
  addressLine2: optionalString,
  city: optionalString,
  province: z.enum(SA_PROVINCES).or(z.literal("")).optional(),
  postalCode: optionalString,
  alternateEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .optional(),
});

export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;

/** Normalise form input: empty strings become undefined, email lower-cased. */
export function normaliseEmployerProfile(data: EmployerProfileInput) {
  const clean = (v?: string) => {
    const trimmed = v?.trim();
    return trimmed ? trimmed : undefined;
  };
  return {
    employerName: data.employerName.trim(),
    phone: data.phone.trim(),
    addressLine1: clean(data.addressLine1),
    addressLine2: clean(data.addressLine2),
    city: clean(data.city),
    province: data.province ? data.province : undefined,
    postalCode: clean(data.postalCode),
    alternateEmail: data.alternateEmail
      ? data.alternateEmail.trim().toLowerCase()
      : undefined,
  };
}
