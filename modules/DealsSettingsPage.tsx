"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon,
  LayoutGrid,
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
import { PipelineStage, PipelineStageCategory, ActivityType } from "@/data/dealsManagementData";

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

export function DealsSettingsPage() {
  const [activeSection, setActiveSection] = useState<"stages" | "activities">("stages");
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);

  useEffect(() => {
    setStages([...mockDealStore.stages].sort((a, b) => a.order - b.order));
    setActivityTypes([...mockDealStore.activityTypes]);
    
    const unsubStages = mockDealStore.subscribeStages((newStages) => {
      setStages([...newStages].sort((a, b) => a.order - b.order));
    });

    const unsubActivities = mockDealStore.subscribeActivityTypes((newTypes) => {
      setActivityTypes([...newTypes]);
    });

    return () => {
      unsubStages();
      unsubActivities();
    };
  }, []);

  const saveStages = (newStages: PipelineStage[]) => {
    mockDealStore.stages = newStages;
  };

  const saveActivityTypes = (newTypes: ActivityType[]) => {
    mockDealStore.activityTypes = newTypes;
  };

  // Stage Helpers
  const moveStage = (stageId: string, dir: -1 | 1) => {
    const list = [...stages].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((s) => s.id === stageId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    const a = list[idx]!;
    const b = list[swap]!;
    const updated = stages.map((s) => {
      if (s.id === a.id) return { ...s, order: b.order };
      if (s.id === b.id) return { ...s, order: a.order };
      return s;
    });
    saveStages(updated);
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
    const newId = `stage-custom-${Date.now()}`;
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

  // Activity Helpers
  const addActivityType = () => {
    const newType: ActivityType = {
      id: `act-type-${Date.now()}`,
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Matched Header from DealsManagementPage */}
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">Deals Settings</h1>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          Configure sales pipeline stages and interaction types
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 sm:p-8 gap-8 bg-[#f5f6fa]">
        {/* Floating Sub Sidebar (No Shadow) */}
        <div className="w-64 flex-shrink-0">
          <Card className="border-[#e5e7eb] shadow-none sticky top-0 overflow-hidden bg-white">
            <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                Management
              </p>
            </div>
            <nav className="p-2 space-y-1">
              <Button
                variant="ghost"
                onClick={() => setActiveSection("stages")}
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                  activeSection === "stages"
                    ? "bg-[#eef2fd] text-[#4080f0] hover:bg-[#eef2fd] hover:text-[#4080f0] border border-[#dbeafe]"
                    : "text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1c1e21] border border-transparent"
                )}
              >
                <Workflow size={18} />
                Pipeline Stages
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveSection("activities")}
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                  activeSection === "activities"
                    ? "bg-[#eef2fd] text-[#4080f0] hover:bg-[#eef2fd] hover:text-[#4080f0] border border-[#dbeafe]"
                    : "text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1c1e21] border border-transparent"
                )}
              >
                <ListTodo size={18} />
                Activity Types
              </Button>
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-4xl pb-10">
            {activeSection === "stages" ? (
              <div className="space-y-6">
                <Card className="border-[#e5e7eb] shadow-none overflow-hidden">
                  <CardHeader className="bg-white border-b border-[#e5e7eb] pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Pipeline Stages</CardTitle>
                        <CardDescription className="text-xs">
                          Organize your sales journey from first contact to closing.
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={addNewStage}
                        size="sm" 
                        className="bg-[#4080f0] text-white hover:bg-[#3070e0] shadow-sm"
                      >
                        <Plus size={16} className="mr-1.5" />
                        Add Stage
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-[#f9fafb]">
                        <TableRow className="hover:bg-transparent border-[#e5e7eb]">
                          <TableHead className="px-6 py-3 font-medium w-12">#</TableHead>
                          <TableHead className="px-6 py-3 font-medium">Stage Name</TableHead>
                          <TableHead className="px-6 py-3 font-medium w-[160px]">Category</TableHead>
                          <TableHead className="px-6 py-3 font-medium w-[140px]">Color</TableHead>
                          <TableHead className="px-6 py-3 font-right text-right w-[140px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stages.map((stage, idx) => (
                          <TableRow key={stage.id} className="hover:bg-[#fcfcff] group border-[#e5e7eb]">
                            <TableCell className="px-6 py-4 text-[#9ca3af] font-mono text-xs">{idx + 1}</TableCell>
                            <TableCell className="px-6 py-4">
                              <Input
                                value={stage.name}
                                onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                                className="h-9 border-transparent hover:border-[#e5e7eb] focus:border-[#4080f0] bg-transparent focus:bg-white transition-all text-xs"
                              />
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Select
                                value={stage.category}
                                onValueChange={(v) => updateStage(stage.id, { category: v as PipelineStageCategory })}
                              >
                                <SelectTrigger className="h-9 border-transparent hover:border-[#e5e7eb] bg-transparent text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open" className="text-xs">Open</SelectItem>
                                  <SelectItem value="won" className="text-xs">Won</SelectItem>
                                  <SelectItem value="lost" className="text-xs">Lost</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Select
                                value={String(
                                  Math.max(
                                    0,
                                    STAGE_COLOR_PRESETS.findIndex(
                                      (p) =>
                                        p.columnClass === stage.columnClass &&
                                        p.borderClass === stage.borderClass,
                                    ),
                                  ),
                                )}
                                onValueChange={(v) => setPreset(stage.id, Number(v))}
                              >
                                <SelectTrigger className="h-9 border-transparent hover:border-[#e5e7eb] bg-transparent text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className={`size-3 rounded-full ${stage.columnClass} border ${stage.borderClass}`} />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {STAGE_COLOR_PRESETS.map((p, i) => (
                                    <SelectItem key={p.label} value={String(i)} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <div className={`size-3 rounded-full ${p.columnClass} border ${p.borderClass}`} />
                                        {p.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={idx === 0} onClick={() => moveStage(stage.id, -1)}><ChevronUp size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={idx === stages.length - 1} onClick={() => moveStage(stage.id, 1)}><ChevronDown size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => deleteStage(stage.id)}><Trash2 size={14} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
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
