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
    expect(annualLeaveEntitlement(1)).toBe(3);
    expect(annualLeaveEntitlement(2)).toBe(6);
    expect(annualLeaveEntitlement(3)).toBe(9);
    expect(annualLeaveEntitlement(5)).toBe(15);
    expect(annualLeaveEntitlement(6)).toBe(18);
  });

  it("scales sick leave to a part-time schedule", () => {
    const start = new Date("2024-01-01");
    const after6m = new Date("2025-01-01");
    // Sick entitlement = days/week × 6 weeks per 36-month cycle.
    expect(sickLeaveEntitlement(1, start, after6m)).toBe(6);
    expect(sickLeaveEntitlement(2, start, after6m)).toBe(12);
    expect(sickLeaveEntitlement(3, start, after6m)).toBe(18);
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
