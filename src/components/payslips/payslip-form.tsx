"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import {
  payslipSchema,
  MONTHS,
  toAmount,
  type PayslipInput,
} from "@/lib/validations/payslip";
import { createPayslipAction } from "@/server/actions/payslip-actions";
import { calculatePayslip } from "@/domain/payroll/payslip";
import { formatZar } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export interface PayslipEmployeeOption {
  id: string;
  name: string;
  salary: string;
}

export function PayslipForm({
  employees,
  defaultEmployeeId,
}: {
  employees: PayslipEmployeeOption[];
  defaultEmployeeId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const salaryById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.salary])),
    [employees],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PayslipInput>({
    resolver: zodResolver(payslipSchema),
    defaultValues: {
      employeeId: defaultEmployeeId ?? employees[0]?.id ?? "",
      periodMonth: String(now.getMonth() === 0 ? 12 : now.getMonth()) as PayslipInput["periodMonth"],
      periodYear: String(now.getFullYear()),
      payDate: now.toISOString().slice(0, 10),
      basicSalary: defaultEmployeeId
        ? (salaryById[defaultEmployeeId] ?? "")
        : (employees[0]?.salary ?? ""),
      overtime: "",
      allowances: "",
      bonuses: "",
      otherEarnings: "",
      otherDeductions: "",
      applyUif: true,
      applyPaye: false,
      notes: "",
    },
  });

  const employeeId = watch("employeeId");
  useEffect(() => {
    const salary = salaryById[employeeId];
    if (salary) setValue("basicSalary", salary);
  }, [employeeId, salaryById, setValue]);

  // Live calculation preview.
  const w = watch();
  const preview = calculatePayslip({
    earnings: {
      basicSalary: toAmount(w.basicSalary),
      overtime: toAmount(w.overtime),
      allowances: toAmount(w.allowances),
      bonuses: toAmount(w.bonuses),
      otherEarnings: toAmount(w.otherEarnings),
    },
    deductions: { otherDeductions: toAmount(w.otherDeductions) },
    applyUif: w.applyUif,
    applyPaye: w.applyPaye,
  });

  function onSubmit(values: PayslipInput) {
    startTransition(async () => {
      const res = await createPayslipAction(values);
      if (res && !res.ok) {
        if (res.fieldErrors) {
          for (const [field, messages] of Object.entries(res.fieldErrors)) {
            if (messages?.[0]) setError(field as keyof PayslipInput, { message: messages[0] });
          }
        }
        toast.error(res.message, {
          action:
            res.code === "PLAN_LIMIT"
              ? { label: "Upgrade", onClick: () => (window.location.href = "/billing") }
              : undefined,
        });
      }
    });
  }

  function Field({ name, label, children, className }: { name?: keyof PayslipInput; label: string; children: ReactNode; className?: string }) {
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
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Employee & period
          </h2>
          <Field name="employeeId" label="Employee">
            <select className={selectClass} {...register("employeeId")}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="periodMonth" label="Month">
              <select className={selectClass} {...register("periodMonth")}>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="periodYear" label="Year">
              <select className={selectClass} {...register("periodYear")}>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="payDate" label="Pay date">
              <Input type="date" {...register("payDate")} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Earnings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="basicSalary" label="Basic salary">
              <Input inputMode="decimal" {...register("basicSalary")} />
            </Field>
            <Field name="overtime" label="Overtime">
              <Input inputMode="decimal" placeholder="0.00" {...register("overtime")} />
            </Field>
            <Field name="allowances" label="Allowances">
              <Input inputMode="decimal" placeholder="0.00" {...register("allowances")} />
            </Field>
            <Field name="bonuses" label="Bonuses">
              <Input inputMode="decimal" placeholder="0.00" {...register("bonuses")} />
            </Field>
            <Field name="otherEarnings" label="Other earnings" className="sm:col-span-2">
              <Input inputMode="decimal" placeholder="0.00" {...register("otherEarnings")} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Deductions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="otherDeductions" label="Other deductions (advances, etc.)" className="sm:col-span-2">
              <Input inputMode="decimal" placeholder="0.00" {...register("otherDeductions")} />
            </Field>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...register("applyUif")} />
              Deduct UIF (1%) — recommended for registered workers
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...register("applyPaye")} />
              Deduct PAYE (only if above the tax threshold)
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </h2>
          <Field name="notes" label="Notes (optional)">
            <Textarea rows={2} {...register("notes")} placeholder="Appears on the payslip" />
          </Field>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="h-11">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Generate payslip
          </Button>
          <Button asChild variant="ghost" className="h-11">
            <Link href="/payslips">Cancel</Link>
          </Button>
        </div>
      </form>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Live preview
        </h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          <Row label="Gross earnings" value={formatZar(preview.grossEarnings)} />
          <Row label="UIF (employee)" value={`− ${formatZar(preview.uifEmployee)}`} muted />
          <Row label="PAYE" value={`− ${formatZar(preview.paye)}`} muted />
          <Row label="Other deductions" value={`− ${formatZar(preview.otherDeductions)}`} muted />
          <div className="my-2 border-t" />
          <Row label="Net pay" value={formatZar(preview.netPay)} strong />
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Employer also contributes {formatZar(preview.uifEmployer)} UIF (not deducted).
        </p>
      </aside>
    </div>
  );
}

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-muted-foreground" : ""}>{label}</dt>
      <dd className={strong ? "text-base font-semibold" : muted ? "text-muted-foreground" : "font-medium"}>
        {value}
      </dd>
    </div>
  );
}
