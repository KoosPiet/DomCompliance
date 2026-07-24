import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { listEmployees } from "@/server/services/employee";
import type { PayslipInput } from "@/lib/validations/payslip";
import { PayslipForm } from "@/components/payslips/payslip-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Edit payslip",
  path: "/payslips",
  noIndex: true,
});

/** Format a Prisma Decimal as a form string; zero becomes an empty field. */
function amount(value: unknown, keepZero = false): string {
  const n = Number(value);
  if (!Number.isFinite(n) || (!keepZero && n === 0)) return "";
  return String(n);
}

export default async function EditPayslipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const [payslip, employees] = await Promise.all([
    prisma.payslip.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
    }),
    listEmployees(session.user.id),
  ]);
  if (!payslip) notFound();

  const options = employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    salary: e.salary.toString(),
  }));

  const defaults: Partial<PayslipInput> = {
    employeeId: payslip.employeeId,
    periodMonth: String(payslip.periodMonth) as PayslipInput["periodMonth"],
    periodYear: String(payslip.periodYear),
    payDate: payslip.payDate.toISOString().slice(0, 10),
    basicSalary: amount(payslip.basicSalary, true),
    overtime: amount(payslip.overtime),
    allowances: amount(payslip.allowances),
    bonuses: amount(payslip.bonuses),
    otherEarnings: amount(payslip.otherEarnings),
    otherDeductions: amount(payslip.otherDeductions),
    applyUif: Number(payslip.uifEmployee) > 0,
    applyPaye: Number(payslip.paye) > 0,
    notes: payslip.notes ?? "",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href={`/payslips/${id}`}>
            <ArrowLeft className="size-4" /> Back to payslip
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit payslip {payslip.payslipNumber}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Amounts recalculate automatically — the PDF updates as soon as you save.
        </p>
      </div>

      <PayslipForm
        employees={options}
        mode="edit"
        payslipId={id}
        defaultValues={defaults}
      />
    </div>
  );
}
