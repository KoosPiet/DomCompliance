import { TriangleAlert } from "lucide-react";
import { listAdminSubscriptions } from "@/server/services/admin";
import { listCancellationsNeedingAction } from "@/server/services/billing";
import { formatZar, fromCents } from "@/domain/money";
import { buildMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({ title: "Admin · Subscriptions", path: "/admin/subscriptions", noIndex: true });

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  TRIALING: "secondary",
  PAST_DUE: "outline",
  CANCELED: "outline",
  EXPIRED: "outline",
};

const dateFmt = (d: Date | null) =>
  d ? d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default async function AdminSubscriptionsPage() {
  const [subs, needsAction] = await Promise.all([
    listAdminSubscriptions(),
    listCancellationsNeedingAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="mt-1 text-muted-foreground">{subs.length} shown</p>
      </div>

      {/* Cancellations still collecting at Netcash until stopped manually. */}
      {needsAction.length > 0 && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="flex-1">
              <h2 className="font-semibold">
                Stop these collections in Netcash ({needsAction.length})
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These customers cancelled. LabourMate has stopped renewing, but
                the recurring Pay Now instruction lives on the Netcash service —
                cancel it there or their card will be charged again.
              </p>
              <ul className="mt-3 divide-y">
                {needsAction.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="font-medium">{s.user.email}</span>
                    <span className="text-muted-foreground">
                      cancelled {dateFmt(s.canceledAt)} · access to {dateFmt(s.currentPeriodEnd)}
                      {s.netcashAccountRef ? ` · ref ${s.netcashAccountRef}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Renews / ends</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subs.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.user.email}</div>
                  {s.user.name && <div className="text-xs text-muted-foreground">{s.user.name}</div>}
                </td>
                <td className="px-4 py-3">{s.plan.replace("PREMIUM_", "").toLowerCase()}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>{s.status.toLowerCase()}</Badge>
                </td>
                <td className="px-4 py-3">{s.priceZarCents > 0 ? formatZar(fromCents(s.priceZarCents)) : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(s.currentPeriodEnd ?? s.trialEndsAt)?.toLocaleDateString("en-ZA") ?? "—"}
                  {s.cancelAtPeriodEnd && <span className="ml-1 text-danger">(cancelling)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
