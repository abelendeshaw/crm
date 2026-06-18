"use client";

import Link from "next/link";
import { CalendarRange, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DealCurrency } from "@/data/dealsManagementData";
import {
  formatFiscalYearQuartersSummary,
  quarterSum,
  updateQuarterTarget,
} from "@/data/leadsTargetsData";
import {
  AnnualSummary,
  CurrencyToolbar,
  QuarterEditor,
  SaveBar,
  addCurrencyToSettings,
  removeCurrencyFromSettings,
} from "@/modules/sales-targeting/shared";
import { useSalesTargetingSettings } from "@/modules/sales-targeting/useSalesTargetingSettings";

export function TargetDefinitionSection() {
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

  if (!activeCurrencyTarget) return null;

  const activeFiscalYear = settings.fiscalYears.find(
    (row) => row.year === settings.fiscalYear,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5]">
            <Target size={18} className="text-[#16a34a]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#1c1e21]">Target definition</h2>
            <p className="mt-0.5 max-w-lg text-[13px] text-[#6b7280]">
              Set company-wide quarterly revenue targets and objectives by currency.
            </p>
          </div>
        </div>
        <SaveBar hasChanges={hasChanges} saved={saved} onSave={save} />
      </div>

      <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
        <div className="border-b border-[#e5e7eb] px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1c1e21]">
                FY {settings.fiscalYear} target period
              </p>
              <p className="mt-1 text-[12px] text-[#6b7280]">
                {activeFiscalYear
                  ? formatFiscalYearQuartersSummary(activeFiscalYear.quarterDefinitions)
                  : "Quarter periods not configured"}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
            >
              <Link href="/settings">
                <CalendarRange size={14} className="mr-1.5" />
                Fiscal year settings
              </Link>
            </Button>
          </div>
        </div>

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

        <div className="space-y-4 p-4">
          <AnnualSummary
            label={`Company annual target · ${activeCurrency}`}
            currency={activeCurrency}
            annual={quarterSum(activeCurrencyTarget)}
          />
          <QuarterEditor
            title="Company quarterly targets"
            subtitle="These objectives cascade to departments, teams, and individuals."
            quarters={activeCurrencyTarget.quarters}
            quarterDefinitions={settings.quarterDefinitions}
            onQuarterChange={(q, raw) => {
              const value = Number(raw) || 0;
              updateCurrencyTargets(activeCurrency, (row) => {
                row.quarters = updateQuarterTarget(row.quarters, q, value);
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
