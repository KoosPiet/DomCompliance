import Link from "next/link";
import { redirect } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { getUpcomingReminders } from "@/server/services/reminder";
import { ScoreGauge } from "@/components/compliance/score-gauge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ComplianceRating } from "@/domain/compliance/scoring";

export const metadata = buildMetadata({
  title: "Dashboard",
  path: "/dashboard",
  noIndex: true,
});

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, latestAssessment, employeeCount, upcomingReminders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true, employerProfile: true },
    }),
    prisma.complianceAssessment.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.count({
      where: { userId: session.user.id, deletedAt: null },
    }),
    getUpcomingReminders(session.user.id, 4),
  ]);

  if (!user) redirect("/login");

  const firstName = user.name?.split(" ")[0] ?? "there";
  const trialEndsAt = user.subscription?.trialEndsAt;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, differenceInCalendarDays(trialEndsAt, new Date()))
    : null;
  const isTrialing = user.subscription?.status === "TRIALING";

  const steps = [
    {
      label: "Verify your email address",
      done: Boolean(user.emailVerified),
      href: null,
    },
    {
      label: "Complete your employer profile",
      done: Boolean(user.employerProfile?.onboardingCompletedAt),
      href: "/onboarding",
    },
    {
      label: "Run your compliance check",
      done: Boolean(latestAssessment),
      href: "/compliance-check",
    },
    {
      label: "Add your first employee",
      done: employeeCount > 0,
      href: "/employees/new",
    },
  ];
  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s where your compliance stands today.
        </p>
      </div>

      {isTrialing && trialDaysLeft !== null && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Free trial · {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
              </p>
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium for unlimited employees and payslips.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/billing">
              Upgrade <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compliance card */}
        <div className="rounded-2xl border bg-card p-6 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Compliance score
          </h2>
          {latestAssessment ? (
            <div className="mt-4 flex flex-col items-center text-center">
              <ScoreGauge
                score={latestAssessment.score}
                rating={latestAssessment.rating as ComplianceRating}
                size={150}
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Last checked{" "}
                {latestAssessment.createdAt.toLocaleDateString("en-ZA")}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/compliance-check">Re-check</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center py-6 text-center">
              <ShieldCheck className="size-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                You haven&apos;t run a compliance check yet.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/compliance-check">Take the free check</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Getting started */}
        <div className="rounded-2xl border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Getting started
            </h2>
            <Badge variant="secondary">
              {completed}/{steps.length} done
            </Badge>
          </div>
          <ul className="mt-4 divide-y">
            {steps.map((step) => (
              <li
                key={step.label}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/40" />
                  )}
                  <span
                    className={
                      step.done ? "text-muted-foreground line-through" : "font-medium"
                    }
                  >
                    {step.label}
                  </span>
                </div>
                {!step.done && step.href && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={step.href}>
                      Do it <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={<Users className="size-5" />}
          label="Employees"
          value={String(employeeCount)}
        />
        <StatTile
          icon={<Clock className="size-5" />}
          label="Plan"
          value={
            user.subscription?.plan === "FREE_TRIAL"
              ? "Free trial"
              : "Premium"
          }
        />
        <StatTile
          icon={<ShieldCheck className="size-5" />}
          label="Status"
          value={latestAssessment ? `${latestAssessment.score}% compliant` : "Not checked"}
        />
      </div>

      {/* Upcoming reminders */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming reminders
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/reminders">
              Manage <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {upcomingReminders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No reminders set.{" "}
            <Link href="/reminders" className="text-primary hover:underline">
              Set up monthly reminders
            </Link>{" "}
            so you never miss UIF or payslips.
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            {upcomingReminders.map((r) => {
              const overdue = r.dueDate < new Date();
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <BellRing
                      className={`size-4 ${overdue ? "text-danger" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">{r.title}</span>
                  </div>
                  <span className={`text-sm ${overdue ? "text-danger" : "text-muted-foreground"}`}>
                    {overdue ? "Overdue · " : ""}
                    {r.dueDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
