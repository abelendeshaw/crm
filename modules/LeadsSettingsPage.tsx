"use client";

import { useEffect, useRef, useState } from "react";
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
  Kanban,
  Gauge,
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
  Tag,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { mockLeadStore } from "@/data/mockStore";
import {
  PipelineStage,
  ActivityType,
  type CrmLead,
  type LeadSource,
  leadCustomerAccounts,
} from "@/data/leadsManagementData";
import { PQQ_UI_ENABLED } from "@/lib/featureFlags";
import { LeadScoringSettingsSection } from "@/modules/LeadScoringSettingsSection";
import { LeadPqqTemplateSettingsSection } from "@/modules/LeadPqqTemplateSettingsSection";

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

type LeadSourceDraft = {
  name: string;
  description: string;
};

const EMPTY_SOURCE_DRAFT: LeadSourceDraft = {
  name: "",
  description: "",
};

function IconRenderer({ name, className }: { name: string; className?: string }) {
  const Icon = AVAILABLE_ICONS.find((i) => i.name === name)?.icon || ActivityIcon;
  return <Icon className={className} />;
}

type Tab = "stages" | "activities" | "sources" | "pqqTemplates" | "scoring";

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
  {
    id: "sources",
    label: "Lead Sources",
    icon: <Tag size={15} />,
  },
  {
    id: "pqqTemplates",
    label: "PQQ Templates",
    icon: <FileText size={15} />,
  },
  {
    id: "scoring",
    label: "Lead Scoring",
    icon: <Gauge size={15} />,
  },
];

const settingsTabs = PQQ_UI_ENABLED
  ? tabs
  : tabs.filter((tab) => tab.id !== "pqqTemplates");

export function LeadsSettingsPage() {
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
  const [deleteStageHasLeads, setDeleteStageHasLeads] = useState(false);
  const [addStageDialogOpen, setAddStageDialogOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStagePresetIndex, setNewStagePresetIndex] = useState("1");
  const [newStagePlacement, setNewStagePlacement] = useState("end");
  const [stageConfigDraft, setStageConfigDraft] = useState<{
    name: string;
    presetIndex: number;
    customColor: string;
    placementAfterStageId: string;
  } | null>(null);
  const dropTargetStageIdRef = useRef<string | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>(() =>
    [...mockLeadStore.stages].sort((a, b) => a.order - b.order),
  );
  const [leads, setLeads] = useState<CrmLead[]>(() => [...mockLeadStore.leads]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(() => [
    ...mockLeadStore.activityTypes,
  ]);
  const [activitySearchQuery, setActivitySearchQuery] = useState("");
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);
  const [editActivityDialogOpen, setEditActivityDialogOpen] = useState(false);
  const [deleteActivityDialogOpen, setDeleteActivityDialogOpen] = useState(false);
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(EMPTY_ACTIVITY_DRAFT);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [leadSources, setLeadSources] = useState<LeadSource[]>(() => [...mockLeadStore.leadSources]);
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false);
  const [editSourceDialogOpen, setEditSourceDialogOpen] = useState(false);
  const [deleteSourceDialogOpen, setDeleteSourceDialogOpen] = useState(false);
  const [sourceDraft, setSourceDraft] = useState<LeadSourceDraft>(EMPTY_SOURCE_DRAFT);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

  useEffect(() => {
    const unsubLeads = mockLeadStore.subscribeLeads((newLeads) => {
      setLeads([...newLeads]);
    });

    const unsubStages = mockLeadStore.subscribeStages((newStages) => {
      setStages([...newStages].sort((a, b) => a.order - b.order));
    });

    const unsubActivities = mockLeadStore.subscribeActivityTypes((newTypes) => {
      setActivityTypes([...newTypes]);
    });

    const unsubSources = mockLeadStore.subscribeLeadSources((newSources) => {
      setLeadSources([...newSources]);
    });

    return () => {
      unsubLeads();
      unsubStages();
      unsubActivities();
      unsubSources();
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
    const sorted = [...newStages].sort((a, b) => a.order - b.order);
    setStages(sorted);
    mockLeadStore.stages = sorted;
  };

  const saveActivityTypes = (newTypes: ActivityType[]) => {
    setActivityTypes([...newTypes]);
    mockLeadStore.activityTypes = newTypes;
  };

  const saveLeadSources = (newSources: LeadSource[]) => {
    const sorted = [...newSources].sort((a, b) => a.order - b.order);
    setLeadSources(sorted);
    mockLeadStore.leadSources = sorted;
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
      customColor: undefined,
    });
  };

  const setCustomStageColor = (stageId: string, hex: string) => {
    updateStage(stageId, { columnClass: "", borderClass: "", customColor: hex });
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
      id: `lead-stage-custom-${crypto.randomUUID()}`,
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
    if (leads.some((lead) => lead.stageId === stageId)) {
      setStageDetailsFeedback("Cannot delete this stage while it still contains leads.");
      return;
    }
    const updated = stages.filter((s) => s.id !== stageId);
    saveStages(updated);
    setStageDetailsFeedback(null);
  };

  const updateLead = (leadId: string, updates: Partial<CrmLead>) => {
    const updated = leads.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead));
    setLeads(updated);
    mockLeadStore.leads = updated;
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
      id: `lead-act-type-${crypto.randomUUID()}`,
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

  const openAddSourceDialog = () => {
    setSourceDraft(EMPTY_SOURCE_DRAFT);
    setAddSourceDialogOpen(true);
  };

  const confirmAddSource = () => {
    const trimmedName = sourceDraft.name.trim() || "New Source";
    const trimmedDescription = sourceDraft.description.trim();
    const newSource: LeadSource = {
      id: `lead-source-${crypto.randomUUID()}`,
      name: trimmedName,
      description: trimmedDescription || undefined,
      order: leadSources.length,
    };
    saveLeadSources([...leadSources, newSource]);
    setAddSourceDialogOpen(false);
  };

  const openEditSourceDialog = (id: string) => {
    const target = leadSources.find((source) => source.id === id);
    if (!target) return;
    setEditingSourceId(id);
    setSourceDraft({
      name: target.name,
      description: target.description ?? "",
    });
    setEditSourceDialogOpen(true);
  };

  const confirmEditSource = () => {
    if (!editingSourceId) return;
    const trimmedName = sourceDraft.name.trim() || "Untitled";
    const trimmedDescription = sourceDraft.description.trim();
    const next = leadSources.map((source) =>
      source.id === editingSourceId
        ? {
            ...source,
            name: trimmedName,
            description: trimmedDescription || undefined,
          }
        : source,
    );
    saveLeadSources(next);
    setEditSourceDialogOpen(false);
    setEditingSourceId(null);
  };

  const requestDeleteSource = (id: string) => {
    if (leadSources.length <= 1) return;
    setDeletingSourceId(id);
    setDeleteSourceDialogOpen(true);
  };

  const confirmDeleteSource = () => {
    if (!deletingSourceId) {
      setDeleteSourceDialogOpen(false);
      return;
    }
    if (leadSources.length <= 1) {
      setDeleteSourceDialogOpen(false);
      setDeletingSourceId(null);
      return;
    }
    if (leads.some((lead) => lead.sourceId === deletingSourceId)) {
      setDeleteSourceDialogOpen(false);
      setDeletingSourceId(null);
      return;
    }
    const next = leadSources.filter((source) => source.id !== deletingSourceId);
    saveLeadSources(next.map((source, index) => ({ ...source, order: index })));
    setDeleteSourceDialogOpen(false);
    setDeletingSourceId(null);
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
  const orderedLeadSources = [...leadSources].sort((a, b) => a.order - b.order);
  const normalizedSourceSearch = sourceSearchQuery.trim().toLowerCase();
  const filteredLeadSources = normalizedSourceSearch
    ? orderedLeadSources.filter(
        (source) =>
          source.name.toLowerCase().includes(normalizedSourceSearch) ||
          (source.description?.toLowerCase().includes(normalizedSourceSearch) ?? false),
      )
    : orderedLeadSources;
  const deletingActivityType = deletingActivityId
    ? activityTypes.find((t) => t.id === deletingActivityId) ?? null
    : null;
  const deletingLeadSource = deletingSourceId
    ? leadSources.find((source) => source.id === deletingSourceId) ?? null
    : null;
  const deletingSourceInUse = deletingSourceId
    ? leads.some((lead) => lead.sourceId === deletingSourceId)
    : false;
  const draggedStageIndex = draggedStageId
    ? orderedStages.findIndex((s) => s.id === draggedStageId)
    : -1;
  const dropTargetStageIndex = dropTargetStageId
    ? orderedStages.findIndex((s) => s.id === dropTargetStageId)
    : -1;
  const selectedStage = orderedStages.find((s) => s.id === selectedStageId) ?? orderedStages[0];
  const draggedStage = orderedStages.find((s) => s.id === draggedStageId) ?? null;
  const selectedStageLeads = selectedStage
    ? leads.filter((lead) => lead.stageId === selectedStage.id)
    : [];
  const selectedStageHasLeads = selectedStageLeads.length > 0;
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
  const currentColorHex = (() => {
    if (stageConfigDraft) {
      if (stageConfigDraft.customColor) return stageConfigDraft.customColor;
      const preset = STAGE_COLOR_PRESETS[stageConfigDraft.presetIndex];
      return preset?.borderClass.match(/#[0-9a-fA-F]{6}/)?.[0] ?? "#cccccc";
    }
    if (selectedStage?.customColor) return selectedStage.customColor;
    const preset = STAGE_COLOR_PRESETS[selectedStagePresetIndex];
    return preset?.borderClass.match(/#[0-9a-fA-F]{6}/)?.[0] ?? "#cccccc";
  })();
  const stageLeadCountById = new Map<string, number>();
  for (const lead of leads) {
    stageLeadCountById.set(lead.stageId, (stageLeadCountById.get(lead.stageId) ?? 0) + 1);
  }
  const customerNameById = new Map(leadCustomerAccounts.map((account) => [account.id, account.name]));
  const getStageInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-3 flex-shrink-0">
        <h1 className="font-semibold text-[#1c1e21]">Leads Settings</h1>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          {activeSection === "scoring"
            ? "Define rules to prioritize and qualify leads automatically."
            : activeSection === "sources"
              ? "Define the sources your team can assign when creating and qualifying leads."
              : "Configure lead pipeline stages and interaction types"}
        </p>

        {/* Tab Bar - same pattern as UserManagement */}
        <div className="mt-4 -mb-4 flex items-center gap-1 overflow-x-auto">
          {settingsTabs.map((tab) => (
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
            {activeSection === "stages" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="font-semibold text-[#1c1e21]">Leads Settings</h2>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      Design and manage your lead qualification flow.
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
                    <span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eef2fd] px-2.5 py-0.5 text-xs font-semibold text-[#4080f0]">
                      {orderedStages.length} stages
                    </span>
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
                            onMouseEnter={() => handleStageDragOverCard(stage.id)}
                            className={cn(
                              "flex flex-col w-64 rounded-xl p-4 text-left border transform-gpu transition-[transform,box-shadow,background-color,border-color,opacity] duration-300 ease-out cursor-pointer",
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
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                role="button"
                                tabIndex={-1}
                                aria-label="Drag stage to reorder"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleStageDragStart(stage.id, {
                                    x: event.clientX,
                                    y: event.clientY,
                                  });
                                }}
                                onClick={(event) => event.stopPropagation()}
                                className={cn(
                                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md cursor-grab hover:bg-[#f3f4f6]",
                                  isDraggedCard && "cursor-grabbing",
                                )}
                              >
                                <GripVertical
                                  size={16}
                                  className={cn(
                                    draggedStageId ? "text-[#4080f0] animate-pulse" : "text-[#c4c7d4]",
                                  )}
                                />
                              </span>
                              <h4 className="font-semibold text-[#1c1e21]">{stage.name}</h4>
                            </div>
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
                                {stageLeadCountById.get(stage.id) ?? 0} Leads
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
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical size={16} className="text-[#4080f0]" />
                        <h4 className="font-semibold text-[#1c1e21]">{draggedStage.name}</h4>
                      </div>
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
                          {stageLeadCountById.get(draggedStage.id) ?? 0} Leads
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                  <Card className="overflow-hidden border-0 bg-transparent shadow-none">
                    <CardHeader className="border-b border-[#e5e7eb] bg-white px-6 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="font-semibold text-[#1c1e21]">
                            Stage Settings{selectedStage ? `: ${selectedStage.name}` : ""}
                          </CardTitle>
                          <CardDescription className="mt-0 text-xs text-[#6b7280]">
                            Configure name, color, and position for this stage
                          </CardDescription>
                        </div>
                        {selectedStage && (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-8 gap-1.5",
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
                                    customColor: selectedStage.customColor ?? "",
                                    placementAfterStageId:
                                      currentIdx === 0
                                        ? ""
                                        : orderedStages[currentIdx - 1]?.id ?? "",
                                  });
                                  setIsStageConfigEditing(true);
                                  return;
                                }
                                if (!stageConfigDraft) return;
                                const nextName = stageConfigDraft.name.trim() || selectedStage.name;
                                updateStage(selectedStage.id, { name: nextName });
                                if (stageConfigDraft.customColor) {
                                  setCustomStageColor(selectedStage.id, stageConfigDraft.customColor);
                                } else {
                                  setPreset(selectedStage.id, stageConfigDraft.presetIndex);
                                }
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
                                setDeleteStageHasLeads(selectedStageHasLeads);
                                setDeleteStageDialogOpen(true);
                              }}
                              title="Delete stage"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-5 pt-4 sm:px-6">
                      {selectedStage ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
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

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                                Color
                              </label>
                              <label
                                className={cn(
                                  "flex h-9 w-full items-center gap-2.5 rounded-md border border-[#e5e7eb] bg-white px-3 text-sm",
                                  isStageConfigEditing ? "cursor-pointer" : "cursor-default opacity-70",
                                )}
                              >
                                <div
                                  className="h-4 w-4 shrink-0 rounded-full border"
                                  style={{
                                    backgroundColor: currentColorHex + "20",
                                    borderColor: currentColorHex,
                                  }}
                                />
                                <span className="font-mono text-xs text-[#1c1e21]">{currentColorHex}</span>
                                <input
                                  type="color"
                                  value={currentColorHex}
                                  onChange={(e) =>
                                    setStageConfigDraft((prev) =>
                                      prev ? { ...prev, customColor: e.target.value, presetIndex: -1 } : prev,
                                    )
                                  }
                                  disabled={!isStageConfigEditing}
                                  className="sr-only"
                                />
                              </label>
                              {isStageConfigEditing && (
                                <div className="flex gap-1.5 pt-0.5">
                                  {STAGE_COLOR_PRESETS.map((preset, index) => {
                                    const hex =
                                      preset.borderClass.match(/#[0-9a-fA-F]{6}/)?.[0] ?? "#cccccc";
                                    const isActive =
                                      stageConfigDraft?.presetIndex === index &&
                                      !stageConfigDraft?.customColor;
                                    return (
                                      <button
                                        key={index}
                                        type="button"
                                        title={preset.label}
                                        className={cn(
                                          "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                                          isActive
                                            ? "border-[#1c1e21] scale-110"
                                            : "border-transparent",
                                        )}
                                        style={{ backgroundColor: hex }}
                                        onClick={() =>
                                          setStageConfigDraft((prev) =>
                                            prev
                                              ? { ...prev, presetIndex: index, customColor: "" }
                                              : prev,
                                          )
                                        }
                                      />
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                                Position
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
                                    .map((stage, idx) => {
                                      const pos = idx + 2;
                                      const suffix =
                                        pos === 2 ? "nd" : pos === 3 ? "rd" : "th";
                                      return (
                                        <SelectItem key={stage.id} value={stage.id}>
                                          {pos}{suffix} — After &quot;{stage.name}&quot;
                                        </SelectItem>
                                      );
                                    })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {stageDetailsFeedback && (
                            <p className="text-xs text-[#245fcb]">{stageDetailsFeedback}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[#6b7280]">Select a stage to view details.</p>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <Dialog open={deleteStageDialogOpen} onOpenChange={setDeleteStageDialogOpen}>
                  <DialogContent>
                    {deleteStageHasLeads ? (
                      <>
                        <DialogHeader>
                          <DialogTitle>Cannot delete stage</DialogTitle>
                          <DialogDescription>
                            This stage has leads assigned to it. Move or remove those leads first, then try deleting
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
            )}
            {activeSection === "activities" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#1c1e21]">Activity Types</h2>
                    <p className="mt-1 max-w-2xl text-xs text-[#6b7280]">
                      Configure and prioritize the types of activities your team records in the CRM.
                      Use search to quickly find an activity, then edit or remove as needed.
                    </p>
                  </div>
                  <Button
                    onClick={openAddActivityDialog}
                    size="sm"
                    className="bg-[#4080f0] text-white hover:bg-[#3070e0] shadow-sm"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Add Type
                  </Button>
                </div>

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
                        Define a new activity your team can log against leads.
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
            {activeSection === "sources" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#1c1e21]">Lead Sources</h2>
                    <p className="mt-1 max-w-2xl text-xs text-[#6b7280]">
                      Define the channels and origins your team can assign when creating leads.
                    </p>
                  </div>
                  <Button
                    onClick={openAddSourceDialog}
                    size="sm"
                    className="bg-[#4080f0] text-white hover:bg-[#3070e0] shadow-sm"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Add Source
                  </Button>
                </div>

                <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#1c1e21]">Configured Sources</h3>
                    <span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eef2fd] px-2.5 py-0.5 text-xs font-semibold text-[#4080f0]">
                      {leadSources.length} source{leadSources.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="relative w-full max-w-sm">
                      <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                      />
                      <Input
                        value={sourceSearchQuery}
                        onChange={(event) => setSourceSearchQuery(event.target.value)}
                        placeholder="Filter sources..."
                        className="h-9 border-[#e5e7eb] bg-white pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="-mx-4 -mb-4 divide-y divide-[#e5e7eb] border-t border-[#e5e7eb] [&>*:last-child]:rounded-b-lg [&>*:last-child]:overflow-hidden">
                    {filteredLeadSources.length > 0 ? (
                      filteredLeadSources.map((source) => (
                        <div
                          key={source.id}
                          className="group flex items-center gap-4 bg-white px-4 py-3 transition-colors hover:bg-[#fafbff]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2fd]">
                            <Tag className="size-5 text-[#4080f0]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="truncate text-sm font-semibold text-[#1c1e21]">
                                {source.name}
                              </h4>
                              {source.isDefault && (
                                <Badge
                                  variant="outline"
                                  className="border-[#bfdbfe] bg-[#eef2fd] text-[10px] text-[#4080f0]"
                                >
                                  Default
                                </Badge>
                              )}
                            </div>
                            {source.description ? (
                              <p className="mt-0.5 line-clamp-1 text-xs text-[#6b7280]">
                                {source.description}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs italic text-[#9ca3af]">No description</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                              onClick={() => openEditSourceDialog(source.id)}
                              title="Edit source"
                              aria-label={`Edit ${source.name}`}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#6b7280] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                              disabled={leadSources.length <= 1}
                              onClick={() => requestDeleteSource(source.id)}
                              title={
                                leadSources.length <= 1
                                  ? "At least one lead source is required"
                                  : "Delete source"
                              }
                              aria-label={`Delete ${source.name}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
                        <Search size={20} className="text-[#c4c7d4]" />
                        <p className="text-sm font-medium text-[#1c1e21]">No sources match your filter</p>
                        <p className="text-xs text-[#6b7280]">
                          Try a different keyword or clear the search.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <Dialog
                  open={addSourceDialogOpen}
                  onOpenChange={(open) => {
                    setAddSourceDialogOpen(open);
                    if (!open) setSourceDraft(EMPTY_SOURCE_DRAFT);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Lead Source</DialogTitle>
                      <DialogDescription>
                        Define a new source your team can assign when creating leads.
                      </DialogDescription>
                    </DialogHeader>
                    <LeadSourceDraftForm draft={sourceDraft} onChange={setSourceDraft} />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddSourceDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                        onClick={confirmAddSource}
                      >
                        Add Source
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={editSourceDialogOpen}
                  onOpenChange={(open) => {
                    setEditSourceDialogOpen(open);
                    if (!open) setEditingSourceId(null);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Lead Source</DialogTitle>
                      <DialogDescription>
                        Update the source name and description shown during lead creation.
                      </DialogDescription>
                    </DialogHeader>
                    <LeadSourceDraftForm draft={sourceDraft} onChange={setSourceDraft} />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditSourceDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                        onClick={confirmEditSource}
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={deleteSourceDialogOpen}
                  onOpenChange={(open) => {
                    setDeleteSourceDialogOpen(open);
                    if (!open) setDeletingSourceId(null);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete lead source?</DialogTitle>
                      <DialogDescription>
                        {deletingSourceInUse
                          ? "This source is still assigned to one or more leads and cannot be removed."
                          : `This will permanently remove${
                              deletingLeadSource ? ` "${deletingLeadSource.name}"` : " this source"
                            } from the CRM.`}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteSourceDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={confirmDeleteSource}
                        disabled={deletingSourceInUse}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {PQQ_UI_ENABLED && activeSection === "pqqTemplates" && (
              <LeadPqqTemplateSettingsSection />
            )}
            {activeSection === "scoring" && <LeadScoringSettingsSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadSourceDraftForm({
  draft,
  onChange,
}: {
  draft: LeadSourceDraft;
  onChange: (next: LeadSourceDraft) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
          Source Name
        </label>
        <Input
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="e.g. Website, Referral, Partner"
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
          placeholder="Briefly describe when this source is used"
          rows={3}
          className="resize-none border-[#e5e7eb] bg-white text-sm"
        />
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
