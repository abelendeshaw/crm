import { BASE_CURRENCY, FX_TO_ETB, type DealCurrency } from "./dealsManagementData";

export const CONTRACT_SIGNED_STAGE_ID = "lead-stage-contract-signed";

export type LeadTargetingSettings = {
  /** Currency used when displaying target values across the leads module */
  displayCurrency: DealCurrency;
  /** Annual company revenue target set by executive leadership */
  annualRevenueTarget: number;
  fiscalYear: number;
};

export const DEFAULT_LEAD_TARGETING_SETTINGS: LeadTargetingSettings = {
  displayCurrency: BASE_CURRENCY,
  annualRevenueTarget: 260_000_000,
  fiscalYear: 2026,
};

export function convertFromBase(amountInEtb: number, currency: DealCurrency): number {
  const rate = FX_TO_ETB[currency] ?? 1;
  return rate === 0 ? amountInEtb : amountInEtb / rate;
}

export function convertToBase(amount: number, currency: DealCurrency): number {
  const rate = FX_TO_ETB[currency] ?? 1;
  return Math.round(amount * rate);
}

export function formatTargetMoney(amountInEtb: number, currency: DealCurrency): string {
  const amount = convertFromBase(amountInEtb, currency);
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

export function computeLeadTargetPct(achieved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 100));
}

export function targetProgressColor(pct: number): string {
  if (pct >= 80) return "bg-[#22c55e]";
  if (pct >= 50) return "bg-[#4080f0]";
  return "bg-[#9ca3af]";
}

export function targetProgressTextColor(pct: number): string {
  if (pct >= 80) return "text-[#16a34a]";
  if (pct >= 50) return "text-[#4080f0]";
  return "text-[#6b7280]";
}

/** Auto-update achievement when a lead reaches Contract Signed */
export function applyContractSignedAchievement(
  lead: { baseValue: number; salesTarget?: number; targetAchieved?: number },
  newStageId: string,
): number | undefined {
  if (newStageId !== CONTRACT_SIGNED_STAGE_ID || lead.salesTarget == null) {
    return lead.targetAchieved;
  }
  const current = lead.targetAchieved ?? 0;
  const autoValue = Math.min(lead.salesTarget, Math.max(current, lead.baseValue));
  return autoValue;
}
