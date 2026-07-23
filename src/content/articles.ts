/**
 * Editorial content: South African domestic-worker compliance guides.
 *
 * Articles are authored as structured blocks (not raw HTML/MDX) so they render
 * consistently, stay type-safe, and can be reused by future AI features. Figures
 * mirror the domain constants (National Minimum Wage, UIF, BCEA leave) so the
 * guides never contradict the calculations the app performs.
 */

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; tone: "info" | "warning" | "success"; title?: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  readMinutes: number;
  /** ISO date (YYYY-MM-DD). */
  updated: string;
  body: ArticleBlock[];
}

export const ARTICLE_CATEGORIES = [
  "Getting started",
  "Contracts",
  "Payroll",
  "UIF",
  "Wages",
  "Leave",
] as const;

export const ARTICLES: Article[] = [
  {
    slug: "domestic-worker-compliance-checklist",
    title: "The domestic worker compliance checklist for South African homeowners",
    description:
      "The seven things every South African employer of a domestic worker, gardener or nanny must have in place — and how to sort each one out.",
    category: "Getting started",
    readMinutes: 6,
    updated: "2026-02-01",
    body: [
      {
        type: "p",
        text: "If you pay someone to clean, cook, garden or care for your family in your home, you are an employer in the eyes of South African law. That comes with real obligations under the Basic Conditions of Employment Act (BCEA), the National Minimum Wage Act and the Unemployment Insurance Act. The good news: the requirements are clear, and once they're in place they take minutes a month to maintain.",
      },
      { type: "h2", text: "The seven essentials" },
      {
        type: "ol",
        items: [
          "A written employment contract (particulars of employment) signed by both of you.",
          "A wage at or above the National Minimum Wage for domestic workers.",
          "A written payslip every time you pay your worker.",
          "Registration with the UIF, and a monthly UIF contribution.",
          "Proper leave records — annual, sick and family responsibility leave.",
          "Salary and hours records kept for at least three years.",
          "Fair procedures for warnings, discipline and any termination.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Why it matters",
        text: "The most common way homeowners land at the CCMA or Department of Employment and Labour is a dispute over unpaid UIF, missing payslips, or an unfair dismissal with no paper trail. Getting the basics right is your best protection.",
      },
      { type: "h2", text: "1. Written contract" },
      {
        type: "p",
        text: "Section 29 of the BCEA requires you to give your worker written particulars of employment — who the parties are, the job, hours, pay, leave and notice. It doesn't have to be complicated, but it must be in writing and signed. A good contract protects both of you by making the terms explicit.",
      },
      { type: "h2", text: "2. Minimum wage" },
      {
        type: "p",
        text: "Domestic workers have their own National Minimum Wage. From 1 March 2025 it is R28.79 per ordinary hour. You may pay more, but never less — and the rate is reviewed each year, so check it annually.",
      },
      { type: "h2", text: "3. Payslips" },
      {
        type: "p",
        text: "Section 33 of the BCEA requires a written payslip on each payday showing gross pay, deductions (like UIF) and net pay. It's also your proof that you paid lawfully.",
      },
      { type: "h2", text: "4. UIF" },
      {
        type: "p",
        text: "You must register with the Unemployment Insurance Fund and contribute 2% of your worker's pay each month (1% deducted from them, 1% added by you). This entitles your worker to claim if they lose their job, go on maternity leave, or fall ill.",
      },
      { type: "h2", text: "5–7. Records and fair process" },
      {
        type: "p",
        text: "Keep leave and salary records for at least three years, and follow a fair process before any warning or dismissal. If you ever face a dispute, contemporaneous records are what win it.",
      },
      {
        type: "callout",
        tone: "success",
        title: "Do it in minutes",
        text: "LabourMate generates a BCEA-compliant contract, issues payslips with UIF calculated automatically, tracks leave, and reminds you to pay UIF each month — so all seven essentials stay handled.",
      },
    ],
  },
  {
    slug: "register-uif-domestic-employer",
    title: "How to register for UIF as a domestic employer",
    description:
      "A plain-language, step-by-step guide to registering with the UIF and paying your monthly contribution for a domestic worker in South Africa.",
    category: "UIF",
    readMinutes: 5,
    updated: "2026-02-01",
    body: [
      {
        type: "p",
        text: "The Unemployment Insurance Fund (UIF) is a safety net: if your worker loses their job, goes on maternity leave, or can't work due to illness, they can claim benefits — but only if you've registered and been paying. Every domestic employer is legally required to register.",
      },
      { type: "h2", text: "What you'll need" },
      {
        type: "ul",
        items: [
          "Your South African ID number.",
          "Your worker's ID or passport number.",
          "Your worker's start date and monthly wage.",
          "Your banking details for the monthly contribution.",
        ],
      },
      { type: "h2", text: "Step by step" },
      {
        type: "ol",
        items: [
          "Register as a domestic employer with the UIF. The easiest route is online via uFiling (ufiling.labour.gov.za). You can also register at your nearest Department of Employment and Labour office using form UI-8D.",
          "Register your worker (an employee declaration, form UI-19). This links them to your UIF account.",
          "Each month, declare your worker's wage and pay the 2% contribution (1% from your worker, 1% from you). uFiling lets you pay by debit order.",
          "Whenever your worker's pay changes or they leave, update the declaration so their records stay accurate.",
        ],
      },
      { type: "h2", text: "How much do I pay?" },
      {
        type: "p",
        text: "The contribution is 1% of your worker's remuneration deducted from their wage, plus a matching 1% you add — 2% in total. The calculation is capped at a monthly earnings ceiling of R17 712, so the maximum you'd ever remit is about R354.24 per month per worker.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Official links",
        text: "Register and pay at ufiling.labour.gov.za. For help, contact the Department of Employment and Labour on 0800 030 007 or visit a labour centre.",
      },
      {
        type: "callout",
        tone: "warning",
        text: "Not paying UIF is one of the most common — and most easily proven — compliance failures. Arrears attract a 10% penalty plus interest and can be recovered by the Department.",
      },
    ],
  },
  {
    slug: "domestic-worker-minimum-wage-2025",
    title: "Domestic worker minimum wage, hours and overtime (2025/2026)",
    description:
      "The current National Minimum Wage for domestic workers, plus the rules on ordinary hours, overtime, Sundays and public holidays.",
    category: "Wages",
    readMinutes: 5,
    updated: "2026-02-01",
    body: [
      {
        type: "p",
        text: "Domestic workers are covered by the National Minimum Wage Act, with a rate set specifically for the sector. Here's what you must pay and how working time is regulated.",
      },
      { type: "h2", text: "The minimum wage" },
      {
        type: "p",
        text: "From 1 March 2025, the National Minimum Wage for domestic workers is R28.79 per ordinary hour. This is a floor, not a target — you can and often should pay more. The rate is gazetted annually, usually effective 1 March.",
      },
      { type: "h2", text: "Ordinary working hours" },
      {
        type: "table",
        headers: ["Limit", "Value"],
        rows: [
          ["Maximum ordinary hours per week", "45 hours"],
          ["Maximum per day (5-day week)", "9 hours"],
          ["Maximum per day (6-day week)", "8 hours"],
          ["Meal interval", "1 hour after 5 continuous hours"],
        ],
      },
      { type: "h2", text: "Overtime and premium pay" },
      {
        type: "ul",
        items: [
          "Overtime is voluntary and paid at 1.5× the normal wage (or agreed time off in lieu).",
          "Work on a Sunday is paid at 2× the normal wage.",
          "Work on a public holiday is paid at 2× (and workers are entitled to paid public holidays).",
          "Overtime may not exceed the limits set by the BCEA and must be by agreement.",
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Check your rate automatically",
        text: "When you set a wage in LabourMate, we compare it against the current minimum for the worker's hours and warn you if it falls short — before it becomes a dispute.",
      },
    ],
  },
  {
    slug: "domestic-worker-leave-explained",
    title: "Leave for domestic workers: annual, sick, family and maternity",
    description:
      "How much leave your domestic worker is legally entitled to under the BCEA, how it accrues, and how to keep proper records.",
    category: "Leave",
    readMinutes: 6,
    updated: "2026-02-01",
    body: [
      {
        type: "p",
        text: "The BCEA gives every domestic worker statutory leave. Getting the amounts and records right avoids disputes and back-pay claims when the employment ends.",
      },
      { type: "h2", text: "Annual leave" },
      {
        type: "p",
        text: "Workers are entitled to 21 consecutive days of paid annual leave per year — which works out to 15 working days for someone on a five-day week (or one day of leave for every 17 days worked). Leave is taken by agreement and must be paid at the normal rate.",
      },
      { type: "h2", text: "Sick leave" },
      {
        type: "p",
        text: "Over each 36-month cycle, a worker is entitled to the number of days they would normally work in six weeks — 30 days for a five-day week. In the first six months of employment, sick leave accrues at one day for every 26 days worked.",
      },
      { type: "h2", text: "Family responsibility leave" },
      {
        type: "p",
        text: "After four months of employment, a worker who works at least four days a week is entitled to three days of paid family responsibility leave per year — for example when a child is born or sick, or on the death of a close family member.",
      },
      { type: "h2", text: "Maternity leave" },
      {
        type: "p",
        text: "A worker is entitled to at least four consecutive months of maternity leave. This is unpaid under the BCEA, but she can claim maternity benefits from the UIF — another reason to keep your UIF up to date.",
      },
      {
        type: "table",
        headers: ["Leave type", "Entitlement (5-day week)"],
        rows: [
          ["Annual", "15 working days per year"],
          ["Sick", "30 days per 3-year cycle"],
          ["Family responsibility", "3 days per year"],
          ["Maternity", "4 months (UIF benefits claimable)"],
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Keep the records",
        text: "You must keep leave records for at least three years. LabourMate tracks each worker's balances automatically and logs every day taken.",
      },
    ],
  },
  {
    slug: "domestic-worker-employment-contract",
    title: "How to write a legal domestic worker employment contract",
    description:
      "What South African law requires in a domestic worker contract, the clauses to include, and how to sign it properly.",
    category: "Contracts",
    readMinutes: 5,
    updated: "2026-02-01",
    body: [
      {
        type: "p",
        text: "A written contract isn't just good practice — section 29 of the BCEA requires you to give your worker written particulars of employment. A clear contract sets expectations and protects both parties if there's ever a disagreement.",
      },
      { type: "h2", text: "What the contract must cover" },
      {
        type: "ul",
        items: [
          "The full names and addresses of the employer and worker.",
          "The job title and a description of duties.",
          "The place of work and start date.",
          "Ordinary working hours and days.",
          "Wage, how it's calculated, and how often it's paid.",
          "Deductions (such as UIF).",
          "Leave entitlements.",
          "Notice periods for termination.",
        ],
      },
      { type: "h2", text: "Notice periods" },
      {
        type: "table",
        headers: ["Length of service", "Notice required"],
        rows: [
          ["6 months or less", "1 week"],
          ["More than 6 months, under 1 year", "2 weeks"],
          ["1 year or more", "4 weeks"],
        ],
      },
      { type: "h2", text: "Signing it" },
      {
        type: "p",
        text: "Both parties should sign and each keep a copy. A digital signature is fine — what matters is that the worker has genuinely agreed to the terms and received their copy.",
      },
      {
        type: "callout",
        tone: "success",
        title: "Generate it in one click",
        text: "LabourMate builds a BCEA-compliant contract from your worker's details — with the correct leave, notice and UIF clauses — ready to sign digitally and store in your vault.",
      },
    ],
  },
  {
    slug: "domestic-worker-payslips-bcea",
    title: "Payslips for domestic workers: what the BCEA requires",
    description:
      "Why you must issue a payslip every payday, exactly what it has to show, and how UIF and PAYE fit in.",
    category: "Payroll",
    readMinutes: 4,
    updated: "2026-02-01",
    body: [
      {
        type: "p",
        text: "Section 33 of the BCEA requires you to give your worker a written payslip on each payday. Beyond the legal duty, a payslip is your proof that you paid the right amount lawfully — invaluable if a dispute ever arises.",
      },
      { type: "h2", text: "What a payslip must show" },
      {
        type: "ul",
        items: [
          "The employer's and worker's details.",
          "The pay period and payment date.",
          "Gross pay, including any overtime, allowances or bonuses.",
          "Each deduction (UIF, and PAYE if applicable).",
          "The net amount actually paid.",
        ],
      },
      { type: "h2", text: "UIF and PAYE" },
      {
        type: "p",
        text: "UIF is a 1% deduction from your worker's wage (with a matching 1% you contribute). Most domestic workers earn below the annual tax threshold, so PAYE (income tax) usually doesn't apply — but if your worker earns above the threshold, you must deduct and pay PAYE to SARS.",
      },
      {
        type: "callout",
        tone: "info",
        title: "One click, delivered",
        text: "LabourMate generates a professional payslip with UIF and PAYE calculated automatically, then sends it to your worker on WhatsApp or email and files a copy in your vault.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function relatedArticles(slug: string, limit = 3): Article[] {
  const current = getArticle(slug);
  if (!current) return ARTICLES.slice(0, limit);
  const sameCategory = ARTICLES.filter((a) => a.slug !== slug && a.category === current.category);
  const others = ARTICLES.filter((a) => a.slug !== slug && a.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}
