"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Headphones,
  LineChart,
  Percent,
  Plus,
  Search,
  Share2,
  Wallet,
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type CustomerAccount, customerOwners } from "@/data/customerManagementData";
import {
  AUTOMATION_DEFAULT_ROLES,
  AUTOMATION_DEFAULT_STAGE_ID,
  BASE_CURRENCY,
  CURRENCY_OPTIONS,
  type CrmDeal,
  type DealActivity,
  type DealActivityKind,
  type DealCurrency,
  DEFAULT_PIPELINE_STAGES,
  dealCustomerAccounts,
  FX_TO_ETB,
  initialDeals,
  STAGE_AGING_WARNING_DAYS,
  type PipelineStage,
  computeBaseValue,
} from "@/data/dealsManagementData";
import { mockDealStore } from "@/data/mockStore";

type ProbabilityFilter = "all" | "high" | "medium" | "low";

const STAGE_COLOR_PRESETS: {
  label: string;
  columnClass: string;
  borderClass: string;
}[] = [
    { label: "Violet", columnClass: "bg-[#f5f3ff]", borderClass: "border-[#e9d5ff]" },
    { label: "Sky", columnClass: "bg-[#eff6ff]", borderClass: "border-[#bfdbfe]" },
    { label: "Mint", columnClass: "bg-[#ecfdf5]", borderClass: "border-[#a7f3d0]" },
    { label: "Amber", columnClass: "bg-[#fffbeb]", borderClass: "border-[#fde68a]" },
    { label: "Emerald", columnClass: "bg-[#ecfdf3]", borderClass: "border-[#86efac]" },
    { label: "Rose", columnClass: "bg-[#fef2f2]", borderClass: "border-[#fecaca]" },
  ];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function daysBetween(fromIso: string, toDate = new Date()) {
  const a = new Date(fromIso + "T12:00:00").getTime();
  const b = new Date(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate(),
    12,
  ).getTime();
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function monthPrefix(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
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
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3">
      <div className="rounded-md bg-[#eef2fd] p-2">
        <Icon size={16} className="text-[#4080f0]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#6b7280]">{title}</p>
        <p className="truncate text-base font-semibold text-[#1c1e21]">{value}</p>
      </div>
    </div>
  );
}

export function DealsManagementPage() {
  const [stages, setStages] = useState<PipelineStage[]>(() =>
    [...mockDealStore.stages].sort((a, b) => a.order - b.order),
  );
  const [deals, _setDeals] = useState<CrmDeal[]>(() => mockDealStore.deals);

  useEffect(() => {
    // Sync deals
    const unsubDeals = mockDealStore.subscribeDeals((newDeals) => {
      _setDeals([...newDeals]);
    });
    // Sync stages
    const unsubStages = mockDealStore.subscribeStages((newStages) => {
      setStages([...newStages].sort((a, b) => a.order - b.order));
    });

    return () => {
      unsubDeals();
      unsubStages();
    };
  }, []);

  const [search, setSearch] = useState("");
  const [filterStageId, setFilterStageId] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterProbability, setFilterProbability] =
    useState<ProbabilityFilter>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [quickCapture, setQuickCapture] = useState(false);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadSearch, setLeadSearch] = useState("");
  const [creationMode, setCreationMode] = useState<"manual" | "fromLead">("manual");

  const [createForm, setCreateForm] = useState({
    name: "",
    customerId: "",
    value: "",
    currency: "ETB" as DealCurrency,
    probability: "50",
    expectedClose: "2026-05-20",
    stageId: AUTOMATION_DEFAULT_STAGE_ID,
    primarySales: AUTOMATION_DEFAULT_ROLES.primarySales,
    presales: AUTOMATION_DEFAULT_ROLES.presales,
    channel: AUTOMATION_DEFAULT_ROLES.channel,
  });

  const [convertForm, setConvertForm] = useState({
    value: "",
    currency: "ETB" as DealCurrency,
    probability: "50",
    expectedClose: new Date().toISOString().split("T")[0]!,
    stageId: AUTOMATION_DEFAULT_STAGE_ID,
    primarySales: AUTOMATION_DEFAULT_ROLES.primarySales,
    presales: AUTOMATION_DEFAULT_ROLES.presales,
    channel: AUTOMATION_DEFAULT_ROLES.channel,
  });


  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );
  const accountById = useMemo(
    () => new Map(dealCustomerAccounts.map((a) => [a.id, a])),
    [],
  );

  const ownerOptions = useMemo(() => {
    const set = new Set<string>(customerOwners);
    for (const d of deals) {
      set.add(d.primarySales);
      set.add(d.presales);
      set.add(d.channel);
    }
    return Array.from(set).sort();
  }, [deals]);

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((deal) => {
      const customer = accountById.get(deal.customerId);
      const customerName = customer?.name ?? "";
      if (q && !deal.name.toLowerCase().includes(q) && !customerName.toLowerCase().includes(q)) {
        return false;
      }
      if (filterStageId !== "all" && deal.stageId !== filterStageId) return false;
      if (filterOwner !== "all" && deal.primarySales !== filterOwner) return false;
      const p = deal.probability;
      if (filterProbability === "high" && p < 70) return false;
      if (filterProbability === "medium" && (p < 40 || p > 69)) return false;
      if (filterProbability === "low" && p >= 40) return false;
      return true;
    });
  }, [deals, search, filterStageId, filterOwner, filterProbability, accountById]);

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages],
  );

  const leads = useMemo(() => {
    return dealCustomerAccounts.filter((acc) => acc.lifecycleStage === "Lead");
  }, []);

  const filteredLeads = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.industry.toLowerCase().includes(q),
    );
  }, [leads, leadSearch]);

  const forecast = useMemo(() => {
    let pipeline = 0;
    let weighted = 0;
    let closingMonth = 0;
    const prefix = monthPrefix();
    for (const deal of deals) {
      const st = stageById.get(deal.stageId);
      if (!st || st.category !== "open") continue;
      pipeline += deal.baseValue;
      weighted += deal.baseValue * (deal.probability / 100);
      if (deal.expectedClose.startsWith(prefix)) closingMonth += 1;
    }
    return {
      pipeline,
      weighted,
      closingMonth,
    };
  }, [deals, stageById]);

  const setDeals = (newDeals: CrmDeal[] | ((prev: CrmDeal[]) => CrmDeal[])) => {
    if (typeof newDeals === "function") {
      mockDealStore.deals = newDeals(mockDealStore.deals);
    } else {
      mockDealStore.deals = newDeals;
    }
    _setDeals(mockDealStore.deals);
  };

  const router = useRouter();

  const openDealDetail = (deal: CrmDeal) => {
    router.push(`/deals/${deal.id}`);
  };

  const moveDealToStage = (dealId: string, stageId: string) => {
    const today = new Date().toISOString().split("T")[0]!;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
            ...d,
            stageId,
            stageEnteredAt: d.stageId === stageId ? d.stageEnteredAt : today,
          }
          : d,
      ),
    );
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
            ...d,
            stageId,
            stageEnteredAt: d.stageId === stageId ? d.stageEnteredAt : today,
          }
          : d,
      ),
    );
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("application/deal-id", dealId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnStage = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("application/deal-id");
    if (!id) return;
    moveDealToStage(id, stageId);
  };

  const saveNewDeal = () => {
    if (!createForm.name.trim() || !createForm.customerId) return;
    const valueNum = Number(createForm.value.replace(/,/g, "")) || 0;
    if (!quickCapture && (!valueNum || !createForm.expectedClose)) return;

    const today = new Date().toISOString().split("T")[0]!;
    const currency = createForm.currency;
    const value = quickCapture ? Math.max(valueNum, 1) : valueNum;
    const probability = quickCapture ? 40 : Number(createForm.probability) || 0;
    const newDeal: CrmDeal = {
      id: `deal-${Date.now()}`,
      name: createForm.name.trim(),
      customerId: createForm.customerId,
      value,
      currency,
      baseValue: computeBaseValue(value, currency),
      probability: Math.min(100, Math.max(0, probability)),
      expectedClose: quickCapture ? today : createForm.expectedClose,
      stageId: quickCapture ? AUTOMATION_DEFAULT_STAGE_ID : createForm.stageId,
      stageEnteredAt: today,
      primarySales: quickCapture
        ? AUTOMATION_DEFAULT_ROLES.primarySales
        : createForm.primarySales,
      presales: quickCapture ? AUTOMATION_DEFAULT_ROLES.presales : createForm.presales,
      channel: quickCapture ? AUTOMATION_DEFAULT_ROLES.channel : createForm.channel,
      activities: [],
    };
    setDeals((prev) => [newDeal, ...prev]);
    setCreateOpen(false);
    setCreateForm({
      name: "",
      customerId: "",
      value: "",
      currency: "ETB",
      probability: "50",
      expectedClose: today,
      stageId: AUTOMATION_DEFAULT_STAGE_ID,
      primarySales: AUTOMATION_DEFAULT_ROLES.primarySales,
      presales: AUTOMATION_DEFAULT_ROLES.presales,
      channel: AUTOMATION_DEFAULT_ROLES.channel,
    });
  };

  const saveLeadAsDeal = () => {
    if (!selectedLeadId) return;
    const lead = dealCustomerAccounts.find((l) => l.id === selectedLeadId);
    if (!lead) return;

    const valueNum = Number(convertForm.value.replace(/,/g, "")) || 0;
    const currency = convertForm.currency;
    const today = new Date().toISOString().split("T")[0]!;

    const newDeal: CrmDeal = {
      id: `deal-from-lead-${Date.now()}`,
      name: `${lead.name} - Deal`,
      customerId: lead.id,
      value: valueNum,
      currency,
      baseValue: computeBaseValue(valueNum, currency),
      probability: Number(convertForm.probability) || 0,
      expectedClose: convertForm.expectedClose,
      stageId: convertForm.stageId,
      stageEnteredAt: today,
      primarySales: convertForm.primarySales,
      presales: convertForm.presales,
      channel: convertForm.channel,
      createdFromLead: true,
      leadConvertedAt: today,
      activities: [
        {
          id: `act-conv-${Date.now()}`,
          kind: "External",
          title: "Converted from lead",
          date: today,
        },
      ],
    };

    setDeals((prev) => [newDeal, ...prev]);
    setCreateOpen(false);
    setSelectedLeadId(null);
    setConvertForm({
      value: "",
      currency: "ETB",
      probability: "50",
      expectedClose: today,
      stageId: AUTOMATION_DEFAULT_STAGE_ID,
      primarySales: AUTOMATION_DEFAULT_ROLES.primarySales,
      presales: AUTOMATION_DEFAULT_ROLES.presales,
      channel: AUTOMATION_DEFAULT_ROLES.channel,
    });
  };



  const agingLabel = (deal: CrmDeal) => {
    const st = stageById.get(deal.stageId);
    if (!st || st.category !== "open") return null;
    const days = daysBetween(deal.stageEnteredAt);
    if (days < STAGE_AGING_WARNING_DAYS) return null;
    return `Stuck for ${days} days`;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">Deals</h1>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          Pipeline, forecast, and deal execution in one view
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-[#f5f6fa]">
        <div className="flex-shrink-0 space-y-4 p-3 sm:p-5">
          <div className="flex flex-wrap gap-3">
            <StatCard
              title="Total pipeline"
              value={formatMoney(forecast.pipeline, BASE_CURRENCY)}
              icon={Wallet}
            />
            <StatCard
              title="Weighted forecast"
              value={formatMoney(Math.round(forecast.weighted), BASE_CURRENCY)}
              icon={LineChart}
            />
            <StatCard
              title="Deals closing this month"
              value={String(forecast.closingMonth)}
              icon={Calendar}
            />
          </div>



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
                  placeholder="Search deals by name or customer"
                  className="h-9 border-[#e5e7eb] bg-white pl-9"
                />
              </div>
              <FormField label="Stage" className="w-[150px]">
                <Select value={filterStageId} onValueChange={setFilterStageId}>
                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-xs">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {sortedStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Owner" className="w-[150px]">
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-xs">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All owners</SelectItem>
                    {ownerOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Close probability" className="w-[160px]">
                <Select
                  value={filterProbability}
                  onValueChange={(v) => setFilterProbability(v as ProbabilityFilter)}
                >
                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High (70%+)</SelectItem>
                    <SelectItem value="medium">Medium (40–69%)</SelectItem>
                    <SelectItem value="low">Low (under 40%)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-9 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                onClick={() => {
                  setQuickCapture(false);
                  setCreationMode("manual");
                  setCreateOpen(true);
                }}
              >
                <Plus size={14} className="mr-1.5" />
                New Deal
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-3 pb-4 sm:px-5 no-scrollbar">
          <div className="flex h-full min-w-max gap-3 pb-1">
            {sortedStages.map((stage) => {
              const columnDeals = filteredDeals.filter((d) => d.stageId === stage.id);
              const totalBase = columnDeals.reduce((sum, d) => sum + d.baseValue, 0);
              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex h-full w-[280px] shrink-0 flex-col rounded-lg border",
                    stage.columnClass,
                    stage.borderClass,
                  )}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnStage(e, stage.id)}
                >
                  <div className="border-b border-black/5 px-3 py-2.5">
                    <p className="text-sm font-semibold text-[#1c1e21]">{stage.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6b7280]">
                      <span>{columnDeals.length} deals</span>
                      <span className="text-[#d1d5db]">·</span>
                      <span className="font-medium text-[#374151]">
                        {formatMoney(totalBase, BASE_CURRENCY)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto p-2 no-scrollbar">
                    {columnDeals.map((deal) => {
                      const customer = accountById.get(deal.customerId);
                      const stuck = agingLabel(deal);
                      return (
                        <Card
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          className="cursor-pointer border-[#e5e7eb] bg-white shadow-sm hover:border-[#4080f0] transition-colors"
                          onClick={() => openDealDetail(deal)}
                        >
                          <CardContent className="space-y-2 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug text-[#1c1e21]">
                                {deal.name}
                              </p>
                              {stuck && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 border-amber-200 bg-amber-50 text-[10px] text-amber-900"
                                >
                                  <AlertTriangle className="mr-0.5 size-3" />
                                  {stuck}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-[#6b7280]">{customer?.name ?? "—"}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-[#1c1e21]">
                                {formatMoney(deal.value, deal.currency)}
                              </span>
                              {deal.currency !== BASE_CURRENCY && (
                                <span className="text-[#9ca3af]">
                                  ({formatMoney(deal.baseValue, BASE_CURRENCY)})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                              <span className="inline-flex items-center gap-0.5">
                                <Percent size={12} />
                                {deal.probability}%
                              </span>
                              <span className="text-[#d1d5db]">·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Calendar size={12} />
                                {deal.expectedClose}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 border-t border-[#f3f4f6] pt-2">
                              <span title="Sales" className="inline-flex rounded-md bg-[#eef2fd] p-1 text-[#4080f0]">
                                <Briefcase size={12} />
                              </span>
                              <Avatar className="size-6 border border-white">
                                <AvatarFallback className="text-[9px] bg-[#eef2fd] text-[#245fcb]">
                                  {initials(deal.primarySales)}
                                </AvatarFallback>
                              </Avatar>
                              <span title="Pre-sales" className="inline-flex rounded-md bg-[#f0fdf4] p-1 text-[#15803d]">
                                <Headphones size={12} />
                              </span>
                              <Avatar className="size-6 border border-white">
                                <AvatarFallback className="text-[9px] bg-[#f0fdf4] text-[#166534]">
                                  {initials(deal.presales)}
                                </AvatarFallback>
                              </Avatar>
                              <span title="Channel" className="inline-flex rounded-md bg-[#fff7ed] p-1 text-[#c2410c]">
                                <Share2 size={12} />
                              </span>
                              <Avatar className="size-6 border border-white">
                                <AvatarFallback className="text-[9px] bg-[#fff7ed] text-[#9a3412]">
                                  {initials(deal.channel)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {creationMode === "fromLead" ? "Add deal from leads" : "Create new deal"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-lg bg-[#f3f4f6] p-1 mb-2">
            <Button
              variant={creationMode === "manual" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "flex-1 h-8 text-xs font-medium",
                creationMode === "manual" && "bg-white shadow-sm"
              )}
              onClick={() => setCreationMode("manual")}
            >
              Manual entry
            </Button>
            <Button
              variant={creationMode === "fromLead" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "flex-1 h-8 text-xs font-medium",
                creationMode === "fromLead" && "bg-white shadow-sm"
              )}
              onClick={() => setCreationMode("fromLead")}
            >

              From Leads
            </Button>
          </div>

          {creationMode === "manual" ? (
            <>
              <div className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#fafbff] px-3 py-2 mb-4">
                <div>
                  <p className="text-sm font-medium text-[#1c1e21]">Quick capture</p>
                  <p className="text-xs text-[#6b7280]">Minimal fields for direct sales</p>
                </div>
                <Switch checked={quickCapture} onCheckedChange={setQuickCapture} />
              </div>
              <div className="grid gap-4 py-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="Deal name *">
                    <Input
                      value={createForm.name}
                      onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                      className="h-9 border-[#e5e7eb]"
                      placeholder="e.g. Acme Corp Q3"
                    />
                  </FormField>
                  <FormField label="Customer account *">
                    <Select
                      value={createForm.customerId}
                      onValueChange={(v) => setCreateForm((p) => ({ ...p, customerId: v }))}
                    >
                      <SelectTrigger className="h-9 border-[#e5e7eb]">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealCustomerAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Deal value *">
                      <Input
                        value={createForm.value}
                        onChange={(e) => setCreateForm((p) => ({ ...p, value: e.target.value }))}
                        className="h-9 border-[#e5e7eb]"
                        placeholder="0"
                        inputMode="decimal"
                      />
                    </FormField>
                    <FormField label="Currency">
                      <Select
                        value={createForm.currency}
                        onValueChange={(v) =>
                          setCreateForm((p) => ({ ...p, currency: v as DealCurrency }))
                        }
                      >
                        <SelectTrigger className="h-9 border-[#e5e7eb]">
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
                    </FormField>
                  </div>

                  {!quickCapture && (
                    <FormField label="Pipeline stage">
                      <Select
                        value={createForm.stageId}
                        onValueChange={(v) => setCreateForm((p) => ({ ...p, stageId: v }))}
                      >
                        <SelectTrigger className="h-9 border-[#e5e7eb]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedStages.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}
                </div>

                {!quickCapture && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Close probability (%)">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={createForm.probability}
                          onChange={(e) =>
                            setCreateForm((p) => ({ ...p, probability: e.target.value }))
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </FormField>
                      <FormField label="Expected close date">
                        <Input
                          type="date"
                          value={createForm.expectedClose}
                          onChange={(e) =>
                            setCreateForm((p) => ({ ...p, expectedClose: e.target.value }))
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </FormField>
                    </div>

                    <Separator className="my-2" />
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-[#6b7280]">Assign roles</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField label="Primary sales">
                          <Select
                            value={createForm.primarySales}
                            onValueChange={(v) =>
                              setCreateForm((p) => ({ ...p, primarySales: v }))
                            }
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ownerOptions.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Pre-sales">
                          <Select
                            value={createForm.presales}
                            onValueChange={(v) => setCreateForm((p) => ({ ...p, presales: v }))}
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ownerOptions.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Channel">
                          <Select
                            value={createForm.channel}
                            onValueChange={(v) => setCreateForm((p) => ({ ...p, channel: v }))}
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ownerOptions.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="grid gap-4 py-2">
              {!selectedLeadId ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    />
                    <Input
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      placeholder="Search leads by name or industry..."
                      className="h-9 pl-9 border-[#e5e7eb]"
                    />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto rounded-md border border-[#e5e7eb]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#f9fafb] text-xs uppercase text-[#6b7280]">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Lead Name</th>
                          <th className="px-4 py-2 text-left font-medium">Industry</th>
                          <th className="px-4 py-2 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] bg-white">
                        {filteredLeads.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-[#9ca3af]">
                              No leads found.
                            </td>
                          </tr>
                        ) : (
                          filteredLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-[#f3f4f6]">
                              <td className="px-4 py-3 font-medium text-[#1c1e21]">
                                {lead.name}
                              </td>
                              <td className="px-4 py-3 text-[#6b7280]">{lead.industry}</td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-[#e5e7eb]"
                                  onClick={() => setSelectedLeadId(lead.id)}
                                >
                                  Select
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg bg-[#f0f7ff] p-3 text-sm text-[#1e40af]">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-[#dbeafe] p-1.5">
                        <Briefcase size={16} />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {dealCustomerAccounts.find((l) => l.id === selectedLeadId)?.name}
                        </p>
                        <p className="text-xs opacity-80">Converting to deal</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[#1e40af] hover:bg-[#dbeafe]"
                      onClick={() => setSelectedLeadId(null)}
                    >
                      Change lead
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Deal value *">
                          <Input
                            value={convertForm.value}
                            onChange={(e) =>
                              setConvertForm((p) => ({ ...p, value: e.target.value }))
                            }
                            className="h-9 border-[#e5e7eb]"
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </FormField>
                        <FormField label="Currency">
                          <Select
                            value={convertForm.currency}
                            onValueChange={(v) =>
                              setConvertForm((p) => ({ ...p, currency: v as DealCurrency }))
                            }
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb]">
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
                        </FormField>
                      </div>
                      <FormField label="Pipeline stage">
                        <Select
                          value={convertForm.stageId}
                          onValueChange={(v) =>
                            setConvertForm((p) => ({ ...p, stageId: v }))
                          }
                        >
                          <SelectTrigger className="h-9 border-[#e5e7eb]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedStages.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Close probability (%)">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={convertForm.probability}
                          onChange={(e) =>
                            setConvertForm((p) => ({ ...p, probability: e.target.value }))
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </FormField>
                      <FormField label="Expected close date">
                        <Input
                          type="date"
                          value={convertForm.expectedClose}
                          onChange={(e) =>
                            setConvertForm((p) => ({ ...p, expectedClose: e.target.value }))
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </FormField>
                    </div>

                    <Separator className="my-2" />
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-[#6b7280]">Assign roles</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField label="Primary sales">
                          <Select
                            value={convertForm.primarySales}
                            onValueChange={(v) =>
                              setConvertForm((p) => ({ ...p, primarySales: v }))
                            }
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ownerOptions.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Pre-sales">
                          <Select
                            value={convertForm.presales}
                            onValueChange={(v) =>
                              setConvertForm((p) => ({ ...p, presales: v }))
                            }
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ownerOptions.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Channel">
                          <Select
                            value={convertForm.channel}
                            onValueChange={(v) => setConvertForm((p) => ({ ...p, channel: v }))}
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ownerOptions.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            {creationMode === "manual" ? (
              <Button
                size="sm"
                className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                onClick={saveNewDeal}
              >
                Create deal
              </Button>
            ) : (
              selectedLeadId && (
                <Button
                  size="sm"
                  className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                  onClick={saveLeadAsDeal}
                >
                  Create deal from lead
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>



    </div>
  );
}

function RoleRow({
  label,
  name,
  icon: Icon,
  owners,
  onChange,
}: {
  label: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  owners: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#e5e7eb] bg-[#fafbff] p-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 sm:w-40">
        <span className="inline-flex rounded-md bg-white p-1.5 text-[#4080f0] ring-1 ring-[#e5e7eb]">
          <Icon size={14} />
        </span>
        <span className="text-xs font-medium text-[#374151]">{label}</span>
      </div>
      <Select value={name} onValueChange={onChange}>
        <SelectTrigger className="h-9 flex-1 border-[#e5e7eb] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {owners.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TimelineView({
  deal,
  stageName,
}: {
  deal: CrmDeal;
  stageName?: string;
}) {
  const items = useMemo(() => {
    const rows: { id: string; date: string; title: string; kind: string }[] = [];
    if (deal.createdFromLead && deal.leadConvertedAt) {
      rows.push({
        id: "tl-lead",
        date: deal.leadConvertedAt,
        title: "Lead converted to deal",
        kind: "Conversion",
      });
    }
    rows.push({
      id: "tl-stage",
      date: deal.stageEnteredAt,
      title: `Entered stage: ${stageName ?? "—"}`,
      kind: "Stage",
    });
    for (const a of deal.activities) {
      rows.push({
        id: a.id,
        date: a.date,
        title: a.title,
        kind: a.kind,
      });
    }
    return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [deal, stageName]);

  return (
    <div className="relative pl-4">
      <div className="absolute bottom-1 left-[7px] top-1 w-px bg-[#e5e7eb]" />
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span className="absolute -left-[3px] top-1.5 size-2.5 rounded-full border-2 border-white bg-[#4080f0] shadow" />
            <p className="text-xs text-[#9ca3af]">{item.date}</p>
            <p className="text-sm font-medium text-[#1c1e21]">{item.title}</p>
            <Badge variant="outline" className="mt-1 text-[10px]">
              {item.kind}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
