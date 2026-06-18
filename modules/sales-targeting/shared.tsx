"use client";

import type { ReactNode } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
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
  getQuarterPeriodLabel,
  migrateCurrencyTarget,
  quarterSum,
  type CurrencyQuarterlyTargets,
  type LeadQuarter,
  type LeadQuarterTarget,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";

const QUARTERS = [1, 2, 3, 4] as const;

export function SaveBar({
  hasChanges,
  saved,
  onSave,
}: {
  hasChanges: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onSave}
        disabled={!hasChanges}
        size="sm"
        className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
      >
        Save
      </Button>
      {saved ? (
        <span className="inline-flex items-center gap-1 text-[12px] text-[#16a34a]">
          <Check size={13} />
          Saved
        </span>
      ) : null}
    </div>
  );
}

export function CurrencyToolbar({
  settings,
  activeCurrency,
  onSelectCurrency,
  onAddCurrency,
  onRemoveCurrency,
}: {
  settings: LeadTargetingSettings;
  activeCurrency: DealCurrency;
  onSelectCurrency: (currency: DealCurrency) => void;
  onAddCurrency: (currency: DealCurrency) => void;
  onRemoveCurrency: (currency: DealCurrency) => void;
}) {
  const configured = settings.currencyTargets.map((ct) => ct.currency);
  const available = CURRENCY_OPTIONS.filter((currency) => !configured.includes(currency));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {settings.currencyTargets.map((ct) => (
          <button
            key={ct.currency}
            type="button"
            onClick={() => onSelectCurrency(ct.currency)}
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
        {available.length > 0 ? (
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
              {available.map((currency) => (
                <DropdownMenuItem key={currency} onClick={() => onAddCurrency(currency)}>
                  {currency}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {settings.currencyTargets.length > 1 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-[#9ca3af] hover:text-[#ef4444]"
          onClick={() => onRemoveCurrency(activeCurrency)}
        >
          <Trash2 size={14} className="mr-1" />
          Remove {activeCurrency}
        </Button>
      ) : null}
    </div>
  );
}

export function SectionShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1c1e21]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[13px] text-[#6b7280]">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">{children}</div>
    </div>
  );
}

export function PillSelect<T extends string>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
}: {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const selected = getKey(item) === value;
        return (
          <button
            key={getKey(item)}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
              selected
                ? "bg-[#4080f0] text-white"
                : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#374151]",
            )}
          >
            {getLabel(item)}
          </button>
        );
      })}
    </div>
  );
}

export function CompactQuarterTable({
  quarters,
  quarterDefinitions,
  onQuarterChange,
}: {
  quarters: LeadQuarterTarget[];
  quarterDefinitions: LeadTargetingSettings["quarterDefinitions"];
  onQuarterChange: (q: LeadQuarter, raw: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUARTERS.map((q) => (
        <div key={q}>
          <label className="mb-1 block text-[11px] font-medium text-[#6b7280]">
            Q{q}
            <span className="ml-1 font-normal text-[#9ca3af]">
              {getQuarterPeriodLabel(quarterDefinitions, q)}
            </span>
          </label>
          <Input
            type="number"
            min={0}
            value={getQuarterTarget(quarters, q) || ""}
            onChange={(e) => onQuarterChange(q, e.target.value)}
            className="h-9 border-[#e5e7eb] bg-white text-sm tabular-nums"
            placeholder="0"
          />
        </div>
      ))}
    </div>
  );
}

export function SimpleProgressList({
  rows,
}: {
  rows: {
    id: string;
    label: string;
    subtitle?: string;
    currency: DealCurrency;
    target: number;
    achieved: number;
    pct: number;
  }[];
}) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-[#9ca3af]">No targets set for this level.</p>
    );
  }

  return (
    <div className="divide-y divide-[#f3f4f6]">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#1c1e21]">{row.label}</p>
            {row.subtitle ? (
              <p className="truncate text-[11px] text-[#9ca3af]">{row.subtitle}</p>
            ) : null}
          </div>
          <div className="hidden w-32 sm:block">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f0f5]">
              <div
                className="h-full rounded-full bg-[#4080f0] transition-all"
                style={{ width: `${Math.min(row.pct, 100)}%` }}
              />
            </div>
          </div>
          <p className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-[#4080f0]">
            {row.pct}%
          </p>
        </div>
      ))}
    </div>
  );
}

export function QuarterEditor({
  title,
  subtitle,
  quarters,
  quarterDefinitions,
  onQuarterChange,
}: {
  title: string;
  subtitle?: string;
  quarters: LeadQuarterTarget[];
  quarterDefinitions: LeadTargetingSettings["quarterDefinitions"];
  onQuarterChange: (q: LeadQuarter, raw: string) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-[#1c1e21]">{title}</p>
        {subtitle ? <p className="mt-0.5 text-[12px] text-[#6b7280]">{subtitle}</p> : null}
      </div>
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
              value={getQuarterTarget(quarters, q) || ""}
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

export function ProgressRow({
  label,
  subtitle,
  currency,
  target,
  achieved,
  pct,
}: {
  label: string;
  subtitle?: string;
  currency: DealCurrency;
  target: number;
  achieved: number;
  pct: number;
}) {
  return (
    <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1c1e21]">{label}</p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">{subtitle}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-sm font-bold text-[#4080f0]">{pct}%</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-[#1c1e21]">
        {formatCompactMoney(achieved, currency)}
        <span className="font-medium text-[#9ca3af]">
          {" "}
          / {formatCompactMoney(target, currency)}
        </span>
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#f0f0f5]">
        <div
          className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AnnualSummary({
  label,
  currency,
  annual,
}: {
  label: string;
  currency: DealCurrency;
  annual: number;
}) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[#1c1e21]">
        {annual > 0 ? formatMoneyInCurrency(annual, currency) : "Not set"}
      </p>
    </div>
  );
}

export function addCurrencyToSettings(
  settings: LeadTargetingSettings,
  currency: DealCurrency,
): LeadTargetingSettings {
  if (settings.currencyTargets.some((ct) => ct.currency === currency)) return settings;
  const next = cloneLeadTargetingSettings(settings);
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
}

export function removeCurrencyFromSettings(
  settings: LeadTargetingSettings,
  currency: DealCurrency,
): LeadTargetingSettings {
  if (settings.currencyTargets.length <= 1) return settings;
  const next = cloneLeadTargetingSettings(settings);
  next.currencyTargets = next.currencyTargets.filter((ct) => ct.currency !== currency);
  return next;
}

export { quarterSum };
