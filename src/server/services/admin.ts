import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
