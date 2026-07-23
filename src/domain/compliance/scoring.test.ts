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
});
