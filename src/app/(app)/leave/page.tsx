import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Pencil, Plus, Users } from "lucide-react";
import { DeleteLeaveButton } from "@/components/leave/delete-leave-button";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { getLeaveOverview } from "@/server/services/leave";
import { leaveTypeLabel } from "@/lib/validations/leave";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({
  title: "Leave",
  path: "/leave",
  noIndex: true,
});

const fmt = (d: Date) => d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

export default async function LeavePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { rows, recent } = await getLeaveOverview(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave</h1>
          <p className="mt-1 text-muted-foreground">
            Annual, sick and family responsibility balances — calculated per the BCEA.
          </p>
        </div>
        {rows.length > 0 && (
          <Button asChild>
            <Link href="/leave/new">
              <Plus className="size-4" /> Log leave
            </Link>
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Add an employee to track leave</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Once you add an employee, their statutory leave balances appear here automatically.
          </p>
          <Button asChild className="mt-5">
            <Link href="/employees/new">Add employee</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const pct = row.accrued > 0 ? Math.min(100, (row.taken / row.accrued) * 100) : 0;
              return (
                <Link
                  key={row.employee.id}
                  href={`/employees/${row.employee.id}`}
                  className="rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {row.employee.firstName} {row.employee.lastName}
                    </p>
                    <CalendarDays className="size-4 text-muted-foreground" />
                  </div>
                  <p className={`mt-3 text-3xl font-semibold tracking-tight ${row.balance < 0 ? "text-danger" : ""}`}>
                    {row.balance}
                    <span className="text-sm font-normal text-muted-foreground">
                      {row.balance < 0 ? " days overdrawn" : " days available"}
                    </span>
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {row.taken} taken of {row.accrued} accrued · {row.entitled} / year
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Recent leave</h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No leave logged yet. Use “Log leave” to record time off.
              </p>
            ) : (
              <ul className="mt-3 divide-y">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{leaveTypeLabel(r.leaveType)}</Badge>
                      <span className="font-medium">
                        {r.employee.firstName} {r.employee.lastName}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {fmt(r.startDate)} – {fmt(r.endDate)} · {Number(r.days)} day
                        {Number(r.days) === 1 ? "" : "s"}
                      </span>
                      <Button asChild size="sm" variant="ghost" title="Edit">
                        <Link href={`/leave/${r.id}/edit`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <DeleteLeaveButton
                        id={r.id}
                        summary={`${Number(r.days)} day(s) ${leaveTypeLabel(r.leaveType)} for ${r.employee.firstName}`}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
