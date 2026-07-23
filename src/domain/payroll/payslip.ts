import { roundZar, sumZar } from "@/domain/money";
import { calculatePaye } from "@/domain/payroll/paye";
import { calculateUif } from "@/domain/payroll/uif";

export interface PayslipEarnings {
  basicSalary: number;
  overtime?: number;
  allowances?: number;
  bonuses?: number;
  otherEarnings?: number;
}

export interface PayslipDeductionOverrides {
  /** Override calculated UIF (e.g. worker earns below UIF requirement). */
  uifEmployee?: number;
  /** Override calculated PAYE. */
  paye?: number;
  /** Any additional deductions (advances, loans, etc.). */
  otherDeductions?: number;
}

export interface PayslipCalculationInput {
  earnings: PayslipEarnings;
  deductions?: PayslipDeductionOverrides;
  /** Whether UIF applies (most domestic workers are registered). */
  applyUif?: boolean;
  /** Whether PAYE applies (usually false — below threshold). */
  applyPaye?: boolean;
  employeeAge?: number;
}

export interface PayslipCalculation {
  grossEarnings: number;
  uifEmployee: number;
  uifEmployer: number;
  paye: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
}

/**
 * Compute a fully-derived payslip from its inputs. Deductions are calculated
 * automatically (UIF, PAYE) unless explicitly overridden, keeping the payslip
 * reproducible and statutorily correct.
 */
export function calculatePayslip(input: PayslipCalculationInput): PayslipCalculation {
  const {
    earnings,
    deductions = {},
    applyUif = true,
    applyPaye = false,
    employeeAge,
  } = input;

  const grossEarnings = sumZar([
    earnings.basicSalary,
    earnings.overtime ?? 0,
    earnings.allowances ?? 0,
    earnings.bonuses ?? 0,
    earnings.otherEarnings ?? 0,
  ]);

  const uif = applyUif
    ? calculateUif(grossEarnings)
    : { employee: 0, employer: 0 };
  const uifEmployee = deductions.uifEmployee ?? uif.employee;
  const uifEmployer = uif.employer;

  const paye =
    deductions.paye ??
    (applyPaye
      ? calculatePaye({ monthlyTaxable: grossEarnings, age: employeeAge }).monthly
      : 0);

  const otherDeductions = deductions.otherDeductions ?? 0;

  const totalDeductions = sumZar([uifEmployee, paye, otherDeductions]);
  const netPay = roundZar(grossEarnings - totalDeductions);

  return {
    grossEarnings,
    uifEmployee,
    uifEmployer,
    paye,
    otherDeductions,
    totalDeductions,
    netPay,
  };
}
