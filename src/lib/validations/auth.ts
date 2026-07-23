import { z } from "zod";

/** Shared password policy: min 8 chars, at least one letter and one number. */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Password is too long") // bcrypt truncates beyond 72 bytes
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .transform((v) => v.trim().toLowerCase());

export const registerSchema = z.object({
  name: z.string().min(2, "Enter your name").max(120),
  email: emailSchema,
  password: passwordSchema,
  // Optional: carry a compliance assessment through signup for attribution.
  assessmentId: z.string().uuid().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
