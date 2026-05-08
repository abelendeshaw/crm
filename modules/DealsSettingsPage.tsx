"use client";

import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { mockDealStore } from "@/data/mockStore";
import { PipelineStage, ActivityType, CrmDeal } from "@/data/dealsManagementData";

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
  const [activeSection, setActiveSection] = useState<Tab>("stages");
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [dropTargetStageId, setDropTargetStageId] = useState<string | null>(null);
  const [hasUnsavedStageOrder, setHasUnsavedStageOrder] = useState(false);
  const [stageOrderFeedback, setStageOrderFeedback] = useState<string | null>(null);
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

  const handleStageDragStart = (event: React.DragEvent<HTMLButtonElement>, stageId: string) => {
    if (!isReorderMode) return;
    event.dataTransfer.effectAllowed = "move";
    setDraggedStageId(stageId);
  };

  const handleStageDrop = (targetStageId: string) => {
    if (!isReorderMode) return;
    if (!draggedStageId || draggedStageId === targetStageId) return;
    const ids = orderedStages.map((s) => s.id);
    const from = ids.indexOf(draggedStageId);
    const to = ids.indexOf(targetStageId);
    if (from < 0 || to < 0) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    reorderStagesByIds(next);
    setHasUnsavedStageOrder(true);
    setDraggedStageId(null);
    setDropTargetStageId(null);
  };

  const handleStageDragOverCard = (targetStageId: string) => {
    if (!isReorderMode || !draggedStageId) return;
    if (targetStageId === draggedStageId) return;
    setDropTargetStageId(targetStageId);
  };

  const saveStageOrder = () => {
    setIsReorderMode(false);
    setDraggedStageId(null);
    setDropTargetStageId(null);
    setHasUnsavedStageOrder(false);
    setStageOrderFeedback("Stage order saved.");
    setTimeout(() => setStageOrderFeedback(null), 2200);
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

  const addNewStage = () => {
    const newId = `stage-custom-${crypto.randomUUID()}`;
    const maxOrder = stages.reduce((max, s) => Math.max(max, s.order), -1);
    const newStage: PipelineStage = {
      id: newId,
      name: "New Stage",
      category: "open",
      order: maxOrder + 1,
      columnClass: STAGE_COLOR_PRESETS[1]!.columnClass,
      borderClass: STAGE_COLOR_PRESETS[1]!.borderClass,
    };
    saveStages([...stages, newStage]);
  };

  const deleteStage = (stageId: string) => {
    if (stages.length <= 1) return;
    const updated = stages.filter((s) => s.id !== stageId);
    saveStages(updated);
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
  const selectedStageDeals = selectedStage
    ? deals.filter((deal) => deal.stageId === selectedStage.id)
    : [];
  const selectedStageIndex = Math.max(
    0,
    orderedStages.findIndex((s) => s.id === selectedStage?.id),
  );
  const selectedStageProbability = Math.max(5, Math.min(95, (selectedStageIndex + 1) * 15));
  const stageDealCountById = new Map<string, number>();
  for (const deal of deals) {
    stageDealCountById.set(deal.stageId, (stageDealCountById.get(deal.stageId) ?? 0) + 1);
  }
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

      <div className="flex-1 overflow-hidden p-3 sm:p-5 bg-[#f5f6fa]">
        <div className="h-full overflow-y-auto no-scrollbar">
          <div className="w-full pb-4">
            {activeSection === "stages" ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                    <h1 className="text-3xl font-semibold text-[#1c1e21]">Deals Settings</h1>
                    <p className="text-base text-[#6b7280] mt-1">
                      Design and manage your sales flow architecture.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={() => {
                          if (!isReorderMode) {
                            setIsReorderMode(true);
                            return;
                          }
                          saveStageOrder();
                        }}
                        size="sm"
                        className={cn(
                          isReorderMode
                            ? "bg-[#4080f0] text-white hover:bg-[#3070e0]"
                            : "bg-white text-[#374151] border border-[#cbd5e1] hover:bg-[#f9fafb]"
                        )}
                        disabled={isReorderMode && !hasUnsavedStageOrder}
                      >
                        {isReorderMode ? (
                          <>
                            <CheckCheck size={14} className="mr-1.5" />
                            Save Order
                          </>
                        ) : (
                          <>
                            <GripVertical size={14} className="mr-1.5" />
                            Edit Order
                          </>
                        )}
                      </Button>
                      {isReorderMode && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 border-red-200 bg-red-50 px-2 text-xs text-red-600 hover:bg-red-100 hover:text-red-700"
                          onClick={() => {
                            setIsReorderMode(false);
                            setDraggedStageId(null);
                            setDropTargetStageId(null);
                            setHasUnsavedStageOrder(false);
                          }}
                        >
                          <X size={12} className="mr-1" />
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={addNewStage}
                      size="sm"
                      className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                    >
                      <Plus size={16} className="mr-1.5" />
                      New Stage
                    </Button>
                  </div>
                </div>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-[#1c1e21]">Pipeline Architecture</h3>
                    <Badge variant="outline" className="bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]">
                      Default Flow
                    </Badge>
                  </div>
                  <div className="overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex gap-4 min-w-max">
                      {orderedStages.map((stage, idx) => {
                        const isSelected = selectedStage?.id === stage.id;
                        const isDraggedCard = isReorderMode && draggedStageId === stage.id;
                        const shouldShiftLeft =
                          isReorderMode &&
                          draggedStageIndex >= 0 &&
                          dropTargetStageIndex >= 0 &&
                          draggedStageIndex < dropTargetStageIndex &&
                          idx > draggedStageIndex &&
                          idx <= dropTargetStageIndex;
                        const shouldShiftRight =
                          isReorderMode &&
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
                            draggable={isReorderMode}
                            onDragStart={(event) => handleStageDragStart(event, stage.id)}
                            onDragOver={(e) => {
                              if (!isReorderMode) return;
                              e.preventDefault();
                              handleStageDragOverCard(stage.id);
                            }}
                            onDrop={() => handleStageDrop(stage.id)}
                            onDragEnd={() => {
                              setDraggedStageId(null);
                              setDropTargetStageId(null);
                            }}
                            className={cn(
                              "flex flex-col w-64 rounded-xl p-4 text-left border transform-gpu transition-[transform,box-shadow,background-color,border-color,opacity] duration-300 ease-out",
                              isSelected
                                ? "border-[#4080f0] bg-[#eef2fd] shadow-sm"
                                : "border-[#e5e7eb] bg-white hover:border-[#cbd5e1]",
                              isDraggedCard && "opacity-0 scale-[0.98] ring-2 ring-[#93c5fd] shadow-lg",
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
                                className={cn(
                                  isReorderMode ? "text-[#4080f0] animate-pulse" : "text-[#c4c7d4]"
                                )}
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
                              <span className="text-xs text-[#6b7280]">
                                {stageDealCountById.get(stage.id) ?? 0} Deals
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={addNewStage}
                        className="flex flex-col w-64 border-2 border-dashed border-[#d1d5db] rounded-xl p-4 text-center items-center justify-center text-[#6b7280] hover:bg-[#f9fafb] transition-colors"
                      >
                        <Plus size={28} className="mb-2" />
                        <span className="font-semibold">Add Stage</span>
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                  <Card className="border-[#e5e7eb] shadow-none overflow-hidden">
                    <CardHeader className="bg-white border-b border-[#e5e7eb] pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Stage Settings: {selectedStage?.name ?? "N/A"}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Manage properties and requirements for this phase
                          </CardDescription>
                        </div>
                        {selectedStage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => deleteStage(selectedStage.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {selectedStage ? (
                        <>
                          <div className="pt-2 border-t border-[#e5e7eb]">
                            <div className="grid grid-cols-[340px,minmax(0,1fr)] gap-5 items-start">
                              <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 order-1">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-sm font-semibold text-[#1c1e21]">Stage Configuration</p>
                                  <Badge variant="outline" className="text-[10px]">
                                    Active Stage
                                  </Badge>
                                </div>
                                <div className="space-y-2.5">
                                  <div className="rounded-md border border-[#e5e7eb] bg-white p-3">
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                                      Stage Name
                                    </label>
                                    <Input
                                      value={selectedStage.name}
                                      onChange={(e) =>
                                        updateStage(selectedStage.id, { name: e.target.value })
                                      }
                                      className="mt-2 h-9 bg-white"
                                    />
                                  </div>
                                  <div className="rounded-md border border-[#e5e7eb] bg-white p-3">
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                                      Color
                                    </label>
                                    <Select
                                      value={String(
                                        Math.max(
                                          0,
                                          STAGE_COLOR_PRESETS.findIndex(
                                            (p) =>
                                              p.columnClass === selectedStage.columnClass &&
                                              p.borderClass === selectedStage.borderClass,
                                          ),
                                        ),
                                      )}
                                      onValueChange={(value) => setPreset(selectedStage.id, Number(value))}
                                    >
                                      <SelectTrigger className="mt-2 h-9 w-full border-[#e5e7eb] bg-white">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={cn(
                                              "size-3 rounded-full border",
                                              selectedStage.columnClass,
                                              selectedStage.borderClass,
                                            )}
                                          />
                                          <span className="text-sm text-[#374151]">
                                            {STAGE_COLOR_PRESETS[
                                              Math.max(
                                                0,
                                                STAGE_COLOR_PRESETS.findIndex(
                                                  (p) =>
                                                    p.columnClass === selectedStage.columnClass &&
                                                    p.borderClass === selectedStage.borderClass,
                                                ),
                                              )
                                            ]?.label ?? "Color"}
                                          </span>
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STAGE_COLOR_PRESETS.map((preset, index) => (
                                          <SelectItem key={preset.label} value={String(index)}>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className={cn(
                                                  "size-3 rounded-full border",
                                                  preset.columnClass,
                                                  preset.borderClass,
                                                )}
                                              />
                                              <span>{preset.label}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="rounded-md border border-[#e5e7eb] bg-white p-3">
                                    <label className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                                      Win Probability
                                    </label>
                                    <Input
                                      value={String(selectedStageProbability)}
                                      type="number"
                                      readOnly
                                      className="mt-2 h-9 bg-white"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3 order-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-[#1c1e21]">
                                    Deals in {selectedStage.name}
                                  </h4>
                                  <Badge variant="outline" className="text-[11px]">
                                    {selectedStageDeals.length} Active
                                  </Badge>
                                </div>
                                <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
                                  <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                                            Deal
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280] w-[200px]">
                                            Value
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280] w-[160px]">
                                            Probability
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
                                                <div className="flex items-center gap-3">
                                                  <div className="h-8 w-8 rounded-full bg-[#eef2fd] text-[#245fcb] text-xs font-semibold flex items-center justify-center">
                                                    {getStageInitials(deal.name)}
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <Input
                                                      value={deal.name}
                                                      onChange={(event) =>
                                                        updateDeal(deal.id, { name: event.target.value })
                                                      }
                                                      className="h-8 border-transparent bg-transparent px-2 text-sm font-medium text-[#1c1e21] hover:border-[#e5e7eb] focus:border-[#4080f0] focus:bg-white"
                                                    />
                                                    <p className="text-xs text-[#9ca3af] px-2">Pipeline deal</p>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                  <Input
                                                    type="number"
                                                    value={deal.value}
                                                    onChange={(event) =>
                                                      updateDeal(deal.id, {
                                                        value: Number(event.target.value || 0),
                                                      })
                                                    }
                                                    className="h-9 border-[#e5e7eb] bg-white text-sm"
                                                  />
                                                  <span className="text-xs text-[#6b7280]">{deal.currency}</span>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3">
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  max={100}
                                                  value={deal.probability}
                                                  onChange={(event) =>
                                                    updateDeal(deal.id, {
                                                      probability: Math.max(
                                                        0,
                                                        Math.min(100, Number(event.target.value || 0)),
                                                      ),
                                                    })
                                                  }
                                                  className="h-9 w-24 border-[#e5e7eb] bg-white text-sm"
                                                />
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={3} className="text-center text-sm text-[#6b7280] py-8">
                                              No deals in this stage.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline">Discard Changes</Button>
                            <Button className="bg-[#4080f0] text-white hover:bg-[#3070e0]">
                              Save Stage Configuration
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-[#6b7280]">Select a stage to configure settings.</p>
                      )}
                    </CardContent>
                  </Card>
                </section>
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
