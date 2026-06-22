"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AnnualRevenueChart,
  QuarterlyPerformanceChart,
  type SalesTargetCurrencySummary,
} from "@/components/charts/sales-target-charts";
import type { CrmDeal, PipelineStage } from "@/data/dealsManagementData";
import { computeDealOrgQuarterAchieved } from "@/data/dashboardMetrics";
import {
  computeLeadTargetPct,
  hasOrgSalesTargets,
  quarterSum,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";
import { DealsPipelineKpiCards } from "@/modules/LeadsPipelineKpiCards";

function buildCurrencySummaries(
  deals: CrmDeal[],
  targetingSettings: LeadTargetingSettings,
  wonStageIds: ReadonlySet<string>,
): SalesTargetCurrencySummary[] {
  return targetingSettings.currencyTargets.map((currencyTarget) => {
    const annualTarget = quarterSum(currencyTarget);
    const annualAchieved = ([1, 2, 3, 4] as const).reduce(
      (sum, q) =>
        sum +
        computeDealOrgQuarterAchieved(
          deals,
          currencyTarget.currency,
          q,
          wonStageIds,
        ),
      0,
    );

    return {
      currency: currencyTarget.currency,
      annualTarget,
      annualAchieved,
      annualPct: computeLeadTargetPct(annualAchieved, annualTarget),
      quarterlyTrend: ([1, 2, 3, 4] as const).map((q) => ({
        q,
        target: currencyTarget.quarters.find((row) => row.q === q)?.target ?? 0,
        achieved: computeDealOrgQuarterAchieved(
          deals,
          currencyTarget.currency,
          q,
          wonStageIds,
        ),
      })),
    };
  });
}

export function DashboardSalesTargetSection({
  deals,
  stages,
  targetingSettings,
}: {
  deals: CrmDeal[];
  stages: PipelineStage[];
  targetingSettings: LeadTargetingSettings;
}) {
  const wonStageIds = useMemo(
    () =>
      new Set(
        stages.filter((stage) => stage.category === "won").map((stage) => stage.id),
      ),
    [stages],
  );
  const hasTargets = hasOrgSalesTargets(targetingSettings);

  const currencySummaries = useMemo(
    () =>
      hasTargets
        ? buildCurrencySummaries(deals, targetingSettings, wonStageIds)
        : [],
    [hasTargets, deals, targetingSettings, wonStageIds],
  );

  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
      <div className="space-y-8 p-4 sm:p-6">
        {hasTargets && currencySummaries.length > 0 ? (
          <>
            <AnnualRevenueChart
              fiscalYear={targetingSettings.fiscalYear}
              summaries={currencySummaries}
            />

            <QuarterlyPerformanceChart summaries={currencySummaries} />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-[#1c1e21]">Team breakdown</p>
                <p className="mt-0.5 text-[12px] text-[#6b7280]">
                  Overall and per-team targets for the current quarter
                </p>
              </div>
              <DealsPipelineKpiCards
                deals={deals}
                stages={stages}
                targetingSettings={targetingSettings}
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-[#e5e7eb] bg-[#fafbfc] px-4 py-8 text-center">
            <p className="text-sm font-medium text-[#374151]">
              Sales targets are not configured yet
            </p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">
              Set annual and quarterly targets in Sales Targeting to power this dashboard.
            </p>
            <Link
              href="/sales-targeting"
              className="mt-4 inline-flex h-9 items-center rounded-md bg-[#4080f0] px-4 text-xs font-medium text-white hover:bg-[#3070e0]"
            >
              Open Sales Targeting
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
