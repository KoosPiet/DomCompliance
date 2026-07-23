import { addMonths, addYears } from "date-fns";
import type { Employee, LeaveRequest } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import { getEmployee } from "@/server/services/employee";
import { leaveTypeLabel, type LogLeaveInput } from "@/lib/validations/leave";
import {
  annualLeaveEntitlement,
  annualLeaveAccrued,
  leaveEntitlementSummary,
  monthsOfService,
} from "@/domain/leave/accrual";
import { LeaveType } from "@/domain/leave/types";

interface Ctx {
  ip?: string;
  userAgent?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function annualCycleStart(startDate: Date, asOf: Date): Date {
  const fullYears = Math.floor(monthsOfService(startDate, asOf) / 12);
  return addYears(startDate, fullYears);
}

function sickCycleStart(startDate: Date, asOf: Date): Date {
  const fullCycles = Math.floor(monthsOfService(startDate, asOf) / 36);
  return addMonths(startDate, fullCycles * 36);
}

export interface LeaveBalanceView {
  leaveType: string;
  label: string;
  entitledDays: number;
  accruedDays: number;
  takenDays: number;
  balanceDays: number;
}

export interface EmployeeLeaveOverview {
  employee: Employee;
  balances: LeaveBalanceView[];
  requests: LeaveRequest[];
  annualCycleStart: Date;
}

/** Full leave picture for one employee: statutory balances + history. */
export async function getEmployeeLeaveOverview(
  userId: string,
  employeeId: string,
): Promise<EmployeeLeaveOverview> {
  const employee = await getEmployee(userId, employeeId);
  const now = new Date();
  const cycleStart = annualCycleStart(employee.startDate, now);
  const sickStart = sickCycleStart(employee.startDate, now);

  const summary = leaveEntitlementSummary({
    workingDaysPerWeek: employee.workingDaysPerWeek,
    startDate: employee.startDate,
    cycleStart,
    asOf: now,
  });

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId, deletedAt: null, status: "APPROVED" },
    orderBy: { startDate: "desc" },
  });

  const takenSince = (type: string, since: Date) =>
    requests
      .filter((r) => r.leaveType === type && r.startDate >= since)
      .reduce((sum, r) => sum + Number(r.days), 0);

  const balances: LeaveBalanceView[] = summary.map((s) => {
    const since = s.leaveType === LeaveType.SICK ? sickStart : cycleStart;
    const taken = takenSince(s.leaveType, since);
    const base =
      s.leaveType === LeaveType.FAMILY_RESPONSIBILITY ? s.entitledDays : s.accruedDays;
    return {
      leaveType: s.leaveType,
      label: leaveTypeLabel(s.leaveType),
      entitledDays: round2(s.entitledDays),
      accruedDays: round2(s.accruedDays),
      takenDays: round2(taken),
      balanceDays: Math.max(0, round2(base - taken)),
    };
  });

  return { employee, balances, requests, annualCycleStart: cycleStart };
}

export interface LeaveOverviewRow {
  employee: Employee;
  entitled: number;
  accrued: number;
  taken: number;
  balance: number;
}

/** Annual-leave summary across all employees (2 queries, computed in memory). */
export async function getLeaveOverview(userId: string): Promise<{
  rows: LeaveOverviewRow[];
  recent: (LeaveRequest & { employee: { firstName: string; lastName: string } })[];
}> {
  const now = new Date();
  const [employees, requests] = await Promise.all([
    prisma.employee.findMany({
      where: { userId, deletedAt: null },
      orderBy: { firstName: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: { userId, deletedAt: null, status: "APPROVED" },
      orderBy: { startDate: "desc" },
      include: { employee: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const rows: LeaveOverviewRow[] = employees.map((employee) => {
    const cycleStart = annualCycleStart(employee.startDate, now);
    const entitled = annualLeaveEntitlement(employee.workingDaysPerWeek);
    const accrued = annualLeaveAccrued(employee.workingDaysPerWeek, cycleStart, now);
    const taken = requests
      .filter((r) => r.employeeId === employee.id && r.leaveType === "ANNUAL" && r.startDate >= cycleStart)
      .reduce((sum, r) => sum + Number(r.days), 0);
    return {
      employee,
      entitled: round2(entitled),
      accrued: round2(accrued),
      taken: round2(taken),
      balance: Math.max(0, round2(accrued - taken)),
    };
  });

  return { rows, recent: requests.slice(0, 12) };
}

/** Record approved leave: a LeaveRequest plus an immutable ledger entry. */
export async function logLeave(
  userId: string,
  input: LogLeaveInput,
  ctx: Ctx = {},
): Promise<string> {
  const employee = await getEmployee(userId, input.employeeId);
  const days = Number(input.days);
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const reason = input.reason?.trim() || null;

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.leaveRequest.create({
      data: {
        userId,
        employeeId: employee.id,
        leaveType: input.leaveType,
        status: "APPROVED",
        startDate: start,
        endDate: end,
        days,
        reason,
        approvedAt: new Date(),
      },
    });

    await tx.leaveLedgerEntry.create({
      data: {
        employeeId: employee.id,
        leaveType: input.leaveType,
        type: "TAKEN",
        days: -days, // negative: leave consumed
        effectiveDate: start,
        note: reason,
        leaveRequestId: created.id,
      },
    });

    await recordAudit({
      tx,
      action: "CREATE",
      entityType: "LeaveRequest",
      entityId: created.id,
      actorId: userId,
      description: `Logged ${days} day(s) ${leaveTypeLabel(input.leaveType)} for ${employee.firstName} ${employee.lastName}`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return created;
  });

  return request.id;
}
