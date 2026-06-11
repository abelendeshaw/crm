import { customerAccounts } from "@/data/customerManagementData";

export {
  BASE_CURRENCY,
  FX_TO_ETB,
  CURRENCY_OPTIONS,
  computeBaseValue,
  dealCustomerAccounts as leadCustomerAccounts,
  STAGE_AGING_WARNING_DAYS,
  type DealCurrency,
  type PipelineStage,
  type PipelineStageCategory,
  type ActivityType,
} from "@/data/dealsManagementData";

import type { DealCurrency, DealPqq, PipelineStage } from "@/data/dealsManagementData";
import type { PqqFormValues } from "@/data/pqqTemplateData";
import { computeBaseValue } from "@/data/dealsManagementData";

export type LeadActivityKind = string;

export type LeadActivity = {
  id: string;
  kind: LeadActivityKind;
  title: string;
  date: string;
  note?: string;
};

export type LeadSource = {
  id: string;
  name: string;
  description?: string;
  order: number;
  isDefault?: boolean;
};

export type CrmLead = {
  id: string;
  name: string;
  customerId: string;
  contactId?: string;
  sourceId: string;
  value: number;
  currency: DealCurrency;
  baseValue: number;
  probability: number;
  expectedClose: string;
  stageId: string;
  stageEnteredAt: string;
  primarySales: string;
  presales: string;
  channel: string;
  description?: string;
  department?: string;
  team?: string;
  solutionCategory?: string;
  fiscalYear?: string;
  quarter?: string;
  currentState?: string;
  nextStep?: string;
  quarterStartDate?: string;
  quarterEndDate?: string;
  pqqTotalScore?: number;
  pqqStatus?: string;
  exceptionJustification?: string;
  exceptionApprovedBy?: string;
  checklistValidationStatus?: string;
  /** Revenue target assigned to this lead (base currency, seeded from external targeting system) */
  salesTarget?: number;
  /** Amount achieved toward the sales target (base currency) */
  targetAchieved?: number;
  /** Optional Lead Discovery & PQQ worksheet captured at creation or on the lead record */
  pqq?: DealPqq;
  /** Values for template-driven PQQ fields when the active template uses a custom form definition */
  pqqFormValues?: PqqFormValues;
  activities: LeadActivity[];
};

export const DEFAULT_LEAD_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "lead-stage-new",
    name: "New",
    category: "open",
    order: 0,
    columnClass: "bg-[#faf9fb]",
    borderClass: "border-[#e8e5ee]",
  },
  {
    id: "lead-stage-contacted",
    name: "Contacted",
    category: "open",
    order: 1,
    columnClass: "bg-[#f8fbfd]",
    borderClass: "border-[#e0e8f2]",
  },
  {
    id: "lead-stage-qualified",
    name: "Qualified",
    category: "open",
    order: 2,
    columnClass: "bg-[#f8fdf9]",
    borderClass: "border-[#dae8e2]",
  },
  {
    id: "lead-stage-nurture",
    name: "Nurturing",
    category: "open",
    order: 3,
    columnClass: "bg-[#fdfaf6]",
    borderClass: "border-[#e8e2d0]",
  },
  {
    id: "lead-stage-contract-signed",
    name: "Contract Signed",
    category: "won",
    order: 4,
    columnClass: "bg-[#f0fdf4]",
    borderClass: "border-[#86efac]",
  },
  {
    id: "lead-stage-converted",
    name: "Converted",
    category: "won",
    order: 5,
    columnClass: "bg-[#f8fcf9]",
    borderClass: "border-[#d4e6dc]",
  },
  {
    id: "lead-stage-disqualified",
    name: "Disqualified",
    category: "lost",
    order: 6,
    columnClass: "bg-[#fdf8f8]",
    borderClass: "border-[#e8dada]",
  },
];

export const DEFAULT_LEAD_SOURCES: LeadSource[] = [
  {
    id: "lead-source-website",
    name: "Website",
    description: "Inbound from website or digital properties.",
    order: 0,
    isDefault: true,
  },
  {
    id: "lead-source-referral",
    name: "Referral",
    description: "Referred by a customer, partner, or employee.",
    order: 1,
  },
  {
    id: "lead-source-partner",
    name: "Partner",
    description: "Channel or partner-sourced lead.",
    order: 2,
  },
  {
    id: "lead-source-outbound",
    name: "Outbound",
    description: "Prospected directly by sales.",
    order: 3,
  },
  {
    id: "lead-source-event",
    name: "Event",
    description: "Trade show, conference, or field marketing.",
    order: 4,
  },
];

const ownersPool = [
  "Sara Tesfaye",
  "Biruk Mekonnen",
  "Daniel Bekele",
  "Nahom Esrael",
  "Hana Worku",
];

export const SALES_TEAMS = [
  "Public and Telecom Sales",
  "International and Corporate Sales",
  "BFSI",
] as const;

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0]!;
}

const leadBlueprints: Array<{
  topic: string;
  solutionCategory: string;
  department: string;
}> = [
  { topic: "ERP rollout", solutionCategory: "ERP", department: "Operations" },
  { topic: "CRM platform", solutionCategory: "CRM", department: "Sales" },
  { topic: "HRIS upgrade", solutionCategory: "HRIS", department: "People" },
  { topic: "Finance automation", solutionCategory: "Finance", department: "Finance" },
  { topic: "Warehouse digitization", solutionCategory: "WMS", department: "Logistics" },
  { topic: "Cybersecurity audit", solutionCategory: "Security", department: "IT" },
  { topic: "POS modernization", solutionCategory: "Retail", department: "Operations" },
  { topic: "Data warehouse", solutionCategory: "Analytics", department: "Data" },
  { topic: "Self-service portal", solutionCategory: "Portal", department: "Customer Success" },
  { topic: "Field service app", solutionCategory: "Mobile", department: "Service" },
];

// Leads at these indices will be seeded as "Contract Signed" for targeting demo
const CONTRACT_SIGNED_SEED_INDICES = new Set([1, 4, 7, 8]);

// Quarter → expected-close date mapping for seeded "Contract Signed" leads
const CONTRACT_SIGNED_CLOSE_DATES: Record<number, string> = {
  1: "2026-02-15",
  4: "2026-04-20",
  7: "2026-05-10",
  8: "2026-06-05",
};

function seedLeads(): CrmLead[] {
  const accounts = customerAccounts;
  const stages = DEFAULT_LEAD_PIPELINE_STAGES;
  const targetThisMonth = "2026-05-28";
  const targetNextMonth = "2026-06-12";
  const total = Math.max(8, leadBlueprints.length);

  return leadBlueprints.slice(0, total).map((bp, i) => {
    const acc = accounts[i % accounts.length]!;
    const isContractSigned = CONTRACT_SIGNED_SEED_INDICES.has(i);
    const stage = isContractSigned
      ? DEFAULT_LEAD_PIPELINE_STAGES.find(s => s.id === "lead-stage-contract-signed")!
      : stages[i % stages.length]!;
    const source = DEFAULT_LEAD_SOURCES[i % DEFAULT_LEAD_SOURCES.length]!;
    const currency: DealCurrency = i % 3 === 0 ? "USD" : i % 3 === 1 ? "ETB" : "EUR";
    const value = 12000 + i * 6200;
    const probability = [20, 35, 45, 55, 70, 85, 40, 60, 25, 50][i % 10]!;
    const stuckDays = [1, 3, 5, 8, 12, 2, 6, 14, 4, 9][i % 10]!;
    const isFirst = i === 0;
    const baseValue = computeBaseValue(value, currency);
    const salesTarget = Math.round(baseValue * (1.15 + (i % 3) * 0.1));
    const targetAchieved = isContractSigned
      ? Math.min(salesTarget, Math.max(baseValue, Math.round(salesTarget * 0.65)))
      : i % 5 === 0
        ? Math.round(salesTarget * 0.25)
        : undefined;
    return {
      id: `lead-seed-${i + 1}-${acc.id}`,
      name: `${acc.name.split(" ")[0] ?? "Account"} ${bp.topic}`,
      customerId: acc.id,
      sourceId: source.id,
      value,
      currency,
      baseValue,
      salesTarget,
      targetAchieved,
      probability,
      expectedClose: CONTRACT_SIGNED_CLOSE_DATES[i] ?? (i % 2 === 0 ? targetThisMonth : targetNextMonth),
      stageId: stage.id,
      stageEnteredAt: isoDaysAgo(stuckDays),
      primarySales: ownersPool[i % ownersPool.length]!,
      presales: ownersPool[(i + 1) % ownersPool.length]!,
      channel: ownersPool[(i + 2) % ownersPool.length]!,
      department: bp.department,
      team: SALES_TEAMS[i % SALES_TEAMS.length]!,
      solutionCategory: bp.solutionCategory,
      fiscalYear: isFirst ? "2018" : `${2025 + (i % 3)}`,
      quarter: (["Q1", "Q2", "Q3", "Q4"] as const)[i % 4],
      currentState: isFirst ? "LEAD" : undefined,
      nextStep: isFirst ? "Nurturing" : undefined,
      quarterStartDate: isFirst ? "Q4" : undefined,
      quarterEndDate: isFirst ? "Q2" : undefined,
      pqqTotalScore: isFirst ? 37 : undefined,
      pqqStatus: isFirst ? "Qualified" : undefined,
      exceptionJustification: isFirst ? "N/A" : undefined,
      exceptionApprovedBy: isFirst ? "Nahom Wendessen" : undefined,
      checklistValidationStatus: isFirst ? "Approved" : undefined,
      activities: [
        {
          id: `lead-act-${i + 1}-1`,
          kind: "Call",
          title: "Introduction call",
          date: isoDaysAgo(stuckDays + 8),
          note: "Captured needs overview.",
        },
        {
          id: `lead-act-${i + 1}-2`,
          kind: "Meeting",
          title: "Discovery meeting",
          date: isoDaysAgo(stuckDays + 2),
        },
      ],
    };
  });
}

export const initialLeads: CrmLead[] = seedLeads();

export const AUTOMATION_DEFAULT_LEAD_STAGE_ID = DEFAULT_LEAD_PIPELINE_STAGES[0]!.id;
export const AUTOMATION_DEFAULT_LEAD_SOURCE_ID = DEFAULT_LEAD_SOURCES[0]!.id;
export const AUTOMATION_DEFAULT_LEAD_ROLES = {
  primarySales: ownersPool[0]!,
  presales: ownersPool[1]!,
  channel: ownersPool[2]!,
};
