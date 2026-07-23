import { describe, it, expect } from "vitest";
import { calculateUif } from "@/domain/payroll/uif";

describe("UIF", () => {
  it("deducts 1% from employee and matches 1% employer below the ceiling", () => {
    const u = calculateUif(6000);
    expect(u.employee).toBe(60);
    expect(u.employer).toBe(60);
    expect(u.total).toBe(120);
    expect(u.ceilingApplied).toBe(false);
  });

  it("caps contributions at the monthly ceiling", () => {
    const u = calculateUif(30000);
    expect(u.employee).toBe(177.12); // 17 712 × 1%
    expect(u.employer).toBe(177.12);
    expect(u.ceilingApplied).toBe(true);
  });

  it("returns zero for zero / negative remuneration", () => {
    expect(calculateUif(0).employee).toBe(0);
    expect(calculateUif(-100).employee).toBe(0);
  });
});
