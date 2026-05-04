"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Wallet,
  BarChart2,
  CalendarDays,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  initialTargets,
  type SalesTarget,
  type TargetStatus,
} from "@/data/salesTargetsData";
import { initialDeals, type CrmDeal } from "@/data/dealsManagementData";
import { Checkbox } from "@/components/ui/checkbox";
import { mockDealStore } from "@/data/mockStore";
import { useEffect } from "react";

/* ─── helpers ─── */

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMoney(amount: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `ETB ${amount.toLocaleString()}`;
  }
}

function progressColor(pct: number) {
  if (pct >= 80) return "bg-[#22c55e]";
  if (pct >= 50) return "bg-[#4080f0]";
  return "bg-[#9ca3af]";
}

function progressTextColor(pct: number) {
  if (pct >= 80) return "text-[#16a34a]";
  if (pct >= 50) return "text-[#4080f0]";
  return "text-[#6b7280]";
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-[#6b7280]">{label}</Label>
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3">
      <div className={cn("rounded-md p-2", accent ?? "bg-[#eef2fd]")}>
        <Icon size={16} className={accent ? "text-white" : "text-[#4080f0]"} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#6b7280]">{title}</p>
        <p className="truncate text-base font-semibold text-[#1c1e21]">{value}</p>
      </div>
    </div>
  );
}

/* ─── owners ─── */

const ownersPool = [
  "Sara Tesfaye",
  "Biruk Mekonnen",
  "Daniel Bekele",
  "Nahom Esrael",
  "Hana Worku",
];

/* ─── component ─── */

export function SalesTargetsPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<SalesTarget[]>(() => [...mockDealStore.targets]);
  const [deals, setDeals] = useState<CrmDeal[]>(() => [...mockDealStore.deals]);

  useEffect(() => {
    const unsubTargets = mockDealStore.subscribeTargets((newTargets) => {
      setTargets([...newTargets]);
    });
    const unsubDeals = mockDealStore.subscribeDeals((newDeals) => {
      setDeals([...newDeals]);
    });
    return () => {
      unsubTargets();
      unsubDeals();
    };
  }, []);
  const [search, setSearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SalesTarget | null>(null);

  const [form, setForm] = useState({
    name: "",
    metric: "Revenue" as const,
    targetValue: "",
    assignedTo: ownersPool[0]!,
    startDate: new Date().toISOString().split("T")[0]!,
    endDate: "",
    status: true,
    selectedDealIds: [] as string[],
  });

  const resetForm = () => {
    setForm({
      name: "",
      metric: "Revenue",
      targetValue: "",
      assignedTo: ownersPool[0]!,
      startDate: new Date().toISOString().split("T")[0]!,
      endDate: "",
      status: true,
      selectedDealIds: [],
    });
    setDealSearch("");
    setEditTarget(null);
  };

  /* Summaries */
  const summary = useMemo(() => {
    const active = targets.filter((t) => t.status === "active");
    const totalTarget = active.reduce((s, t) => s + t.targetValue, 0);
    const totalAchieved = active.reduce((s, t) => s + t.achievedValue, 0);
    const overallPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
    const remaining = Math.max(0, totalTarget - totalAchieved);
    return { totalTarget, totalAchieved, overallPct, remaining };
  }, [targets]);

  /* Filters */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return targets.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.assignedTo.toLowerCase().includes(q)) return false;
      if (filterOwner !== "all" && t.assignedTo !== filterOwner) return false;
      if (filterPeriod === "active" && t.status !== "active") return false;
      if (filterPeriod === "inactive" && t.status !== "inactive") return false;
      return true;
    });
  }, [targets, search, filterOwner, filterPeriod]);

  /* CRUD */
  const handleSave = () => {
    const valueNum = Number(form.targetValue.replace(/,/g, "")) || 0;
    if (!form.name.trim() || !valueNum || !form.endDate) return;

    const selectedDeals = deals.filter(d => form.selectedDealIds.includes(d.id));
    const calculatedAchieved = selectedDeals.reduce((sum, d) => sum + d.baseValue, 0);

    if (editTarget) {
      mockDealStore.targets = targets.map((t) =>
        t.id === editTarget.id
          ? {
              ...t,
              name: form.name.trim(),
              targetValue: valueNum,
              achievedValue: calculatedAchieved,
              assignedTo: form.assignedTo,
              startDate: form.startDate,
              endDate: form.endDate,
              status: form.status ? "active" : "inactive",
              contributingDealIds: form.selectedDealIds,
            }
          : t,
      );
    } else {
      const newTarget: SalesTarget = {
        id: `target-${Date.now()}`,
        name: form.name.trim(),
        metric: "Revenue",
        targetValue: valueNum,
        achievedValue: calculatedAchieved,
        assignedTo: form.assignedTo,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status ? "active" : "inactive",
        contributingDealIds: form.selectedDealIds,
      };
      mockDealStore.targets = [newTarget, ...targets];
    }

    setCreateOpen(false);
    resetForm();
  };

  const openEdit = (t: SalesTarget) => {
    setEditTarget(t);
    setForm({
      name: t.name,
      metric: "Revenue",
      targetValue: String(t.targetValue),
      assignedTo: t.assignedTo,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status === "active",
      selectedDealIds: t.contributingDealIds,
    });
    setCreateOpen(true);
  };

  /* Empty State */
  if (targets.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
          <h1 className="font-semibold text-[#1c1e21]">Sales Targets</h1>
          <p className="mt-0.5 text-xs text-[#6b7280]">
            Track and manage sales performance against goals
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center bg-[#f5f6fa]">
          <div className="text-center max-w-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2fd] mb-5">
              <Target size={28} className="text-[#4080f0]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1c1e21] mb-2">No targets yet</h2>
            <p className="text-sm text-[#6b7280] mb-6">
              Create your first sales target to start tracking performance against your goals.
            </p>
            <Button
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <Plus size={16} className="mr-1.5" />
              Create Target
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">Sales Targets</h1>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          Track and manage sales performance against goals
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-[#f5f6fa]">
        <div className="flex-shrink-0 space-y-4 p-3 sm:p-5">
          {/* Summary Cards */}
          <div className="flex flex-wrap gap-3">
            <StatCard
              title="Total Target"
              value={formatMoney(summary.totalTarget)}
              icon={Target}
            />
            <StatCard
              title="Total Achieved"
              value={formatMoney(summary.totalAchieved)}
              icon={TrendingUp}
            />
            <StatCard
              title="Overall Progress"
              value={`${summary.overallPct}%`}
              icon={BarChart2}
            />
            <StatCard
              title="Remaining"
              value={formatMoney(summary.remaining)}
              icon={Wallet}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 sm:gap-3">
              <div className="relative w-full min-w-[200px] sm:max-w-[320px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search targets..."
                  className="h-9 border-[#e5e7eb] bg-white pl-9"
                />
              </div>
              <FormField label="Owner" className="w-[150px]">
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-xs">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All owners</SelectItem>
                    {ownersPool.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status" className="w-[140px]">
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <Button
              size="sm"
              className="h-9 bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <Plus size={14} className="mr-1.5" />
              New Target
            </Button>
          </div>
        </div>

        {/* Target Cards */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 pt-0 sm:pt-0 no-scrollbar">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((target) => {
              const pct =
                target.targetValue > 0
                  ? Math.min(100, Math.round((target.achievedValue / target.targetValue) * 100))
                  : 0;
              const remaining = Math.max(0, target.targetValue - target.achievedValue);

              return (
                <Card
                  key={target.id}
                  className="border-[#e5e7eb] shadow-none hover:border-[#4080f0] transition-colors cursor-pointer group"
                  onClick={() => router.push(`/targets/${target.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-semibold text-[#1c1e21] truncate group-hover:text-[#4080f0] transition-colors">
                          {target.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[8px] bg-[#eef2fd] text-[#4080f0]">
                              {initials(target.assignedTo)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-[#6b7280] truncate">
                            {target.assignedTo}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] shrink-0",
                          target.status === "active"
                            ? "bg-[#ecfdf5] text-[#16a34a] border-[#a7f3d0]"
                            : "bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]",
                        )}
                      >
                        {target.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-lg font-bold", progressTextColor(pct))}>
                          {pct}%
                        </span>
                        <span className="text-[10px] text-[#9ca3af]">
                          {target.startDate} → {target.endDate}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#f0f0f5]">
                        <div
                          className={cn("h-full rounded-full transition-all", progressColor(pct))}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Values */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-md bg-[#f9fafb] px-2.5 py-2 text-center">
                        <p className="text-[10px] text-[#9ca3af]">Target</p>
                        <p className="text-xs font-semibold text-[#1c1e21] mt-0.5">
                          {formatMoney(target.targetValue)}
                        </p>
                      </div>
                      <div className="rounded-md bg-[#f9fafb] px-2.5 py-2 text-center">
                        <p className="text-[10px] text-[#9ca3af]">Achieved</p>
                        <p className="text-xs font-semibold text-[#1c1e21] mt-0.5">
                          {formatMoney(target.achievedValue)}
                        </p>
                      </div>
                      <div className="rounded-md bg-[#f9fafb] px-2.5 py-2 text-center">
                        <p className="text-[10px] text-[#9ca3af]">Remaining</p>
                        <p className="text-xs font-semibold text-[#1c1e21] mt-0.5">
                          {formatMoney(remaining)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search size={32} className="text-[#d1d5db] mb-3" />
              <p className="text-sm font-medium text-[#6b7280]">No targets match your filters</p>
              <p className="text-xs text-[#9ca3af] mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-3xl border-[#e5e7eb] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editTarget ? "Edit Target" : "Create Target"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left Column: Link Deals */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-[#1c1e21]">Link Deals</Label>
                    <span className="text-[10px] text-[#9ca3af]">
                      {form.selectedDealIds.length} deals selected
                    </span>
                  </div>
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    />
                    <Input
                      value={dealSearch}
                      onChange={(e) => setDealSearch(e.target.value)}
                      placeholder="Search deals..."
                      className="h-8 pl-8 text-xs border-[#e5e7eb] bg-[#fafbff]"
                    />
                  </div>
                </div>
                <div className="h-[280px] overflow-y-auto border border-[#e5e7eb] rounded-md bg-[#fafbff] p-2 space-y-2 no-scrollbar">
                  {deals
                    .filter(d => 
                      d.name.toLowerCase().includes(dealSearch.toLowerCase()) || 
                      d.customerId.toLowerCase().includes(dealSearch.toLowerCase())
                    )
                    .map((deal) => (
                      <div key={deal.id} className="flex items-center space-x-3 rounded-md border border-[#e5e7eb] bg-white p-2 hover:bg-[#f3f6ff] transition-colors">
                        <Checkbox
                          id={`deal-${deal.id}`}
                          checked={form.selectedDealIds.includes(deal.id)}
                          onCheckedChange={(checked) => {
                            setForm(f => {
                              const ids = checked 
                                ? [...f.selectedDealIds, deal.id]
                                : f.selectedDealIds.filter(id => id !== deal.id);
                              return { ...f, selectedDealIds: ids };
                            });
                          }}
                        />
                        <label
                          htmlFor={`deal-${deal.id}`}
                          className="flex-1 text-xs cursor-pointer select-none"
                        >
                          <div className="font-medium text-[#1c1e21] truncate max-w-[200px]">{deal.name}</div>
                          <div className="text-[10px] text-[#6b7280]">{formatMoney(deal.baseValue)}</div>
                        </label>
                      </div>
                    ))}
                  {deals.filter(d => d.name.toLowerCase().includes(dealSearch.toLowerCase())).length === 0 && (
                    <div className="py-8 text-center text-[10px] text-[#9ca3af]">No deals found</div>
                  )}
                </div>
              </div>

              {/* Right Column: Form Fields */}
              <div className="grid gap-4">
                <FormField label="Target Name *">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                    placeholder="e.g. May Revenue Target"
                  />
                </FormField>
                <FormField label="Metric Type">
                  <Select value={form.metric} disabled>
                    <SelectTrigger className="h-9 border-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Revenue">Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Target Value *">
                  <Input
                    value={form.targetValue}
                    onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                    placeholder="e.g. 15000000"
                    type="text"
                    inputMode="numeric"
                  />
                </FormField>
                <FormField label="Assign To">
                  <Select
                    value={form.assignedTo}
                    onValueChange={(v) => setForm((f) => ({ ...f, assignedTo: v }))}
                  >
                    <SelectTrigger className="h-9 border-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ownersPool.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Start Date *">
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="h-9 border-[#e5e7eb]"
                    />
                  </FormField>
                  <FormField label="End Date *">
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="h-9 border-[#e5e7eb]"
                    />
                  </FormField>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#e5e7eb] px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#1c1e21]">Active</p>
                    <p className="text-xs text-[#6b7280]">Enable tracking for this target</p>
                  </div>
                  <Switch
                    checked={form.status}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] bg-[#fafbff]">
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={handleSave}
              disabled={
                !form.name.trim() ||
                !form.targetValue ||
                !form.endDate
              }
            >
              {editTarget ? "Save Changes" : "Create Target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
