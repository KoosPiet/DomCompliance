import { LEAVE } from "@/domain/constants";
import { LeaveType } from "@/domain/leave/types";

const DAYS_PER_MONTH = 365.25 / 12;

/** Whole (and part) months of service between two dates. */
export function monthsOfService(startDate: Date, asOf: Date): number {
  const ms = asOf.getTime() - startDate.getTime();
  if (ms <= 0) return 0;
  return ms / (DAYS_PER_MONTH * 24 * 60 * 60 * 1000);
}

/**
 * Annual-leave entitlement for a full cycle, scaled to the number of days
 * the employee works per week (BCEA: 21 consecutive days ≈ 15 working days
 * for a 5-day week).
 */
export function annualLeaveEntitlement(workingDaysPerWeek: number): number {
  const perFiveDayWeek = LEAVE.ANNUAL_DAYS_5_DAY_WEEK;
  const scaled = (perFiveDayWeek / 5) * workingDaysPerWeek;
  return Math.round(scaled * 100) / 100;
}

/**
 * Annual leave accrued so far in the current cycle, pro-rated by months of
 * service within the cycle. Capped at the full entitlement.
 */
export function annualLeaveAccrued(
  workingDaysPerWeek: number,
  cycleStart: Date,
  asOf: Date,
): number {
  const entitlement = annualLeaveEntitlement(workingDaysPerWeek);
  const months = Math.min(12, Math.max(0, monthsOfService(cycleStart, asOf)));
  const accrued = (entitlement / 12) * months;
  return Math.min(entitlement, Math.round(accrued * 100) / 100);
}

/**
 * Sick-leave entitlement. During the first 6 months, 1 day accrues per 26
 * days worked. After 6 months, the full 6-weeks-per-36-month-cycle applies
 * (30 days for a 5-day week).
 */
export function sickLeaveEntitlement(
  workingDaysPerWeek: number,
  startDate: Date,
  asOf: Date,
): number {
  const months = monthsOfService(startDate, asOf);
  const fullCycle = LEAVE.SICK_WEEKS_PER_CYCLE * workingDaysPerWeek; // e.g. 6 × 5 = 30

  if (months >= 6) return fullCycle;

  // First six months: 1 day per 26 days worked.
  const daysWorked = months * DAYS_PER_MONTH * (workingDaysPerWeek / 7);
  const accrued = Math.floor(daysWorked * LEAVE.SICK_FIRST_6_MONTHS_RATIO);
  return Math.min(fullCycle, accrued);
}

/** Whether the employee qualifies for family responsibility leave. */
export function qualifiesForFamilyResponsibility(
  workingDaysPerWeek: number,
  startDate: Date,
  asOf: Date,
): boolean {
  return (
    workingDaysPerWeek >= LEAVE.FAMILY_RESPONSIBILITY_MIN_DAYS_PER_WEEK &&
    monthsOfService(startDate, asOf) >= LEAVE.FAMILY_RESPONSIBILITY_QUALIFY_MONTHS
  );
}

export interface LeaveEntitlementSummary {
  leaveType: LeaveType;
  entitledDays: number;
  accruedDays: number;
}

/**
 * Produce the current entitlement/accrual snapshot for all statutory leave
 * types for a given employee configuration.
 */
export function leaveEntitlementSummary(params: {
  workingDaysPerWeek: number;
  startDate: Date;
  cycleStart: Date;
  asOf: Date;
}): LeaveEntitlementSummary[] {
  const { workingDaysPerWeek, startDate, cycleStart, asOf } = params;

  return [
    {
      leaveType: LeaveType.ANNUAL,
      entitledDays: annualLeaveEntitlement(workingDaysPerWeek),
      accruedDays: annualLeaveAccrued(workingDaysPerWeek, cycleStart, asOf),
    },
    {
      leaveType: LeaveType.SICK,
      entitledDays: LEAVE.SICK_WEEKS_PER_CYCLE * workingDaysPerWeek,
      accruedDays: sickLeaveEntitlement(workingDaysPerWeek, startDate, asOf),
    },
    {
      leaveType: LeaveType.FAMILY_RESPONSIBILITY,
      entitledDays: qualifiesForFamilyResponsibility(workingDaysPerWeek, startDate, asOf)
        ? LEAVE.FAMILY_RESPONSIBILITY_DAYS
        : 0,
      accruedDays: qualifiesForFamilyResponsibility(workingDaysPerWeek, startDate, asOf)
        ? LEAVE.FAMILY_RESPONSIBILITY_DAYS
        : 0,
    },
  ];
}
