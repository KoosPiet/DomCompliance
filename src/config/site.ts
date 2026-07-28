/**
 * Central site configuration: brand metadata, navigation and pricing.
 * Single source of truth used by SEO tags, the header/footer and the
 * pricing/subscription flows.
 */

export const siteConfig = {
  name: "LabourMate",
  tagline: "Everything you need to legally employ your domestic worker.",
  description:
    "LabourMate helps South African homeowners stay compliant with labour law — contracts, payslips, UIF, leave and records for your domestic worker, nanny, gardener or caregiver. As easy as online banking.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "en-ZA",
  country: "ZA",
  keywords: [
    "domestic worker compliance",
    "South Africa labour law",
    "domestic worker contract",
    "domestic worker payslip",
    "UIF registration",
    "nanny contract South Africa",
    "gardener employment",
    "BCEA compliance",
  ],
  contactEmail: "hello@labourmate.co.za",
  supportEmail: "support@labourmate.co.za",
  social: {
    facebook: "https://facebook.com/labourmate",
    twitter: "https://twitter.com/labourmate",
  },
} as const;

export type NavItem = { title: string; href: string };

export const marketingNav: NavItem[] = [
  { title: "How it works", href: "/#how-it-works" },
  { title: "Pricing", href: "/pricing" },
  { title: "UIF Guide", href: "/uif" },
  { title: "FAQ", href: "/faq" },
];

export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Product",
    items: [
      { title: "Compliance Check", href: "/compliance-check" },
      { title: "Pricing", href: "/pricing" },
      { title: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { title: "1-minute compliance check", href: "/check" },
      { title: "UIF Guide", href: "/uif" },
      { title: "Compliance checklist", href: "/#checklist" },
      { title: "FAQ", href: "/faq" },
      { title: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Company",
    items: [
      { title: "Sign in", href: "/login" },
      { title: "Create account", href: "/register" },
      { title: "Terms", href: "/legal/terms" },
      { title: "Privacy (POPIA)", href: "/legal/privacy" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Pricing (ZAR)
// ---------------------------------------------------------------------------

export type PlanId = "FREE_TRIAL" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";

/**
 * Netcash Pay Now subscription frequency codes (field m18).
 * 1 Monthly · 2 Weekly · 3 Bi-weekly · 4 Quarterly · 5 Six-monthly
 * 6 Annually · 7 Daily
 */
export const NETCASH_FREQUENCY = {
  MONTHLY: 1,
  WEEKLY: 2,
  BIWEEKLY: 3,
  QUARTERLY: 4,
  SIX_MONTHLY: 5,
  ANNUALLY: 6,
  DAILY: 7,
} as const;

/**
 * Number of billing cycles requested from Netcash (field m17, max 3 digits).
 * Netcash requires a finite count, so we request the maximum — the practical
 * equivalent of "until cancelled" — and stop collection by cancelling the
 * subscription on the Netcash side when a customer cancels with us.
 */
export const NETCASH_MAX_CYCLES = 999;

export interface PricingPlan {
  id: PlanId;
  name: string;
  priceZar: number;
  interval: "trial" | "month" | "year";
  /** Human string, e.g. "R49 / month". */
  priceLabel: string;
  description: string;
  features: string[];
  employeeLimit: number | null; // null = unlimited
  payslipLimit: number | null;
  highlighted?: boolean;
  cta: string;
  /** Netcash recurring-billing settings; absent for non-recurring plans. */
  subscription?: {
    /** Netcash m18 frequency code. */
    frequency: (typeof NETCASH_FREQUENCY)[keyof typeof NETCASH_FREQUENCY];
    /** Netcash m17 cycle count. */
    cycles: number;
  };
}

export const PRICING: PricingPlan[] = [
  {
    id: "FREE_TRIAL",
    name: "Free Trial",
    priceZar: 0,
    interval: "trial",
    priceLabel: "Free",
    description: "See how easy compliance can be. No card required.",
    features: [
      "1 employee",
      "1 payslip",
      "1 employment contract",
      "Compliance score & guidance",
      "Document vault",
    ],
    employeeLimit: 1,
    payslipLimit: 1,
    cta: "Start free",
  },
  {
    id: "PREMIUM_MONTHLY",
    name: "Premium Monthly",
    priceZar: 49,
    interval: "month",
    priceLabel: "R49 / month",
    description: "Everything you need, billed monthly. Cancel anytime.",
    features: [
      "Unlimited employees",
      "Unlimited payslips",
      "Unlimited contracts",
      "WhatsApp payslip delivery",
      "Leave management & records",
      "Automated reminders (UIF, salary)",
      "Priority support",
    ],
    employeeLimit: null,
    payslipLimit: null,
    highlighted: true,
    cta: "Go Premium",
    subscription: { frequency: NETCASH_FREQUENCY.MONTHLY, cycles: NETCASH_MAX_CYCLES },
  },
  {
    id: "PREMIUM_ANNUAL",
    name: "Premium Annual",
    priceZar: 490,
    interval: "year",
    priceLabel: "R490 / year",
    description: "Two months free versus monthly. Best value.",
    features: [
      "Everything in Premium Monthly",
      "2 months free (save R98)",
      "Annual compliance review reminder",
    ],
    employeeLimit: null,
    payslipLimit: null,
    cta: "Save with annual",
    subscription: { frequency: NETCASH_FREQUENCY.ANNUALLY, cycles: NETCASH_MAX_CYCLES },
  },
];

export const FREE_TRIAL_DAYS = 14;

export function planById(id: PlanId): PricingPlan {
  const plan = PRICING.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}
