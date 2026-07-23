import { describe, it, expect } from "vitest";
import { scoreViral } from "@/domain/compliance/viral";

describe("viral 3-question checker", () => {
  it("scores each question as a third", () => {
    expect(scoreViral({ hasContract: false, issuesPayslips: false, registeredUif: false }).score).toBe(0);
    expect(scoreViral({ hasContract: true, issuesPayslips: false, registeredUif: false }).score).toBe(33);
    expect(scoreViral({ hasContract: true, issuesPayslips: true, registeredUif: false }).score).toBe(67);
    expect(scoreViral({ hasContract: true, issuesPayslips: true, registeredUif: true }).score).toBe(100);
  });

  it("assigns the correct rating band", () => {
    expect(scoreViral({ hasContract: false, issuesPayslips: false, registeredUif: false }).rating).toBe("RED");
    expect(scoreViral({ hasContract: true, issuesPayslips: true, registeredUif: false }).rating).toBe("ORANGE");
    expect(scoreViral({ hasContract: true, issuesPayslips: true, registeredUif: true }).rating).toBe("GREEN");
  });

  it("counts yes answers", () => {
    const r = scoreViral({ hasContract: true, issuesPayslips: false, registeredUif: true });
    expect(r.yesCount).toBe(2);
    expect(r.total).toBe(3);
  });
});
