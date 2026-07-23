import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Landmark,
  ListChecks,
  Wallet,
} from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UIF, UIF_MAX_MONTHLY } from "@/domain/constants";
import { formatZar } from "@/domain/money";

export const metadata = buildMetadata({
  title: "UIF for domestic employers — the simple guide",
  description:
    "What UIF is, why it matters, and exactly how to register and pay for your domestic worker in South Africa. Includes official Department of Employment and Labour and uFiling links.",
  path: "/uif",
});

const OFFICIAL_LINKS = [
  {
    label: "Department of Employment and Labour",
    href: "https://www.labour.gov.za/",
    description: "The official government department overseeing UIF and labour law.",
  },
  {
    label: "uFiling — register & declare online",
    href: "https://www.ufiling.co.za/",
    description: "Register as a domestic employer and submit monthly declarations.",
  },
  {
    label: "UIF domestic worker information",
    href: "https://www.labour.gov.za/uif-domestic-workers",
    description: "Official guidance specifically for domestic employers.",
  },
];

export default function UifPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div>
        <Badge variant="secondary">UIF Guide</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          UIF, made simple
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The Unemployment Insurance Fund protects your worker — and registering
          protects you. Here&apos;s everything you need to know.
        </p>
      </div>

      <section className="mt-12 space-y-8">
        <GuideBlock
          icon={<HelpCircle className="size-5" />}
          title="Why UIF matters"
        >
          <p>
            UIF gives your domestic worker a safety net: benefits if they lose
            their job, fall ill, or take maternity leave. For you as the
            employer, registering and paying UIF is a legal obligation under the
            Unemployment Insurance Contributions Act — and your proof of doing
            things by the book.
          </p>
          <p className="mt-3">
            You contribute <strong>{(UIF.EMPLOYER_RATE * 100).toFixed(0)}%</strong>{" "}
            and deduct <strong>{(UIF.EMPLOYEE_RATE * 100).toFixed(0)}%</strong>{" "}
            from your worker&apos;s wage each month. Contributions are capped at{" "}
            {formatZar(UIF.MONTHLY_CEILING)} of monthly earnings — a maximum of{" "}
            {formatZar(UIF_MAX_MONTHLY)} each.
          </p>
        </GuideBlock>

        <GuideBlock
          icon={<ListChecks className="size-5" />}
          title="How to register"
        >
          <ol className="list-decimal space-y-2 pl-5">
            <li>Register as an employer within 14 days of hiring your worker.</li>
            <li>
              Register online at uFiling, or complete forms UI-8 (employer) and
              UI-19 (employee details).
            </li>
            <li>You&apos;ll receive a UIF reference number for your household.</li>
            <li>Capture that reference in LabourMate to track everything.</li>
          </ol>
        </GuideBlock>

        <GuideBlock icon={<Wallet className="size-5" />} title="How to pay">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Declare and pay monthly — by the 7th of the following month.
            </li>
            <li>Pay via uFiling, EFT, or at your bank using your UIF reference.</li>
            <li>
              LabourMate reminds you every month and keeps a record of each
              payslip&apos;s UIF amounts.
            </li>
          </ul>
        </GuideBlock>

        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <Landmark className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Official resources</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Always use the official government services below to register and
            declare.
          </p>
          <ul className="mt-4 space-y-3">
            {OFFICIAL_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-3 rounded-lg border p-4 transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="flex items-center gap-1.5 font-medium">
                      {link.label}
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-14 rounded-2xl border bg-primary px-6 py-10 text-center text-primary-foreground">
        <h2 className="text-2xl font-semibold tracking-tight">
          Let LabourMate handle the reminders
        </h2>
        <p className="mx-auto mt-2 max-w-md text-primary-foreground/80">
          We&apos;ll calculate UIF on every payslip and remind you to submit —
          every month, automatically.
        </p>
        <Button asChild size="lg" variant="secondary" className="mt-6">
          <Link href="/compliance-check">
            Start with the free check <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function GuideBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="mt-3 text-muted-foreground">{children}</div>
    </div>
  );
}
