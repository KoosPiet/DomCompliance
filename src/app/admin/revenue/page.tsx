import { getRevenue } from "@/server/services/admin";
import { formatZar, fromCents } from "@/domain/money";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Admin · Revenue", path: "/admin/revenue", noIndex: true });

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

export default async function AdminRevenuePage() {
  const { payments, months, totalCents } = await getRevenue();
  const peak = Math.max(1, ...months.map((m) => m.cents));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
        <p className="mt-1 text-muted-foreground">
          {formatZar(fromCents(totalCents))} collected across {payments.length} payments
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">By month</h2>
        {months.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No revenue recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {months.map((m) => (
              <li key={m.month} className="flex items-center gap-4">
                <span className="w-32 shrink-0 text-sm text-muted-foreground">{monthLabel(m.month)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(m.cents / peak) * 100}%` }} />
                </div>
                <span className="w-28 shrink-0 text-right text-sm font-medium">{formatZar(fromCents(m.cents))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">Recent payments</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Reference</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 text-muted-foreground">
                    {(p.processedAt ?? p.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                  <td className="py-2.5">{p.user.email}</td>
                  <td className="py-2.5 font-mono text-xs text-muted-foreground">{p.providerReference ?? "—"}</td>
                  <td className="py-2.5 text-right font-medium">{formatZar(fromCents(p.amountZarCents))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
