"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  DashboardMetricTile,
  DashboardPeriodMetricTile,
} from "@/components/kpi/dashboard-kpi-tile";
import {
  buildCumulativeCountTrend,
  countNewInMonth,
  countNewInPreviousMonth,
  countNewInPreviousQuarter,
  countNewInQuarter,
  formatTrendDelta,
  trendDeltaFromSeries,
} from "@/data/dashboardMetrics";
import {
  type CrmDeal,
  type PipelineStage,
} from "@/data/dealsManagementData";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  cloneLeadTargetingSettings,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";
import { mockDealStore, mockLeadStore } from "@/data/mockStore";
import { DashboardLeadsByTeamSection } from "@/modules/dashboard/DashboardLeadsByTeamSection";
import { DashboardSalesTargetSection } from "@/modules/dashboard/DashboardSalesTargetSection";

export function DashboardPage() {
  const [deals, setDeals] = useState<CrmDeal[]>(() => mockDealStore.deals);
  const [leads, setLeads] = useState<CrmLead[]>(() => mockLeadStore.leads);
  const [dealStages, setDealStages] = useState<PipelineStage[]>(() => mockDealStore.stages);
  const [leadStages, setLeadStages] = useState<PipelineStage[]>(() => mockLeadStore.stages);
  const [targetingSettings, setTargetingSettings] = useState<LeadTargetingSettings>(() =>
    cloneLeadTargetingSettings(mockLeadStore.targetingSettings),
  );

  useEffect(() => {
    const unsubDeals = mockDealStore.subscribeDeals((next) => setDeals([...next]));
    const unsubLeads = mockLeadStore.subscribeLeads((next) => setLeads([...next]));
    const unsubStages = mockDealStore.subscribeStages((next) => setDealStages([...next]));
    const unsubLeadStages = mockLeadStore.subscribeStages((next) => setLeadStages([...next]));
    const unsubTargeting = mockLeadStore.subscribeTargetingSettings((next) => {
      setTargetingSettings(cloneLeadTargetingSettings(next));
    });
    return () => {
      unsubDeals();
      unsubLeads();
      unsubStages();
      unsubLeadStages();
      unsubTargeting();
    };
  }, []);

  const leadTotalTrend = useMemo(() => buildCumulativeCountTrend(leads), [leads]);
  const dealTotalTrend = useMemo(() => buildCumulativeCountTrend(deals), [deals]);

  const leadMetrics = useMemo(() => {
    const month = countNewInMonth(leads);
    const quarter = countNewInQuarter(leads);
    const prevMonth = countNewInPreviousMonth(leads);
    const prevQuarter = countNewInPreviousQuarter(leads);

    return {
      total: leads.length,
      month,
      quarter,
      monthDelta: formatTrendDelta(month, prevMonth, "vs last month"),
      quarterDelta: formatTrendDelta(quarter, prevQuarter, "vs last quarter"),
      totalDelta: trendDeltaFromSeries(leadTotalTrend, "vs prior week"),
    };
  }, [leads, leadTotalTrend]);

  const dealMetrics = useMemo(() => {
    const month = countNewInMonth(deals);
    const quarter = countNewInQuarter(deals);
    const prevMonth = countNewInPreviousMonth(deals);
    const prevQuarter = countNewInPreviousQuarter(deals);

    return {
      total: deals.length,
      month,
      quarter,
      monthDelta: formatTrendDelta(month, prevMonth, "vs last month"),
      quarterDelta: formatTrendDelta(quarter, prevQuarter, "vs last quarter"),
      totalDelta: trendDeltaFromSeries(dealTotalTrend, "vs prior week"),
    };
  }, [deals, dealTotalTrend]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold text-[#1c1e21]">Dashboard</h1>
            <p className="mt-0.5 text-[13px] text-[#6b7280]">
              Executive summary, pipeline metrics, and sales target performance
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/leads"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
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
      </div>

      <div className="flex flex-1 flex-col overflow-auto bg-white">
        <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricTile
              label="Total leads"
              value={leadMetrics.total}
              deltaLabel={leadMetrics.totalDelta.label}
              deltaDirection={leadMetrics.totalDelta.direction}
              context="All leads in CRM"
            />
            <DashboardPeriodMetricTile
              label="New leads"
              monthValue={leadMetrics.month}
              quarterValue={leadMetrics.quarter}
              monthDeltaLabel={leadMetrics.monthDelta.label}
              quarterDeltaLabel={leadMetrics.quarterDelta.label}
              monthDeltaDirection={leadMetrics.monthDelta.direction}
              quarterDeltaDirection={leadMetrics.quarterDelta.direction}
              monthContext="Created in current month"
              quarterContext="Created in current quarter"
            />
            <DashboardMetricTile
              label="Total deals"
              value={dealMetrics.total}
              deltaLabel={dealMetrics.totalDelta.label}
              deltaDirection={dealMetrics.totalDelta.direction}
              context="All deals in CRM"
            />
            <DashboardPeriodMetricTile
              label="New deals"
              monthValue={dealMetrics.month}
              quarterValue={dealMetrics.quarter}
              monthDeltaLabel={dealMetrics.monthDelta.label}
              quarterDeltaLabel={dealMetrics.quarterDelta.label}
              monthDeltaDirection={dealMetrics.monthDelta.direction}
              quarterDeltaDirection={dealMetrics.quarterDelta.direction}
              monthContext="Created in current month"
              quarterContext="Created in current quarter"
            />
          </section>

          <DashboardLeadsByTeamSection
            leads={leads}
            stages={leadStages}
            targetingSettings={targetingSettings}
          />

          <DashboardSalesTargetSection
            deals={deals}
            stages={dealStages}
            targetingSettings={targetingSettings}
          />
        </div>
      </div>
    </div>
  );
}
