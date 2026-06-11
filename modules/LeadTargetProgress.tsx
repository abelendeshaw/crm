"use client";

import { cn } from "@/lib/utils";
import type { DealCurrency } from "@/data/dealsManagementData";
import {
  computeLeadTargetPct,
  formatTargetMoney,
  targetProgressTextColor,
} from "@/data/leadsTargetsData";

type LeadTargetFields = {
  salesTarget?: number;
  targetAchieved?: number;
};

export function getLeadTargetProgress(lead: LeadTargetFields) {
  if (lead.salesTarget == null || lead.salesTarget <= 0) return null;
  const achieved = lead.targetAchieved ?? 0;
  const pct = computeLeadTargetPct(achieved, lead.salesTarget);
  const remaining = Math.max(0, lead.salesTarget - achieved);
  return { achieved, pct, remaining, target: lead.salesTarget };
}

export function LeadTargetProgressBar({
  lead,
  currency,
  compact = false,
}: {
  lead: LeadTargetFields;
  currency: DealCurrency;
  compact?: boolean;
}) {
  const progress = getLeadTargetProgress(lead);
  if (!progress) return null;

  const fmt = (v: number) => formatTargetMoney(v, currency);

  return (
    <div className={cn("space-y-1", compact ? "pt-1" : "pt-2")}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[#6b7280]", compact ? "text-[10px]" : "text-[11px]")}>
          {fmt(progress.achieved)} of {fmt(progress.target)}
        </span>
        <span
          className={cn(
            "font-bold",
            compact ? "text-[11px]" : "text-[12px]",
            targetProgressTextColor(progress.pct),
          )}
        >
          {progress.pct}%
        </span>
      </div>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-[#f0f0f5]",
          compact ? "h-1.5" : "h-2",
        )}
      >
        <div
          className="h-full rounded-full bg-[#4080f0] transition-all"
          style={{ width: `${progress.pct}%` }}
        />
      </div>
    </div>
  );
}
