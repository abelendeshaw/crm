"use client";

import { useEffect, useMemo, useState } from "react";
import type { CrmLead } from "@/data/leadsManagementData";
import {
  computeSalesPerformanceOverview,
  getCurrentOrgQuarter,
  type LeadTargetingSettings,
  type PerformanceEntityRow,
} from "@/data/leadsTargetsData";
import { cn } from "@/lib/utils";
import {
  PerformanceStatus,
  PerformanceTable,
  SALES_TARGETING_PAGE_CLASS,
  SalesTargetingTableArea,
  SalesTargetingTableFooter,
  SimpleCurrencyDropdown,
  SimpleSelectDropdown,
} from "@/modules/sales-targeting/shared";

type Level = "teams" | "persons";

const levels: { id: Level; label: string }[] = [
  { id: "teams", label: "Teams" },
  { id: "persons", label: "Reps" },
];

const levelStatusLabels: Record<Level, string> = {
  teams: "Team performance",
  persons: "Rep performance",
};

export function SalesPerformanceSection({
  settings,
  leads,
}: {
  settings: LeadTargetingSettings;
  leads: CrmLead[];
}) {
  const [level, setLevel] = useState<Level>("teams");
  const [activeTeamName, setActiveTeamName] = useState("");
  const [activeCurrency, setActiveCurrency] =
    useState<PerformanceEntityRow["currency"]>("ETB");

  const overview = useMemo(
    () => computeSalesPerformanceOverview(settings, leads, getCurrentOrgQuarter()),
    [settings, leads],
  );

  const currencies = useMemo(
    () => settings.currencyTargets.map((row) => row.currency),
    [settings.currencyTargets],
  );

  const personTeams = useMemo(() => {
    const teamsWithReps = new Set(
      overview.persons
        .filter((person) => person.currency === activeCurrency)
        .map((person) => person.subtitle)
        .filter((name): name is string => !!name),
    );

    const orderedTeamNames = [
      ...new Set(
        overview.teams
          .filter((team) => team.currency === activeCurrency)
          .map((team) => team.label),
      ),
    ];

    return orderedTeamNames.filter((teamName) => teamsWithReps.has(teamName));
  }, [overview.teams, overview.persons, activeCurrency]);

  const activeRows = useMemo(() => {
    const rows = overview[level].filter((row) => row.currency === activeCurrency);
    if (level !== "persons" || !activeTeamName) return rows;
    return rows.filter((row) => row.subtitle === activeTeamName);
  }, [overview, level, activeTeamName, activeCurrency]);

  useEffect(() => {
    if (!currencies.some((currency) => currency === activeCurrency)) {
      setActiveCurrency(currencies[0] ?? "ETB");
    }
  }, [currencies, activeCurrency]);

  useEffect(() => {
    if (level !== "persons") return;
    if (!personTeams.some((teamName) => teamName === activeTeamName)) {
      setActiveTeamName(personTeams[0] ?? "");
    }
  }, [level, personTeams, activeTeamName, activeCurrency]);

  const emptyMessage =
    level === "persons"
      ? "No rep targets set for this team."
      : `No targets set for ${activeCurrency} at this level.`;

  return (
    <div className={cn(SALES_TARGETING_PAGE_CLASS)}>
      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-[#e5e7eb] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {levels.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLevel(item.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                level === item.id
                  ? "bg-[#eef2fd] text-[#4080f0]"
                  : "text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#374151]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {level === "persons" && personTeams.length > 0 ? (
            <SimpleSelectDropdown
              items={personTeams}
              value={activeTeamName}
              onChange={setActiveTeamName}
              placeholder="Select team"
            />
          ) : null}
          {currencies.length > 0 ? (
            <SimpleCurrencyDropdown
              currencies={currencies}
              value={activeCurrency}
              onChange={setActiveCurrency}
            />
          ) : null}
        </div>
      </div>

      {activeRows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-10 text-sm text-[#6b7280]">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white">
            <PerformanceStatus
              key={`${level}-${activeCurrency}-${activeTeamName}-summary`}
              sections="summary"
              label={`${levelStatusLabels[level]} · ${activeCurrency}`}
              currency={activeCurrency}
              totalTarget={activeRows.reduce((sum, row) => sum + row.target, 0)}
              items={activeRows.map((row) => ({
                name: row.label,
                target: row.target,
                achieved: row.achieved,
              }))}
              emptyMessage={emptyMessage}
            />
          </div>

          <SalesTargetingTableArea>
            <PerformanceTable
              rows={activeRows.map((row) => ({
                id: row.id,
                name: row.label,
                achieved: row.achieved,
                target: row.target,
              }))}
              currency={activeCurrency}
              emptyMessage={emptyMessage}
            />
          </SalesTargetingTableArea>

          <SalesTargetingTableFooter>
            <span className="text-[12px] text-[#6b7280]">
              Showing {activeRows.length}{" "}
              {level === "persons"
                ? `rep${activeRows.length !== 1 ? "s" : ""}`
                : `team${activeRows.length !== 1 ? "s" : ""}`}
            </span>
          </SalesTargetingTableFooter>
        </>
      )}
    </div>
  );
}
