"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const segmentedControlListClassName =
  "inline-flex h-auto w-fit max-w-full flex-wrap gap-1 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-1";

export const segmentedControlTriggerClassName =
  "inline-flex h-auto min-w-[5rem] flex-none items-center justify-center gap-1.5 rounded-md border-transparent px-4 py-2 text-sm font-medium whitespace-nowrap shadow-none transition-colors outline-none after:hidden disabled:pointer-events-none disabled:opacity-50 text-[#6b7280] hover:bg-white/70 hover:text-[#374151] data-[state=active]:bg-white data-[state=active]:text-[#4080f0] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[#e5e7eb]";

export function SegmentedControl<T>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  className,
  size = "default",
}: {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => ReactNode;
  className?: string;
  size?: "default" | "sm";
}) {
  const activeKey = getKey(value);

  return (
    <div className={cn(segmentedControlListClassName, className)} role="tablist">
      {items.map((item) => {
        const key = getKey(item);
        const selected = key === activeKey;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item)}
            className={cn(
              segmentedControlTriggerClassName,
              size === "sm" && "min-w-[4.5rem] px-3 py-1.5 text-xs",
              selected && "bg-white text-[#4080f0] shadow-sm ring-1 ring-[#e5e7eb]",
            )}
          >
            {getLabel(item)}
          </button>
        );
      })}
    </div>
  );
}
