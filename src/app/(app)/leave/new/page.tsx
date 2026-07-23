import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { listEmployees } from "@/server/services/employee";
import { LeaveForm } from "@/components/leave/leave-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Log leave",
  path: "/leave/new",
  noIndex: true,
});

export default async function NewLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { employeeId } = await searchParams;

  const employees = await listEmployees(session.user.id);
  const options = employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/leave">
            <ArrowLeft className="size-4" /> Leave
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Log leave</h1>
        <p className="mt-1 text-muted-foreground">Record time off and keep balances up to date.</p>
      </div>

      {options.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Add an employee first</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            You need at least one employee before you can log leave.
          </p>
          <Button asChild className="mt-5">
            <Link href="/employees/new">Add employee</Link>
          </Button>
        </div>
      ) : (
        <LeaveForm employees={options} defaultEmployeeId={employeeId} />
      )}
    </div>
  );
}
