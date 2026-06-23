"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TARGET_DEPARTMENTS,
  syncDepartmentQuartersFromTeams,
  teamsInDepartment,
  updateQuarterTarget,
} from "@/data/leadsTargetsData";
import {
  CurrencyToolbar,
  DistributionCard,
  QuarterTargetsMatrix,
  SalesTargetingTableArea,
  SalesTargetingTableFooter,
  SimpleSelectDropdown,
  TeamTargetsMatrix,
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

  const [activeDepartmentName, setActiveDepartmentName] = useState("");

  const departments = useMemo(
    () => activeCurrencyTarget?.departmentAllocations ?? [],
    [activeCurrencyTarget],
  );

  const teams = useMemo(
    () => activeCurrencyTarget?.teamAllocations ?? [],
    [activeCurrencyTarget],
  );

  const departmentOptions = useMemo(
    () =>
      TARGET_DEPARTMENTS.filter((name) =>
        departments.some((department) => department.departmentName === name),
      ),
    [departments],
  );

  const salesTeams = useMemo(
    () => teams.filter((team) => teamsInDepartment("Sales").includes(team.teamName)),
    [teams],
  );

  const selectedDepartment = useMemo(
    () =>
      departments.find((department) => department.departmentName === activeDepartmentName) ??
      departments[0],
    [departments, activeDepartmentName],
  );

  useEffect(() => {
    if (!departmentOptions.some((name) => name === activeDepartmentName)) {
      setActiveDepartmentName(departmentOptions[0] ?? "");
    }
  }, [departmentOptions, activeDepartmentName]);

  if (!activeCurrencyTarget) return null;

  const isSalesDepartment = activeDepartmentName === "Sales";
  const rowCount = isSalesDepartment ? salesTeams.length : selectedDepartment ? 1 : 0;
  const rowLabel = isSalesDepartment ? "team" : "department";

  return (
    <DistributionCard>
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
        leading={
          departmentOptions.length > 0 ? (
            <SimpleSelectDropdown
              items={departmentOptions}
              value={activeDepartmentName}
              onChange={setActiveDepartmentName}
              placeholder="Select department"
            />
          ) : null
        }
      />

      <SalesTargetingTableArea>
        {isSalesDepartment && salesTeams.length > 0 ? (
          <TeamTargetsMatrix
            teams={salesTeams}
            currency={activeCurrency}
            quarterDefinitions={settings.quarterDefinitions}
            onQuarterChange={(teamName, q, value) => {
              updateCurrencyTargets(
                activeCurrency,
                (row) => {
                  row.teamAllocations = row.teamAllocations.map((team) =>
                    team.teamName === teamName
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
        ) : null}

        {!isSalesDepartment && selectedDepartment ? (
          <QuarterTargetsMatrix
            rowLabel="Department"
            currency={activeCurrency}
            quarterDefinitions={settings.quarterDefinitions}
            rows={[
              {
                id: selectedDepartment.departmentName,
                label: selectedDepartment.departmentName,
                quarters: selectedDepartment.quarters,
              },
            ]}
            emptyMessage="No targets for this department."
            onQuarterChange={(departmentName, q, value) => {
              updateCurrencyTargets(
                activeCurrency,
                (row) => {
                  row.departmentAllocations = row.departmentAllocations.map((department) =>
                    department.departmentName === departmentName
                      ? {
                          ...department,
                          quarters: updateQuarterTarget(department.quarters, q, value),
                        }
                      : department,
                  );
                },
                { persist: true },
              );
            }}
          />
        ) : null}
      </SalesTargetingTableArea>

      {rowCount > 0 ? (
        <SalesTargetingTableFooter>
          <span className="text-[12px] text-[#6b7280]">
            Showing {rowCount} {rowLabel}
            {rowCount !== 1 ? "s" : ""}
          </span>
        </SalesTargetingTableFooter>
      ) : null}
    </DistributionCard>
  );
}
