"use client";

import { useEffect, useMemo, useState } from "react";
import type { CrmLead } from "@/data/leadsManagementData";
import { cn } from "@/lib/utils";
import {
  buildQuarterlyTargets,
  computeCurrencyTargetProgress,
  computeTeamQuarterAchieved,
  formatFiscalYearQuartersSummary,
  quarterSum,
  syncDepartmentQuartersFromTeams,
  teamsInDepartment,
} from "@/data/leadsTargetsData";
import { mockLeadStore } from "@/data/mockStore";
import {
  AnnualSummary,
  CurrencyToolbar,
  PillSelect,
  SALES_TARGETING_PAGE_CLASS,
  TeamDistributionStatus,
  addCurrencyToSettings,
  removeCurrencyFromSettings,
} from "@/modules/sales-targeting/shared";
import { useSalesTargetingSettings } from "@/modules/sales-targeting/useSalesTargetingSettings";

export function TargetDefinitionSection() {
  const {
    settings,
    setSettings,
    activeCurrency,
    setActiveCurrency,
    activeCurrencyTarget,
    updateCurrencyTargets,
  } = useSalesTargetingSettings();

  const [activeDepartment, setActiveDepartment] = useState("Sales");
  const [leads, setLeads] = useState<CrmLead[]>(() => [...mockLeadStore.leads]);

  useEffect(() => {
    return mockLeadStore.subscribeLeads((next) => setLeads([...next]));
  }, []);

  const departments = useMemo(
    () => activeCurrencyTarget?.departmentAllocations ?? [],
    [activeCurrencyTarget],
  );

  const teams = useMemo(
    () => activeCurrencyTarget?.teamAllocations ?? [],
    [activeCurrencyTarget],
  );

  const salesTeams = useMemo(
    () => teams.filter((team) => teamsInDepartment("Sales").includes(team.teamName)),
    [teams],
  );

  const companyAnnual = useMemo(
    () => (activeCurrencyTarget ? quarterSum(activeCurrencyTarget) : 0),
    [activeCurrencyTarget],
  );

  const companyProgress = useMemo(
    () =>
      activeCurrencyTarget
        ? computeCurrencyTargetProgress(leads, activeCurrencyTarget)
        : null,
    [leads, activeCurrencyTarget],
  );

  const teamSections = useMemo(
    () =>
      salesTeams.map((team) => {
        const annual = quarterSum(team);
        const achieved = ([1, 2, 3, 4] as const).reduce(
          (sum, q) =>
            sum + computeTeamQuarterAchieved(leads, team.teamName, activeCurrency, q),
          0,
        );
        return {
          team,
          annual,
          achieved,
        };
      }),
    [salesTeams, leads, activeCurrency, companyAnnual],
  );

  const teamDistribution = useMemo(
    () => teamSections.map((row) => ({ name: row.team.teamName, annual: row.annual })),
    [teamSections],
  );

  useEffect(() => {
    if (!departments.some((row) => row.departmentName === activeDepartment)) {
      setActiveDepartment(departments[0]?.departmentName ?? "Sales");
    }
  }, [departments, activeDepartment]);

  if (!activeCurrencyTarget) return null;

  const activeFiscalYear = settings.fiscalYears.find(
    (row) => row.year === settings.fiscalYear,
  );

  return (
    <div className={cn(SALES_TARGETING_PAGE_CLASS, "space-y-4")}>
      <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
        <div className="border-b border-[#e5e7eb] px-4 py-4 sm:px-6">
          <p className="text-sm font-semibold text-[#1c1e21]">
            FY {settings.fiscalYear} target period
          </p>
          <p className="mt-1 text-[12px] text-[#6b7280]">
            {activeFiscalYear
              ? formatFiscalYearQuartersSummary(activeFiscalYear.quarterDefinitions)
              : "Quarter periods not configured"}
          </p>
        </div>

        <CurrencyToolbar
          settings={settings}
          activeCurrency={activeCurrency}
          onSelectCurrency={setActiveCurrency}
          onAddCurrency={(currency) => {
            setSettings((current) => addCurrencyToSettings(current, currency));
            setActiveCurrency(currency);
          }}
          onRemoveCurrency={(currency) => {
            setSettings((current) => removeCurrencyFromSettings(current, currency));
            if (activeCurrency === currency) {
              const remaining = settings.currencyTargets.filter((ct) => ct.currency !== currency);
              setActiveCurrency(remaining[0]?.currency ?? "ETB");
            }
          }}
        />

        <div className="space-y-5 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
            <AnnualSummary
              key={activeCurrency}
              compact
              label={`Company annual target · ${activeCurrency}`}
              currency={activeCurrency}
              annual={companyAnnual}
              achieved={companyProgress?.annualAchieved}
              onAnnualChange={(value) => {
                updateCurrencyTargets(activeCurrency, (row) => {
                  row.quarters = buildQuarterlyTargets(value);
                });
              }}
            />
            <TeamDistributionStatus
              label={`Team distribution status · ${activeCurrency}`}
              currency={activeCurrency}
              companyAnnual={companyAnnual}
              teams={teamDistribution}
            />
          </div>

          <div className="space-y-5 border-t border-[#e5e7eb] pt-5">
            <div>
              <p className="text-sm font-semibold text-[#1c1e21]">Team annual targets</p>
              <p className="mt-0.5 text-[12px] text-[#6b7280]">
                Set yearly targets for Sales teams.
              </p>
            </div>

            <PillSelect
              layout="row"
              label="Department"
              items={departments.map((d) => d.departmentName)}
              value={activeDepartment}
              onChange={setActiveDepartment}
              getKey={(name) => name}
              getLabel={(name) => name}
            />

            {activeDepartment === "Sales" && teamSections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {teamSections.map((row) => (
                  <section key={row.team.teamName}>
                    <AnnualSummary
                      key={`${activeCurrency}-${row.team.teamName}`}
                      compact
                      label={`${row.team.teamName} · ${activeCurrency}`}
                      currency={activeCurrency}
                      annual={row.annual}
                      achieved={row.achieved}
                      onAnnualChange={(value) => {
                        updateCurrencyTargets(activeCurrency, (current) => {
                          current.teamAllocations = current.teamAllocations.map((team) =>
                            team.teamName === row.team.teamName
                              ? {
                                  ...team,
                                  quarters: buildQuarterlyTargets(value),
                                }
                              : team,
                          );
                          Object.assign(
                            current,
                            syncDepartmentQuartersFromTeams(current, "Sales"),
                          );
                        });
                      }}
                    />
                  </section>
                ))}
              </div>
            ) : activeDepartment === "Sales" ? (
              <p className="text-sm text-[#9ca3af]">No Sales teams configured.</p>
            ) : (
              <p className="text-sm text-[#9ca3af]">
                Team targets are configured under Sales.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
