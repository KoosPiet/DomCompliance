"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logLeaveSchema, LEAVE_TYPES, type LogLeaveInput } from "@/lib/validations/leave";
import { logLeaveAction, updateLeaveAction } from "@/server/actions/leave-actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  mode = "create",
  leaveId,
  defaultValues,
}: {
  employees: { id: string; name: string }[];
  defaultEmployeeId?: string;
  mode?: "create" | "edit";
  leaveId?: string;
  defaultValues?: Partial<LogLeaveInput>;
}) {
  const [pending, startTransition] = useTransition();
  const methods = useForm<LogLeaveInput>({
    resolver: zodResolver(logLeaveSchema),
    defaultValues: {
      employeeId: defaultEmployeeId ?? employees[0]?.id ?? "",
      leaveType: "ANNUAL",
      startDate: "",
      endDate: "",
      days: "",
      reason: "",
      ...defaultValues,
    },
  });
  const { register, handleSubmit, watch, setValue, setError, getValues } = methods;

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  // Single-day convenience: picking "From" fills "To" with the same date when
  // it's empty or now before the start — 24 to 24 July is one day of leave.
  const prevStartRef = useRef(startDate);
  useEffect(() => {
    if (prevStartRef.current === startDate) return;
    prevStartRef.current = startDate;
    if (!startDate) return;
    const currentEnd = getValues("endDate");
    if (!currentEnd || new Date(currentEnd) < new Date(startDate)) {
      setValue("endDate", startDate);
    }
  }, [startDate, getValues, setValue]);

  // Suggest working days when the range changes — but never fight the user:
  // once they've typed in the days field (e.g. 0.5 for a half day), leave it.
  const daysTouched = useRef(mode === "edit");
  const prevRangeRef = useRef(`${startDate}|${endDate}`);
  useEffect(() => {
    const range = `${startDate}|${endDate}`;
    if (prevRangeRef.current === range) return;
    prevRangeRef.current = range;
    if (daysTouched.current || !startDate || !endDate) return;
    const suggested = weekdaysBetween(startDate, endDate);
    if (suggested > 0) setValue("days", String(suggested));
  }, [startDate, endDate, setValue]);

  function onSubmit(values: LogLeaveInput) {
    startTransition(async () => {
      const res =
        mode === "edit"
          ? await updateLeaveAction(leaveId!, values)
          : await logLeaveAction(values);
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

  const daysField = register("days");

  return (
    <FormProvider {...methods}>
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
            <Field name="days" label="Days taken (0.5 = half day)">
              <Input
                inputMode="decimal"
                placeholder="e.g. 1 or 0.5"
                {...daysField}
                onChange={(e) => {
                  daysTouched.current = true;
                  void daysField.onChange(e);
                }}
              />
            </Field>
          </div>
          <Field name="reason" label="Reason (optional)">
            <Textarea rows={2} {...register("reason")} placeholder="e.g. Family visit" />
          </Field>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="h-11">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {mode === "edit" ? "Save changes" : "Log leave"}
          </Button>
          <Button asChild variant="ghost" className="h-11">
            <Link href="/leave">Cancel</Link>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
