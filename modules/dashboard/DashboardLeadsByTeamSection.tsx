"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeTeamLeadSummaries } from "@/data/dashboardMetrics";
import type { PipelineStage } from "@/data/dealsManagementData";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  formatCompactMoney,
  getCurrentOrgQuarter,
  hasOrgSalesTargets,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";
import { LeadsPipelineKpiCards } from "@/modules/LeadsPipelineKpiCards";

const SALES_TEAM_BADGE_STYLES: Record<string, string> = {
  "Public and Telecom Sales":
    "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  "International and Corporate Sales":
    "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]",
  BFSI: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
};

function teamBadgeClass(team: string) {
  return (
    SALES_TEAM_BADGE_STYLES[team] ??
    "border-[#e5e7eb] bg-[#f9fafb] text-[#374151]"
  );
}

function stageCategoryColor(category: PipelineStage["category"]) {
  if (category === "won") return "bg-[#22c55e]";
  if (category === "lost") return "bg-[#ef4444]";
  return "bg-[#4080f0]";
}

function TeamLeadCard({
  summary,
  currentQuarter,
}: {
  summary: ReturnType<typeof computeTeamLeadSummaries>[number];
  currentQuarter: number;
}) {
  const maxStageCount = Math.max(1, ...summary.stageBreakdown.map((row) => row.count));

  return (
    <article className="flex flex-col rounded-lg border border-[#e5e7eb] bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
              teamBadgeClass(summary.teamName),
            )}
          >
            <span className="truncate">{summary.teamName}</span>
          </span>
          <p className="mt-2 text-[28px] font-semibold leading-none tabular-nums text-[#1c1e21]">
            {summary.total}
          </p>
          <p className="mt-1 text-[12px] text-[#6b7280]">Total leads</p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 text-right">
          <div className="rounded-md border border-[#eef1f6] bg-[#fafbfc] px-2.5 py-1.5">
            <p className="text-[15px] font-semibold tabular-nums text-[#1c1e21]">
              {summary.newThisQuarter}
            </p>
            <p className="text-[10px] text-[#9ca3af]">New Q{currentQuarter}</p>
          </div>
          <div className="rounded-md border border-[#eef1f6] bg-[#fafbfc] px-2.5 py-1.5">
            <p className="text-[15px] font-semibold tabular-nums text-[#1c1e21]">
              {summary.newThisMonth}
            </p>
            <p className="text-[10px] text-[#9ca3af]">New month</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#f3f4f6] pt-4">
        <div>
          <p className="text-[16px] font-semibold tabular-nums text-[#1c1e21]">
            {summary.openCount}
          </p>
          <p className="text-[11px] text-[#9ca3af]">Open</p>
        </div>
        <div>
          <p className="text-[16px] font-semibold tabular-nums text-[#16a34a]">
            {summary.wonCount}
          </p>
          <p className="text-[11px] text-[#9ca3af]">Won</p>
        </div>
        <div>
          <p className="text-[16px] font-semibold tabular-nums text-[#dc2626]">
            {summary.lostCount}
          </p>
          <p className="text-[11px] text-[#9ca3af]">Lost</p>
        </div>
      </div>

      {summary.openCount > 0 ? (
        <div className="mt-4 rounded-md border border-[#eef1f6] bg-[#fafbfc] px-3 py-2.5">
          <p className="text-[11px] font-medium text-[#6b7280]">Open pipeline</p>
          <div className="mt-1.5 space-y-1">
            {summary.openPipelineByCurrency.length > 0 ? (
              summary.openPipelineByCurrency.map((row) => (
                <p
                  key={row.currency}
                  className="text-[13px] font-semibold tabular-nums text-[#1c1e21]"
                >
                  {formatCompactMoney(row.amount, row.currency)}
                </p>
              ))
            ) : (
              <p className="text-[12px] text-[#9ca3af]">No open value</p>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-[#9ca3af]">
            Avg probability {summary.avgOpenProbability}%
          </p>
        </div>
      ) : null}

      {summary.contractSignedThisQuarter.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-[#6b7280]">
            Contract signed · Q{currentQuarter}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {summary.contractSignedThisQuarter.map((row) => (
              <span
                key={row.currency}
                className="text-[12px] font-semibold tabular-nums text-[#4080f0]"
              >
                {formatCompactMoney(row.amount, row.currency)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {summary.stageBreakdown.length > 0 ? (
        <div className="mt-4 border-t border-[#f3f4f6] pt-4">
          <p className="text-[11px] font-medium text-[#6b7280]">By stage</p>
          <div className="mt-2 space-y-2">
            {summary.stageBreakdown.map((row) => (
              <div key={row.stageName}>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-[#374151]">{row.stageName}</span>
                  <span className="shrink-0 tabular-nums text-[#9ca3af]">{row.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eef2fd]">
                  <div
                    className={cn("h-full rounded-full", stageCategoryColor(row.category))}
                    style={{ width: `${(row.count / maxStageCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {summary.topOwners.length > 0 ? (
        <div className="mt-4 border-t border-[#f3f4f6] pt-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#6b7280]">
            <Users size={12} />
            Top owners
          </p>
          <ul className="mt-2 space-y-1.5">
            {summary.topOwners.map((owner) => (
              <li
                key={owner.name}
                className="flex items-center justify-between gap-2 text-[12px]"
              >
                <span className="truncate text-[#374151]">{owner.name}</span>
                <span className="shrink-0 tabular-nums text-[#9ca3af]">
                  {owner.count} lead{owner.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function DashboardLeadsByTeamSection({
  leads,
  stages,
  targetingSettings,
}: {
  leads: CrmLead[];
  stages: PipelineStage[];
  targetingSettings: LeadTargetingSettings;
}) {
  const currentQuarter = getCurrentOrgQuarter();
  const hasTargets = hasOrgSalesTargets(targetingSettings);

  const teamSummaries = useMemo(
    () => computeTeamLeadSummaries(leads, stages),
    [leads, stages],
  );

  const teamsWithLeads = teamSummaries.filter((summary) => summary.total > 0);

  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1c1e21]">Leads by team</p>
            <p className="mt-0.5 text-[12px] text-[#6b7280]">
              Pipeline volume, stage mix, and ownership across sales teams
            </p>
          </div>
          <Link
            href="/leads"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-3 text-[11px] font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            View all leads
            <ArrowUpRight size={12} />
          </Link>
        </div>

        {teamsWithLeads.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {teamsWithLeads.map((summary) => (
              <TeamLeadCard
                key={summary.teamName}
                summary={summary}
                currentQuarter={currentQuarter}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#e5e7eb] bg-[#fafbfc] px-4 py-8 text-center">
            <p className="text-sm font-medium text-[#374151]">No leads assigned to teams yet</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">
              Create leads and assign a sales team to see breakdowns here.
            </p>
            <Link
              href="/leads"
              className="mt-4 inline-flex h-9 items-center rounded-md bg-[#4080f0] px-4 text-xs font-medium text-white hover:bg-[#3070e0]"
            >
              Go to leads
            </Link>
          </div>
        )}

        {hasTargets ? (
          <div className="space-y-3 border-t border-[#f3f4f6] pt-6">
            <div>
              <p className="text-sm font-semibold text-[#1c1e21]">
                Q{currentQuarter} lead targets
              </p>
              <p className="mt-0.5 text-[12px] text-[#6b7280]">
                Contract-signed revenue vs quarterly targets by team
              </p>
            </div>
            <LeadsPipelineKpiCards leads={leads} targetingSettings={targetingSettings} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
