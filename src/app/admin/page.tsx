import type { ReactNode } from "react";
import { CreditCard, FileText, ReceiptText, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { getAdminOverview } from "@/server/services/admin";
import { formatZar, fromCents } from "@/domain/money";
import { buildMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({ title: "Admin", path: "/admin", noIndex: true });

function Stat({ label, value, icon, hint }: { label: string; value: string; icon: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const o = await getAdminOverview();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">Platform health at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="MRR" value={formatZar(fromCents(o.mrrCents))} icon={<TrendingUp className="size-4" />} hint="Monthly recurring revenue" />
        <Stat label="Total revenue" value={formatZar(fromCents(o.totalRevenueCents))} icon={<CreditCard className="size-4" />} hint={`${o.paidCount} payments`} />
        <Stat label="Active subscriptions" value={String(o.activeSubs)} icon={<ShieldCheck className="size-4" />} hint={`${o.trialingSubs} on trial`} />
        <Stat label="Users" value={String(o.userCount)} icon={<Users className="size-4" />} hint={`${o.ownerCount} employers`} />
        <Stat label="Employees managed" value={String(o.employeeCount)} icon={<Users className="size-4" />} />
        <Stat label="Payslips issued" value={String(o.payslipCount)} icon={<ReceiptText className="size-4" />} />
        <Stat label="Contracts" value={String(o.contractCount)} icon={<FileText className="size-4" />} />
        <Stat label="Open tickets" value={String(o.openTickets)} icon={<ShieldCheck className="size-4" />} />
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">Recent signups</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {o.recentUsers.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5">{u.email}</td>
                  <td className="py-2.5 text-muted-foreground">{u.name ?? "—"}</td>
                  <td className="py-2.5">
                    <Badge variant={u.subscription?.status === "ACTIVE" ? "default" : "secondary"}>
                      {u.subscription?.plan?.replace("PREMIUM_", "").toLowerCase() ?? "—"}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{u.createdAt.toLocaleDateString("en-ZA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
