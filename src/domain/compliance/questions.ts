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
  | "hasSignedDocuments";

export interface ComplianceQuestion {
  id: ComplianceQuestionId;
  /** The question as shown to the user. */
  prompt: string;
  /** Short helper text explaining why it matters. */
  helper: string;
  /** Weight toward the score (0 for the gating question). */
  weight: number;
  /** Whether this is the gating "do you employ" question. */
  gating?: boolean;
  /** Risk message surfaced when the answer is "no". */
  riskIfNo: string;
  /** The relevant piece of legislation, for education. */
  legislation: string;
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
    riskIfNo:
      "Employing without a written contract is a direct contravention of the BCEA and Sectoral Determination 7.",
    legislation: "BCEA s29 · Sectoral Determination 7",
  },
  {
    id: "registeredUif",
    prompt: "Are you registered for UIF as an employer?",
    helper: "Every domestic employer must register with the UIF within 14 days of hiring.",
    weight: 20,
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
];

/** Questions that contribute to the score (everything except the gate). */
export const SCORED_QUESTIONS = COMPLIANCE_QUESTIONS.filter((q) => !q.gating);

/** Total available weight — should equal 100. */
export const TOTAL_WEIGHT = SCORED_QUESTIONS.reduce((sum, q) => sum + q.weight, 0);
