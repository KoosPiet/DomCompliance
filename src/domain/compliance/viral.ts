/**
 * Viral 3-question compliance checker — a deliberately short, shareable public
 * tool. Kept to three high-impact questions because long forms get abandoned.
 * Scoring is intentionally simple (each question worth a third).
 */

import { ratingForScore, type ComplianceRating } from "@/domain/compliance/scoring";

export type ViralQuestionId = "hasContract" | "issuesPayslips" | "registeredUif";

export interface ViralQuestion {
  id: ViralQuestionId;
  prompt: string;
  help: string;
}

export const VIRAL_QUESTIONS: ViralQuestion[] = [
  {
    id: "hasContract",
    prompt: "Do you have a written employment contract with your domestic worker?",
    help: "The BCEA requires written particulars of employment for every worker.",
  },
  {
    id: "issuesPayslips",
    prompt: "Do you give your worker a payslip every month?",
    help: "A written payslip each pay period is a legal requirement (BCEA s33).",
  },
  {
    id: "registeredUif",
    prompt: "Are you registered for UIF and paying it every month?",
    help: "Every domestic employer must register and contribute 2% to the UIF.",
  },
];

export const VIRAL_QUESTION_IDS: ViralQuestionId[] = [
  "hasContract",
  "issuesPayslips",
  "registeredUif",
];

export type ViralAnswers = Record<ViralQuestionId, boolean>;

export interface ViralResult {
  score: number;
  rating: ComplianceRating;
  yesCount: number;
  total: number;
  headline: string;
  subline: string;
}

export function scoreViral(answers: ViralAnswers): ViralResult {
  const yesCount = VIRAL_QUESTION_IDS.filter((id) => answers[id]).length;
  const total = VIRAL_QUESTION_IDS.length;
  const score = Math.round((yesCount / total) * 100);
  const rating = ratingForScore(score);

  const subline =
    score >= 80
      ? "You're on top of the basics. A few small steps and you're fully compliant."
      : score >= 50
        ? "You're partly compliant, but there are gaps that could cost you in a CCMA dispute."
        : "Based on your answers you may not be complying with South African domestic worker legislation.";

  return {
    score,
    rating,
    yesCount,
    total,
    headline: `You scored ${score}%`,
    subline,
  };
}
