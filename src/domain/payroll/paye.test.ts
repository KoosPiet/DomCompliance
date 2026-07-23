import { describe, it, expect } from "vitest";
import { calculatePaye } from "@/domain/payroll/paye";

describe("PAYE", () => {
  it("is zero below the annual tax threshold (typical domestic worker)", () => {
    expect(calculatePaye({ monthlyTaxable: 6000 }).monthly).toBe(0);
    expect(calculatePaye({ monthlyTaxable: 7000 }).monthly).toBe(0);
  });

  it("is positive above the threshold", () => {
    const r = calculatePaye({ monthlyTaxable: 30000 });
    expect(r.monthly).toBeGreaterThan(0);
    expect(r.annualTaxAfterRebates).toBeGreaterThan(0);
  });

  it("applies larger rebates for older employees (less tax)", () => {
    const under65 = calculatePaye({ monthlyTaxable: 30000, age: 40 }).monthly;
    const over65 = calculatePaye({ monthlyTaxable: 30000, age: 70 }).monthly;
    expect(over65).toBeLessThan(under65);
  });
});
