import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PRICING } from "@/config/site";
import { formatZar } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";

export const metadata = buildMetadata({
  title: "Pricing",
  description:
    "Simple, honest pricing. Start free with 1 employee and 1 payslip, then go Premium for unlimited everything from R49/month. Cancel anytime.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary">Pricing</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Compliance that pays for itself
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          One CCMA dispute can cost thousands. LabourMate costs less than a cup
          of coffee a week. Start free — no card required.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
        {PRICING.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 0.08}>
            <div
              className={`flex h-full flex-col rounded-2xl border bg-card p-7 ${
                plan.highlighted
                  ? "border-primary shadow-xl shadow-primary/10"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <Badge className="mb-3 w-fit">Most popular</Badge>
              )}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {plan.priceZar === 0 ? "Free" : formatZar(plan.priceZar)}
                </span>
                {plan.interval !== "trial" && (
                  <span className="text-sm text-muted-foreground">
                    / {plan.interval}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="mt-7"
                variant={plan.highlighted ? "default" : "outline"}
              >
                <Link href="/compliance-check">
                  {plan.cta} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-2xl space-y-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Billing questions
        </h2>
        <div className="space-y-4 text-left">
          {[
            {
              q: "How do I pay?",
              a: "Securely via Netcash — South Africa's trusted payment gateway. We accept card and EFT.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from your billing settings and you keep access until the end of your paid period.",
            },
            {
              q: "What happens after the free trial?",
              a: "Nothing automatic — we never charge a card you didn't add. You choose to upgrade when you're ready.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-xl border bg-card p-5">
              <p className="font-medium">{item.q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
