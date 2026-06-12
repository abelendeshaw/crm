"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cloneLeadTargetingSettings,
  type LeadQuarter,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";
import { mockLeadStore } from "@/data/mockStore";

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028];
const QUARTERS = [1, 2, 3, 4] as const;

export function FiscalYearQuartersSettingsSection({ onSave }: { onSave: () => void }) {
  const [settings, setSettings] = useState<LeadTargetingSettings>(() =>
    cloneLeadTargetingSettings(mockLeadStore.targetingSettings),
  );

  useEffect(() => {
    return mockLeadStore.subscribeTargetingSettings((next) => {
      setSettings(cloneLeadTargetingSettings(next));
    });
  }, []);

  const hasChanges =
    JSON.stringify(settings) !==
    JSON.stringify(cloneLeadTargetingSettings(mockLeadStore.targetingSettings));

  const handleSave = () => {
    mockLeadStore.targetingSettings = cloneLeadTargetingSettings(settings);
    onSave();
  };

  const updatePeriodLabel = (q: LeadQuarter, periodLabel: string) => {
    setSettings((current) => ({
      ...current,
      quarterDefinitions: current.quarterDefinitions.map((row) =>
        row.q === q ? { ...row, periodLabel } : row,
      ),
    }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fiscal Year</CardTitle>
          <CardDescription>
            The active fiscal year used for sales targets and quarterly reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-xs">
          <Label htmlFor="fiscal-year">Year</Label>
          <Select
            value={String(settings.fiscalYear)}
            onValueChange={(value) =>
              setSettings((current) => ({ ...current, fiscalYear: Number(value) }))
            }
          >
            <SelectTrigger id="fiscal-year" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  FY {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quarter Periods</CardTitle>
          <CardDescription>
            Define how each quarter is labeled across the CRM.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {QUARTERS.map((q) => {
            const definition = settings.quarterDefinitions.find((row) => row.q === q);
            return (
              <div
                key={q}
                className="flex flex-wrap items-center gap-3 rounded-md border p-3 sm:flex-nowrap"
              >
                <div className="w-12 shrink-0">
                  <p className="text-sm font-semibold text-[#1c1e21]">Q{q}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`quarter-period-${q}`} className="sr-only">
                    Q{q} period
                  </Label>
                  <Input
                    id={`quarter-period-${q}`}
                    value={definition?.periodLabel ?? ""}
                    onChange={(e) => updatePeriodLabel(q, e.target.value)}
                    placeholder="e.g. Jan – Mar"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={!hasChanges}
        className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
      >
        <Save data-icon="inline-start" />
        Save Changes
      </Button>
    </>
  );
}
