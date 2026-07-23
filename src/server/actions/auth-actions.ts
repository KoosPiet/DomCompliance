"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { getRequestContext } from "@/lib/request";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import {
  registerAccount,
  requestPasswordReset,
  resetPassword,
  AccountError,
} from "@/server/services/account";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/** Detect Next.js redirect "errors" so they are re-thrown, not swallowed. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the form.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const ctx = await getRequestContext();
    await registerAccount(parsed.data, ctx);
  } catch (error) {
    if (error instanceof AccountError && error.code === "EMAIL_TAKEN") {
      return {
        ok: false,
        message: error.message,
        fieldErrors: { email: [error.message] },
      };
    }
    console.error("[registerAction]", error);
    return { ok: false, message: "We couldn't create your account. Please try again." };
  }

  // Auto sign-in then redirect to onboarding (redirect throws — let it bubble).
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // Account exists but sign-in hiccuped — send them to login.
    return { ok: true, message: "Account created. Please sign in." };
  }

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Enter your email and password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { ok: false, message: "Invalid email or password." };
    }
    console.error("[loginAction]", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return { ok: true };
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const ctx = await getRequestContext();
  await requestPasswordReset(parsed.data.email, ctx);

  // Always report success (no user enumeration).
  return {
    ok: true,
    message: "If that email is registered, a reset link is on its way.",
  };
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the form.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const ctx = await getRequestContext();
    await resetPassword(parsed.data.token, parsed.data.password, ctx);
  } catch (error) {
    if (error instanceof AccountError) {
      return { ok: false, message: error.message };
    }
    console.error("[resetPasswordAction]", error);
    return { ok: false, message: "We couldn't reset your password. Please try again." };
  }

  return { ok: true, message: "Your password has been reset. You can now sign in." };
}
