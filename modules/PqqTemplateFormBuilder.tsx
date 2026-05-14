"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  type PqqTemplateField,
  type PqqTemplateFieldType,
  type PqqTemplateFormDefinition,
} from "@/data/pqqTemplateData";
import { cn } from "@/lib/utils";

const FIELD_TYPE_LABELS: Record<PqqTemplateFieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  number: "Number",
  checkbox: "Checkbox",
  select: "Dropdown",
  slider: "Slider",
};

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function PqqTemplateFormBuilder({
  value,
  onChange,
}: {
  value: PqqTemplateFormDefinition;
  onChange: (
    next:
      | PqqTemplateFormDefinition
      | ((current: PqqTemplateFormDefinition) => PqqTemplateFormDefinition),
  ) => void;
}) {
  const [activeStepId, setActiveStepId] = useState(() => value.steps[0]?.id ?? "discovery");

  const orderedSteps = sortByOrder(value.steps);
  const activeStep = orderedSteps.find((step) => step.id === activeStepId) ?? orderedSteps[0];
  const stepSections = sortByOrder(
    value.sections.filter((section) => section.stepId === activeStep?.id),
  );

  const commit = (
    next:
      | PqqTemplateFormDefinition
      | ((current: PqqTemplateFormDefinition) => PqqTemplateFormDefinition),
  ) => {
    onChange(next);
  };

  const addSection = () => {
    if (!activeStep) return;
    commit((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: `section-${crypto.randomUUID()}`,
          stepId: activeStep.id,
          title: "New section",
          order: current.sections.filter((section) => section.stepId === activeStep.id).length,
        },
      ],
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<PqqTemplateFormDefinition["sections"][0]>) => {
    commit((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section,
      ),
    }));
  };

  const removeSection = (sectionId: string) => {
    commit((current) => ({
      ...current,
      sections: current.sections.filter((section) => section.id !== sectionId),
      fields: current.fields.filter((field) => field.sectionId !== sectionId),
    }));
  };

  const addField = (sectionId: string, type: PqqTemplateFieldType) => {
    commit((current) => ({
      ...current,
      fields: [
        ...current.fields,
        {
          id: `field-${crypto.randomUUID()}`,
          sectionId,
          label: "New field",
          type,
          order: current.fields.filter((field) => field.sectionId === sectionId).length,
          options: type === "select" ? ["Option 1", "Option 2"] : undefined,
          min: type === "slider" ? 0 : undefined,
          max: type === "slider" ? 12 : undefined,
        },
      ],
    }));
  };

  const updateField = (fieldId: string, updates: Partial<PqqTemplateField>) => {
    commit((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field,
      ),
    }));
  };

  const removeField = (fieldId: string) => {
    commit((current) => ({
      ...current,
      fields: current.fields.filter((field) => field.id !== fieldId),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-[#e5e7eb] pb-3">
        {orderedSteps.map((step, index) => {
          const isActive = step.id === activeStep?.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-[#4080f0] bg-[#eef2fd] text-[#245fcb]"
                  : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#cbd5e1] hover:text-[#1c1e21]",
              )}
            >
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[#4080f0]">
                {index + 1}
              </span>
              {step.title}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#1c1e21]">{activeStep?.title}</p>
          <p className="text-xs text-[#6b7280]">
            Add sections and fields for this step. Reps complete these inputs when filling PQQ on a
            lead.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" className="border-[#e5e7eb]" onClick={addSection}>
          <Plus size={14} className="mr-1.5" />
          Add section
        </Button>
      </div>

      {stepSections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#d1d5db] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#1c1e21]">No sections yet</p>
          <p className="mt-1 text-xs text-[#6b7280]">
            Start with an empty {activeStep?.title.toLowerCase()} step and add the sections your team
            needs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stepSections.map((section) => {
            const sectionFields = sortByOrder(
              value.fields.filter((field) => field.sectionId === section.id),
            );
            return (
              <div
                key={section.id}
                className="rounded-lg border border-[#e5e7eb] bg-white p-4 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#6b7280]">Section title</Label>
                      <Input
                        value={section.title}
                        onChange={(event) =>
                          updateSection(section.id, { title: event.target.value })
                        }
                        className="h-9 border-[#e5e7eb]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#6b7280]">Section description</Label>
                      <Input
                        value={section.description ?? ""}
                        onChange={(event) =>
                          updateSection(section.id, {
                            description: event.target.value || undefined,
                          })
                        }
                        className="h-9 border-[#e5e7eb]"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-[#6b7280] hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeSection(section.id)}
                    aria-label={`Delete ${section.title}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="space-y-3">
                  {sectionFields.map((field) => (
                    <div
                      key={field.id}
                      className="rounded-lg border border-[#e5e7eb] bg-white p-3 space-y-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
                        <div className="sm:col-span-4 space-y-1.5">
                          <Label className="text-xs text-[#6b7280]">Field label</Label>
                          <Input
                            value={field.label}
                            onChange={(event) =>
                              updateField(field.id, { label: event.target.value })
                            }
                            className="h-9 border-[#e5e7eb] bg-white text-sm"
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                          <Label className="text-xs text-[#6b7280]">Field type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(nextType) =>
                              updateField(field.id, {
                                type: nextType as PqqTemplateFieldType,
                                options:
                                  nextType === "select"
                                    ? field.options ?? ["Option 1", "Option 2"]
                                    : undefined,
                                min: nextType === "slider" ? (field.min ?? 0) : undefined,
                                max: nextType === "slider" ? (field.max ?? 12) : undefined,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(FIELD_TYPE_LABELS).map(([type, label]) => (
                                <SelectItem key={type} value={type}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-4 space-y-1.5">
                          <Label className="text-xs text-[#6b7280]">Placeholder</Label>
                          <Input
                            value={field.placeholder ?? ""}
                            onChange={(event) =>
                              updateField(field.id, {
                                placeholder: event.target.value || undefined,
                              })
                            }
                            className="h-9 border-[#e5e7eb] bg-white text-sm"
                            placeholder="Optional"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-[#6b7280] hover:bg-red-50 hover:text-red-600"
                            onClick={() => removeField(field.id)}
                            aria-label={`Delete ${field.label}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>

                      {field.type === "select" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-[#6b7280]">Dropdown options</Label>
                          <Input
                            value={(field.options ?? []).join(", ")}
                            onChange={(event) =>
                              updateField(field.id, {
                                options: event.target.value
                                  .split(",")
                                  .map((option) => option.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="h-9 border-[#e5e7eb] bg-white text-sm"
                            placeholder="Option 1, Option 2"
                          />
                        </div>
                      )}

                      {field.type === "slider" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Minimum</Label>
                            <Input
                              type="number"
                              value={String(field.min ?? 0)}
                              onChange={(event) =>
                                updateField(field.id, {
                                  min: Number(event.target.value) || 0,
                                })
                              }
                              className="h-9 border-[#e5e7eb] bg-white text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Maximum</Label>
                            <Input
                              type="number"
                              value={String(field.max ?? 12)}
                              onChange={(event) =>
                                updateField(field.id, {
                                  max: Number(event.target.value) || 12,
                                })
                              }
                              className="h-9 border-[#e5e7eb] bg-white text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    Object.entries(FIELD_TYPE_LABELS) as [PqqTemplateFieldType, string][]
                  ).map(([type, label]) => (
                    <Button
                      key={type}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-[#e5e7eb] bg-white"
                      onClick={() => addField(section.id, type)}
                    >
                      <Plus size={13} className="mr-1" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
