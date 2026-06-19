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
import { PerformanceStatus, PillSelect } from "@/modules/sales-targeting/shared";

type Level = "teams" | "persons";

const levels: { id: Level; label: string }[] = [
  { id: "teams", label: "Teams" },
  { id: "persons", label: "Reps" },
];

const levelStatusLabels: Record<Level, string> = {
  teams: "Team performance status",
  persons: "Rep performance status",
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

  const renderPerformanceStatus = (section: "all" | "summary" | "table") => (
    <PerformanceStatus
      key={`${activeCurrency}-${section}`}
      sections={section}
      label={`${levelStatusLabels[level]} · ${activeCurrency}`}
      currency={activeCurrency}
      totalTarget={activeRows.reduce((sum, row) => sum + row.target, 0)}
      items={activeRows.map((row) => ({
        name: row.label,
        target: row.target,
        achieved: row.achieved,
      }))}
      emptyMessage={
        level === "persons"
          ? "No rep targets set for this team."
          : "No targets set for this level."
      }
    />
  );

  const performanceContent =
    activeRows.length === 0 ? (
      <p className="py-8 text-center text-sm text-[#9ca3af]">
        {level === "persons"
          ? "No rep targets set for this team."
          : `No targets set for ${activeCurrency} at this level.`}
      </p>
    ) : level === "persons" && personTeams.length > 0 ? (
      <div className="space-y-5">
        {renderPerformanceStatus("summary")}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <aside className="w-full shrink-0 sm:w-44">
            <div className="hidden h-[31px] items-center sm:flex">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                Team
              </p>
            </div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] sm:hidden">
              Team
            </p>
            <PillSelect
              items={personTeams}
              value={activeTeamName}
              onChange={setActiveTeamName}
              getKey={(name) => name}
              getLabel={(name) => name}
            />
          </aside>

          <div className="min-w-0 flex-1">{renderPerformanceStatus("table")}</div>
        </div>
      </div>
    ) : (
      renderPerformanceStatus("all")
    );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1c1e21]">Sales performance</h2>
          <p className="mt-0.5 text-[13px] text-[#6b7280]">
            Contract-signed leads vs targets for Q{overview.q} · FY {overview.fiscalYear}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#e5e7eb] px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
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

          {currencies.length > 0 ? (
            <div className="flex gap-1 overflow-x-auto">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => setActiveCurrency(currency)}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                    activeCurrency === currency
                      ? "bg-[#eef2fd] text-[#4080f0]"
                      : "text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#374151]",
                  )}
                >
                  {currency}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-5 p-4">{performanceContent}</div>
      </div>
    </div>
  );
}
