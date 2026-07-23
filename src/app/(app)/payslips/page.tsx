import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, MessageCircle, Plus, ReceiptText } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { listPayslips, getPayslipAllowance } from "@/server/services/payslip";
import { monthLabel } from "@/lib/validations/payslip";
import { formatZar } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({
  title: "Payslips",
  path: "/payslips",
  noIndex: true,
});

export default async function PayslipsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [payslips, allowance] = await Promise.all([
    listPayslips(session.user.id),
    getPayslipAllowance(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payslips</h1>
          <p className="mt-1 text-muted-foreground">
            {allowance.limit === null
              ? `${payslips.length} payslip${payslips.length === 1 ? "" : "s"} generated`
              : `${allowance.used} of ${allowance.limit} used on your plan`}
          </p>
        </div>
        {allowance.canAdd ? (
          <Button asChild>
            <Link href="/payslips/new">
              <Plus className="size-4" /> New payslip
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/billing">Upgrade for unlimited</Link>
          </Button>
        )}
      </div>

      {payslips.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ReceiptText className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No payslips yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Generate a professional payslip with UIF and PAYE calculated automatically.
          </p>
          <Button asChild className="mt-5">
            <Link href="/payslips/new">
              <Plus className="size-4" /> Generate your first payslip
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Gross</th>
                <th className="px-4 py-3 font-medium">Net</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {payslips.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {p.employee.firstName} {p.employee.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {monthLabel(p.periodMonth)} {p.periodYear}
                  </td>
                  <td className="px-4 py-3">{formatZar(Number(p.grossEarnings))}</td>
                  <td className="px-4 py-3 font-medium">{formatZar(Number(p.netPay))}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {p.whatsappSentAt && <MessageCircle className="size-4 text-success" />}
                      {p.emailSentAt && <Mail className="size-4 text-success" />}
                      {!p.whatsappSentAt && !p.emailSentAt && <span className="text-xs">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/payslips/${p.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
