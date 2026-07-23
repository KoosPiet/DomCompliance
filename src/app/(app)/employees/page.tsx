import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus, Users } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { listEmployees, getEmployeeAllowance } from "@/server/services/employee";
import { occupationLabel } from "@/lib/validations/employee";
import { formatZar } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({
  title: "Employees",
  path: "/employees",
  noIndex: true,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  ON_LEAVE: "secondary",
  SUSPENDED: "outline",
  TERMINATED: "outline",
};

export default async function EmployeesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [employees, allowance] = await Promise.all([
    listEmployees(session.user.id),
    getEmployeeAllowance(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-muted-foreground">
            {allowance.limit === null
              ? `${employees.length} employee${employees.length === 1 ? "" : "s"}`
              : `${allowance.used} of ${allowance.limit} used on your plan`}
          </p>
        </div>
        {allowance.canAdd ? (
          <Button asChild>
            <Link href="/employees/new">
              <Plus className="size-4" /> Add employee
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/billing">Upgrade to add more</Link>
          </Button>
        )}
      </div>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No employees yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your domestic worker, gardener, nanny or caregiver to generate
            contracts and payslips.
          </p>
          <Button asChild className="mt-5">
            <Link href="/employees/new">
              <Plus className="size-4" /> Add your first employee
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {employees.map((emp) => (
            <Link
              key={emp.id}
              href={`/employees/${emp.id}`}
              className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {occupationLabel(emp.occupation, emp.otherOccupation)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[emp.status] ?? "outline"}>
                  {emp.status.replace("_", " ").toLowerCase()}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {formatZar(Number(emp.salary))}
                  <span className="text-muted-foreground"> / {emp.payFrequency.toLowerCase()}</span>
                </span>
                <span className="text-muted-foreground">
                  {emp._count.contracts} contract{emp._count.contracts === 1 ? "" : "s"} ·{" "}
                  {emp._count.documents} doc{emp._count.documents === 1 ? "" : "s"}
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                View <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
