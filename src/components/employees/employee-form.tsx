"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  employeeSchema,
  OCCUPATIONS,
  PAY_FREQUENCIES,
  type EmployeeInput,
} from "@/lib/validations/employee";
import { SA_PROVINCES } from "@/lib/validations/employer";
import { annualLeaveEntitlement } from "@/domain/leave/accrual";
import { LEAVE } from "@/domain/constants";
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/server/actions/employee-actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const EMPTY: EmployeeInput = {
  firstName: "",
  lastName: "",
  idNumber: "",
  passportNumber: "",
  workPermitNumber: "",
  phone: "",
  whatsapp: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
  occupation: "DOMESTIC_WORKER",
  otherOccupation: "",
  startDate: "",
  salary: "",
  payFrequency: "MONTHLY",
  workingDaysPerWeek: "5",
  ordinaryHoursDay: "9",
  scheduleNote: "",
  bankName: "",
  bankAccountHolder: "",
  bankAccountNumber: "",
  bankBranchCode: "",
  bankAccountType: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  notes: "",
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

/** Days-per-week options. Many domestic workers are part-time — 1, 2 or 3 days
 *  a week — so leave must scale to their actual schedule. */
const DAY_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1 day / week" },
  { value: "2", label: "2 days / week" },
  { value: "3", label: "3 days / week" },
  { value: "4", label: "4 days / week" },
  { value: "5", label: "5 days / week (full-time)" },
  { value: "6", label: "6 days / week" },
  { value: "7", label: "7 days / week" },
];

function LeaveStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export function EmployeeForm({
  mode,
  employeeId,
  defaultValues,
}: {
  mode: "create" | "edit";
  employeeId?: string;
  defaultValues?: Partial<EmployeeInput>;
}) {
  const [pending, startTransition] = useTransition();
  const methods = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });
  const { register, handleSubmit, watch, setError } = methods;

  const occupation = watch("occupation");

  // Live statutory-leave preview, scaled to the chosen days-per-week (BCEA).
  const workingDaysPerWeek =
    Number.parseInt(watch("workingDaysPerWeek") ?? "5", 10) || 5;
  const annualLeaveDays = annualLeaveEntitlement(workingDaysPerWeek);
  const sickLeaveDays = workingDaysPerWeek * LEAVE.SICK_WEEKS_PER_CYCLE;
  const familyResponsibilityEligible =
    workingDaysPerWeek >= LEAVE.FAMILY_RESPONSIBILITY_MIN_DAYS_PER_WEEK;

  function onSubmit(values: EmployeeInput) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createEmployeeAction(values)
          : await updateEmployeeAction(employeeId!, values);

      // Success redirects server-side; only failures return here.
      if (res && !res.ok) {
        if (res.fieldErrors) {
          for (const [field, messages] of Object.entries(res.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof EmployeeInput, { message: messages[0] });
            }
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

  return (
    <FormProvider {...methods}>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* Personal */}
      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <SectionTitle>Personal details</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="firstName" label="First name">
            <Input {...register("firstName")} placeholder="e.g. Grace" />
          </Field>
          <Field name="lastName" label="Surname">
            <Input {...register("lastName")} placeholder="e.g. Ndlovu" />
          </Field>
          <Field name="idNumber" label="SA ID number" optional>
            <Input {...register("idNumber")} inputMode="numeric" placeholder="13 digits" />
          </Field>
          <Field name="passportNumber" label="Passport number" optional>
            <Input {...register("passportNumber")} placeholder="If no SA ID" />
          </Field>
          <Field name="workPermitNumber" label="Work permit number" optional>
            <Input
              {...register("workPermitNumber")}
              placeholder="For foreign nationals"
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          ID, passport and bank account numbers are encrypted at rest (AES-256).
        </p>
      </section>

      {/* Contact */}
      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <SectionTitle>Contact</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="phone" label="Phone" optional>
            <Input {...register("phone")} type="tel" placeholder="082 123 4567" />
          </Field>
          <Field name="whatsapp" label="WhatsApp" optional>
            <Input {...register("whatsapp")} type="tel" placeholder="For payslip delivery" />
          </Field>
          <Field name="email" label="Email" optional>
            <Input {...register("email")} type="email" />
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <SectionTitle>Address</SectionTitle>
        <div className="grid gap-4">
          <Field name="addressLine1" label="Street address" optional>
            <Input {...register("addressLine1")} />
          </Field>
          <Field name="addressLine2" label="Suburb / complex" optional>
            <Input {...register("addressLine2")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="city" label="City / town" optional>
              <Input {...register("city")} />
            </Field>
            <Field name="province" label="Province" optional>
              <select className={selectClass} {...register("province")}>
                <option value="">Select…</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="postalCode" label="Postal code" optional>
              <Input {...register("postalCode")} inputMode="numeric" />
            </Field>
          </div>
        </div>
      </section>

      {/* Employment */}
      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <SectionTitle>Employment</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="occupation" label="Occupation">
            <select className={selectClass} {...register("occupation")}>
              {OCCUPATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {occupation === "OTHER" && (
            <Field name="otherOccupation" label="Specify occupation">
              <Input {...register("otherOccupation")} placeholder="e.g. Au pair" />
            </Field>
          )}
          <Field name="startDate" label="Start date">
            <Input {...register("startDate")} type="date" />
          </Field>
          <Field name="salary" label="Salary (ZAR)">
            <Input {...register("salary")} inputMode="decimal" placeholder="4500.00" />
          </Field>
          <Field name="payFrequency" label="Pay frequency">
            <select className={selectClass} {...register("payFrequency")}>
              {PAY_FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field name="workingDaysPerWeek" label="Working days / week">
            <select className={selectClass} {...register("workingDaysPerWeek")}>
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field name="ordinaryHoursDay" label="Ordinary hours / day">
            <Input {...register("ordinaryHoursDay")} inputMode="decimal" placeholder="9" />
          </Field>
          <Field name="scheduleNote" label="Schedule note" optional className="sm:col-span-2">
            <Input {...register("scheduleNote")} placeholder="e.g. Mon–Fri 08:00–17:00" />
          </Field>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium">
            Statutory leave for a {workingDaysPerWeek}-day week
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Calculated automatically from the days above. The BCEA scales leave
            to how many days a week the worker actually works, so a part-time
            worker earns proportionally less than a full-time one.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <LeaveStat
              label="Annual leave"
              value={`${annualLeaveDays} days`}
              sub="per year"
            />
            <LeaveStat
              label="Sick leave"
              value={`${sickLeaveDays} days`}
              sub="per 3-year cycle"
            />
            <LeaveStat
              label="Family responsibility"
              value={familyResponsibilityEligible ? "3 days" : "Not eligible"}
              sub={
                familyResponsibilityEligible
                  ? "per year"
                  : "needs 4+ days / week"
              }
            />
          </div>
        </div>
      </section>

      {/* Banking */}
      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <SectionTitle>Banking (for payslips)</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="bankName" label="Bank" optional>
            <Input {...register("bankName")} placeholder="e.g. Capitec" />
          </Field>
          <Field name="bankAccountHolder" label="Account holder" optional>
            <Input {...register("bankAccountHolder")} />
          </Field>
          <Field name="bankAccountNumber" label="Account number" optional>
            <Input {...register("bankAccountNumber")} inputMode="numeric" />
          </Field>
          <Field name="bankBranchCode" label="Branch code" optional>
            <Input {...register("bankBranchCode")} inputMode="numeric" />
          </Field>
          <Field name="bankAccountType" label="Account type" optional>
            <Input {...register("bankAccountType")} placeholder="e.g. Savings" />
          </Field>
        </div>
      </section>

      {/* Emergency + notes */}
      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <SectionTitle>Emergency contact & notes</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="emergencyName" label="Contact name" optional>
            <Input {...register("emergencyName")} />
          </Field>
          <Field name="emergencyPhone" label="Contact phone" optional>
            <Input {...register("emergencyPhone")} type="tel" />
          </Field>
          <Field name="emergencyRelationship" label="Relationship" optional>
            <Input {...register("emergencyRelationship")} placeholder="e.g. Sister" />
          </Field>
        </div>
        <Field name="notes" label="Notes" optional>
          <Textarea {...register("notes")} rows={3} placeholder="Anything worth remembering…" />
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Add employee" : "Save changes"}
        </Button>
        <Button asChild variant="ghost" className="h-11">
          <Link href={mode === "edit" && employeeId ? `/employees/${employeeId}` : "/employees"}>
            Cancel
          </Link>
        </Button>
      </div>
    </form>
    </FormProvider>
  );
}
