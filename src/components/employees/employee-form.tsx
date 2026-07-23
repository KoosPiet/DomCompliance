"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
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
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/server/actions/employee-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const EMPTY: EmployeeInput = {
  firstName: "",
  lastName: "",
  idNumber: "",
  passportNumber: "",
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
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const occupation = watch("occupation");

  function Field({
    name,
    label,
    children,
    optional,
    className,
  }: {
    name?: keyof EmployeeInput;
    label: string;
    children: ReactNode;
    optional?: boolean;
    className?: string;
  }) {
    const error = name ? errors[name] : undefined;
    return (
      <div className={cn("space-y-1.5", className)}>
        <Label>
          {label}
          {optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
        </Label>
        {children}
        {error && <p className="text-sm text-danger">{error.message as string}</p>}
      </div>
    );
  }

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
              {["1", "2", "3", "4", "5", "6", "7"].map((d) => (
                <option key={d} value={d}>
                  {d}
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
  );
}
