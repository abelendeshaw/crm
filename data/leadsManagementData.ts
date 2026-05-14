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
    columnClass: "bg-[#f5f3ff]",
    borderClass: "border-[#e9d5ff]",
  },
  {
    id: "lead-stage-contacted",
    name: "Contacted",
    category: "open",
    order: 1,
    columnClass: "bg-[#eff6ff]",
    borderClass: "border-[#bfdbfe]",
  },
  {
    id: "lead-stage-qualified",
    name: "Qualified",
    category: "open",
    order: 2,
    columnClass: "bg-[#ecfdf5]",
    borderClass: "border-[#a7f3d0]",
  },
  {
    id: "lead-stage-nurture",
    name: "Nurturing",
    category: "open",
    order: 3,
    columnClass: "bg-[#fffbeb]",
    borderClass: "border-[#fde68a]",
  },
  {
    id: "lead-stage-converted",
    name: "Converted",
    category: "won",
    order: 4,
    columnClass: "bg-[#ecfdf3]",
    borderClass: "border-[#86efac]",
  },
  {
    id: "lead-stage-disqualified",
    name: "Disqualified",
    category: "lost",
    order: 5,
    columnClass: "bg-[#fef2f2]",
    borderClass: "border-[#fecaca]",
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

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0]!;
}

function seedLeads(): CrmLead[] {
  const accounts = customerAccounts.slice(0, 8);
  const stages = DEFAULT_LEAD_PIPELINE_STAGES;
  const targetThisMonth = "2026-05-28";
  const targetNextMonth = "2026-06-12";

  return accounts.map((acc, i) => {
    const stage = stages[i % 6]!;
    const source = DEFAULT_LEAD_SOURCES[i % DEFAULT_LEAD_SOURCES.length]!;
    const currency: DealCurrency = i % 3 === 0 ? "USD" : i % 3 === 1 ? "ETB" : "EUR";
    const value = 12000 + i * 6200;
    const probability = [20, 35, 45, 55, 70, 85, 40][i % 7]!;
    const stuckDays = i === 2 ? 5 : i === 5 ? 12 : 1;
    return {
      id: `lead-seed-${acc.id}`,
      name: `${acc.name.split(" ")[0] ?? "Account"} prospect`,
      customerId: acc.id,
      sourceId: source.id,
      value,
      currency,
      baseValue: computeBaseValue(value, currency),
      probability,
      expectedClose: i % 2 === 0 ? targetThisMonth : targetNextMonth,
      stageId: stage.id,
      stageEnteredAt: isoDaysAgo(stuckDays),
      primarySales: ownersPool[i % ownersPool.length]!,
      presales: ownersPool[(i + 1) % ownersPool.length]!,
      channel: ownersPool[(i + 2) % ownersPool.length]!,
      activities: [
        {
          id: `lead-act-${acc.id}-1`,
          kind: "Call",
          title: "Introduction call",
          date: isoDaysAgo(stuckDays + 8),
          note: "Captured needs overview.",
        },
        {
          id: `lead-act-${acc.id}-2`,
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
