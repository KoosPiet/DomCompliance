import { describe, it, expect } from "vitest";
import { calculatePayslip } from "@/domain/payroll/payslip";

describe("payslip calculation", () => {
  it("computes gross, UIF and net with default deductions", () => {
    const c = calculatePayslip({ earnings: { basicSalary: 6000, overtime: 500 } });
    expect(c.grossEarnings).toBe(6500);
    expect(c.uifEmployee).toBe(65);
    expect(c.uifEmployer).toBe(65);
    expect(c.totalDeductions).toBe(65);
    expect(c.netPay).toBe(6435);
  });

  it("honours deduction overrides", () => {
    const c = calculatePayslip({
      earnings: { basicSalary: 5000 },
      deductions: { uifEmployee: 0, otherDeductions: 100 },
    });
    expect(c.uifEmployee).toBe(0);
    expect(c.totalDeductions).toBe(100);
    expect(c.netPay).toBe(4900);
  });

  it("omits UIF when not applicable", () => {
    const c = calculatePayslip({ earnings: { basicSalary: 5000 }, applyUif: false });
    expect(c.uifEmployee).toBe(0);
    expect(c.netPay).toBe(5000);
  });

  it("sums all earnings components into gross", () => {
    const c = calculatePayslip({
      earnings: { basicSalary: 4000, overtime: 200, allowances: 300, bonuses: 500, otherEarnings: 100 },
      applyUif: false,
    });
    expect(c.grossEarnings).toBe(5100);
  });
});
