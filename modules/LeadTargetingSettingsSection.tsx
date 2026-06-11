"use client";

import { useEffect, useState } from "react";
import { Check, Target, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CURRENCY_OPTIONS, type DealCurrency } from "@/data/dealsManagementData";
import {
  formatTargetMoney,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";
import { mockLeadStore } from "@/data/mockStore";

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028];

export function LeadTargetingSettingsSection() {
  const [settings, setSettings] = useState<LeadTargetingSettings>(() => ({
    ...mockLeadStore.targetingSettings,
  }));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return mockLeadStore.subscribeTargetingSettings((next) => {
      setSettings({ ...next });
    });
  }, []);

  const hasChanges =
    settings.displayCurrency !== mockLeadStore.targetingSettings.displayCurrency ||
    settings.annualRevenueTarget !== mockLeadStore.targetingSettings.annualRevenueTarget ||
    settings.fiscalYear !== mockLeadStore.targetingSettings.fiscalYear;

  const save = () => {
    mockLeadStore.targetingSettings = {
      displayCurrency: settings.displayCurrency,
      annualRevenueTarget: Math.max(0, settings.annualRevenueTarget),
      fiscalYear: settings.fiscalYear,
    };
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fmt = (v: number) => formatTargetMoney(v, settings.displayCurrency);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2fd]">
            <Coins size={18} className="text-[#4080f0]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#1c1e21]">Display Currency</h2>
            <p className="mt-0.5 text-[13px] text-[#6b7280]">
              Choose how revenue targets and achievement values are displayed across the leads
              pipeline and detail views.
            </p>
          </div>
        </div>
        <div className="mt-4 max-w-xs">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
            Target display currency
          </label>
          <Select
            value={settings.displayCurrency}
            onValueChange={(v) =>
              setSettings((s) => ({ ...s, displayCurrency: v as DealCurrency }))
            }
          >
            <SelectTrigger className="mt-1.5 h-9 border-[#e5e7eb] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5]">
            <Target size={18} className="text-[#16a34a]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#1c1e21]">Annual Revenue Target</h2>
            <p className="mt-0.5 text-[13px] text-[#6b7280]">
              Set the company-wide annual revenue objective for executive planning. Individual lead
              targets are assigned through the external sales targeting system.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              Fiscal year
            </label>
            <Select
              value={String(settings.fiscalYear)}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, fiscalYear: Number(v) }))
              }
            >
              <SelectTrigger className="mt-1.5 h-9 border-[#e5e7eb] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    FY {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              Annual revenue target ({settings.displayCurrency})
            </label>
            <Input
              type="number"
              min={0}
              value={settings.annualRevenueTarget || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  annualRevenueTarget: Number(e.target.value) || 0,
                }))
              }
              className="mt-1.5 h-9 border-[#e5e7eb] bg-white"
              placeholder="e.g. 260000000"
            />
          </div>
        </div>
        {settings.annualRevenueTarget > 0 && (
          <p className="mt-3 text-[13px] text-[#6b7280]">
            FY {settings.fiscalYear} objective:{" "}
            <span className="font-semibold text-[#1c1e21]">
              {fmt(settings.annualRevenueTarget)}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={save}
          disabled={!hasChanges}
          className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
        >
          Save targeting settings
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-[13px] text-[#16a34a]">
            <Check size={14} />
            Saved
          </span>
        )}
        {!hasChanges && !saved && (
          <span className="text-[13px] text-[#9ca3af]">No unsaved changes</span>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
        <p className="text-[12px] text-[#6b7280]">
          Per-lead sales targets are seeded from the external Sales Targeting module and appear on
          pipeline cards and lead detail pages. Achievement can be updated manually or is
          automatically recorded when a lead reaches{" "}
          <span className={cn("font-medium text-[#374151]")}>Contract Signed</span>.
        </p>
      </div>
    </div>
  );
}
