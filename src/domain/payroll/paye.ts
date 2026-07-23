import {
  MONTHS_PER_YEAR,
  TAX_BRACKETS_2025_2026,
  TAX_REBATES,
  type TaxBracket,
} from "@/domain/constants";
import { roundZar } from "@/domain/money";

export interface PayeInput {
  /** Gross monthly taxable remuneration. */
  monthlyTaxable: number;
  /** Employee age — determines applicable rebates. Defaults to under 65. */
  age?: number;
}

export interface PayeResult {
  /** Monthly PAYE payable. */
  monthly: number;
  /** Annualised tax before rebates. */
  annualTaxBeforeRebates: number;
  /** Rebates applied for the employee's age. */
  rebates: number;
  /** Annual tax after rebates (never below zero). */
  annualTaxAfterRebates: number;
}

function annualRebateForAge(age: number): number {
  let rebate = TAX_REBATES.PRIMARY;
  if (age >= 65) rebate += TAX_REBATES.SECONDARY;
  if (age >= 75) rebate += TAX_REBATES.TERTIARY;
  return rebate;
}

function findBracket(annualIncome: number, brackets: TaxBracket[]): TaxBracket {
  return (
    brackets.find(
      (bracket) =>
        annualIncome >= bracket.from &&
        (bracket.to === null || annualIncome <= bracket.to),
    ) ?? brackets[brackets.length - 1]
  );
}

/**
 * Calculate monthly PAYE using the SARS annualisation method: the monthly
 * remuneration is annualised, taxed per the brackets, reduced by age-based
 * rebates, then divided back to a monthly figure. Most domestic workers earn
 * below the tax threshold and will return 0.
 */
export function calculatePaye({ monthlyTaxable, age = 30 }: PayeInput): PayeResult {
  const annualIncome = Math.max(0, monthlyTaxable) * MONTHS_PER_YEAR;
  const bracket = findBracket(annualIncome, TAX_BRACKETS_2025_2026);

  const annualTaxBeforeRebates =
    bracket.baseTax + (annualIncome - bracket.from) * bracket.rate;

  const rebates = annualRebateForAge(age);
  const annualTaxAfterRebates = Math.max(0, annualTaxBeforeRebates - rebates);

  return {
    monthly: roundZar(annualTaxAfterRebates / MONTHS_PER_YEAR),
    annualTaxBeforeRebates: roundZar(annualTaxBeforeRebates),
    rebates,
    annualTaxAfterRebates: roundZar(annualTaxAfterRebates),
  };
}
