"use client";

import { Controller, useFormContext } from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";

/**
 * react-hook-form binding for the DatePicker. Must be rendered inside a
 * <FormProvider>. Stores dates as "yyyy-MM-dd" strings, exactly like the
 * native date inputs it replaces.
 */
export function DateField({
  name,
  fromYear,
  toYear,
  placeholder,
  id,
}: {
  name: string;
  fromYear?: number;
  toYear?: number;
  placeholder?: string;
  id?: string;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <DatePicker
          id={id}
          value={(field.value as string) ?? ""}
          onChange={field.onChange}
          fromYear={fromYear}
          toYear={toYear}
          placeholder={placeholder}
        />
      )}
    />
  );
}
