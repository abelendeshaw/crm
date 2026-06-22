import type { CrmDeal, PipelineStage } from "./dealsManagementData";
import type { CrmLead } from "./leadsManagementData";
import { SALES_TEAMS } from "./leadsManagementData";
import {
  CONTRACT_SIGNED_STAGE_ID,
  getCurrentOrgQuarter,
  getLeadQuarter,
} from "./leadsTargetsData";

type DatedRecord = {
  stageEnteredAt: string;
  activities: { date: string }[];
};

export const DASHBOARD_KPI_TREND_WEEKS = 8;

export function getPipelineRecordDate(record: DatedRecord): string {  const dates = record.activities.map((activity) => activity.date).filter(Boolean);
  if (dates.length === 0) return record.stageEnteredAt;
  return dates.reduce((min, date) => (date < min ? date : min), dates[0]!);
}

export function getQuarterFromDate(iso: string): 1 | 2 | 3 | 4 {
  const month = new Date(`${iso}T12:00:00`).getMonth() + 1;
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

export function isInCurrentMonth(iso: string, reference = new Date()): boolean {
  const date = new Date(`${iso}T12:00:00`);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export function isInCurrentQuarter(iso: string, reference = new Date()): boolean {
  const date = new Date(`${iso}T12:00:00`);
  return (
    date.getFullYear() === reference.getFullYear() &&
    getQuarterFromDate(iso) === getCurrentOrgQuarter(reference)
  );
}

export function countNewInMonth<T extends DatedRecord>(records: T[]): number {
  return records.filter((record) =>
    isInCurrentMonth(getPipelineRecordDate(record)),
  ).length;
}

export function countNewInQuarter<T extends DatedRecord>(records: T[]): number {
  return records.filter((record) =>
    isInCurrentQuarter(getPipelineRecordDate(record)),
  ).length;
}

export function countNewInPreviousMonth<T extends DatedRecord>(
  records: T[],
  reference = new Date(),
): number {
  const prev = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return records.filter((record) => {
    const date = new Date(`${getPipelineRecordDate(record)}T12:00:00`);
    return (
      date.getFullYear() === prev.getFullYear() && date.getMonth() === prev.getMonth()
    );
  }).length;
}

export function countNewInPreviousQuarter<T extends DatedRecord>(
  records: T[],
  reference = new Date(),
): number {
  const currentQuarter = getCurrentOrgQuarter(reference);
  const prevQuarter = currentQuarter === 1 ? 4 : ((currentQuarter - 1) as 1 | 2 | 3 | 4);
  const prevYear =
    currentQuarter === 1 ? reference.getFullYear() - 1 : reference.getFullYear();

  return records.filter((record) => {
    const iso = getPipelineRecordDate(record);
    const date = new Date(`${iso}T12:00:00`);
    return date.getFullYear() === prevYear && getQuarterFromDate(iso) === prevQuarter;
  }).length;
}

export function startOfWeek(reference: Date): Date {
  const date = new Date(reference);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildWeeklyBucketStarts(
  weeks: number,
  reference = new Date(),
): Date[] {
  const currentWeek = startOfWeek(reference);
  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(weekStart.getDate() - (weeks - 1 - index) * 7);
    return weekStart;
  });
}

function isDateInWeek(iso: string, weekStart: Date): boolean {
  const date = new Date(`${iso}T12:00:00`);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

export function buildWeeklyCountTrend<T extends DatedRecord>(
  records: T[],
  weeks = DASHBOARD_KPI_TREND_WEEKS,
  reference = new Date(),
): number[] {
  const buckets = buildWeeklyBucketStarts(weeks, reference);
  return buckets.map(
    (weekStart) =>
      records.filter((record) =>
        isDateInWeek(getPipelineRecordDate(record), weekStart),
      ).length,
  );
}

export function buildCumulativeCountTrend<T extends DatedRecord>(
  records: T[],
  weeks = DASHBOARD_KPI_TREND_WEEKS,
  reference = new Date(),
): number[] {
  const buckets = buildWeeklyBucketStarts(weeks, reference);
  return buckets.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return records.filter(
      (record) => new Date(`${getPipelineRecordDate(record)}T12:00:00`) < weekEnd,
    ).length;
  });
}

export function buildOpenPipelineValueTrend(
  openDeals: Pick<CrmDeal, "baseValue" | "stageEnteredAt" | "activities">[],
  weeks = DASHBOARD_KPI_TREND_WEEKS,
  reference = new Date(),
): number[] {
  const buckets = buildWeeklyBucketStarts(weeks, reference);
  return buckets.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return openDeals
      .filter(
        (deal) => new Date(`${getPipelineRecordDate(deal)}T12:00:00`) < weekEnd,
      )
      .reduce((sum, deal) => sum + deal.baseValue, 0);
  });
}

const DASHBOARD_PIPELINE_CURRENCIES = new Set<CrmDeal["currency"]>(["ETB", "USD"]);

export function computeOpenPipelineByCurrency(
  openDeals: Pick<CrmDeal, "currency" | "value">[],
): { currency: CrmDeal["currency"]; amount: number }[] {
  const totals = new Map<CrmDeal["currency"], number>();

  for (const deal of openDeals) {
    if (!deal.currency || !DASHBOARD_PIPELINE_CURRENCIES.has(deal.currency)) continue;
    const value = Number(deal.value);
    if (!Number.isFinite(value)) continue;
    totals.set(deal.currency, (totals.get(deal.currency) ?? 0) + value);
  }

  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => {
      if (a.currency === "ETB") return -1;
      if (b.currency === "ETB") return 1;
      if (a.currency === "USD") return -1;
      if (b.currency === "USD") return 1;
      return a.currency.localeCompare(b.currency);
    });
}

export type TrendDeltaDirection = "up" | "down" | "neutral";

export function formatTrendDelta(
  current: number,
  previous: number,
  comparisonLabel: string,
): { label: string; direction: TrendDeltaDirection; pct: number | null } {
  if (previous === 0 && current === 0) {
    return { label: `Flat ${comparisonLabel}`, direction: "neutral", pct: 0 };
  }
  if (previous === 0) {
    return { label: `New ${comparisonLabel}`, direction: "up", pct: null };
  }

  const pct = Math.round(((current - previous) / Math.abs(previous)) * 100);
  const direction: TrendDeltaDirection =
    pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
  const sign = pct > 0 ? "+" : "";
  return {
    label: `${sign}${pct}% ${comparisonLabel}`,
    direction,
    pct,
  };
}

export function trendDeltaFromSeries(
  series: number[],
  comparisonLabel: string,
): { label: string; direction: TrendDeltaDirection; pct: number | null } {
  if (series.length < 2) {
    return { label: `No prior data`, direction: "neutral", pct: null };
  }
  return formatTrendDelta(series[series.length - 1]!, series[series.length - 2]!, comparisonLabel);
}

export type TeamLeadStageBreakdown = {
  stageName: string;
  category: PipelineStage["category"];
  count: number;
};

export type TeamLeadSummary = {
  teamName: string;
  total: number;
  newThisMonth: number;
  newThisQuarter: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
  avgOpenProbability: number;
  openPipelineByCurrency: { currency: CrmLead["currency"]; amount: number }[];
  contractSignedThisQuarter: { currency: CrmLead["currency"]; amount: number }[];
  topOwners: { name: string; count: number }[];
  stageBreakdown: TeamLeadStageBreakdown[];
};

function sumByCurrency(
  leads: Pick<CrmLead, "currency" | "value">[],
): { currency: CrmLead["currency"]; amount: number }[] {
  const totals = new Map<CrmLead["currency"], number>();
  for (const lead of leads) {
    const value = Number(lead.value);
    if (!Number.isFinite(value)) continue;
    totals.set(lead.currency, (totals.get(lead.currency) ?? 0) + value);
  }
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => {
      if (a.currency === "ETB") return -1;
      if (b.currency === "ETB") return 1;
      return a.currency.localeCompare(b.currency);
    });
}

function resolveTeamNames(leads: CrmLead[]): string[] {
  const names = new Set<string>(SALES_TEAMS);
  for (const lead of leads) {
    if (lead.team) names.add(lead.team);
  }
  const ordered: string[] = [...SALES_TEAMS].filter((name) => names.has(name));
  for (const name of names) {
    if (!ordered.includes(name)) ordered.push(name);
  }
  return ordered;
}

export function computeTeamLeadSummaries(
  leads: CrmLead[],
  stages: PipelineStage[],
): TeamLeadSummary[] {
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const currentQ = getCurrentOrgQuarter();
  const teamNames = resolveTeamNames(leads);

  return teamNames.map((teamName) => {
    const teamLeads = leads.filter((lead) => lead.team === teamName);
    const openLeads = teamLeads.filter((lead) => {
      const category = stageById.get(lead.stageId)?.category;
      return category === "open";
    });
    const wonLeads = teamLeads.filter(
      (lead) => stageById.get(lead.stageId)?.category === "won",
    );
    const lostLeads = teamLeads.filter(
      (lead) => stageById.get(lead.stageId)?.category === "lost",
    );

    const stageCounts = new Map<string, number>();
    for (const lead of teamLeads) {
      stageCounts.set(lead.stageId, (stageCounts.get(lead.stageId) ?? 0) + 1);
    }

    const stageBreakdown = [...stageCounts.entries()]
      .map(([stageId, count]) => {
        const stage = stageById.get(stageId);
        return {
          stageName: stage?.name ?? "Unknown",
          category: stage?.category ?? ("open" as const),
          count,
        };
      })
      .sort((a, b) => {
        const orderA = stages.find((stage) => stage.name === a.stageName)?.order ?? 99;
        const orderB = stages.find((stage) => stage.name === b.stageName)?.order ?? 99;
        return orderA - orderB;
      });

    const ownerCounts = new Map<string, number>();
    for (const lead of teamLeads) {
      ownerCounts.set(lead.primarySales, (ownerCounts.get(lead.primarySales) ?? 0) + 1);
    }
    const topOwners = [...ownerCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const contractSignedThisQuarter = sumByCurrency(
      teamLeads.filter(
        (lead) =>
          lead.stageId === CONTRACT_SIGNED_STAGE_ID &&
          getLeadQuarter(lead) === currentQ,
      ),
    );

    const avgOpenProbability =
      openLeads.length > 0
        ? Math.round(
            openLeads.reduce((sum, lead) => sum + lead.probability, 0) / openLeads.length,
          )
        : 0;

    return {
      teamName,
      total: teamLeads.length,
      newThisMonth: countNewInMonth(teamLeads),
      newThisQuarter: countNewInQuarter(teamLeads),
      openCount: openLeads.length,
      wonCount: wonLeads.length,
      lostCount: lostLeads.length,
      avgOpenProbability,
      openPipelineByCurrency: sumByCurrency(openLeads),
      contractSignedThisQuarter,
      topOwners,
      stageBreakdown,
    };
  });
}

export function computeDealOrgQuarterAchieved(  deals: Pick<CrmDeal, "stageId" | "currency" | "value" | "expectedClose">[],
  currency: CrmDeal["currency"],
  quarter: 1 | 2 | 3 | 4,
  wonStageIds: ReadonlySet<string>,
): number {
  return deals.reduce((sum, deal) => {
    if (!wonStageIds.has(deal.stageId)) return sum;
    if (deal.currency !== currency) return sum;
    const month = new Date(`${deal.expectedClose}T12:00:00`).getMonth() + 1;
    const dealQuarter =
      month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
    return dealQuarter === quarter ? sum + deal.value : sum;
  }, 0);
}
