import { CURRENCY_OPTIONS, type DealCurrency } from "./dealsManagementData";
import type { CrmLead } from "./leadsManagementData";
import {
  cloneFiscalYearConfig,
  defaultFiscalYearCatalog,
  defaultQuarterDefinitions,
  type FiscalQuarterDefinition,
  type FiscalYearConfig,
  type LeadQuarter,
} from "./fiscalQuarterData";
import { teams as orgTeams, departments as orgDepartments, users as orgUsers } from "./userManagementData";

export type { FiscalQuarterDefinition, FiscalYearConfig, LeadQuarter } from "./fiscalQuarterData";
export {
  cloneFiscalYearConfig,
  defaultFiscalYearCatalog,
  defaultQuarterDefinitions,
  formatFiscalYearQuartersSummary,
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

export type DepartmentAllocation = {
  departmentName: string;
  quarters: LeadQuarterTarget[];
};

export type PersonAllocation = {
  personName: string;
  teamName: string;
  departmentName: string;
  quarters: LeadQuarterTarget[];
};

export type CurrencyQuarterlyTargets = {
  currency: DealCurrency;
  quarters: LeadQuarterTarget[];
  departmentAllocations: DepartmentAllocation[];
  teamAllocations: SalesTeamAllocation[];
  personAllocations: PersonAllocation[];
};

export type LeadTargetingSettings = {
  fiscalYear: number;
  quarterDefinitions: FiscalQuarterDefinition[];
  fiscalYears: FiscalYearConfig[];
  currencyTargets: CurrencyQuarterlyTargets[];
};

function migrateFiscalYears(settings: LeadTargetingSettings): FiscalYearConfig[] {
  if (settings.fiscalYears?.length) {
    return settings.fiscalYears.map((row) => cloneFiscalYearConfig(row));
  }

  return [
    {
      year: settings.fiscalYear,
      quarterDefinitions: (settings.quarterDefinitions?.length
        ? settings.quarterDefinitions
        : defaultQuarterDefinitions()
      ).map((row) => ({ ...row })),
    },
  ];
}

export function applyActiveFiscalYear(
  settings: LeadTargetingSettings,
  year: number,
): LeadTargetingSettings {
  const config = settings.fiscalYears.find((row) => row.year === year);
  if (!config) return settings;
  return {
    ...settings,
    fiscalYear: year,
    quarterDefinitions: config.quarterDefinitions.map((row) => ({ ...row })),
  };
}

export function updateFiscalYearPeriod(
  settings: LeadTargetingSettings,
  year: number,
  q: LeadQuarter,
  periodLabel: string,
): LeadTargetingSettings {
  const fiscalYears = settings.fiscalYears.map((row) =>
    row.year === year
      ? {
          ...row,
          quarterDefinitions: row.quarterDefinitions.map((definition) =>
            definition.q === q ? { ...definition, periodLabel } : definition,
          ),
        }
      : row,
  );
  const isActive = settings.fiscalYear === year;
  const activeDefinitions = fiscalYears.find((row) => row.year === year)?.quarterDefinitions;
  return {
    ...settings,
    fiscalYears,
    quarterDefinitions: isActive && activeDefinitions
      ? activeDefinitions.map((row) => ({ ...row }))
      : settings.quarterDefinitions,
  };
}

export function addFiscalYearConfig(
  settings: LeadTargetingSettings,
  year: number,
): LeadTargetingSettings {
  if (settings.fiscalYears.some((row) => row.year === year)) return settings;
  return {
    ...settings,
    fiscalYears: [
      ...settings.fiscalYears,
      { year, quarterDefinitions: defaultQuarterDefinitions() },
    ].sort((a, b) => a.year - b.year),
  };
}

export const SALES_ORG_TEAMS = orgTeams.filter((t) => t.department === "Sales");

export const TARGET_DEPARTMENTS = orgDepartments.map((d) => d.name);

export const SALES_PERSONNEL = orgUsers.filter(
  (user) => user.department === "Sales" && user.status === "Active",
);

const TEAM_REP_SEED: Record<string, string[]> = {
  "Public and Telecom Sales": ["Sara Tesfaye", "Daniel Bekele"],
  "International and Corporate Sales": ["Biruk Mekonnen", "Nahom Esrael"],
  BFSI: ["Hana Worku"],
};

export function teamsInDepartment(departmentName: string): string[] {
  if (departmentName !== "Sales") return [];
  return SALES_ORG_TEAMS.map((team) => team.name);
}

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

function migrateDepartmentAllocation(
  department: DepartmentAllocation | undefined,
  departmentName: string,
  fallback?: LeadQuarterTarget[],
): DepartmentAllocation {
  if (department?.quarters?.length) {
    return {
      departmentName,
      quarters: department.quarters.map((row) => ({ ...row })),
    };
  }
  return {
    departmentName,
    quarters: (fallback ?? emptyQuarterlyTargets()).map((row) => ({ ...row })),
  };
}

function migratePersonAllocation(person: PersonAllocation): PersonAllocation {
  return {
    personName: person.personName,
    teamName: person.teamName,
    departmentName: person.departmentName,
    quarters: migrateAllocationQuarters(person.quarters),
  };
}

export function createEmptyDepartmentAllocations(): DepartmentAllocation[] {
  return TARGET_DEPARTMENTS.map((departmentName) => ({
    departmentName,
    quarters: emptyQuarterlyTargets(),
  }));
}

export function createEmptyPersonAllocations(): PersonAllocation[] {
  return SALES_ORG_TEAMS.flatMap((team) => {
    const reps = TEAM_REP_SEED[team.name] ?? [];
    return reps.map((personName) => ({
      personName,
      teamName: team.name,
      departmentName: "Sales",
      quarters: emptyQuarterlyTargets(),
    }));
  });
}

function seedDepartmentAllocations(companyQuarters: LeadQuarterTarget[]): DepartmentAllocation[] {
  return TARGET_DEPARTMENTS.map((departmentName) => ({
    departmentName,
    quarters:
      departmentName === "Sales"
        ? companyQuarters.map((row) => ({ ...row }))
        : emptyQuarterlyTargets(),
  }));
}

function distributeSingleQuarterToPersons(
  quarterTarget: number,
  q: LeadQuarter,
  allocations: PersonAllocation[],
): PersonAllocation[] {
  if (quarterTarget <= 0 || allocations.length === 0) {
    return allocations.map((person) => ({
      ...person,
      quarters: updateQuarterTarget(person.quarters, q, 0),
    }));
  }

  const shares = splitEvenly(quarterTarget, allocations.length);
  return allocations.map((person, index) => ({
    ...person,
    quarters: updateQuarterTarget(person.quarters, q, shares[index] ?? 0),
  }));
}

function seedPersonAllocations(teamAllocations: SalesTeamAllocation[]): PersonAllocation[] {
  return SALES_ORG_TEAMS.flatMap((team) => {
    const teamAlloc = teamAllocations.find((row) => row.teamName === team.name);
    const reps = TEAM_REP_SEED[team.name] ?? [];
    if (!teamAlloc || reps.length === 0) return [];

    let persons: PersonAllocation[] = reps.map((personName) => ({
      personName,
      teamName: team.name,
      departmentName: "Sales",
      quarters: emptyQuarterlyTargets(),
    }));

    persons = ([1, 2, 3, 4] as const).reduce(
      (next, q) =>
        distributeSingleQuarterToPersons(
          getQuarterTarget(teamAlloc.quarters, q),
          q,
          next,
        ),
      persons,
    );

    return persons;
  });
}

export function migrateCurrencyTarget(ct: CurrencyQuarterlyTargets): CurrencyQuarterlyTargets {
  const teamAllocations = (ct.teamAllocations ?? []).map((team) =>
    migrateTeamAllocation(team),
  );
  const companyQuarters = ct.quarters?.length
    ? ct.quarters.map((row) => ({ ...row }))
    : defaultQuarters(0);

  const departmentAllocations = (ct.departmentAllocations?.length
    ? ct.departmentAllocations
    : seedDepartmentAllocations(companyQuarters)
  ).map((department) =>
    migrateDepartmentAllocation(
      department,
      department.departmentName,
      department.departmentName === "Sales" ? companyQuarters : undefined,
    ),
  );

  const personAllocations = (ct.personAllocations?.length
    ? ct.personAllocations
    : seedPersonAllocations(teamAllocations)
  ).map((person) => migratePersonAllocation(person));

  return {
    currency: ct.currency,
    quarters: companyQuarters,
    departmentAllocations,
    teamAllocations,
    personAllocations,
  };
}

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

export function distributeCompanyTargetsToSalesTeams(
  ct: CurrencyQuarterlyTargets,
): CurrencyQuarterlyTargets {
  const allocations =
    ct.teamAllocations?.length
      ? ct.teamAllocations.map((team) => ({
          teamName: team.teamName,
          quarters: team.quarters.map((row) => ({ ...row })),
        }))
      : createEmptyTeamAllocations();

  const next: CurrencyQuarterlyTargets = {
    ...ct,
    teamAllocations: distributeCompanyTargetsToTeams(ct.quarters, allocations),
  };

  return syncDepartmentQuartersFromTeams(next, "Sales");
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
const DEFAULT_USD_ANNUAL = 2_000_000;

const DEFAULT_FISCAL_YEAR = 2026;

const DEFAULT_ETB_QUARTERS = defaultQuarters(DEFAULT_ETB_ANNUAL);
const DEFAULT_USD_QUARTERS = defaultQuarters(DEFAULT_USD_ANNUAL);
const DEFAULT_ETB_TEAMS = seedTeamAllocations(DEFAULT_ETB_QUARTERS);
const DEFAULT_USD_TEAMS = seedTeamAllocations(DEFAULT_USD_QUARTERS);

export const DEFAULT_LEAD_TARGETING_SETTINGS: LeadTargetingSettings = {
  fiscalYear: DEFAULT_FISCAL_YEAR,
  quarterDefinitions: defaultQuarterDefinitions(),
  fiscalYears: defaultFiscalYearCatalog(DEFAULT_FISCAL_YEAR),
  currencyTargets: [
    {
      currency: "ETB",
      quarters: DEFAULT_ETB_QUARTERS,
      departmentAllocations: seedDepartmentAllocations(DEFAULT_ETB_QUARTERS),
      teamAllocations: DEFAULT_ETB_TEAMS,
      personAllocations: seedPersonAllocations(DEFAULT_ETB_TEAMS),
    },
    {
      currency: "USD",
      quarters: DEFAULT_USD_QUARTERS,
      departmentAllocations: seedDepartmentAllocations(DEFAULT_USD_QUARTERS),
      teamAllocations: DEFAULT_USD_TEAMS,
      personAllocations: seedPersonAllocations(DEFAULT_USD_TEAMS),
    },
  ],
};

export function cloneLeadTargetingSettings(
  settings: LeadTargetingSettings,
): LeadTargetingSettings {
  const fiscalYears = migrateFiscalYears(settings);
  const activeConfig =
    fiscalYears.find((row) => row.year === settings.fiscalYear) ?? fiscalYears[0]!;

  return {
    fiscalYear: settings.fiscalYear,
    fiscalYears,
    quarterDefinitions: activeConfig.quarterDefinitions.map((row) => ({ ...row })),
    currencyTargets: settings.currencyTargets.map((ct) => migrateCurrencyTarget(ct)),
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

export function departmentsQuarterTotal(
  allocations: DepartmentAllocation[],
  q: LeadQuarter,
): number {
  return allocations.reduce(
    (sum, department) => sum + getQuarterTarget(department.quarters, q),
    0,
  );
}

export function personsQuarterTotal(
  allocations: PersonAllocation[],
  q: LeadQuarter,
): number {
  return allocations.reduce(
    (sum, person) => sum + getQuarterTarget(person.quarters, q),
    0,
  );
}

export function syncCompanyQuartersFromDepartments(
  ct: CurrencyQuarterlyTargets,
): CurrencyQuarterlyTargets {
  const allocations = ct.departmentAllocations ?? [];
  return {
    ...ct,
    quarters: ([1, 2, 3, 4] as const).map((q) => ({
      q,
      target: departmentsQuarterTotal(allocations, q),
    })),
  };
}

export function syncDepartmentQuartersFromTeams(
  ct: CurrencyQuarterlyTargets,
  departmentName = "Sales",
): CurrencyQuarterlyTargets {
  const teamNames = teamsInDepartment(departmentName);
  const teamTotal = ([1, 2, 3, 4] as const).map((q) => ({
    q,
    target: (ct.teamAllocations ?? [])
      .filter((team) => teamNames.includes(team.teamName))
      .reduce((sum, team) => sum + getQuarterTarget(team.quarters, q), 0),
  }));

  return {
    ...ct,
    departmentAllocations: (ct.departmentAllocations ?? []).map((department) =>
      department.departmentName === departmentName
        ? { ...department, quarters: teamTotal.map((row) => ({ ...row })) }
        : department,
    ),
  };
}

export function distributeDepartmentTargetsToTeams(
  departmentQuarters: LeadQuarterTarget[],
  allocations: SalesTeamAllocation[],
): SalesTeamAllocation[] {
  return ([1, 2, 3, 4] as const).reduce(
    (next, q) =>
      distributeSingleQuarterToTeams(
        getQuarterTarget(departmentQuarters, q),
        q,
        next,
      ),
    allocations,
  );
}

export function distributeTeamTargetsToPersons(
  teamName: string,
  teamQuarters: LeadQuarterTarget[],
  allocations: PersonAllocation[],
): PersonAllocation[] {
  const teamPersons = allocations.filter((person) => person.teamName === teamName);
  const updatedTeamPersons = ([1, 2, 3, 4] as const).reduce(
    (next, q) =>
      distributeSingleQuarterToPersons(
        getQuarterTarget(teamQuarters, q),
        q,
        next,
      ),
    teamPersons,
  );
  const updatedByName = new Map(
    updatedTeamPersons.map((person) => [person.personName, person]),
  );
  return allocations.map((person) =>
    person.teamName === teamName
      ? updatedByName.get(person.personName) ?? person
      : person,
  );
}

export function syncAllTargetingLayers(ct: CurrencyQuarterlyTargets): CurrencyQuarterlyTargets {
  let next = { ...ct };
  next = syncDepartmentQuartersFromTeams(next);
  next = syncCompanyQuartersFromDepartments(next);
  return next;
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
  "stageId" | "currency" | "value" | "quarter" | "expectedClose" | "team" | "primarySales"
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

export function computePersonQuarterAchieved(
  leads: LeadTargetFields[],
  personName: string,
  currency: DealCurrency,
  q: LeadQuarter,
): number {
  return leads.reduce((sum, lead) => {
    if (lead.primarySales !== personName) return sum;
    if (lead.stageId !== CONTRACT_SIGNED_STAGE_ID) return sum;
    if (lead.currency !== currency) return sum;
    return getLeadQuarter(lead) === q ? sum + lead.value : sum;
  }, 0);
}

export function computeDepartmentQuarterAchieved(
  leads: LeadTargetFields[],
  departmentName: string,
  currency: DealCurrency,
  q: LeadQuarter,
): number {
  const teamNames = teamsInDepartment(departmentName);
  return leads.reduce((sum, lead) => {
    if (!lead.team || !teamNames.includes(lead.team)) return sum;
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
  leads: LeadTargetFields[],
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
  leads: LeadTargetFields[],
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
      (ct.departmentAllocations ?? []).some((department) =>
        department.quarters.some((q) => q.target > 0),
      ) ||
      (ct.teamAllocations ?? []).some((team) =>
        team.quarters.some((q) => q.target > 0),
      ) ||
      (ct.personAllocations ?? []).some((person) =>
        person.quarters.some((q) => q.target > 0),
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

export type PerformanceEntityRow = {
  id: string;
  label: string;
  subtitle?: string;
  currency: DealCurrency;
  target: number;
  achieved: number;
  pct: number;
  remaining: number;
};

export type SalesPerformanceOverview = {
  q: LeadQuarter;
  fiscalYear: number;
  company: PerformanceEntityRow[];
  departments: PerformanceEntityRow[];
  teams: PerformanceEntityRow[];
  persons: PerformanceEntityRow[];
};

export function computeSalesPerformanceOverview(
  settings: LeadTargetingSettings,
  leads: LeadTargetFields[],
  q: LeadQuarter = getCurrentOrgQuarter(),
): SalesPerformanceOverview {
  const company: PerformanceEntityRow[] = [];
  const departments: PerformanceEntityRow[] = [];
  const teams: PerformanceEntityRow[] = [];
  const persons: PerformanceEntityRow[] = [];

  for (const ct of settings.currencyTargets) {
    for (const row of ct.quarters) {
      if (row.q !== q || row.target <= 0) continue;
      const achieved = computeOrgQuarterAchieved(leads, ct.currency, q);
      company.push({
        id: `company-${ct.currency}`,
        label: "Company",
        currency: ct.currency,
        target: row.target,
        achieved,
        pct: computeLeadTargetPct(achieved, row.target),
        remaining: Math.max(0, row.target - achieved),
      });
    }

    for (const department of ct.departmentAllocations ?? []) {
      const target = getQuarterTarget(department.quarters, q);
      if (target <= 0) continue;
      const achieved = computeDepartmentQuarterAchieved(
        leads,
        department.departmentName,
        ct.currency,
        q,
      );
      departments.push({
        id: `dept-${department.departmentName}-${ct.currency}`,
        label: department.departmentName,
        currency: ct.currency,
        target,
        achieved,
        pct: computeLeadTargetPct(achieved, target),
        remaining: Math.max(0, target - achieved),
      });
    }

    for (const team of ct.teamAllocations ?? []) {
      const target = getQuarterTarget(team.quarters, q);
      if (target <= 0) continue;
      const achieved = computeTeamQuarterAchieved(leads, team.teamName, ct.currency, q);
      teams.push({
        id: `team-${team.teamName}-${ct.currency}`,
        label: team.teamName,
        currency: ct.currency,
        target,
        achieved,
        pct: computeLeadTargetPct(achieved, target),
        remaining: Math.max(0, target - achieved),
      });
    }

    for (const person of ct.personAllocations ?? []) {
      const target = getQuarterTarget(person.quarters, q);
      if (target <= 0) continue;
      const achieved = computePersonQuarterAchieved(
        leads,
        person.personName,
        ct.currency,
        q,
      );
      persons.push({
        id: `person-${person.personName}-${ct.currency}`,
        label: person.personName,
        subtitle: person.teamName,
        currency: ct.currency,
        target,
        achieved,
        pct: computeLeadTargetPct(achieved, target),
        remaining: Math.max(0, target - achieved),
      });
    }
  }

  return {
    q,
    fiscalYear: settings.fiscalYear,
    company,
    departments,
    teams,
    persons,
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
