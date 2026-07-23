/**
 * South African labour-law constants used across payroll, leave and
 * compliance calculations.
 *
 * ⚠️  These figures change (usually annually, effective 1 March for the
 * tax year and 1 March for the National Minimum Wage). They are versioned
 * here with an `effectiveFrom` date so historical payslips remain
 * reproducible. Update `CURRENT_TAX_YEAR` when a new gazette is published.
 *
 * Sources:
 *   • Unemployment Insurance Contributions Act (UIF) — 1% employee + 1% employer.
 *   • Basic Conditions of Employment Act (BCEA) — leave entitlements.
 *   • National Minimum Wage Act — domestic worker rate.
 *   • SARS annual tax tables.
 */

/** The tax year these constants apply to (1 March – end February). */
export const CURRENT_TAX_YEAR = "2025/2026" as const;

// ---------------------------------------------------------------------------
// UIF — Unemployment Insurance Fund
// ---------------------------------------------------------------------------

export const UIF = {
  /** Employee contribution rate (deducted from remuneration). */
  EMPLOYEE_RATE: 0.01,
  /** Employer contribution rate (paid by employer, not deducted). */
  EMPLOYER_RATE: 0.01,
  /**
   * Monthly remuneration ceiling for UIF. Contributions are calculated on
   * the lesser of actual remuneration and this ceiling.
   * R17 712 / month (effective 1 June 2021, still current for 2025/2026).
   */
  MONTHLY_CEILING: 17712,
} as const;

/** Maximum monthly UIF contribution per party (ceiling × rate). */
export const UIF_MAX_MONTHLY = UIF.MONTHLY_CEILING * UIF.EMPLOYEE_RATE; // R177.12

// ---------------------------------------------------------------------------
// National Minimum Wage (domestic workers) — effective 1 March 2025
// ---------------------------------------------------------------------------

export const MINIMUM_WAGE = {
  /** Rand per ordinary hour for domestic workers (2025). */
  DOMESTIC_HOURLY: 28.79,
  effectiveFrom: "2025-03-01",
} as const;

// ---------------------------------------------------------------------------
// BCEA — leave entitlements
// ---------------------------------------------------------------------------

export const LEAVE = {
  /**
   * Annual leave: 21 consecutive days = 15 working days for a 5-day week,
   * or equivalently 1 day for every 17 days worked. We store the working-day
   * entitlement scaled by the number of days worked per week.
   */
  ANNUAL_DAYS_5_DAY_WEEK: 15,
  ANNUAL_DAYS_6_DAY_WEEK: 18,
  /** Alternative accrual basis: 1 hour of leave per 17 hours worked. */
  ANNUAL_ACCRUAL_RATIO: 1 / 17,

  /**
   * Sick leave: during every 36-month cycle an employee is entitled to the
   * number of days they would normally work in a 6-week period. For a 5-day
   * week that is 30 days per 3 years.
   */
  SICK_CYCLE_MONTHS: 36,
  SICK_WEEKS_PER_CYCLE: 6,
  /** During the first 6 months: 1 day sick leave per 26 days worked. */
  SICK_FIRST_6_MONTHS_RATIO: 1 / 26,

  /**
   * Family responsibility leave: 3 days per annual leave cycle, available
   * after 4 months of employment to employees working ≥ 4 days/week.
   */
  FAMILY_RESPONSIBILITY_DAYS: 3,
  FAMILY_RESPONSIBILITY_QUALIFY_MONTHS: 4,
  FAMILY_RESPONSIBILITY_MIN_DAYS_PER_WEEK: 4,

  /** Maternity leave: at least 4 consecutive months (unpaid under BCEA). */
  MATERNITY_MONTHS: 4,
} as const;

// ---------------------------------------------------------------------------
// BCEA — working time & notice
// ---------------------------------------------------------------------------

export const WORKING_TIME = {
  MAX_ORDINARY_HOURS_PER_WEEK: 45,
  MAX_ORDINARY_HOURS_PER_DAY_5_DAYS: 9,
  MAX_ORDINARY_HOURS_PER_DAY_6_DAYS: 8,
  OVERTIME_MULTIPLIER: 1.5,
  SUNDAY_MULTIPLIER: 2,
  PUBLIC_HOLIDAY_MULTIPLIER: 2,
} as const;

/** Statutory minimum notice periods (BCEA s37), by length of service. */
export const NOTICE_PERIOD_DAYS = {
  /** ≤ 6 months employed: 1 week. */
  UNDER_6_MONTHS: 7,
  /** > 6 months but < 1 year: 2 weeks. */
  UNDER_1_YEAR: 14,
  /** ≥ 1 year: 4 weeks. */
  OVER_1_YEAR: 28,
} as const;

// ---------------------------------------------------------------------------
// SARS PAYE — 2025/2026 tax tables (annual)
// ---------------------------------------------------------------------------

export interface TaxBracket {
  /** Lower bound of annual taxable income (inclusive). */
  from: number;
  /** Upper bound (inclusive) or null for the top bracket. */
  to: number | null;
  /** Tax on the amount up to `from`. */
  baseTax: number;
  /** Marginal rate applied to income above `from`. */
  rate: number;
}

/** 2025/2026 individual income-tax brackets (annual). */
export const TAX_BRACKETS_2025_2026: TaxBracket[] = [
  { from: 0, to: 237100, baseTax: 0, rate: 0.18 },
  { from: 237100, to: 370500, baseTax: 42678, rate: 0.26 },
  { from: 370500, to: 512800, baseTax: 77362, rate: 0.31 },
  { from: 512800, to: 673000, baseTax: 121475, rate: 0.36 },
  { from: 673000, to: 857900, baseTax: 179147, rate: 0.39 },
  { from: 857900, to: 1817000, baseTax: 251258, rate: 0.41 },
  { from: 1817000, to: null, baseTax: 644489, rate: 0.45 },
];

/** Annual tax rebates (2025/2026). */
export const TAX_REBATES = {
  /** Primary rebate — all taxpayers. */
  PRIMARY: 17235,
  /** Secondary rebate — age 65 and older (additional). */
  SECONDARY: 9444,
  /** Tertiary rebate — age 75 and older (additional). */
  TERTIARY: 3145,
} as const;

/** Annual tax threshold below which no PAYE is payable (under 65). */
export const TAX_THRESHOLD_UNDER_65 = 95750;

export const MONTHS_PER_YEAR = 12;
