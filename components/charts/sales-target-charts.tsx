"use client";

import { cn } from "@/lib/utils";
import {
  computeLeadTargetPct,
  formatCompactMoney,
  getCurrentOrgQuarter,
  type CurrencyQuarterlyTargets,
} from "@/data/leadsTargetsData";

const CURRENCY_CHART_COLORS: Record<string, { achieved: string; target: string }> = {
  ETB: { achieved: "#4080f0", target: "#dbeafe" },
  USD: { achieved: "#22c55e", target: "#dcfce7" },
  EUR: { achieved: "#a855f7", target: "#f3e8ff" },
};

function getCurrencyColors(currency: string) {
  return (
    CURRENCY_CHART_COLORS[currency] ?? {
      achieved: "#4080f0",
      target: "#dbeafe",
    }
  );
}

function getChartPoint(
  value: number,
  index: number,
  count: number,
  width: number,
  height: number,
  paddingLeft: number,
  paddingRight: number,
  paddingTop: number,
  paddingBottom: number,
  maxY: number,
) {
  const stepX = count === 1 ? 0 : (width - paddingLeft - paddingRight) / (count - 1);
  const x = paddingLeft + stepX * index;
  const plotHeight = height - paddingTop - paddingBottom;
  const y = paddingTop + plotHeight - (value / maxY) * plotHeight;
  return { x, y };
}

function buildSmoothLinePath(
  values: number[],
  width: number,
  height: number,
  paddingLeft: number,
  paddingRight: number,
  paddingTop: number,
  paddingBottom: number,
  maxY: number,
) {
  if (!values.length) return "";
  const points = values.map((value, index) =>
    getChartPoint(
      value,
      index,
      values.length,
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      maxY,
    ),
  );

  if (points.length === 1) {
    const point = points[0]!;
    return `M ${point.x} ${point.y}`;
  }

  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]!;
    const next = points[index + 1]!;
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

type ChartSeries = {
  currency: string;
  color: string;
  annualPct: number;
  annualAchieved: number;
  annualTarget: number;
  points: { q: 1 | 2 | 3 | 4; pct: number; achieved: number; target: number }[];
};

function UnifiedAnnualLineChart({
  series,
  currentQ,
}: {
  series: ChartSeries[];
  currentQ: ReturnType<typeof getCurrentOrgQuarter>;
}) {
  const width = 1000;
  const height = 280;
  const paddingLeft = 48;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 40;
  const maxY = Math.max(
    100,
    ...series.flatMap((entry) => entry.points.map((point) => point.pct)),
  );
  const yTicks = [0, 25, 50, 75, 100].filter((tick) => tick <= maxY);
  if (!yTicks.includes(maxY) && maxY > 100) {
    yTicks.push(maxY);
  }

  return (
    <div className="rounded-lg border border-[#eef1f6] bg-[#fafbfc] p-3 sm:p-4">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {series.map((entry) => (
          <div
            key={entry.currency}
            className="rounded-md border border-[#eef1f6] bg-white px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-[12px] font-semibold text-[#374151]">{entry.currency}</p>
            </div>
            <p className="mt-1 text-[11px] tabular-nums text-[#6b7280]">
              {formatCompactMoney(entry.annualAchieved, entry.currency as CurrencyQuarterlyTargets["currency"])}
              {" / "}
              {formatCompactMoney(entry.annualTarget, entry.currency as CurrencyQuarterlyTargets["currency"])}
            </p>
            <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-[#4080f0]">
              {entry.annualPct}%
            </p>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-h-[220px]"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Annual revenue attainment line chart"
      >
        {yTicks.map((tick) => {
          const y = getChartPoint(
            tick,
            0,
            2,
            width,
            height,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            maxY,
          ).y;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray={tick === 0 ? undefined : "4 4"}
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                fill="#9ca3af"
                fontSize="11"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {[0, 1, 2, 3].map((index) => {
          const x = getChartPoint(
            0,
            index,
            4,
            width,
            height,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            maxY,
          ).x;
          const isCurrent = index + 1 === currentQ;
          return (
            <g key={index}>
              {isCurrent ? (
                <rect
                  x={x - 28}
                  y={paddingTop}
                  width={56}
                  height={height - paddingTop - paddingBottom}
                  fill="#4080f0"
                  opacity={0.06}
                  rx={8}
                />
              ) : null}
              <text
                x={x}
                y={height - 12}
                textAnchor="middle"
                fill={isCurrent ? "#4080f0" : "#6b7280"}
                fontSize="12"
                fontWeight={isCurrent ? 600 : 500}
              >
                Q{index + 1}
              </text>
            </g>
          );
        })}

        {series.map((entry) => {
          const values = entry.points.map((point) => point.pct);
          const path = buildSmoothLinePath(
            values,
            width,
            height,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            maxY,
          );

          return (
            <g key={entry.currency}>
              <path
                d={path}
                fill="none"
                stroke={entry.color}
                strokeWidth={3}
                strokeLinecap="round"
              />
              {entry.points.map((point, index) => {
                const { x, y } = getChartPoint(
                  point.pct,
                  index,
                  entry.points.length,
                  width,
                  height,
                  paddingLeft,
                  paddingRight,
                  paddingTop,
                  paddingBottom,
                  maxY,
                );
                return (
                  <circle
                    key={`${entry.currency}-${point.q}`}
                    cx={x}
                    cy={y}
                    r={point.q === currentQ ? 5.5 : 4.5}
                    fill="white"
                    stroke={entry.color}
                    strokeWidth={2.5}
                  >
                    <title>
                      {entry.currency} Q{point.q}: {point.pct}% (
                      {formatCompactMoney(point.achieved, entry.currency as CurrencyQuarterlyTargets["currency"])}
                      {" / "}
                      {formatCompactMoney(point.target, entry.currency as CurrencyQuarterlyTargets["currency"])})
                    </title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[#6b7280]">
        {series.map((entry) => (
          <span key={entry.currency} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-6 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.currency} attainment
          </span>
        ))}
      </div>
    </div>
  );
}

export type SalesTargetCurrencySummary = {
  currency: CurrencyQuarterlyTargets["currency"];
  annualTarget: number;
  annualAchieved: number;
  annualPct: number;
  quarterlyTrend: { q: 1 | 2 | 3 | 4; target: number; achieved: number }[];
};

export function AnnualRevenueChart({
  fiscalYear,
  summaries,
}: {
  fiscalYear: number;
  summaries: SalesTargetCurrencySummary[];
}) {
  const currentQ = getCurrentOrgQuarter();
  const series: ChartSeries[] = summaries.map((summary) => ({
    currency: summary.currency,
    color: getCurrencyColors(summary.currency).achieved,
    annualPct: summary.annualPct,
    annualAchieved: summary.annualAchieved,
    annualTarget: summary.annualTarget,
    points: summary.quarterlyTrend.map((row) => ({
      q: row.q,
      pct: computeLeadTargetPct(row.achieved, row.target),
      achieved: row.achieved,
      target: row.target,
    })),
  }));

  return (
    <div className="w-full rounded-lg border border-[#e5e7eb] bg-white p-4 sm:p-5">
      <div>
        <p className="text-sm font-semibold text-[#1c1e21]">
          Annual revenue · FY {fiscalYear}
        </p>
        <p className="mt-0.5 text-[12px] text-[#6b7280]">
          Quarterly attainment % by currency on a shared timeline
        </p>
      </div>

      <div className="mt-5">
        <UnifiedAnnualLineChart series={series} currentQ={currentQ} />
      </div>
    </div>
  );
}

export function QuarterlyPerformanceChart({
  summaries,
}: {
  summaries: SalesTargetCurrencySummary[];
}) {
  const currentQ = getCurrentOrgQuarter();
  const quarters = [1, 2, 3, 4] as const;
  const max = Math.max(
    1,
    ...summaries.flatMap((summary) =>
      summary.quarterlyTrend.flatMap((row) => [row.target, row.achieved]),
    ),
  );

  return (
    <div className="w-full rounded-lg border border-[#e5e7eb] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1c1e21]">Quarterly performance</p>
          <p className="mt-0.5 text-[12px] text-[#6b7280]">
            Target vs achieved across all quarters and currencies
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#6b7280]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-[#dbeafe]" />
            Target
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-[#4080f0]" />
            Achieved
          </span>
        </div>
      </div>

      <div className="mt-6 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {quarters.map((q) => {
          const isCurrent = q === currentQ;

          return (
            <div
              key={q}
              className={cn(
                "flex min-w-0 flex-col rounded-lg border px-3 pb-4 pt-3",
                isCurrent
                  ? "border-[#bfd0fb] bg-[#f8fbff] ring-1 ring-[#dbeafe]"
                  : "border-[#eef1f6] bg-[#fafbfc]",
              )}
            >
              <p
                className={cn(
                  "text-center text-[12px] font-semibold",
                  isCurrent ? "text-[#4080f0]" : "text-[#6b7280]",
                )}
              >
                Q{q}
                {isCurrent ? " · Now" : ""}
              </p>

              <div className="mt-3 flex h-44 w-full items-end justify-center gap-3 sm:gap-4">
                {summaries.map((summary) => {
                  const row = summary.quarterlyTrend.find((entry) => entry.q === q);
                  if (!row) return null;

                  const colors = getCurrencyColors(summary.currency);
                  const targetHeight = Math.max(6, (row.target / max) * 100);
                  const achievedHeight = Math.max(6, (row.achieved / max) * 100);
                  const pct = computeLeadTargetPct(row.achieved, row.target);

                  return (
                    <div
                      key={`${summary.currency}-${q}`}
                      className="flex min-w-0 flex-1 flex-col items-center"
                    >
                      <p className="mb-2 text-[10px] font-semibold text-[#6b7280]">
                        {summary.currency}
                      </p>
                      <div className="flex h-36 w-full max-w-[4.5rem] items-end justify-center gap-1">
                        <div
                          className="w-2.5 rounded-t-sm sm:w-3"
                          style={{
                            height: `${targetHeight}%`,
                            backgroundColor: colors.target,
                          }}
                          title={`Target ${formatCompactMoney(row.target, summary.currency)}`}
                        />
                        <div
                          className="w-2.5 rounded-t-sm sm:w-3"
                          style={{
                            height: `${achievedHeight}%`,
                            backgroundColor: colors.achieved,
                          }}
                          title={`Achieved ${formatCompactMoney(row.achieved, summary.currency)}`}
                        />
                      </div>
                      <p className="mt-2 text-center text-[11px] font-semibold tabular-nums text-[#1c1e21]">
                        {row.target > 0 ? `${pct}%` : "—"}
                      </p>
                      <p className="mt-0.5 text-center text-[9px] tabular-nums text-[#9ca3af]">
                        {formatCompactMoney(row.achieved, summary.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
