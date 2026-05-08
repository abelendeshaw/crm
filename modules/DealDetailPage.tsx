"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  Coins,
  Edit2,
  Headphones,
  Percent,
  Plus,
  Share2,
  Sigma,
  Phone,
  Users,
  Globe,
  Activity as ActivityIcon,
  Mail,
  Calendar,
  Video,
  MessageSquare,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
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
  computeBaseValue,
  type ActivityType,
} from "@/data/dealsManagementData";
import { mockDealStore } from "@/data/mockStore";

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

export function DealDetailPage({ id }: { id: string }) {
  const router = useRouter();
  
  const [deals, _setDeals] = useState<CrmDeal[]>(() => mockDealStore.deals);
  
  const setDeals = (newDeals: CrmDeal[] | ((prev: CrmDeal[]) => CrmDeal[])) => {
    if (typeof newDeals === "function") {
      mockDealStore.deals = newDeals(mockDealStore.deals);
    } else {
      mockDealStore.deals = newDeals;
    }
    _setDeals(mockDealStore.deals);
  };

  const deal = deals.find((d) => d.id === id);

  const [detailDraft, setDetailDraft] = useState<CrmDeal | null>(deal ? { ...deal } : null);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(() => mockDealStore.activityTypes);

  useEffect(() => {
    return mockDealStore.subscribeActivityTypes((types) => {
      setActivityTypes([...types]);
    });
  }, []);

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityForm, setActivityForm] = useState<{
    kind: DealActivityKind;
    title: string;
    date: string;
    note: string;
  }>({
    kind: "Call",
    title: "",
    date: new Date().toISOString().split("T")[0]!,
    note: "",
  });

  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "roles" | "timeline">(
    "overview",
  );
  const [isEditingDealInfo, setIsEditingDealInfo] = useState(false);
  const [dealInfoSnapshot, setDealInfoSnapshot] = useState<CrmDeal | null>(null);

  const startEditDealInfo = () => {
    if (!detailDraft) return;
    setDealInfoSnapshot({ ...detailDraft });
    setIsEditingDealInfo(true);
  };
  const cancelEditDealInfo = () => {
    if (dealInfoSnapshot) {
      setDetailDraft(dealInfoSnapshot);
    }
    setIsEditingDealInfo(false);
    setDealInfoSnapshot(null);
  };
  const saveEditDealInfo = () => {
    persistDetailDraft();
    setIsEditingDealInfo(false);
    setDealInfoSnapshot(null);
  };

  const stages = useMemo(
    () => [...DEFAULT_PIPELINE_STAGES].sort((a, b) => a.order - b.order),
    [],
  );
  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );
  const accountById = useMemo(
    () => new Map(dealCustomerAccounts.map((a) => [a.id, a])),
    [],
  );

  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of deals) {
      set.add(d.primarySales);
      set.add(d.presales);
      set.add(d.channel);
    }
    return Array.from(set).sort();
  }, [deals]);

  if (!detailDraft) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8f9fb]">
        <div className="text-center">
          <h2 className="font-semibold text-[#1c1e21]">Deal not found</h2>
          <p className="mt-1 text-xs text-[#6b7280]">The deal ID might be incorrect or has been removed.</p>
          <Button variant="outline" size="sm" className="mt-4 h-8 border-[#e5e7eb]" onClick={() => router.push("/deals")}>
            <ArrowLeft size={13} className="mr-1.5" />
            Back to Deals
          </Button>
        </div>
      </div>
    );
  }

  const persistDetailDraft = () => {
    if (!detailDraft) return;
    setDeals((prev) =>
      prev.map((d) => (d.id === detailDraft.id ? { ...detailDraft } : d)),
    );
    // Simulation: In a real app, this would be an API call
    console.log("Saving deal changes...", detailDraft);
  };

  const addActivity = () => {
    if (!detailDraft || !activityForm.title.trim()) return;
    const act: DealActivity = {
      id: `act-${Date.now()}`,
      kind: activityForm.kind,
      title: activityForm.title.trim(),
      date: activityForm.date,
      note: activityForm.note.trim() || undefined,
    };
    const next = {
      ...detailDraft,
      activities: [act, ...detailDraft.activities],
    };
    setDetailDraft(next);
    setDeals((prev) => prev.map((d) => (d.id === next.id ? next : d)));
    setActivityForm((f) => ({
      ...f,
      title: "",
      note: "",
    }));
    setActivityOpen(false);
  };

  const stage = stageById.get(detailDraft.stageId);
  const customer = accountById.get(detailDraft.customerId);
  const expectedRevenue = Math.round((detailDraft.value * detailDraft.probability) / 100);
  const dealAgeDays = (() => {
    const start = new Date(detailDraft.stageEnteredAt);
    if (Number.isNaN(start.getTime())) return null;
    const diffMs = Date.now() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  })();
  const lastModifiedLabel = (() => {
    const date = new Date(detailDraft.stageEnteredAt);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  })();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <div>
          <button
            type="button"
            onClick={() => router.push("/deals")}
            className="mb-2 flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1c1e21]"
          >
            <ArrowLeft size={13} />
            Back to Deals
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-semibold text-[#1c1e21]">{detailDraft.name}</h2>
            {stage && (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  stage.columnClass,
                  stage.borderClass,
                  "text-[#1c1e21]",
                )}
              >
                {stage.name}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-[#6b7280]">
            {customer?.name ?? "Unknown customer"} · Created from lead:{" "}
            {detailDraft.createdFromLead ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f8f9fb] p-3 sm:p-5">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "overview" | "activities" | "roles" | "timeline")
            }
            className="w-full"
          >
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </div>

              <TabsContent value="overview" className="mt-0 outline-none">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-8">
                <Card className="border-[#e5e7eb] shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-[#1c1e21]">
                      Deal Information
                    </CardTitle>
                    {isEditingDealInfo ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1c1e21]"
                          onClick={cancelEditDealInfo}
                          aria-label="Cancel editing"
                        >
                          <X size={14} />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          className="size-7 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                          onClick={saveEditDealInfo}
                          aria-label="Save changes"
                        >
                          <Check size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1c1e21]"
                        onClick={startEditDealInfo}
                        aria-label="Edit deal information"
                      >
                        <Edit2 size={14} />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <ProfileField
                        label="Deal name"
                        value={detailDraft.name}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.name}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, name: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Stage"
                        value={stages.find((s) => s.id === detailDraft.stageId)?.name ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Select
                          value={detailDraft.stageId}
                          onValueChange={(v) => {
                            const today = new Date().toISOString().split("T")[0]!;
                            setDetailDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    stageId: v,
                                    stageEnteredAt:
                                      d.stageId === v ? d.stageEnteredAt : today,
                                  }
                                : d,
                            );
                          }}
                        >
                          <SelectTrigger className="h-9 border-[#e5e7eb]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </ProfileField>
                      <ProfileField
                        label="Value"
                        value={formatMoney(detailDraft.value, detailDraft.currency)}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          type="number"
                          value={String(detailDraft.value)}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            setDetailDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    value,
                                    baseValue: computeBaseValue(value, d.currency),
                                  }
                                : d,
                            );
                          }}
                          className="h-9 border-[#e5e7eb]"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Currency"
                        value={detailDraft.currency}
                        isEditing={isEditingDealInfo}
                      >
                        <Select
                          value={detailDraft.currency}
                          onValueChange={(v) => {
                            const currency = v as DealCurrency;
                            setDetailDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    currency,
                                    baseValue: computeBaseValue(d.value, currency),
                                  }
                                : d,
                            );
                          }}
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
                      </ProfileField>
                      <ProfileField
                        label="Close probability"
                        value={`${detailDraft.probability}%`}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={String(detailDraft.probability)}
                          onChange={(e) =>
                            setDetailDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    probability: Math.min(
                                      100,
                                      Math.max(0, Number(e.target.value) || 0),
                                    ),
                                  }
                                : d,
                            )
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Expected close"
                        value={detailDraft.expectedClose || "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          type="date"
                          value={detailDraft.expectedClose}
                          onChange={(e) =>
                            setDetailDraft((d) =>
                              d ? { ...d, expectedClose: e.target.value } : d,
                            )
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </ProfileField>
                    </div>
                  </CardContent>
                </Card>
                  </div>

                  <div className="space-y-4 lg:col-span-4">
                <Card className="border-[#e5e7eb] shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#1c1e21]">
                      Value Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-3 rounded-md border border-[#e5e7eb] bg-white px-3 py-3">
                        <span className="rounded-md bg-[#eef2fd] p-2 text-[#4080f0]">
                          <Sigma size={16} />
                        </span>
                        <span className="text-left">
                          <p className="text-[11px] text-[#6b7280]">Total Value</p>
                          <p className="text-base font-semibold text-[#1c1e21]">
                            {formatMoney(detailDraft.value, detailDraft.currency)}
                          </p>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-md border border-[#e5e7eb] bg-white px-3 py-3">
                        <span className="rounded-md bg-[#e6f7ee] p-2 text-[#1a8a4a]">
                          <Coins size={16} />
                        </span>
                        <span className="text-left">
                          <p className="text-[11px] text-[#6b7280]">Expected</p>
                          <p className="text-base font-semibold text-[#1c1e21]">
                            {formatMoney(expectedRevenue, detailDraft.currency)}
                          </p>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-md border border-[#e5e7eb] bg-white px-3 py-3">
                        <span className="rounded-md bg-[#fff8e6] p-2 text-[#b07d00]">
                          <Percent size={16} />
                        </span>
                        <span className="text-left">
                          <p className="text-[11px] text-[#6b7280]">Probability</p>
                          <p className="text-base font-semibold text-[#1c1e21]">
                            {detailDraft.probability}%
                          </p>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-md border border-[#e5e7eb] bg-white px-3 py-3">
                        <span className="rounded-md bg-[#fef2f2] p-2 text-[#dc2626]">
                          <CalendarClock size={16} />
                        </span>
                        <span className="text-left">
                          <p className="text-[11px] text-[#6b7280]">Deal Age</p>
                          <p className="text-base font-semibold text-[#1c1e21]">
                            {dealAgeDays !== null
                              ? `${dealAgeDays}d`
                              : "—"}
                          </p>
                        </span>
                      </div>
                    </div>
                    {detailDraft.currency !== BASE_CURRENCY && (
                      <div className="rounded-md border border-[#f0f2f7] bg-[#f9fafb] px-3 py-2 text-xs text-[#6b7280]">
                        Base ({BASE_CURRENCY}):{" "}
                        <span className="font-medium text-[#1c1e21]">
                          {formatMoney(detailDraft.baseValue, BASE_CURRENCY)}
                        </span>{" "}
                        · 1 {detailDraft.currency} = {FX_TO_ETB[detailDraft.currency]}{" "}
                        {BASE_CURRENCY}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-[#e5e7eb] shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#1c1e21]">
                      Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-[#6b7280]">Customer</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Building2 size={14} className="text-[#4080f0]" />
                        <p className="truncate text-sm text-[#1c1e21]">
                          {customer?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#6b7280]">Created From Lead</p>
                        <p className="text-sm text-[#1c1e21]">
                          {detailDraft.createdFromLead ? "Yes" : "No"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6b7280]">Owner</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Avatar className="size-5">
                            <AvatarFallback className="bg-[#eef2fd] text-[9px] font-semibold text-[#4080f0]">
                              {initials(detailDraft.primarySales)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="truncate text-sm text-[#1c1e21]">
                            {detailDraft.primarySales}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">Last Modified</p>
                      <p className="text-sm text-[#1c1e21]">{lastModifiedLabel}</p>
                    </div>
                  </CardContent>
                </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activities" className="mt-0 outline-none">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-[#1c1e21]">Activity</h3>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                    onClick={() => setActivityOpen(true)}
                  >
                    <Plus size={13} className="mr-1.5" />
                    New Activity
                  </Button>
                </div>
                {detailDraft.activities.length === 0 ? (
                  <p className="text-sm text-[#9ca3af]">No activity yet.</p>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute bottom-0 left-2 top-0 w-px bg-[#dfe4ef]" />
                    {detailDraft.activities.map((a) => {
                      const typeCfg = activityTypes.find((t) => t.name === a.kind);
                      return (
                        <div key={a.id} className="relative mb-3 last:mb-0">
                          <span className="absolute -left-7 top-1.5 flex size-5 items-center justify-center rounded-full border border-[#d7deef] bg-white text-[#6b7280]">
                            <ActivityRowIcon name={typeCfg?.icon ?? a.kind} />
                          </span>
                          <div className="rounded-md border border-[#e5e7eb] bg-[#fafbff] px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm text-[#1c1e21]">{a.title}</p>
                              <span className="shrink-0 text-xs text-[#9ca3af]">{a.date}</span>
                            </div>
                            <p className="text-xs text-[#6b7280]">
                              {a.kind}
                              {a.note ? ` · ${a.note}` : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="roles" className="mt-0 outline-none">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-[#1c1e21]">Deal Roles & Ownership</h3>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                    onClick={persistDetailDraft}
                  >
                    Update Roles
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <RoleRow
                    label="Primary sales"
                    name={detailDraft.primarySales}
                    icon={Briefcase}
                    onChange={(v) => setDetailDraft((d) => (d ? { ...d, primarySales: v } : d))}
                    owners={ownerOptions}
                  />
                  <RoleRow
                    label="Pre-sales"
                    name={detailDraft.presales}
                    icon={Headphones}
                    onChange={(v) => setDetailDraft((d) => (d ? { ...d, presales: v } : d))}
                    owners={ownerOptions}
                  />
                  <RoleRow
                    label="Channel"
                    name={detailDraft.channel}
                    icon={Share2}
                    onChange={(v) => setDetailDraft((d) => (d ? { ...d, channel: v } : d))}
                    owners={ownerOptions}
                  />
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-0 outline-none">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#1c1e21]">Deal Progression</h3>
                </div>
                <TimelineView
                  deal={detailDraft}
                  stageName={stageById.get(detailDraft.stageId)?.name}
                  activityTypes={activityTypes}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="sm:max-w-md border-[#e5e7eb]">
          <DialogHeader>
            <DialogTitle>Add activity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField label="Type">
              <Select
                value={activityForm.kind}
                onValueChange={(v) =>
                  setActivityForm((p) => ({ ...p, kind: v }))
                }
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Title *">
              <Input
                value={activityForm.title}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, title: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
                placeholder="e.g. Initial discovery"
              />
            </FormField>
            <FormField label="Date">
              <Input
                type="date"
                value={activityForm.date}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, date: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
            <FormField label="Notes">
              <Textarea
                value={activityForm.note}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, note: e.target.value }))
                }
                className="min-h-[100px] border-[#e5e7eb] text-sm"
                placeholder="Add some details about this activity..."
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-[#e5e7eb]" onClick={() => setActivityOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={addActivity}
              disabled={!activityForm.title.trim()}
            >
              Save activity
            </Button>
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
    <div className="flex flex-col gap-2 rounded-md border border-[#e5e7eb] bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-[#eef2fd] p-1.5 text-[#4080f0]">
          <Icon size={13} />
        </span>
        <span className="text-xs text-[#6b7280]">{label}</span>
      </div>
      <Select value={name} onValueChange={onChange}>
        <SelectTrigger className="h-9 border-[#f0f2f7] bg-[#f9fafb]">
          <div className="flex items-center gap-2">
            <Avatar className="size-5">
              <AvatarFallback className="bg-[#eef2fd] text-[9px] font-semibold text-[#4080f0]">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {owners.map((o) => (
            <SelectItem key={o} value={o}>
              <div className="flex items-center gap-2">
                <Avatar className="size-5">
                  <AvatarFallback className="bg-[#eef2fd] text-[9px] font-semibold text-[#4080f0]">
                    {initials(o)}
                  </AvatarFallback>
                </Avatar>
                <span>{o}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ActivityRowIcon({ name }: { name: string }) {
  const icons: Record<
    string,
    React.ComponentType<{ size?: number; className?: string }>
  > = {
    Phone,
    Users,
    Globe,
    Activity: ActivityIcon,
    Mail,
    Calendar,
    Video,
    Message: MessageSquare,
    MessageSquare,
    Call: Phone,
    Meeting: Users,
    External: Globe,
    Email: Mail,
    Note: MessageSquare,
  };
  const Comp = icons[name] ?? ActivityIcon;
  return <Comp size={11} />;
}

function TimelineView({
  deal,
  stageName,
  activityTypes,
}: {
  deal: CrmDeal;
  stageName?: string;
  activityTypes: ActivityType[];
}) {
  const items = useMemo(() => {
    const rows: { id: string; date: string; title: string; kind: string; icon?: string }[] = [];
    if (deal.createdFromLead && deal.leadConvertedAt) {
      rows.push({
        id: "tl-lead",
        date: deal.leadConvertedAt,
        title: "Lead converted to deal",
        kind: "Conversion",
        icon: "Globe",
      });
    }
    rows.push({
      id: "tl-stage",
      date: deal.stageEnteredAt,
      title: `Entered stage: ${stageName ?? "—"}`,
      kind: "Stage",
      icon: "Activity",
    });
    for (const a of deal.activities) {
      const typeCfg = activityTypes.find((t) => t.name === a.kind);
      rows.push({
        id: a.id,
        date: a.date,
        title: a.title,
        kind: a.kind,
        icon: typeCfg?.icon || "Activity",
      });
    }
    return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [deal, stageName, activityTypes]);

  return (
    <div className="relative pl-6">
      <div className="absolute bottom-0 left-2 top-0 w-px bg-[#dfe4ef]" />
      {items.map((item) => (
        <div key={item.id} className="relative mb-3 last:mb-0">
          <span className="absolute -left-7 top-1.5 flex size-5 items-center justify-center rounded-full border border-[#d7deef] bg-white text-[#6b7280]">
            <ActivityRowIcon name={item.icon ?? "Activity"} />
          </span>
          <div className="rounded-md border border-[#e5e7eb] bg-[#fafbff] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#1c1e21]">{item.title}</p>
              <span className="shrink-0 text-xs text-[#9ca3af]">{item.date}</span>
            </div>
            <p className="text-xs text-[#6b7280]">{item.kind}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileField({
  label,
  value,
  isEditing,
  children,
  className,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-[#6b7280]">{label}</Label>
      {isEditing && children ? (
        children
      ) : (
        <div className="min-h-[38px] rounded-md border border-[#f0f2f7] bg-[#f9fafb] px-3 py-2.5 text-sm text-[#1c1e21]">
          {value || "—"}
        </div>
      )}
    </div>
  );
}
