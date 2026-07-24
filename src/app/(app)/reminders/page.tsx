import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { listReminders } from "@/server/services/reminder";
import { reminderTypeLabel } from "@/lib/validations/reminder";
import {
  completeReminderAction,
  dismissReminderAction,
  deleteReminderAction,
  setupDefaultRemindersAction,
} from "@/server/actions/reminder-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({
  title: "Reminders",
  path: "/reminders",
  noIndex: true,
});

const FREQ_LABEL: Record<string, string> = { ONCE: "One-off", MONTHLY: "Monthly", ANNUALLY: "Yearly" };
const fmt = (d: Date) => d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

export default async function RemindersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reminders = await listReminders(session.user.id);
  const upcoming = reminders.filter((r) => r.status === "PENDING");
  const past = reminders.filter((r) => r.status !== "PENDING");
  const now = new Date();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reminders</h1>
          <p className="mt-1 text-muted-foreground">
            Never miss a payslip, salary payment or UIF submission.
          </p>
        </div>
        <Button asChild>
          <Link href="/reminders/new">
            <Plus className="size-4" /> Add reminder
          </Link>
        </Button>
      </div>

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BellRing className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No reminders yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Set up the standard monthly reminders — generate payslips, pay salaries and submit UIF.
          </p>
          <form action={setupDefaultRemindersAction} className="mt-5">
            <Button type="submit">
              <Sparkles className="size-4" /> Set up standard reminders
            </Button>
          </form>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">You&apos;re all caught up. 🎉</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((r) => {
                  const overdue = r.dueDate < now;
                  return (
                    <li
                      key={r.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 ${
                        overdue ? "border-danger/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex size-9 items-center justify-center rounded-lg ${overdue ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
                          <BellRing className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium">{r.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {overdue ? "Overdue · " : "Due "}
                            {fmt(r.dueDate)} · {FREQ_LABEL[r.frequency]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="mr-1">
                          {reminderTypeLabel(r.type)}
                        </Badge>
                        <Button asChild size="sm" variant="ghost" title="Edit">
                          <Link href={`/reminders/${r.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <form action={completeReminderAction.bind(null, r.id)}>
                          <Button type="submit" size="sm" variant="outline">
                            <Check className="size-4" /> Done
                          </Button>
                        </form>
                        <form action={dismissReminderAction.bind(null, r.id)}>
                          <Button type="submit" size="sm" variant="ghost" title="Dismiss">
                            <X className="size-4" />
                          </Button>
                        </form>
                        <form action={deleteReminderAction.bind(null, r.id)}>
                          <Button type="submit" size="sm" variant="ghost" className="text-danger hover:text-danger" title="Delete">
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                History
              </h2>
              <ul className="divide-y rounded-2xl border bg-card">
                {past.slice(0, 15).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="text-muted-foreground line-through">{r.title}</span>
                    <Badge variant="outline">{r.status.toLowerCase()}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
