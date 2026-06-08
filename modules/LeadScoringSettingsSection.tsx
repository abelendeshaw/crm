"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ScoringRule = {
  id: string;
  name: string;
  criteria: string;
  points: number;
  enabled: boolean;
};

const INITIAL_RULES: ScoringRule[] = [
  {
    id: "rs-1",
    name: "Target Industry Match",
    criteria: "Industry equals 'SaaS' or 'Fintech'",
    points: 25,
    enabled: true,
  },
  {
    id: "rs-2",
    name: "Website Visit",
    criteria: "Visits pricing page more than 3 times",
    points: 15,
    enabled: true,
  },
  {
    id: "rs-3",
    name: "Invalid Email",
    criteria: "Email domain contains 'gmail' or 'yahoo'",
    points: -10,
    enabled: true,
  },
  {
    id: "rs-4",
    name: "Decision Maker Role",
    criteria: "Job title contains 'Director' or 'VP'",
    points: 30,
    enabled: true,
  },
  {
    id: "rs-5",
    name: "No Activity (30 Days)",
    criteria: "Last engagement date more than 30 days ago",
    points: -20,
    enabled: false,
  },
];

type RuleDraft = { name: string; criteria: string; points: string };
const EMPTY_DRAFT: RuleDraft = { name: "", criteria: "", points: "10" };

const SCORE_TIERS = [
  {
    label: "Hot",
    description: "Marketing qualified — ready to hand off",
    threshold: "≥ 60 pts",
    dotColor: "bg-red-400",
    badgeBg: "bg-red-50",
    badgeText: "text-red-600",
    badgeBorder: "border-red-100",
  },
  {
    label: "Warm",
    description: "Sales accepted — needs follow-up",
    threshold: "30 – 59 pts",
    dotColor: "bg-amber-400",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-100",
  },
  {
    label: "Cold",
    description: "Early stage — continue nurturing",
    threshold: "< 30 pts",
    dotColor: "bg-slate-300",
    badgeBg: "bg-slate-50",
    badgeText: "text-slate-600",
    badgeBorder: "border-slate-200",
  },
];

const DISTRIBUTION = [
  { label: "Hot (MQL)", pct: 18, color: "bg-red-400" },
  { label: "Warm (SAL)", pct: 42, color: "bg-amber-400" },
  { label: "Cold", pct: 40, color: "bg-slate-300" },
];

export function LeadScoringSettingsSection() {
  const [rules, setRules] = useState<ScoringRule[]>(INITIAL_RULES);
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [draft, setDraft] = useState<RuleDraft>(EMPTY_DRAFT);

  const enabledCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules]);
  const maxScore = useMemo(
    () =>
      rules
        .filter((r) => r.enabled && r.points > 0)
        .reduce((acc, r) => acc + r.points, 0),
    [rules],
  );

  const toggleRule = (id: string, enabled: boolean) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));

  const deleteRule = (id: string) =>
    setRules((prev) => prev.filter((r) => r.id !== id));

  const addRule = () => {
    const pts = Number.parseInt(draft.points, 10);
    const points = Number.isFinite(pts) ? Math.max(-100, Math.min(100, pts)) : 0;
    setRules((prev) => [
      ...prev,
      {
        id: `rs-${crypto.randomUUID()}`,
        name: draft.name.trim() || "New rule",
        criteria: draft.criteria.trim() || "No criteria defined.",
        points,
        enabled: true,
      },
    ]);
    setDraft(EMPTY_DRAFT);
    setNewRuleOpen(false);
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Rules", value: String(rules.length), sub: "configured" },
          { label: "Active Rules", value: String(enabledCount), sub: "currently firing" },
          { label: "Max Score", value: `+${maxScore}`, sub: "pts achievable" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#1c1e21]">{value}</p>
            <p className="mt-0.5 text-[11px] text-[#9ca3af]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left: rules list */}
        <div className="col-span-8">
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-3.5">
              <div>
                <h3 className="text-[13px] font-semibold text-[#1c1e21]">Scoring Rules</h3>
                <p className="text-[11px] text-[#9ca3af]">
                  {enabledCount} of {rules.length} active
                </p>
              </div>
              <Button
                size="sm"
                className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                onClick={() => {
                  setDraft(EMPTY_DRAFT);
                  setNewRuleOpen(true);
                }}
              >
                <Plus size={14} className="mr-1" />
                Add Rule
              </Button>
            </div>

            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <p className="text-sm font-medium text-[#1c1e21]">No rules configured</p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Add your first rule to start qualifying leads automatically.
                </p>
              </div>
            ) : (
              rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className={cn(
                    "group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#fafbff]",
                    idx < rules.length - 1 && "border-b border-[#f0f2f7]",
                    !rule.enabled && "opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "w-0.5 self-stretch shrink-0 rounded-full",
                      rule.points >= 0 ? "bg-[#4080f0]" : "bg-red-400",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1c1e21]">{rule.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#6b7280]">{rule.criteria}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 min-w-[56px] text-right text-sm font-bold tabular-nums",
                      rule.points >= 0 ? "text-[#4080f0]" : "text-red-500",
                    )}
                  >
                    {rule.points >= 0 ? "+" : ""}
                    {rule.points} pts
                  </span>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => toggleRule(rule.id, Boolean(v))}
                    aria-label={`${rule.enabled ? "Disable" : "Enable"} ${rule.name}`}
                    className="data-checked:bg-[#4080f0] data-checked:hover:bg-[#3070e0] shrink-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-[#d1d5db] opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    onClick={() => deleteRule(rule.id)}
                    aria-label={`Delete ${rule.name}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: tiers + distribution */}
        <div className="col-span-4 space-y-4">
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
            <div className="border-b border-[#e5e7eb] px-4 py-3.5">
              <h3 className="text-[13px] font-semibold text-[#1c1e21]">Score Tiers</h3>
            </div>
            <div className="divide-y divide-[#f0f2f7]">
              {SCORE_TIERS.map((tier) => (
                <div key={tier.label} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", tier.dotColor)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1c1e21]">{tier.label}</p>
                    <p className="text-[11px] text-[#9ca3af]">{tier.description}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                      tier.badgeBg,
                      tier.badgeText,
                      tier.badgeBorder,
                    )}
                  >
                    {tier.threshold}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
            <h3 className="mb-4 text-[13px] font-semibold text-[#1c1e21]">Lead Distribution</h3>
            <div className="space-y-3.5">
              {DISTRIBUTION.map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] text-[#374151]">{row.label}</span>
                    <span className="text-[13px] font-semibold text-[#1c1e21]">{row.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2f7]">
                    <div
                      className={cn("h-full rounded-full", row.color)}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={newRuleOpen} onOpenChange={setNewRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Scoring Rule</DialogTitle>
            <DialogDescription>
              Define when this rule fires and how many points it adds or subtracts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">Rule name</Label>
              <Input
                id="rule-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Enterprise company size"
                className="border-[#e5e7eb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-criteria">Criteria</Label>
              <Textarea
                id="rule-criteria"
                rows={3}
                value={draft.criteria}
                onChange={(e) => setDraft((d) => ({ ...d, criteria: e.target.value }))}
                placeholder="Describe when this rule applies"
                className="resize-none border-[#e5e7eb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-points">Points (+ or −)</Label>
              <Input
                id="rule-points"
                type="number"
                min={-100}
                max={100}
                value={draft.points}
                onChange={(e) => setDraft((d) => ({ ...d, points: e.target.value }))}
                className="border-[#e5e7eb]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRuleOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#4080f0] text-white hover:bg-[#3070e0]" onClick={addRule}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
