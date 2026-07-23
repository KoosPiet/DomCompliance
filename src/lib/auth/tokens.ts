import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Opaque token helpers for email verification and password resets.
 *
 * We generate a high-entropy raw token, email the raw value to the user, and
 * persist only its SHA-256 hash. A database leak therefore never exposes a
 * usable token.
 */

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// --- Email verification -----------------------------------------------------

/** Issue a verification token for an email; returns the raw token to email. */
export async function createEmailVerificationToken(email: string): Promise<string> {
  const identifier = email.toLowerCase();
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  // Replace any outstanding tokens for this address.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  });

  return raw;
}

/**
 * Validate a verification token and mark the user's email as verified.
 * Returns the verified user's id, or null if the token is invalid/expired.
 */
export async function consumeEmailVerificationToken(
  email: string,
  rawToken: string,
): Promise<string | null> {
  const identifier = email.toLowerCase();
  const tokenHash = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!record || record.identifier !== identifier || record.expires < new Date()) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { email: identifier } });
  if (!user) return null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } }),
  ]);

  return user.id;
}

// --- Password reset ---------------------------------------------------------

/** Issue a password-reset token for a user; returns the raw token to email. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expires },
  });

  return raw;
}

/**
 * Resolve a valid password-reset token to its user id (without consuming it).
 * The token is marked used inside the same transaction that updates the
 * password — see the reset service.
 */
export async function verifyPasswordResetToken(
  rawToken: string,
): Promise<{ id: string; userId: string } | null> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expires < new Date()) return null;
  return { id: record.id, userId: record.userId };
}

export { hashToken };
