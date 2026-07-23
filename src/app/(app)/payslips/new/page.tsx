import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles, Users } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { listEmployees, getEmployeeAllowance } from "@/server/services/employee";
import { getPayslipAllowance } from "@/server/services/payslip";
import { PayslipForm } from "@/components/payslips/payslip-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "New payslip",
  path: "/payslips/new",
  noIndex: true,
});

export default async function NewPayslipPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { employeeId } = await searchParams;

  const [employees, payslipAllowance] = await Promise.all([
    listEmployees(session.user.id),
    getPayslipAllowance(session.user.id),
  ]);

  const options = employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    salary: e.salary.toString(),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/payslips">
            <ArrowLeft className="size-4" /> Payslips
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">New payslip</h1>
        <p className="mt-1 text-muted-foreground">
          UIF and PAYE are calculated automatically — review the live preview and generate.
        </p>
      </div>

      {options.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Add an employee first"
          body="You need at least one employee before you can generate a payslip."
          cta={{ href: "/employees/new", label: "Add employee" }}
        />
      ) : !payslipAllowance.canAdd ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="You've reached your plan limit"
          body={`Your current plan allows ${payslipAllowance.limit} payslip${payslipAllowance.limit === 1 ? "" : "s"}. Upgrade for unlimited payslips.`}
          cta={{ href: "/billing", label: "Go Premium" }}
        />
      ) : (
        <PayslipForm employees={options} defaultEmployeeId={employeeId} />
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-card p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-5">
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    </div>
  );
}
