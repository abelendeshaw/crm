"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileText,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  PSE_DOC_TYPES,
  createEmptyTemplateConfig,
  type ChecklistTemplateConfig,
  type OpportunityChecklistTemplate,
  type PseCustomDoc,
  type PseDocType,
} from "@/data/opportunityChecklistData";
import { mockLeadStore } from "@/data/mockStore";

function uid() {
  return `cdoc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Predefined doc toggle card ───────────────────────────────────────────────

function PredefinedDocCard({
  type,
  name,
  description,
  required,
  onToggle,
}: {
  type: PseDocType;
  name: string;
  description: string;
  required: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-colors",
        required
          ? "border-[#4080f0] bg-[#eef2fd]"
          : "border-[#e5e7eb] bg-white hover:border-[#c7d2fe]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
            required ? "border-[#4080f0] bg-[#4080f0]" : "border-[#d1d5db]",
          )}
        >
          {required && <Check size={11} className="text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", required ? "text-[#245fcb]" : "text-[#1c1e21]")}>
              {type}
            </span>
            {required && (
              <Badge variant="outline" className="border-[#bfdbfe] bg-white px-1.5 py-0 text-[10px] text-[#4080f0]">
                Required
              </Badge>
            )}
          </div>
          <p className={cn("mt-0.5 text-xs font-medium", required ? "text-[#245fcb]" : "text-[#374151]")}>
            {name.replace(`${type} — `, "")}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6b7280]">{description}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Custom doc card ──────────────────────────────────────────────────────────

function CustomDocCard({
  doc,
  onChange,
  onRemove,
}: {
  doc: PseCustomDoc;
  onChange: (next: PseCustomDoc) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
          Custom Document
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded text-[#9ca3af] hover:bg-rose-50 hover:text-rose-500"
        >
          <X size={13} />
        </button>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs text-[#6b7280]">Document Name *</Label>
          <Input
            value={doc.name}
            onChange={(e) => onChange({ ...doc, name: e.target.value })}
            placeholder="e.g. Technical Compliance Matrix"
            className="h-8 border-[#e5e7eb] text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[#6b7280]">Definition</Label>
          <Textarea
            value={doc.definition}
            onChange={(e) => onChange({ ...doc, definition: e.target.value })}
            placeholder="Describe what this document contains and when it is required..."
            className="min-h-[64px] border-[#e5e7eb] text-xs"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function OpportunityChecklistTemplateEditorPage({
  templateId,
}: {
  templateId: "new" | string;
}) {
  const router = useRouter();
  const isNew = templateId === "new";

  const initialTemplate = useMemo<OpportunityChecklistTemplate | null>(() => {
    if (isNew) return null;
    return mockLeadStore.checklistTemplates.find((t) => t.id === templateId) ?? null;
  }, [isNew, templateId]);

  const [name, setName] = useState(initialTemplate?.name ?? "New Checklist Template");
  const [description, setDescription] = useState(initialTemplate?.description ?? "");
  const [isDefault, setIsDefault] = useState(initialTemplate?.isDefault ?? false);
  const [config, setConfig] = useState<ChecklistTemplateConfig>(
    initialTemplate?.config ?? createEmptyTemplateConfig(),
  );

  const toggleRequired = (type: PseDocType) => {
    const has = config.requiredDocTypes.includes(type);
    setConfig((c) => ({
      ...c,
      requiredDocTypes: has
        ? c.requiredDocTypes.filter((d) => d !== type)
        : [...c.requiredDocTypes, type],
    }));
  };

  const addCustomDoc = () => {
    setConfig((c) => ({
      ...c,
      customDocs: [...c.customDocs, { id: uid(), name: "", definition: "" }],
    }));
  };

  const updateCustomDoc = (id: string, next: PseCustomDoc) => {
    setConfig((c) => ({
      ...c,
      customDocs: c.customDocs.map((d) => (d.id === id ? next : d)),
    }));
  };

  const removeCustomDoc = (id: string) => {
    setConfig((c) => ({ ...c, customDocs: c.customDocs.filter((d) => d.id !== id) }));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const current = mockLeadStore.checklistTemplates;

    if (isNew) {
      const wasDefault = isDefault || current.length === 0;
      const next: OpportunityChecklistTemplate = {
        id: `checklist-tpl-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        isDefault: wasDefault,
        order: current.length,
        config: { ...config, customDocs: config.customDocs.filter((d) => d.name.trim()) },
      };
      const updated = wasDefault
        ? [...current.map((t) => ({ ...t, isDefault: false })), next]
        : [...current, next];
      mockLeadStore.checklistTemplates = updated;
    } else {
      mockLeadStore.checklistTemplates = current.map((t) => {
        if (t.id !== templateId) return isDefault ? { ...t, isDefault: false } : t;
        return {
          ...t,
          name: name.trim(),
          description: description.trim() || undefined,
          isDefault,
          config: { ...config, customDocs: config.customDocs.filter((d) => d.name.trim()) },
        };
      });
    }

    router.push("/leads/settings?tab=checklistTemplates");
  };

  if (!isNew && !initialTemplate) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8f9fb]">
        <p className="text-sm text-[#6b7280]">Template not found.</p>
      </div>
    );
  }

  const totalDocs = config.requiredDocTypes.length + config.customDocs.filter((d) => d.name.trim()).length;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fb]">

      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-3 sm:px-6">
        <div>
          <button
            type="button"
            onClick={() => router.push("/leads/settings?tab=checklistTemplates")}
            className="mb-1 flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1c1e21]"
          >
            <ArrowLeft size={13} />
            Checklist Templates
          </button>
          <h2 className="text-sm font-semibold text-[#1c1e21]">
            {isNew ? "New Checklist Template" : name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isDefault
                  ? "border-[#bfdbfe] bg-[#eef2fd] text-[#4080f0]"
                  : "border-[#e5e7eb] text-[#6b7280]",
              )}
            >
              {isDefault ? "Default" : "Not default"}
            </Badge>
          )}
          <Button
            size="sm"
            className="bg-[#4080f0] text-white hover:bg-[#3070e0] disabled:opacity-50"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {isNew ? "Create Template" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-5">

          {/* Identity */}
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#1c1e21]">Template Identity</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Template Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 border-[#e5e7eb]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe when to use this template..."
                  className="min-h-[72px] border-[#e5e7eb] text-sm"
                />
              </div>
              <Separator className="bg-[#f0f2f7]" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#1c1e21]">Set as default template</p>
                  <p className="text-xs text-[#6b7280]">
                    Used automatically when starting a new opportunity checklist.
                  </p>
                </div>
                <Switch
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                  className="data-[state=checked]:bg-[#4080f0]"
                />
              </div>
            </div>
          </section>

          {/* PSE Deliverables */}
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1c1e21]">PSE Deliverable Documents</h3>
                <p className="mt-0.5 text-xs text-[#6b7280]">
                  Mark which standard documents the assigned PSE must attach. You can also define
                  custom document types specific to this template.
                </p>
              </div>
              {totalDocs > 0 && (
                <span className="shrink-0 text-xs font-semibold text-[#4080f0]">
                  {config.requiredDocTypes.length} required
                </span>
              )}
            </div>

            {/* Predefined types */}
            <div className="space-y-2">
              {PSE_DOC_TYPES.map((doc) => (
                <PredefinedDocCard
                  key={doc.type}
                  type={doc.type}
                  name={doc.name}
                  description={doc.description}
                  required={config.requiredDocTypes.includes(doc.type)}
                  onToggle={() => toggleRequired(doc.type)}
                />
              ))}
            </div>

            {/* Custom docs */}
            {config.customDocs.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Separator className="flex-1 bg-[#f0f2f7]" />
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                    Custom
                  </span>
                  <Separator className="flex-1 bg-[#f0f2f7]" />
                </div>
                {config.customDocs.map((doc) => (
                  <CustomDocCard
                    key={doc.id}
                    doc={doc}
                    onChange={(next) => updateCustomDoc(doc.id, next)}
                    onRemove={() => removeCustomDoc(doc.id)}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addCustomDoc}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#d1d5db] py-2.5 text-xs text-[#6b7280] hover:border-[#4080f0] hover:text-[#4080f0] transition-colors"
            >
              <Plus size={13} />
              Add custom document type
            </button>
          </section>

          {/* Summary */}
          {totalDocs > 0 && (
            <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#1c1e21]">Summary</h3>
              <div className="space-y-1.5">
                {PSE_DOC_TYPES.filter((d) => config.requiredDocTypes.includes(d.type)).map((d) => (
                  <div key={d.type} className="flex items-center gap-2 text-xs">
                    <Check size={12} className="shrink-0 text-emerald-500" />
                    <span className="font-medium text-[#1c1e21]">{d.type}</span>
                    <span className="text-[#6b7280]">{d.name.replace(`${d.type} — `, "")}</span>
                    <Badge variant="outline" className="ml-auto border-[#bfdbfe] bg-[#eef2fd] px-1.5 py-0 text-[10px] text-[#4080f0]">
                      Required
                    </Badge>
                  </div>
                ))}
                {config.customDocs.filter((d) => d.name.trim()).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-xs">
                    <FileText size={12} className="shrink-0 text-[#4080f0]" />
                    <span className="font-medium text-[#1c1e21]">{d.name}</span>
                    <Badge variant="outline" className="ml-auto border-[#e5e7eb] bg-[#f9fafb] px-1.5 py-0 text-[10px] text-[#6b7280]">
                      Custom
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
