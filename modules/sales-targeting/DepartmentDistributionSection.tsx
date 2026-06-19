"use client";

import { useEffect, useMemo, useState } from "react";
import {
  syncDepartmentQuartersFromTeams,
  quarterSum,
  teamsInDepartment,
  updateQuarterTarget,
} from "@/data/leadsTargetsData";
import {
  AnnualTargetGlance,
  CompactQuarterTable,
  CurrencyToolbar,
  PillSelect,
  SectionShell,
  addCurrencyToSettings,
  removeCurrencyFromSettings,
} from "@/modules/sales-targeting/shared";
import { useSalesTargetingSettings } from "@/modules/sales-targeting/useSalesTargetingSettings";

export function DepartmentDistributionSection() {
  const {
    settings,
    setSettings,
    activeCurrency,
    setActiveCurrency,
    activeCurrencyTarget,
    updateCurrencyTargets,
  } = useSalesTargetingSettings();

  const [activeDepartment, setActiveDepartment] = useState("Sales");
  const [activeTeamName, setActiveTeamName] = useState("");

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

  const selectedDepartment =
    departments.find((row) => row.departmentName === activeDepartment) ?? departments[0];
  const selectedTeam =
    salesTeams.find((team) => team.teamName === activeTeamName) ?? salesTeams[0];

  useEffect(() => {
    if (!departments.some((row) => row.departmentName === activeDepartment)) {
      setActiveDepartment(departments[0]?.departmentName ?? "Sales");
    }
  }, [departments, activeDepartment]);

  useEffect(() => {
    if (!salesTeams.some((team) => team.teamName === activeTeamName)) {
      setActiveTeamName(salesTeams[0]?.teamName ?? "");
    }
  }, [salesTeams, activeTeamName]);

  if (!activeCurrencyTarget || !selectedDepartment) return null;

  return (
    <SectionShell
      title="Department distribution"
      description="Split company targets across departments and sales teams."
    >
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

      <div className="space-y-5 p-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
            Department
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PillSelect
              layout="row"
              items={departments.map((d) => d.departmentName)}
              value={activeDepartment}
              onChange={setActiveDepartment}
              getKey={(name) => name}
              getLabel={(name) => name}
            />
            {activeDepartment === "Sales" && selectedTeam ? (
              <AnnualTargetGlance
                teamName={selectedTeam.teamName}
                currency={activeCurrency}
                annual={quarterSum(selectedTeam)}
              />
            ) : null}
          </div>
        </div>

        {activeDepartment === "Sales" && salesTeams.length > 0 ? (
          <div className="space-y-2 border-t border-[#e5e7eb] pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Team
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <aside className="w-full shrink-0 sm:w-44">
                <PillSelect
                  items={salesTeams.map((t) => t.teamName)}
                  value={selectedTeam?.teamName ?? ""}
                  onChange={setActiveTeamName}
                  getKey={(name) => name}
                  getLabel={(name) => name}
                />
              </aside>
              {selectedTeam ? (
                <div className="min-w-0 flex-1">
                  <CompactQuarterTable
                    key={selectedTeam.teamName}
                    quarters={selectedTeam.quarters}
                    quarterDefinitions={settings.quarterDefinitions}
                    currency={activeCurrency}
                    onQuarterChange={(q, value) => {
                      updateCurrencyTargets(
                        activeCurrency,
                        (row) => {
                          row.teamAllocations = row.teamAllocations.map((team) =>
                            team.teamName === selectedTeam.teamName
                              ? {
                                  ...team,
                                  quarters: updateQuarterTarget(team.quarters, q, value),
                                }
                              : team,
                          );
                          Object.assign(row, syncDepartmentQuartersFromTeams(row, "Sales"));
                        },
                        { persist: true },
                      );
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
