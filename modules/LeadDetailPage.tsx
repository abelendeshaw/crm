"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  Edit2,
  Headphones,
  Plus,
  Share2,
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
  type LeadSource,
  type PipelineStage,
  leadCustomerAccounts,
} from "@/data/leadsManagementData";
import {
  createEmptyDealPqq,
  computeDealPqqTotal,
  PQQ_MAX_TOTAL,
  type DealPqq,
} from "@/data/dealsManagementData";
import {
  clonePqqFormValues,
  createEmptyPqqFormValues,
  getBantScoreFromFormValues,
  getDefaultPqqFormDefinition,
  hasCustomPqqFormFields,
  isLeadPqqQualified,
  type LeadPqqSettings,
  type PqqFormValues,
} from "@/data/pqqTemplateData";
import { mockLeadStore } from "@/data/mockStore";
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
  const [leadSources, setLeadSources] = useState<LeadSource[]>(() => [...mockLeadStore.leadSources]);
  const [pqqTemplates, setPqqTemplates] = useState(() => [...mockLeadStore.pqqTemplates]);
  const [pqqSettings, setPqqSettings] = useState<LeadPqqSettings>(() => ({
    ...mockLeadStore.pqqSettings,
  }));

  const defaultPqqFormDefinition = useMemo(
    () => getDefaultPqqFormDefinition(pqqTemplates),
    [pqqTemplates],
  );
  const usesCustomPqqForm = hasCustomPqqFormFields(defaultPqqFormDefinition);

  useEffect(() => {
    const unsubActivities = mockLeadStore.subscribeActivityTypes((types) => {
      setActivityTypes([...types]);
    });
    const unsubStages = mockLeadStore.subscribeStages((nextStages) => {
      setStages([...nextStages].sort((a, b) => a.order - b.order));
    });
    const unsubSources = mockLeadStore.subscribeLeadSources((nextSources) => {
      setLeadSources([...nextSources]);
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
      unsubSources();
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

  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "timeline">(
    "overview",
  );
  const [isEditingDealInfo, setIsEditingDealInfo] = useState(false);
  const [dealInfoSnapshot, setDealInfoSnapshot] = useState<CrmLead | null>(null);

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
  const sourceById = useMemo(
    () => new Map(leadSources.map((source) => [source.id, source])),
    [leadSources],
  );
  const sortedLeadSources = useMemo(
    () => [...leadSources].sort((a, b) => a.order - b.order),
    [leadSources],
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

  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      set.add(l.primarySales);
      set.add(l.presales);
      set.add(l.channel);
    }
    return Array.from(set).sort();
  }, [leads]);

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

  const stage = stageById.get(detailDraft.stageId);
  const customer = accountById.get(detailDraft.customerId);
  const leadSource = sourceById.get(detailDraft.sourceId);
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
  const expectedRevenue = Math.round((detailDraft.value * detailDraft.probability) / 100);
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
            {pqqQualification === false && (
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
            onClick={() => {
              // Placeholder for conversion logic
              console.log("Converting lead to deal...");
            }}
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
              setActiveTab(value as "overview" | "activities" | "timeline")
            }
            className="w-full"
          >
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
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
                        label="Qualification score"
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
                        label="Target qualify date"
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
                      <ProfileField
                        label="Lead source"
                        value={leadSource?.name ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Select
                          value={detailDraft.sourceId}
                          onValueChange={(v) =>
                            setDetailDraft((d) => (d ? { ...d, sourceId: v } : d))
                          }
                        >
                          <SelectTrigger className="h-9 border-[#e5e7eb]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedLeadSources.map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </ProfileField>
                      <ProfileField
                        label="Department"
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
                        label="Solution Category"
                        value={detailDraft.solutionCategory ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.solutionCategory ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, solutionCategory: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="e.g. ERP"
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
                      <ProfileField
                        label="Current state"
                        value={detailDraft.currentState ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.currentState ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, currentState: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="e.g. LEAD"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Next step"
                        value={detailDraft.nextStep ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.nextStep ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, nextStep: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="e.g. Nurturing"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Quarter start date"
                        value={detailDraft.quarterStartDate ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.quarterStartDate ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, quarterStartDate: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="e.g. Q4"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Quarter End date"
                        value={detailDraft.quarterEndDate ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.quarterEndDate ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, quarterEndDate: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="e.g. Q2"
                        />
                      </ProfileField>

                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#e5e7eb] shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-[#1c1e21]">
                      Qualification & Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <ProfileField
                        label="PQQ Total Score"
                        value={detailDraft.pqqTotalScore?.toString() ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          type="number"
                          value={detailDraft.pqqTotalScore?.toString() ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, pqqTotalScore: Number(e.target.value) || 0 } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </ProfileField>
                      <ProfileField
                        label="PQQ Status"
                        value={detailDraft.pqqStatus ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Select
                          value={detailDraft.pqqStatus ?? ""}
                          onValueChange={(v) =>
                            setDetailDraft((d) => (d ? { ...d, pqqStatus: v } : d))
                          }
                        >
                          <SelectTrigger className="h-9 border-[#e5e7eb]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Unqualified">Unqualified</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </ProfileField>
                      <ProfileField
                        label="Exception Justification"
                        value={detailDraft.exceptionJustification ?? "—"}
                        isEditing={isEditingDealInfo}
                        className="md:col-span-2"
                      >
                        <Input
                          value={detailDraft.exceptionJustification ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, exceptionJustification: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="e.g. N/A"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Exception Approved by"
                        value={detailDraft.exceptionApprovedBy ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Input
                          value={detailDraft.exceptionApprovedBy ?? ""}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, exceptionApprovedBy: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                          placeholder="e.g. Nahom Wendessen"
                        />
                      </ProfileField>
                      <ProfileField
                        label="Checklist Validation Status"
                        value={detailDraft.checklistValidationStatus ?? "—"}
                        isEditing={isEditingDealInfo}
                      >
                        <Select
                          value={detailDraft.checklistValidationStatus ?? ""}
                          onValueChange={(v) =>
                            setDetailDraft((d) => (d ? { ...d, checklistValidationStatus: v } : d))
                          }
                        >
                          <SelectTrigger className="h-9 border-[#e5e7eb]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </ProfileField>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#e5e7eb] shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#1c1e21]">
                      Lead assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                      <RoleRow
                        label="Primary sales"
                        name={detailDraft.primarySales}
                        icon={Briefcase}
                        isEditing={isEditingDealInfo}
                        onChange={(v) =>
                          setDetailDraft((d) => (d ? { ...d, primarySales: v } : d))
                        }
                        owners={ownerOptions}
                      />
                      <RoleRow
                        label="Pre-sales"
                        name={detailDraft.presales}
                        icon={Headphones}
                        isEditing={isEditingDealInfo}
                        onChange={(v) =>
                          setDetailDraft((d) => (d ? { ...d, presales: v } : d))
                        }
                        owners={ownerOptions}
                      />
                      <RoleRow
                        label="Channel"
                        name={detailDraft.channel}
                        icon={Share2}
                        isEditing={isEditingDealInfo}
                        onChange={(v) =>
                          setDetailDraft((d) => (d ? { ...d, channel: v } : d))
                        }
                        owners={ownerOptions}
                      />
                    </div>
                  </CardContent>
                </Card>

                {usesCustomPqqForm ? (
                  <DynamicPqqForm
                    definition={defaultPqqFormDefinition}
                    value={
                      detailDraft.pqqFormValues ??
                      createEmptyPqqFormValues(defaultPqqFormDefinition)
                    }
                    onChange={updateLeadPqqFormValues}
                  />
                ) : (
                  <DealPqqSection
                    value={detailDraft.pqq ?? createEmptyDealPqq()}
                    onChange={updateLeadPqq}
                    decisionThreshold={pqqSettings.bantDecisionThreshold}
                  />
                )}
                  </div>

                  <div className="space-y-4 lg:col-span-4">
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                      Value Summary
                    </h2>
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
                  </div>
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm text-[#6b7280]">TOTAL VALUE</p>
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
                          Expected Revenue
                        </p>
                        {isEditingDealInfo ? (
                          <div className="mt-1 flex items-center gap-2">
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
                              className="h-9 w-16 border-[#e5e7eb] text-sm font-semibold"
                            />
                            <span className="text-xs text-[#6b7280]">
                              % ={" "}
                              <span className="font-semibold text-[#1c1e21]">
                                {formatMoney(expectedRevenue, detailDraft.currency)}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <p className="text-xl font-semibold text-[#1c1e21]">
                            {formatMoney(expectedRevenue, detailDraft.currency)}
                          </p>
                        )}
                      </div>
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
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                          PQQ score
                        </p>
                        {pqqTotal !== null ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-xl font-semibold text-[#1c1e21]">
                              {usesCustomPqqForm
                                ? pqqTotal
                                : `${pqqTotal} / ${PQQ_MAX_TOTAL}`}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px] font-medium",
                                pqqQualification
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                  : "border-rose-200 bg-rose-50 text-rose-900",
                              )}
                            >
                              {pqqQualification ? "Qualified" : "Non-qualified"}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-xl font-semibold text-[#1c1e21]">Not captured</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

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

              <TabsContent value="timeline" className="mt-0 outline-none">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#1c1e21]">Lead progression</h3>
                </div>
                <TimelineView
                  lead={detailDraft}
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
  isEditing,
}: {
  label: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  owners: string[];
  onChange: (value: string) => void;
  isEditing: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-[#e5e7eb] bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-[#eef2fd] p-1.5 text-[#4080f0]">
          <Icon size={13} />
        </span>
        <span className="text-xs text-[#6b7280]">{label}</span>
      </div>
      {isEditing ? (
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
      ) : (
        <div className="flex min-h-[38px] items-center gap-2 rounded-md border border-[#f0f2f7] bg-[#f9fafb] px-3 py-2 text-sm text-[#1c1e21]">
          <Avatar className="size-5">
            <AvatarFallback className="bg-[#eef2fd] text-[9px] font-semibold text-[#4080f0]">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{name || "—"}</span>
        </div>
      )}
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
  lead,
  stageName,
  activityTypes,
}: {
  lead: CrmLead;
  stageName?: string;
  activityTypes: ActivityType[];
}) {
  const items = useMemo(() => {
    const rows: { id: string; date: string; title: string; kind: string; icon?: string }[] = [];
    rows.push({
      id: "tl-stage",
      date: lead.stageEnteredAt,
      title: `Entered stage: ${stageName ?? "—"}`,
      kind: "Stage",
      icon: "Activity",
    });
    for (const a of lead.activities) {
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
  }, [lead, stageName, activityTypes]);

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
