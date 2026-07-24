/**
 * Employment-contract term generation for South African domestic workers.
 *
 * Produces a fully serialisable {@link ContractTerms} object — snapshotted into
 * the database (`EmploymentContract.terms`) so the PDF can be regenerated
 * deterministically and reviewed by future AI features. Clause wording is
 * grounded in the Basic Conditions of Employment Act (BCEA), Sectoral
 * Determination 7 (Domestic Workers) and the National Minimum Wage Act.
 */

import { formatZar } from "@/domain/money";
import { LEAVE, MINIMUM_WAGE, UIF } from "@/domain/constants";

export interface ContractPartyEmployer {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ContractPartyEmployee {
  fullName: string;
  idOrPassport?: string | null;
  address?: string | null;
  occupationLabel: string;
}

export interface ContractTermsInput {
  employer: ContractPartyEmployer;
  employee: ContractPartyEmployee;
  effectiveDate: Date;
  salary: number;
  payFrequency: "MONTHLY" | "FORTNIGHTLY" | "WEEKLY";
  workingDaysPerWeek: number;
  ordinaryHoursDay: number;
  scheduleNote?: string | null;
  includeUif?: boolean;
  includePopia?: boolean;
}

export interface ContractClause {
  number: number;
  heading: string;
  body: string[];
}

export interface ContractTerms {
  employer: ContractPartyEmployer;
  employee: ContractPartyEmployee;
  effectiveDateIso: string;
  salary: number;
  salaryFormatted: string;
  payFrequency: ContractTermsInput["payFrequency"];
  payFrequencyLabel: string;
  workingDaysPerWeek: number;
  ordinaryHoursDay: number;
  ordinaryHoursWeek: number;
  annualLeaveDays: number;
  sickLeaveDays: number;
  familyResponsibilityDays: number;
  noticePeriodDays: number;
  probationMonths: number;
  impliedHourly: number | null;
  belowMinimumWage: boolean;
  includeUif: boolean;
  includePopia: boolean;
  clauses: ContractClause[];
}

const WEEKS_PER_MONTH = 4.333;
const FREQUENCY_LABEL: Record<ContractTermsInput["payFrequency"], string> = {
  MONTHLY: "per month",
  FORTNIGHTLY: "per fortnight",
  WEEKLY: "per week",
};

function annualLeaveForWeek(daysPerWeek: number): number {
  if (daysPerWeek >= 6) return LEAVE.ANNUAL_DAYS_6_DAY_WEEK;
  if (daysPerWeek === 5) return LEAVE.ANNUAL_DAYS_5_DAY_WEEK;
  return Math.round(daysPerWeek * 3); // 3 working days of leave per day worked/week
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildContractTerms(input: ContractTermsInput): ContractTerms {
  const includeUif = input.includeUif ?? true;
  const includePopia = input.includePopia ?? true;

  const ordinaryHoursWeek = Math.round(input.ordinaryHoursDay * input.workingDaysPerWeek * 100) / 100;
  const annualLeaveDays = annualLeaveForWeek(input.workingDaysPerWeek);
  const sickLeaveDays = input.workingDaysPerWeek * LEAVE.SICK_WEEKS_PER_CYCLE;

  const monthlyEquivalent =
    input.payFrequency === "MONTHLY"
      ? input.salary
      : input.payFrequency === "FORTNIGHTLY"
        ? input.salary * 2.166
        : input.salary * WEEKS_PER_MONTH;
  const monthlyHours = ordinaryHoursWeek * WEEKS_PER_MONTH;
  const impliedHourly = monthlyHours > 0 ? Math.round((monthlyEquivalent / monthlyHours) * 100) / 100 : null;
  const belowMinimumWage = impliedHourly !== null && impliedHourly < MINIMUM_WAGE.DOMESTIC_HOURLY;

  const salaryFormatted = formatZar(input.salary);
  const payFrequencyLabel = FREQUENCY_LABEL[input.payFrequency];
  const employerName = input.employer.name;
  const employeeName = input.employee.fullName;

  const clauses: ContractClause[] = [];
  let n = 0;
  const add = (heading: string, body: string[]) => clauses.push({ number: ++n, heading, body });

  add("Parties", [
    `This employment contract is entered into between ${employerName} ("the Employer")${input.employer.address ? ` of ${input.employer.address}` : ""}, and ${employeeName} ("the Employee")${input.employee.idOrPassport ? `, ID / Passport / Work Permit No. ${input.employee.idOrPassport}` : ""}.`,
    "This contract complies with the Basic Conditions of Employment Act 75 of 1997 (BCEA) and Sectoral Determination 7 for Domestic Workers.",
  ]);

  add("Commencement and duration", [
    `Employment commences on ${formatDate(input.effectiveDate)} and continues indefinitely until terminated in accordance with this contract and the BCEA.`,
  ]);

  add("Job title and duties", [
    `The Employee is engaged as a ${input.employee.occupationLabel}.`,
    "The Employee shall perform the duties reasonably associated with this role, and any other lawful and reasonable duties assigned by the Employer.",
  ]);

  add("Place of work", [
    `The Employee's ordinary place of work is the Employer's residence${input.employer.address ? ` at ${input.employer.address}` : ""}, or such other place as agreed between the parties.`,
  ]);

  add("Ordinary hours of work", [
    `The Employee works ${input.workingDaysPerWeek} day(s) per week, ${input.ordinaryHoursDay} ordinary hours per day (${ordinaryHoursWeek} hours per week).`,
    input.scheduleNote ? `Agreed schedule: ${input.scheduleNote}.` : "Working days and times are as agreed between the parties.",
    "Ordinary hours may not exceed 45 hours per week (BCEA s9). The Employee is entitled to a meal interval of one hour after five continuous hours of work.",
  ]);

  add("Overtime", [
    "Overtime is worked only by agreement and is paid at 1.5 times the normal wage, or the Employee may agree to paid time off in lieu. Work on Sundays and public holidays is paid at double the normal wage (BCEA s10, s16, s18).",
  ]);

  add("Remuneration", [
    `The Employee is paid ${salaryFormatted} ${payFrequencyLabel}, payable in arrears by no later than the seventh day after the end of the pay period.`,
    impliedHourly !== null
      ? `This equates to approximately ${formatZar(impliedHourly)} per ordinary hour.`
      : "",
    belowMinimumWage
      ? `IMPORTANT: this appears to be below the current National Minimum Wage for domestic workers (${formatZar(MINIMUM_WAGE.DOMESTIC_HOURLY)} per hour, effective ${MINIMUM_WAGE.effectiveFrom}). The Employer must ensure the wage meets or exceeds the statutory minimum.`
      : `This meets or exceeds the current National Minimum Wage for domestic workers (${formatZar(MINIMUM_WAGE.DOMESTIC_HOURLY)} per hour).`,
  ].filter(Boolean));

  add("Deductions", [
    "No deductions are made from the Employee's wage except those required or permitted by law (for example UIF) or agreed to in writing by the Employee.",
  ]);

  add("Annual leave", [
    `The Employee is entitled to ${annualLeaveDays} working days of paid annual leave per 12-month leave cycle, taken by agreement (BCEA s20).`,
  ]);

  add("Sick leave", [
    `During each 36-month cycle the Employee is entitled to paid sick leave equal to the number of days normally worked in six weeks (${sickLeaveDays} days for this schedule). During the first six months, one day of paid sick leave accrues for every 26 days worked (BCEA s22).`,
  ]);

  add("Family responsibility leave", [
    `After four months of employment, an Employee who works at least four days per week is entitled to ${LEAVE.FAMILY_RESPONSIBILITY_DAYS} days of paid family responsibility leave per annual cycle (BCEA s27).`,
  ]);

  add("Public holidays", [
    "The Employee is entitled to all official public holidays on full pay. Work on a public holiday is by agreement and paid at double the normal daily wage.",
  ]);

  if (includeUif) {
    add("Unemployment Insurance Fund (UIF)", [
      `The Employer registers the Employee with the UIF and contributes monthly. The Employee contributes ${(UIF.EMPLOYEE_RATE * 100).toFixed(0)}% of remuneration and the Employer contributes a matching ${(UIF.EMPLOYER_RATE * 100).toFixed(0)}%, subject to the statutory earnings ceiling.`,
    ]);
  }

  add("Probation", [
    `The first ${3} months of employment constitute a probation period during which either party may terminate on shorter notice, subject to fair procedure.`,
  ]);

  add("Termination and notice", [
    "Either party may terminate this contract on written notice as follows (BCEA s37): one week if employed for six months or less; two weeks if employed for more than six months but less than one year; four weeks if employed for one year or more.",
    "On termination the Employee is paid all outstanding wages and accrued leave. Notice may not be given during any period of leave.",
  ]);

  if (includePopia) {
    add("Confidentiality and personal information (POPIA)", [
      "The Employee shall keep the Employer's household and personal affairs confidential. The Employer processes the Employee's personal information solely for lawful employment purposes in accordance with the Protection of Personal Information Act (POPIA).",
    ]);
  }

  add("General", [
    "This contract, together with any written schedules, is the entire agreement between the parties. Any variation must be agreed in writing and signed by both parties. Where this contract is silent, the BCEA and applicable law apply. This contract is governed by the laws of the Republic of South Africa.",
  ]);

  return {
    employer: input.employer,
    employee: input.employee,
    effectiveDateIso: input.effectiveDate.toISOString(),
    salary: input.salary,
    salaryFormatted,
    payFrequency: input.payFrequency,
    payFrequencyLabel,
    workingDaysPerWeek: input.workingDaysPerWeek,
    ordinaryHoursDay: input.ordinaryHoursDay,
    ordinaryHoursWeek,
    annualLeaveDays,
    sickLeaveDays,
    familyResponsibilityDays: LEAVE.FAMILY_RESPONSIBILITY_DAYS,
    noticePeriodDays: 28,
    probationMonths: 3,
    impliedHourly,
    belowMinimumWage,
    includeUif,
    includePopia,
    clauses,
  };
}
