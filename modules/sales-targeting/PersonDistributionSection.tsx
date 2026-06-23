"use client";

import { useEffect, useMemo, useState } from "react";
import { updateQuarterTarget } from "@/data/leadsTargetsData";
import {
  CurrencyToolbar,
  DistributionCard,
  PersonTargetsMatrix,
  SalesTargetingTableArea,
  SalesTargetingTableFooter,
  SimpleSelectDropdown,
  addCurrencyToSettings,
  removeCurrencyFromSettings,
} from "@/modules/sales-targeting/shared";
import { useSalesTargetingSettings } from "@/modules/sales-targeting/useSalesTargetingSettings";

export function PersonDistributionSection() {
  const {
    settings,
    setSettings,
    activeCurrency,
    setActiveCurrency,
    activeCurrencyTarget,
    updateCurrencyTargets,
  } = useSalesTargetingSettings();

  const [activeTeamName, setActiveTeamName] = useState("");

  const teams = useMemo(
    () => activeCurrencyTarget?.teamAllocations ?? [],
    [activeCurrencyTarget],
  );

  const teamPersons = useMemo(() => {
    const all = activeCurrencyTarget?.personAllocations ?? [];
    if (!activeTeamName) return all;
    return all.filter((person) => person.teamName === activeTeamName);
  }, [activeCurrencyTarget, activeTeamName]);

  useEffect(() => {
    if (!teams.some((team) => team.teamName === activeTeamName)) {
      setActiveTeamName(teams[0]?.teamName ?? "");
    }
  }, [teams, activeTeamName]);

  if (!activeCurrencyTarget) return null;

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
          teams.length > 0 ? (
            <SimpleSelectDropdown
              items={teams.map((team) => team.teamName)}
              value={activeTeamName}
              onChange={setActiveTeamName}
              placeholder="Select team"
            />
          ) : null
        }
      />

      <SalesTargetingTableArea>
        <PersonTargetsMatrix
          persons={teamPersons}
          currency={activeCurrency}
          quarterDefinitions={settings.quarterDefinitions}
          onQuarterChange={(personName, q, value) => {
            updateCurrencyTargets(
              activeCurrency,
              (row) => {
                row.personAllocations = row.personAllocations.map((person) =>
                  person.personName === personName
                    ? {
                        ...person,
                        quarters: updateQuarterTarget(person.quarters, q, value),
                      }
                    : person,
                );
              },
              { persist: true },
            );
          }}
        />
      </SalesTargetingTableArea>

      {teamPersons.length > 0 ? (
        <SalesTargetingTableFooter>
          <span className="text-[12px] text-[#6b7280]">
            Showing {teamPersons.length} rep{teamPersons.length !== 1 ? "s" : ""}
          </span>
        </SalesTargetingTableFooter>
      ) : null}
    </DistributionCard>
  );
}
