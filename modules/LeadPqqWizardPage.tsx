"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Save,
  SendHorizonal,
  ShieldCheck,
  SkipForward,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { mockLeadStore } from "@/data/mockStore";
import {
  clonePqqFormValues,
  createEmptyPqqFormValues,
  getDefaultPqqFormDefinition,
  getDefaultPqqTemplate,
  hasCustomPqqFormFields,
  type PqqFormValues,
  type PqqTemplateField,
  type PqqTemplateFormDefinition,
  type PqqTemplateSection,
  type PqqTemplateStep,
} from "@/data/pqqTemplateData";
import type { CrmLead } from "@/data/leadsManagementData";

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function sectionFilledCount(
  fields: PqqTemplateField[],
  values: PqqFormValues,
): number {
  return fields.filter((f) => {
    const v = values[f.id];
    if (v === undefined || v === null || v === "") return false;
    if (v === false) return false;
    if (typeof v === "number" && v === 0 && f.type === "slider") return false;
    return true;
  }).length;
}

function SliderField({
  field,
  value,
  onChange,
}: {
  field: PqqTemplateField;
  value: number;
  onChange: (v: number) => void;
}) {
  const min = field.min ?? 0;
  const max = field.max ?? 12;
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const color =
    pct >= 75
      ? "bg-emerald-500"
      : pct >= 40
        ? "bg-[#4080f0]"
        : pct >= 15
          ? "bg-amber-400"
          : "bg-[#e5e7eb]";

  const tiers = [
    { label: "None", range: "0–3", pct: 0 },
    { label: "Low", range: "4–6", pct: 33 },
    { label: "Medium", range: "7–9", pct: 66 },
    { label: "High", range: "10–12", pct: 100 },
  ];
  const activeTier =
    pct >= 75 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {tiers.map((t, i) => (
            <span
              key={i}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                i === activeTier
                  ? "bg-[#4080f0] text-white"
                  : "bg-[#f3f4f6] text-[#9ca3af]",
              )}
            >
              {t.label}
            </span>
          ))}
        </div>
        <span className="text-lg font-bold tabular-nums text-[#1c1e21]">
          {value}
          <span className="text-sm font-normal text-[#9ca3af]">/{max}</span>
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#f0f2f7]">
        <div
          className={cn("h-full rounded-full transition-all duration-150", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#4080f0]"
      />
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: PqqTemplateField;
  value: PqqFormValues[string];
  onChange: (v: PqqFormValues[string]) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <button
        type="button"
        onClick={() => onChange(!(value === true))}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
          value === true
            ? "border-[#4080f0] bg-[#eef2fd] text-[#245fcb]"
            : "border-[#e5e7eb] bg-white text-[#4b5563] hover:border-[#cbd5e1]",
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            value === true
              ? "border-[#4080f0] bg-[#4080f0]"
              : "border-[#d1d5db]",
          )}
        >
          {value === true && <Check size={11} className="text-white" />}
        </span>
        <span className="text-sm font-medium">
          {field.placeholder || "Yes"}
        </span>
      </button>
    );
  }

  if (field.type === "slider") {
    return (
      <SliderField
        field={field}
        value={Number(value ?? field.min ?? 0)}
        onChange={onChange}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Select
        value={String(value ?? "")}
        onValueChange={onChange}
      >
        <SelectTrigger className="h-10 border-[#e5e7eb] bg-white text-sm">
          <SelectValue placeholder={field.placeholder ?? "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="min-h-[96px] resize-none border-[#e5e7eb] bg-white text-sm leading-relaxed"
      />
    );
  }

  return (
    <Input
      type={field.type === "number" ? "number" : "text"}
      value={String(value ?? "")}
      onChange={(e) =>
        onChange(
          field.type === "number"
            ? Number(e.target.value) || 0
            : e.target.value,
        )
      }
      placeholder={field.placeholder}
      className="h-10 border-[#e5e7eb] bg-white text-sm"
    />
  );
}

interface WizardSection {
  section: PqqTemplateSection;
  step: PqqTemplateStep;
  fields: PqqTemplateField[];
  globalIndex: number;
}

export function LeadPqqWizardPage({ leadId }: { leadId: string }) {
  const router = useRouter();

  const lead = useMemo<CrmLead | undefined>(
    () => mockLeadStore.getLead(leadId),
    [leadId],
  );

  const templates = mockLeadStore.pqqTemplates;
  const pqqSettings = mockLeadStore.pqqSettings;
  const template = getDefaultPqqTemplate(templates);
  const definition = useMemo<PqqTemplateFormDefinition>(
    () => getDefaultPqqFormDefinition(templates),
    [templates],
  );
  const usesCustomForm = hasCustomPqqFormFields(definition);

  const [values, setValues] = useState<PqqFormValues>(() =>
    lead?.pqqFormValues
      ? clonePqqFormValues(lead.pqqFormValues)
      : createEmptyPqqFormValues(definition),
  );
  const [saved, setSaved] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);

  // Build ordered flat list of sections across all steps
  const wizardSections = useMemo<WizardSection[]>(() => {
    const orderedSteps = sortByOrder(definition.steps);
    const result: WizardSection[] = [];
    let idx = 0;
    for (const step of orderedSteps) {
      const stepSections = sortByOrder(
        definition.sections.filter((s) => s.stepId === step.id),
      );
      for (const section of stepSections) {
        const fields = sortByOrder(
          definition.fields.filter((f) => f.sectionId === section.id),
        );
        result.push({ section, step, fields, globalIndex: idx++ });
      }
    }
    return result;
  }, [definition]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const current = wizardSections[currentIndex];
  const total = wizardSections.length;
  const isLast = currentIndex === total - 1;
  const isFirst = currentIndex === 0;
  const pct = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 100;

  // Count how many sections have at least one value
  const filledSections = wizardSections.filter((ws) =>
    sectionFilledCount(ws.fields, values) > 0,
  ).length;

  const patch = useCallback(
    (fieldId: string, v: PqqFormValues[string]) => {
      setValues((prev) => ({ ...prev, [fieldId]: v }));
      setSaved(false);
    },
    [],
  );

  const persist = useCallback(
    (finalValues: PqqFormValues) => {
      if (!lead) return;
      const updated = mockLeadStore.leads.map((l) =>
        l.id === leadId
          ? { ...l, pqqFormValues: clonePqqFormValues(finalValues) }
          : l,
      );
      mockLeadStore.leads = updated;
      setSaved(true);
    },
    [lead, leadId],
  );

  const submitForApproval = useCallback(
    (finalValues: PqqFormValues) => {
      if (!lead) return;
      const updated = mockLeadStore.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              pqqFormValues: clonePqqFormValues(finalValues),
              pqqApprovalStatus: "Pending Approval" as const,
            }
          : l,
      );
      mockLeadStore.leads = updated;
      setSaved(true);
    },
    [lead, leadId],
  );

  // Auto-save when navigating between sections
  const goNext = () => {
    if (!isLast) {
      persist(values);
      setCurrentIndex((i) => i + 1);
    } else {
      submitForApproval(values);
      setApprovalOpen(true);
    }
  };

  const goBack = () => {
    persist(values);
    if (!isFirst) setCurrentIndex((i) => i - 1);
    else router.push(`/leads/${leadId}`);
  };

  const saveAndExit = () => {
    submitForApproval(values);
    setApprovalOpen(true);
  };

  if (!lead) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[#6b7280]">Lead not found.</p>
      </div>
    );
  }

  if (!usesCustomForm || wizardSections.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldCheck size={32} className="text-[#c4c7d4]" />
        <p className="text-sm font-semibold text-[#1c1e21]">
          No custom PQQ form configured
        </p>
        <p className="max-w-sm text-xs text-[#6b7280]">
          The active PQQ template has no custom fields yet. Go to Leads → Settings → PQQ Templates to set one up.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/leads/${leadId}`)}
          className="mt-2"
        >
          Back to Lead
        </Button>
      </div>
    );
  }

  const fieldsFilled = current
    ? sectionFilledCount(current.fields, values)
    : 0;
  const fieldsTotal = current?.fields.length ?? 0;
  const sectionComplete = fieldsTotal === 0 || fieldsFilled === fieldsTotal;

  // Group consecutive sections that share the same step for step-boundary display
  const prevStep = wizardSections[currentIndex - 1]?.step;
  const isNewStep = !prevStep || prevStep.id !== current?.step.id;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#f5f6fa]">
      {/* ── Sticky header ─────────────────────────────────── */}
      <header className="shrink-0 border-b border-[#e5e7eb] bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[#6b7280] hover:text-[#1c1e21]"
            onClick={saveAndExit}
          >
            <ArrowLeft size={15} />
            {lead.name}
          </Button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-[#1c1e21]">
              {template?.name ?? "PQQ Assessment"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "gap-1.5 border-[#e5e7eb] text-[#6b7280]",
              saved && "border-emerald-200 text-emerald-600",
            )}
            onClick={saveAndExit}
          >
            <Save size={13} />
            {saved ? "Saved" : "Save & Exit"}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs text-[#6b7280]">
              <span className="font-semibold text-[#1c1e21]">
                {current?.section.title}
              </span>
              {" · "}Section {currentIndex + 1} of {total}
            </p>
            <span className="text-xs font-semibold text-[#4080f0]">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
            <div
              className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Section breadcrumb dots */}
          <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5">
            {wizardSections.map((ws, i) => {
              const isCurrent = i === currentIndex;
              const isDone = i < currentIndex || sectionFilledCount(ws.fields, values) > 0;
              return (
                <button
                  key={ws.section.id}
                  type="button"
                  onClick={() => {
                    persist(values);
                    setCurrentIndex(i);
                  }}
                  title={ws.section.title}
                  className={cn(
                    "shrink-0 rounded-full transition-all",
                    isCurrent
                      ? "h-2 w-6 bg-[#4080f0]"
                      : isDone
                        ? "h-2 w-2 bg-[#4080f0]/40"
                        : "h-2 w-2 bg-[#e5e7eb]",
                  )}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-4 py-8">
          {/* Step label when entering a new step */}
          {isNewStep && (
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4080f0] text-[10px] font-bold text-white">
                {sortByOrder(definition.steps).findIndex(
                  (s) => s.id === current?.step.id,
                ) + 1}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
                {current?.step.title}
              </span>
            </div>
          )}

          {/* Section card */}
          {current && (
            <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
              {/* Card header */}
              <div className="border-b border-[#f0f2f7] px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#1c1e21]">
                      {current.section.title}
                    </h2>
                    {current.section.description && (
                      <p className="mt-1 text-sm text-[#6b7280]">
                        {current.section.description}
                      </p>
                    )}
                  </div>
                  {sectionComplete && fieldsTotal > 0 && (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-emerald-500"
                    />
                  )}
                </div>
                {fieldsTotal > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#f0f2f7]">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all"
                        style={{
                          width: `${fieldsTotal > 0 ? (fieldsFilled / fieldsTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[#9ca3af]">
                      {fieldsFilled}/{fieldsTotal} filled
                    </span>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="px-6 py-5">
                {current.fields.length === 0 ? (
                  <p className="text-sm text-[#9ca3af]">
                    No fields in this section.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {current.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        {field.type !== "checkbox" && (
                          <Label className="text-sm font-medium text-[#374151]">
                            {field.label}
                            {field.required && (
                              <span className="ml-1 text-red-400">*</span>
                            )}
                          </Label>
                        )}
                        <FieldInput
                          field={field}
                          value={values[field.id]}
                          onChange={(v) => patch(field.id, v)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Final summary card on last section */}
          {isLast && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">
                  Almost done
                </p>
              </div>
              <p className="mt-1 text-xs text-emerald-700">
                {filledSections} of {total} sections have responses. Click
                &ldquo;Complete&rdquo; to save and return to the lead.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer navigation ─────────────────────────────── */}
      <footer className="shrink-0 border-t border-[#e5e7eb] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#e5e7eb] text-[#6b7280]"
            onClick={goBack}
          >
            <ArrowLeft size={14} />
            {isFirst ? "Exit" : "Back"}
          </Button>

          <div className="flex items-center gap-2">
            {/* Skip — only when no required fields in this section */}
            {current &&
              current.fields.length > 0 &&
              current.fields.every((f) => !f.required) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-[#9ca3af] hover:text-[#6b7280]"
                  onClick={() => {
                    if (!isLast) setCurrentIndex((i) => i + 1);
                    else saveAndExit();
                  }}
                >
                  <SkipForward size={13} />
                  Skip
                </Button>
              )}

            <Button
              size="sm"
              className={cn(
                "gap-1.5",
                isLast
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-[#4080f0] text-white hover:bg-[#3070e0]",
              )}
              onClick={goNext}
            >
              {isLast ? (
                <>
                  <Check size={14} />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </div>
        </div>
      </footer>

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center gap-0">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#eef2fd]">
              <SendHorizonal size={24} className="text-[#4080f0]" />
            </div>
            <DialogTitle className="text-base font-semibold text-[#1c1e21]">
              PQQ sent for approval
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs text-[#6b7280]">
              This assessment has been submitted and is now pending manager review. You&apos;ll be notified once it&apos;s approved or returned with feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Clock size={12} />
            Awaiting approval
          </div>
          <Button
            className="mt-1 w-full bg-[#4080f0] text-white hover:bg-[#3070e0]"
            onClick={() => {
              setApprovalOpen(false);
              router.push(`/leads/${leadId}`);
            }}
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
