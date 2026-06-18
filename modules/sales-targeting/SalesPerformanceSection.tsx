"use client";

import { useMemo, useState } from "react";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  computeSalesPerformanceOverview,
  getCurrentOrgQuarter,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";
import { cn } from "@/lib/utils";
import { SectionShell, SimpleProgressList } from "@/modules/sales-targeting/shared";

type Level = "company" | "departments" | "teams" | "persons";

const levels: { id: Level; label: string }[] = [
  { id: "company", label: "Company" },
  { id: "departments", label: "Departments" },
  { id: "teams", label: "Teams" },
  { id: "persons", label: "Reps" },
];

export function SalesPerformanceSection({
  settings,
  leads,
}: {
  settings: LeadTargetingSettings;
  leads: CrmLead[];
}) {
  const [level, setLevel] = useState<Level>("company");

  const overview = useMemo(
    () => computeSalesPerformanceOverview(settings, leads, getCurrentOrgQuarter()),
    [settings, leads],
  );

  const companyTarget = overview.company.reduce((sum, row) => sum + row.target, 0);
  const companyAchieved = overview.company.reduce((sum, row) => sum + row.achieved, 0);
  const companyPct =
    companyTarget > 0 ? Math.round((companyAchieved / companyTarget) * 100) : 0;

  const activeRows = overview[level];

  return (
    <SectionShell
      title="Sales performance"
      description="Contract-signed leads vs targets for the current quarter."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
        <p className="text-sm text-[#6b7280]">
          Q{overview.q} · FY {overview.fiscalYear}
        </p>
        <p className="text-lg font-semibold tabular-nums text-[#4080f0]">{companyPct}%</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#e5e7eb] px-4 py-2">
        {levels.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLevel(item.id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              level === item.id
                ? "bg-[#eef2fd] text-[#4080f0]"
                : "text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#374151]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <SimpleProgressList rows={activeRows} />
    </SectionShell>
  );
}
