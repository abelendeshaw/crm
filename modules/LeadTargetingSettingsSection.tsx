"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CURRENCY_OPTIONS, type DealCurrency } from "@/data/dealsManagementData";
import {
  buildQuarterlyTargets,
  cloneLeadTargetingSettings,
  createEmptyDepartmentAllocations,
  createEmptyPersonAllocations,
  createEmptyTeamAllocations,
  formatCompactMoney,
  formatMoneyInCurrency,
  getQuarterTarget,
  migrateCurrencyTarget,
  quarterSum,
  syncCompanyQuartersFromTeams,
  updateQuarterTarget,
  type CurrencyQuarterlyTargets,
  type LeadQuarter,
  type LeadTargetingSettings,
  type SalesTeamAllocation,
} from "@/data/leadsTargetsData";
import { getQuarterPeriodLabel } from "@/data/fiscalQuarterData";
import { mockLeadStore } from "@/data/mockStore";

const QUARTERS = [1, 2, 3, 4] as const;

function ensureTeamAllocations(ct: CurrencyQuarterlyTargets): SalesTeamAllocation[] {
  if (!ct.teamAllocations?.length) {
    ct.teamAllocations = createEmptyTeamAllocations();
  }
  return ct.teamAllocations;
}

function CompanySummary({
  currency,
  fiscalYear,
  companyAnnual,
}: {
  currency: DealCurrency;
  fiscalYear: number;
  companyAnnual: number;
}) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
            Company total · FY {fiscalYear}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#1c1e21]">
            {companyAnnual > 0
              ? formatMoneyInCurrency(companyAnnual, currency)
              : "Not set"}
          </p>
        </div>
        <p className="text-[12px] text-[#9ca3af]">Sum of all sales team targets</p>
      </div>
    </div>
  );
}

function QuarterEditor({
  team,
  quarterDefinitions,
  onQuarterChange,
}: {
  team: SalesTeamAllocation;
  quarterDefinitions: LeadTargetingSettings["quarterDefinitions"];
  onQuarterChange: (q: LeadQuarter, raw: string) => void;
}) {
  return (
    <div className="p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
        Quarterly targets
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUARTERS.map((q) => (
          <div key={q} className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <div className="mb-2">
              <p className="text-[13px] font-medium text-[#374151]">Q{q}</p>
              <p className="text-[11px] text-[#9ca3af]">
                {getQuarterPeriodLabel(quarterDefinitions, q)}
              </p>
            </div>
            <Input
              type="number"
              min={0}
              value={getQuarterTarget(team.quarters, q) || ""}
              onChange={(e) => onQuarterChange(q, e.target.value)}
              className="h-9 border-[#e5e7eb] bg-white text-sm tabular-nums"
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadTargetingSettingsSection() {
  const [settings, setSettings] = useState<LeadTargetingSettings>(() =>
    cloneLeadTargetingSettings(mockLeadStore.targetingSettings),
  );
  const [saved, setSaved] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<DealCurrency>(
    () => mockLeadStore.targetingSettings.currencyTargets[0]?.currency ?? "ETB",
  );
  const [activeTeamName, setActiveTeamName] = useState<string>("");

  useEffect(() => {
    return mockLeadStore.subscribeTargetingSettings((next) => {
      setSettings(cloneLeadTargetingSettings(next));
    });
  }, []);

  const activeCurrencyTarget = useMemo(
    () => settings.currencyTargets.find((ct) => ct.currency === activeCurrency),
    [settings.currencyTargets, activeCurrency],
  );

  const teams = useMemo(
    () => (activeCurrencyTarget ? ensureTeamAllocations(activeCurrencyTarget) : []),
    [activeCurrencyTarget],
  );

  const activeTeam = teams.find((team) => team.teamName === activeTeamName) ?? teams[0];

  useEffect(() => {
    if (!settings.currencyTargets.some((ct) => ct.currency === activeCurrency)) {
      const fallback = settings.currencyTargets[0]?.currency;
      if (fallback) setActiveCurrency(fallback);
    }
  }, [settings.currencyTargets, activeCurrency]);

  useEffect(() => {
    if (!teams.length) {
      setActiveTeamName("");
      return;
    }
    if (!teams.some((team) => team.teamName === activeTeamName)) {
      setActiveTeamName(teams[0]!.teamName);
    }
  }, [teams, activeTeamName]);

  const hasChanges =
    JSON.stringify(settings) !==
    JSON.stringify(cloneLeadTargetingSettings(mockLeadStore.targetingSettings));

  const save = () => {
    const synced = cloneLeadTargetingSettings(settings);
    synced.currencyTargets = synced.currencyTargets.map((ct) =>
      syncCompanyQuartersFromTeams(ct),
    );
    mockLeadStore.targetingSettings = synced;
    setSettings(synced);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateCurrencyTargets = (
    currency: DealCurrency,
    updater: (ct: CurrencyQuarterlyTargets) => void,
  ) => {
    setSettings((s) => {
      const next = cloneLeadTargetingSettings(s);
      const ct = next.currencyTargets.find((t) => t.currency === currency);
      if (!ct) return next;
      updater(ct);
      return next;
    });
  };

  const updateTeamQuarter = (
    currency: DealCurrency,
    teamName: string,
    q: LeadQuarter,
    raw: string,
  ) => {
    const value = Number(raw) || 0;
    updateCurrencyTargets(currency, (row) => {
      const allocations = ensureTeamAllocations(row);
      row.teamAllocations = allocations.map((entry) =>
        entry.teamName === teamName
          ? { ...entry, quarters: updateQuarterTarget(entry.quarters, q, value) }
          : entry,
      );
      Object.assign(row, syncCompanyQuartersFromTeams(row));
    });
  };

  const addCurrency = (currency: DealCurrency) => {
    setSettings((s) => {
      if (s.currencyTargets.some((t) => t.currency === currency)) return s;
      const next = cloneLeadTargetingSettings(s);
      next.currencyTargets.push(
        migrateCurrencyTarget({
          currency,
          quarters: buildQuarterlyTargets(0),
          departmentAllocations: createEmptyDepartmentAllocations(),
          teamAllocations: createEmptyTeamAllocations(),
          personAllocations: createEmptyPersonAllocations(),
        }),
      );
      return next;
    });
    setActiveCurrency(currency);
  };

  const removeCurrency = (currency: DealCurrency) => {
    setSettings((s) => {
      if (s.currencyTargets.length <= 1) return s;
      const next = cloneLeadTargetingSettings(s);
      next.currencyTargets = next.currencyTargets.filter((row) => row.currency !== currency);
      return next;
    });
    if (activeCurrency === currency) {
      const remaining = settings.currencyTargets.filter((ct) => ct.currency !== currency);
      setActiveCurrency(remaining[0]?.currency ?? "ETB");
    }
  };

  const configuredCurrencies = settings.currencyTargets.map((t) => t.currency);
  const availableCurrencies = CURRENCY_OPTIONS.filter(
    (c) => !configuredCurrencies.includes(c),
  );

  const companyAnnual = teams.reduce((sum, team) => sum + quarterSum(team), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5]">
            <Target size={18} className="text-[#16a34a]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#1c1e21]">Revenue targets</h2>
            <p className="mt-0.5 max-w-lg text-[13px] text-[#6b7280]">
              Assign quarterly targets to each sales team. Company totals update automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={save}
            disabled={!hasChanges}
            size="sm"
            className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
          >
            Save
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-[12px] text-[#16a34a]">
              <Check size={13} />
              Saved
            </span>
          )}
        </div>
      </div>

      {activeCurrencyTarget && (
        <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {settings.currencyTargets.map((ct) => (
                <button
                  key={ct.currency}
                  type="button"
                  onClick={() => setActiveCurrency(ct.currency)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activeCurrency === ct.currency
                      ? "bg-[#eef2fd] text-[#4080f0]"
                      : "text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#374151]",
                  )}
                >
                  {ct.currency}
                </button>
              ))}
              {availableCurrencies.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 border-dashed border-[#d1d5db] text-xs text-[#6b7280] shadow-none"
                    >
                      <Plus size={13} />
                      Add currency
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[120px]">
                    {availableCurrencies.map((c) => (
                      <DropdownMenuItem key={c} onClick={() => addCurrency(c)}>
                        {c}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {settings.currencyTargets.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-[#9ca3af] hover:text-[#ef4444]"
                onClick={() => removeCurrency(activeCurrency)}
              >
                <Trash2 size={14} className="mr-1" />
                Remove {activeCurrency}
              </Button>
            )}
          </div>

          <div className="space-y-4 p-4">
            <CompanySummary
              currency={activeCurrency}
              fiscalYear={settings.fiscalYear}
              companyAnnual={companyAnnual}
            />

            <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
              <div className="grid border-b border-[#e5e7eb] lg:grid-cols-[240px_minmax(0,1fr)]">
                <div className="flex min-h-[59px] items-center border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 lg:border-b-0 lg:border-r">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                    Sales teams
                  </p>
                </div>
                <div className="flex min-h-[59px] items-center bg-white px-4 py-3">
                  {activeTeam ? (
                    <div>
                      <p className="text-sm font-semibold text-[#1c1e21]">
                        {activeTeam.teamName}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#6b7280]">
                        Team annual:{" "}
                        <span className="font-medium tabular-nums text-[#374151]">
                          {quarterSum(activeTeam) > 0
                            ? formatMoneyInCurrency(quarterSum(activeTeam), activeCurrency)
                            : "Not set"}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#9ca3af]">Select a sales team</p>
                  )}
                </div>
              </div>

              <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
                <div className="border-b border-[#e5e7eb] bg-[#f9fafb] p-2 lg:border-b-0 lg:border-r">
                  {teams.map((team) => {
                    const selected = activeTeam?.teamName === team.teamName;
                    const annual = quarterSum(team);
                    return (
                      <button
                        key={team.teamName}
                        type="button"
                        onClick={() => setActiveTeamName(team.teamName)}
                        className={cn(
                          "mb-1 w-full rounded-md px-3 py-2.5 text-left transition-colors last:mb-0",
                          selected
                            ? "bg-white shadow-sm ring-1 ring-[#e5e7eb]"
                            : "hover:bg-white/70",
                        )}
                      >
                        <p
                          className={cn(
                            "text-[13px] font-medium leading-snug",
                            selected ? "text-[#1c1e21]" : "text-[#374151]",
                          )}
                        >
                          {team.teamName}
                        </p>
                        <p className="mt-0.5 text-[11px] tabular-nums text-[#9ca3af]">
                          {annual > 0
                            ? formatCompactMoney(annual, activeCurrency)
                            : "No targets"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-[240px] bg-white">
                  {activeTeam ? (
                    <QuarterEditor
                      team={activeTeam}
                      quarterDefinitions={settings.quarterDefinitions}
                      onQuarterChange={(q, raw) =>
                        updateTeamQuarter(activeCurrency, activeTeam.teamName, q, raw)
                      }
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8 text-sm text-[#9ca3af]">
                      Select a sales team to set targets
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasChanges && !saved && (
        <p className="text-center text-[12px] text-[#9ca3af]">
          FY {settings.fiscalYear} · Quarter periods configured in Settings
        </p>
      )}
    </div>
  );
}
