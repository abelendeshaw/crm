"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  Target,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TabbedModulePageSkeleton } from "@/components/loading/skeleton-screens";
import { usePageLoading } from "@/hooks/usePageLoading";
import type { CrmLead } from "@/data/leadsManagementData";
import { cloneLeadTargetingSettings } from "@/data/leadsTargetsData";
import { mockLeadStore } from "@/data/mockStore";
import { DepartmentDistributionSection } from "@/modules/sales-targeting/DepartmentDistributionSection";
import { PersonDistributionSection } from "@/modules/sales-targeting/PersonDistributionSection";
import { SalesPerformanceSection } from "@/modules/sales-targeting/SalesPerformanceSection";
import { TargetDefinitionSection } from "@/modules/sales-targeting/TargetDefinitionSection";

type Tab = "definition" | "departments" | "persons" | "performance";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "definition", label: "Target Definition", icon: <Target size={15} /> },
  {
    id: "departments",
    label: "Department Distribution",
    icon: <Building2 size={15} />,
  },
  { id: "persons", label: "Person Distribution", icon: <UserRound size={15} /> },
  { id: "performance", label: "Sales Performance", icon: <BarChart3 size={15} /> },
];

export function SalesTargetingPage() {
  const isPageLoading = usePageLoading();
  const [activeTab, setActiveTab] = useState<Tab>("definition");
  const [leads, setLeads] = useState<CrmLead[]>(() => [...mockLeadStore.leads]);
  const [settings, setSettings] = useState(() =>
    cloneLeadTargetingSettings(mockLeadStore.targetingSettings),
  );

  useEffect(() => {
    const unsubLeads = mockLeadStore.subscribeLeads((next) => setLeads([...next]));
    const unsubTargeting = mockLeadStore.subscribeTargetingSettings((next) => {
      setSettings(cloneLeadTargetingSettings(next));
    });
    return () => {
      unsubLeads();
      unsubTargeting();
    };
  }, []);

  if (isPageLoading) {
    return <TabbedModulePageSkeleton />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-6 py-3">
        <h1 className="text-[20px] font-semibold text-[#1c1e21]">Sales Targeting</h1>
        <p className="mt-0.5 text-[13px] text-[#6b7280]">
          Define targets, distribute across the organization, and monitor performance
        </p>

        <div className="mt-4 -mb-4 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-[#4080f0] text-[#4080f0]"
                  : "border-transparent text-[#6b7280] hover:border-[#e5e7eb] hover:text-[#1c1e21]",
              )}
            >
              <span className={activeTab === tab.id ? "text-[#4080f0]" : "text-[#9ca3af]"}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f5f6fa] p-4 sm:p-6">
        {activeTab === "definition" && <TargetDefinitionSection />}
        {activeTab === "departments" && <DepartmentDistributionSection />}
        {activeTab === "persons" && <PersonDistributionSection />}
        {activeTab === "performance" && (
          <SalesPerformanceSection settings={settings} leads={leads} />
        )}
      </div>
    </div>
  );
}
