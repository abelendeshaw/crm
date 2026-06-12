"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  addFiscalYearConfig,
  applyActiveFiscalYear,
  cloneLeadTargetingSettings,
  formatFiscalYearQuartersSummary,
  updateFiscalYearPeriod,
  type LeadQuarter,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";
import { mockLeadStore } from "@/data/mockStore";

const QUARTERS = [1, 2, 3, 4] as const;
const ADDABLE_YEARS = Array.from({ length: 9 }, (_, index) => 2024 + index);

export function FiscalYearQuartersSettingsSection({ onSave }: { onSave: () => void }) {
  const [settings, setSettings] = useState<LeadTargetingSettings>(() =>
    cloneLeadTargetingSettings(mockLeadStore.targetingSettings),
  );
  const [editingYear, setEditingYear] = useState<number>(
    () => mockLeadStore.targetingSettings.fiscalYear,
  );

  useEffect(() => {
    return mockLeadStore.subscribeTargetingSettings((next) => {
      const cloned = cloneLeadTargetingSettings(next);
      setSettings(cloned);
      setEditingYear(cloned.fiscalYear);
    });
  }, []);

  const hasChanges =
    JSON.stringify(settings) !==
    JSON.stringify(cloneLeadTargetingSettings(mockLeadStore.targetingSettings));

  const activeConfig = useMemo(
    () => settings.fiscalYears.find((row) => row.year === settings.fiscalYear),
    [settings.fiscalYear, settings.fiscalYears],
  );

  const editingConfig = useMemo(
    () => settings.fiscalYears.find((row) => row.year === editingYear),
    [editingYear, settings.fiscalYears],
  );

  const addableYears = useMemo(
    () => ADDABLE_YEARS.filter((year) => !settings.fiscalYears.some((row) => row.year === year)),
    [settings.fiscalYears],
  );

  const handleSave = () => {
    mockLeadStore.targetingSettings = cloneLeadTargetingSettings(settings);
    onSave();
  };

  const setCurrentFiscalYear = (year: number) => {
    setSettings((current) => applyActiveFiscalYear(current, year));
    setEditingYear(year);
  };

  const updatePeriodLabel = (year: number, q: LeadQuarter, periodLabel: string) => {
    setSettings((current) => updateFiscalYearPeriod(current, year, q, periodLabel));
  };

  const handleAddFiscalYear = (year: number) => {
    setSettings((current) => addFiscalYearConfig(current, year));
    setEditingYear(year);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#1c1e21]">Current fiscal year</p>
              <Badge className="bg-[#4080f0] text-white hover:bg-[#4080f0]">Active</Badge>
            </div>
            <p className="text-xs text-[#6b7280]">
              Used for sales targets, lead quarters, and quarterly reporting.
            </p>
          </div>
          <div className="w-full max-w-[180px]">
            <Label htmlFor="current-fiscal-year" className="sr-only">
              Current fiscal year
            </Label>
            <Select
              value={String(settings.fiscalYear)}
              onValueChange={(value) => setCurrentFiscalYear(Number(value))}
            >
              <SelectTrigger id="current-fiscal-year" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings.fiscalYears.map((row) => (
                  <SelectItem key={row.year} value={String(row.year)}>
                    FY {row.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeConfig ? (
          <div className="mt-4 rounded-md border border-[#dbeafe] bg-white p-3">
            <p className="text-lg font-semibold text-[#1c1e21]">FY {activeConfig.year}</p>
            <p className="mt-1 text-xs text-[#6b7280]">
              {formatFiscalYearQuartersSummary(activeConfig.quarterDefinitions)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1c1e21]">Available fiscal years</p>
            <p className="text-xs text-[#6b7280]">
              Choose a fiscal year to edit its quarter periods.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={addableYears.length === 0}
              >
                <Plus data-icon="inline-start" />
                Add fiscal year
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {addableYears.map((year) => (
                <DropdownMenuItem key={year} onClick={() => handleAddFiscalYear(year)}>
                  FY {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-2">
          {settings.fiscalYears.map((row) => {
            const isCurrent = row.year === settings.fiscalYear;
            const isEditing = row.year === editingYear;
            return (
              <button
                key={row.year}
                type="button"
                onClick={() => setEditingYear(row.year)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors",
                  isEditing
                    ? "border-[#4080f0] bg-[#f8fbff]"
                    : "border-[#e5e7eb] bg-white hover:bg-[#f9fafb]",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#1c1e21]">FY {row.year}</p>
                    {isCurrent ? (
                      <Badge variant="outline" className="border-[#bfdbfe] bg-[#eff6ff] text-[#4080f0]">
                        Current
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {formatFiscalYearQuartersSummary(row.quarterDefinitions)}
                  </p>
                </div>
                {isEditing ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-[#4080f0]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {editingConfig ? (
        <div className="space-y-3 rounded-lg border border-[#e5e7eb] p-4">
          <div>
            <p className="text-sm font-semibold text-[#1c1e21]">
              Quarter periods · FY {editingConfig.year}
            </p>
            <p className="text-xs text-[#6b7280]">
              Define how each quarter is labeled for this fiscal year.
            </p>
          </div>

          <div className="grid gap-3">
            {QUARTERS.map((q) => {
              const definition = editingConfig.quarterDefinitions.find((row) => row.q === q);
              return (
                <div
                  key={q}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-3 sm:flex-nowrap"
                >
                  <div className="w-12 shrink-0">
                    <p className="text-sm font-semibold text-[#1c1e21]">Q{q}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`quarter-period-${editingConfig.year}-${q}`} className="sr-only">
                      Q{q} period
                    </Label>
                    <Input
                      id={`quarter-period-${editingConfig.year}-${q}`}
                      value={definition?.periodLabel ?? ""}
                      onChange={(e) =>
                        updatePeriodLabel(editingConfig.year, q, e.target.value)
                      }
                      placeholder="e.g. Jan – Mar"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {editingConfig.year !== settings.fiscalYear ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentFiscalYear(editingConfig.year)}
            >
              Set FY {editingConfig.year} as current
            </Button>
          ) : null}
        </div>
      ) : null}

      <Button
        onClick={handleSave}
        disabled={!hasChanges}
        className="w-fit bg-[#4080f0] text-white hover:bg-[#3070e0]"
      >
        <Save data-icon="inline-start" />
        Save Changes
      </Button>
    </div>
  );
}
