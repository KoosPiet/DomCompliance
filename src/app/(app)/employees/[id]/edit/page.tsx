import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { getEmployee, toFormValues, EmployeeError } from "@/server/services/employee";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Edit employee",
  path: "/employees",
  noIndex: true,
});

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  let employee;
  try {
    employee = await getEmployee(session.user.id, id);
  } catch (e) {
    if (e instanceof EmployeeError) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href={`/employees/${id}`}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {employee.firstName} {employee.lastName}
        </h1>
      </div>

      <EmployeeForm mode="edit" employeeId={id} defaultValues={toFormValues(employee)} />
    </div>
  );
}
