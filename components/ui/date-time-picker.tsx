"use client";

import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function parseLocalValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Persist as local noon so timezone shifts don't move the calendar day. */
function toLocalDateValue(date: Date) {
  const local = new Date(date);
  local.setHours(12, 0, 0, 0);
  const offset = local.getTimezoneOffset() * 60_000;
  return new Date(local.getTime() - offset).toISOString().slice(0, 16);
}

function formatDisplay(date: Date | null) {
  if (!date) return "Pick a date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseLocalValue(value), [value]);

  function commit(next: Date | null) {
    onChange(next ? toLocalDateValue(next) : "");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={cn(
            "h-10 w-full justify-start gap-2 rounded-[10px] border border-border bg-background/60 px-3 text-left font-normal text-foreground hover:bg-secondary/80",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 text-stone" strokeWidth={1.5} />
          <span className="truncate">{formatDisplay(selected)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto min-w-[320px] rounded-[14px] border-border bg-card p-5 shadow-[0_20px_60px_rgba(20,20,19,0.14)]"
      >
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          onSelect={(day) => {
            if (!day) return;
            commit(day);
            setOpen(false);
          }}
          className="rounded-[12px] p-1 text-base [--cell-size:2.85rem] [&_[data-slot=calendar]]:gap-3 [&_.rdp-weekday]:text-[12px] [&_.rdp-weekday]:font-medium [&_button]:text-[15px]"
        />
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className="h-9 px-3 text-sm text-stone"
            onClick={() => {
              commit(null);
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 px-3 text-sm text-primary"
            onClick={() => {
              commit(new Date());
              setOpen(false);
            }}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
