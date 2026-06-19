"use client";

import { useEffect, useMemo, useState } from "react";
import { updateQuarterTarget } from "@/data/leadsTargetsData";
import {
  CompactQuarterTable,
  CurrencyToolbar,
  PillSelect,
  SearchableFilter,
  SectionShell,
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
  const [activePersonName, setActivePersonName] = useState("");

  const teams = useMemo(
    () => activeCurrencyTarget?.teamAllocations ?? [],
    [activeCurrencyTarget],
  );

  const persons = useMemo(() => {
    const all = activeCurrencyTarget?.personAllocations ?? [];
    if (!activeTeamName) return all;
    return all.filter((person) => person.teamName === activeTeamName);
  }, [activeCurrencyTarget, activeTeamName]);

  const selectedPerson = useMemo(
    () => persons.find((person) => person.personName === activePersonName),
    [persons, activePersonName],
  );

  useEffect(() => {
    if (!teams.some((team) => team.teamName === activeTeamName)) {
      setActiveTeamName(teams[0]?.teamName ?? "");
    }
  }, [teams, activeTeamName]);

  useEffect(() => {
    setActivePersonName("");
  }, [activeTeamName]);

  useEffect(() => {
    if (activePersonName && !persons.some((person) => person.personName === activePersonName)) {
      setActivePersonName("");
    }
  }, [persons, activePersonName]);

  if (!activeCurrencyTarget) return null;

  return (
    <SectionShell
      title="Person distribution"
      description="Assign team targets to individual reps."
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
        <div className="space-y-2 border-t border-[#e5e7eb] pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <aside className="w-full shrink-0 sm:w-44">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                Team
              </p>
              <PillSelect
                items={teams.map((t) => t.teamName)}
                value={activeTeamName}
                onChange={setActiveTeamName}
                getKey={(name) => name}
                getLabel={(name) => name}
              />
            </aside>

            <div className="min-w-0 flex-1 space-y-4">
              {persons.length > 0 ? (
                <SearchableFilter
                  label="Rep"
                  items={persons.map((p) => p.personName)}
                  value={activePersonName}
                  onChange={setActivePersonName}
                  getKey={(name) => name}
                  getLabel={(name) => name}
                  placeholder="Select sales rep..."
                />
              ) : null}

              {selectedPerson ? (
                <CompactQuarterTable
                  key={selectedPerson.personName}
                  quarters={selectedPerson.quarters}
                  quarterDefinitions={settings.quarterDefinitions}
                  currency={activeCurrency}
                  onQuarterChange={(q, value) => {
                    updateCurrencyTargets(
                      activeCurrency,
                      (row) => {
                        row.personAllocations = row.personAllocations.map((person) =>
                          person.personName === selectedPerson.personName
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
              ) : (
                <p className="py-6 text-center text-sm text-[#9ca3af]">
                  Please select sales rep.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
