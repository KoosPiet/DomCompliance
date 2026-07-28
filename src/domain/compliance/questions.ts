/**
 * The FREE Compliance Check questionnaire.
 *
 * One gating question determines whether the employer has statutory
 * obligations at all; the remaining seven are weighted compliance measures
 * that produce the 0–100 score. Weights sum to 100 so the score reads as a
 * percentage. The most legally significant items (a written contract and UIF
 * registration) carry the highest weight.
 */

export type ComplianceQuestionId =
  | "employsWorker"
  | "hasContract"
  | "issuesPayslips"
  | "registeredUif"
  | "submitsUif"
  | "keepsLeaveRecords"
  | "keepsSalaryRecords"
  | "hasSignedDocuments"
  | "isForeignNational"
  | "hasValidWorkPermit";

export interface ComplianceQuestion {
  id: ComplianceQuestionId;
  /** The question as shown to the user. */
  prompt: string;
  /** Short helper text explaining why it matters. */
  helper: string;
  /** Weight toward the score (0 for routing questions that aren't scored). */
  weight: number;
  /** Whether this is the gating "do you employ" question. */
  gating?: boolean;
  /**
   * Only ask this question when another answer matches. Used for the foreign
   * national branch: the work-permit question is meaningless (and unfairly
   * scored) for a South African worker.
   */
  dependsOn?: { id: ComplianceQuestionId; value: boolean };
  /**
   * How badly a "no" reflects on the employer, beyond the numeric weight.
   *
   *   "critical" — a direct statutory contravention. The result can never show
   *                green, however good the rest of the answers are.
   *   "criminal" — exposes the employer to criminal liability, not just a
   *                penalty. Forces a red result outright.
   *
   * Weights alone were too forgiving: missing a written contract scored 80%
   * and read as "green", which is the wrong message for an outright breach.
   */
  severity?: "critical" | "criminal";
  /** Risk message surfaced when the answer is "no". */
  riskIfNo: string;
  /** The relevant piece of legislation, for education. */
  legislation: string;
}

/** Whether a question applies, given the answers so far. */
export function isQuestionApplicable(
  question: ComplianceQuestion,
  answers: Partial<Record<ComplianceQuestionId, boolean>>,
): boolean {
  if (!question.dependsOn) return true;
  return answers[question.dependsOn.id] === question.dependsOn.value;
}

export const COMPLIANCE_QUESTIONS: ComplianceQuestion[] = [
  {
    id: "employsWorker",
    prompt: "Do you employ a domestic worker, nanny, gardener, caregiver or driver?",
    helper: "Anyone who works in or around your home in return for pay.",
    weight: 0,
    gating: true,
    riskIfNo: "",
    legislation: "Basic Conditions of Employment Act, 1997",
  },
  {
    id: "hasContract",
    prompt: "Does the worker have a written employment contract?",
    helper: "A signed contract is legally required from day one of employment.",
    weight: 20,
    severity: "critical",
    riskIfNo:
      "Employing without a written contract is a direct contravention of the BCEA and Sectoral Determination 7.",
    legislation: "BCEA s29 · Sectoral Determination 7",
  },
  {
    id: "registeredUif",
    prompt: "Are you registered for UIF as an employer?",
    helper: "Every domestic employer must register with the UIF within 14 days of hiring.",
    weight: 20,
    severity: "critical",
    riskIfNo:
      "Failure to register for UIF can result in penalties, interest and back-payments to the Department of Employment and Labour.",
    legislation: "Unemployment Insurance Contributions Act, 2002",
  },
  {
    id: "issuesPayslips",
    prompt: "Do you issue a written payslip every month?",
    helper: "Workers are entitled to a payslip showing earnings and deductions.",
    weight: 15,
    riskIfNo:
      "Not issuing payslips breaches the BCEA and leaves you without proof of lawful payment in a CCMA dispute.",
    legislation: "BCEA s33",
  },
  {
    id: "submitsUif",
    prompt: "Do you submit and pay UIF every month?",
    helper: "1% from the worker plus 1% from you, paid to the UIF monthly.",
    weight: 15,
    riskIfNo:
      "Non-payment of monthly UIF accrues 10% penalties plus interest and can be recovered by the Department.",
    legislation: "UIC Act s9 · uFiling",
  },
  {
    id: "keepsSalaryRecords",
    prompt: "Do you keep salary and payment records?",
    helper: "Records of what you paid, when, must be kept for at least 3 years.",
    weight: 10,
    riskIfNo:
      "Without salary records the employer bears the onus of proof in any wage dispute — usually fatal to the employer's case.",
    legislation: "BCEA s31",
  },
  {
    id: "keepsLeaveRecords",
    prompt: "Do you keep leave records (annual, sick, family responsibility)?",
    helper: "You must track leave taken and remaining for each worker.",
    weight: 10,
    riskIfNo:
      "Missing leave records make it impossible to prove statutory leave was granted, exposing you to claims on termination.",
    legislation: "BCEA s19 & s31",
  },
  {
    id: "hasSignedDocuments",
    prompt: "Do you keep signed employment documents on file?",
    helper: "Signed contracts, warnings and acknowledgements protect both parties.",
    weight: 10,
    riskIfNo:
      "Unsigned or missing documents weaken your position in any dismissal or CCMA proceeding.",
    legislation: "LRA · BCEA record-keeping",
  },
  {
    id: "isForeignNational",
    prompt: "Is your worker a foreign national?",
    helper:
      "Someone who is not a South African citizen or permanent resident. This routes the next question — it is not scored either way.",
    // Routing only: employing a foreign national is perfectly lawful, so this
    // answer must never move the score by itself.
    weight: 0,
    riskIfNo: "",
    legislation: "Immigration Act, 2002",
  },
  {
    id: "hasValidWorkPermit",
    prompt:
      "Do they hold a valid work visa, permit or asylum document that allows them to work?",
    helper:
      "You must see and keep a copy of it. A valid asylum seeker or refugee permit endorsed for work also counts.",
    weight: 30,
    severity: "criminal",
    dependsOn: { id: "isForeignNational", value: true },
    riskIfNo:
      "Employing a foreign national without valid work authorisation is a criminal offence under the Immigration Act — the employer faces fines or imprisonment, and the worker risks deportation. Note that they still keep full BCEA rights (contract, minimum wage, leave, payslips) regardless of their status.",
    legislation: "Immigration Act 13 of 2002, s38",
  },
];

/** Questions that can contribute to the score (everything except the gate). */
export const SCORED_QUESTIONS = COMPLIANCE_QUESTIONS.filter(
  (q) => !q.gating && q.weight > 0,
);

/**
 * Baseline available weight — the questions everyone is asked. Equals 100, so
 * a South African-worker employer scores out of 100 exactly as before.
 * Conditional questions (e.g. work permit) add to the denominator only when
 * they actually apply, which is handled in `evaluateCompliance`.
 */
export const TOTAL_WEIGHT = SCORED_QUESTIONS.filter((q) => !q.dependsOn).reduce(
  (sum, q) => sum + q.weight,
  0,
);
