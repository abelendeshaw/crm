"use client";

import { useCallback, useState } from "react";
import { TabbedSettingsPageSkeleton } from "@/components/loading/skeleton-screens";
import { usePageLoading } from "@/hooks/usePageLoading";
import { useRouter } from "next/navigation";
import {
  AlignLeft,
  ArrowLeft,
  Check,
  CheckSquare,
  GripVertical,
  Hash,
  List,
  Plus,
  Settings2,
  SlidersHorizontal,
  Star,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { mockLeadStore } from "@/data/mockStore";
import {
  clonePqqFormDefinition,
  createEmptyPqqFormDefinition,
  createPqqTemplateWorksheet,
  getTemplateFormDefinition,
  type DealPqqTemplate,
  type PqqTemplateField,
  type PqqTemplateFieldType,
  type PqqTemplateFormDefinition,
  type PqqTemplateSection,
} from "@/data/pqqTemplateData";

const FIELD_TYPE_CONFIG: {
  type: PqqTemplateFieldType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { type: "text", label: "Short Text", icon: Type, description: "Single-line answer" },
  { type: "textarea", label: "Long Text", icon: AlignLeft, description: "Multi-line answer" },
  { type: "number", label: "Number", icon: Hash, description: "Numeric input" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Yes / No toggle" },
  { type: "select", label: "Dropdown", icon: List, description: "Pick from a list" },
  { type: "slider", label: "Slider", icon: SlidersHorizontal, description: "Range value (e.g. 0–12)" },
];

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function FieldIcon({ type, className }: { type: PqqTemplateFieldType; className?: string }) {
  const Icon = FIELD_TYPE_CONFIG.find((c) => c.type === type)?.icon ?? Type;
  return <Icon className={className} />;
}

type Selected =
  | { kind: "field"; fieldId: string }
  | { kind: "section"; sectionId: string }
  | null;

export function PqqFormBuilderPage({ templateId }: { templateId?: string }) {
  const isPageLoading = usePageLoading();
  const router = useRouter();
  const isEditing = Boolean(templateId);

  const resolveTemplate = (): DealPqqTemplate | null =>
    templateId ? (mockLeadStore.pqqTemplates.find((t) => t.id === templateId) ?? null) : null;

  const [name, setName] = useState(() => resolveTemplate()?.name ?? "New PQQ Template");
  const [description, setDescription] = useState(
    () => resolveTemplate()?.description ?? "",
  );
  const [isDefault, setIsDefault] = useState(() => resolveTemplate()?.isDefault ?? false);
  const [formDef, setFormDef] = useState<PqqTemplateFormDefinition>(() => {
    const t = resolveTemplate();
    return t ? getTemplateFormDefinition(t) : createEmptyPqqFormDefinition();
  });
  const [activeStepId, setActiveStepId] = useState(
    () => formDef.steps[0]?.id ?? "discovery",
  );
  const [selected, setSelected] = useState<Selected>(null);

  const orderedSteps = sortByOrder(formDef.steps);
  const activeStep = orderedSteps.find((s) => s.id === activeStepId) ?? orderedSteps[0];
  const stepSections = sortByOrder(
    formDef.sections.filter((s) => s.stepId === activeStep?.id),
  );
  const lastSection = stepSections[stepSections.length - 1] ?? null;

  const commit = useCallback(
    (
      next:
        | PqqTemplateFormDefinition
        | ((cur: PqqTemplateFormDefinition) => PqqTemplateFormDefinition),
    ) => {
      setFormDef((cur) => (typeof next === "function" ? next(cur) : next));
    },
    [],
  );

  // Section helpers
  const addSection = () => {
    if (!activeStep) return;
    const newId = `section-${crypto.randomUUID()}`;
    commit((cur) => ({
      ...cur,
      sections: [
        ...cur.sections,
        {
          id: newId,
          stepId: activeStep.id,
          title: "New Section",
          order: cur.sections.filter((s) => s.stepId === activeStep.id).length,
        },
      ],
    }));
    setSelected({ kind: "section", sectionId: newId });
  };

  const updateSection = (id: string, updates: Partial<PqqTemplateSection>) => {
    commit((cur) => ({
      ...cur,
      sections: cur.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const removeSection = (id: string) => {
    commit((cur) => ({
      ...cur,
      sections: cur.sections.filter((s) => s.id !== id),
      fields: cur.fields.filter((f) => f.sectionId !== id),
    }));
    if (selected?.kind === "section" && selected.sectionId === id) setSelected(null);
  };

  // Field helpers
  const addField = (sectionId: string, type: PqqTemplateFieldType) => {
    const newId = `field-${crypto.randomUUID()}`;
    const label = FIELD_TYPE_CONFIG.find((c) => c.type === type)?.label ?? "New field";
    commit((cur) => ({
      ...cur,
      fields: [
        ...cur.fields,
        {
          id: newId,
          sectionId,
          label,
          type,
          order: cur.fields.filter((f) => f.sectionId === sectionId).length,
          options: type === "select" ? ["Option 1", "Option 2"] : undefined,
          min: type === "slider" ? 0 : undefined,
          max: type === "slider" ? 12 : undefined,
        },
      ],
    }));
    setSelected({ kind: "field", fieldId: newId });
  };

  const updateField = (id: string, updates: Partial<PqqTemplateField>) => {
    commit((cur) => ({
      ...cur,
      fields: cur.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const removeField = (id: string) => {
    commit((cur) => ({ ...cur, fields: cur.fields.filter((f) => f.id !== id) }));
    if (selected?.kind === "field" && selected.fieldId === id) setSelected(null);
  };

  const handleSave = () => {
    const trimmedName = name.trim() || "Untitled template";
    const stored = mockLeadStore.pqqTemplates;

    if (isEditing && templateId) {
      mockLeadStore.pqqTemplates = stored
        .map((t) =>
          t.id === templateId
            ? {
                ...t,
                name: trimmedName,
                description: description.trim() || undefined,
                isDefault,
                formDefinition: clonePqqFormDefinition(formDef),
              }
            : isDefault
              ? { ...t, isDefault: false }
              : t,
        )
        .sort((a, b) => a.order - b.order);
    } else {
      const next: DealPqqTemplate = {
        id: `pqq-template-${crypto.randomUUID()}`,
        name: trimmedName,
        description: description.trim() || undefined,
        isDefault,
        order: stored.length,
        worksheet: createPqqTemplateWorksheet(),
        formDefinition: clonePqqFormDefinition(formDef),
      };
      mockLeadStore.pqqTemplates = isDefault
        ? [...stored.map((t) => ({ ...t, isDefault: false })), next]
        : [...stored, next];
    }

    router.push("/leads/settings");
  };

  const selectedField =
    selected?.kind === "field"
      ? formDef.fields.find((f) => f.id === selected.fieldId) ?? null
      : null;
  const selectedSection =
    selected?.kind === "section"
      ? formDef.sections.find((s) => s.id === selected.sectionId) ?? null
      : null;

  const totalFields = formDef.fields.length;
  const totalSections = formDef.sections.length;

  if (isPageLoading) {
    return <TabbedSettingsPageSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex h-[48px] shrink-0 items-center gap-1 border-b border-[#e5e7eb] bg-white px-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-[12px] text-[#6b7280] hover:text-[#1c1e21]"
          onClick={() => router.push("/leads/settings")}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full bg-transparent text-sm font-semibold text-[#1c1e21] outline-none placeholder:text-[#9ca3af]"
            placeholder="Template name"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full bg-transparent text-xs text-[#6b7280] outline-none placeholder:text-[#c4c7d4]"
            placeholder="Add a description (optional)"
          />
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <Switch
              checked={isDefault}
              onCheckedChange={setIsDefault}
              className="data-[state=checked]:bg-[#4080f0]"
            />
            <span className="flex items-center gap-1 text-xs text-[#6b7280]">
              <Star size={11} />
              Default
            </span>
          </label>
          <Button
            size="sm"
            className="gap-1.5 bg-[#4080f0] text-white shadow-sm hover:bg-[#3070e0]"
            onClick={handleSave}
          >
            <Check size={14} />
            {isEditing ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar ─ field palette + steps */}
        <aside className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-[#e5e7eb] bg-white">
          {/* Field palette */}
          <div className="border-b border-[#e5e7eb] p-3">
            <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              Add Field
            </p>
            <div className="space-y-0.5">
              {FIELD_TYPE_CONFIG.map(({ type, label, icon: Icon, description: desc }) => (
                <button
                  key={type}
                  type="button"
                  disabled={!lastSection}
                  title={lastSection ? `Add ${label} to last section` : "Add a section first"}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    lastSection
                      ? "text-[#1c1e21] hover:bg-[#f3f4f6]"
                      : "cursor-not-allowed opacity-40",
                  )}
                  onClick={() => lastSection && addField(lastSection.id, type)}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#eef2fd]">
                    <Icon size={14} className="text-[#4080f0]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight">{label}</p>
                    <p className="text-[10px] leading-tight text-[#9ca3af]">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Steps overview */}
          <div className="flex-1 p-3">
            <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              Steps
            </p>
            <div className="space-y-0.5">
              {orderedSteps.map((step, idx) => {
                const secs = formDef.sections.filter((s) => s.stepId === step.id);
                const flds = formDef.fields.filter((f) =>
                  secs.some((s) => s.id === f.sectionId),
                );
                const active = step.id === activeStep?.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStepId(step.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active
                        ? "bg-[#eef2fd] text-[#245fcb]"
                        : "text-[#4b5563] hover:bg-[#f3f4f6]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        active ? "bg-[#4080f0] text-white" : "bg-[#e5e7eb] text-[#6b7280]",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{step.title}</p>
                      <p className="text-[10px] text-[#9ca3af]">
                        {secs.length}s · {flds.length}f
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stats */}
            <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-center">
              <p className="text-[11px] text-[#6b7280]">
                <span className="font-semibold text-[#1c1e21]">{totalSections}</span> sections ·{" "}
                <span className="font-semibold text-[#1c1e21]">{totalFields}</span> fields
              </p>
            </div>
          </div>
        </aside>

        {/* Center canvas */}
        <main
          className="flex-1 overflow-y-auto bg-[#f5f6fa] px-6 py-5"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="mx-auto max-w-2xl space-y-4">
            {/* Step tabs */}
            <div className="flex items-center gap-2">
              {orderedSteps.map((step, idx) => {
                const active = step.id === activeStep?.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStepId(step.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-[#4080f0] bg-[#eef2fd] text-[#245fcb]"
                        : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#cbd5e1] hover:text-[#1c1e21]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold",
                        active ? "bg-[#4080f0] text-white" : "bg-[#e5e7eb] text-[#6b7280]",
                      )}
                    >
                      {idx + 1}
                    </span>
                    {step.title}
                  </button>
                );
              })}
            </div>

            {/* Empty state */}
            {stepSections.length === 0 ? (
              <button
                type="button"
                className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d1d5db] bg-white py-16 transition-colors hover:border-[#4080f0] hover:bg-[#f8f9ff]"
                onClick={addSection}
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef2fd]">
                  <Plus size={22} className="text-[#4080f0]" />
                </span>
                <p className="text-sm font-semibold text-[#1c1e21]">Add your first section</p>
                <p className="mt-1 text-xs text-[#6b7280]">Group related fields in sections</p>
              </button>
            ) : (
              <>
                {stepSections.map((section) => {
                  const sectionFields = sortByOrder(
                    formDef.fields.filter((f) => f.sectionId === section.id),
                  );
                  const isSectionSel =
                    selected?.kind === "section" && selected.sectionId === section.id;

                  return (
                    <div
                      key={section.id}
                      className={cn(
                        "overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow",
                        isSectionSel
                          ? "border-[#4080f0] ring-2 ring-[#4080f0]/10"
                          : "border-[#e5e7eb] hover:shadow-md",
                      )}
                    >
                      {/* Section header */}
                      <div
                        className={cn(
                          "flex cursor-pointer items-center gap-3 border-b px-4 py-3 transition-colors",
                          isSectionSel
                            ? "border-[#bfdbfe] bg-[#eff6ff]"
                            : "border-[#f0f2f7] bg-[#f9fafb] hover:bg-[#f3f4f6]",
                        )}
                        onClick={() =>
                          setSelected(
                            isSectionSel ? null : { kind: "section", sectionId: section.id },
                          )
                        }
                      >
                        <GripVertical size={13} className="shrink-0 text-[#c4c7d4]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1c1e21]">
                            {section.title || <span className="italic text-[#9ca3af]">Untitled section</span>}
                          </p>
                          {section.description && (
                            <p className="mt-0.5 text-xs text-[#6b7280]">{section.description}</p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-[#e5e7eb] bg-white text-[10px] text-[#6b7280]"
                        >
                          {sectionFields.length} field{sectionFields.length !== 1 ? "s" : ""}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-[#c4c7d4] hover:bg-red-50 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(section.id);
                          }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>

                      {/* Fields */}
                      <div className="divide-y divide-[#f0f2f7]">
                        {sectionFields.length === 0 ? (
                          <p className="px-4 py-5 text-center text-xs text-[#9ca3af]">
                            No fields yet — use the buttons below or the field palette on the left
                          </p>
                        ) : (
                          sectionFields.map((field) => {
                            const isFieldSel =
                              selected?.kind === "field" && selected.fieldId === field.id;
                            return (
                              <div
                                key={field.id}
                                className={cn(
                                  "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
                                  isFieldSel ? "bg-[#eff6ff]" : "hover:bg-[#fafbff]",
                                )}
                                onClick={() =>
                                  setSelected(
                                    isFieldSel ? null : { kind: "field", fieldId: field.id },
                                  )
                                }
                              >
                                <GripVertical size={13} className="shrink-0 text-[#d1d5db]" />
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f3f4f6]">
                                  <FieldIcon
                                    type={field.type}
                                    className="size-3.5 text-[#6b7280]"
                                  />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-sm font-medium text-[#1c1e21]">
                                      {field.label}
                                    </span>
                                    {field.required && (
                                      <span className="text-xs font-bold text-red-400">*</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#9ca3af]">
                                    {FIELD_TYPE_CONFIG.find((c) => c.type === field.type)?.label}
                                    {field.placeholder ? ` · "${field.placeholder}"` : ""}
                                    {field.type === "slider"
                                      ? ` · ${field.min ?? 0}–${field.max ?? 12}`
                                      : ""}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#d1d5db] transition-colors hover:bg-red-50 hover:text-red-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeField(field.id);
                                  }}
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add field row */}
                      <div className="flex flex-wrap gap-1.5 border-t border-[#f0f2f7] bg-[#f9fafb] px-4 py-2.5">
                        {FIELD_TYPE_CONFIG.map(({ type, label, icon: Icon }) => (
                          <button
                            key={type}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-medium text-[#6b7280] transition-colors hover:border-[#4080f0] hover:text-[#4080f0]"
                            onClick={() => addField(section.id, type)}
                          >
                            <Icon size={10} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Add section button */}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d1d5db] bg-transparent py-4 text-sm font-medium text-[#9ca3af] transition-colors hover:border-[#4080f0] hover:text-[#4080f0]"
                  onClick={addSection}
                >
                  <Plus size={15} />
                  Add Section
                </button>
              </>
            )}
          </div>
        </main>

        {/* Right panel — properties */}
        {selected && (
          <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-[#e5e7eb] bg-white">
            {selectedField && (
              <>
                <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#eef2fd]">
                      <FieldIcon type={selectedField.type} className="size-3.5 text-[#4080f0]" />
                    </span>
                    <p className="text-sm font-semibold text-[#1c1e21]">Field Properties</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#9ca3af] hover:text-[#1c1e21]"
                    onClick={() => setSelected(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {/* Label */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#6b7280]">Label</Label>
                    <Input
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      className="h-9 border-[#e5e7eb] text-sm"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#6b7280]">Field Type</Label>
                    <Select
                      value={selectedField.type}
                      onValueChange={(nextType) =>
                        updateField(selectedField.id, {
                          type: nextType as PqqTemplateFieldType,
                          options:
                            nextType === "select"
                              ? (selectedField.options ?? ["Option 1", "Option 2"])
                              : undefined,
                          min: nextType === "slider" ? (selectedField.min ?? 0) : undefined,
                          max: nextType === "slider" ? (selectedField.max ?? 12) : undefined,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 border-[#e5e7eb] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPE_CONFIG.map(({ type, label }) => (
                          <SelectItem key={type} value={type}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Placeholder */}
                  {selectedField.type !== "checkbox" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#6b7280]">
                        Placeholder{" "}
                        <span className="font-normal text-[#9ca3af]">(optional)</span>
                      </Label>
                      <Input
                        value={selectedField.placeholder ?? ""}
                        onChange={(e) =>
                          updateField(selectedField.id, {
                            placeholder: e.target.value || undefined,
                          })
                        }
                        className="h-9 border-[#e5e7eb] text-sm"
                        placeholder="Hint shown to reps"
                      />
                    </div>
                  )}

                  {/* Required toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-[#e5e7eb] px-3 py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-[#1c1e21]">Required</p>
                      <p className="text-[11px] text-[#9ca3af]">Reps must complete this field</p>
                    </div>
                    <Switch
                      checked={selectedField.required ?? false}
                      onCheckedChange={(v) => updateField(selectedField.id, { required: v })}
                      className="data-[state=checked]:bg-[#4080f0]"
                    />
                  </div>

                  {/* Dropdown options */}
                  {selectedField.type === "select" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-[#6b7280]">Options</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-0.5 px-2 text-[11px] text-[#4080f0] hover:bg-[#eef2fd]"
                          onClick={() =>
                            updateField(selectedField.id, {
                              options: [
                                ...(selectedField.options ?? []),
                                `Option ${(selectedField.options?.length ?? 0) + 1}`,
                              ],
                            })
                          }
                        >
                          <Plus size={11} />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {(selectedField.options ?? []).map((opt, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const next = [...(selectedField.options ?? [])];
                                next[i] = e.target.value;
                                updateField(selectedField.id, { options: next });
                              }}
                              className="h-8 border-[#e5e7eb] text-xs"
                            />
                            <button
                              type="button"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#c4c7d4] transition-colors hover:bg-red-50 hover:text-red-400"
                              onClick={() =>
                                updateField(selectedField.id, {
                                  options: (selectedField.options ?? []).filter((_, j) => j !== i),
                                })
                              }
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slider range */}
                  {selectedField.type === "slider" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-[#6b7280]">Minimum</Label>
                        <Input
                          type="number"
                          value={String(selectedField.min ?? 0)}
                          onChange={(e) =>
                            updateField(selectedField.id, { min: Number(e.target.value) })
                          }
                          className="h-9 border-[#e5e7eb] text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-[#6b7280]">Maximum</Label>
                        <Input
                          type="number"
                          value={String(selectedField.max ?? 12)}
                          onChange={(e) =>
                            updateField(selectedField.id, { max: Number(e.target.value) })
                          }
                          className="h-9 border-[#e5e7eb] text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <Separator />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeField(selectedField.id)}
                  >
                    <Trash2 size={13} className="mr-1.5" />
                    Remove Field
                  </Button>
                </div>
              </>
            )}

            {selectedSection && (
              <>
                <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f3f4f6]">
                      <Settings2 size={14} className="text-[#6b7280]" />
                    </span>
                    <p className="text-sm font-semibold text-[#1c1e21]">Section Properties</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#9ca3af] hover:text-[#1c1e21]"
                    onClick={() => setSelected(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#6b7280]">Section Title</Label>
                    <Input
                      value={selectedSection.title}
                      onChange={(e) =>
                        updateSection(selectedSection.id, { title: e.target.value })
                      }
                      className="h-9 border-[#e5e7eb] text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#6b7280]">
                      Description{" "}
                      <span className="font-normal text-[#9ca3af]">(optional)</span>
                    </Label>
                    <Textarea
                      value={selectedSection.description ?? ""}
                      onChange={(e) =>
                        updateSection(selectedSection.id, {
                          description: e.target.value || undefined,
                        })
                      }
                      rows={3}
                      className="resize-none border-[#e5e7eb] text-sm"
                      placeholder="Brief context shown to reps"
                    />
                  </div>

                  <Separator />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeSection(selectedSection.id)}
                  >
                    <Trash2 size={13} className="mr-1.5" />
                    Remove Section
                  </Button>
                </div>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
