"use client";

import { useMemo, useState } from "react";
import { Info, Lightbulb, Plus } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    criteria: "Visits pricing page > 3 times",
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
    criteria: "Last engagement date > 30 days ago",
    points: -20,
    enabled: false,
  },
];

type RuleDraft = {
  name: string;
  criteria: string;
  points: string;
};

const EMPTY_DRAFT: RuleDraft = { name: "", criteria: "", points: "10" };

function ScoreSparkline() {
  const points = "M4 32 L18 28 L32 18 L46 22 L60 10 L74 14 L88 6 L102 12 L116 4";
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-lg border border-[#e5e7eb] bg-gradient-to-b from-[#f8fafc] to-[#eef2fd]">
      <svg
        className="absolute inset-0 h-full w-full text-[#4080f0]"
        viewBox="0 0 120 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="116" cy="4" r="2.5" fill="currentColor" />
      </svg>
      <p className="absolute bottom-2 left-3 text-[10px] font-medium uppercase tracking-wide text-[#9ca3af]">
        Avg. score trend (30d)
      </p>
    </div>
  );
}

export function LeadScoringSettingsSection() {
  const [rules, setRules] = useState<ScoringRule[]>(INITIAL_RULES);
  const [mqlThreshold, setMqlThreshold] = useState(50);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [draft, setDraft] = useState<RuleDraft>(EMPTY_DRAFT);

  const enabledCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules]);

  const toggleRule = (id: string, enabled: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
  };

  const saveChanges = () => {
    setSaveFeedback("Scoring configuration saved.");
    window.setTimeout(() => setSaveFeedback(null), 3200);
  };

  const addRule = () => {
    const pts = Number.parseInt(draft.points, 10);
    const points = Number.isFinite(pts) ? Math.max(-100, Math.min(100, pts)) : 0;
    const name = draft.name.trim() || "New rule";
    const criteria = draft.criteria.trim() || "No criteria defined yet.";
    setRules((prev) => [
      ...prev,
      {
        id: `rs-${crypto.randomUUID()}`,
        name,
        criteria,
        points,
        enabled: true,
      },
    ]);
    setDraft(EMPTY_DRAFT);
    setNewRuleOpen(false);
  };

  const gaugeBefore = Math.max(0, Math.min(100, mqlThreshold)) * 0.6;
  const gaugeHighlight = Math.max(0, Math.min(100, mqlThreshold)) * 0.2;
  const gaugeAfter = Math.max(0, 100 - gaugeBefore - gaugeHighlight);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-4">
      <div className="flex flex-col gap-4 border-b border-[#e5e7eb] bg-white px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1c1e21]">Lead Scoring Configuration</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#6b7280]">
            Define automated rules to evaluate and prioritize leads based on firmographic data,
            behavioral patterns, and engagement levels to optimize your sales funnel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-[#e5e7eb]" onClick={saveChanges}>
            Save Changes
          </Button>
          <Button
            className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setNewRuleOpen(true);
            }}
          >
            <Plus size={16} className="mr-1.5" />
            New Rule
          </Button>
        </div>
      </div>

      {saveFeedback && (
        <p className="rounded-lg border border-[#bfdbfe] bg-[#eef2fd] px-4 py-2 text-sm text-[#245fcb]">
          {saveFeedback}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
              <h3 className="text-base font-semibold text-[#1c1e21]">Active Scoring Rules</h3>
              <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-medium text-[#6b7280]">
                {rules.length} total rules · {enabledCount} enabled
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f9fafb]">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                      Rule name
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                      Criteria
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                      Value
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow
                      key={rule.id}
                      className="border-[#e5e7eb] transition-colors hover:bg-[#fafbff]"
                    >
                      <TableCell className="font-semibold text-[#1c1e21]">{rule.name}</TableCell>
                      <TableCell className="max-w-[280px] text-sm text-[#6b7280]">
                        {rule.criteria}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm font-bold",
                            rule.points >= 0 ? "text-[#004ac6]" : "text-[#ba1a1a]",
                          )}
                        >
                          {rule.points >= 0 ? "+" : ""}
                          {rule.points} pts
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(v) => toggleRule(rule.id, Boolean(v))}
                            className="h-6 w-11 data-[size=default]:h-6 data-[size=default]:w-11 [&>span]:size-5"
                            aria-label={`${rule.enabled ? "Disable" : "Enable"} ${rule.name}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1c1e21]">MQL threshold</h3>
              <button
                type="button"
                className="rounded-md p-1 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                title="Leads at or above this score are treated as marketing qualified."
              >
                <Info size={18} aria-hidden />
              </button>
            </div>
            <div className="mb-4">
              <div className="mb-2 flex items-end justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                  Current setting
                </span>
                <span className="text-xl font-semibold text-[#004ac6]">{mqlThreshold} pts</span>
              </div>
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#e6e8ea]">
                <div className="h-full bg-[#bec6e0]" style={{ width: `${gaugeBefore}%` }} />
                <div className="relative h-full bg-[#2563eb]" style={{ width: `${gaugeHighlight}%` }}>
                  <span className="absolute right-0 top-0 h-full w-0.5 bg-white" />
                </div>
                <div className="h-full bg-[#e6e8ea]" style={{ width: `${gaugeAfter}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-[#6b7280]">
                <span>0</span>
                <span className="font-semibold text-[#003ea8]">{mqlThreshold} (MQL)</span>
                <span>100+</span>
              </div>
            </div>
            <p className="mb-4 text-sm text-[#434655]">
              Leads reaching this threshold are automatically flagged as &apos;Marketing Qualified&apos; and
              assigned to SDRs.
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={mqlThreshold}
              onChange={(e) => setMqlThreshold(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e6e8ea] accent-[#2563eb]"
            />
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-[#1c1e21]">Lead distribution</h3>
            <div className="space-y-4">
              {[
                { label: "Hot (MQL)", pct: 18, dot: "bg-[#004ac6]", bar: "bg-[#004ac6]" },
                { label: "Warm", pct: 42, dot: "bg-[#dae2fd]", bar: "bg-[#565e74]" },
                { label: "Cold", pct: 40, dot: "bg-[#c3c6d7]", bar: "bg-[#c3c6d7]" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[#1c1e21]">
                      <span className={cn("size-2 shrink-0 rounded-full", row.dot)} />
                      {row.label}
                    </span>
                    <span className="text-sm font-bold text-[#1c1e21]">{row.pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6e8ea]">
                    <div className={cn("h-full rounded-full", row.bar)} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-[#e5e7eb] pt-5">
              <ScoreSparkline />
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-[#d3e4fe] p-5 text-[#0b1c30] shadow-sm">
            <Lightbulb className="size-8 shrink-0 text-[#46566c]" aria-hidden />
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider">Optimizer tip</h4>
              <p className="text-sm leading-relaxed opacity-90">
                Reducing the threshold to 45 could increase MQL volume by 12% based on last month&apos;s
                data.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={newRuleOpen} onOpenChange={setNewRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New scoring rule</DialogTitle>
            <DialogDescription>
              Add a rule name, human-readable criteria, and point change when the rule matches.
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
              Add rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
