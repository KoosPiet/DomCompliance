import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { listEmployees } from "@/server/services/employee";
import type { LogLeaveInput } from "@/lib/validations/leave";
import { LeaveForm } from "@/components/leave/leave-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Edit leave",
  path: "/leave",
  noIndex: true,
});

export default async function EditLeavePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const [request, employees] = await Promise.all([
    prisma.leaveRequest.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
    }),
    listEmployees(session.user.id),
  ]);
  if (!request) notFound();

  const options = employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
  }));

  const defaults: Partial<LogLeaveInput> = {
    employeeId: request.employeeId,
    leaveType: request.leaveType as LogLeaveInput["leaveType"],
    startDate: request.startDate.toISOString().slice(0, 10),
    endDate: request.endDate.toISOString().slice(0, 10),
    days: String(Number(request.days)),
    reason: request.reason ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/leave">
            <ArrowLeft className="size-4" /> Leave
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Edit leave entry</h1>
        <p className="mt-1 text-muted-foreground">
          Balances recalculate automatically when you save.
        </p>
      </div>
      <LeaveForm employees={options} mode="edit" leaveId={id} defaultValues={defaults} />
    </div>
  );
}
