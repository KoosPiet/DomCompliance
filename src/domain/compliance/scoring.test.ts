import { describe, it, expect } from "vitest";
import { evaluateCompliance, ratingForScore } from "@/domain/compliance/scoring";

describe("compliance scoring", () => {
  it("marks not-applicable when no worker is employed", () => {
    const r = evaluateCompliance({ employsWorker: false });
    expect(r.notApplicable).toBe(true);
    expect(r.rating).toBe("GREEN");
    expect(r.risks).toHaveLength(0);
  });

  it("scores full compliance as 100% green with no risks", () => {
    const r = evaluateCompliance({
      employsWorker: true,
      hasContract: true,
      issuesPayslips: true,
      registeredUif: true,
      submitsUif: true,
      keepsLeaveRecords: true,
      keepsSalaryRecords: true,
      hasSignedDocuments: true,
    });
    expect(r.score).toBe(100);
    expect(r.rating).toBe("GREEN");
    expect(r.risks).toHaveLength(0);
  });

  it("flags gaps for a partial answer set", () => {
    const r = evaluateCompliance({ employsWorker: true, hasContract: true, registeredUif: true });
    expect(r.score).toBeLessThan(100);
    expect(r.risks.length).toBeGreaterThan(0);
    expect(r.notApplicable).toBe(false);
  });

  it("maps scores to rating bands", () => {
    expect(ratingForScore(80)).toBe("GREEN");
    expect(ratingForScore(65)).toBe("ORANGE");
    expect(ratingForScore(49)).toBe("RED");
  });

  const fullyCompliant = {
    employsWorker: true,
    hasContract: true,
    issuesPayslips: true,
    registeredUif: true,
    submitsUif: true,
    keepsLeaveRecords: true,
    keepsSalaryRecords: true,
    hasSignedDocuments: true,
  };

  it("does not penalise an employer whose worker is not a foreign national", () => {
    const r = evaluateCompliance({ ...fullyCompliant, isForeignNational: false });
    expect(r.score).toBe(100);
    // The work-permit question must not appear as a risk when it never applied.
    expect(r.risks.some((x) => x.questionId === "hasValidWorkPermit")).toBe(false);
  });

  it("still scores 100% for a foreign national with valid work authorisation", () => {
    const r = evaluateCompliance({
      ...fullyCompliant,
      isForeignNational: true,
      hasValidWorkPermit: true,
    });
    expect(r.score).toBe(100);
    expect(r.rating).toBe("GREEN");
  });

  it("flags employing a foreign national without a valid permit", () => {
    const r = evaluateCompliance({
      ...fullyCompliant,
      isForeignNational: true,
      hasValidWorkPermit: false,
    });
    const risk = r.risks.find((x) => x.questionId === "hasValidWorkPermit");
    expect(risk).toBeDefined();
    expect(risk?.legislation).toMatch(/Immigration Act/);
    // Otherwise-perfect compliance must drop below the green band.
    expect(r.score).toBeLessThan(80);
  });

  it("treats employing a foreign national as lawful in itself", () => {
    const withPermit = evaluateCompliance({
      ...fullyCompliant,
      isForeignNational: true,
      hasValidWorkPermit: true,
    });
    const local = evaluateCompliance({ ...fullyCompliant, isForeignNational: false });
    expect(withPermit.score).toBe(local.score);
  });
});
