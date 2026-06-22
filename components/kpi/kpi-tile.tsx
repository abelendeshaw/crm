"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import {
  formatCompactMoney,
  type CurrentQuarterKpiRow,
  type TeamQuarterKpiTeam,
} from "@/data/leadsTargetsData";

export const QUARTERLY_KPI_TILE_HEIGHT_CLASS = "h-[12.75rem]";

export function getQuarterlyKpiTileHeightClass(currencyCount: number): string {
  if (currencyCount <= 1) return "min-h-[12.75rem]";
  if (currencyCount === 2) return "min-h-[17rem]";
  if (currencyCount === 3) return "min-h-[21rem]";
  return "min-h-[24rem]";
}

export const KPI_TILE_SHELL_CLASS =
  "flex flex-col rounded-lg border border-[#e5e7eb] bg-white px-4 py-3.5";

function getKpiDensity(currencyCount: number): "comfortable" | "compact" | "dense" {
  if (currencyCount <= 2) return "comfortable";
  if (currencyCount === 3) return "compact";
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

export function KpiProgressBlock({
  achievedDisplay,
  targetLabel,
  pct,
  density = "comfortable",
  isFirst = true,
  hasTarget = true,
  targetAmount,
}: {
  achievedDisplay: string;
  targetLabel: string;
  pct: number;
  density?: keyof typeof KPI_DENSITY_STYLES;
  isFirst?: boolean;
  hasTarget?: boolean;
  targetAmount?: number;
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
        {achievedDisplay}
      </p>
      <p className={cn("truncate text-[#9ca3af]", styles.target[slot])}>{targetLabel}</p>

      {hasTarget ? (
        <div className={cn("flex items-center gap-2", styles.progress)}>
          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef2fd]",
              styles.bar[slot],
            )}
          >
            <div
              className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p
            className={cn(
              "shrink-0 font-semibold tabular-nums text-[#4080f0]",
              styles.pct[slot],
            )}
          >
            {(targetAmount ?? 1) > 0 ? `${pct}%` : "—"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CurrencyKpiBlock({
  row,
  density,
  isFirst,
}: {
  row: CurrentQuarterKpiRow;
  density: keyof typeof KPI_DENSITY_STYLES;
  isFirst: boolean;
}) {
  return (
    <KpiProgressBlock
      achievedDisplay={formatCompactMoney(row.achieved, row.currency)}
      targetLabel={`Target: ${formatCompactMoney(row.target, row.currency)}`}
      pct={row.pct}
      density={density}
      isFirst={isFirst}
      hasTarget={row.target > 0}
      targetAmount={row.target}
    />
  );
}

export function KpiTileShell({
  title,
  children,
  className,
  headerAction,
  heightClass,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  heightClass?: string;
}) {
  return (
    <div
      className={cn(
        KPI_TILE_SHELL_CLASS,
        heightClass ?? QUARTERLY_KPI_TILE_HEIGHT_CLASS,
        className,
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[12px] font-medium text-[#6b7280]">{title}</p>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto no-scrollbar">{children}</div>
    </div>
  );
}

export function SimpleKpiTile({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <KpiTileShell title={title}>
      <p className="truncate text-[22px] font-semibold leading-none tabular-nums text-[#1c1e21]">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-2 truncate text-[12px] text-[#9ca3af]">{subtitle}</p>
      ) : null}
    </KpiTileShell>
  );
}

const KPI_PERIOD_OPTIONS = ["month", "quarter"] as const;
type KpiPeriod = (typeof KPI_PERIOD_OPTIONS)[number];

export function PeriodKpiTile({
  title,
  monthValue,
  quarterValue,
  monthSubtitle = "Created this month",
  quarterSubtitle = "Created this quarter",
}: {
  title: string;
  monthValue: string | number;
  quarterValue: string | number;
  monthSubtitle?: string;
  quarterSubtitle?: string;
}) {
  const [period, setPeriod] = useState<KpiPeriod>("month");
  const value = period === "month" ? monthValue : quarterValue;
  const subtitle = period === "month" ? monthSubtitle : quarterSubtitle;

  return (
    <KpiTileShell
      title={title}
      headerAction={
        <SegmentedControl
          size="sm"
          items={[...KPI_PERIOD_OPTIONS]}
          value={period}
          onChange={setPeriod}
          getKey={(item) => item}
          getLabel={(item) => (item === "month" ? "Month" : "Quarter")}
        />
      }
    >
      <p className="truncate text-[22px] font-semibold leading-none tabular-nums text-[#1c1e21]">
        {value}
      </p>
      <p className="mt-2 truncate text-[12px] text-[#9ca3af]">{subtitle}</p>
    </KpiTileShell>
  );
}

export function ProgressKpiTile({
  title,
  achievedDisplay,
  targetLabel,
  pct,
  targetAmount,
}: {
  title: string;
  achievedDisplay: string;
  targetLabel: string;
  pct: number;
  targetAmount: number;
}) {
  return (
    <KpiTileShell title={title}>
      <KpiProgressBlock
        achievedDisplay={achievedDisplay}
        targetLabel={targetLabel}
        pct={pct}
        density="comfortable"
        isFirst
        hasTarget={targetAmount > 0}
        targetAmount={targetAmount}
      />
    </KpiTileShell>
  );
}

export function formatTeamKpiTitle(teamName: string) {
  return teamName
    .replace("International", "Intl")
    .replace(" and ", " & ")
    .replace(/ Sales$/i, "");
}

function sortTeamRows(rows: CurrentQuarterKpiRow[]) {
  return [...rows].sort((a, b) => {
    if (a.currency === "ETB") return -1;
    if (b.currency === "ETB") return 1;
    return a.currency.localeCompare(b.currency);
  });
}

export function TeamQuarterKpiTile({
  team,
  title,
}: {
  team: TeamQuarterKpiTeam;
  title?: string;
}) {
  const rows = sortTeamRows(team.rows);
  if (!rows.length) return null;

  const density = getKpiDensity(rows.length);
  const displayTitle = title ?? formatTeamKpiTitle(team.teamName);

  return (
    <KpiTileShell
      title={displayTitle}
      heightClass={getQuarterlyKpiTileHeightClass(rows.length)}
    >
      {rows.map((row, index) => (
        <CurrencyKpiBlock
          key={row.currency}
          row={row}
          density={density}
          isFirst={index === 0}
        />
      ))}
    </KpiTileShell>
  );
}
