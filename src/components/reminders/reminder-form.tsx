"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  reminderSchema,
  REMINDER_TYPES,
  REMINDER_FREQUENCIES,
  reminderTypeLabel,
  type ReminderInput,
} from "@/lib/validations/reminder";
import {
  createReminderAction,
  updateReminderAction,
} from "@/server/actions/reminder-actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const DEFAULT_FREQUENCY: Record<string, ReminderInput["frequency"]> = {
  SUBMIT_UIF: "MONTHLY",
  GENERATE_PAYSLIP: "MONTHLY",
  PAY_SALARY: "MONTHLY",
  SALARY_REVIEW: "ANNUALLY",
  CONTRACT_RENEWAL: "ANNUALLY",
  CUSTOM: "ONCE",
};

export function ReminderForm({
  mode = "create",
  reminderId,
  defaultValues,
}: {
  mode?: "create" | "edit";
  reminderId?: string;
  defaultValues?: Partial<ReminderInput>;
}) {
  const [pending, startTransition] = useTransition();
  const titleTouched = useRef(mode === "edit");
  const methods = useForm<ReminderInput>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: "SUBMIT_UIF",
      title: reminderTypeLabel("SUBMIT_UIF"),
      description: "",
      dueDate: "",
      frequency: "MONTHLY",
      channelEmail: true,
      channelWhatsapp: false,
      ...defaultValues,
    },
  });
  const { register, handleSubmit, watch, setValue, setError } = methods;

  // Auto-suggest frequency/title only when the user actually changes the type —
  // never on mount, which would overwrite loaded values in edit mode.
  const type = watch("type");
  const title = watch("title");
  const prevTypeRef = useRef(type);
  useEffect(() => {
    if (prevTypeRef.current === type) return;
    prevTypeRef.current = type;
    setValue("frequency", DEFAULT_FREQUENCY[type] ?? "ONCE");
    if (!titleTouched.current && type !== "CUSTOM") {
      setValue("title", reminderTypeLabel(type));
    }
  }, [type, setValue]);

  function onSubmit(values: ReminderInput) {
    startTransition(async () => {
      const res =
        mode === "edit"
          ? await updateReminderAction(reminderId!, values)
          : await createReminderAction(values);
      if (res && !res.ok) {
        if (res.fieldErrors) {
          for (const [field, messages] of Object.entries(res.fieldErrors)) {
            if (messages?.[0]) setError(field as keyof ReminderInput, { message: messages[0] });
          }
        }
        toast.error(res.message);
      }
    });
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="type" label="Type">
              <select className={selectClass} {...register("type")}>
                {REMINDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="frequency" label="Repeats">
              <select className={selectClass} {...register("frequency")}>
                {REMINDER_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field name="title" label="Title">
            <Input
              value={title}
              onChange={(e) => {
                titleTouched.current = true;
                setValue("title", e.target.value);
              }}
            />
          </Field>
          <Field name="description" label="Description (optional)">
            <Textarea rows={2} {...register("description")} />
          </Field>
          <Field name="dueDate" label="Next due">
            <Input type="date" {...register("dueDate")} />
          </Field>
          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...register("channelEmail")} />
              Email me
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...register("channelWhatsapp")} />
              WhatsApp me (when connected)
            </label>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="h-11">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {mode === "edit" ? "Save changes" : "Add reminder"}
          </Button>
          <Button asChild variant="ghost" className="h-11">
            <Link href="/reminders">Cancel</Link>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
