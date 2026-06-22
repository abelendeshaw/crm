"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendDeltaDirection } from "@/data/dashboardMetrics";
import { formatCompactAmount } from "@/data/leadsTargetsData";

export const DASHBOARD_KPI_TILE_HEIGHT_CLASS = "h-[12.75rem]";

export const DASHBOARD_KPI_VALUE_CLASS =
  "text-[42px] font-bold leading-none tracking-tight tabular-nums text-[#1c1e21]";

export type DashboardKpiCurrencyLine = {
  amount: number;
  currency: string;
};

const CURRENCY_VALUE_STYLES = {
  single: { amount: "text-[42px]", currency: "text-[16px]" },
  double: { amount: "text-[28px]", currency: "text-[13px]" },
  multi: { amount: "text-[22px]", currency: "text-[12px]" },
} as const;

function getCurrencyValueStyles(count: number) {
  if (count <= 1) return CURRENCY_VALUE_STYLES.single;
  if (count === 2) return CURRENCY_VALUE_STYLES.double;
  return CURRENCY_VALUE_STYLES.multi;
}

function DashboardKpiCurrencyValues({ lines }: { lines: DashboardKpiCurrencyLine[] }) {
  const styles = getCurrencyValueStyles(lines.length);

  return (
    <div className={cn("space-y-1", lines.length > 2 && "space-y-0.5")}>
      {lines.map((line) => (
        <p
          key={line.currency}
          className={cn(
            "block truncate font-bold leading-tight tabular-nums text-[#1c1e21]",
            styles.amount,
          )}
        >
          <span>{formatCompactAmount(line.amount)}</span>{" "}
          <span className={cn("font-semibold text-[#6b7280]", styles.currency)}>
            {line.currency}
          </span>
        </p>
      ))}
    </div>
  );
}

type KpiPeriod = "month" | "quarter";

function KpiPeriodToggle({
  value,
  onChange,
}: {
  value: KpiPeriod;
  onChange: (value: KpiPeriod) => void;
}) {
  const nextPeriod = value === "month" ? "quarter" : "month";

  return (
    <button
      type="button"
      onClick={() => onChange(nextPeriod)}
      className="flex size-7 items-center justify-center rounded-md border border-[#e5e7eb] bg-[#f9fafb] text-[10px] font-semibold text-[#6b7280] shadow-none transition-colors hover:bg-white hover:text-[#4080f0]"
      title={value === "month" ? "Showing month · click for quarter" : "Showing quarter · click for month"}
      aria-label={value === "month" ? "Switch to quarter view" : "Switch to month view"}
    >
      {value === "month" ? "M" : "Q"}
    </button>
  );
}

function TrendArrow({ direction }: { direction: TrendDeltaDirection }) {
  if (direction === "neutral") return null;

  const isUp = direction === "up";
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <Icon
      className={cn("size-7 shrink-0", isUp ? "text-[#16a34a]" : "text-[#dc2626]")}
      strokeWidth={2.25}
    />
  );
}

function DashboardKpiTileShell({
  label,
  children,
  headerAction,
}: {
  label: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border border-[#e5e7eb] bg-white px-4 py-3.5",
        DASHBOARD_KPI_TILE_HEIGHT_CLASS,
      )}
    >
      {headerAction ? (
        <div className="absolute right-3 top-3 z-10">{headerAction}</div>
      ) : null}
      <p
        className={cn(
          "shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]",
          headerAction && "pr-10",
        )}
      >
        {label}
      </p>
      <div className="mt-2 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function DashboardKpiBody({
  value,
  currencyLines,
  deltaLabel,
  deltaDirection,
  context,
}: {
  value?: string | number;
  currencyLines?: DashboardKpiCurrencyLine[];
  deltaLabel: string;
  deltaDirection: TrendDeltaDirection;
  context?: string;
}) {
  const showTrendArrow = deltaDirection !== "neutral";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {currencyLines ? (
        <DashboardKpiCurrencyValues
          lines={currencyLines.length ? currencyLines : [{ amount: 0, currency: "ETB" }]}
        />
      ) : (
        <p className={cn("min-w-0 truncate", DASHBOARD_KPI_VALUE_CLASS)}>
          {value}
        </p>
      )}

      <div className={cn("mt-auto min-w-0", showTrendArrow && "pr-9")}>
        <p
          className={cn(
            "truncate text-[11px] font-medium leading-snug",
            deltaDirection === "up" && "text-[#16a34a]",
            deltaDirection === "down" && "text-[#dc2626]",
            deltaDirection === "neutral" && "text-[#9ca3af]",
          )}
        >
          {deltaLabel}
        </p>
        {context ? (
          <p className="mt-0.5 truncate text-[11px] leading-snug text-[#6b7280]">{context}</p>
        ) : null}
      </div>

      {showTrendArrow ? (
        <div className="absolute bottom-0 right-0">
          <TrendArrow direction={deltaDirection} />
        </div>
      ) : null}
    </div>
  );
}

export function DashboardMetricTile({
  label,
  value,
  currencyLines,
  deltaLabel,
  deltaDirection,
  context,
}: {
  label: string;
  value?: string | number;
  currencyLines?: DashboardKpiCurrencyLine[];
  deltaLabel: string;
  deltaDirection: TrendDeltaDirection;
  context?: string;
}) {
  return (
    <DashboardKpiTileShell label={label}>
      <DashboardKpiBody
        value={value}
        currencyLines={currencyLines}
        deltaLabel={deltaLabel}
        deltaDirection={deltaDirection}
        context={context}
      />
    </DashboardKpiTileShell>
  );
}

export function DashboardPeriodMetricTile({
  label,
  monthValue,
  quarterValue,
  monthDeltaLabel,
  quarterDeltaLabel,
  monthDeltaDirection,
  quarterDeltaDirection,
  monthContext,
  quarterContext,
}: {
  label: string;
  monthValue: string | number;
  quarterValue: string | number;
  monthDeltaLabel: string;
  quarterDeltaLabel: string;
  monthDeltaDirection: TrendDeltaDirection;
  quarterDeltaDirection: TrendDeltaDirection;
  monthContext?: string;
  quarterContext?: string;
}) {
  const [period, setPeriod] = useState<KpiPeriod>("month");

  const value = period === "month" ? monthValue : quarterValue;
  const deltaLabel = period === "month" ? monthDeltaLabel : quarterDeltaLabel;
  const deltaDirection = period === "month" ? monthDeltaDirection : quarterDeltaDirection;
  const context = period === "month" ? monthContext : quarterContext;

  return (
    <DashboardKpiTileShell
      label={label}
      headerAction={<KpiPeriodToggle value={period} onChange={setPeriod} />}
    >
      <DashboardKpiBody
        value={value}
        deltaLabel={deltaLabel}
        deltaDirection={deltaDirection}
        context={context}
      />
    </DashboardKpiTileShell>
  );
}
