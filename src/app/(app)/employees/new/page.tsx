import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { getEmployeeAllowance } from "@/server/services/employee";
import { employeeFormDefaults } from "@/lib/validations/employee";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Add employee",
  path: "/employees/new",
  noIndex: true,
});

export default async function NewEmployeePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowance = await getEmployeeAllowance(session.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/employees">
            <ArrowLeft className="size-4" /> Employees
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
        <p className="mt-1 text-muted-foreground">
          Capture the details once — we&apos;ll use them for contracts, payslips and records.
        </p>
      </div>

      {allowance.canAdd ? (
        <EmployeeForm mode="create" defaultValues={employeeFormDefaults} />
      ) : (
        <div className="flex flex-col items-center rounded-2xl border bg-card p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">You&apos;ve reached your plan limit</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Your current plan allows {allowance.limit} employee
            {allowance.limit === 1 ? "" : "s"}. Upgrade to Premium for unlimited
            employees, payslips and contracts.
          </p>
          <Button asChild className="mt-5">
            <Link href="/billing">Go Premium</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
