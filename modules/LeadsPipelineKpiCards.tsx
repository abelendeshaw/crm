"use client";

import { useMemo } from "react";
import { Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CrmDeal, PipelineStage } from "@/data/dealsManagementData";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  computeCurrentQuarterOverallPct,
  computeDealTeamQuarterKpis,
  computeLeadTargetPct,
  computeTeamQuarterKpis,
  formatCompactMoney,
  hasOrgSalesTargets,
  type CurrentQuarterKpiRow,
  type LeadTargetingSettings,
  type TeamQuarterKpi,
  type TeamQuarterKpiTeam,
} from "@/data/leadsTargetsData";

export const QUARTERLY_KPI_TILE_HEIGHT_CLASS = "h-[12.75rem]";

function sortTeamRows(rows: CurrentQuarterKpiRow[]) {
  return [...rows].sort((a, b) => {
    if (a.currency === "ETB") return -1;
    if (b.currency === "ETB") return 1;
    return a.currency.localeCompare(b.currency);
  });
}

function formatTeamLabel(teamName: string) {
  return teamName
    .replace("International", "Intl")
    .replace(" and ", " & ")
    .replace(/ Sales$/i, "");
}

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

function getKpiDensity(currencyCount: number): "comfortable" | "compact" | "dense" {
  if (currencyCount <= 1) return "comfortable";
  if (currencyCount === 2) return "compact";
  return "dense";
}

const KPI_DENSITY_STYLES = {
  comfortable: {
    achieved: { first: "text-[22px]", rest: "text-[15px]" },
    target: { first: "mt-2 text-[12px]", rest: "mt-1 text-[11px]" },
    bar: { first: "h-2.5", rest: "h-2" },
    pct: { first: "text-[12px]", rest: "text-[11px]" },
    block: { first: "", rest: "mt-2.5 border-t border-[#f3f4f6] pt-2.5" },
    progress: "mt-2",
  },
  compact: {
    achieved: { first: "text-[20px]", rest: "text-[14px]" },
    target: { first: "mt-1.5 text-[11px]", rest: "mt-1 text-[10px]" },
    bar: { first: "h-2", rest: "h-1.5" },
    pct: { first: "text-[11px]", rest: "text-[10px]" },
    block: { first: "", rest: "mt-2 border-t border-[#f3f4f6] pt-2" },
    progress: "mt-1.5",
  },
  dense: {
    achieved: { first: "text-[16px]", rest: "text-[13px]" },
    target: { first: "mt-1 text-[10px]", rest: "mt-0.5 text-[9px]" },
    bar: { first: "h-1.5", rest: "h-1" },
    pct: { first: "text-[10px]", rest: "text-[9px]" },
    block: { first: "", rest: "mt-1.5 border-t border-[#f3f4f6] pt-1.5" },
    progress: "mt-1",
  },
} as const;

function CurrencyKpiBlock({
  row,
  density,
  isFirst,
}: {
  row: CurrentQuarterKpiRow;
  density: keyof typeof KPI_DENSITY_STYLES;
  isFirst: boolean;
}) {
  const styles = KPI_DENSITY_STYLES[density];
  const slot = isFirst ? "first" : "rest";

  return (
    <div className={styles.block[slot]}>
      <p
        className={cn(
          "truncate font-semibold leading-none tabular-nums text-[#1c1e21]",
          styles.achieved[slot],
        )}
      >
        {formatCompactMoney(row.achieved, row.currency)}
      </p>
      <p className={cn("truncate text-[#9ca3af]", styles.target[slot])}>
        Target: {formatCompactMoney(row.target, row.currency)}
      </p>

      <div className={cn("flex items-center gap-2", styles.progress)}>
        <div
          className={cn(
            "min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef2fd]",
            styles.bar[slot],
          )}
        >
          <div
            className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
            style={{ width: `${Math.min(row.pct, 100)}%` }}
          />
        </div>
        <p
          className={cn(
            "shrink-0 font-semibold tabular-nums text-[#4080f0]",
            styles.pct[slot],
          )}
        >
          {row.target > 0 ? `${row.pct}%` : "—"}
        </p>
      </div>
    </div>
  );
}

function TeamQuarterKpiTile({
  team,
  title,
}: {
  team: TeamQuarterKpiTeam;
  title?: string;
}) {
  const rows = sortTeamRows(team.rows);
  if (!rows.length) return null;

  const density = getKpiDensity(rows.length);
  const displayTitle = title ?? formatTeamLabel(team.teamName);

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-[#e5e7eb] bg-white px-4 py-3.5",
        QUARTERLY_KPI_TILE_HEIGHT_CLASS,
      )}
    >
      <p className="shrink-0 truncate text-[12px] font-medium text-[#6b7280]">{displayTitle}</p>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto no-scrollbar">
        {rows.map((row, index) => (
          <CurrencyKpiBlock
            key={row.currency}
            row={row}
            density={density}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
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
