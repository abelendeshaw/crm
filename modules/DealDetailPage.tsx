"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  ChevronLeft,
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
import { Separator } from "@/components/ui/separator";
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
import Link from "next/link";

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
      <div className="flex h-full items-center justify-center bg-[#f5f6fa]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#1c1e21]">Deal not found</h2>
          <p className="mt-1 text-sm text-[#6b7280]">The deal ID might be incorrect or has been removed.</p>
          <Button variant="outline" className="mt-4 border-[#e5e7eb]" onClick={() => router.push("/deals")}>
            <ChevronLeft size={16} className="mr-1.5" />
            Back to deals
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

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f5f6fa]">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 border-b border-[#e5e7eb] bg-white px-4 py-3 text-sm sm:px-6">
        <Link href="/deals" className="text-[#6b7280] hover:text-[#4080f0] transition-colors">
          Deals
        </Link>
        <span className="text-[#d1d5db]">/</span>
        <span className="font-medium text-[#1c1e21]">{detailDraft.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1c1e21]">{detailDraft.name}</h1>
                <Badge 
                    variant="outline" 
                    className={cn(
                        "font-medium text-[11px]", 
                        stageById.get(detailDraft.stageId)?.columnClass,
                        stageById.get(detailDraft.stageId)?.borderClass
                    )}
                >
                    {stageById.get(detailDraft.stageId)?.name}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-[#6b7280]">
                {accountById.get(detailDraft.customerId)?.name} · Created from lead: {detailDraft.createdFromLead ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    className="h-9 border-[#e5e7eb] bg-white"
                    onClick={() => router.push("/deals")}
                >
                    <ChevronLeft size={16} className="mr-1.5" />
                    Back
                </Button>
                <Button 
                    className="h-9 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                    onClick={persistDetailDraft}
                >
                    Save changes
                </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="h-10 bg-white p-1 ring-1 ring-[#e5e7eb] shadow-sm">
              <TabsTrigger value="overview" className="px-4 text-xs font-medium data-[state=active]:bg-[#f8faff] data-[state=active]:text-[#4080f0]">Overview</TabsTrigger>
              <TabsTrigger value="activities" className="px-4 text-xs font-medium data-[state=active]:bg-[#f8faff] data-[state=active]:text-[#4080f0]">Activities</TabsTrigger>
              <TabsTrigger value="roles" className="px-4 text-xs font-medium data-[state=active]:bg-[#f8faff] data-[state=active]:text-[#4080f0]">Roles</TabsTrigger>
              <TabsTrigger value="timeline" className="px-4 text-xs font-medium data-[state=active]:bg-[#f8faff] data-[state=active]:text-[#4080f0]">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 outline-none">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-[#e5e7eb] shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Deal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Deal name">
                        <Input
                          value={detailDraft.name}
                          onChange={(e) =>
                            setDetailDraft((d) => (d ? { ...d, name: e.target.value } : d))
                          }
                          className="h-9 border-[#e5e7eb]"
                        />
                      </FormField>
                      <FormField label="Stage">
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
                      </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Value">
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
                      </FormField>
                      <FormField label="Currency">
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
                      </FormField>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Close probability (%)">
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
                      </FormField>
                      <FormField label="Expected close">
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
                      </FormField>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#e5e7eb] shadow-none bg-[#fcfdfe]">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Value Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                        <p className="text-xs text-[#6b7280] uppercase tracking-wider">Total Value</p>
                        <p className="mt-1 text-2xl font-bold text-[#1c1e21]">
                            {formatMoney(detailDraft.value, detailDraft.currency)}
                        </p>
                    </div>
                    {detailDraft.currency !== BASE_CURRENCY && (
                        <div className="rounded-lg bg-white p-3 border border-[#e5e7eb]">
                            <p className="text-xs text-[#6b7280]">
                                Base ({BASE_CURRENCY}):
                            </p>
                            <p className="mt-1 text-lg font-semibold text-[#1c1e21]">
                                {formatMoney(detailDraft.baseValue, BASE_CURRENCY)}
                            </p>
                            <p className="mt-1 text-[10px] text-[#9ca3af]">
                                Rate: 1 {detailDraft.currency} = {FX_TO_ETB[detailDraft.currency]} {BASE_CURRENCY}
                            </p>
                        </div>
                    )}
                    <Separator />
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[#6b7280]">Customer</span>
                            <span className="font-medium text-[#1c1e21]">{accountById.get(detailDraft.customerId)?.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[#6b7280]">Stage</span>
                            <span className="font-medium text-[#1c1e21]">{stageById.get(detailDraft.stageId)?.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[#6b7280]">Expected Close</span>
                            <span className="font-medium text-[#1c1e21]">{detailDraft.expectedClose}</span>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="mt-4 outline-none">
              <Card className="border-[#e5e7eb] shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Activity History</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                    onClick={() => setActivityOpen(true)}
                  >
                    <Plus size={14} className="mr-1.5" />
                    New Activity
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {detailDraft.activities.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-[#6b7280]">No activities recorded for this deal yet.</p>
                      </div>
                    ) : (
                      detailDraft.activities.map((a) => (
                        <div
                          key={a.id}
                          className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-[#e5e7eb] last:before:bottom-2"
                        >
                          <div className="absolute left-[-4px] top-2 size-2 rounded-full border-2 border-white bg-[#4080f0]" />
                          <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 text-sm shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="secondary" className="text-[10px] font-medium bg-[#f3f4f6]">
                                {a.kind}
                              </Badge>
                              <span className="text-[11px] text-[#9ca3af]">{a.date}</span>
                            </div>
                            <p className="mt-2 font-semibold text-[#1c1e21]">{a.title}</p>
                            {a.note && (
                              <p className="mt-1 text-xs text-[#6b7280] leading-relaxed">{a.note}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="mt-4 outline-none">
              <Card className="border-[#e5e7eb] shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Deal Roles & Ownership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                </CardContent>
                <div className="flex justify-end border-t border-[#e5e7eb] px-6 py-4">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#4080f0] text-white"
                    onClick={persistDetailDraft}
                  >
                    Update Roles
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4 outline-none">
              <Card className="border-[#e5e7eb] shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Deal Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimelineView 
                    deal={detailDraft} 
                    stageName={stageById.get(detailDraft.stageId)?.name} 
                    activityTypes={activityTypes}
                  />
                </CardContent>
              </Card>
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
    <div className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-[#f0f7ff] p-2 text-[#4080f0]">
          <Icon size={16} />
        </div>
        <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider">{label}</span>
      </div>
      <Select value={name} onValueChange={onChange}>
        <SelectTrigger className="h-10 border-[#e5e7eb] bg-[#f9fafb]">
            <div className="flex items-center gap-2">
                <Avatar className="size-6">
                    <AvatarFallback className="text-[9px] bg-[#4080f0] text-white">
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
                    <AvatarFallback className="text-[8px] bg-[#eef2fd] text-[#4080f0]">
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
      const typeCfg = activityTypes.find(t => t.name === a.kind);
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

  const getIcon = (name?: string) => {
    const icons: Record<
      string,
      React.ComponentType<{ size?: number; className?: string }>
    > = {
      Phone, Users, Globe, Activity: ActivityIcon, Mail, Calendar, Video, Message: MessageSquare
    };
    const Comp = icons[name || ""] || ActivityIcon;
    return <Comp size={10} className="text-white" />;
  };

  return (
    <div className="relative pl-8">
      <div className="absolute bottom-4 left-[15px] top-2 w-px bg-[#e5e7eb]" />
      <ul className="space-y-6">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span className="absolute -left-[25px] top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#4080f0] shadow-sm">
              {getIcon(item.icon)}
            </span>
            <div>
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{item.date}</p>
                <p className="mt-1 text-sm font-semibold text-[#1c1e21]">{item.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-medium bg-[#f8faff] text-[#4080f0] border-[#dbeafe]">
                    {item.kind}
                  </Badge>
                </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
