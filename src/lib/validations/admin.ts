import { z } from "zod";
import { emailSchema } from "@/lib/validations/auth";

/** Roles an admin may assign from the user-management UI. */
export const ADMIN_ROLE_OPTIONS = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPPORT", label: "Support" },
] as const;

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().max(120, "Name is too long").optional(),
  email: emailSchema,
  role: z.enum(["OWNER", "ADMIN", "SUPPORT"]),
  isActive: z.boolean(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
