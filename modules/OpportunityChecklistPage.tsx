"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Send,
  Users,
  AlertCircle,
  X,
  RefreshCw,
  Paperclip,
  FileText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createEmptyChecklist,
  REQUEST_TYPES,
  SLA_CATEGORIES,
  PSL_MEMBERS,
  PSE_DOC_TYPES,
  type OpportunityChecklist,
  type YesNo,
  type PslDecision,
  type ChecklistStatus,
  type PseDocType,
} from "@/data/opportunityChecklistData";
import { mockLeadStore } from "@/data/mockStore";

const STEPS = [
  { id: "business-readiness", title: "Business Readiness",   subtitle: "Section 1 — Account Executive" },
  { id: "request-type",       title: "Request Type",         subtitle: "Section 1.1" },
  { id: "delivery-timeline",  title: "Delivery Timeline",    subtitle: "Section 1.2 — SLA" },
  { id: "exception",          title: "Exception Justification", subtitle: "Section 1.3 — If Applicable" },
  { id: "tech-readiness",     title: "Technical Readiness",  subtitle: "Section 2 — Pre-Sales Lead" },
  { id: "psl-handoff",        title: "Final Validation",     subtitle: "Section 2.1 — PSL Handoff" },
] as const;

// ─── Small reusable components ───────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{subtitle}</p>
      <p className="mt-0.5 text-base font-semibold text-[#1c1e21]">{title}</p>
    </div>
  );
}

function TableColHeaders() {
  return (
    <div className="flex items-center gap-3 border-b border-[#e5e7eb] pb-2">
      <p className="flex-1 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Item</p>
      <p className="w-[88px] shrink-0 text-center text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Yes / No</p>
      <p className="w-[148px] shrink-0 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Remarks</p>
    </div>
  );
}

function YesNoToggle({ value, onChange }: { value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onChange(value === "yes" ? "" : "yes")}
        className={cn(
          "h-7 w-10 rounded border text-xs font-medium transition-colors",
          value === "yes"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]",
        )}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(value === "no" ? "" : "no")}
        className={cn(
          "h-7 w-10 rounded border text-xs font-medium transition-colors",
          value === "no"
            ? "border-rose-300 bg-rose-50 text-rose-700"
            : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]",
        )}
      >
        No
      </button>
    </div>
  );
}

function YesNoRow({
  label,
  value,
  remarks,
  onValueChange,
  onRemarksChange,
}: {
  label: string;
  value: YesNo;
  remarks: string;
  onValueChange: (v: YesNo) => void;
  onRemarksChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#f0f2f7] bg-[#fafbff] px-3 py-2.5">
      <p className="flex-1 text-sm text-[#1c1e21]">{label}</p>
      <div className="w-[88px] shrink-0 flex justify-center">
        <YesNoToggle value={value} onChange={onValueChange} />
      </div>
      <Input
        value={remarks}
        onChange={(e) => onRemarksChange(e.target.value)}
        placeholder="Remarks"
        className="h-7 w-[148px] shrink-0 border-[#e5e7eb] text-xs"
      />
    </div>
  );
}

function RadioCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
        selected
          ? "border-[#4080f0] bg-[#eef2fd] text-[#245fcb]"
          : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#d1d5db]",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-[#4080f0] bg-[#4080f0]" : "border-[#d1d5db]",
        )}
      >
        {selected && <Check size={9} className="text-white" />}
      </span>
      <span>{label}</span>
    </button>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type YesNoRow_ = { label: string; vk: keyof OpportunityChecklist; rk: keyof OpportunityChecklist };

function renderYesNoRows(
  rows: YesNoRow_[],
  checklist: OpportunityChecklist,
  up: <K extends keyof OpportunityChecklist>(key: K, value: OpportunityChecklist[K]) => void,
) {
  return rows.map((row) => (
    <YesNoRow
      key={row.vk as string}
      label={row.label}
      value={checklist[row.vk] as YesNo}
      remarks={checklist[row.rk] as string}
      onValueChange={(v) => up(row.vk, v as OpportunityChecklist[typeof row.vk])}
      onRemarksChange={(v) => up(row.rk, v as OpportunityChecklist[typeof row.rk])}
    />
  ));
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function OpportunityChecklistPage({ leadId }: { leadId: string }) {
  const router = useRouter();

  const lead = useMemo(
    () => mockLeadStore.leads.find((l) => l.id === leadId) ?? null,
    [leadId],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [checklist, setChecklist] = useState<OpportunityChecklist>(
    () => lead?.opportunityChecklist ?? createEmptyChecklist(),
  );
  const [status, setStatus] = useState<ChecklistStatus>(
    () => lead?.checklistStatus ?? "not_started",
  );
  const [submitOpen, setSubmitOpen] = useState(false);

  const persist = useCallback(
    (draft: OpportunityChecklist, nextStatus?: ChecklistStatus) => {
      const resolvedStatus = nextStatus ?? status;
      mockLeadStore.leads = mockLeadStore.leads.map((l) =>
        l.id === leadId
          ? { ...l, opportunityChecklist: { ...draft }, checklistStatus: resolvedStatus }
          : l,
      );
      if (nextStatus) setStatus(nextStatus);
    },
    [leadId, status],
  );

  const up = <K extends keyof OpportunityChecklist>(key: K, value: OpportunityChecklist[K]) => {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    persist(checklist, status === "not_started" ? "ae_in_progress" : status);
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 0) {
      persist(checklist);
      setCurrentStep((s) => s - 1);
    } else {
      router.push(`/leads/${leadId}`);
    }
  };

  const jumpToStep = (i: number) => {
    persist(checklist);
    setCurrentStep(i);
  };

  const saveAndExit = () => {
    persist(checklist);
    router.push(`/leads/${leadId}`);
  };

  const submitToPsl = () => {
    if (!checklist.fv_pslName) return;
    persist(checklist, "submitted_to_psl");
    setSubmitOpen(true);
  };

  const savePslReview = () => {
    const nextStatus: ChecklistStatus =
      checklist.fv_decision === "Approved"
        ? "psl_approved"
        : checklist.fv_decision === "Rejected"
          ? "psl_rejected"
          : "psl_rework";
    persist(checklist, nextStatus);
  };

  // PSE document attachment
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachingDoc, setAttachingDoc] = useState<PseDocType | null>(null);

  const handleAttachClick = (type: PseDocType) => {
    setAttachingDoc(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !attachingDoc) return;
    const next: OpportunityChecklist = {
      ...checklist,
      pse_docs: {
        ...checklist.pse_docs,
        [attachingDoc]: {
          fileName: file.name,
          note: checklist.pse_docs?.[attachingDoc]?.note ?? "",
        },
      },
    };
    setChecklist(next);
    persist(next);
    setAttachingDoc(null);
    e.target.value = "";
  };

  const removeDoc = (type: PseDocType) => {
    const next: OpportunityChecklist = {
      ...checklist,
      pse_docs: { ...checklist.pse_docs, [type]: undefined },
    };
    setChecklist(next);
    persist(next);
  };

  const updateDocNote = (type: PseDocType, note: string) => {
    const existing = checklist.pse_docs?.[type];
    if (!existing) return;
    const next: OpportunityChecklist = {
      ...checklist,
      pse_docs: { ...checklist.pse_docs, [type]: { ...existing, note } },
    };
    setChecklist(next);
  };

  if (!lead) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8f9fb]">
        <p className="text-sm text-[#6b7280]">Lead not found.</p>
      </div>
    );
  }

  const step = STEPS[currentStep]!;
  const total = STEPS.length;
  const pct = Math.round(((currentStep + 1) / total) * 100);
  const isLast = currentStep === total - 1;
  const isRework = status === "psl_rework";
  // submitted/approved/rejected all lock the AE form; rework unlocks it
  const isSubmitted = status === "submitted_to_psl" || status === "psl_approved" || status === "psl_rejected";
  const hasPslDecision = status === "psl_approved" || status === "psl_rework" || status === "psl_rejected";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fb]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-3 sm:px-6">
        <div>
          <button
            type="button"
            onClick={saveAndExit}
            className="mb-1 flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1c1e21]"
          >
            <ArrowLeft size={13} />
            Back to {lead.name}
          </button>
          <h2 className="text-sm font-semibold text-[#1c1e21]">Opportunity Checklist</h2>
        </div>
        <Button size="sm" variant="outline" className="border-[#e5e7eb] text-[#6b7280]" onClick={saveAndExit}>
          Save &amp; exit
        </Button>
      </div>

      {/* Progress */}
      <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-4 pb-4 pt-3 sm:px-6">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#1c1e21]">{step.title}</p>
            <p className="text-xs text-[#6b7280]">{step.subtitle}</p>
          </div>
          <span className="text-xs font-semibold text-[#4080f0]">{currentStep + 1} / {total}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2f7]">
          <div className="h-full rounded-full bg-[#4080f0] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jumpToStep(i)}
              className={cn(
                "shrink-0 rounded-full transition-all",
                i === currentStep ? "h-1.5 w-4 bg-[#4080f0]" : i < currentStep ? "h-1.5 w-1.5 bg-[#4080f0]/40" : "h-1.5 w-1.5 bg-[#e5e7eb]",
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl">

          {/* Rework banner — visible on all steps when in rework mode */}
          {isRework && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <RefreshCw size={13} className="text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Rework Requested</p>
              </div>
              {checklist.fv_comments && (
                <p className="mt-1 text-xs text-amber-700">PSL comment: &ldquo;{checklist.fv_comments}&rdquo;</p>
              )}
              <p className="mt-1 text-xs text-amber-600">Review and update the checklist, then resubmit to PSL.</p>
            </div>
          )}

          {/* Step 0 — Business Readiness */}
          {currentStep === 0 && (
            <div className="space-y-2">
              <SectionHeader title="Business Readiness" subtitle="Section 1 — AE" />
              <TableColHeaders />
              {renderYesNoRows([
                { label: "Discovery + PQQ document completed and attached",                vk: "br_discoveryComplete",    rk: "br_discoveryRemarks" },
                { label: "PQQ Score ≥ 36 OR approved under exception",                    vk: "br_pqqScore",             rk: "br_pqqRemarks" },
                { label: "Client requirement clearly captured",                            vk: "br_requirementsCaptured", rk: "br_requirementsRemarks" },
                { label: "Scope defined at high level",                                    vk: "br_scopeDefined",         rk: "br_scopeRemarks" },
                { label: "Key stakeholders identified",                                    vk: "br_stakeholdersIdentified", rk: "br_stakeholdersRemarks" },
                { label: "Opportunity is active and actionable",                           vk: "br_opportunityActive",    rk: "br_opportunityRemarks" },
                { label: "Delivery timeline aligned with Presales before client commitment", vk: "br_timelineAligned",    rk: "br_timelineRemarks" },
              ], checklist, up)}
            </div>
          )}

          {/* Step 1 — Request Type */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <SectionHeader title="Request Type" subtitle="Section 1.1" />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Type of Work Requested</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {REQUEST_TYPES.map((rt) => (
                    <RadioCard key={rt.value} label={rt.label} selected={checklist.rt_type === rt.value} onClick={() => up("rt_type", rt.value)} />
                  ))}
                </div>
              </div>
              {checklist.rt_type === "other" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">If other, specify</Label>
                  <Input value={checklist.rt_typeOther} onChange={(e) => up("rt_typeOther", e.target.value)} className="h-9 border-[#e5e7eb]" placeholder="Specify type of work" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Remarks</Label>
                <Input value={checklist.rt_typeRemarks} onChange={(e) => up("rt_typeRemarks", e.target.value)} className="h-9 border-[#e5e7eb]" placeholder="Additional remarks" />
              </div>
            </div>
          )}

          {/* Step 2 — Delivery Timeline */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <SectionHeader title="Delivery Timeline (SLA)" subtitle="Section 1.2" />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Selected SLA Category</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {SLA_CATEGORIES.map((sla) => (
                    <RadioCard key={sla.value} label={sla.label} selected={checklist.dt_slaCategory === sla.value} onClick={() => up("dt_slaCategory", sla.value)} />
                  ))}
                </div>
                <Input value={checklist.dt_slaCategoryRemarks} onChange={(e) => up("dt_slaCategoryRemarks", e.target.value)} className="h-9 border-[#e5e7eb]" placeholder="Remarks for SLA selection" />
              </div>
              <Separator className="bg-[#f0f2f7]" />
              <div className="space-y-2">
                <TableColHeaders />
                {renderYesNoRows([
                  { label: "Client deadline vs SLA realistic",                        vk: "dt_clientDeadlineRealistic", rk: "dt_clientDeadlineRemarks" },
                  { label: "Urgent request justified and agreed internally",           vk: "dt_urgentJustified",         rk: "dt_urgentJustifiedRemarks" },
                ], checklist, up)}
              </div>
            </div>
          )}

          {/* Step 3 — Exception Justification */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <SectionHeader title="Exception Justification" subtitle="Section 1.3 — If Applicable" />
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs text-amber-800">
                  Required only if PQQ score is below threshold and the opportunity proceeds under an approved exception.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Justification</Label>
                <Textarea value={checklist.ex_justification} onChange={(e) => up("ex_justification", e.target.value)} className="min-h-[100px] border-[#e5e7eb] text-sm" placeholder="Provide justification for proceeding below threshold..." />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Approved by (STL)</Label>
                  <Input value={checklist.ex_approvedBy} onChange={(e) => up("ex_approvedBy", e.target.value)} className="h-9 border-[#e5e7eb]" placeholder="STL name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Remarks</Label>
                  <Input value={checklist.ex_remarks} onChange={(e) => up("ex_remarks", e.target.value)} className="h-9 border-[#e5e7eb]" placeholder="Additional remarks" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Technical Readiness */}
          {currentStep === 4 && (
            <div className="space-y-2">
              <SectionHeader title="Technical Readiness" subtitle="Section 2 — Pre-Sales Lead" />
              <div className="mb-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="text-xs text-[#6b7280]">This section is reviewed by the Pre-Sales Lead (PSL) after handoff.</p>
              </div>
              <TableColHeaders />
              {renderYesNoRows([
                { label: "Requirement is understandable from technical perspective",   vk: "tr_requirementClear",      rk: "tr_requirementRemarks" },
                { label: "Proposed solution direction is reasonable (high-level)",     vk: "tr_solutionReasonable",    rk: "tr_solutionRemarks" },
                { label: "No major technical blockers identified at this stage",       vk: "tr_noBlockers",            rk: "tr_noBlockersRemarks" },
                { label: "Required technologies / vendor direction identified",        vk: "tr_technologiesIdentified", rk: "tr_technologiesRemarks" },
              ], checklist, up)}
            </div>
          )}

          {/* Step 5 — PSL Handoff */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <SectionHeader title="Final Validation" subtitle="Section 2.1 — PSL Handoff" />

              {/* ── AE Section: PSL Selection ── */}
              <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] px-4 py-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2fd]">
                    <Send size={13} className="text-[#4080f0]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1c1e21]">Assign Pre-Sales Team Lead</p>
                    <p className="text-xs text-[#6b7280]">Select the PSL who will receive this lead and the checklist.</p>
                  </div>
                </div>
                <div className="space-y-4 px-4 py-4">
                  {isSubmitted ? (
                    /* Read-only submitted view */
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-[#1c1e21]">{checklist.fv_pslName}</p>
                        {checklist.fv_pslTeam && (
                          <p className="text-xs text-[#6b7280]">{checklist.fv_pslTeam}</p>
                        )}
                        <p className="mt-0.5 text-xs text-emerald-700">Checklist submitted</p>
                      </div>
                    </div>
                  ) : (
                    /* Editable PSL selection */
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#6b7280]">Pre-Sales Lead *</Label>
                      <Select
                        value={checklist.fv_pslName}
                        onValueChange={(v) => {
                          const member = PSL_MEMBERS.find((m) => m.name === v);
                          setChecklist((prev) => ({
                            ...prev,
                            fv_pslName: v,
                            fv_pslTeam: member?.team ?? "",
                          }));
                        }}
                      >
                        <SelectTrigger className="h-10 border-[#e5e7eb]">
                          <SelectValue placeholder="Select Pre-Sales Lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {PSL_MEMBERS.map((m) => (
                            <SelectItem key={m.name} value={m.name}>
                              <div className="flex items-center gap-2">
                                <Users size={13} className="text-[#9ca3af]" />
                                <span>{m.name}</span>
                                <span className="text-xs text-[#9ca3af]">— {m.team}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* ── PSL Review Section ── shown only after submission ── */}
              {isSubmitted && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] px-4 py-3">
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full",
                      hasPslDecision
                        ? checklist.fv_decision === "Approved" ? "bg-emerald-100"
                          : checklist.fv_decision === "Rejected" ? "bg-rose-100"
                          : "bg-amber-100"
                        : "bg-[#f3f4f6]",
                    )}>
                      <AlertCircle
                        size={13}
                        className={cn(
                          hasPslDecision
                            ? checklist.fv_decision === "Approved" ? "text-emerald-600"
                              : checklist.fv_decision === "Rejected" ? "text-rose-600"
                              : "text-amber-600"
                            : "text-[#9ca3af]",
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1c1e21]">PSL Review</p>
                      <p className={cn(
                        "text-xs font-medium",
                        hasPslDecision
                          ? checklist.fv_decision === "Approved" ? "text-emerald-700"
                            : checklist.fv_decision === "Rejected" ? "text-rose-700"
                            : "text-amber-700"
                          : "text-[#9ca3af]",
                      )}>
                        {hasPslDecision
                          ? checklist.fv_decision === "Approved" ? "Approved"
                            : checklist.fv_decision === "Rejected" ? "Rejected"
                            : "Rework Requested"
                          : "Awaiting PSL review"}
                      </p>
                    </div>
                  </div>

                  {/* Rejected — locked, nothing else to do */}
                  {status === "psl_rejected" ? (
                    <div className="px-4 py-4 space-y-3">
                      <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                        <X size={15} className="shrink-0 mt-0.5 text-rose-600" />
                        <div>
                          <p className="text-sm font-semibold text-rose-800">Rejected</p>
                          {checklist.fv_comments && (
                            <p className="mt-0.5 text-xs text-rose-700">{checklist.fv_comments}</p>
                          )}
                          <p className="mt-1 text-xs text-rose-600">This checklist has been rejected and cannot proceed further.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 px-4 py-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-[#6b7280]">Decision</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["Approved", "Rework", "Rejected"] as PslDecision[]).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => up("fv_decision", d)}
                              className={cn(
                                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                                checklist.fv_decision === d
                                  ? d === "Approved" ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                    : d === "Rejected" ? "border-rose-300 bg-rose-50 text-rose-700"
                                    : "border-amber-300 bg-amber-50 text-amber-700"
                                  : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#d1d5db]",
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-[#6b7280]">Comments</Label>
                        <Textarea
                          value={checklist.fv_comments}
                          onChange={(e) => up("fv_comments", e.target.value)}
                          className="min-h-[80px] border-[#e5e7eb] text-sm"
                          placeholder="PSL comments on the opportunity..."
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!checklist.fv_decision}
                        className="w-full bg-[#4080f0] text-white hover:bg-[#3070e0] disabled:opacity-50"
                        onClick={savePslReview}
                      >
                        <Check size={13} className="mr-1.5" />
                        Save PSL Review
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── PSE Assignment ── shown only after PSL approves ── */}
              {status === "psl_approved" && (
                <div className="rounded-xl border border-emerald-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-emerald-100 px-4 py-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
                      <Users size={13} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1c1e21]">Assign Pre-Sales Engineer</p>
                      <p className="text-xs text-[#6b7280]">PSL assigns the PSE who will execute the pre-sales work.</p>
                    </div>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {checklist.fv_pseName ? (
                      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-[#1c1e21]">{checklist.fv_pseName}</p>
                          <p className="text-xs text-emerald-700">Assigned as Pre-Sales Engineer</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => up("fv_pseName", "")}
                          className="ml-auto text-xs text-[#6b7280] underline hover:text-[#1c1e21]"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-[#6b7280]">PSE Name</Label>
                          <Select
                            value={checklist.fv_pseName}
                            onValueChange={(v) => {
                              up("fv_pseName", v);
                              persist({ ...checklist, fv_pseName: v });
                            }}
                          >
                            <SelectTrigger className="h-10 border-[#e5e7eb]">
                              <SelectValue placeholder="Select Pre-Sales Engineer" />
                            </SelectTrigger>
                            <SelectContent>
                              {PSL_MEMBERS.filter((m) => m.name !== checklist.fv_pslName).map((m) => (
                                <SelectItem key={m.name} value={m.name}>
                                  <div className="flex items-center gap-2">
                                    <Users size={13} className="text-[#9ca3af]" />
                                    <span>{m.name}</span>
                                    <span className="text-xs text-[#9ca3af]">— {m.team}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-[#9ca3af]">Only members outside the assigned PSL are shown.</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── PSE Documents ── shown after PSE is assigned ── */}
              {status === "psl_approved" && checklist.fv_pseName && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] px-4 py-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2fd]">
                      <FileText size={13} className="text-[#4080f0]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1c1e21]">PSE Documents</p>
                      <p className="text-xs text-[#6b7280]">
                        {checklist.fv_pseName} — attach the required deliverable documents below.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#4080f0]">
                      {Object.keys(checklist.pse_docs ?? {}).filter((k) => (checklist.pse_docs as Record<string, unknown>)[k]).length} / {PSE_DOC_TYPES.length}
                    </span>
                  </div>

                  <div className="divide-y divide-[#f0f2f7]">
                    {PSE_DOC_TYPES.map((doc) => {
                      const entry = checklist.pse_docs?.[doc.type];
                      return (
                        <div key={doc.type} className="px-4 py-3 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                              entry ? "bg-emerald-50" : "bg-[#f3f4f6]",
                            )}>
                              {entry
                                ? <CheckCircle2 size={13} className="text-emerald-600" />
                                : <Paperclip size={11} className="text-[#9ca3af]" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1c1e21]">{doc.name}</p>
                              <p className="mt-0.5 text-xs text-[#6b7280] leading-relaxed">{doc.description}</p>

                              {entry ? (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                                    <FileText size={12} className="shrink-0 text-emerald-600" />
                                    <span className="flex-1 truncate text-xs font-medium text-emerald-800">{entry.fileName}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeDoc(doc.type)}
                                      className="shrink-0 text-rose-400 hover:text-rose-600"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <Input
                                    value={entry.note}
                                    onChange={(e) => updateDocNote(doc.type, e.target.value)}
                                    onBlur={() => persist(checklist)}
                                    placeholder="Add a note (optional)"
                                    className="h-7 border-[#e5e7eb] text-xs"
                                  />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAttachClick(doc.type)}
                                  className="mt-2 flex items-center gap-1.5 rounded-md border border-dashed border-[#d1d5db] bg-[#fafbff] px-3 py-1.5 text-xs text-[#6b7280] hover:border-[#4080f0] hover:text-[#4080f0] transition-colors"
                                >
                                  <Paperclip size={11} />
                                  Attach document
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg"
                  />
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Footer navigation */}
      <div className="shrink-0 border-t border-[#e5e7eb] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-[#6b7280]" onClick={goBack}>
            <ArrowLeft size={13} />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>

          {isLast ? (
            isSubmitted ? (
              <Button type="button" size="sm" variant="outline" className="border-[#e5e7eb] text-[#6b7280]" onClick={saveAndExit}>
                Back to Lead
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="gap-1.5 bg-[#4080f0] text-white hover:bg-[#3070e0] disabled:opacity-50"
                onClick={submitToPsl}
                disabled={!checklist.fv_pslName}
              >
                <Send size={13} />
                {isRework ? "Resubmit to PSL" : "Submit to PSL"}
              </Button>
            )
          ) : (
            <Button type="button" size="sm" className="gap-1.5 bg-[#4080f0] text-white hover:bg-[#3070e0]" onClick={goNext}>
              Next
              <ArrowRight size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="sm:max-w-md border-[#e5e7eb]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Sent to PSL
            </DialogTitle>
            <DialogDescription>
              The opportunity checklist has been submitted to{" "}
              <span className="font-semibold text-[#1c1e21]">{checklist.fv_pslName}</span>
              {checklist.fv_pslTeam ? ` (${checklist.fv_pslTeam})` : ""} for technical review.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
            <p className="text-sm font-medium text-[#1c1e21]">{lead.name}</p>
            <p className="mt-0.5 text-xs text-[#6b7280]">Checklist submitted — awaiting PSL review</p>
          </div>
          <Button
            className="w-full bg-[#4080f0] text-white hover:bg-[#3070e0]"
            onClick={() => { setSubmitOpen(false); router.push(`/leads/${leadId}`); }}
          >
            Back to Lead
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
