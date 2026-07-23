import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileSignature,
  FileText,
  FolderLock,
  Landmark,
  MessageCircle,
  Umbrella,
  ReceiptText,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildMetadata, softwareAppJsonLd } from "@/lib/seo";
import { PRICING } from "@/config/site";
import { formatZar } from "@/domain/money";

export const metadata = buildMetadata({
  description:
    "Take the free 2-minute compliance check. LabourMate helps South African homeowners legally employ a domestic worker — contracts, payslips, UIF, leave and records.",
});

const RISKS = [
  {
    stat: "R7 500+",
    label:
      "Typical CCMA award against an employer with no contract or records.",
  },
  {
    stat: "10%",
    label: "Monthly penalty on unpaid UIF, plus interest, recoverable in full.",
  },
  {
    stat: "3 years",
    label: "How long you must keep salary and leave records by law.",
  },
];

const STEPS = [
  {
    icon: ScrollText,
    title: "Take the free check",
    body: "Answer 8 quick questions. Get your compliance score and a personalised risk report — instantly.",
  },
  {
    icon: FileSignature,
    title: "Fix the gaps",
    body: "Generate a compliant contract, issue payslips and register for UIF with step-by-step guidance.",
  },
  {
    icon: CheckCircle2,
    title: "Stay compliant",
    body: "Automated reminders for payslips, salaries and UIF keep you protected — every single month.",
  },
];

const FEATURES = [
  {
    icon: FileSignature,
    title: "Employment contracts",
    body: "Professional SA domestic-worker contracts with UIF & POPIA clauses and digital signatures.",
  },
  {
    icon: ReceiptText,
    title: "Monthly payslips",
    body: "Auto-calculated UIF and PAYE, professional layout, stored forever and downloadable as PDF.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp delivery",
    body: "Send payslips straight to your worker on WhatsApp with one tap.",
  },
  {
    icon: Umbrella,
    title: "Leave management",
    body: "Annual, sick and family-responsibility leave tracked and balanced automatically.",
  },
  {
    icon: Landmark,
    title: "UIF made simple",
    body: "Understand exactly why, when and how to register and pay — with official links.",
  },
  {
    icon: FolderLock,
    title: "Document vault",
    body: "Every contract, payslip and record encrypted and searchable in one secure place.",
  },
  {
    icon: CalendarClock,
    title: "Smart reminders",
    body: "Never miss a payslip, salary payment, UIF submission or annual review again.",
  },
  {
    icon: FileText,
    title: "Audit-ready records",
    body: "If the Department of Labour ever asks, you have proof of everything, instantly.",
  },
];

const CHECKLIST = [
  "A signed written employment contract",
  "A monthly payslip for every payment",
  "Registration with the UIF (uFiling)",
  "Monthly UIF submission and payment",
  "Accurate leave records (annual, sick, family)",
  "Salary and payment records kept for 3 years",
  "Signed acknowledgements and documents on file",
];

const TESTIMONIALS = [
  {
    quote:
      "I had no idea I was breaking the law. LabourMate had my domestic worker's contract and first payslip sorted in under 10 minutes.",
    name: "Thandi M.",
    location: "Sandton, Johannesburg",
  },
  {
    quote:
      "The UIF part always confused me. Now it reminds me every month and I just do it. Total peace of mind.",
    name: "Pieter V.",
    location: "Durbanville, Cape Town",
  },
  {
    quote:
      "Sending payslips on WhatsApp is genius. My gardener gets his slip instantly and I keep a copy automatically.",
    name: "Ayesha K.",
    location: "Umhlanga, Durban",
  },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd()) }}
      />

      <Hero />

      {/* Risk / fear section */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="gap-1.5 border-warning/40 text-warning">
              <AlertTriangle className="size-3.5" />
              The risk is real
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Non-compliance is expensive
            </h2>
            <p className="mt-3 text-muted-foreground">
              The Department of Employment and Labour actively inspects private
              homes. Without the right documents, the law puts the burden of
              proof on <span className="font-medium text-foreground">you</span>.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {RISKS.map((risk, i) => (
              <Reveal
                key={risk.stat}
                delay={i * 0.08}
                className="rounded-xl border bg-card p-6 text-center"
              >
                <p className="text-4xl font-semibold tracking-tight text-danger">
                  {risk.stat}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{risk.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary">How it works</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Compliant in three simple steps
            </h2>
            <p className="mt-3 text-muted-foreground">
              No HR knowledge required. If you can use online banking, you can do
              this.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1}>
                <div className="relative h-full rounded-2xl border bg-card p-7">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-5.5" />
                  </div>
                  <span className="absolute right-6 top-6 text-5xl font-semibold text-muted/50">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary">Everything included</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              One platform for the whole relationship
            </h2>
            <p className="mt-3 text-muted-foreground">
              From the first contract to the final payslip — LabourMate handles
              the legal admin so you can focus on your home.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 4) * 0.06}>
                <div className="h-full rounded-xl border bg-card p-6">
                  <feature.icon className="size-6 text-primary" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance checklist */}
      <section id="checklist" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <Badge variant="secondary">The compliance checklist</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              What the law actually requires
            </h2>
            <p className="mt-3 text-muted-foreground">
              These are the seven things every South African domestic employer
              must have in place. LabourMate builds each one for you.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href="/compliance-check">
                Check my compliance <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="space-y-3 rounded-2xl border bg-card p-6">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary">Loved by homeowners</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Peace of mind, thousands of times over
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl border bg-card p-6">
                  <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <span className="block text-muted-foreground">
                      {t.location}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary">Simple pricing</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Start free. Upgrade when you&apos;re ready.
            </h2>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                  plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : ""
                }`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-2.5 left-6">Most popular</Badge>
                )}
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {plan.priceZar === 0 ? "Free" : formatZar(plan.priceZar)}
                  {plan.interval !== "trial" && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / {plan.interval}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <Button
                  asChild
                  variant={plan.highlighted ? "default" : "outline"}
                  className="mt-5"
                >
                  <Link href="/compliance-check">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Full plan comparison on the{" "}
            <Link href="/pricing" className="font-medium text-primary underline-offset-4 hover:underline">
              pricing page
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <Reveal className="mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-primary px-6 py-14 text-center text-primary-foreground sm:py-16">
          <Sparkles className="mx-auto size-8 opacity-90" />
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Find out if you&apos;re compliant — free, in 2 minutes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            No card. No commitment. Just clarity on where you stand and exactly
            what to fix.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-8 h-12 px-7 text-base"
          >
            <Link href="/compliance-check">
              Take the FREE Compliance Check
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
