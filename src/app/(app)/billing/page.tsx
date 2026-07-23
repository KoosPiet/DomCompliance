import { redirect } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { PRICING } from "@/config/site";
import { formatZar, fromCents } from "@/domain/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/billing/upgrade-button";

export const metadata = buildMetadata({
  title: "Billing",
  path: "/billing",
  noIndex: true,
});

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Free trial",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  CANCELED: "Canceled",
  EXPIRED: "Expired",
};

const dateFmt = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [subscription, invoices] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    prisma.invoice.findMany({
      where: { userId: session.user.id },
      orderBy: { issuedAt: "desc" },
      take: 24,
    }),
  ]);

  const isPremium =
    subscription?.status === "ACTIVE" &&
    (subscription.plan === "PREMIUM_MONTHLY" || subscription.plan === "PREMIUM_ANNUAL");

  const premiumPlans = PRICING.filter((p) => p.id !== "FREE_TRIAL");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your LabourMate subscription and view invoices.
        </p>
      </div>

      {/* Current plan */}
      <section className="rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="mt-1 text-xl font-semibold">
              {isPremium
                ? subscription?.plan === "PREMIUM_ANNUAL"
                  ? "Premium Annual"
                  : "Premium Monthly"
                : "Free Trial"}
            </p>
          </div>
          <Badge variant={isPremium ? "default" : "secondary"}>
            {STATUS_LABEL[subscription?.status ?? "TRIALING"] ?? "—"}
          </Badge>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">Price</dt>
            <dd className="mt-0.5 font-medium">
              {subscription && subscription.priceZarCents > 0
                ? formatZar(fromCents(subscription.priceZarCents))
                : "Free"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {subscription?.status === "TRIALING" ? "Trial ends" : "Renews / ends"}
            </dt>
            <dd className="mt-0.5 font-medium">
              {dateFmt(
                subscription?.status === "TRIALING"
                  ? subscription?.trialEndsAt
                  : subscription?.currentPeriodEnd,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Limits</dt>
            <dd className="mt-0.5 font-medium">
              {subscription?.employeeLimit === null
                ? "Unlimited"
                : `${subscription?.employeeLimit ?? 1} employee, ${subscription?.payslipLimit ?? 1} payslip`}
            </dd>
          </div>
        </dl>
      </section>

      {/* Upgrade options */}
      {!isPremium && (
        <section>
          <h2 className="text-lg font-semibold">Go Premium</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Unlimited employees, payslips and contracts. Cancel anytime. Secure
            payment via Netcash.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {premiumPlans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border bg-card p-6 ${
                  plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.highlighted && <Badge>Most popular</Badge>}
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {formatZar(plan.priceZar)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}/ {plan.interval}
                  </span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <UpgradeButton
                  planId={plan.id}
                  variant={plan.highlighted ? "default" : "outline"}
                  className="mt-6"
                >
                  {plan.cta}
                </UpgradeButton>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            Payments are processed securely by Netcash (PCI DSS Level 1). We never
            see or store your card details.
          </p>
        </section>
      )}

      {/* Invoices */}
      <section>
        <h2 className="text-lg font-semibold">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No invoices yet. Your paid invoices will appear here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Invoice</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2.5 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="px-4 py-2.5">{dateFmt(inv.issuedAt)}</td>
                    <td className="px-4 py-2.5">{formatZar(fromCents(inv.totalZarCents))}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={inv.status === "PAID" ? "default" : "secondary"}>
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
