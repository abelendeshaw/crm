"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
  computeLeadTargetPct,
  type CurrencyQuarterlyTargets,
  type LeadQuarter,
  type LeadQuarterTarget,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";

const QUARTERS = [1, 2, 3, 4] as const;

export const SALES_TARGETING_PAGE_CLASS = "mx-auto w-full max-w-[1400px]";

const TEAM_DISTRIBUTION_COLORS = [
  "#4080f0",
  "#6b9cf5",
  "#93b8f8",
  "#bfd0fb",
  "#3070e0",
  "#245fcb",
];

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
    <div className="border-b border-[#e5e7eb] px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          items={settings.currencyTargets.map((ct) => ct.currency)}
          value={activeCurrency}
          onChange={onSelectCurrency}
          getKey={(currency) => currency}
          getLabel={(currency) => currency}
        />
        {settings.currencyTargets.length > 1 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-[#9ca3af] hover:text-[#ef4444]"
            onClick={() => onRemoveCurrency(activeCurrency)}
          >
            <Trash2 size={14} className="mr-1" />
            Remove {activeCurrency}
          </Button>
        ) : null}
      </div>
      {available.length > 0 ? (
        <div className="mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-dashed border-[#d1d5db] text-sm text-[#6b7280] shadow-none"
              >
                <Plus size={14} />
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
        </div>
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
    <div className={cn(SALES_TARGETING_PAGE_CLASS, "space-y-4")}>
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
  label,
  layout = "column",
}: {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  label?: string;
  layout?: "row" | "column";
}) {
  return (
    <div>
      {label ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          {label}
        </p>
      ) : null}
      <div
        className={cn(
          "flex gap-1",
          layout === "row" ? "flex-row flex-wrap" : "flex-col",
        )}
      >
        {items.map((item) => {
          const selected = getKey(item) === value;
          return (
            <button
              key={getKey(item)}
              type="button"
              onClick={() => onChange(item)}
              className={cn(
                "rounded-md border px-3 py-2 text-[13px] font-medium transition-colors",
                layout === "row" ? "whitespace-nowrap" : "text-left",
                selected
                  ? "border-[#bfd0fb] bg-[#eef3ff] text-[#245fcb]"
                  : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#cfd7e6] hover:text-[#374151]",
              )}
            >
              {getLabel(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SearchableFilter<T extends string>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  label,
  placeholder = "Search...",
}: {
  items: T[];
  value: T | "";
  onChange: (value: T | "") => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery(value ? getLabel(value) : "");
    }
  }, [value, open, getLabel]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => getLabel(item).toLowerCase().includes(normalized));
  }, [items, query, getLabel]);

  const selectItem = (item: T) => {
    onChange(item);
    setQuery(getLabel(item));
    setOpen(false);
  };

  return (
    <div>
      {label ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          {label}
        </p>
      ) : null}
      <div
        className="relative"
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            window.setTimeout(() => setOpen(false), 120);
          }
        }}
      >
        <Input
          value={query}
          placeholder={placeholder}
          className="h-9 border-[#e5e7eb] bg-white pr-9 text-sm shadow-none"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            if (!next.trim()) {
              onChange("");
            }
          }}
        />
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af] transition-transform",
            open && "rotate-180",
          )}
        />
        {open ? (
          <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-[#e5e7eb] bg-white p-1 shadow-md">
            {filteredItems.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#9ca3af]">No matches found</p>
            ) : (
              filteredItems.map((item) => {
                const selected = getKey(item) === value;
                return (
                  <button
                    key={getKey(item)}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectItem(item)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#f9fafb]",
                      selected
                        ? "bg-[#eef3ff] text-[#245fcb] ring-1 ring-[#bfd0fb]"
                        : "text-[#374151]",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{getLabel(item)}</span>
                    {selected ? <Check className="size-3.5 shrink-0" /> : null}
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EditableTargetInput({
  value,
  currency,
  onSave,
  placeholder = "Enter target",
  inputClassName,
  saveClassName,
  editFirst = false,
}: {
  value: number;
  currency: DealCurrency;
  onSave: (value: number) => void;
  placeholder?: string;
  inputClassName?: string;
  saveClassName?: string;
  editFirst?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const hasValue = value > 0;
  const isInputEditable = editFirst ? isEditing : !hasValue || isEditing;

  useEffect(() => {
    if (!isEditing) {
      setDraft(value > 0 ? String(value) : "");
    }
  }, [value, isEditing]);

  const startEditing = () => {
    setDraft(value > 0 ? String(value) : "");
    setIsEditing(true);
  };

  const save = () => {
    if (draft.trim() === "") return;
    onSave(Number(draft) || 0);
    setIsEditing(false);
    setDraft("");
  };

  const displayValue = isInputEditable
    ? draft
    : value > 0
      ? formatMoneyInCurrency(value, currency)
      : "Not set";

  return (
    <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:items-center">
      <Input
        type={isInputEditable ? "number" : "text"}
        min={0}
        readOnly={!isInputEditable}
        value={displayValue}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (isInputEditable && e.key === "Enter") save();
          if (isEditing && e.key === "Escape") {
            setIsEditing(false);
            setDraft("");
          }
        }}
        className={cn(
          "h-9 w-full min-w-[11rem] border-[#e5e7eb] bg-white text-sm tabular-nums text-[#1c1e21] sm:min-w-[12rem]",
          !isInputEditable && "cursor-default focus-visible:ring-0",
          inputClassName,
        )}
        placeholder={placeholder}
      />
      {isInputEditable ? (
        <Button
          type="button"
          size="sm"
          disabled={draft.trim() === ""}
          className={cn(
            "h-8 shrink-0 bg-[#4080f0] px-2.5 text-xs text-white hover:bg-[#3070e0] disabled:opacity-50",
            saveClassName,
          )}
          onClick={save}
        >
          Save
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-[#6b7280] hover:text-[#1c1e21]"
          onClick={startEditing}
          aria-label="Edit target"
        >
          <Pencil className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

export function CompactQuarterTable({
  quarters,
  quarterDefinitions,
  currency,
  onQuarterChange,
}: {
  quarters: LeadQuarterTarget[];
  quarterDefinitions: LeadTargetingSettings["quarterDefinitions"];
  currency: DealCurrency;
  onQuarterChange: (q: LeadQuarter, value: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {QUARTERS.map((q) => (
        <div key={q} className="min-w-0">
          <label className="mb-1 block text-[11px] font-medium text-[#6b7280]">
            Q{q}
            <span className="ml-1 font-normal text-[#9ca3af]">
              {getQuarterPeriodLabel(quarterDefinitions, q)}
            </span>
          </label>
          <EditableTargetInput
            value={getQuarterTarget(quarters, q)}
            currency={currency}
            placeholder="Enter target"
            editFirst
            onSave={(value) => onQuarterChange(q, value)}
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

export function TeamDistributionStatus({
  label,
  currency,
  companyAnnual,
  teams,
}: {
  label: string;
  currency: DealCurrency;
  companyAnnual: number;
  teams: { name: string; annual: number }[];
}) {
  const distributed = teams.reduce((sum, team) => sum + team.annual, 0);
  const distributedPct = computeLeadTargetPct(distributed, companyAnnual);
  const remaining = Math.max(0, companyAnnual - distributed);
  const isOverAllocated = companyAnnual > 0 && distributed > companyAnnual;

  return (
    <div className="flex h-full flex-col rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 lg:h-auto">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
        {label}
      </p>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="text-lg font-semibold tabular-nums text-[#1c1e21]">
          {companyAnnual > 0 ? `${distributedPct}%` : "—"}
          <span className="ml-1.5 text-[12px] font-medium text-[#6b7280]">distributed</span>
        </p>
        <p className="text-[12px] tabular-nums text-[#6b7280]">
          {formatCompactMoney(distributed, currency)}
          {companyAnnual > 0 ? (
            <span className="text-[#9ca3af]"> / {formatCompactMoney(companyAnnual, currency)}</span>
          ) : null}
        </p>
      </div>

      <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
        {companyAnnual > 0 ? (
          <>
            {teams.map((team, index) => {
              const sharePct = (team.annual / companyAnnual) * 100;
              if (sharePct <= 0) return null;
              return (
                <div
                  key={team.name}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${sharePct}%`,
                    backgroundColor: TEAM_DISTRIBUTION_COLORS[index % TEAM_DISTRIBUTION_COLORS.length],
                  }}
                  title={`${team.name}: ${formatCompactMoney(team.annual, currency)}`}
                />
              );
            })}
            {!isOverAllocated && remaining > 0 ? (
              <div
                className="h-full bg-[#f0f0f5] transition-all duration-300"
                style={{ width: `${(remaining / companyAnnual) * 100}%` }}
                title={`Unallocated: ${formatCompactMoney(remaining, currency)}`}
              />
            ) : null}
            {isOverAllocated ? (
              <div
                className="h-full bg-[#fca5a5] transition-all duration-300"
                style={{ width: `${((distributed - companyAnnual) / companyAnnual) * 100}%` }}
                title={`Over-allocated: ${formatCompactMoney(distributed - companyAnnual, currency)}`}
              />
            ) : null}
          </>
        ) : (
          <div className="h-full w-full bg-[#f0f0f5]" />
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2">
        {teams.length > 0 ? (
          teams.map((team, index) => {
            const teamPct = computeLeadTargetPct(team.annual, companyAnnual);
            const color = TEAM_DISTRIBUTION_COLORS[index % TEAM_DISTRIBUTION_COLORS.length];
            return (
              <div key={team.name} className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12px] font-medium text-[#374151]">{team.name}</p>
                    <p className="shrink-0 text-[11px] font-semibold tabular-nums text-[#4080f0]">
                      {companyAnnual > 0 ? `${teamPct}%` : "—"}
                    </p>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#f0f0f5]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(teamPct, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
                <p className="hidden shrink-0 text-[11px] tabular-nums text-[#6b7280] sm:block">
                  {formatCompactMoney(team.annual, currency)}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-[12px] text-[#9ca3af]">No Sales teams to display.</p>
        )}
      </div>

      {companyAnnual > 0 && remaining > 0 && !isOverAllocated ? (
        <p className="mt-2 text-[11px] text-[#9ca3af]">
          {formatCompactMoney(remaining, currency)} unallocated
        </p>
      ) : null}
      {isOverAllocated ? (
        <p className="mt-2 text-[11px] font-medium text-[#dc2626]">
          Over-allocated by {formatCompactMoney(distributed - companyAnnual, currency)}
        </p>
      ) : null}
    </div>
  );
}

export function PerformanceStatus({
  label,
  currency,
  totalTarget,
  items,
  emptyMessage = "No items to display.",
  sections = "all",
}: {
  label: string;
  currency: DealCurrency;
  totalTarget: number;
  items: { name: string; target: number; achieved: number }[];
  emptyMessage?: string;
  sections?: "all" | "summary" | "table";
}) {
  const totalAchieved = items.reduce((sum, item) => sum + item.achieved, 0);
  const achievedPct = computeLeadTargetPct(totalAchieved, totalTarget);
  const remaining = Math.max(0, totalTarget - totalAchieved);
  const isOverAchieved = totalTarget > 0 && totalAchieved > totalTarget;
  const ringPct = Math.min(achievedPct, 100);
  const ringSize = 88;
  const ringStroke = 7;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (ringPct / 100) * ringCircumference;

  const sortedItems = [...items].sort((a, b) => {
    const aPct = computeLeadTargetPct(a.achieved, a.target);
    const bPct = computeLeadTargetPct(b.achieved, b.target);
    if (bPct !== aPct) return bPct - aPct;
    return b.achieved - a.achieved;
  });

  const showSummary = sections === "all" || sections === "summary";
  const showTable = sections === "all" || sections === "table";

  return (
    <div className="flex w-full flex-col">
      {showSummary ? (
      <div className="flex flex-col gap-5 border-b border-[#e5e7eb] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
            {label}
          </p>
          <p className="mt-1 text-[13px] text-[#6b7280]">
            {items.length} {items.length === 1 ? "entity" : "entities"} tracked
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 sm:gap-8">
          <div className="relative flex size-[88px] shrink-0 items-center justify-center">
            <svg
              width={ringSize}
              height={ringSize}
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              className="-rotate-90"
              aria-hidden="true"
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke="#eef2fd"
                strokeWidth={ringStroke}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke={isOverAchieved ? "#16a34a" : "#4080f0"}
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-semibold tabular-nums text-[#1c1e21]">
                {totalTarget > 0 ? `${achievedPct}%` : "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
                Achieved
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-[#1c1e21]">
                {formatCompactMoney(totalAchieved, currency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
                Target
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-[#1c1e21]">
                {totalTarget > 0 ? formatCompactMoney(totalTarget, currency) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
                {isOverAchieved ? "Over" : "Remaining"}
              </p>
              <p
                className={cn(
                  "mt-1 text-base font-semibold tabular-nums",
                  isOverAchieved ? "text-[#16a34a]" : "text-[#1c1e21]",
                )}
              >
                {totalTarget > 0
                  ? formatCompactMoney(
                      isOverAchieved ? totalAchieved - totalTarget : remaining,
                      currency,
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {showTable ? (
      sortedItems.length > 0 ? (
        <div className={cn(showSummary ? "mt-4" : "mt-0", "overflow-hidden rounded-lg border border-[#e5e7eb]")}>
          <div className="hidden border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-2 sm:grid sm:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_4rem] sm:gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Name
            </p>
            <p className="text-right text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Achieved
            </p>
            <p className="text-right text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Target
            </p>
            <p className="text-right text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Progress
            </p>
          </div>

          <div className="divide-y divide-[#f3f4f6]">
            {sortedItems.map((item) => {
              const itemPct = computeLeadTargetPct(item.achieved, item.target);
              const itemRemaining = Math.max(0, item.target - item.achieved);

              return (
                <div
                  key={item.name}
                  className="px-4 py-3 transition-colors hover:bg-[#fafbfc] sm:grid sm:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_4rem] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[#1c1e21]">{item.name}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2fd] sm:mt-2.5">
                      <div
                        className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
                        style={{ width: `${Math.min(itemPct, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#9ca3af] sm:hidden">
                      {formatCompactMoney(item.achieved, currency)} /{" "}
                      {item.target > 0 ? formatCompactMoney(item.target, currency) : "—"}
                    </p>
                  </div>

                  <p className="hidden text-right text-[12px] font-medium tabular-nums text-[#374151] sm:block">
                    {formatCompactMoney(item.achieved, currency)}
                  </p>
                  <p className="hidden text-right text-[12px] tabular-nums text-[#6b7280] sm:block">
                    {item.target > 0 ? formatCompactMoney(item.target, currency) : "—"}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2 sm:mt-0 sm:justify-end">
                    <p className="text-[12px] tabular-nums text-[#9ca3af] sm:hidden">
                      {item.target > 0 ? `${itemPct}%` : "—"}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        itemPct >= 100
                          ? "text-[#16a34a]"
                          : itemPct > 0
                            ? "text-[#4080f0]"
                            : "text-[#9ca3af]",
                      )}
                    >
                      {item.target > 0 ? `${itemPct}%` : "—"}
                    </p>
                  </div>

                  {item.target > 0 && itemRemaining > 0 ? (
                    <p className="col-span-full mt-1 text-[11px] text-[#9ca3af]">
                      {formatCompactMoney(itemRemaining, currency)} to go
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className={cn(showSummary ? "mt-4" : "mt-0", "py-8 text-center text-sm text-[#9ca3af]")}>
          {emptyMessage}
        </p>
      )
      ) : null}
    </div>
  );
}

export function AnnualTargetGlance({
  teamName,
  currency,
  annual,
}: {
  teamName: string;
  currency: DealCurrency;
  annual: number;
}) {
  return (
    <div className="flex max-w-full items-center gap-2.5 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1.5 sm:max-w-sm">
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          Annual · {currency}
        </p>
        <p className="truncate text-[11px] text-[#6b7280]">{teamName}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums text-[#1c1e21]">
        {annual > 0 ? formatMoneyInCurrency(annual, currency) : "Not set"}
      </p>
    </div>
  );
}

export function AnnualSummary({
  label,
  subtitle,
  currency,
  annual,
  achieved,
  onAnnualChange,
  compact = false,
}: {
  label: string;
  subtitle?: string;
  currency: DealCurrency;
  annual: number;
  achieved?: number;
  onAnnualChange?: (annual: number) => void;
  compact?: boolean;
}) {
  const achievedPct = computeLeadTargetPct(achieved ?? 0, annual);

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
        {label}
      </p>
      {subtitle ? (
        <p className="mt-0.5 text-[12px] text-[#6b7280]">{subtitle}</p>
      ) : null}
      <div className={subtitle ? "mt-2" : "mt-1"}>
        {onAnnualChange ? (
          <EditableTargetInput
            value={annual}
            currency={currency}
            placeholder="Enter annual target"
            inputClassName={compact ? "h-9 text-sm font-semibold" : "h-10 text-lg font-semibold"}
            saveClassName={compact ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm"}
            onSave={onAnnualChange}
          />
        ) : (
          <p className="text-2xl font-semibold tabular-nums text-[#1c1e21]">
            {annual > 0 ? formatMoneyInCurrency(annual, currency) : "Not set"}
          </p>
        )}
      </div>
      {achieved !== undefined && annual > 0 ? (
        <div className="mt-3 border-t border-[#e5e7eb] pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-[#6b7280]">Achieved to date</p>
            <p className="text-[12px] font-semibold tabular-nums text-[#4080f0]">
              {achievedPct}%
            </p>
          </div>
          <p className="mt-1 text-[12px] font-semibold tabular-nums text-[#1c1e21]">
            {formatCompactMoney(achieved, currency)}
            <span className="font-medium text-[#9ca3af]">
              {" "}
              / {formatCompactMoney(annual, currency)}
            </span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0f0f5]">
            <div
              className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
              style={{ width: `${Math.min(achievedPct, 100)}%` }}
            />
          </div>
        </div>
      ) : null}
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
