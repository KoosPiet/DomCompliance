import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { getPayslipView, PayslipError } from "@/server/services/payslip";
import { monthLabel } from "@/lib/validations/payslip";
import { occupationLabel } from "@/lib/validations/employee";
import { formatZar } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SendPayslip } from "@/components/payslips/send-payslip";

export const metadata = buildMetadata({
  title: "Payslip",
  path: "/payslips",
  noIndex: true,
});

function AmountRow({ label, value, strong, muted }: { label: string; value: number; strong?: boolean; muted?: boolean }) {
  if (value === 0 && muted) return null;
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>{formatZar(value)}</span>
    </div>
  );
}

export default async function PayslipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  let payslip;
  try {
    payslip = await getPayslipView(session.user.id, id);
  } catch (e) {
    if (e instanceof PayslipError) notFound();
    throw e;
  }

  const { employee } = payslip;
  const period = `${monthLabel(payslip.periodMonth)} ${payslip.periodYear}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href={`/employees/${payslip.employeeId}`}>
            <ArrowLeft className="size-4" /> {employee.firstName} {employee.lastName}
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Payslip — {period}</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{payslip.payslipNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/payslips/${id}/edit`}>
                <Pencil className="size-4" /> Edit
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`/payslips/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" /> PDF
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Send to {employee.firstName}</p>
            <p className="text-sm text-muted-foreground">
              One-click delivery with the PDF attached.
            </p>
          </div>
          <SendPayslip id={id} hasEmail={Boolean(employee.email)} />
        </div>
        {(payslip.whatsappSentAt || payslip.emailSentAt) && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="size-4" />
            {payslip.whatsappSentAt && "Sent on WhatsApp. "}
            {payslip.emailSentAt && "Emailed. "}
          </p>
        )}
      </div>

      {/* On-screen payslip */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">
              {employee.firstName} {employee.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {occupationLabel(employee.occupation, employee.otherOccupation)}
            </p>
          </div>
          <Badge variant={payslip.status === "FINALIZED" ? "default" : "secondary"}>
            {payslip.status.toLowerCase()}
          </Badge>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Earnings
            </h3>
            <div className="mt-2 divide-y">
              <AmountRow label="Basic salary" value={Number(payslip.basicSalary)} />
              <AmountRow label="Overtime" value={Number(payslip.overtime)} muted />
              <AmountRow label="Allowances" value={Number(payslip.allowances)} muted />
              <AmountRow label="Bonuses" value={Number(payslip.bonuses)} muted />
              <AmountRow label="Other" value={Number(payslip.otherEarnings)} muted />
              <AmountRow label="Gross" value={Number(payslip.grossEarnings)} strong />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Deductions
            </h3>
            <div className="mt-2 divide-y">
              <AmountRow label="UIF (1%)" value={Number(payslip.uifEmployee)} />
              <AmountRow label="PAYE" value={Number(payslip.paye)} muted />
              <AmountRow label="Other" value={Number(payslip.otherDeductions)} muted />
              <AmountRow label="Total deductions" value={Number(payslip.totalDeductions)} strong />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-primary/10 px-5 py-4">
          <span className="font-semibold">Net pay</span>
          <span className="text-2xl font-semibold tracking-tight">
            {formatZar(Number(payslip.netPay))}
          </span>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Employer UIF contribution: {formatZar(Number(payslip.uifEmployer))} · Pay date{" "}
          {payslip.payDate.toLocaleDateString("en-ZA")}
        </p>
      </div>
    </div>
  );
}
