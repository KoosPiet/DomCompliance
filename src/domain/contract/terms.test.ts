import { describe, it, expect } from "vitest";
import { buildContractTerms, type ContractTermsInput } from "@/domain/contract/terms";

const base: ContractTermsInput = {
  employer: { name: "Thandi Mokoena" },
  employee: { fullName: "Grace Ndlovu", occupationLabel: "Domestic Worker" },
  effectiveDate: new Date("2025-01-01"),
  salary: 8000,
  payFrequency: "MONTHLY",
  workingDaysPerWeek: 5,
  ordinaryHoursDay: 9,
};

describe("contract terms", () => {
  it("derives leave entitlements from the work pattern", () => {
    expect(buildContractTerms(base).annualLeaveDays).toBe(15);
    expect(buildContractTerms({ ...base, workingDaysPerWeek: 6 }).annualLeaveDays).toBe(18);
    expect(buildContractTerms(base).sickLeaveDays).toBe(30);
    expect(buildContractTerms(base).ordinaryHoursWeek).toBe(45);
  });

  it("includes UIF and POPIA clauses by default", () => {
    const headings = buildContractTerms(base).clauses.map((c) => c.heading.toLowerCase());
    expect(headings.some((h) => h.includes("unemployment") || h.includes("uif"))).toBe(true);
    expect(headings.some((h) => h.includes("personal information") || h.includes("popia"))).toBe(true);
    expect(headings.some((h) => h.includes("remuneration"))).toBe(true);
    expect(headings.some((h) => h.includes("termination"))).toBe(true);
  });

  it("omits UIF clause when disabled", () => {
    const headings = buildContractTerms({ ...base, includeUif: false }).clauses.map((c) =>
      c.heading.toLowerCase(),
    );
    expect(headings.some((h) => h.includes("unemployment"))).toBe(false);
  });

  it("flags remuneration below the national minimum wage", () => {
    expect(buildContractTerms({ ...base, salary: 1000 }).belowMinimumWage).toBe(true);
    expect(buildContractTerms(base).belowMinimumWage).toBe(false);
  });
});
