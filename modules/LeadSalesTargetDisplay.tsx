"use client";

import { cn } from "@/lib/utils";
import type { DealCurrency } from "@/data/dealsManagementData";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  computeLeadQuarterContribution,
  computeOrgSalesTargetProgress,
  formatCompactMoney,
  formatMoneyInCurrency,
  getLeadQuarter,
  getTeamQuarterProgress,
  type CurrencyTargetProgress,
  type LeadQuarter,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";

type LeadFields = Pick<
  CrmLead,
  "stageId" | "currency" | "value" | "quarter" | "expectedClose" | "team"
>;

function activeQuarterRow(progress: CurrencyTargetProgress, activeQ: LeadQuarter) {
  return progress.quarters.find((q) => q.q === activeQ) ?? progress.quarters[0];
}

export function LeadSalesTargetSummary({
  lead,
  allLeads,
  settings,
}: {
  lead: LeadFields;
  allLeads: LeadFields[];
  settings: LeadTargetingSettings;
}) {
  const activeQ = getLeadQuarter(lead);
  const teamRow =
    lead.team &&
    getTeamQuarterProgress(settings, allLeads, lead.team, lead.currency, activeQ);
  const progressList = computeOrgSalesTargetProgress(settings, allLeads);
  const relevant = progressList.filter((p) => p.currency === lead.currency);
  const progress = relevant[0];
  const row =
    teamRow ??
    (progress ? activeQuarterRow(progress, activeQ) : null);
  if (!row || row.target <= 0) return null;

  const currency = teamRow ? lead.currency : progress!.currency;
  const contribution = computeLeadQuarterContribution(lead, currency, row.q);

  return (
    <div className="space-y-1 border-t border-[#f3f4f6] pt-2">
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="font-medium text-[#6b7280]">
          Q{row.q} · {currency}
          {lead.team ? ` · ${lead.team}` : ""}
        </span>
        <span className="text-right text-[#374151]">
          <span className="font-semibold text-[#1c1e21]">
            {formatCompactMoney(row.achieved, currency)}
          </span>
          <span className="text-[#9ca3af]">
            {" "}
            / {formatCompactMoney(row.target, currency)}
          </span>
          <span className="ml-1 font-bold text-[#4080f0]">{row.pct}%</span>
        </span>
      </div>
      {contribution > 0 && (
        <p className="text-[9px] text-[#9ca3af]">
          This lead: {formatCompactMoney(contribution, currency)}
        </p>
      )}
    </div>
  );
}

function QuarterPill({
  q,
  target,
  achieved,
  pct,
  currency,
  isActive,
  contribution,
}: {
  q: LeadQuarter;
  target: number;
  achieved: number;
  pct: number;
  currency: DealCurrency;
  isActive: boolean;
  contribution?: number;
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-md border px-1.5 py-2 text-center",
        isActive
          ? "border-[#bfdbfe] bg-[#eff6ff]"
          : "border-[#e5e7eb] bg-[#f9fafb]",
      )}
    >
      <p
        className={cn(
          "text-[9px] font-semibold uppercase tracking-wider",
          isActive ? "text-[#4080f0]" : "text-[#9ca3af]",
        )}
      >
        Q{q}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-[#1c1e21]">
        {formatCompactMoney(achieved, currency)}
      </p>
      <p className="text-[9px] text-[#9ca3af]">
        / {formatCompactMoney(target, currency)}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[10px] font-bold",
          isActive ? "text-[#4080f0]" : "text-[#6b7280]",
        )}
      >
        {pct}%
      </p>
      {contribution != null && contribution > 0 && (
        <p className="mt-1 text-[8px] text-[#16a34a]">
          +{formatCompactMoney(contribution, currency)}
        </p>
      )}
    </div>
  );
}

export function LeadSalesTargetDetail({
  lead,
  allLeads,
  settings,
}: {
  lead: LeadFields;
  allLeads: LeadFields[];
  settings: LeadTargetingSettings;
}) {
  const progressList = computeOrgSalesTargetProgress(settings, allLeads);
  if (!progressList.length) return null;

  const activeQ = getLeadQuarter(lead);

  return (
    <div className="space-y-5">
      <p className="text-[12px] text-[#6b7280]">
        FY {settings.fiscalYear} company-wide quarterly targets set by executive leadership.
        Achievement rolls up from all contract-signed leads.
      </p>
      {progressList.map((progress) => (
        <div
          key={progress.currency}
          className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                {progress.currency} annual
              </p>
              <p className="mt-0.5 text-xl font-black text-[#1c1e21]">
                {formatMoneyInCurrency(progress.annualAchieved, progress.currency)}
                <span className="text-sm font-medium text-[#9ca3af]">
                  {" "}
                  / {formatMoneyInCurrency(progress.annualTarget, progress.currency)}
                </span>
              </p>
            </div>
            <p className="text-2xl font-black text-[#4080f0]">{progress.annualPct}%</p>
          </div>

          <div className="mt-4 flex items-center gap-1.5">
            {progress.quarters.map((row) => (
              <QuarterPill
                key={row.q}
                q={row.q}
                target={row.target}
                achieved={row.achieved}
                pct={row.pct}
                currency={progress.currency}
                isActive={row.q === activeQ && lead.currency === progress.currency}
                contribution={
                  lead.currency === progress.currency
                    ? computeLeadQuarterContribution(lead, progress.currency, row.q)
                    : 0
                }
              />
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-[#e5e7eb] pt-3">
            {[
              { label: "Target", value: formatMoneyInCurrency(progress.annualTarget, progress.currency) },
              { label: "Achieved", value: formatMoneyInCurrency(progress.annualAchieved, progress.currency) },
              { label: "Remaining", value: formatMoneyInCurrency(progress.annualRemaining, progress.currency) },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                  {m.label}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-[#1c1e21]">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-[#9ca3af]">
        When this lead reaches{" "}
        <span className="font-medium text-[#374151]">Contract Signed</span>, its estimated value is
        added to the matching currency and quarter in the totals above.
      </p>
    </div>
  );
}
