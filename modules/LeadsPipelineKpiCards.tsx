"use client";

import { useMemo } from "react";
import { Target } from "lucide-react";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  computeCurrentQuarterOverallPct,
  computeLeadTargetPct,
  computeTeamQuarterKpis,
  formatCompactMoney,
  hasOrgSalesTargets,
  type CurrentQuarterKpiRow,
  type LeadTargetingSettings,
  type TeamQuarterKpi,
  type TeamQuarterKpiTeam,
} from "@/data/leadsTargetsData";

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

function CurrencyKpiBlock({
  row,
  primary = false,
}: {
  row: CurrentQuarterKpiRow;
  primary?: boolean;
}) {
  return (
    <div className={primary ? undefined : "mt-2.5 border-t border-[#f3f4f6] pt-2.5"}>
      <p
        className={
          primary
            ? "text-[22px] font-semibold leading-none tabular-nums text-[#1c1e21]"
            : "text-[15px] font-semibold leading-none tabular-nums text-[#1c1e21]"
        }
      >
        {formatCompactMoney(row.achieved, row.currency)}
      </p>
      <p
        className={
          primary ? "mt-2 text-[12px] text-[#9ca3af]" : "mt-1 text-[11px] text-[#9ca3af]"
        }
      >
        Target: {formatCompactMoney(row.target, row.currency)}
      </p>

      <div className="mt-2 flex items-center gap-2.5">
        <div
          className={
            primary
              ? "h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef2fd]"
              : "h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef2fd]"
          }
        >
          <div
            className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
            style={{ width: `${Math.min(row.pct, 100)}%` }}
          />
        </div>
        <p
          className={
            primary
              ? "shrink-0 text-[12px] font-semibold tabular-nums text-[#4080f0]"
              : "shrink-0 text-[11px] font-semibold tabular-nums text-[#4080f0]"
          }
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
  const primary = rows[0];
  if (!primary) return null;

  const secondaryRows = rows.slice(1);
  const displayTitle = title ?? formatTeamLabel(team.teamName);

  return (
    <div className="flex min-h-[8.5rem] flex-col rounded-lg border border-[#e5e7eb] bg-white px-4 py-3.5">
      <p className="truncate text-[12px] font-medium text-[#6b7280]">{displayTitle}</p>

      <div className="mt-3 min-w-0 flex-1">
        <CurrencyKpiBlock row={primary} primary />
        {secondaryRows.map((row) => (
          <CurrencyKpiBlock key={row.currency} row={row} />
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

function EmptyQuarterlyTargetCard() {
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
    const kpi = computeTeamQuarterKpis(targetingSettings, leads);
    if (!kpi) return null;
    return {
      ...kpi,
      teams: withSampleMultiCurrencyTeam(kpi.teams),
    };
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
