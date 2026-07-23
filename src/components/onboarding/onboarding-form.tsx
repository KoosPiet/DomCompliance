"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  employerProfileSchema,
  SA_PROVINCES,
  type EmployerProfileInput,
} from "@/lib/validations/employer";
import { saveEmployerProfile } from "@/server/actions/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function OnboardingForm({
  defaultValues,
}: {
  defaultValues?: Partial<EmployerProfileInput>;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EmployerProfileInput>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues,
  });

  function onSubmit(values: EmployerProfileInput) {
    startTransition(async () => {
      const res = await saveEmployerProfile(values);
      // On success the action redirects; only errors return here.
      if (res && !res.ok) {
        if (res.fieldErrors) {
          for (const [field, messages] of Object.entries(res.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof EmployerProfileInput, {
                message: messages[0],
              });
            }
          }
        }
        toast.error(res.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="employerName">Employer name (as on contracts)</Label>
        <Input
          id="employerName"
          placeholder="e.g. Thandi Mokoena"
          {...register("employerName")}
        />
        {errors.employerName && (
          <p className="text-sm text-danger">{errors.employerName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Contact phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="e.g. 082 123 4567"
          {...register("phone")}
        />
        {errors.phone && <p className="text-sm text-danger">{errors.phone.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressLine1">Address</Label>
        <Input id="addressLine1" placeholder="Street address" {...register("addressLine1")} />
        <Input
          id="addressLine2"
          placeholder="Suburb / complex (optional)"
          className="mt-2"
          {...register("addressLine2")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="city">City / town</Label>
          <Input id="city" {...register("city")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="province">Province</Label>
          <select
            id="province"
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            )}
            defaultValue={defaultValues?.province ?? ""}
            {...register("province")}
          >
            <option value="">Select…</option>
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" {...register("postalCode")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="alternateEmail">Alternate email (optional)</Label>
        <Input id="alternateEmail" type="email" {...register("alternateEmail")} />
        {errors.alternateEmail && (
          <p className="text-sm text-danger">{errors.alternateEmail.message}</p>
        )}
      </div>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save and continue
      </Button>
    </form>
  );
}
