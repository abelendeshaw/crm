"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  Edit2,
  Plus,
  Phone,
  Users,
  Globe,
  Activity as ActivityIcon,
  Mail,
  Calendar,
  Video,
  MessageSquare,
  X,
  ArrowUpRight,
  Star,
  ShieldCheck,
  AlertCircle,
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
  customerContacts,
  accountContactAssociations,
  type CustomerContact,
} from "@/data/customerManagementData";
import {
  BASE_CURRENCY,
  CURRENCY_OPTIONS,
  FX_TO_ETB,
  type CrmLead,
  type LeadActivity,
  type LeadActivityKind,
  type DealCurrency,
  computeBaseValue,
  type ActivityType,
  type PipelineStage,
  leadCustomerAccounts,
} from "@/data/leadsManagementData";
import {
  createEmptyDealPqq,
  computeDealPqqTotal,
  PQQ_MAX_TOTAL,
  DEFAULT_PIPELINE_STAGES as DEFAULT_DEAL_PIPELINE_STAGES,
  type DealPqq,
} from "@/data/dealsManagementData";
import {
  clonePqqFormValues,
  createEmptyPqqFormValues,
  getBantScoreFromFormValues,
  getDefaultPqqFormDefinition,
  getDefaultPqqTemplate,
  hasCustomPqqFormFields,
  isLeadPqqQualified,
  type LeadPqqSettings,
  type PqqFormValues,
} from "@/data/pqqTemplateData";
import { mockLeadStore } from "@/data/mockStore";
import { PQQ_UI_ENABLED } from "@/lib/featureFlags";
import { DealPqqSection } from "@/modules/DealPqqSection";
import { DynamicPqqForm } from "@/modules/DynamicPqqForm";

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

export function LeadDetailPage({ id }: { id: string }) {
  const router = useRouter();

  const [leads, _setLeads] = useState<CrmLead[]>(() => mockLeadStore.leads);

  const setLeads = (next: CrmLead[] | ((prev: CrmLead[]) => CrmLead[])) => {
    if (typeof next === "function") {
      mockLeadStore.leads = next(mockLeadStore.leads);
    } else {
      mockLeadStore.leads = next;
    }
    _setLeads(mockLeadStore.leads);
  };

  const lead = leads.find((l) => l.id === id);

  const [detailDraft, setDetailDraft] = useState<CrmLead | null>(lead ? { ...lead } : null);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(() => mockLeadStore.activityTypes);
  const [stages, setStages] = useState<PipelineStage[]>(() =>
    [...mockLeadStore.stages].sort((a, b) => a.order - b.order),
  );
  const [pqqTemplates, setPqqTemplates] = useState(() => [...mockLeadStore.pqqTemplates]);
  const [pqqSettings, setPqqSettings] = useState<LeadPqqSettings>(() => ({
    ...mockLeadStore.pqqSettings,
  }));

  const defaultPqqFormDefinition = useMemo(
    () => getDefaultPqqFormDefinition(pqqTemplates),
    [pqqTemplates],
  );
  const activeTemplateName = useMemo(() => {
    const template = getDefaultPqqTemplate(pqqTemplates);
    return template?.name ?? "Lead Discovery & PQQ";
  }, [pqqTemplates]);

  const usesCustomPqqForm = hasCustomPqqFormFields(defaultPqqFormDefinition);

  useEffect(() => {
    const unsubActivities = mockLeadStore.subscribeActivityTypes((types) => {
      setActivityTypes([...types]);
    });
    const unsubStages = mockLeadStore.subscribeStages((nextStages) => {
      setStages([...nextStages].sort((a, b) => a.order - b.order));
    });
    const unsubPqqTemplates = mockLeadStore.subscribePqqTemplates((nextTemplates) => {
      setPqqTemplates([...nextTemplates]);
    });
    const unsubPqqSettings = mockLeadStore.subscribePqqSettings((nextSettings) => {
      setPqqSettings({ ...nextSettings });
    });
    return () => {
      unsubActivities();
      unsubStages();
      unsubPqqTemplates();
      unsubPqqSettings();
    };
  }, []);

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityForm, setActivityForm] = useState<{
    kind: LeadActivityKind;
    title: string;
    date: string;
    note: string;
  }>({
    kind: "Call",
    title: "",
    date: new Date().toISOString().split("T")[0]!,
    note: "",
  });

  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "discovery">(
    "overview",
  );
  const [isEditingDealInfo, setIsEditingDealInfo] = useState(false);
  const [dealInfoSnapshot, setDealInfoSnapshot] = useState<CrmLead | null>(null);

  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [selectedDealStageId, setSelectedDealStageId] = useState(DEFAULT_DEAL_PIPELINE_STAGES[0]?.id ?? "");


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

  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );
  const accountById = useMemo(
    () => new Map(leadCustomerAccounts.map((a) => [a.id, a])),
    [],
  );

  const contactById = useMemo(
    () => new Map(customerContacts.map((c) => [c.id, c])),
    [],
  );

  const leadContact = useMemo((): CustomerContact | null => {
    if (!detailDraft) return null;
    if (detailDraft.contactId) {
      return contactById.get(detailDraft.contactId) ?? null;
    }
    const assocs = accountContactAssociations.filter(
      (a) => a.accountId === detailDraft.customerId,
    );
    const primary = assocs.find((a) => a.isPrimary);
    const pickId = primary?.contactId ?? assocs[0]?.contactId;
    if (!pickId) return null;
    return contactById.get(pickId) ?? null;
  }, [detailDraft, contactById]);

  if (!detailDraft) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8f9fb]">
        <div className="text-center">
          <h2 className="font-semibold text-[#1c1e21]">Lead not found</h2>
          <p className="mt-1 text-xs text-[#6b7280]">The lead ID might be incorrect or has been removed.</p>
          <Button variant="outline" size="sm" className="mt-4 h-8 border-[#e5e7eb]" onClick={() => router.push("/leads")}>
            <ArrowLeft size={13} className="mr-1.5" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const persistDetailDraft = () => {
    if (!detailDraft) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === detailDraft.id ? { ...detailDraft } : l)),
    );
    console.log("Saving lead changes...", detailDraft);
  };

  const updateLeadPqq = (pqq: DealPqq) => {
    if (!detailDraft) return;
    const next = { ...detailDraft, pqq };
    setDetailDraft(next);
    setLeads((prev) => prev.map((l) => (l.id === next.id ? next : l)));
  };

  const updateLeadPqqFormValues = (pqqFormValues: PqqFormValues) => {
    if (!detailDraft) return;
    const next = { ...detailDraft, pqqFormValues: clonePqqFormValues(pqqFormValues) };
    setDetailDraft(next);
    setLeads((prev) => prev.map((l) => (l.id === next.id ? next : l)));
  };

  const addActivity = () => {
    if (!detailDraft || !activityForm.title.trim()) return;
    const act: LeadActivity = {
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
    setLeads((prev) => prev.map((l) => (l.id === next.id ? next : l)));
    setActivityForm((f) => ({
      ...f,
      title: "",
      note: "",
    }));
    setActivityOpen(false);
  };

  const convertToDeal = () => {
    if (!detailDraft) return;
    console.log("Converting lead to deal with stage:", selectedDealStageId);
    // In a real app, this would create a Deal and potentially update the Lead status
    setIsConversionOpen(false);
    // Maybe show a toast or redirect
    router.push("/deals");
  };


  const stage = stageById.get(detailDraft.stageId);
  const customer = accountById.get(detailDraft.customerId);
  const customPqqTotal = getBantScoreFromFormValues(
    defaultPqqFormDefinition,
    detailDraft.pqqFormValues,
  );
  const pqqTotal = usesCustomPqqForm
    ? customPqqTotal
    : detailDraft.pqq
      ? computeDealPqqTotal(detailDraft.pqq.bant)
      : null;
  const pqqQualification = isLeadPqqQualified(
    detailDraft.pqq,
    pqqSettings.bantDecisionThreshold,
    {
      formDefinition: defaultPqqFormDefinition,
      formValues: detailDraft.pqqFormValues,
    },
  );

  const leadAgeDays = (() => {
    const start = new Date(detailDraft.stageEnteredAt);
    if (Number.isNaN(start.getTime())) return null;
    const diffMs = Date.now() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  })();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <div>
          <button
            type="button"
            onClick={() => router.push("/leads")}
            className="mb-2 flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1c1e21]"
          >
            <ArrowLeft size={13} />
            Back to Leads
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
            {PQQ_UI_ENABLED && pqqQualification === false && (
              <Badge
                variant="outline"
                className="rounded-full border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-900"
              >
                Non-qualified
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-[#6b7280]">
            {customer?.name ?? "Unknown customer"}
            {customer?.industry ? ` · ${customer.industry}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
            onClick={() => setIsConversionOpen(true)}
          >
            <ArrowUpRight size={14} className="mr-1.5" />
            Convert to Deal
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f8f9fb] p-3 sm:p-5">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "overview" | "activities" | "discovery")
            }
            className="w-full"
          >
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                {PQQ_UI_ENABLED && (
                  <TabsTrigger value="discovery">Discovery & BANT</TabsTrigger>
                )}
              </TabsList>
            </div>

              <TabsContent value="overview" className="mt-0 outline-none">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-8">
                <Card className="border-[#e5e7eb] shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-[#1c1e21]">
                      Lead information
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
                        aria-label="Edit lead information"
                      >
                        <Edit2 size={14} />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <ProfileField
                        label="Lead name"
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
                        label="Estimated value"
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
                        label="Teams"
                        value={detailDraft.department ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.department ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, department: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="field is empty"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Fiscal Year"
                        value={detailDraft.fiscalYear ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.fiscalYear ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, fiscalYear: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="e.g. 2018"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Quarter"
                        value={detailDraft.quarter ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Select
                          value={detailDraft.quarter ?? ""}
                          onValueChange={(v) =>
                            setDetailDraft((d) => (d ? { ...d, quarter: v } : d))
                          }
                        >
                          <SelectTrigger className="h-9 border-[#e5e7eb]">
                            <SelectValue placeholder="Select quarter" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                              <SelectItem key={q} value={q}>
                                {q}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </ProfileField>
                    </div>
                  </CardContent>
                </Card>
                  </div>

                  <div className="space-y-4 lg:col-span-4">
                <Card className="border-[#e5e7eb] shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-[#1c1e21]">
                      Value Summary
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
                        aria-label="Edit value summary"
                      >
                        <Edit2 size={14} />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">ESTIMATED VALUE</p>
                      {isEditingDealInfo ? (
                        <div className="mt-1 flex items-stretch gap-2">
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
                            <SelectTrigger className="h-12 w-24 border-[#e5e7eb] text-base font-semibold text-[#4080f0]">
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
                            className="h-12 flex-1 border-[#e5e7eb] text-2xl font-black text-[#4080f0]"
                          />
                        </div>
                      ) : (
                        <p className="text-[32px] font-black leading-tight text-[#4080f0]">
                          {formatMoney(detailDraft.value, detailDraft.currency)}
                        </p>
                      )}
                      {detailDraft.currency !== BASE_CURRENCY && (
                        <p className="mt-1 text-xs text-[#9ca3af]">
                          Base ({BASE_CURRENCY}):{" "}
                          <span className="font-medium text-[#6b7280]">
                            {formatMoney(detailDraft.baseValue, BASE_CURRENCY)}
                          </span>{" "}
                          · 1 {detailDraft.currency} = {FX_TO_ETB[detailDraft.currency]}{" "}
                          {BASE_CURRENCY}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-[#e5e7eb] pt-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                          Stage age
                        </p>
                        <p className="text-xl font-semibold text-[#1c1e21]">
                          {leadAgeDays !== null
                            ? `${leadAgeDays} Day${leadAgeDays === 1 ? "" : "s"}`
                            : "—"}
                        </p>
                      </div>
                      {PQQ_UI_ENABLED && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                            PQQ Assessment
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {detailDraft.pqqTotalScore !== undefined && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1.5 border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 shadow-sm"
                              >
                                <Star size={12} className="fill-blue-500 text-blue-500" />
                                Score: {detailDraft.pqqTotalScore}
                              </Badge>
                            )}
                            {detailDraft.pqqStatus && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold shadow-sm",
                                  detailDraft.pqqStatus === "Qualified"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : detailDraft.pqqStatus === "Unqualified"
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700"
                                )}
                              >
                                {detailDraft.pqqStatus === "Qualified" ? (
                                  <ShieldCheck size={12} />
                                ) : (
                                  <AlertCircle size={12} />
                                )}
                                {detailDraft.pqqStatus}
                              </Badge>
                            )}
                            {!detailDraft.pqqTotalScore && !detailDraft.pqqStatus && (
                              <p className="text-xl font-semibold text-[#1c1e21]">Not captured</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="gap-2 border-[#e5e7eb] shadow-none">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-[#1c1e21]">
                      Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-[#6b7280]">Customer</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Building2 size={14} className="shrink-0 text-[#4080f0]" />
                          <p className="truncate text-sm text-[#1c1e21]">
                            {customer?.name ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex min-w-0 justify-end">
                        <div className="inline-flex min-w-0 flex-col items-start">
                          <p className="text-xs text-[#6b7280]">Account Executive</p>
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
                    </div>
                    <div>
                      <p className="mb-2.5 text-xs text-[#6b7280]">Contact person</p>
                      {leadContact ? (
                        <Card className="relative gap-0 overflow-hidden border-[#e5e7eb] py-0 shadow-none">
                          <CardContent className="p-2.5">
                            {leadContact.roleTitle ? (
                              <Badge
                                variant="secondary"
                                className="absolute right-2 top-2 h-4 px-1.5 text-[10px]"
                              >
                                {leadContact.roleTitle}
                              </Badge>
                            ) : null}
                            <div className="flex items-start gap-2.5 pr-2">
                              <Avatar className="size-7 shrink-0">
                                <AvatarFallback className="text-[10px]">
                                  {initials(
                                    `${leadContact.firstName} ${leadContact.lastName}`.trim() ||
                                      leadContact.email,
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="truncate text-sm font-medium text-[#1c1e21]">
                                  {`${leadContact.firstName} ${leadContact.lastName}`.trim() ||
                                    leadContact.email ||
                                    "—"}
                                </p>
                                <p className="truncate text-[11px] text-[#6b7280]">
                                  {leadContact.email || "—"}
                                </p>
                                {leadContact.phone ? (
                                  <p className="truncate text-[11px] text-[#9ca3af]">
                                    {leadContact.phone}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <p className="text-sm text-[#9ca3af]">No contact linked yet.</p>
                      )}
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

              {PQQ_UI_ENABLED && (
              <TabsContent value="discovery" className="mt-0 outline-none">
                {(() => {
                  const formDef = defaultPqqFormDefinition;
                  const formVals = detailDraft.pqqFormValues ?? createEmptyPqqFormValues(formDef);
                  const totalFields = formDef.fields.length;
                  const filledFields = formDef.fields.filter((f) => {
                    const v = formVals[f.id];
                    return v !== undefined && v !== "" && v !== false;
                  }).length;
                  const completionPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
                  const isAssessed = filledFields > 0;
                  const totalSections = formDef.sections.length;
                  const filledSections = formDef.sections.filter((sec) =>
                    formDef.fields
                      .filter((f) => f.sectionId === sec.id)
                      .some((f) => {
                        const v = formVals[f.id];
                        return v !== undefined && v !== "" && v !== false;
                      }),
                  ).length;

                  return (
                    <div className="space-y-4">
                      {/* Status hero card */}
                      <div className={cn(
                        "rounded-xl border p-5",
                        pqqQualification === true
                          ? "border-emerald-200 bg-emerald-50"
                          : pqqQualification === false
                            ? "border-amber-200 bg-amber-50"
                            : "border-[#e5e7eb] bg-[#f9fafb]",
                      )}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              pqqQualification === true
                                ? "bg-emerald-100"
                                : pqqQualification === false
                                  ? "bg-amber-100"
                                  : "bg-[#eef2fd]",
                            )}>
                              <ShieldCheck size={20} className={cn(
                                pqqQualification === true
                                  ? "text-emerald-600"
                                  : pqqQualification === false
                                    ? "text-amber-600"
                                    : "text-[#4080f0]",
                              )} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1c1e21]">
                                {activeTemplateName}
                              </p>
                              <p className={cn(
                                "mt-0.5 text-xs font-medium",
                                pqqQualification === true
                                  ? "text-emerald-700"
                                  : pqqQualification === false
                                    ? "text-amber-700"
                                    : "text-[#6b7280]",
                              )}>
                                {pqqQualification === true
                                  ? "Qualified — BANT threshold met"
                                  : pqqQualification === false
                                    ? "Not qualified — below threshold"
                                    : isAssessed
                                      ? "In progress"
                                      : "Not started yet"}
                              </p>
                              {isAssessed && (
                                <p className="mt-1 text-[11px] text-[#9ca3af]">
                                  {filledSections} of {totalSections} sections · {completionPct}% complete
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="shrink-0 bg-[#4080f0] text-white shadow-sm hover:bg-[#3070e0]"
                            onClick={() => router.push(`/leads/${detailDraft.id}/pqq`)}
                          >
                            <ShieldCheck size={14} className="mr-1.5" />
                            {isAssessed ? "Continue PQQ" : "Fill PQQ"}
                          </Button>
                        </div>

                        {/* Progress bar */}
                        {totalFields > 0 && (
                          <div className="mt-4">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[11px] text-[#9ca3af]">
                                {filledFields} of {totalFields} fields filled
                              </span>
                              <span className={cn(
                                "text-[11px] font-semibold",
                                completionPct === 100
                                  ? "text-emerald-600"
                                  : "text-[#4080f0]",
                              )}>
                                {completionPct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  completionPct === 100
                                    ? "bg-emerald-500"
                                    : "bg-[#4080f0]",
                                )}
                                style={{ width: `${completionPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section status grid */}
                      {totalSections > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {[...formDef.sections]
                            .sort((a, b) => a.order - b.order)
                            .map((sec) => {
                              const secFields = formDef.fields.filter(
                                (f) => f.sectionId === sec.id,
                              );
                              const secFilled = secFields.filter((f) => {
                                const v = formVals[f.id];
                                return v !== undefined && v !== "" && v !== false;
                              }).length;
                              const secDone =
                                secFields.length > 0 &&
                                secFilled === secFields.length;
                              const secStarted = secFilled > 0;
                              return (
                                <button
                                  key={sec.id}
                                  type="button"
                                  onClick={() =>
                                    router.push(`/leads/${detailDraft.id}/pqq`)
                                  }
                                  className={cn(
                                    "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-[#4080f0]",
                                    secDone
                                      ? "border-emerald-200 bg-emerald-50"
                                      : secStarted
                                        ? "border-[#bfdbfe] bg-[#f0f7ff]"
                                        : "border-[#e5e7eb] bg-white",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                      secDone
                                        ? "bg-emerald-500"
                                        : secStarted
                                          ? "bg-[#4080f0]"
                                          : "bg-[#e5e7eb]",
                                    )}
                                  >
                                    {secDone ? (
                                      <Check size={10} className="text-white" />
                                    ) : (
                                      <span className="text-[8px] font-bold text-white">
                                        {secFilled}
                                      </span>
                                    )}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-[#1c1e21]">
                                      {sec.title}
                                    </p>
                                    <p className="text-[10px] text-[#9ca3af]">
                                      {secFilled}/{secFields.length} fields
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </TabsContent>
              )}
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

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="sm:max-w-md border-[#e5e7eb]">
          <DialogHeader>
            <DialogTitle>Convert to Deal</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="mb-4 text-sm text-[#6b7280]">
              Select the initial pipeline stage for this new deal.
            </p>
            <FormField label="Deal Pipeline Stage">
              <Select
                value={selectedDealStageId}
                onValueChange={setSelectedDealStageId}
              >
                <SelectTrigger className="h-10 border-[#e5e7eb]">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_DEAL_PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => setIsConversionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={convertToDeal}
            >
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
