"use client";

import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Form field wrapper. Reads validation errors from the react-hook-form context,
 * so it must be rendered inside a <FormProvider>.
 *
 * Defined once at module scope on purpose: the forms previously declared an
 * inline `Field` component inside the form function, which is recreated on
 * every parent render. React treats each recreation as a brand-new element
 * type and remounts the input — dropping focus/cursor after every keystroke
 * whenever the form re-renders (e.g. live payslip preview via watch()).
 */
export function Field({
  name,
  label,
  children,
  optional,
  className,
}: {
  name?: string;
  label: string;
  children: ReactNode;
  optional?: boolean;
  className?: string;
}) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = name ? errors[name as keyof typeof errors] : undefined;
  const message = typeof error?.message === "string" ? error.message : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {message && <p className="text-sm text-danger">{message}</p>}
    </div>
  );
}
