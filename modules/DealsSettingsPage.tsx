"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCheck,
  X,
  GripVertical,
  CheckCircle2,
  Settings as SettingsIcon,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
  ListTodo,
  Workflow,
  Phone,
  Users,
  Globe,
  Activity as ActivityIcon,
  Mail,
  Calendar,
  Video,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { mockDealStore } from "@/data/mockStore";
import { PipelineStage, ActivityType, CrmDeal, dealCustomerAccounts } from "@/data/dealsManagementData";

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
  { label: "Slate", columnClass: "bg-[#f8fafc]", borderClass: "border-[#cbd5e1]" },
];

const AVAILABLE_ICONS = [
  { name: "Phone", icon: Phone },
  { name: "Users", icon: Users },
  { name: "Globe", icon: Globe },
  { name: "Activity", icon: ActivityIcon },
  { name: "Mail", icon: Mail },
  { name: "Calendar", icon: Calendar },
  { name: "Video", icon: Video },
  { name: "Message", icon: MessageSquare },
];

function IconRenderer({ name, className }: { name: string; className?: string }) {
  const Icon = AVAILABLE_ICONS.find((i) => i.name === name)?.icon || ActivityIcon;
  return <Icon className={className} />;
}

type Tab = "stages" | "activities";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "stages",
    label: "Pipeline Stages",
    icon: <Workflow size={15} />,
  },
  {
    id: "activities",
    label: "Activity Types",
    icon: <ListTodo size={15} />,
  },
];

export function DealsSettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Tab>("stages");
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [dropTargetStageId, setDropTargetStageId] = useState<string | null>(null);
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);
  const [confirmReorderDialogOpen, setConfirmReorderDialogOpen] = useState(false);
  const [pendingStageOrderIds, setPendingStageOrderIds] = useState<string[] | null>(null);
  const [pendingMovedStageName, setPendingMovedStageName] = useState<string | null>(null);
  const [stageDetailsFeedback, setStageDetailsFeedback] = useState<string | null>(null);
  const [isStageConfigEditing, setIsStageConfigEditing] = useState(false);
  const [deleteStageDialogOpen, setDeleteStageDialogOpen] = useState(false);
  const [deleteStageHasDeals, setDeleteStageHasDeals] = useState(false);
  const [addStageDialogOpen, setAddStageDialogOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStagePresetIndex, setNewStagePresetIndex] = useState("1");
  const [newStagePlacement, setNewStagePlacement] = useState("end");
  const [stageConfigDraft, setStageConfigDraft] = useState<{ name: string; presetIndex: number } | null>(
    null,
  );
  const [stages, setStages] = useState<PipelineStage[]>(() =>
    [...mockDealStore.stages].sort((a, b) => a.order - b.order),
  );
  const [deals, setDeals] = useState<CrmDeal[]>(() => [...mockDealStore.deals]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(() => [
    ...mockDealStore.activityTypes,
  ]);

  useEffect(() => {
    const unsubDeals = mockDealStore.subscribeDeals((newDeals) => {
      setDeals([...newDeals]);
    });

    const unsubStages = mockDealStore.subscribeStages((newStages) => {
      setStages([...newStages].sort((a, b) => a.order - b.order));
    });

    const unsubActivities = mockDealStore.subscribeActivityTypes((newTypes) => {
      setActivityTypes([...newTypes]);
    });

    return () => {
      unsubDeals();
      unsubStages();
      unsubActivities();
    };
  }, []);

  useEffect(() => {
    if (orderedStages.length === 0) {
      setSelectedStageId(null);
      return;
    }
    if (!selectedStageId || !orderedStages.some((s) => s.id === selectedStageId)) {
      setSelectedStageId(orderedStages[1]?.id ?? orderedStages[0]?.id ?? null);
    }
  }, [selectedStageId, stages]);

  useEffect(() => {
    setIsStageConfigEditing(false);
    setStageConfigDraft(null);
  }, [selectedStageId]);

  useEffect(() => {
    if (!draggedStageId) {
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      return;
    }
    document.documentElement.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [draggedStageId]);

  useEffect(() => {
    if (!draggedStageId) return;
    const onMouseMove = (event: MouseEvent) => {
      setDragPointer({ x: event.clientX, y: event.clientY });
    };
    const onMouseUp = () => {
      setDraggedStageId(null);
      setDropTargetStageId(null);
      setDragPointer(null);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggedStageId]);

  const saveStages = (newStages: PipelineStage[]) => {
    setStages([...newStages].sort((a, b) => a.order - b.order));
  };

  const saveActivityTypes = (newTypes: ActivityType[]) => {
    setActivityTypes([...newTypes]);
  };

  // Stage Helpers
  const reorderStagesByIds = (orderedIds: string[]) => {
    const byId = new Map(stages.map((s) => [s.id, s]));
    const reordered = orderedIds
      .map((id, index) => {
        const stage = byId.get(id);
        if (!stage) return null;
        return { ...stage, order: index };
      })
      .filter((s): s is PipelineStage => Boolean(s));
    saveStages(reordered);
  };

  const handleStageDragStart = (stageId: string, pointer: { x: number; y: number }) => {
    setDraggedStageId(stageId);
    setDropTargetStageId(stageId);
    setDragPointer(pointer);
  };

  const handleStageDrop = (targetStageId: string) => {
    if (!draggedStageId || draggedStageId === targetStageId) return;
    const ids = orderedStages.map((s) => s.id);
    const from = ids.indexOf(draggedStageId);
    const to = ids.indexOf(targetStageId);
    if (from < 0 || to < 0) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    const movedStage = orderedStages.find((stage) => stage.id === moved);
    setPendingStageOrderIds(next);
    setPendingMovedStageName(movedStage?.name ?? null);
    setConfirmReorderDialogOpen(true);
    setDraggedStageId(null);
    setDropTargetStageId(null);
    setDragPointer(null);
  };

  const handleStageDragOverCard = (targetStageId: string) => {
    if (!draggedStageId) return;
    setDropTargetStageId(targetStageId);
  };

  const updateStage = (stageId: string, updates: Partial<PipelineStage>) => {
    const updated = stages.map((s) =>
      s.id === stageId ? { ...s, ...updates } : s
    );
    saveStages(updated);
  };

  const setPreset = (stageId: string, presetIndex: number) => {
    const preset = STAGE_COLOR_PRESETS[presetIndex];
    if (!preset) return;
    updateStage(stageId, {
      columnClass: preset.columnClass,
      borderClass: preset.borderClass,
    });
  };

  const openAddStageDialog = () => {
    setNewStageName("");
    setNewStagePresetIndex("1");
    setNewStagePlacement("end");
    setAddStageDialogOpen(true);
  };

  const addNewStage = () => {
    const preset = STAGE_COLOR_PRESETS[Number(newStagePresetIndex)] ?? STAGE_COLOR_PRESETS[1]!;
    const stageName = newStageName.trim() || "New Stage";
    const newStage: PipelineStage = {
      id: `stage-custom-${crypto.randomUUID()}`,
      name: stageName,
      category: "open",
      order: 0,
      columnClass: preset.columnClass,
      borderClass: preset.borderClass,
    };

    const next = [...orderedStages];
    if (newStagePlacement === "start") {
      next.unshift(newStage);
    } else if (newStagePlacement === "end") {
      next.push(newStage);
    } else {
      const insertAfterIndex = next.findIndex((stage) => stage.id === newStagePlacement);
      if (insertAfterIndex >= 0) {
        next.splice(insertAfterIndex + 1, 0, newStage);
      } else {
        next.push(newStage);
      }
    }

    saveStages(next.map((stage, index) => ({ ...stage, order: index })));
    setSelectedStageId(newStage.id);
    setAddStageDialogOpen(false);
  };

  const deleteStage = (stageId: string) => {
    if (stages.length <= 1) return;
    if (deals.some((deal) => deal.stageId === stageId)) {
      setStageDetailsFeedback("Cannot delete this stage while it still contains deals.");
      return;
    }
    const updated = stages.filter((s) => s.id !== stageId);
    saveStages(updated);
    setStageDetailsFeedback(null);
  };

  const updateDeal = (dealId: string, updates: Partial<CrmDeal>) => {
    const updated = deals.map((deal) => (deal.id === dealId ? { ...deal, ...updates } : deal));
    setDeals(updated);
    mockDealStore.deals = updated;
  };

  // Activity Helpers
  const addActivityType = () => {
    const newType: ActivityType = {
      id: `act-type-${crypto.randomUUID()}`,
      name: "New Activity",
      icon: "Activity",
    };
    saveActivityTypes([...activityTypes, newType]);
  };

  const updateActivityType = (id: string, updates: Partial<ActivityType>) => {
    const updated = activityTypes.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    saveActivityTypes(updated);
  };

  const deleteActivityType = (id: string) => {
    if (activityTypes.length <= 1) return;
    const updated = activityTypes.filter((t) => t.id !== id);
    saveActivityTypes(updated);
  };

  const orderedStages = [...stages].sort((a, b) => a.order - b.order);
  const draggedStageIndex = draggedStageId
    ? orderedStages.findIndex((s) => s.id === draggedStageId)
    : -1;
  const dropTargetStageIndex = dropTargetStageId
    ? orderedStages.findIndex((s) => s.id === dropTargetStageId)
    : -1;
  const openStageCount = orderedStages.filter((s) => s.category === "open").length;
  const wonStageCount = orderedStages.filter((s) => s.category === "won").length;
  const lostStageCount = orderedStages.filter((s) => s.category === "lost").length;
  const selectedStage = orderedStages.find((s) => s.id === selectedStageId) ?? orderedStages[0];
  const draggedStage = orderedStages.find((s) => s.id === draggedStageId) ?? null;
  const selectedStageDeals = selectedStage
    ? deals.filter((deal) => deal.stageId === selectedStage.id)
    : [];
  const selectedStageHasDeals = selectedStageDeals.length > 0;
  const selectedStagePresetIndex = selectedStage
    ? Math.max(
        0,
        STAGE_COLOR_PRESETS.findIndex(
          (preset) =>
            preset.columnClass === selectedStage.columnClass &&
            preset.borderClass === selectedStage.borderClass,
        ),
      )
    : 0;
  const selectedStageIndex = Math.max(
    0,
    orderedStages.findIndex((s) => s.id === selectedStage?.id),
  );
  const selectedStageProbability = Math.max(5, Math.min(95, (selectedStageIndex + 1) * 15));
  const stageDealCountById = new Map<string, number>();
  for (const deal of deals) {
    stageDealCountById.set(deal.stageId, (stageDealCountById.get(deal.stageId) ?? 0) + 1);
  }
  const customerNameById = new Map(dealCustomerAccounts.map((account) => [account.id, account.name]));
  const getStageInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4 sm:px-6 flex-shrink-0">
        <h1 className="font-semibold text-[#1c1e21]">Deals Settings</h1>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          Configure sales pipeline stages and interaction types
        </p>

        {/* Tab Bar - same pattern as UserManagement */}
        <div className="mt-4 -mb-4 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeSection === tab.id
                  ? "border-[#4080f0] text-[#4080f0]"
                  : "border-transparent text-[#6b7280] hover:text-[#1c1e21] hover:border-[#e5e7eb]"
              )}
            >
              <span className={activeSection === tab.id ? "text-[#4080f0]" : "text-[#9ca3af]"}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-[#f8f9fb] p-3 sm:p-5">
        <div className="h-full overflow-y-auto no-scrollbar">
          <div className="w-full pb-4">
            {activeSection === "stages" ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="font-semibold text-[#1c1e21]">Deals Settings</h2>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      Design and manage your sales flow architecture.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Button
                      onClick={openAddStageDialog}
                      size="sm"
                      className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                    >
                      <Plus size={16} className="mr-1.5" />
                      New Stage
                    </Button>
                  </div>
                </div>

                <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#1c1e21]">Pipeline Stages</h3>
                    <p className="text-xs text-[#6b7280]">
                      {orderedStages.length} stages ({openStageCount} open, {wonStageCount} won, {lostStageCount} lost)
                    </p>
                  </div>
                  <div className="overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex gap-4 min-w-max">
                      {orderedStages.map((stage, idx) => {
                        const isSelected = selectedStage?.id === stage.id;
                        const isDraggedCard = draggedStageId === stage.id;
                        const shouldShiftLeft =
                          draggedStageIndex >= 0 &&
                          dropTargetStageIndex >= 0 &&
                          draggedStageIndex < dropTargetStageIndex &&
                          idx > draggedStageIndex &&
                          idx <= dropTargetStageIndex;
                        const shouldShiftRight =
                          draggedStageIndex >= 0 &&
                          dropTargetStageIndex >= 0 &&
                          draggedStageIndex > dropTargetStageIndex &&
                          idx >= dropTargetStageIndex &&
                          idx < draggedStageIndex;
                        const shiftX = shouldShiftLeft ? -272 : shouldShiftRight ? 272 : 0;
                        return (
                          <button
                            key={stage.id}
                            type="button"
                            onClick={() => setSelectedStageId(stage.id)}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleStageDragStart(stage.id, { x: event.clientX, y: event.clientY });
                            }}
                            onMouseEnter={() => handleStageDragOverCard(stage.id)}
                            onMouseUp={() => handleStageDrop(stage.id)}
                            className={cn(
                              "flex flex-col w-64 rounded-xl p-4 text-left border transform-gpu transition-[transform,box-shadow,background-color,border-color,opacity] duration-300 ease-out",
                              draggedStageId ? "cursor-grab" : "cursor-pointer",
                              isDraggedCard && "cursor-grabbing",
                              isSelected
                                ? "border-[#4080f0] bg-[#eef2fd] shadow-sm"
                                : "border-[#e5e7eb] bg-white hover:border-[#cbd5e1]",
                              isDraggedCard && "opacity-0",
                              dropTargetStageId === stage.id && draggedStageId !== stage.id
                                ? "bg-[#f0f7ff] ring-2 ring-[#bfdbfe]"
                                : ""
                            )}
                            style={{
                              transform: shiftX !== 0 ? `translateX(${shiftX}px)` : undefined,
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span />
                              <GripVertical
                                size={16}
                                className={cn(draggedStageId ? "text-[#4080f0] animate-pulse" : "text-[#c4c7d4]")}
                              />
                            </div>
                            <h4 className="font-semibold text-[#1c1e21]">{stage.name}</h4>
                            <p className="text-sm text-[#6b7280] mb-4">
                              {stage.category === "won"
                                ? "Successful closure stage"
                                : stage.category === "lost"
                                  ? "Lost opportunity stage"
                                  : "Active progression stage"}
                            </p>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "h-4 w-4 rounded-full border",
                                    stage.columnClass,
                                    stage.borderClass,
                                  )}
                                />
                                <span className="text-xs text-[#6b7280]">Stage color</span>
                              </div>
                              <span className="rounded-full bg-[#eef2fd] px-2 py-0.5 text-xs font-semibold text-[#4080f0]">
                                {stageDealCountById.get(stage.id) ?? 0} Deals
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={openAddStageDialog}
                        className="flex flex-col w-64 border-2 border-dashed border-[#d1d5db] rounded-xl p-4 text-center items-center justify-center text-[#6b7280] hover:bg-[#f9fafb] transition-colors"
                      >
                        <Plus size={28} className="mb-2" />
                        <span className="font-semibold">Add Stage</span>
                      </button>
                    </div>
                  </div>
                  {draggedStage && dragPointer && (
                    <div
                      className="pointer-events-none fixed z-50 w-64 rounded-xl border border-[#93c5fd] bg-white p-4 shadow-xl"
                      style={{
                        left: dragPointer.x - 128,
                        top: dragPointer.y - 44,
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span />
                        <GripVertical size={16} className="text-[#4080f0]" />
                      </div>
                      <h4 className="font-semibold text-[#1c1e21]">{draggedStage.name}</h4>
                      <p className="mb-4 text-sm text-[#6b7280]">
                        {draggedStage.category === "won"
                          ? "Successful closure stage"
                          : draggedStage.category === "lost"
                            ? "Lost opportunity stage"
                            : "Active progression stage"}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border",
                              draggedStage.columnClass,
                              draggedStage.borderClass,
                            )}
                          />
                          <span className="text-xs text-[#6b7280]">Stage color</span>
                        </div>
                        <span className="rounded-full bg-[#eef2fd] px-2 py-0.5 text-xs font-semibold text-[#4080f0]">
                          {stageDealCountById.get(draggedStage.id) ?? 0} Deals
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                  <Card className="overflow-hidden border-0 bg-transparent shadow-none">
                    <CardHeader className="border-b border-[#e5e7eb] bg-white px-2 pb-1.5 pt-1.5 sm:px-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="font-semibold text-[#1c1e21]">
                            Stage Settings: {selectedStage?.name ?? "N/A"}
                          </CardTitle>
                          <CardDescription className="mt-0 text-xs text-[#6b7280]">
                            Manage properties and requirements for this phase
                          </CardDescription>
                        </div>
                        {selectedStage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => {
                              setDeleteStageHasDeals(selectedStageHasDeals);
                              setDeleteStageDialogOpen(true);
                            }}
                            title="Delete stage"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
                      {selectedStage ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Card className="border-[#e5e7eb] bg-white shadow-none">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <CardTitle className="text-sm font-semibold">Stage Configuration</CardTitle>
                                  <CardDescription className="text-xs">
                                    Update name and color, then confirm.
                                  </CardDescription>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8",
                                    isStageConfigEditing
                                      ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                      : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]",
                                  )}
                                  onClick={() => {
                                    if (!selectedStage) return;
                                    if (!isStageConfigEditing) {
                                      setStageConfigDraft({
                                        name: selectedStage.name,
                                        presetIndex: selectedStagePresetIndex,
                                      });
                                      setIsStageConfigEditing(true);
                                      return;
                                    }
                                    if (!stageConfigDraft) return;
                                    const nextName = stageConfigDraft.name.trim() || selectedStage.name;
                                    updateStage(selectedStage.id, { name: nextName });
                                    setPreset(selectedStage.id, stageConfigDraft.presetIndex);
                                    setIsStageConfigEditing(false);
                                    setStageDetailsFeedback("Stage configuration updated.");
                                  }}
                                  title={isStageConfigEditing ? "Confirm changes" : "Edit stage configuration"}
                                  aria-label={
                                    isStageConfigEditing
                                      ? "Confirm stage configuration changes"
                                      : "Edit stage configuration"
                                  }
                                >
                                  {isStageConfigEditing ? <Check size={14} /> : <Pencil size={14} />}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                                  Stage Name
                                </label>
                                <Input
                                  value={stageConfigDraft?.name ?? selectedStage.name}
                                  onChange={(event) =>
                                    setStageConfigDraft((prev) =>
                                      prev ? { ...prev, name: event.target.value } : prev,
                                    )
                                  }
                                  disabled={!isStageConfigEditing}
                                  className="h-9 border-[#e5e7eb] bg-white text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                                  Color
                                </label>
                                <Select
                                  value={String(stageConfigDraft?.presetIndex ?? selectedStagePresetIndex)}
                                  onValueChange={(value) =>
                                    setStageConfigDraft((prev) =>
                                      prev ? { ...prev, presetIndex: Number(value) } : prev,
                                    )
                                  }
                                  disabled={!isStageConfigEditing}
                                >
                                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "h-3 w-3 rounded-full border",
                                          selectedStage.columnClass,
                                          selectedStage.borderClass,
                                        )}
                                      />
                                      <SelectValue />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STAGE_COLOR_PRESETS.map((preset, index) => (
                                      <SelectItem key={preset.label} value={String(index)}>
                                        <span className="inline-flex items-center gap-2">
                                          <span
                                            className={cn(
                                              "h-3 w-3 rounded-full border",
                                              preset.columnClass,
                                              preset.borderClass,
                                            )}
                                          />
                                          {preset.label}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {stageDetailsFeedback && (
                                <p className="text-xs text-[#245fcb]">{stageDetailsFeedback}</p>
                              )}
                            </CardContent>
                          </Card>

                          <Card className="border-[#e5e7eb] bg-white shadow-none">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-semibold">Deals in Stage</CardTitle>
                              <CardDescription className="text-xs">
                                {selectedStageDeals.length} deal(s) currently mapped to this stage.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                                        Deal
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                                        Customer
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedStageDeals.length > 0 ? (
                                      selectedStageDeals.map((deal) => (
                                        <tr
                                          key={deal.id}
                                          className="border-b border-[#f0f2f7] transition-colors hover:bg-[#fafbff]"
                                        >
                                          <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-[#1c1e21]">{deal.name}</p>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                              <p className="text-sm text-[#1c1e21]">
                                                {customerNameById.get(deal.customerId) ?? "Unknown customer"}
                                              </p>
                                              <Button
                                                type="button"
                                                size="sm"
                                                className="h-7 bg-[#4080f0] px-2 text-xs text-white hover:bg-[#3070e0]"
                                                onClick={() => router.push(`/deals/${deal.id}`)}
                                              >
                                                View Deal
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-[#6b7280]">
                                          No deals currently in this stage.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <p className="text-sm text-[#6b7280]">Select a stage to view details.</p>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <Dialog open={deleteStageDialogOpen} onOpenChange={setDeleteStageDialogOpen}>
                  <DialogContent>
                    {deleteStageHasDeals ? (
                      <>
                        <DialogHeader>
                          <DialogTitle>Cannot delete stage</DialogTitle>
                          <DialogDescription>
                            This stage has deals assigned to it. Move or remove those deals first, then try deleting
                            the stage again.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteStageDialogOpen(false)}>
                            Close
                          </Button>
                        </DialogFooter>
                      </>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle>Delete stage?</DialogTitle>
                          <DialogDescription>
                            This action will permanently remove
                            {selectedStage ? ` "${selectedStage.name}"` : " this stage"} from the pipeline.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteStageDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => {
                              if (selectedStage) {
                                deleteStage(selectedStage.id);
                              }
                              setDeleteStageDialogOpen(false);
                            }}
                          >
                            Delete Stage
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={confirmReorderDialogOpen}
                  onOpenChange={(open) => {
                    setConfirmReorderDialogOpen(open);
                    if (!open) {
                      setPendingStageOrderIds(null);
                    }
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm stage reorder</DialogTitle>
                      <DialogDescription>
                        {pendingMovedStageName
                          ? `Apply the new position for "${pendingMovedStageName}"?`
                          : "Apply the new pipeline stage order you just dropped?"}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          document.body.style.cursor = "";
                          setPendingStageOrderIds(null);
                          setPendingMovedStageName(null);
                          setConfirmReorderDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                        onClick={() => {
                          document.body.style.cursor = "";
                          if (pendingStageOrderIds) {
                            reorderStagesByIds(pendingStageOrderIds);
                          }
                          setPendingStageOrderIds(null);
                          setPendingMovedStageName(null);
                          setConfirmReorderDialogOpen(false);
                        }}
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={addStageDialogOpen} onOpenChange={setAddStageDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Stage</DialogTitle>
                      <DialogDescription>
                        Set the stage name, color, and where it should fit in the pipeline.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                          Stage Name
                        </label>
                        <Input
                          value={newStageName}
                          onChange={(event) => setNewStageName(event.target.value)}
                          placeholder="Enter stage name"
                          className="h-9 border-[#e5e7eb] bg-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                          Color
                        </label>
                        <Select value={newStagePresetIndex} onValueChange={setNewStagePresetIndex}>
                          <SelectTrigger className="h-9 border-[#e5e7eb] bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGE_COLOR_PRESETS.map((preset, index) => (
                              <SelectItem key={preset.label} value={String(index)}>
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "h-3 w-3 rounded-full border",
                                      preset.columnClass,
                                      preset.borderClass,
                                    )}
                                  />
                                  {preset.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                          Placement in Pipeline
                        </label>
                        <Select value={newStagePlacement} onValueChange={setNewStagePlacement}>
                          <SelectTrigger className="h-9 border-[#e5e7eb] bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="start">At the beginning</SelectItem>
                            <SelectItem value="end">At the end</SelectItem>
                            {orderedStages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                After {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddStageDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-[#4080f0] text-white hover:bg-[#3070e0]" onClick={addNewStage}>
                        Add Stage
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="border-[#e5e7eb] shadow-none overflow-hidden">
                  <CardHeader className="bg-white border-b border-[#e5e7eb] pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Activity Types</CardTitle>
                        <CardDescription className="text-xs">
                          Define different types of interactions tracked for your deals.
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={addActivityType}
                        size="sm" 
                        className="bg-[#4080f0] text-white hover:bg-[#3070e0] shadow-sm"
                      >
                        <Plus size={16} className="mr-1.5" />
                        Add Type
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-[#e5e7eb]">
                      {activityTypes.map((type, idx) => (
                        <div key={type.id} className="flex items-center gap-6 px-6 py-4 bg-white hover:bg-[#fcfcff] group transition-colors">
                          <div className="text-[#9ca3af] font-mono text-[10px] w-4">{idx + 1}</div>
                          
                          {/* Icon Selection */}
                          <div className="shrink-0 w-32">
                            <Select
                              value={type.icon}
                              onValueChange={(v) => updateActivityType(type.id, { icon: v })}
                            >
                              <SelectTrigger className="h-9 border-[#e5e7eb] bg-[#f9fafb] text-xs">
                                <div className="flex items-center gap-2">
                                  <IconRenderer name={type.icon} className="size-3.5 text-[#4080f0]" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {AVAILABLE_ICONS.map((i) => (
                                  <SelectItem key={i.name} value={i.name} className="text-xs">
                                    <div className="flex items-center gap-2">
                                      <i.icon className="size-3.5" />
                                      {i.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Name Input */}
                          <div className="flex-1">
                            <Input
                              value={type.name}
                              onChange={(e) => updateActivityType(type.id, { name: e.target.value })}
                              className="h-9 border-transparent hover:border-[#e5e7eb] focus:border-[#4080f0] bg-transparent focus:bg-white transition-all font-medium text-sm"
                              placeholder="Activity name..."
                            />
                          </div>

                          {/* Actions */}
                          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#9ca3af] hover:text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => deleteActivityType(type.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
