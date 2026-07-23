"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logLeaveSchema, LEAVE_TYPES, type LogLeaveInput } from "@/lib/validations/leave";
import { logLeaveAction } from "@/server/actions/leave-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Count Mon–Fri days in an inclusive date range (a sensible default). */
function weekdaysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function LeaveForm({
  employees,
  defaultEmployeeId,
}: {
  employees: { id: string; name: string }[];
  defaultEmployeeId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LogLeaveInput>({
    resolver: zodResolver(logLeaveSchema),
    defaultValues: {
      employeeId: defaultEmployeeId ?? employees[0]?.id ?? "",
      leaveType: "ANNUAL",
      startDate: "",
      endDate: "",
      days: "",
      reason: "",
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const days = watch("days");
  useEffect(() => {
    if (startDate && endDate && !days) {
      const suggested = weekdaysBetween(startDate, endDate);
      if (suggested > 0) setValue("days", String(suggested));
    }
  }, [startDate, endDate, days, setValue]);

  function onSubmit(values: LogLeaveInput) {
    startTransition(async () => {
      const res = await logLeaveAction(values);
      if (res && !res.ok) {
        if (res.fieldErrors) {
          for (const [field, messages] of Object.entries(res.fieldErrors)) {
            if (messages?.[0]) setError(field as keyof LogLeaveInput, { message: messages[0] });
          }
        }
        toast.error(res.message);
      }
    });
  }

  function Field({ name, label, children, className }: { name?: keyof LogLeaveInput; label: string; children: ReactNode; className?: string }) {
    const error = name ? errors[name] : undefined;
    return (
      <div className={cn("space-y-1.5", className)}>
        <Label>{label}</Label>
        {children}
        {error && <p className="text-sm text-danger">{error.message as string}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="employeeId" label="Employee">
            <select className={selectClass} {...register("employeeId")}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <Field name="leaveType" label="Leave type">
            <select className={selectClass} {...register("leaveType")}>
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field name="startDate" label="From">
            <Input type="date" {...register("startDate")} />
          </Field>
          <Field name="endDate" label="To">
            <Input type="date" {...register("endDate")} />
          </Field>
          <Field name="days" label="Days (working days taken)">
            <Input inputMode="decimal" placeholder="e.g. 3" {...register("days")} />
          </Field>
        </div>
        <Field name="reason" label="Reason (optional)">
          <Textarea rows={2} {...register("reason")} placeholder="e.g. Family visit" />
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Log leave
        </Button>
        <Button asChild variant="ghost" className="h-11">
          <Link href="/leave">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
