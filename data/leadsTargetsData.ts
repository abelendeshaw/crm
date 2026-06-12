import { CURRENCY_OPTIONS, type DealCurrency } from "./dealsManagementData";
import type { CrmLead } from "./leadsManagementData";
import {
  defaultQuarterDefinitions,
  type FiscalQuarterDefinition,
  type LeadQuarter,
} from "./fiscalQuarterData";
import { teams as orgTeams } from "./userManagementData";

export type { FiscalQuarterDefinition, LeadQuarter } from "./fiscalQuarterData";
export {
  defaultQuarterDefinitions,
  getQuarterPeriodLabel,
  QUARTER_SHORT_LABELS,
} from "./fiscalQuarterData";

export const CONTRACT_SIGNED_STAGE_ID = "lead-stage-contract-signed";

export type LeadQuarterTarget = {
  q: LeadQuarter;
  target: number;
};

export type SalesTeamAllocation = {
  teamName: string;
  quarters: LeadQuarterTarget[];
};

export type CurrencyQuarterlyTargets = {
  currency: DealCurrency;
  quarters: LeadQuarterTarget[];
  teamAllocations: SalesTeamAllocation[];
};

export type LeadTargetingSettings = {
  fiscalYear: number;
  quarterDefinitions: FiscalQuarterDefinition[];
  currencyTargets: CurrencyQuarterlyTargets[];
};

export const SALES_ORG_TEAMS = orgTeams.filter((t) => t.department === "Sales");

function splitEvenly(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  let remainder = total;
  return Array.from({ length: count }, (_, index) => {
    const value = index === count - 1 ? remainder : base;
    remainder -= value;
    return Math.max(0, value);
  });
}

function migrateAllocationQuarters(
  quarters: LeadQuarterTarget[] | undefined,
  legacyAnnual?: number,
): LeadQuarterTarget[] {
  if (quarters?.length) {
    return quarters.map((row) => ({ ...row }));
  }
  if (legacyAnnual && legacyAnnual > 0) {
    return buildQuarterlyTargets(legacyAnnual);
  }
  return emptyQuarterlyTargets();
}

type LegacySalesTeamAllocation = {
  teamName: string;
  annualTarget?: number;
  quarters?: LeadQuarterTarget[];
};

function migrateTeamAllocation(team: LegacySalesTeamAllocation): SalesTeamAllocation {
  return {
    teamName: team.teamName,
    quarters: migrateAllocationQuarters(team.quarters, team.annualTarget),
  };
}

export function createEmptyTeamAllocations(): SalesTeamAllocation[] {
  return SALES_ORG_TEAMS.map((team) => ({
    teamName: team.name,
    quarters: emptyQuarterlyTargets(),
  }));
}

export function getQuarterTarget(
  quarters: LeadQuarterTarget[],
  q: LeadQuarter,
): number {
  return quarters.find((row) => row.q === q)?.target ?? 0;
}

export function updateQuarterTarget(
  quarters: LeadQuarterTarget[],
  q: LeadQuarter,
  target: number,
): LeadQuarterTarget[] {
  return quarters.map((row) => (row.q === q ? { ...row, target } : row));
}

export function distributeSingleQuarterToTeams(
  quarterTarget: number,
  q: LeadQuarter,
  allocations: SalesTeamAllocation[],
): SalesTeamAllocation[] {
  if (quarterTarget <= 0 || allocations.length === 0) {
    return allocations.map((team) => ({
      ...team,
      quarters: updateQuarterTarget(team.quarters, q, 0),
    }));
  }

  const teamShares = splitEvenly(quarterTarget, allocations.length);
  return allocations.map((team, teamIndex) => ({
    ...team,
    quarters: updateQuarterTarget(team.quarters, q, teamShares[teamIndex] ?? 0),
  }));
}

export function distributeCompanyTargetsToTeams(
  companyQuarters: LeadQuarterTarget[],
  allocations: SalesTeamAllocation[],
): SalesTeamAllocation[] {
  return ([1, 2, 3, 4] as const).reduce(
    (next, q) =>
      distributeSingleQuarterToTeams(
        getQuarterTarget(companyQuarters, q),
        q,
        next,
      ),
    allocations,
  );
}

function seedTeamAllocations(companyQuarters: LeadQuarterTarget[]): SalesTeamAllocation[] {
  return distributeCompanyTargetsToTeams(companyQuarters, createEmptyTeamAllocations());
}

function defaultQuarters(annual: number): LeadQuarterTarget[] {
  const q1 = Math.round(annual * 0.22);
  const q2 = Math.round(annual * 0.26);
  const q3 = Math.round(annual * 0.28);
  const q4 = Math.max(0, annual - q1 - q2 - q3);
  return [
    { q: 1, target: q1 },
    { q: 2, target: q2 },
    { q: 3, target: q3 },
    { q: 4, target: q4 },
  ];
}

const DEFAULT_ETB_ANNUAL = 260_000_000;

export const DEFAULT_LEAD_TARGETING_SETTINGS: LeadTargetingSettings = {
  fiscalYear: 2026,
  quarterDefinitions: defaultQuarterDefinitions(),
  currencyTargets: [
    {
      currency: "ETB",
      quarters: defaultQuarters(DEFAULT_ETB_ANNUAL),
      teamAllocations: seedTeamAllocations(defaultQuarters(DEFAULT_ETB_ANNUAL)),
    },
  ],
};

export function cloneLeadTargetingSettings(
  settings: LeadTargetingSettings,
): LeadTargetingSettings {
  return {
    fiscalYear: settings.fiscalYear,
    quarterDefinitions: (settings.quarterDefinitions?.length
      ? settings.quarterDefinitions
      : defaultQuarterDefinitions()
    ).map((row) => ({ ...row })),
    currencyTargets: settings.currencyTargets.map((ct) => ({
      currency: ct.currency,
      quarters: ct.quarters.map((q) => ({ ...q })),
      teamAllocations: (ct.teamAllocations ?? []).map((team) =>
        migrateTeamAllocation(team),
      ),
    })),
  };
}

export function quarterSum(ct: Pick<CurrencyQuarterlyTargets, "quarters">): number {
  return ct.quarters.reduce((s, q) => s + q.target, 0);
}

export function teamsQuarterTotal(
  allocations: SalesTeamAllocation[],
  q: LeadQuarter,
): number {
  return allocations.reduce((sum, team) => sum + getQuarterTarget(team.quarters, q), 0);
}

export function syncCompanyQuartersFromTeams(
  ct: CurrencyQuarterlyTargets,
): CurrencyQuarterlyTargets {
  const allocations = ct.teamAllocations ?? [];
  return {
    ...ct,
    quarters: ([1, 2, 3, 4] as const).map((q) => ({
      q,
      target: teamsQuarterTotal(allocations, q),
    })),
  };
}

export type QuarterProgress = {
  q: LeadQuarter;
  target: number;
  achieved: number;
  pct: number;
  remaining: number;
};

export type CurrencyTargetProgress = {
  currency: DealCurrency;
  quarters: QuarterProgress[];
  annualTarget: number;
  annualAchieved: number;
  annualPct: number;
  annualRemaining: number;
};

export function formatMoneyInCurrency(amount: number, currency: DealCurrency): string {
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

export function formatCompactMoney(amount: number, currency: DealCurrency): string {
  if (amount >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${currency} ${(amount / 1_000).toFixed(0)}K`;
  }
  return formatMoneyInCurrency(amount, currency);
}

export function computeLeadTargetPct(achieved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 100));
}

export function getLeadQuarter(lead: Pick<CrmLead, "quarter" | "expectedClose">): LeadQuarter {
  const fromLabel = lead.quarter?.match(/Q(\d)/)?.[1];
  if (fromLabel) {
    const q = Number(fromLabel);
    if (q >= 1 && q <= 4) return q as LeadQuarter;
  }
  const month = new Date(lead.expectedClose).getMonth() + 1;
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

type LeadTargetFields = Pick<
  CrmLead,
  "stageId" | "currency" | "value" | "quarter" | "expectedClose" | "team"
>;

/** Sum contract-signed lead values for a currency + quarter across the pipeline */
export function computeOrgQuarterAchieved(
  leads: LeadTargetFields[],
  currency: DealCurrency,
  q: LeadQuarter,
): number {
  return leads.reduce((sum, lead) => {
    if (lead.stageId !== CONTRACT_SIGNED_STAGE_ID) return sum;
    if (lead.currency !== currency) return sum;
    return getLeadQuarter(lead) === q ? sum + lead.value : sum;
  }, 0);
}

/** Sum contract-signed lead values for a sales team, currency, and quarter */
export function computeTeamQuarterAchieved(
  leads: LeadTargetFields[],
  teamName: string,
  currency: DealCurrency,
  q: LeadQuarter,
): number {
  return leads.reduce((sum, lead) => {
    if (lead.team !== teamName) return sum;
    if (lead.stageId !== CONTRACT_SIGNED_STAGE_ID) return sum;
    if (lead.currency !== currency) return sum;
    return getLeadQuarter(lead) === q ? sum + lead.value : sum;
  }, 0);
}

export function computeLeadQuarterContribution(
  lead: Pick<CrmLead, "stageId" | "currency" | "value" | "quarter" | "expectedClose">,
  currency: DealCurrency,
  q: LeadQuarter,
): number {
  if (lead.stageId !== CONTRACT_SIGNED_STAGE_ID) return 0;
  if (lead.currency !== currency) return 0;
  return getLeadQuarter(lead) === q ? lead.value : 0;
}

export function computeCurrencyTargetProgress(
  leads: Pick<CrmLead, "stageId" | "currency" | "value" | "quarter" | "expectedClose">[],
  currencyTarget: Pick<CurrencyQuarterlyTargets, "currency" | "quarters">,
): CurrencyTargetProgress {
  const quarters: QuarterProgress[] = ([1, 2, 3, 4] as const).map((q) => {
    const planned = currencyTarget.quarters.find((x) => x.q === q)?.target ?? 0;
    const achieved = computeOrgQuarterAchieved(leads, currencyTarget.currency, q);
    return {
      q,
      target: planned,
      achieved,
      pct: computeLeadTargetPct(achieved, planned),
      remaining: Math.max(0, planned - achieved),
    };
  });

  const annualTarget = quarters.reduce((s, row) => s + row.target, 0);
  const annualAchieved = quarters.reduce((s, row) => s + row.achieved, 0);

  return {
    currency: currencyTarget.currency,
    quarters,
    annualTarget,
    annualAchieved,
    annualPct: computeLeadTargetPct(annualAchieved, annualTarget),
    annualRemaining: Math.max(0, annualTarget - annualAchieved),
  };
}

export function computeOrgSalesTargetProgress(
  settings: LeadTargetingSettings,
  leads: Pick<CrmLead, "stageId" | "currency" | "value" | "quarter" | "expectedClose">[],
): CurrencyTargetProgress[] {
  if (!settings.currencyTargets.length) return [];
  return settings.currencyTargets.map((ct) => computeCurrencyTargetProgress(leads, ct));
}

export function buildQuarterlyTargets(annualTarget: number): LeadQuarterTarget[] {
  return defaultQuarters(annualTarget);
}

export function emptyQuarterlyTargets(): LeadQuarterTarget[] {
  return [
    { q: 1, target: 0 },
    { q: 2, target: 0 },
    { q: 3, target: 0 },
    { q: 4, target: 0 },
  ];
}

export function hasOrgSalesTargets(settings: LeadTargetingSettings): boolean {
  return settings.currencyTargets.some(
    (ct) =>
      ct.quarters.some((q) => q.target > 0) ||
      (ct.teamAllocations ?? []).some((team) =>
        team.quarters.some((q) => q.target > 0),
      ),
  );
}

export function quarterLabel(q: LeadQuarter): string {
  return `Q${q}`;
}

export function quarterFromIsoDate(iso: string): LeadQuarter {
  const month = new Date(iso).getMonth() + 1;
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

/** Align quarter + close date when a lead reaches Contract Signed */
export function applyContractSignedStageUpdate<
  T extends Pick<CrmLead, "stageId" | "quarter" | "expectedClose">,
>(lead: T, newStageId: string): T {
  if (newStageId !== CONTRACT_SIGNED_STAGE_ID) {
    return { ...lead, stageId: newStageId };
  }
  const q = getCurrentOrgQuarter();
  const today = new Date().toISOString().split("T")[0]!;
  return {
    ...lead,
    stageId: newStageId,
    quarter: quarterLabel(q),
    expectedClose: today,
  };
}

export function getCurrentOrgQuarter(referenceDate = new Date()): LeadQuarter {
  const month = referenceDate.getMonth() + 1;
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

export type CurrentQuarterKpiRow = {
  currency: DealCurrency;
  target: number;
  achieved: number;
  pct: number;
  remaining: number;
};

export type CurrentQuarterKpi = {
  q: LeadQuarter;
  fiscalYear: number;
  currencies: CurrentQuarterKpiRow[];
  overallPct: number;
};

export function computeCurrentQuarterOverallPct(
  currencies: CurrentQuarterKpiRow[],
): number {
  const totalTarget = currencies.reduce((s, c) => s + c.target, 0);
  if (totalTarget <= 0) return 0;
  const weighted = currencies.reduce((s, c) => s + c.pct * c.target, 0);
  return Math.round(weighted / totalTarget);
}

export type TeamQuarterKpiTeam = {
  teamName: string;
  rows: CurrentQuarterKpiRow[];
  overallPct: number;
};

export type TeamQuarterKpi = {
  q: LeadQuarter;
  fiscalYear: number;
  teams: TeamQuarterKpiTeam[];
};

export function getTeamQuarterProgress(
  settings: LeadTargetingSettings,
  leads: LeadTargetFields[],
  teamName: string,
  currency: DealCurrency,
  q: LeadQuarter,
): QuarterProgress | null {
  const ct = settings.currencyTargets.find((row) => row.currency === currency);
  const teamAlloc = ct?.teamAllocations?.find((team) => team.teamName === teamName);
  if (!teamAlloc) return null;

  const target = getQuarterTarget(teamAlloc.quarters, q);
  if (target <= 0) return null;

  const achieved = computeTeamQuarterAchieved(leads, teamName, currency, q);
  return {
    q,
    target,
    achieved,
    pct: computeLeadTargetPct(achieved, target),
    remaining: Math.max(0, target - achieved),
  };
}

export function computeTeamQuarterKpis(
  settings: LeadTargetingSettings,
  leads: LeadTargetFields[],
): TeamQuarterKpi | null {
  const q = getCurrentOrgQuarter();
  const teamsByName = new Map<string, CurrentQuarterKpiRow[]>();

  for (const ct of settings.currencyTargets) {
    for (const teamAlloc of ct.teamAllocations ?? []) {
      const target = getQuarterTarget(teamAlloc.quarters, q);
      if (target <= 0) continue;
      const achieved = computeTeamQuarterAchieved(
        leads,
        teamAlloc.teamName,
        ct.currency,
        q,
      );
      const rows = teamsByName.get(teamAlloc.teamName) ?? [];
      rows.push({
        currency: ct.currency,
        target,
        achieved,
        pct: computeLeadTargetPct(achieved, target),
        remaining: Math.max(0, target - achieved),
      });
      teamsByName.set(teamAlloc.teamName, rows);
    }
  }

  const teams = [...teamsByName.entries()].map(([teamName, rows]) => ({
    teamName,
    rows,
    overallPct: computeCurrentQuarterOverallPct(rows),
  }));

  if (!teams.length) return null;

  return {
    q,
    fiscalYear: settings.fiscalYear,
    teams,
  };
}

export function computeCurrentQuarterKpi(
  settings: LeadTargetingSettings,
  leads: LeadTargetFields[],
): CurrentQuarterKpi | null {
  const q = getCurrentOrgQuarter();
  const currencies = computeOrgSalesTargetProgress(settings, leads)
    .map((progress) => {
      const row = progress.quarters.find((r) => r.q === q);
      if (!row || row.target <= 0) return null;
      return {
        currency: progress.currency,
        target: row.target,
        achieved: row.achieved,
        pct: row.pct,
        remaining: row.remaining,
      };
    })
    .filter((row): row is CurrentQuarterKpiRow => row != null);

  if (!currencies.length) return null;

  return {
    q,
    fiscalYear: settings.fiscalYear,
    currencies,
    overallPct: computeCurrentQuarterOverallPct(currencies),
  };
}

export { CURRENCY_OPTIONS };
