import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  hashToken,
} from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/resend";
import {
  verificationEmail,
  welcomeEmail,
  passwordResetEmail,
} from "@/lib/email/templates";
import { recordAudit } from "@/server/audit";
import { siteConfig } from "@/config/site";
import { FREE_TRIAL_DAYS, planById } from "@/config/site";
import type { RegisterInput } from "@/lib/validations/auth";

export class AccountError extends Error {
  constructor(
    public readonly code: "EMAIL_TAKEN" | "INVALID_TOKEN" | "USER_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "AccountError";
  }
}

interface RequestContext {
  ip?: string;
  userAgent?: string;
}

function appUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

/**
 * Register a new employer account. Provisions the free-trial subscription,
 * links any prior compliance assessment, writes an audit entry (atomically),
 * then dispatches verification + welcome emails.
 */
export async function registerAccount(
  input: RegisterInput,
  ctx: RequestContext = {},
) {
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AccountError("EMAIL_TAKEN", "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const trialPlan = planById("FREE_TRIAL");
  const trialEndsAt = addDays(new Date(), FREE_TRIAL_DAYS);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        name: input.name,
        passwordHash,
        role: "OWNER",
        subscription: {
          create: {
            plan: "FREE_TRIAL",
            status: "TRIALING",
            trialEndsAt,
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEndsAt,
            priceZarCents: 0,
            employeeLimit: trialPlan.employeeLimit,
            payslipLimit: trialPlan.payslipLimit,
          },
        },
      },
    });

    if (input.assessmentId) {
      await tx.complianceAssessment.updateMany({
        where: { id: input.assessmentId, userId: null },
        data: { userId: created.id },
      });
      await tx.lead.updateMany({
        where: { email, converted: false },
        data: { converted: true, convertedUserId: created.id },
      });
    }

    await recordAudit({
      tx,
      action: "CREATE",
      entityType: "User",
      entityId: created.id,
      actorId: created.id,
      actorEmail: created.email,
      description: "Account registered (free trial)",
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return created;
  });

  // Fire-and-forget emails (never block registration on delivery).
  const rawToken = await createEmailVerificationToken(email);
  const verifyUrl = appUrl(
    `/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`,
  );
  const verify = verificationEmail({ name: user.name, url: verifyUrl });
  const welcome = welcomeEmail({ name: user.name, url: appUrl("/dashboard") });

  await Promise.allSettled([
    sendEmail({ to: email, ...verify }),
    sendEmail({ to: email, ...welcome }),
  ]);

  return user;
}

/**
 * Start a password reset. Always resolves successfully to avoid leaking
 * whether an email is registered (user enumeration protection).
 */
export async function requestPasswordReset(
  email: string,
  ctx: RequestContext = {},
): Promise<void> {
  const normalized = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user || user.deletedAt) return; // silent success

  const rawToken = await createPasswordResetToken(user.id);
  const url = appUrl(`/reset-password?token=${rawToken}`);
  const mail = passwordResetEmail({ name: user.name, url });

  await sendEmail({ to: normalized, ...mail });
  await recordAudit({
    action: "UPDATE",
    entityType: "User",
    entityId: user.id,
    actorId: user.id,
    description: "Password reset requested",
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Complete a password reset: validate the token, set the new password, and
 * consume the token in a single transaction.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
  ctx: RequestContext = {},
): Promise<void> {
  const resolved = await verifyPasswordResetToken(rawToken);
  if (!resolved) {
    throw new AccountError("INVALID_TOKEN", "This reset link is invalid or has expired.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resolved.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resolved.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other outstanding reset tokens.
    prisma.passwordResetToken.updateMany({
      where: { userId: resolved.userId, usedAt: null, id: { not: resolved.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  await recordAudit({
    action: "UPDATE",
    entityType: "User",
    entityId: resolved.userId,
    actorId: resolved.userId,
    description: "Password reset completed",
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/** Re-send the verification email for a not-yet-verified user. */
export async function resendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerified) return;

  const rawToken = await createEmailVerificationToken(user.email);
  const url = appUrl(
    `/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`,
  );
  const mail = verificationEmail({ name: user.name, url });
  await sendEmail({ to: user.email, ...mail });
}

export { hashToken };
