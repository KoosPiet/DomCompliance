import {
  COMPLIANCE_QUESTIONS,
  SCORED_QUESTIONS,
  TOTAL_WEIGHT,
  type ComplianceQuestionId,
} from "@/domain/compliance/questions";

export type ComplianceRating = "RED" | "ORANGE" | "GREEN";

export type ComplianceAnswers = Partial<Record<ComplianceQuestionId, boolean>>;

export interface ComplianceRiskItem {
  questionId: ComplianceQuestionId;
  prompt: string;
  message: string;
  legislation: string;
}

export interface ComplianceResult {
  /** 0–100 percentage score. */
  score: number;
  rating: ComplianceRating;
  /** True when the gating question (employsWorker) was answered "no". */
  notApplicable: boolean;
  /** The specific compliance gaps found (answered "no"). */
  risks: ComplianceRiskItem[];
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

function headlineFor(score: number, rating: ComplianceRating): string {
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
      compliantCount: 0,
      totalCount: SCORED_QUESTIONS.length,
      headline:
        "You don't currently employ a domestic worker, so these obligations don't apply yet. Save this check for when you do.",
    };
  }

  let earned = 0;
  const risks: ComplianceRiskItem[] = [];
  let compliantCount = 0;

  for (const question of SCORED_QUESTIONS) {
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
      });
    }
  }

  const score = Math.round((earned / TOTAL_WEIGHT) * 100);
  const rating = ratingForScore(score);

  return {
    score,
    rating,
    notApplicable: false,
    risks,
    compliantCount,
    totalCount: SCORED_QUESTIONS.length,
    headline: headlineFor(score, rating),
  };
}

/** Lookup helper used by UI + API to resolve a question by id. */
export function questionById(id: ComplianceQuestionId) {
  return COMPLIANCE_QUESTIONS.find((q) => q.id === id);
}
