"use client";

import { useMemo } from "react";
import { Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CrmDeal, PipelineStage } from "@/data/dealsManagementData";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  QUARTERLY_KPI_TILE_HEIGHT_CLASS,
  TeamQuarterKpiTile,
} from "@/components/kpi/kpi-tile";
import {
  computeCurrentQuarterOverallPct,
  computeDealTeamQuarterKpis,
  computeLeadTargetPct,
  computeTeamQuarterKpis,
  hasOrgSalesTargets,
  type CurrentQuarterKpiRow,
  type LeadTargetingSettings,
  type TeamQuarterKpi,
  type TeamQuarterKpiTeam,
} from "@/data/leadsTargetsData";

export { QUARTERLY_KPI_TILE_HEIGHT_CLASS };

function computeOverallRowsByCurrency(teams: TeamQuarterKpiTeam[]) {
  const byCurrency = new Map<
    CurrentQuarterKpiRow["currency"],
    { achieved: number; target: number }
  >();

  for (const team of teams) {
    for (const row of team.rows) {
      const totals = byCurrency.get(row.currency) ?? { achieved: 0, target: 0 };
      byCurrency.set(row.currency, {
        achieved: totals.achieved + row.achieved,
        target: totals.target + row.target,
      });
    }
  }

  return sortTeamRows(
    [...byCurrency.entries()].map(([currency, totals]) => ({
      currency,
      achieved: totals.achieved,
      target: totals.target,
      pct: computeLeadTargetPct(totals.achieved, totals.target),
      remaining: Math.max(0, totals.target - totals.achieved),
    })),
  );
}

const SAMPLE_USD_ROW: CurrentQuarterKpiRow = {
  currency: "USD",
  target: 500_000,
  achieved: 180_000,
  pct: 36,
  remaining: 320_000,
};

function withSampleMultiCurrencyTeam(teams: TeamQuarterKpiTeam[]): TeamQuarterKpiTeam[] {
  return teams.map((team) => {
    if (team.teamName !== "Public and Telecom Sales") return team;
    if (team.rows.some((row) => row.currency === "USD")) return team;

    const rows = sortTeamRows([...team.rows, SAMPLE_USD_ROW]);
    return {
      ...team,
      rows,
      overallPct: computeCurrentQuarterOverallPct(rows),
    };
  });
}

function sortTeamRows(rows: CurrentQuarterKpiRow[]) {
  return [...rows].sort((a, b) => {
    if (a.currency === "ETB") return -1;
    if (b.currency === "ETB") return 1;
    return a.currency.localeCompare(b.currency);
  });
}

function QuarterlyTargetKpiCard({ q, fiscalYear, teams }: TeamQuarterKpi) {
  const summaryTeam = useMemo((): TeamQuarterKpiTeam => {
    const rows = computeOverallRowsByCurrency(teams);
    return {
      teamName: "Overall",
      rows,
      overallPct: computeCurrentQuarterOverallPct(rows),
    };
  }, [teams]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <TeamQuarterKpiTile
          team={summaryTeam}
          title={`Q${q} Sales Target · FY ${fiscalYear}`}
        />

        {teams.map((team) => (
          <TeamQuarterKpiTile key={team.teamName} team={team} />
        ))}
      </div>
    </div>
  );
}

function EmptyQuarterlyTargetCard({ hint }: { hint: string }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#eef2f8] px-5 py-4">
      <div className="shrink-0 rounded-md bg-[#22c55e] p-2">
        <Target size={16} className="text-[#14532d]" strokeWidth={2.25} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1c1e21]">
          Quarterly Sales Target
        </p>
        <p className="mt-1 text-base font-semibold text-[#1c1e21]">Not configured</p>
        <p className="mt-0.5 text-[11px] text-[#9ca3af]">{hint}</p>
      </div>
    </div>
  );
}

function QuarterlyTargetKpiSection({
  teamQuarterKpi,
  emptyHint,
}: {
  teamQuarterKpi: TeamQuarterKpi | null;
  emptyHint: string;
}) {
  return (
    <div className="w-full">
      {teamQuarterKpi ? (
        <QuarterlyTargetKpiCard {...teamQuarterKpi} />
      ) : (
        <EmptyQuarterlyTargetCard hint={emptyHint} />
      )}
    </div>
  );
}

export function QuarterlyTargetKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("w-full rounded-lg", QUARTERLY_KPI_TILE_HEIGHT_CLASS)}
        />
      ))}
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
    const kpi = computeTeamQuarterKpis(targetingSettings, leads);
    if (!kpi) return null;
    return {
      ...kpi,
      teams: withSampleMultiCurrencyTeam(kpi.teams),
    };
  }, [leads, targetingSettings]);

  return (
    <QuarterlyTargetKpiSection
      teamQuarterKpi={teamQuarterKpi}
      emptyHint="Set quarterly targets in Sales Targeting"
    />
  );
}

export function DealsPipelineKpiCards({
  deals,
  stages,
  targetingSettings,
}: {
  deals: CrmDeal[];
  stages: PipelineStage[];
  targetingSettings: LeadTargetingSettings;
}) {
  const wonStageIds = useMemo(
    () => new Set(stages.filter((stage) => stage.category === "won").map((stage) => stage.id)),
    [stages],
  );

  const teamQuarterKpi = useMemo(() => {
    if (!hasOrgSalesTargets(targetingSettings)) return null;
    const kpi = computeDealTeamQuarterKpis(targetingSettings, deals, wonStageIds);
    if (!kpi) return null;
    return {
      ...kpi,
      teams: withSampleMultiCurrencyTeam(kpi.teams),
    };
  }, [deals, targetingSettings, wonStageIds]);

  return (
    <QuarterlyTargetKpiSection
      teamQuarterKpi={teamQuarterKpi}
      emptyHint="Set quarterly targets in Sales Targeting"
    />
  );
}
