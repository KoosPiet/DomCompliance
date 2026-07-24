"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parse,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Monday-first weekday headers (SA convention). */
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const selectClass =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function parseIso(value?: string): Date | null {
  if (!value) return null;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : null;
}

/**
 * Date picker with separate month and year dropdowns, so jumping to a date
 * years away takes two clicks instead of endless month-arrow presses (the
 * native <input type="date"> calendar offers no fast year navigation).
 * Value is a "yyyy-MM-dd" string to stay drop-in compatible with the forms.
 */
export function DatePicker({
  value,
  onChange,
  fromYear,
  toYear,
  placeholder = "Pick a date",
  id,
  className,
}: {
  value?: string;
  onChange: (iso: string) => void;
  fromYear?: number;
  toYear?: number;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  const currentYear = new Date().getFullYear();
  const minYear = fromYear ?? currentYear - 40;
  const maxYear = toYear ?? currentYear + 5;

  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(selected ?? new Date());

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
      }),
    [viewMonth],
  );

  function openTo(openState: boolean) {
    if (openState) setViewMonth(parseIso(value) ?? new Date());
    setOpen(openState);
  }

  function pick(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={openTo}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          {selected ? format(selected, "d MMMM yyyy") : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        {/* Month + year jump controls */}
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Previous month"
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <select
              className={selectClass}
              aria-label="Month"
              value={viewMonth.getMonth()}
              onChange={(e) => setViewMonth((m) => setMonth(m, Number(e.target.value)))}
            >
              {MONTHS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              aria-label="Year"
              value={viewMonth.getFullYear()}
              onChange={(e) => setViewMonth((m) => setYear(m, Number(e.target.value)))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Next month"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Day grid */}
        <div className="mt-3 grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((d) => (
            <span key={d} className="py-1 text-xs font-medium text-muted-foreground">
              {d}
            </span>
          ))}
          {days.map((day) => {
            const inMonth = isSameMonth(day, viewMonth);
            const isSelected = selected ? isSameDay(day, selected) : false;
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => pick(day)}
                className={cn(
                  "size-8 rounded-md text-sm transition-colors hover:bg-muted",
                  !inMonth && "text-muted-foreground/40",
                  isToday(day) && !isSelected && "border border-primary/40",
                  isSelected &&
                    "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
