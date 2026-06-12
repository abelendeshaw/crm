"use client";

import { useMemo } from "react";
import { Target } from "lucide-react";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  computeTeamQuarterKpis,
  formatCompactMoney,
  hasOrgSalesTargets,
  type LeadTargetingSettings,
  type TeamQuarterKpi,
  type TeamQuarterKpiTeam,
} from "@/data/leadsTargetsData";

function TeamQuarterKpiTile({ team }: { team: TeamQuarterKpiTeam }) {
  const primary = team.rows[0];

  return (
    <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3.5 sm:px-5 sm:py-4">
      <p className="truncate text-xs font-semibold text-[#1c1e21]">{team.teamName}</p>
      {team.rows.length === 1 && primary ? (
        <>
          <p className="mt-1 text-sm font-semibold text-[#1c1e21]">
            {formatCompactMoney(primary.achieved, primary.currency)}
            <span className="font-medium text-[#9ca3af]">
              {" "}
              / {formatCompactMoney(primary.target, primary.currency)}
            </span>
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#f0f0f5]">
              <div
                className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
                style={{ width: `${primary.pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-bold text-[#4080f0]">
              {primary.pct}%
            </span>
          </div>
        </>
      ) : (
        <div className="mt-2 space-y-2.5">
          {team.rows.map((row) => (
            <div key={row.currency}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                {row.currency}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#1c1e21]">
                {formatCompactMoney(row.achieved, row.currency)}
                <span className="font-medium text-[#9ca3af]">
                  {" "}
                  / {formatCompactMoney(row.target, row.currency)}
                </span>
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#f0f0f5]">
                  <div
                    className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] font-bold text-[#4080f0]">
                  {row.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuarterlyTargetKpiCard({ q, fiscalYear, teams }: TeamQuarterKpi) {
  return (
    <div className="w-full rounded-lg border border-[#e5e7eb] bg-white px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-md bg-[#ecfdf5] p-2">
            <Target size={16} className="text-[#16a34a]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#6b7280]">
              Q{q} Sales Target · FY {fiscalYear}
            </p>
            <p className="text-sm font-medium text-[#374151]">
              Progress by sales team for the current quarter
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamQuarterKpiTile key={team.teamName} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyQuarterlyTargetCard() {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-5 py-4">
      <div className="shrink-0 rounded-md bg-[#ecfdf5] p-2">
        <Target size={16} className="text-[#16a34a]" />
      </div>
      <div>
        <p className="text-xs text-[#6b7280]">Quarterly Sales Target</p>
        <p className="text-base font-semibold text-[#1c1e21]">Not configured</p>
        <p className="mt-0.5 text-[11px] text-[#9ca3af]">
          Set quarterly targets in Leads Settings → Targeting
        </p>
      </div>
    </div>
  );
}

export function LeadsPipelineKpiCards({
  leads,
  targetingSettings,
}: {
  leads: CrmLead[];
  targetingSettings: LeadTargetingSettings;
}) {
  const teamQuarterKpi = useMemo(() => {
    if (!hasOrgSalesTargets(targetingSettings)) return null;
    return computeTeamQuarterKpis(targetingSettings, leads);
  }, [leads, targetingSettings]);

  return (
    <div className="w-full">
      {teamQuarterKpi ? (
        <QuarterlyTargetKpiCard {...teamQuarterKpi} />
      ) : (
        <EmptyQuarterlyTargetCard />
      )}
    </div>
  );
}
