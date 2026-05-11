"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Headphones,
  Percent,
  Plus,
  Search,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { customerOwners } from "@/data/customerManagementData";
import {
  AUTOMATION_DEFAULT_LEAD_ROLES,
  AUTOMATION_DEFAULT_LEAD_STAGE_ID,
  BASE_CURRENCY,
  CURRENCY_OPTIONS,
  type CrmLead,
  type DealCurrency,
  STAGE_AGING_WARNING_DAYS,
  computeBaseValue,
  leadCustomerAccounts,
  type PipelineStage,
} from "@/data/leadsManagementData";
import { mockLeadStore } from "@/data/mockStore";

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

export function LeadsManagementPage() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<{
    manual?: string;
    fromAccount?: string;
  }>({});

  const [stages, setStages] = useState<PipelineStage[]>(() =>
    [...mockLeadStore.stages].sort((a, b) => a.order - b.order),
  );
  const [leads, _setLeads] = useState<CrmLead[]>(() => mockLeadStore.leads);

  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsPageLoading(false), 500);

    const unsubLeads = mockLeadStore.subscribeLeads((newLeads) => {
      _setLeads([...newLeads]);
    });
    const unsubStages = mockLeadStore.subscribeStages((newStages) => {
      setStages([...newStages].sort((a, b) => a.order - b.order));
    });

    return () => {
      clearTimeout(loadingTimer);
      unsubLeads();
      unsubStages();
    };
  }, []);

  useEffect(() => {
    if (!saveFeedback) return;
    const timer = setTimeout(() => setSaveFeedback(null), 2800);
    return () => clearTimeout(timer);
  }, [saveFeedback]);

  const [search, setSearch] = useState("");
  const [filterStageId, setFilterStageId] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterProbability, setFilterProbability] =
    useState<ProbabilityFilter>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [quickCapture, setQuickCapture] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountPickSearch, setAccountPickSearch] = useState("");
  const [creationMode, setCreationMode] = useState<"manual" | "fromAccount">("manual");

  const [createForm, setCreateForm] = useState({
    name: "",
    customerId: "",
    value: "",
    currency: "ETB" as DealCurrency,
    probability: "50",
    expectedClose: "2026-05-20",
    stageId: AUTOMATION_DEFAULT_LEAD_STAGE_ID,
    primarySales: AUTOMATION_DEFAULT_LEAD_ROLES.primarySales,
    presales: AUTOMATION_DEFAULT_LEAD_ROLES.presales,
    channel: AUTOMATION_DEFAULT_LEAD_ROLES.channel,
  });

  const [fromAccountForm, setFromAccountForm] = useState({
    value: "",
    currency: "ETB" as DealCurrency,
    probability: "50",
    expectedClose: new Date().toISOString().split("T")[0]!,
    stageId: AUTOMATION_DEFAULT_LEAD_STAGE_ID,
    primarySales: AUTOMATION_DEFAULT_LEAD_ROLES.primarySales,
    presales: AUTOMATION_DEFAULT_LEAD_ROLES.presales,
    channel: AUTOMATION_DEFAULT_LEAD_ROLES.channel,
  });


  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );
  const accountById = useMemo(
    () => new Map(leadCustomerAccounts.map((a) => [a.id, a])),
    [],
  );

  const ownerOptions = useMemo(() => {
    const set = new Set<string>(customerOwners);
    for (const lead of leads) {
      set.add(lead.primarySales);
      set.add(lead.presales);
      set.add(lead.channel);
    }
    return Array.from(set).sort();
  }, [leads]);

  const filteredPipelineLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const customer = accountById.get(lead.customerId);
      const customerName = customer?.name ?? "";
      if (q && !lead.name.toLowerCase().includes(q) && !customerName.toLowerCase().includes(q)) {
        return false;
      }
      if (filterStageId !== "all" && lead.stageId !== filterStageId) return false;
      if (filterOwner !== "all" && lead.primarySales !== filterOwner) return false;
      const p = lead.probability;
      if (filterProbability === "high" && p < 70) return false;
      if (filterProbability === "medium" && (p < 40 || p > 69)) return false;
      if (filterProbability === "low" && p >= 40) return false;
      return true;
    });
  }, [leads, search, filterStageId, filterOwner, filterProbability, accountById]);

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages],
  );

  const leadLifecycleAccounts = useMemo(() => {
    return leadCustomerAccounts.filter((acc) => acc.lifecycleStage === "Lead");
  }, []);

  const filteredAccountsForPick = useMemo(() => {
    const q = accountPickSearch.trim().toLowerCase();
    if (!q) return leadLifecycleAccounts;
    return leadLifecycleAccounts.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.industry.toLowerCase().includes(q),
    );
  }, [leadLifecycleAccounts, accountPickSearch]);

  const setLeads = (next: CrmLead[] | ((prev: CrmLead[]) => CrmLead[])) => {
    _setLeads((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      mockLeadStore.leads = resolved;
      return resolved;
    });
  };

  const router = useRouter();

  const openLeadDetail = (lead: CrmLead) => {
    router.push(`/leads/${lead.id}`);
  };

  const moveLeadToStage = (leadId: string, stageId: string) => {
    const today = new Date().toISOString().split("T")[0]!;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stageId,
              stageEnteredAt: l.stageId === stageId ? l.stageEnteredAt : today,
            }
          : l,
      ),
    );
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("application/lead-id", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnStage = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("application/lead-id");
    if (!id) return;
    moveLeadToStage(id, stageId);
  };

  const saveNewLead = () => {
    setFormErrors((prev) => ({ ...prev, manual: undefined }));

    if (!createForm.name.trim() || !createForm.customerId) {
      setFormErrors((prev) => ({
        ...prev,
        manual: "Lead name and customer are required.",
      }));
      return;
    }
    const valueNum = Number(createForm.value.replace(/,/g, "")) || 0;
    if (!quickCapture && (!valueNum || !createForm.expectedClose)) {
      setFormErrors((prev) => ({
        ...prev,
        manual: "Value and target qualify date are required.",
      }));
      return;
    }
    if (quickCapture && valueNum <= 0) {
      setFormErrors((prev) => ({
        ...prev,
        manual: "Quick capture still requires a valid estimated value.",
      }));
      return;
    }

    setIsSavingLead(true);

    const today = new Date().toISOString().split("T")[0]!;
    const currency = createForm.currency;
    const value = quickCapture ? Math.max(valueNum, 1) : valueNum;
    const probability = quickCapture ? 40 : Number(createForm.probability) || 0;
    const newLeadId = `lead-${crypto.randomUUID()}`;
    const newLead: CrmLead = {
      id: newLeadId,
      name: createForm.name.trim(),
      customerId: createForm.customerId,
      value,
      currency,
      baseValue: computeBaseValue(value, currency),
      probability: Math.min(100, Math.max(0, probability)),
      expectedClose: quickCapture ? today : createForm.expectedClose,
      stageId: quickCapture ? AUTOMATION_DEFAULT_LEAD_STAGE_ID : createForm.stageId,
      stageEnteredAt: today,
      primarySales: quickCapture
        ? AUTOMATION_DEFAULT_LEAD_ROLES.primarySales
        : createForm.primarySales,
      presales: quickCapture ? AUTOMATION_DEFAULT_LEAD_ROLES.presales : createForm.presales,
      channel: quickCapture ? AUTOMATION_DEFAULT_LEAD_ROLES.channel : createForm.channel,
      activities: [],
    };
    setLeads((prev) => [newLead, ...prev]);
    setCreateOpen(false);
    setCreateForm({
      name: "",
      customerId: "",
      value: "",
      currency: "ETB",
      probability: "50",
      expectedClose: today,
      stageId: AUTOMATION_DEFAULT_LEAD_STAGE_ID,
      primarySales: AUTOMATION_DEFAULT_LEAD_ROLES.primarySales,
      presales: AUTOMATION_DEFAULT_LEAD_ROLES.presales,
      channel: AUTOMATION_DEFAULT_LEAD_ROLES.channel,
    });
    setSaveFeedback({ type: "success", message: "Lead created successfully." });
    setIsSavingLead(false);
  };

  const saveLeadFromAccount = () => {
    setFormErrors((prev) => ({ ...prev, fromAccount: undefined }));
    if (!selectedAccountId) {
      setFormErrors((prev) => ({
        ...prev,
        fromAccount: "Select a customer account to continue.",
      }));
      return;
    }
    const account = leadCustomerAccounts.find((a) => a.id === selectedAccountId);
    if (!account) return;

    const valueNum = Number(fromAccountForm.value.replace(/,/g, "")) || 0;
    if (!valueNum || !fromAccountForm.expectedClose) {
      setFormErrors((prev) => ({
        ...prev,
        fromAccount: "Estimated value and target qualify date are required.",
      }));
      return;
    }
    const currency = fromAccountForm.currency;
    const today = new Date().toISOString().split("T")[0]!;
    setIsSavingLead(true);

    const newLeadId = `lead-from-acc-${crypto.randomUUID()}`;
    const activityId = `lead-act-conv-${crypto.randomUUID()}`;
    const newLead: CrmLead = {
      id: newLeadId,
      name: `${account.name} — pipeline`,
      customerId: account.id,
      value: valueNum,
      currency,
      baseValue: computeBaseValue(valueNum, currency),
      probability: Number(fromAccountForm.probability) || 0,
      expectedClose: fromAccountForm.expectedClose,
      stageId: fromAccountForm.stageId,
      stageEnteredAt: today,
      primarySales: fromAccountForm.primarySales,
      presales: fromAccountForm.presales,
      channel: fromAccountForm.channel,
      activities: [
        {
          id: activityId,
          kind: "External",
          title: "Created from customer account",
          date: today,
        },
      ],
    };

    setLeads((prev) => [newLead, ...prev]);
    setCreateOpen(false);
    setSelectedAccountId(null);
    setFromAccountForm({
      value: "",
      currency: "ETB",
      probability: "50",
      expectedClose: today,
      stageId: AUTOMATION_DEFAULT_LEAD_STAGE_ID,
      primarySales: AUTOMATION_DEFAULT_LEAD_ROLES.primarySales,
      presales: AUTOMATION_DEFAULT_LEAD_ROLES.presales,
      channel: AUTOMATION_DEFAULT_LEAD_ROLES.channel,
    });
    setSaveFeedback({
      type: "success",
      message: "Lead added to pipeline from account.",
    });
    setIsSavingLead(false);
  };

  const agingLabel = (lead: CrmLead) => {
    const st = stageById.get(lead.stageId);
    if (!st || st.category !== "open") return null;
    const days = daysBetween(lead.stageEnteredAt);
    if (days < STAGE_AGING_WARNING_DAYS) return null;
    return `Stuck for ${days} days`;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">Leads</h1>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          Pipeline, scoring, and lead qualification in one view
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-[#f5f6fa]">
        {saveFeedback && (
          <div
            className={cn(
              "mx-3 mt-3 rounded-md border px-3 py-2 text-sm sm:mx-5",
              saveFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {saveFeedback.message}
          </div>
        )}

        {isPageLoading ? (
          <div className="space-y-4 p-3 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-[#e5e7eb]" />
              ))}
            </div>
            <div className="h-10 animate-pulse rounded-lg bg-[#e5e7eb]" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[280px] animate-pulse rounded-lg bg-[#e5e7eb]" />
              ))}
            </div>
          </div>
        ) : (
          <>
        <div className="flex-shrink-0 space-y-4 p-3 sm:p-5">
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
                  placeholder="Search leads by name or customer"
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
              <FormField label="Qualification score" className="w-[160px]">
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
                New Lead
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-3 pb-4 sm:px-5 no-scrollbar">
          {sortedStages.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[#d1d5db] bg-white p-6 text-center">
              <div>
                <p className="text-sm font-medium text-[#374151]">No pipeline stages configured.</p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Add stages from Leads Settings before creating or moving leads.
                </p>
              </div>
            </div>
          ) : (
          <div className="flex h-full min-w-max gap-3 pb-1">
            {sortedStages.map((stage) => {
              const columnLeads = filteredPipelineLeads.filter((l) => l.stageId === stage.id);
              const totalBase = columnLeads.reduce((sum, l) => sum + l.baseValue, 0);
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
                      <span>{columnLeads.length} leads</span>
                      <span className="text-[#d1d5db]">·</span>
                      <span className="font-medium text-[#374151]">
                        {formatMoney(totalBase, BASE_CURRENCY)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto p-2 no-scrollbar">
                    {columnLeads.length === 0 && (
                      <div className="rounded-md border border-dashed border-[#d1d5db] bg-white/70 p-3 text-center text-xs text-[#6b7280]">
                        No leads in this stage
                      </div>
                    )}
                    {columnLeads.map((lead) => {
                      const customer = accountById.get(lead.customerId);
                      const stuck = agingLabel(lead);
                      return (
                        <Card
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className="cursor-pointer border-[#e5e7eb] bg-white shadow-sm hover:border-[#4080f0] transition-colors"
                          onClick={() => openLeadDetail(lead)}
                        >
                          <CardContent className="space-y-2 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug text-[#1c1e21]">
                                {lead.name}
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
                                {formatMoney(lead.value, lead.currency)}
                              </span>
                              {lead.currency !== BASE_CURRENCY && (
                                <span className="text-[#9ca3af]">
                                  ({formatMoney(lead.baseValue, BASE_CURRENCY)})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                              <span className="inline-flex items-center gap-0.5">
                                <Percent size={12} />
                                {lead.probability}%
                              </span>
                              <span className="text-[#d1d5db]">·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Calendar size={12} />
                                {lead.expectedClose}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 border-t border-[#f3f4f6] pt-2">
                              <span title="Sales" className="inline-flex rounded-md bg-[#eef2fd] p-1 text-[#4080f0]">
                                <Briefcase size={12} />
                              </span>
                              <Avatar className="size-6 border border-white">
                                <AvatarFallback className="text-[9px] bg-[#eef2fd] text-[#245fcb]">
                                  {initials(lead.primarySales)}
                                </AvatarFallback>
                              </Avatar>
                              <span title="Pre-sales" className="inline-flex rounded-md bg-[#f0fdf4] p-1 text-[#15803d]">
                                <Headphones size={12} />
                              </span>
                              <Avatar className="size-6 border border-white">
                                <AvatarFallback className="text-[9px] bg-[#f0fdf4] text-[#166534]">
                                  {initials(lead.presales)}
                                </AvatarFallback>
                              </Avatar>
                              <span title="Channel" className="inline-flex rounded-md bg-[#fff7ed] p-1 text-[#c2410c]">
                                <Share2 size={12} />
                              </span>
                              <Avatar className="size-6 border border-white">
                                <AvatarFallback className="text-[9px] bg-[#fff7ed] text-[#9a3412]">
                                  {initials(lead.channel)}
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
          )}
        </div>
          </>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {creationMode === "fromAccount"
                ? "Add lead from customer account"
                : "Create new lead"}
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
              variant={creationMode === "fromAccount" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "flex-1 h-8 text-xs font-medium",
                creationMode === "fromAccount" && "bg-white shadow-sm"
              )}
              onClick={() => setCreationMode("fromAccount")}
            >
              From account
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
                  <FormField label="Lead name *">
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
                        {leadCustomerAccounts.map((a) => (
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
                    <FormField label="Estimated value *">
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
                      <FormField label="Qualification score (%)">
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
                      <FormField label="Target qualify date">
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
              {formErrors.manual && (
                <p className="text-xs text-red-600">{formErrors.manual}</p>
              )}
            </>
          ) : (
            <div className="grid gap-4 py-2">
              {!selectedAccountId ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    />
                    <Input
                      value={accountPickSearch}
                      onChange={(e) => setAccountPickSearch(e.target.value)}
                      placeholder="Search accounts by name or industry..."
                      className="h-9 pl-9 border-[#e5e7eb]"
                    />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto rounded-md border border-[#e5e7eb]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#f9fafb] text-xs uppercase text-[#6b7280]">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Account</th>
                          <th className="px-4 py-2 text-left font-medium">Industry</th>
                          <th className="px-4 py-2 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb] bg-white">
                        {filteredAccountsForPick.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-[#9ca3af]">
                              No qualifying accounts found. Lead lifecycle accounts appear here.
                            </td>
                          </tr>
                        ) : (
                          filteredAccountsForPick.map((acct) => (
                            <tr key={acct.id} className="hover:bg-[#f3f4f6]">
                              <td className="px-4 py-3 font-medium text-[#1c1e21]">
                                {acct.name}
                              </td>
                              <td className="px-4 py-3 text-[#6b7280]">{acct.industry}</td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-[#e5e7eb]"
                                  onClick={() => setSelectedAccountId(acct.id)}
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
                          {leadCustomerAccounts.find((l) => l.id === selectedAccountId)?.name}
                        </p>
                        <p className="text-xs opacity-80">Adding to pipeline</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[#1e40af] hover:bg-[#dbeafe]"
                      onClick={() => setSelectedAccountId(null)}
                    >
                      Change account
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Estimated value *">
                          <Input
                            value={fromAccountForm.value}
                            onChange={(e) =>
                              setFromAccountForm((p) => ({ ...p, value: e.target.value }))
                            }
                            className="h-9 border-[#e5e7eb]"
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </FormField>
                        <FormField label="Currency">
                          <Select
                            value={fromAccountForm.currency}
                            onValueChange={(v) =>
                              setFromAccountForm((p) => ({ ...p, currency: v as DealCurrency }))
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
                          value={fromAccountForm.stageId}
                          onValueChange={(v) =>
                            setFromAccountForm((p) => ({ ...p, stageId: v }))
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
                      <FormField label="Qualification score (%)">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={fromAccountForm.probability}
                          onChange={(e) =>
                            setFromAccountForm((p) => ({ ...p, probability: e.target.value }))
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </FormField>
                      <FormField label="Target qualify date">
                        <Input
                          type="date"
                          value={fromAccountForm.expectedClose}
                          onChange={(e) =>
                            setFromAccountForm((p) => ({ ...p, expectedClose: e.target.value }))
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
                            value={fromAccountForm.primarySales}
                            onValueChange={(v) =>
                              setFromAccountForm((p) => ({ ...p, primarySales: v }))
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
                            value={fromAccountForm.presales}
                            onValueChange={(v) =>
                              setFromAccountForm((p) => ({ ...p, presales: v }))
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
                            value={fromAccountForm.channel}
                            onValueChange={(v) => setFromAccountForm((p) => ({ ...p, channel: v }))}
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
              {formErrors.fromAccount && (
                <p className="text-xs text-red-600">{formErrors.fromAccount}</p>
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
                onClick={saveNewLead}
                disabled={isSavingLead}
              >
                {isSavingLead ? "Saving..." : "Create lead"}
              </Button>
            ) : (
              selectedAccountId && (
                <Button
                  size="sm"
                  className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                  onClick={saveLeadFromAccount}
                  disabled={isSavingLead}
                >
                  {isSavingLead ? "Saving..." : "Create lead from account"}
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>



    </div>
  );
}
