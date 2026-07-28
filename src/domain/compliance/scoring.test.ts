import { describe, it, expect } from "vitest";
import { evaluateCompliance, ratingForScore } from "@/domain/compliance/scoring";
import { COMPLIANCE_QUESTIONS } from "@/domain/compliance/questions";
import { complianceAnswersSchema } from "@/lib/validations/compliance";

describe("compliance answers reach the scorer", () => {
  // Zod strips unknown keys, so a question missing from the API schema is
  // silently discarded and never scored — this once turned an unauthorised
  // worker into a 100% result.
  it("accepts an answer for every question in the check", () => {
    const answers = Object.fromEntries(
      COMPLIANCE_QUESTIONS.map((q) => [q.id, true]),
    );
    const parsed = complianceAnswersSchema.parse(answers);
    for (const question of COMPLIANCE_QUESTIONS) {
      expect(parsed, `"${question.id}" is dropped by the API schema`).toHaveProperty(
        question.id,
      );
    }
  });

  it("scores an unauthorised foreign worker as red end-to-end", () => {
    const parsed = complianceAnswersSchema.parse({
      employsWorker: true,
      hasContract: true,
      issuesPayslips: true,
      registeredUif: true,
      submitsUif: true,
      keepsLeaveRecords: true,
      keepsSalaryRecords: true,
      hasSignedDocuments: true,
      isForeignNational: true,
      hasValidWorkPermit: false,
    });
    const result = evaluateCompliance(parsed);
    expect(result.score).toBe(77);
    expect(result.rating).toBe("RED");
  });
});

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

  it("never shows green when a statutory requirement is broken", () => {
    // Missing a contract used to score 80% and read as GREEN.
    const r = evaluateCompliance({ ...fullyCompliant, hasContract: false });
    expect(r.score).toBe(80);
    expect(r.rating).not.toBe("GREEN");
    expect(r.criticalRisks.map((x) => x.questionId)).toContain("hasContract");
  });

  it("caps the rating for an unregistered UIF employer", () => {
    const r = evaluateCompliance({ ...fullyCompliant, registeredUif: false });
    expect(r.rating).not.toBe("GREEN");
  });

  it("forces red when the gap carries criminal liability", () => {
    const r = evaluateCompliance({
      ...fullyCompliant,
      isForeignNational: true,
      hasValidWorkPermit: false,
    });
    // Otherwise-perfect compliance must not soften a criminal offence.
    expect(r.rating).toBe("RED");
    expect(r.headline).toMatch(/criminal offence/i);
  });

  it("lists the most serious gaps first", () => {
    const r = evaluateCompliance({
      ...fullyCompliant,
      keepsSalaryRecords: false, // ordinary gap
      hasContract: false, // critical
      isForeignNational: true,
      hasValidWorkPermit: false, // criminal
    });
    expect(r.risks[0].questionId).toBe("hasValidWorkPermit");
    expect(r.risks[1].questionId).toBe("hasContract");
    expect(r.risks.at(-1)?.questionId).toBe("keepsSalaryRecords");
  });

  it("keeps a clean sheet green", () => {
    const r = evaluateCompliance({ ...fullyCompliant, isForeignNational: false });
    expect(r.rating).toBe("GREEN");
    expect(r.criticalRisks).toHaveLength(0);
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
