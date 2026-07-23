import { listAdminSubscriptions } from "@/server/services/admin";
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

export default async function AdminSubscriptionsPage() {
  const subs = await listAdminSubscriptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="mt-1 text-muted-foreground">{subs.length} shown</p>
      </div>

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
