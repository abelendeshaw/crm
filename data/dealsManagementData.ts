import { customerAccounts } from "@/data/customerManagementData";

export const BASE_CURRENCY = "ETB" as const;

/** Mock FX: multiply deal value in `currency` to get ETB base */
export const FX_TO_ETB: Record<string, number> = {
  ETB: 1,
  USD: 57.5,
  EUR: 62.1,
  GBP: 72.4,
};

export const CURRENCY_OPTIONS = ["ETB", "USD", "EUR", "GBP"] as const;
export type DealCurrency = (typeof CURRENCY_OPTIONS)[number];

export type PipelineStageCategory = "open" | "won" | "lost";

export type PipelineStage = {
  id: string;
  name: string;
  category: PipelineStageCategory;
  order: number;
  /** Column background */
  columnClass: string;
  /** Column border */
  borderClass: string;
  /** Custom hex color — when set, overrides columnClass/borderClass */
  customColor?: string;
};

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "stage-qualification",
    name: "Qualification",
    category: "open",
    order: 0,
    columnClass: "bg-[#f5f3ff]",
    borderClass: "border-[#e9d5ff]",
  },
  {
    id: "stage-needs",
    name: "Needs Analysis",
    category: "open",
    order: 1,
    columnClass: "bg-[#eff6ff]",
    borderClass: "border-[#bfdbfe]",
  },
  {
    id: "stage-proposal",
    name: "Proposal",
    category: "open",
    order: 2,
    columnClass: "bg-[#ecfdf5]",
    borderClass: "border-[#a7f3d0]",
  },
  {
    id: "stage-negotiation",
    name: "Negotiation",
    category: "open",
    order: 3,
    columnClass: "bg-[#fffbeb]",
    borderClass: "border-[#fde68a]",
  },
  {
    id: "stage-won",
    name: "Closed Won",
    category: "won",
    order: 4,
    columnClass: "bg-[#ecfdf3]",
    borderClass: "border-[#86efac]",
  },
  {
    id: "stage-lost",
    name: "Closed Lost",
    category: "lost",
    order: 5,
    columnClass: "bg-[#fef2f2]",
    borderClass: "border-[#fecaca]",
  },
];
export type ActivityType = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  isDefault?: boolean;
  order?: number;
};

export type DealActivityKind = string;

export type DealActivity = {
  id: string;
  kind: DealActivityKind;
  title: string;
  date: string;
  note?: string;
};

/** Lead Discovery & PQQ (BANT) — captured at deal creation and editable on the deal record */
export type PqqBantBudgetTier = "none" | "unclear" | "expected" | "confirmed";
export type PqqBantAuthorityTier = "none" | "indirect" | "influencer" | "decisionMaker";
export type PqqBantNeedTier = "weak" | "general" | "defined" | "strong";
export type PqqBantTimelineTier = "none" | "long" | "medium" | "immediate";

export type DealPqqBant = {
  budgetTier: PqqBantBudgetTier;
  budgetScore: number;
  budgetNotes: string;
  authorityTier: PqqBantAuthorityTier;
  authorityScore: number;
  authorityNotes: string;
  needTier: PqqBantNeedTier;
  needScore: number;
  needNotes: string;
  timelineTier: PqqBantTimelineTier;
  timelineScore: number;
  timelineNotes: string;
};

export type DealPqq = {
  owner: string;
  reviewedBy: string;
  opportunityName: string;
  clientName: string;
  industry: string;
  contactPerson: string;
  opportunityDescription: string;
  sourceDirectClient: boolean;
  sourceTender: boolean;
  sourcePartner: boolean;
  sourceReferral: boolean;
  sourceRenewal: boolean;
  rfpPreviouslyWorked: boolean;
  rfpNew: boolean;
  problem: string;
  whyNow: string;
  impactIfNotSolved: string;
  existingSystems: string;
  currentVendors: string;
  limitations: string;
  expectedSolution: string;
  preferredVendors: string;
  keyFeatures: string;
  scope: string;
  locations: string;
  projectSize: string;
  projectStart: string;
  deadline: string;
  budgetStatus: string;
  budgetEstimate: string;
  approvalStatus: string;
  decisionMaker: string;
  influencers: string;
  approver: string;
  competition: string;
  opportunityStage: string;
  risks: string;
  unclearAreas: string;
  bant: DealPqqBant;
  stlName: string;
  stlOutcome: "pending" | "approved" | "rejected";
  stlComments: string;
  exceptionJustification: string;
  exceptionApprovedBy: string;
  exceptionRemarks: string;
};

export const PQQ_BANT_SCORE_CAP = 12;
export const PQQ_DECISION_THRESHOLD = 36;
export const PQQ_MAX_TOTAL = 48;

export const PQQ_BANT_DEFAULT_SCORES: Record<
  keyof Pick<DealPqqBant, "budgetTier" | "authorityTier" | "needTier" | "timelineTier">,
  Record<string, number>
> = {
  budgetTier: { none: 2, unclear: 5, expected: 8, confirmed: 11 },
  authorityTier: { none: 2, indirect: 5, influencer: 8, decisionMaker: 11 },
  needTier: { weak: 2, general: 5, defined: 8, strong: 11 },
  timelineTier: { none: 2, long: 5, medium: 8, immediate: 11 },
};

export function createEmptyDealPqq(): DealPqq {
  return {
    owner: "AE",
    reviewedBy: "STL",
    opportunityName: "",
    clientName: "",
    industry: "",
    contactPerson: "",
    opportunityDescription: "",
    sourceDirectClient: false,
    sourceTender: false,
    sourcePartner: false,
    sourceReferral: false,
    sourceRenewal: false,
    rfpPreviouslyWorked: false,
    rfpNew: false,
    problem: "",
    whyNow: "",
    impactIfNotSolved: "",
    existingSystems: "",
    currentVendors: "",
    limitations: "",
    expectedSolution: "",
    preferredVendors: "",
    keyFeatures: "",
    scope: "",
    locations: "",
    projectSize: "",
    projectStart: "",
    deadline: "",
    budgetStatus: "",
    budgetEstimate: "",
    approvalStatus: "",
    decisionMaker: "",
    influencers: "",
    approver: "",
    competition: "",
    opportunityStage: "",
    risks: "",
    unclearAreas: "",
    bant: {
      budgetTier: "unclear",
      budgetScore: PQQ_BANT_DEFAULT_SCORES.budgetTier.unclear,
      budgetNotes: "",
      authorityTier: "indirect",
      authorityScore: PQQ_BANT_DEFAULT_SCORES.authorityTier.indirect,
      authorityNotes: "",
      needTier: "strong",
      needScore: PQQ_BANT_DEFAULT_SCORES.needTier.strong,
      needNotes: "",
      timelineTier: "medium",
      timelineScore: PQQ_BANT_DEFAULT_SCORES.timelineTier.medium,
      timelineNotes: "",
    },
    stlName: "",
    stlOutcome: "pending",
    stlComments: "",
    exceptionJustification: "",
    exceptionApprovedBy: "",
    exceptionRemarks: "",
  };
}

export function clampPqqScore(n: number): number {
  return Math.min(PQQ_BANT_SCORE_CAP, Math.max(0, Math.round(n)));
}

export function computeDealPqqTotal(bant: DealPqqBant): number {
  return clampPqqScore(bant.budgetScore) +
    clampPqqScore(bant.authorityScore) +
    clampPqqScore(bant.needScore) +
    clampPqqScore(bant.timelineScore);
}

export type CrmDeal = {
  id: string;
  name: string;
  customerId: string;
  value: number;
  currency: DealCurrency;
  baseValue: number;
  probability: number;
  expectedClose: string;
  stageId: string;
  /** When the deal entered the current stage (for aging) */
  stageEnteredAt: string;
  primarySales: string;
  presales: string;
  channel: string;
  createdFromLead?: boolean;
  leadConvertedAt?: string;
  description?: string;
  /** Lead Discovery & PQQ / BANT worksheet */
  pqq?: DealPqq;
  activities: DealActivity[];
};

const ownersPool = [
  "Sara Tesfaye",
  "Biruk Mekonnen",
  "Daniel Bekele",
  "Nahom Esrael",
  "Hana Worku",
];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0]!;
}

export function computeBaseValue(value: number, currency: DealCurrency) {
  const rate = FX_TO_ETB[currency] ?? 1;
  return Math.round(value * rate);
}

function seedDeals(): CrmDeal[] {
  const accounts = customerAccounts.slice(0, 8);
  const stages = DEFAULT_PIPELINE_STAGES;
  const closeThisMonth = "2026-05-28";
  const closeNextMonth = "2026-06-12";

  return accounts.map((acc, i) => {
    const stage = stages[i % 6]!;
    const currency: DealCurrency = i % 3 === 0 ? "USD" : i % 3 === 1 ? "ETB" : "EUR";
    const value = 45000 + i * 18500;
    const probability = [25, 40, 55, 65, 80, 90, 35][i % 7]!;
    const stuckDays = i === 2 ? 5 : i === 5 ? 12 : 1;
    return {
      id: `deal-seed-${acc.id}`,
      name: `${acc.name.split(" ")[0] ?? "Account"} expansion`,
      customerId: acc.id,
      value,
      currency,
      baseValue: computeBaseValue(value, currency),
      probability,
      expectedClose: i % 2 === 0 ? closeThisMonth : closeNextMonth,
      stageId: stage.id,
      stageEnteredAt: isoDaysAgo(stuckDays),
      primarySales: ownersPool[i % ownersPool.length]!,
      presales: ownersPool[(i + 1) % ownersPool.length]!,
      channel: ownersPool[(i + 2) % ownersPool.length]!,
      createdFromLead: i % 2 === 0,
      leadConvertedAt: i % 2 === 0 ? isoDaysAgo(stuckDays + 14) : undefined,
      activities: [
        {
          id: `act-${acc.id}-1`,
          kind: "Call",
          title: "Discovery call",
          date: isoDaysAgo(stuckDays + 10),
          note: "Discussed scope and timeline.",
        },
        {
          id: `act-${acc.id}-2`,
          kind: "Meeting",
          title: "Solution workshop",
          date: isoDaysAgo(stuckDays + 3),
        },
      ],
    };
  });
}

export const initialDeals: CrmDeal[] = seedDeals();

export const STAGE_AGING_WARNING_DAYS = 4;

/** Defaults applied when simulating Lead → Deal (frontend only) */
export const AUTOMATION_DEFAULT_STAGE_ID = DEFAULT_PIPELINE_STAGES[0]!.id;
export const AUTOMATION_DEFAULT_ROLES = {
  primarySales: ownersPool[0]!,
  presales: ownersPool[1]!,
  channel: ownersPool[2]!,
};

export { customerAccounts as dealCustomerAccounts };
