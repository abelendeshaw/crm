"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Kanban,
  Phone,
  Users,
  Globe,
  Activity as ActivityIcon,
  Mail,
  Calendar,
  Video,
  MessageSquare,
  Search,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { mockDealStore } from "@/data/mockStore";
import { PipelineStage, ActivityType, CrmDeal } from "@/data/dealsManagementData";

const STAGE_COLOR_PRESETS: {
  label: string;
  columnClass: string;
  borderClass: string;
}[] = [
  { label: "Violet", columnClass: "bg-[#f9f8ff]", borderClass: "border-[#e4dff5]" },
  { label: "Sky", columnClass: "bg-[#f5f9ff]", borderClass: "border-[#d8e6f8]" },
  { label: "Mint", columnClass: "bg-[#f3fdf8]", borderClass: "border-[#c4e6d6]" },
  { label: "Amber", columnClass: "bg-[#fdfaf3]", borderClass: "border-[#e8ddb8]" },
  { label: "Emerald", columnClass: "bg-[#f3fdf6]", borderClass: "border-[#bce0c8]" },
  { label: "Rose", columnClass: "bg-[#fdf6f6]", borderClass: "border-[#ecdada]" },
  { label: "Slate", columnClass: "bg-[#f8fafc]", borderClass: "border-[#dde3eb]" },
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

const ACTIVITY_ICON_PALETTE: { bg: string; text: string }[] = [
  { bg: "bg-[#eef2fd]", text: "text-[#4080f0]" },
  { bg: "bg-[#ecfdf5]", text: "text-[#10b981]" },
  { bg: "bg-[#fef3c7]", text: "text-[#d97706]" },
  { bg: "bg-[#fce7f3]", text: "text-[#db2777]" },
  { bg: "bg-[#ede9fe]", text: "text-[#7c3aed]" },
  { bg: "bg-[#e0f2fe]", text: "text-[#0284c7]" },
];

type ActivityDraft = {
  name: string;
  description: string;
  icon: string;
};

const EMPTY_ACTIVITY_DRAFT: ActivityDraft = {
  name: "",
  description: "",
  icon: "Activity",
};

function IconRenderer({ name, className }: { name: string; className?: string }) {
  const Icon = AVAILABLE_ICONS.find((i) => i.name === name)?.icon || ActivityIcon;
  return <Icon className={className} />;
}

type Tab = "stages" | "activities";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "stages",
    label: "Pipeline Stages",
    icon: <Kanban size={15} />,
  },
  {
    id: "activities",
    label: "Activity Types",
    icon: <ActivityIcon size={15} />,
  },
];

export function DealsSettingsPage() {
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
  const [agingWarningDays, setAgingWarningDays] = useState(() => mockDealStore.dealAgingWarningDays);
  const [agingDraftValue, setAgingDraftValue] = useState(() => String(mockDealStore.dealAgingWarningDays));
  const [agingSaved, setAgingSaved] = useState(false);

  const saveAgingThreshold = () => {
    const num = parseInt(agingDraftValue, 10);
    if (!num || num < 1) return;
    mockDealStore.dealAgingWarningDays = num;
    setAgingWarningDays(num);
    setAgingSaved(true);
    setTimeout(() => setAgingSaved(false), 2000);
  };

  const [stageConfigDraft, setStageConfigDraft] = useState<{
    name: string;
    presetIndex: number;
    placementAfterStageId: string;
  } | null>(null);
  const dropTargetStageIdRef = useRef<string | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>(() =>
    [...mockDealStore.stages].sort((a, b) => a.order - b.order),
  );
  const [deals, setDeals] = useState<CrmDeal[]>(() => [...mockDealStore.deals]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(() => [
    ...mockDealStore.activityTypes,
  ]);
  const [activitySearchQuery, setActivitySearchQuery] = useState("");
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);
  const [editActivityDialogOpen, setEditActivityDialogOpen] = useState(false);
  const [deleteActivityDialogOpen, setDeleteActivityDialogOpen] = useState(false);
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(EMPTY_ACTIVITY_DRAFT);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

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
    dropTargetStageIdRef.current = dropTargetStageId;
  }, [dropTargetStageId]);

  useEffect(() => {
    if (!draggedStageId) return;
    const onMouseMove = (event: MouseEvent) => {
      setDragPointer({ x: event.clientX, y: event.clientY });
    };
    const onMouseUp = () => {
      const target = dropTargetStageIdRef.current;
      if (target && target !== draggedStageId) {
        handleStageDrop(target);
        return;
      }
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
  const openAddActivityDialog = () => {
    setActivityDraft(EMPTY_ACTIVITY_DRAFT);
    setAddActivityDialogOpen(true);
  };

  const confirmAddActivity = () => {
    const trimmedName = activityDraft.name.trim() || "New Activity";
    const trimmedDescription = activityDraft.description.trim();
    const newType: ActivityType = {
      id: `act-type-${crypto.randomUUID()}`,
      name: trimmedName,
      icon: activityDraft.icon || "Activity",
      description: trimmedDescription || undefined,
      order: activityTypes.length,
    };
    saveActivityTypes([...activityTypes, newType]);
    setAddActivityDialogOpen(false);
  };

  const openEditActivityDialog = (id: string) => {
    const target = activityTypes.find((t) => t.id === id);
    if (!target) return;
    setEditingActivityId(id);
    setActivityDraft({
      name: target.name,
      description: target.description ?? "",
      icon: target.icon,
    });
    setEditActivityDialogOpen(true);
  };

  const confirmEditActivity = () => {
    if (!editingActivityId) return;
    const trimmedName = activityDraft.name.trim() || "Untitled";
    const trimmedDescription = activityDraft.description.trim();
    const next = activityTypes.map((t) =>
      t.id === editingActivityId
        ? {
            ...t,
            name: trimmedName,
            description: trimmedDescription || undefined,
            icon: activityDraft.icon || t.icon,
          }
        : t,
    );
    saveActivityTypes(next);
    setEditActivityDialogOpen(false);
    setEditingActivityId(null);
  };

  const requestDeleteActivity = (id: string) => {
    if (activityTypes.length <= 1) return;
    setDeletingActivityId(id);
    setDeleteActivityDialogOpen(true);
  };

  const confirmDeleteActivity = () => {
    if (!deletingActivityId) {
      setDeleteActivityDialogOpen(false);
      return;
    }
    if (activityTypes.length <= 1) {
      setDeleteActivityDialogOpen(false);
      setDeletingActivityId(null);
      return;
    }
    const next = activityTypes.filter((t) => t.id !== deletingActivityId);
    saveActivityTypes(next);
    setDeleteActivityDialogOpen(false);
    setDeletingActivityId(null);
  };

  const orderedStages = [...stages].sort((a, b) => a.order - b.order);
  const orderedActivityTypes = [...activityTypes].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const normalizedActivitySearch = activitySearchQuery.trim().toLowerCase();
  const filteredActivityTypes = normalizedActivitySearch
    ? orderedActivityTypes.filter(
        (t) =>
          t.name.toLowerCase().includes(normalizedActivitySearch) ||
          (t.description?.toLowerCase().includes(normalizedActivitySearch) ?? false),
      )
    : orderedActivityTypes;
  const deletingActivityType = deletingActivityId
    ? activityTypes.find((t) => t.id === deletingActivityId) ?? null
    : null;
  const draggedStageIndex = draggedStageId
    ? orderedStages.findIndex((s) => s.id === draggedStageId)
    : -1;
  const dropTargetStageIndex = dropTargetStageId
    ? orderedStages.findIndex((s) => s.id === dropTargetStageId)
    : -1;
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-3 flex-shrink-0">
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
          {activeSection === "activities" && (
            <div className="ml-auto shrink-0 pb-px pl-3">
              <Button
                onClick={openAddActivityDialog}
                size="sm"
                className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              >
                <Plus size={14} className="mr-1" />
                Add Type
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-[#f8f9fb] p-3 sm:p-5">
        <div className="h-full overflow-y-auto no-scrollbar">
          <div className="w-full pb-4">
            {activeSection === "stages" ? (
              <div className="flex gap-5 items-start">

                {/* ── Left column: compact stage list ───────────────── */}
                <div className="w-[260px] shrink-0 flex flex-col gap-1.5">
                  {orderedStages.map((stage, idx) => {
                    const isSelected = selectedStage?.id === stage.id;
                    const isDraggedCard = draggedStageId === stage.id;
                    const shouldShiftUp =
                      draggedStageIndex >= 0 &&
                      dropTargetStageIndex >= 0 &&
                      draggedStageIndex < dropTargetStageIndex &&
                      idx > draggedStageIndex &&
                      idx <= dropTargetStageIndex;
                    const shouldShiftDown =
                      draggedStageIndex >= 0 &&
                      dropTargetStageIndex >= 0 &&
                      draggedStageIndex > dropTargetStageIndex &&
                      idx >= dropTargetStageIndex &&
                      idx < draggedStageIndex;
                    const shiftY = shouldShiftUp ? -50 : shouldShiftDown ? 50 : 0;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setSelectedStageId(stage.id)}
                        onMouseEnter={() => handleStageDragOverCard(stage.id)}
                        className={cn(
                          "group relative flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transform-gpu transition-[transform,background-color,border-color,opacity] duration-200 ease-out",
                          isSelected
                            ? "border-[#4080f0] bg-[#eef2fd]"
                            : "border-[#e5e7eb] bg-white hover:border-[#c7d4e8] hover:bg-[#fafbff]",
                          isDraggedCard && "opacity-0",
                          dropTargetStageId === stage.id && draggedStageId !== stage.id
                            ? "ring-2 ring-[#bfdbfe]"
                            : ""
                        )}
                        style={{ transform: shiftY !== 0 ? `translateY(${shiftY}px)` : undefined }}
                      >
                        <span
                          role="button"
                          tabIndex={-1}
                          aria-label="Drag stage to reorder"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleStageDragStart(stage.id, { x: event.clientX, y: event.clientY });
                          }}
                          onClick={(event) => event.stopPropagation()}
                          className={cn(
                            "shrink-0 inline-flex h-5 w-5 items-center justify-center rounded cursor-grab hover:bg-[#e9ecef]",
                            isDraggedCard && "cursor-grabbing",
                          )}
                        >
                          <GripVertical
                            size={13}
                            className={cn(draggedStageId ? "text-[#4080f0] animate-pulse" : "text-[#c4c7d4]")}
                          />
                        </span>
                        <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full border-2", stage.columnClass, stage.borderClass)} />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1c1e21]">{stage.name}</span>
                        <span className="shrink-0 text-xs text-[#9ca3af] tabular-nums">
                          {stageDealCountById.get(stage.id) ?? 0}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={openAddStageDialog}
                    className="mt-0.5 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#d1d5db] py-2.5 text-[13px] font-medium text-[#9ca3af] hover:border-[#b0b8c5] hover:bg-[#f9fafb] hover:text-[#6b7280] transition-colors"
                  >
                    <Plus size={13} />
                    Add Stage
                  </button>
                  {draggedStage && dragPointer && (
                    <div
                      className="pointer-events-none fixed z-50 w-[240px] rounded-lg border border-[#93c5fd] bg-white px-3 py-2.5 shadow-xl"
                      style={{ left: dragPointer.x - 120, top: dragPointer.y - 22 }}
                    >
                      <div className="flex items-center gap-2.5">
                        <GripVertical size={13} className="shrink-0 text-[#4080f0]" />
                        <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full border-2", draggedStage.columnClass, draggedStage.borderClass)} />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1c1e21]">{draggedStage.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Right column: stage settings + pipeline behaviour ── */}
                <div className="flex-1 min-w-0">
                  {selectedStage ? (
                    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                      <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-5 py-3.5">
                        <div className={cn("h-3 w-3 shrink-0 rounded-full border-2", selectedStage.columnClass, selectedStage.borderClass)} />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[13px] font-semibold text-[#1c1e21]">{selectedStage.name}</h3>
                          <p className="text-[11px] capitalize text-[#9ca3af]">{selectedStage.category} stage</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 gap-1.5 text-[13px]",
                              isStageConfigEditing
                                ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                : "border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]",
                            )}
                            onClick={() => {
                              if (!selectedStage) return;
                              if (!isStageConfigEditing) {
                                const currentIdx = orderedStages.findIndex((s) => s.id === selectedStage.id);
                                setStageConfigDraft({
                                  name: selectedStage.name,
                                  presetIndex: selectedStagePresetIndex,
                                  placementAfterStageId: currentIdx === 0 ? "" : orderedStages[currentIdx - 1]?.id ?? "",
                                });
                                setIsStageConfigEditing(true);
                                return;
                              }
                              if (!stageConfigDraft) return;
                              const nextName = stageConfigDraft.name.trim() || selectedStage.name;
                              updateStage(selectedStage.id, { name: nextName });
                              setPreset(selectedStage.id, stageConfigDraft.presetIndex);
                              const currentIds = orderedStages.map((s) => s.id);
                              const withoutCurrent = currentIds.filter((id) => id !== selectedStage.id);
                              const insertAt =
                                stageConfigDraft.placementAfterStageId === ""
                                  ? 0
                                  : withoutCurrent.indexOf(stageConfigDraft.placementAfterStageId) + 1;
                              const newOrder = [...withoutCurrent];
                              newOrder.splice(insertAt, 0, selectedStage.id);
                              if (currentIds.join(",") !== newOrder.join(",")) {
                                reorderStagesByIds(newOrder);
                              }
                              setIsStageConfigEditing(false);
                              setStageDetailsFeedback("Stage updated.");
                            }}
                          >
                            {isStageConfigEditing ? <Check size={14} /> : <Pencil size={14} />}
                            {isStageConfigEditing ? "Confirm" : "Edit"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => {
                              setDeleteStageHasDeals(selectedStageHasDeals);
                              setDeleteStageDialogOpen(true);
                            }}
                            title="Delete stage"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                      <div className="p-5 space-y-5">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
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

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                            Color
                          </label>
                          <div className="flex gap-2">
                            {STAGE_COLOR_PRESETS.map((preset, index) => {
                              const hex = preset.borderClass.match(/#[0-9a-fA-F]{6}/)?.[0] ?? "#cccccc";
                              const activeIdx = stageConfigDraft?.presetIndex ?? selectedStagePresetIndex;
                              const isActivePreset = activeIdx === index;
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  title={preset.label}
                                  disabled={!isStageConfigEditing}
                                  className={cn(
                                    "h-6 w-6 rounded-full border-2 transition-transform",
                                    isActivePreset ? "border-[#1c1e21] scale-110" : "border-transparent",
                                    isStageConfigEditing ? "hover:scale-110 cursor-pointer" : "cursor-default opacity-70",
                                  )}
                                  style={{ backgroundColor: hex }}
                                  onClick={() =>
                                    setStageConfigDraft((prev) =>
                                      prev ? { ...prev, presetIndex: index } : prev,
                                    )
                                  }
                                />
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                            Position in Pipeline
                          </label>
                          <Select
                            value={
                              stageConfigDraft
                                ? (stageConfigDraft.placementAfterStageId || "__first__")
                                : (orderedStages.findIndex((s) => s.id === selectedStage.id) === 0
                                    ? "__first__"
                                    : orderedStages[
                                        orderedStages.findIndex((s) => s.id === selectedStage.id) - 1
                                      ]?.id ?? "__first__")
                            }
                            onValueChange={(value) =>
                              setStageConfigDraft((prev) =>
                                prev
                                  ? { ...prev, placementAfterStageId: value === "__first__" ? "" : value }
                                  : prev,
                              )
                            }
                            disabled={!isStageConfigEditing}
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__first__">1st — Beginning</SelectItem>
                              {orderedStages
                                .filter((s) => s.id !== selectedStage.id)
                                .map((s, i) => {
                                  const pos = i + 2;
                                  const suffix = pos === 2 ? "nd" : pos === 3 ? "rd" : "th";
                                  return (
                                    <SelectItem key={s.id} value={s.id}>
                                      {pos}{suffix} — After &quot;{s.name}&quot;
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </div>

                        {stageDetailsFeedback && (
                          <p className="text-xs text-[#4080f0]">{stageDetailsFeedback}</p>
                        )}

                        <div className="border-t border-[#e5e7eb] pt-5">
                          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                            Pipeline Behaviour
                          </p>
                          <div className="space-y-2">
                            <p className="text-[13px] font-medium text-[#374151]">Aging alert threshold</p>
                            <p className="text-xs text-[#6b7280]">
                              Flag deals as "stuck" when they remain in the same stage longer than this many days.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <Input
                                type="number"
                                min={1}
                                max={365}
                                value={agingDraftValue}
                                onChange={(e) => setAgingDraftValue(e.target.value)}
                                className="h-9 w-20 border-[#e5e7eb] text-sm"
                              />
                              <span className="text-sm text-[#6b7280]">days</span>
                              <Button
                                size="sm"
                                className={cn(
                                  "h-9 gap-1.5 px-3 text-[13px] transition-colors",
                                  agingSaved
                                    ? "bg-[#16a34a] text-white hover:bg-[#15803d]"
                                    : "bg-[#4080f0] text-white hover:bg-[#3070e0]",
                                )}
                                onClick={saveAgingThreshold}
                                disabled={!agingDraftValue || parseInt(agingDraftValue, 10) < 1}
                              >
                                {agingSaved ? <><Check size={13} /> Saved</> : "Save"}
                              </Button>
                              <span className="ml-1 text-xs text-[#9ca3af]">
                                Current: <span className="font-semibold text-[#1c1e21]">{agingWarningDays}d</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white text-sm text-[#9ca3af]">
                      Select a stage to configure it
                    </div>
                  )}
                </div>

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

                <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#1c1e21]">Activity Types</h3>
                    <span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eef2fd] px-2.5 py-0.5 text-xs font-semibold text-[#4080f0]">
                      {activityTypes.length} activit{activityTypes.length === 1 ? "y" : "ies"}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="relative w-full max-w-sm">
                      <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                      />
                      <Input
                        value={activitySearchQuery}
                        onChange={(event) => setActivitySearchQuery(event.target.value)}
                        placeholder="Filter activities..."
                        className="h-9 border-[#e5e7eb] bg-white pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="-mx-4 -mb-4 divide-y divide-[#e5e7eb] border-t border-[#e5e7eb] [&>*:last-child]:rounded-b-lg [&>*:last-child]:overflow-hidden">
                    {filteredActivityTypes.length > 0 ? (
                      filteredActivityTypes.map((type, idx) => {
                        const palette =
                          ACTIVITY_ICON_PALETTE[idx % ACTIVITY_ICON_PALETTE.length] ??
                          ACTIVITY_ICON_PALETTE[0]!;
                        return (
                          <div
                            key={type.id}
                            className="group flex items-center gap-4 bg-white px-4 py-3 transition-colors hover:bg-[#fafbff]"
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                palette.bg,
                              )}
                            >
                              <IconRenderer
                                name={type.icon}
                                className={cn("size-5", palette.text)}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-semibold text-[#1c1e21]">
                                {type.name}
                              </h4>
                              {type.description ? (
                                <p className="mt-0.5 line-clamp-1 text-xs text-[#6b7280]">
                                  {type.description}
                                </p>
                              ) : (
                                <p className="mt-0.5 text-xs italic text-[#9ca3af]">
                                  No description
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                                onClick={() => openEditActivityDialog(type.id)}
                                title="Edit activity"
                                aria-label={`Edit ${type.name}`}
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#6b7280] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                disabled={activityTypes.length <= 1}
                                onClick={() => requestDeleteActivity(type.id)}
                                title={
                                  activityTypes.length <= 1
                                    ? "At least one activity type is required"
                                    : "Delete activity"
                                }
                                aria-label={`Delete ${type.name}`}
                              >
                                <Trash2 size={14} />
                              </Button>
                              <ChevronRight
                                size={16}
                                className="ml-1 text-[#c4c7d4]"
                                aria-hidden
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
                        <Search size={20} className="text-[#c4c7d4]" />
                        <p className="text-sm font-medium text-[#1c1e21]">No activities match your filter</p>
                        <p className="text-xs text-[#6b7280]">
                          Try a different keyword or clear the search.
                        </p>
                      </div>
                    )}
                  </div>

                </section>

                <Dialog
                  open={addActivityDialogOpen}
                  onOpenChange={(open) => {
                    setAddActivityDialogOpen(open);
                    if (!open) setActivityDraft(EMPTY_ACTIVITY_DRAFT);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Activity Type</DialogTitle>
                      <DialogDescription>
                        Define a new activity your team can log against deals.
                      </DialogDescription>
                    </DialogHeader>
                    <ActivityDraftForm draft={activityDraft} onChange={setActivityDraft} />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddActivityDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                        onClick={confirmAddActivity}
                      >
                        Add Type
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={editActivityDialogOpen}
                  onOpenChange={(open) => {
                    setEditActivityDialogOpen(open);
                    if (!open) setEditingActivityId(null);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Activity Type</DialogTitle>
                      <DialogDescription>
                        Update the name, description, icon, and default state.
                      </DialogDescription>
                    </DialogHeader>
                    <ActivityDraftForm draft={activityDraft} onChange={setActivityDraft} />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditActivityDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                        onClick={confirmEditActivity}
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={deleteActivityDialogOpen}
                  onOpenChange={(open) => {
                    setDeleteActivityDialogOpen(open);
                    if (!open) setDeletingActivityId(null);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete activity type?</DialogTitle>
                      <DialogDescription>
                        This will permanently remove
                        {deletingActivityType ? ` "${deletingActivityType.name}"` : " this activity"} from
                        the CRM. Past activity records keep their original label.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteActivityDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={confirmDeleteActivity}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityDraftForm({
  draft,
  onChange,
}: {
  draft: ActivityDraft;
  onChange: (next: ActivityDraft) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
          Activity Name
        </label>
        <Input
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="e.g. Call, Meeting, Email"
          className="h-9 border-[#e5e7eb] bg-white text-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
          Description
        </label>
        <Textarea
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          placeholder="Briefly describe when this activity is used"
          rows={3}
          className="resize-none border-[#e5e7eb] bg-white text-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
          Icon
        </label>
        <Select
          value={draft.icon}
          onValueChange={(value) => onChange({ ...draft, icon: value })}
        >
          <SelectTrigger className="h-9 border-[#e5e7eb] bg-white">
            <div className="flex items-center gap-2">
              <IconRenderer name={draft.icon} className="size-4 text-[#4080f0]" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_ICONS.map((i) => (
              <SelectItem key={i.name} value={i.name}>
                <span className="inline-flex items-center gap-2">
                  <i.icon className="size-4" />
                  {i.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
