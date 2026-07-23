import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import type { AdminUpdateUserInput } from "@/lib/validations/admin";

interface Ctx {
  ip?: string;
  userAgent?: string;
}

export class AdminError extends Error {
  constructor(
    public code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "EMAIL_TAKEN"
      | "SELF_ROLE"
      | "SELF_DELETE"
      | "LAST_ADMIN",
    message: string,
  ) {
    super(message);
    this.name = "AdminError";
  }
}

/** The acting user must be a live platform ADMIN (SUPPORT is read-only). */
async function assertPlatformAdmin(adminUserId: string) {
  const admin = await prisma.user.findFirst({
    where: { id: adminUserId, deletedAt: null },
  });
  if (!admin || admin.role !== "ADMIN") {
    throw new AdminError(
      "FORBIDDEN",
      "Only platform admins can manage user accounts.",
    );
  }
  return admin;
}

/** Aggregate metrics for the admin dashboard. */
export async function getAdminOverview() {
  const [
    userCount,
    ownerCount,
    employeeCount,
    activeSubs,
    trialingSubs,
    payslipCount,
    contractCount,
    openTickets,
    recentUsers,
    paid,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: "OWNER", deletedAt: null } }),
    prisma.employee.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.payslip.count({ where: { deletedAt: null } }),
    prisma.employmentContract.count({ where: { deletedAt: null } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, deletedAt: null } }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { subscription: { select: { plan: true, status: true } } },
    }),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amountZarCents: true }, _count: true }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true, priceZarCents: true } }),
  ]);

  // Monthly recurring revenue: annual plans amortised to a monthly figure.
  const mrrCents = activeSubscriptions.reduce(
    (sum, s) => sum + (s.plan === "PREMIUM_ANNUAL" ? Math.round(s.priceZarCents / 12) : s.priceZarCents),
    0,
  );

  return {
    userCount,
    ownerCount,
    employeeCount,
    activeSubs,
    trialingSubs,
    payslipCount,
    contractCount,
    openTickets,
    recentUsers,
    totalRevenueCents: paid._sum.amountZarCents ?? 0,
    paidCount: paid._count,
    mrrCents,
  };
}

export function listAdminUsers(query?: string) {
  const q = query?.trim();
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      subscription: { select: { plan: true, status: true } },
      _count: { select: { employees: true, payslips: true } },
    },
  });
}

export function listAdminSubscriptions() {
  return prisma.subscription.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { user: { select: { email: true, name: true } } },
  });
}

export async function getRevenue() {
  const payments = await prisma.payment.findMany({
    where: { status: "COMPLETED" },
    orderBy: [{ processedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { user: { select: { email: true } } },
  });

  const byMonth = new Map<string, number>();
  for (const p of payments) {
    const d = p.processedAt ?? p.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + p.amountZarCents);
  }
  const months = [...byMonth.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, cents]) => ({ month, cents }));

  const totalCents = payments.reduce((sum, p) => sum + p.amountZarCents, 0);
  return { payments: payments.slice(0, 50), months, totalCents };
}

export function listAuditLogs(action?: string) {
  const validAction =
    action &&
    ["CREATE", "UPDATE", "DELETE", "RESTORE", "LOGIN", "LOGOUT", "EXPORT", "SIGN", "SEND", "PAYMENT"].includes(action)
      ? (action as AuditAction)
      : undefined;

  const where: Prisma.AuditLogWhereInput = validAction ? { action: validAction } : {};
  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { email: true } } },
  });
}

export function listTickets() {
  return prisma.supportTicket.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
      _count: { select: { messages: true } },
    },
  });
}

/**
 * Update a user's name, email, role and active state on behalf of an admin.
 * Guards against self-role changes and removing the last admin, and enforces
 * email uniqueness. Writes an audit entry with before/after.
 */
export async function updateUserByAdmin(
  adminUserId: string,
  targetUserId: string,
  input: AdminUpdateUserInput,
  ctx: Ctx = {},
) {
  await assertPlatformAdmin(adminUserId);

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, deletedAt: null },
  });
  if (!target) throw new AdminError("NOT_FOUND", "User not found.");

  const name = input.name?.trim() || null;
  const isSelf = targetUserId === adminUserId;

  // An admin must not lock themselves out of the platform.
  if (isSelf && input.role !== target.role) {
    throw new AdminError("SELF_ROLE", "You cannot change your own role.");
  }
  if (isSelf && !input.isActive) {
    throw new AdminError("SELF_ROLE", "You cannot deactivate your own account.");
  }

  // Email must stay unique across all accounts.
  if (input.email !== target.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing && existing.id !== targetUserId) {
      throw new AdminError("EMAIL_TAKEN", "That email is already in use.");
    }
  }

  // Never leave the platform with no active admin.
  const demotingAdmin = target.role === "ADMIN" && input.role !== "ADMIN";
  if (demotingAdmin) {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", deletedAt: null, isActive: true },
    });
    if (activeAdmins <= 1) {
      throw new AdminError(
        "LAST_ADMIN",
        "You cannot demote the last remaining admin.",
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { name, email: input.email, role: input.role, isActive: input.isActive },
  });

  await recordAudit({
    action: "UPDATE",
    entityType: "User",
    entityId: targetUserId,
    actorId: adminUserId,
    actorEmail: target.email,
    description: `Admin updated account ${updated.email}`,
    before: {
      name: target.name,
      email: target.email,
      role: target.role,
      isActive: target.isActive,
    },
    after: {
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return updated;
}

/**
 * Soft-delete a user: sets deletedAt and deactivates the account. The auth
 * layer already rejects sign-in for deleted/inactive users, so this removes
 * their access while retaining records for audit. Cannot delete yourself or
 * the last remaining admin.
 */
export async function softDeleteUserByAdmin(
  adminUserId: string,
  targetUserId: string,
  ctx: Ctx = {},
) {
  await assertPlatformAdmin(adminUserId);

  if (targetUserId === adminUserId) {
    throw new AdminError("SELF_DELETE", "You cannot delete your own account.");
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, deletedAt: null },
  });
  if (!target) throw new AdminError("NOT_FOUND", "User not found.");

  if (target.role === "ADMIN") {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", deletedAt: null, isActive: true },
    });
    if (activeAdmins <= 1) {
      throw new AdminError(
        "LAST_ADMIN",
        "You cannot delete the last remaining admin.",
      );
    }
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { deletedAt: new Date(), isActive: false },
  });

  await recordAudit({
    action: "DELETE",
    entityType: "User",
    entityId: targetUserId,
    actorId: adminUserId,
    actorEmail: target.email,
    description: `Admin deleted account ${target.email}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}
