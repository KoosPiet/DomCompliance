import { describe, it, expect } from "vitest";
import {
  annualLeaveEntitlement,
  annualLeaveAccrued,
  sickLeaveEntitlement,
  qualifiesForFamilyResponsibility,
  leaveEntitlementSummary,
} from "@/domain/leave/accrual";

describe("leave accrual", () => {
  it("scales annual entitlement to days worked per week", () => {
    expect(annualLeaveEntitlement(5)).toBe(15);
    expect(annualLeaveEntitlement(6)).toBe(18);
    expect(annualLeaveEntitlement(3)).toBe(9);
  });

  it("accrues annual leave pro-rata and caps at the entitlement", () => {
    const start = new Date("2025-01-01");
    const halfYear = annualLeaveAccrued(5, start, new Date("2025-07-01"));
    expect(halfYear).toBeGreaterThan(6);
    expect(halfYear).toBeLessThan(9);

    const overCycle = annualLeaveAccrued(5, start, new Date("2026-06-01"));
    expect(overCycle).toBe(15); // capped at full entitlement
  });

  it("grants the full sick-leave cycle after six months", () => {
    const start = new Date("2024-01-01");
    expect(sickLeaveEntitlement(5, start, new Date("2025-01-01"))).toBe(30);
    expect(sickLeaveEntitlement(6, start, new Date("2025-01-01"))).toBe(36);
  });

  it("qualifies for family responsibility leave only after 4 months and >= 4 days/week", () => {
    const start = new Date("2025-01-01");
    expect(qualifiesForFamilyResponsibility(5, start, new Date("2025-06-01"))).toBe(true);
    expect(qualifiesForFamilyResponsibility(3, start, new Date("2025-06-01"))).toBe(false);
    expect(qualifiesForFamilyResponsibility(5, start, new Date("2025-02-01"))).toBe(false);
  });

  it("summarises the three statutory leave types", () => {
    const summary = leaveEntitlementSummary({
      workingDaysPerWeek: 5,
      startDate: new Date("2024-01-01"),
      cycleStart: new Date("2025-01-01"),
      asOf: new Date("2025-07-01"),
    });
    expect(summary.map((s) => s.leaveType)).toEqual(["ANNUAL", "SICK", "FAMILY_RESPONSIBILITY"]);
  });
});
