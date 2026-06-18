"use client";

import { useEffect, useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  distributeDepartmentTargetsToTeams,
  syncDepartmentQuartersFromTeams,
  teamsInDepartment,
  updateQuarterTarget,
} from "@/data/leadsTargetsData";
import {
  CompactQuarterTable,
  CurrencyToolbar,
  PillSelect,
  SaveBar,
  SectionShell,
  addCurrencyToSettings,
  removeCurrencyFromSettings,
} from "@/modules/sales-targeting/shared";
import { useSalesTargetingSettings } from "@/modules/sales-targeting/useSalesTargetingSettings";

export function DepartmentDistributionSection() {
  const {
    settings,
    setSettings,
    saved,
    hasChanges,
    save,
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

  const distributeToTeams = () => {
    if (activeDepartment !== "Sales") return;
    updateCurrencyTargets(activeCurrency, (row) => {
      row.teamAllocations = distributeDepartmentTargetsToTeams(
        selectedDepartment.quarters,
        row.teamAllocations,
      );
      Object.assign(row, syncDepartmentQuartersFromTeams(row, "Sales"));
    });
  };

  return (
    <SectionShell
      title="Department distribution"
      description="Split company targets across departments and sales teams."
      actions={<SaveBar hasChanges={hasChanges} saved={saved} onSave={save} />}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PillSelect
            items={departments.map((d) => d.departmentName)}
            value={activeDepartment}
            onChange={setActiveDepartment}
            getKey={(name) => name}
            getLabel={(name) => name}
          />
          {activeDepartment === "Sales" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-[#e5e7eb] text-xs"
              onClick={distributeToTeams}
            >
              <Share2 size={13} className="mr-1.5" />
              Split to teams
            </Button>
          ) : null}
        </div>

        <CompactQuarterTable
          quarters={selectedDepartment.quarters}
          quarterDefinitions={settings.quarterDefinitions}
          onQuarterChange={(q, raw) => {
            const value = Number(raw) || 0;
            updateCurrencyTargets(activeCurrency, (row) => {
              row.departmentAllocations = row.departmentAllocations.map((department) =>
                department.departmentName === activeDepartment
                  ? {
                      ...department,
                      quarters: updateQuarterTarget(department.quarters, q, value),
                    }
                  : department,
              );
            });
          }}
        />

        {activeDepartment === "Sales" && salesTeams.length > 0 ? (
          <div className="space-y-4 border-t border-[#e5e7eb] pt-5">
            <p className="text-[12px] font-medium text-[#6b7280]">Sales teams</p>
            <PillSelect
              items={salesTeams.map((t) => t.teamName)}
              value={selectedTeam?.teamName ?? ""}
              onChange={setActiveTeamName}
              getKey={(name) => name}
              getLabel={(name) => name}
            />
            {selectedTeam ? (
              <CompactQuarterTable
                quarters={selectedTeam.quarters}
                quarterDefinitions={settings.quarterDefinitions}
                onQuarterChange={(q, raw) => {
                  const value = Number(raw) || 0;
                  updateCurrencyTargets(activeCurrency, (row) => {
                    row.teamAllocations = row.teamAllocations.map((team) =>
                      team.teamName === selectedTeam.teamName
                        ? {
                            ...team,
                            quarters: updateQuarterTarget(team.quarters, q, value),
                          }
                        : team,
                    );
                    Object.assign(row, syncDepartmentQuartersFromTeams(row, "Sales"));
                  });
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
