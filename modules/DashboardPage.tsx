"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Handshake,
  Headphones,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPageSkeleton } from "@/components/loading/skeleton-screens";
import { usePageLoading } from "@/hooks/usePageLoading";
import { mockDealStore, mockLeadStore } from "@/data/mockStore";
import {
  BASE_CURRENCY,
  type CrmDeal,
  type PipelineStage,
} from "@/data/dealsManagementData";
import type { CrmLead, LeadActivity } from "@/data/leadsManagementData";
import { customerAccounts } from "@/data/customerManagementData";

function formatMoney(amount: number, currency: string = BASE_CURRENCY) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatCompact(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}K`;
  return String(amount);
}

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  positive = true,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  deltaLabel: string;
  positive?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            {label}
          </h3>
          <p className="mt-1 text-2xl font-bold text-[#1c1e21]">{value}</p>
        </div>
        <span className="rounded-md bg-[#eef2fd] p-2 text-[#4080f0]">{icon}</span>
      </div>
      <div
        className={cn(
          "mt-3 flex items-center gap-1 text-xs font-medium",
          positive ? "text-emerald-600" : "text-rose-600",
        )}
      >
        {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {delta}
        <span className="ml-1 font-normal text-[#9ca3af]">{deltaLabel}</span>
      </div>
    </div>
  );
}

function PipelineDonut({
  segments,
  totalLabel,
  totalValue,
}: {
  segments: { label: string; value: number; color: string }[];
  totalLabel: string;
  totalValue: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments
    .map((seg) => {
      const start = (acc / total) * 100;
      acc += seg.value;
      const end = (acc / total) * 100;
      return `${seg.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    })
    .join(", ");
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex size-36 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-[7px] rounded-full bg-white" />
        <div className="relative z-10 text-center">
          <p className="text-[10px] uppercase tracking-wide text-[#9ca3af]">
            {totalLabel}
          </p>
          <p className="text-sm font-bold text-[#1c1e21]">{totalValue}</p>
        </div>
      </div>
      <ul className="mt-5 w-full space-y-2">
        {segments.map((seg) => (
          <li
            key={seg.label}
            className="flex items-center justify-between text-xs text-[#475569]"
          >
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-[3px]"
                style={{ background: seg.color }}
              />
              {seg.label}
            </span>
            <span className="font-medium text-[#1c1e21]">
              {formatMoney(seg.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonthlyBarChart({
  bars,
  maxLabel,
}: {
  bars: { month: string; value: number; highlight?: boolean }[];
  maxLabel: string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const highlightIdx = bars.findIndex((b) => b.highlight);
  const highlight = highlightIdx >= 0 ? bars[highlightIdx] : null;
  return (
    <div className="relative h-48 px-1">
      {highlight ? (
        <div
          className="absolute -translate-x-1/2"
          style={{
            left: `${((highlightIdx + 0.5) / bars.length) * 100}%`,
            bottom: `calc(${(highlight.value / max) * 100}% + 28px)`,
          }}
        >
          <div className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-center shadow-sm">
            <p className="text-[10px] text-[#9ca3af]">{highlight.month}</p>
            <p className="text-[11px] font-bold text-[#1c1e21]">{maxLabel}</p>
          </div>
        </div>
      ) : null}
      <div className="flex h-full items-end justify-between gap-1.5">
        {bars.map((b) => {
          const heightPct = (b.value / max) * 100;
          return (
            <div key={b.month} className="flex h-full flex-1 flex-col items-center">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    "mx-auto w-3.5 rounded-t-md transition-colors sm:w-4",
                    b.highlight ? "bg-[#4080f0]" : "bg-[#bfdbfe]",
                  )}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
              </div>
              <span
                className={cn(
                  "mt-2 text-[10px]",
                  b.highlight ? "font-semibold text-[#1c1e21]" : "text-[#9ca3af]",
                )}
              >
                {b.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between">
        <span className="text-xs text-[#6b7280]">{label}</span>
        <span className="text-[10px] text-[#9ca3af]">
          {formatMoney(value)} / {formatMoney(total)}
        </span>
      </div>
      <div className="h-6 overflow-hidden rounded-md bg-[#dbeafe]">
        <div
          className="flex h-full items-center rounded-md bg-[#4080f0] px-2"
          style={{ width: `${pct}%` }}
        >
          {pct > 12 ? (
            <span className="text-[10px] font-semibold text-white">{pct}%</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ActivityTrendChart({
  values,
  labels,
  highlightIdx,
  highlightLabel,
  highlightValue,
}: {
  values: number[];
  labels: string[];
  highlightIdx: number;
  highlightLabel: string;
  highlightValue: string;
}) {
  const width = 500;
  const height = 150;
  const padX = 12;
  const padY = 16;
  const max = Math.max(1, ...values);
  const xs = values.map((_, i) =>
    values.length > 1 ? padX + (i / (values.length - 1)) * (width - padX * 2) : width / 2,
  );
  const ys = values.map((v) => height - padY - (v / max) * (height - padY * 2));
  const linePath = values.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i]},${ys[i]}`).join(" ");
  const areaPath = `${linePath} L${xs[xs.length - 1]},${height} L${xs[0]},${height} Z`;
  const hx = xs[highlightIdx] ?? width / 2;
  const hy = ys[highlightIdx] ?? height / 2;
  const tooltipLeftPct = (hx / width) * 100;
  return (
    <div className="relative w-full">
      <div className="relative h-44 w-full">
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-center shadow-sm"
          style={{
            left: `${tooltipLeftPct}%`,
            top: `calc(${(hy / height) * 100}% - 6px)`,
          }}
        >
          <p className="text-[10px] text-[#9ca3af]">{highlightLabel}</p>
          <p className="text-[11px] font-bold text-[#1c1e21]">{highlightValue}</p>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="dashboard-line-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#dashboard-line-gradient)" />
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={hx} cy={hy} r={4.5} fill="#fff" stroke="#3b82f6" strokeWidth={2} />
        </svg>
      </div>
      <div className="mt-3 flex justify-between px-1 text-[10px] text-[#9ca3af]">
        {labels.map((l, i) => (
          <span key={l} className={i === highlightIdx ? "font-semibold text-[#1c1e21]" : ""}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function startOfWeek(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c;
}

export function DashboardPage() {
  const isPageLoading = usePageLoading();
  const [deals, setDeals] = useState<CrmDeal[]>(() => mockDealStore.deals);
  const [leads, setLeads] = useState<CrmLead[]>(() => mockLeadStore.leads);
  const [dealStages, setDealStages] = useState<PipelineStage[]>(() => mockDealStore.stages);

  useEffect(() => {
    const u1 = mockDealStore.subscribeDeals((next) => setDeals([...next]));
    const u2 = mockLeadStore.subscribeLeads((next) => setLeads([...next]));
    const u3 = mockDealStore.subscribeStages((next) => setDealStages([...next]));
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const dealStageById = useMemo(
    () => new Map(dealStages.map((s) => [s.id, s])),
    [dealStages],
  );

  const wonDeals = useMemo(
    () =>
      deals.filter((d) => dealStageById.get(d.stageId)?.category === "won"),
    [deals, dealStageById],
  );
  const openDeals = useMemo(
    () =>
      deals.filter((d) => dealStageById.get(d.stageId)?.category === "open"),
    [deals, dealStageById],
  );
  const lostDeals = useMemo(
    () =>
      deals.filter((d) => dealStageById.get(d.stageId)?.category === "lost"),
    [deals, dealStageById],
  );

  const yearlyRevenue = useMemo(
    () => wonDeals.reduce((s, d) => s + d.baseValue, 0),
    [wonDeals],
  );
  const weightedPipeline = useMemo(
    () =>
      openDeals.reduce(
        (s, d) => s + Math.round(d.baseValue * (d.probability / 100)),
        0,
      ),
    [openDeals],
  );
  const totalCustomers = customerAccounts.length;
  const totalLeads = leads.length;
  const closedAttempts = wonDeals.length + lostDeals.length;
  const conversionRate = closedAttempts
    ? Math.round((wonDeals.length / closedAttempts) * 100 * 10) / 10
    : 0;

  // Monthly closed-won bars for the current year (Jan..Dec)
  const monthlyBars = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const year = new Date().getFullYear();
    const totals = Array.from({ length: 12 }, () => 0);
    for (const d of deals) {
      if (dealStageById.get(d.stageId)?.category !== "won") continue;
      const date = new Date(d.expectedClose);
      if (date.getFullYear() !== year) continue;
      totals[date.getMonth()] += d.baseValue;
    }
    let topIdx = 0;
    totals.forEach((v, i) => {
      if (v > (totals[topIdx] ?? 0)) topIdx = i;
    });
    return months.map((m, i) => ({
      month: m,
      value: totals[i] ?? 0,
      highlight: i === topIdx && (totals[i] ?? 0) > 0,
    }));
  }, [deals, dealStageById]);

  const topMonth = monthlyBars.find((b) => b.highlight);

  // Pipeline by category for the donut
  const pipelineByCategory = useMemo(() => {
    const won = wonDeals.reduce((s, d) => s + d.baseValue, 0);
    const open = openDeals.reduce((s, d) => s + d.baseValue, 0);
    const lost = lostDeals.reduce((s, d) => s + d.baseValue, 0);
    return [
      { label: "Closed won", value: won, color: "#2563eb" },
      { label: "Open pipeline", value: open, color: "#93c5fd" },
      { label: "Closed lost", value: lost, color: "#dbeafe" },
    ];
  }, [wonDeals, openDeals, lostDeals]);

  const totalPipeline =
    pipelineByCategory.reduce((s, x) => s + x.value, 0) || 0;
  const wonShare = totalPipeline
    ? Math.round(
        ((pipelineByCategory[0]?.value ?? 0) / totalPipeline) * 100,
      )
    : 0;

  // Targets — keep simple, derived from current data
  const revenueTarget = Math.max(yearlyRevenue, 1) * 1.25;
  const pipelineTarget = Math.max(openDeals.reduce((s, d) => s + d.baseValue, 0), 1) * 1.2;
  const conversionTarget = Math.max(40, conversionRate + 10);

  // Weekly activities (Sun..Sat) — combine deal + lead activity timestamps
  const weeklyActivity = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today);
    const buckets = Array.from({ length: 7 }, () => 0);
    const consider = (date: string) => {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return;
      const dayMs = 24 * 60 * 60 * 1000;
      const idx = Math.floor((d.getTime() - start.getTime()) / dayMs);
      if (idx >= 0 && idx < 7) buckets[idx] = (buckets[idx] ?? 0) + 1;
    };
    for (const d of deals) for (const a of d.activities) consider(a.date);
    for (const l of leads) for (const a of l.activities) consider(a.date);
    let topIdx = 0;
    buckets.forEach((v, i) => {
      if (v > (buckets[topIdx] ?? 0)) topIdx = i;
    });
    return { values: buckets, topIdx };
  }, [deals, leads]);

  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Recent activity items for the sidebar
  type ActivityItem = {
    id: string;
    title: string;
    note?: string;
    date: string;
    icon: React.ReactNode;
    tag: string;
    href: string;
  };
  const recentActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    for (const d of deals) {
      for (const a of d.activities) {
        items.push({
          id: `d-${d.id}-${a.id}`,
          title: a.title,
          note: a.note,
          date: a.date,
          icon: <Handshake size={14} />,
          tag: "Deal",
          href: `/deals/${d.id}`,
        });
      }
    }
    for (const l of leads) {
      for (const a of l.activities as LeadActivity[]) {
        items.push({
          id: `l-${l.id}-${a.id}`,
          title: a.title,
          note: a.note,
          date: a.date,
          icon: <Target size={14} />,
          tag: "Lead",
          href: `/leads/${l.id}`,
        });
      }
    }
    items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return items.slice(0, 8);
  }, [deals, leads]);

  if (isPageLoading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-[#f8fafc]">
      <div className="flex flex-col gap-2 border-b border-[#e5e7eb] bg-white px-6 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1c1e21]">Dashboard</h1>
          <p className="mt-0.5 text-[13px] text-[#9ca3af]">
            Pipeline, revenue, and team activity at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/leads"
            className="inline-flex h-9 items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#1c1e21] hover:bg-[#f3f4f6]"
          >
            View leads
          </Link>
          <Link
            href="/deals"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#4080f0] px-3 text-xs font-medium text-white hover:bg-[#3070e0]"
          >
            <Plus size={14} />
            New deal
          </Link>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-4 p-4 sm:gap-6 sm:p-6">
        <section className="col-span-12 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Yearly Revenue"
            value={`${BASE_CURRENCY} ${formatCompact(yearlyRevenue)}`}
            delta="+12.4%"
            deltaLabel="vs last year"
            positive
            icon={<TrendingUp size={16} />}
          />
          <StatCard
            label="Active Leads"
            value={formatCompact(totalLeads)}
            delta="+4.1%"
            deltaLabel="vs last month"
            positive
            icon={<Target size={16} />}
          />
          <StatCard
            label="Customers"
            value={formatCompact(totalCustomers)}
            delta="+2"
            deltaLabel="new this month"
            positive
            icon={<Building2 size={16} />}
          />
          <StatCard
            label="Conversion Rate"
            value={`${conversionRate}%`}
            delta={conversionRate >= 40 ? "+1.8%" : "-0.6%"}
            deltaLabel="vs last month"
            positive={conversionRate >= 40}
            icon={<Users size={16} />}
          />
        </section>

        <section className="col-span-12 grid grid-cols-1 gap-4 sm:gap-6 lg:col-span-9 md:grid-cols-3">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm md:col-span-1">
            <h3 className="mb-5 text-sm font-bold text-[#334155]">Pipeline Mix</h3>
            <PipelineDonut
              segments={pipelineByCategory}
              totalLabel={`${wonShare}% won`}
              totalValue={formatCompact(totalPipeline)}
            />
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm md:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#334155]">Closed Won by Month</h3>
              <span className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[10px] text-[#6b7280]">
                {new Date().getFullYear()}
              </span>
            </div>
            <MonthlyBarChart
              bars={monthlyBars}
              maxLabel={topMonth ? formatMoney(topMonth.value) : "—"}
            />
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm md:col-span-1">
            <h3 className="mb-5 text-sm font-bold text-[#334155]">Revenue Targets</h3>
            <div className="space-y-5">
              <ProgressBar
                label="Yearly revenue"
                value={yearlyRevenue}
                total={revenueTarget}
              />
              <ProgressBar
                label="Open pipeline"
                value={openDeals.reduce((s, d) => s + d.baseValue, 0)}
                total={pipelineTarget}
              />
              <ProgressBar
                label="Conversion rate"
                value={Math.round(conversionRate)}
                total={Math.round(conversionTarget)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm md:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#334155]">Team Activity</h3>
              <span className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[10px] text-[#6b7280]">
                This week
              </span>
            </div>
            <ActivityTrendChart
              values={weeklyActivity.values}
              labels={weekLabels}
              highlightIdx={weeklyActivity.topIdx}
              highlightLabel={weekLabels[weeklyActivity.topIdx] ?? ""}
              highlightValue={String(
                weeklyActivity.values[weeklyActivity.topIdx] ?? 0,
              )}
            />
          </div>
        </section>

        <aside className="col-span-12 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#334155]">Recent Activity</h3>
            <Link
              href="/activity"
              className="text-[11px] font-semibold text-[#4080f0] hover:underline"
            >
              See all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="rounded-md border border-dashed border-[#e5e7eb] bg-[#f9fafb] p-4 text-center text-xs text-[#9ca3af]">
              No recent activity. Log a call, email, or meeting to see it here.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex gap-3 rounded-lg border border-[#eef1f6] bg-[#f9fafb] p-2.5 transition-colors hover:border-[#cbd5e1] hover:bg-white"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eef2fd] text-[#4080f0]">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-[#e2e8f0] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#475569]">
                          {item.tag}
                        </span>
                        <span className="text-[10px] text-[#9ca3af]">
                          {item.date}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs font-medium text-[#1c1e21]">
                        {item.title}
                      </p>
                      {item.note ? (
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-[#6b7280]">
                          {item.note}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
