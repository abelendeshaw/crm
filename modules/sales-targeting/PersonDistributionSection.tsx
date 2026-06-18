"use client";

import { useEffect, useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  distributeTeamTargetsToPersons,
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

export function PersonDistributionSection() {
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

  const selectedTeam =
    teams.find((team) => team.teamName === activeTeamName) ?? teams[0];
  const selectedPerson =
    persons.find((person) => person.personName === activePersonName) ?? persons[0];

  useEffect(() => {
    if (!teams.some((team) => team.teamName === activeTeamName)) {
      setActiveTeamName(teams[0]?.teamName ?? "");
    }
  }, [teams, activeTeamName]);

  useEffect(() => {
    if (!persons.some((person) => person.personName === activePersonName)) {
      setActivePersonName(persons[0]?.personName ?? "");
    }
  }, [persons, activePersonName]);

  if (!activeCurrencyTarget) return null;

  const distributeToPersons = () => {
    if (!selectedTeam) return;
    updateCurrencyTargets(activeCurrency, (row) => {
      row.personAllocations = distributeTeamTargetsToPersons(
        selectedTeam.teamName,
        selectedTeam.quarters,
        row.personAllocations,
      );
    });
  };

  return (
    <SectionShell
      title="Person distribution"
      description="Assign team targets to individual reps."
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
        <div className="space-y-3">
          <p className="text-[12px] font-medium text-[#6b7280]">Team</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PillSelect
              items={teams.map((t) => t.teamName)}
              value={activeTeamName}
              onChange={setActiveTeamName}
              getKey={(name) => name}
              getLabel={(name) => name}
            />
            {selectedTeam ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-[#e5e7eb] text-xs"
                onClick={distributeToPersons}
              >
                <Share2 size={13} className="mr-1.5" />
                Split evenly
              </Button>
            ) : null}
          </div>
        </div>

        {persons.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[12px] font-medium text-[#6b7280]">Rep</p>
            <PillSelect
              items={persons.map((p) => p.personName)}
              value={activePersonName}
              onChange={setActivePersonName}
              getKey={(name) => name}
              getLabel={(name) => name}
            />
          </div>
        ) : null}

        {selectedPerson ? (
          <CompactQuarterTable
            quarters={selectedPerson.quarters}
            quarterDefinitions={settings.quarterDefinitions}
            onQuarterChange={(q, raw) => {
              const value = Number(raw) || 0;
              updateCurrencyTargets(activeCurrency, (row) => {
                row.personAllocations = row.personAllocations.map((person) =>
                  person.personName === selectedPerson.personName
                    ? {
                        ...person,
                        quarters: updateQuarterTarget(person.quarters, q, value),
                      }
                    : person,
                );
              });
            }}
          />
        ) : (
          <p className="py-6 text-center text-sm text-[#9ca3af]">
            Select a team member to set targets
          </p>
        )}
      </div>
    </SectionShell>
  );
}
