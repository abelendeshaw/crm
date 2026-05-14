"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PQQ_MAX_TOTAL,
} from "@/data/dealsManagementData";
import {
  clampPqqDecisionThreshold,
  cloneDealPqq,
  clonePqqFormDefinition,
  createEmptyPqqFormDefinition,
  createPqqTemplateWorksheet,
  getBantScoreFromFormValues,
  getTemplateFieldCount,
  getTemplateFormDefinition,
  getTemplateSectionCount,
  hasCustomPqqFormFields,
  type DealPqqTemplate,
  type LeadPqqSettings,
  type PqqTemplateFormDefinition,
} from "@/data/pqqTemplateData";
import { mockLeadStore } from "@/data/mockStore";
import { PqqTemplateFormBuilder } from "@/modules/PqqTemplateFormBuilder";
import { cn } from "@/lib/utils";

type TemplateMetaDraft = {
  name: string;
  description: string;
};

const EMPTY_META_DRAFT: TemplateMetaDraft = {
  name: "",
  description: "",
};

export function LeadPqqTemplateSettingsSection() {
  const [templates, setTemplates] = useState<DealPqqTemplate[]>(() => [
    ...mockLeadStore.pqqTemplates,
  ]);
  const [pqqSettings, setPqqSettings] = useState<LeadPqqSettings>(() => ({
    ...mockLeadStore.pqqSettings,
  }));
  const [thresholdDraft, setThresholdDraft] = useState(() =>
    String(mockLeadStore.pqqSettings.bantDecisionThreshold),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [metaDraft, setMetaDraft] = useState<TemplateMetaDraft>(EMPTY_META_DRAFT);
  const [formDefinitionDraft, setFormDefinitionDraft] = useState<PqqTemplateFormDefinition>(() =>
    createEmptyPqqFormDefinition(),
  );
  const [editorSessionKey, setEditorSessionKey] = useState("new");

  useEffect(() => {
    const unsubTemplates = mockLeadStore.subscribePqqTemplates((nextTemplates) => {
      setTemplates([...nextTemplates]);
    });
    const unsubSettings = mockLeadStore.subscribePqqSettings((nextSettings) => {
      setPqqSettings({ ...nextSettings });
      setThresholdDraft(String(nextSettings.bantDecisionThreshold));
    });
    return () => {
      unsubTemplates();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!saveFeedback) return;
    const timer = window.setTimeout(() => setSaveFeedback(null), 3200);
    return () => window.clearTimeout(timer);
  }, [saveFeedback]);

  const orderedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.order - b.order),
    [templates],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredTemplates = useMemo(() => {
    if (!normalizedSearch) return orderedTemplates;
    return orderedTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(normalizedSearch) ||
        (template.description?.toLowerCase().includes(normalizedSearch) ?? false),
    );
  }, [orderedTemplates, normalizedSearch]);

  const deletingTemplate = deletingTemplateId
    ? templates.find((template) => template.id === deletingTemplateId) ?? null
    : null;

  const saveTemplates = (nextTemplates: DealPqqTemplate[]) => {
    const sorted = [...nextTemplates].sort((a, b) => a.order - b.order);
    mockLeadStore.pqqTemplates = sorted;
    setTemplates(sorted);
  };

  const saveThreshold = () => {
    const parsed = Number(thresholdDraft);
    const nextThreshold = clampPqqDecisionThreshold(
      Number.isFinite(parsed) ? parsed : pqqSettings.bantDecisionThreshold,
    );
    const nextSettings = { bantDecisionThreshold: nextThreshold };
    mockLeadStore.pqqSettings = nextSettings;
    setPqqSettings(nextSettings);
    setThresholdDraft(String(nextThreshold));
    setSaveFeedback("BANT decision threshold saved.");
  };

  useEffect(() => {
    if (!editorOpen || !editingTemplateId) return;
    const template = mockLeadStore.pqqTemplates.find((item) => item.id === editingTemplateId);
    if (!template) return;
    setFormDefinitionDraft(getTemplateFormDefinition(template));
    setEditorSessionKey(`${editingTemplateId}-${crypto.randomUUID()}`);
  }, [editorOpen, editingTemplateId]);

  const openCreateTemplate = () => {
    setEditingTemplateId(null);
    setMetaDraft({
      name: "New PQQ Template",
      description: "",
    });
    setFormDefinitionDraft(createEmptyPqqFormDefinition());
    setEditorSessionKey(`new-${crypto.randomUUID()}`);
    setEditorOpen(true);
  };

  const openEditTemplate = (templateId: string) => {
    const template =
      mockLeadStore.pqqTemplates.find((item) => item.id === templateId) ??
      templates.find((item) => item.id === templateId);
    if (!template) return;
    setEditingTemplateId(templateId);
    setMetaDraft({
      name: template.name,
      description: template.description ?? "",
    });
    setEditorOpen(true);
  };

  const confirmSaveTemplate = () => {
    const trimmedName = metaDraft.name.trim() || "Untitled template";
    const trimmedDescription = metaDraft.description.trim();
    const storedTemplates = mockLeadStore.pqqTemplates;

    if (editingTemplateId) {
      const next = storedTemplates.map((template) =>
        template.id === editingTemplateId
          ? {
              ...template,
              name: trimmedName,
              description: trimmedDescription || undefined,
              worksheet: cloneDealPqq(template.worksheet),
              formDefinition: clonePqqFormDefinition(formDefinitionDraft),
            }
          : template,
      );
      saveTemplates(next);
      setSaveFeedback("PQQ template updated.");
    } else {
      const nextTemplate: DealPqqTemplate = {
        id: `pqq-template-${crypto.randomUUID()}`,
        name: trimmedName,
        description: trimmedDescription || undefined,
        order: templates.length,
        worksheet: createPqqTemplateWorksheet(),
        formDefinition: clonePqqFormDefinition(formDefinitionDraft),
      };
      saveTemplates([...storedTemplates, nextTemplate]);
      setSaveFeedback("PQQ template created.");
    }

    setEditorOpen(false);
    setEditingTemplateId(null);
  };

  const setDefaultTemplate = (templateId: string) => {
    const next = templates.map((template) => ({
      ...template,
      isDefault: template.id === templateId,
    }));
    saveTemplates(next);
    setSaveFeedback("Default PQQ template updated.");
  };

  const requestDeleteTemplate = (templateId: string) => {
    if (templates.length <= 1) return;
    setDeletingTemplateId(templateId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (!deletingTemplateId || templates.length <= 1) {
      setDeleteDialogOpen(false);
      setDeletingTemplateId(null);
      return;
    }

    const remaining = templates.filter((template) => template.id !== deletingTemplateId);
    const hadDefault = templates.some(
      (template) => template.id === deletingTemplateId && template.isDefault,
    );
    const next = remaining.map((template, index) => ({
      ...template,
      order: index,
      isDefault: hadDefault && index === 0 ? true : template.isDefault,
    }));

    if (hadDefault && !next.some((template) => template.isDefault) && next[0]) {
      next[0] = { ...next[0], isDefault: true };
    }

    saveTemplates(next);
    setDeleteDialogOpen(false);
    setDeletingTemplateId(null);
    setSaveFeedback("PQQ template deleted.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#1c1e21]">PQQ Templates</h2>
          <p className="mt-1 max-w-2xl text-xs text-[#6b7280]">
            Define the Lead Discovery and PQQ worksheet your team uses when qualifying leads.
            Templates keep field values blank so reps complete them on each lead.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#4080f0] text-white hover:bg-[#3070e0] shadow-sm"
          onClick={openCreateTemplate}
        >
          <Plus size={16} className="mr-1.5" />
          New Template
        </Button>
      </div>

      {saveFeedback && (
        <p className="rounded-lg border border-[#bfdbfe] bg-[#eef2fd] px-4 py-2 text-sm text-[#245fcb]">
          {saveFeedback}
        </p>
      )}

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1c1e21]">BANT decision threshold</h3>
            <p className="mt-1 max-w-2xl text-xs text-[#6b7280]">
              Leads with a PQQ total below this score are regarded as non-qualified.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Minimum qualified score</Label>
              <Input
                type="number"
                min={0}
                max={PQQ_MAX_TOTAL}
                value={thresholdDraft}
                onChange={(event) => setThresholdDraft(event.target.value)}
                className="h-9 w-28 border-[#e5e7eb] bg-white text-sm"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-[#e5e7eb]"
              onClick={saveThreshold}
            >
              Save threshold
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#1c1e21]">Configured Templates</h3>
          <span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eef2fd] px-2.5 py-0.5 text-xs font-semibold text-[#4080f0]">
            {templates.length} template{templates.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mb-3">
          <div className="relative w-full max-w-sm">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Filter templates..."
              className="h-9 border-[#e5e7eb] bg-white pl-9 text-sm"
            />
          </div>
        </div>

        <div className="-mx-4 -mb-4 divide-y divide-[#e5e7eb] border-t border-[#e5e7eb] [&>*:last-child]:rounded-b-lg [&>*:last-child]:overflow-hidden">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => {
              const usesCustomForm = hasCustomPqqFormFields(template.formDefinition);
              const customBantTotal = getBantScoreFromFormValues(template.formDefinition, {});
              const sectionCount = getTemplateSectionCount(template.formDefinition);
              const fieldCount = getTemplateFieldCount(template.formDefinition);
              return (
                <div
                  key={template.id}
                  className="group flex items-start gap-4 bg-white px-4 py-3 transition-colors hover:bg-[#fafbff]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2fd]">
                    <FileText className="size-5 text-[#4080f0]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-[#1c1e21]">
                        {template.name}
                      </h4>
                      {template.isDefault && (
                        <Badge
                          variant="outline"
                          className="border-[#bfdbfe] bg-[#eef2fd] text-[10px] text-[#4080f0]"
                        >
                          Default
                        </Badge>
                      )}
                      {usesCustomForm ? (
                        <Badge
                          variant="outline"
                          className="border-[#e5e7eb] bg-[#f9fafb] text-[10px] text-[#4b5563]"
                        >
                          {sectionCount} section{sectionCount === 1 ? "" : "s"} · {fieldCount} field
                          {fieldCount === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                      {customBantTotal !== null ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            customBantTotal >= pqqSettings.bantDecisionThreshold
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-amber-200 bg-amber-50 text-amber-900",
                          )}
                        >
                          BANT fields {customBantTotal}
                        </Badge>
                      ) : !usesCustomForm ? (
                        <Badge
                          variant="outline"
                          className="border-[#e5e7eb] bg-[#f9fafb] text-[10px] text-[#4b5563]"
                        >
                          Legacy worksheet
                        </Badge>
                      ) : null}
                    </div>
                    {template.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#6b7280]">
                        {template.description}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs italic text-[#9ca3af]">No description</p>
                    )}
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {usesCustomForm
                        ? `${sectionCount} configured section${sectionCount === 1 ? "" : "s"} across Discovery and BANT`
                        : "Worksheet layout not customized yet"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    {!template.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                        onClick={() => setDefaultTemplate(template.id)}
                        title="Set as default"
                        aria-label={`Set ${template.name} as default`}
                      >
                        <Star size={14} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                      onClick={() => openEditTemplate(template.id)}
                      title="Edit template"
                      aria-label={`Edit ${template.name}`}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#6b7280] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      disabled={templates.length <= 1}
                      onClick={() => requestDeleteTemplate(template.id)}
                      title={
                        templates.length <= 1
                          ? "At least one PQQ template is required"
                          : "Delete template"
                      }
                      aria-label={`Delete ${template.name}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
              <Search size={20} className="text-[#c4c7d4]" />
              <p className="text-sm font-medium text-[#1c1e21]">No templates match your filter</p>
              <p className="text-xs text-[#6b7280]">
                Try a different keyword or clear the search.
              </p>
            </div>
          )}
        </div>
      </section>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingTemplateId(null);
        }}
      >
        <DialogContent className="flex max-h-[min(92vh,900px)] max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplateId ? "Edit PQQ Template" : "Create PQQ Template"}
            </DialogTitle>
            <DialogDescription>
              Configure the worksheet sections and field layout that should prefill when reps fill
              PQQ on a lead. Leave values blank in the template; reps enter opportunity details on
              each lead.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Template name</Label>
                <Input
                  value={metaDraft.name}
                  onChange={(event) =>
                    setMetaDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  className="h-9 border-[#e5e7eb]"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-[#6b7280]">Description</Label>
                <Textarea
                  value={metaDraft.description}
                  onChange={(event) =>
                    setMetaDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={2}
                  className="resize-none border-[#e5e7eb] text-sm"
                  placeholder="Optional summary for admins"
                />
              </div>
            </div>

            {editorOpen ? (
              <PqqTemplateFormBuilder
                key={editorSessionKey}
                value={formDefinitionDraft}
                onChange={(next) =>
                  setFormDefinitionDraft((current) =>
                    typeof next === "function" ? next(current) : next,
                  )
                }
              />
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={confirmSaveTemplate}
            >
              {editingTemplateId ? "Save Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingTemplateId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete PQQ template?</DialogTitle>
            <DialogDescription>
              This will permanently remove
              {deletingTemplate ? ` "${deletingTemplate.name}"` : " this template"} from lead
              settings. Existing lead records keep any PQQ already saved on them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDeleteTemplate}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
