"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
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
import { PSE_DOC_TYPES, type OpportunityChecklistTemplate } from "@/data/opportunityChecklistData";
import { mockLeadStore } from "@/data/mockStore";

export function OpportunityChecklistTemplateSettingsSection() {
  const router = useRouter();
  const [templates, setTemplates] = useState<OpportunityChecklistTemplate[]>(() => [
    ...mockLeadStore.checklistTemplates,
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    return mockLeadStore.subscribeChecklistTemplates((next) => setTemplates([...next]));
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
      (t) =>
        t.name.toLowerCase().includes(normalizedSearch) ||
        (t.description?.toLowerCase().includes(normalizedSearch) ?? false),
    );
  }, [orderedTemplates, normalizedSearch]);

  const deletingTemplate = deletingTemplateId
    ? templates.find((t) => t.id === deletingTemplateId) ?? null
    : null;

  const saveTemplates = (next: OpportunityChecklistTemplate[]) => {
    const sorted = [...next].sort((a, b) => a.order - b.order);
    mockLeadStore.checklistTemplates = sorted;
    setTemplates(sorted);
  };

  const setDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveTemplates(templates.map((t) => ({ ...t, isDefault: t.id === id })));
    setSaveFeedback("Default checklist template updated.");
  };

  const requestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (templates.length <= 1) return;
    setDeletingTemplateId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingTemplateId || templates.length <= 1) {
      setDeleteDialogOpen(false);
      setDeletingTemplateId(null);
      return;
    }
    const remaining = templates.filter((t) => t.id !== deletingTemplateId);
    const hadDefault = templates.some((t) => t.id === deletingTemplateId && t.isDefault);
    const next = remaining.map((t, i) => ({
      ...t,
      order: i,
      isDefault: hadDefault && i === 0 ? true : t.isDefault,
    }));
    if (hadDefault && !next.some((t) => t.isDefault) && next[0]) {
      next[0] = { ...next[0], isDefault: true };
    }
    saveTemplates(next);
    setDeleteDialogOpen(false);
    setDeletingTemplateId(null);
    setSaveFeedback("Checklist template deleted.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#1c1e21]">Opportunity Checklist Templates</h2>
          <p className="mt-1 max-w-2xl text-xs text-[#6b7280]">
            Define reusable checklist templates your team applies when preparing qualified
            opportunities for PSL engagement. Each template configures which PSE deliverable
            documents are required and can include custom document types.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#4080f0] text-white hover:bg-[#3070e0] shadow-sm"
          onClick={() => router.push("/leads/settings/checklist/new")}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter templates..."
              className="h-9 border-[#e5e7eb] bg-white pl-9 text-sm"
            />
          </div>
        </div>

        <div className="-mx-4 -mb-4 divide-y divide-[#e5e7eb] border-t border-[#e5e7eb] [&>*:last-child]:rounded-b-lg [&>*:last-child]:overflow-hidden">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((tpl) => {
              const reqCount = tpl.config.requiredDocTypes.length;
              const customCount = tpl.config.customDocs.filter((d) => d.name.trim()).length;
              const reqLabels = tpl.config.requiredDocTypes
                .map((d) => PSE_DOC_TYPES.find((x) => x.type === d)?.type ?? d)
                .join(", ");

              return (
                <div
                  key={tpl.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/leads/settings/checklist/${tpl.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/leads/settings/checklist/${tpl.id}`)}
                  className="group flex w-full cursor-pointer items-start gap-4 bg-white px-4 py-3 text-left transition-colors hover:bg-[#fafbff]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2fd]">
                    <ClipboardList className="size-5 text-[#4080f0]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-[#1c1e21]">{tpl.name}</h4>
                      {tpl.isDefault && (
                        <Badge
                          variant="outline"
                          className="border-[#bfdbfe] bg-[#eef2fd] text-[10px] text-[#4080f0]"
                        >
                          Default
                        </Badge>
                      )}
                      {reqCount > 0 && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                        >
                          {reqCount} required doc{reqCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                      {customCount > 0 && (
                        <Badge
                          variant="outline"
                          className="border-[#e5e7eb] bg-[#f9fafb] text-[10px] text-[#4b5563]"
                        >
                          {customCount} custom
                        </Badge>
                      )}
                    </div>

                    {tpl.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#6b7280]">
                        {tpl.description}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs italic text-[#9ca3af]">No description</p>
                    )}

                    {reqCount > 0 && (
                      <p className="mt-1 text-[11px] text-[#9ca3af]">
                        Required: {reqLabels}
                        {customCount > 0 ? ` + ${customCount} custom` : ""}
                      </p>
                    )}
                  </div>

                  {/* Action buttons — stop propagation so row click doesn't also fire */}
                  <div
                    className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!tpl.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                        onClick={(e) => setDefault(tpl.id, e)}
                        title="Set as default"
                      >
                        <Star size={14} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/leads/settings/checklist/${tpl.id}`);
                      }}
                      title="Edit template"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#6b7280] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      disabled={templates.length <= 1}
                      onClick={(e) => requestDelete(tpl.id, e)}
                      title={
                        templates.length <= 1
                          ? "At least one template is required"
                          : "Delete template"
                      }
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
              <p className="text-xs text-[#6b7280]">Try a different keyword or clear the search.</p>
            </div>
          )}
        </div>
      </section>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingTemplateId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete checklist template?</DialogTitle>
            <DialogDescription>
              This will permanently remove
              {deletingTemplate ? ` "${deletingTemplate.name}"` : " this template"} from lead
              settings. Existing checklists already saved on leads are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
