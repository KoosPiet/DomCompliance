import {
  COMPLIANCE_QUESTIONS,
  SCORED_QUESTIONS,
  TOTAL_WEIGHT,
  isQuestionApplicable,
  type ComplianceQuestionId,
} from "@/domain/compliance/questions";

export type ComplianceRating = "RED" | "ORANGE" | "GREEN";

export type ComplianceAnswers = Partial<Record<ComplianceQuestionId, boolean>>;

export interface ComplianceRiskItem {
  questionId: ComplianceQuestionId;
  prompt: string;
  message: string;
  legislation: string;
  /** Present when this gap is a statutory contravention or criminal offence. */
  severity?: "critical" | "criminal";
}

export interface ComplianceResult {
  /** 0–100 percentage score. */
  score: number;
  rating: ComplianceRating;
  /** True when the gating question (employsWorker) was answered "no". */
  notApplicable: boolean;
  /** The specific compliance gaps found (answered "no"). */
  risks: ComplianceRiskItem[];
  /** The subset of `risks` that are statutory contraventions or offences. */
  criticalRisks: ComplianceRiskItem[];
  /** Count of compliant answers out of the scored questions. */
  compliantCount: number;
  totalCount: number;
  /** Headline message shown to the user. */
  headline: string;
}

/** Score thresholds. ≥ 80 is Green, ≥ 50 is Orange, otherwise Red. */
export const RATING_THRESHOLDS = { GREEN: 80, ORANGE: 50 } as const;

export function ratingForScore(score: number): ComplianceRating {
  if (score >= RATING_THRESHOLDS.GREEN) return "GREEN";
  if (score >= RATING_THRESHOLDS.ORANGE) return "ORANGE";
  return "RED";
}

function headlineFor(
  score: number,
  rating: ComplianceRating,
  criticalRisks: ComplianceRiskItem[],
): string {
  // A criminal-liability gap outranks the arithmetic entirely.
  if (criticalRisks.some((r) => r.severity === "criminal")) {
    return "Urgent: one of your answers points to a criminal offence, not just a penalty. Please address it immediately.";
  }
  if (criticalRisks.length > 0) {
    return `You scored ${score}%, but you're breaking a specific legal requirement — that needs fixing before anything else.`;
  }
  if (rating === "GREEN") {
    return "You're in great shape. A few small steps will make you fully compliant.";
  }
  if (rating === "ORANGE") {
    return "You're partially compliant — but there are gaps that could cost you.";
  }
  return `You scored ${score}%. You may be at risk of Labour Department penalties and disputes.`;
}

/**
 * Evaluate a set of answers into a compliance score, rating and the list of
 * concrete risks. Unanswered scored questions are treated as "no" so a
 * partially-completed check still produces a conservative (lower) score.
 */
export function evaluateCompliance(answers: ComplianceAnswers): ComplianceResult {
  const employs = answers.employsWorker ?? false;

  if (!employs) {
    return {
      score: 100,
      rating: "GREEN",
      notApplicable: true,
      risks: [],
      criticalRisks: [],
      compliantCount: 0,
      totalCount: SCORED_QUESTIONS.length,
      headline:
        "You don't currently employ a domestic worker, so these obligations don't apply yet. Save this check for when you do.",
    };
  }

  let earned = 0;
  let available = 0;
  const risks: ComplianceRiskItem[] = [];
  let compliantCount = 0;

  // Only questions that actually apply count toward the score. A conditional
  // question (e.g. the work permit) must not drag down an employer it was
  // never asked of.
  const applicable = SCORED_QUESTIONS.filter((q) => isQuestionApplicable(q, answers));

  for (const question of applicable) {
    available += question.weight;
    const answer = answers[question.id] ?? false;
    if (answer) {
      earned += question.weight;
      compliantCount += 1;
    } else {
      risks.push({
        questionId: question.id,
        prompt: question.prompt,
        message: question.riskIfNo,
        legislation: question.legislation,
        severity: question.severity,
      });
    }
  }

  const denominator = available || TOTAL_WEIGHT;
  const score = Math.round((earned / denominator) * 100);

  // Weights alone let serious breaches hide behind otherwise-good answers — a
  // missing contract still scored 80% and read as "green". A contravention now
  // caps the rating regardless of the arithmetic, and criminal exposure forces
  // red. The numeric score stays honest; only the verdict is adjusted.
  // Show the legally serious gaps first — they're what needs fixing today.
  const severityRank = { criminal: 0, critical: 1 } as const;
  risks.sort(
    (a, b) =>
      (a.severity ? severityRank[a.severity] : 2) -
      (b.severity ? severityRank[b.severity] : 2),
  );

  const criticalRisks = risks.filter((r) => r.severity);
  let rating = ratingForScore(score);
  if (criticalRisks.some((r) => r.severity === "criminal")) {
    rating = "RED";
  } else if (criticalRisks.length > 0 && rating === "GREEN") {
    rating = "ORANGE";
  }

  return {
    score,
    rating,
    notApplicable: false,
    risks,
    criticalRisks,
    compliantCount,
    totalCount: applicable.length,
    headline: headlineFor(score, rating, criticalRisks),
  };
}

/** Lookup helper used by UI + API to resolve a question by id. */
export function questionById(id: ComplianceQuestionId) {
  return COMPLIANCE_QUESTIONS.find((q) => q.id === id);
}
