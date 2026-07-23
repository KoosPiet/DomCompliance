import { UIF } from "@/domain/constants";
import { roundZar } from "@/domain/money";

export interface UifContribution {
  /** Remuneration the contribution was calculated on (after ceiling). */
  contributoryEarnings: number;
  /** Amount deducted from the employee. */
  employee: number;
  /** Amount contributed by the employer. */
  employer: number;
  /** Total remitted to the UIF (employee + employer). */
  total: number;
  /** True when earnings were capped at the monthly ceiling. */
  ceilingApplied: boolean;
}

/**
 * Calculate the monthly UIF contribution for a given gross remuneration.
 * Both employee and employer contribute 1%, calculated on the lesser of
 * actual remuneration and the statutory monthly ceiling.
 */
export function calculateUif(monthlyRemuneration: number): UifContribution {
  const earnings = Math.max(0, monthlyRemuneration);
  const contributoryEarnings = Math.min(earnings, UIF.MONTHLY_CEILING);

  const employee = roundZar(contributoryEarnings * UIF.EMPLOYEE_RATE);
  const employer = roundZar(contributoryEarnings * UIF.EMPLOYER_RATE);

  return {
    contributoryEarnings,
    employee,
    employer,
    total: roundZar(employee + employer),
    ceilingApplied: earnings > UIF.MONTHLY_CEILING,
  };
}
