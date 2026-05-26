export type YesNo = "yes" | "no" | "";
export type RequestType = "BE" | "BoM" | "SD" | "ToR" | "other" | "";
export type SlaCategory = "Express" | "Standard" | "Complex" | "";
export type PslDecision = "Approved" | "Rework" | "Rejected" | "";

export type ChecklistStatus =
  | "not_started"
  | "ae_in_progress"
  | "submitted_to_psl"
  | "psl_approved"
  | "psl_rework"
  | "psl_rejected";

export const REQUEST_TYPES: { value: RequestType; label: string }[] = [
  { value: "BE", label: "BE — Budgetary Estimate" },
  { value: "BoM", label: "BoM — Bill of Materials" },
  { value: "SD", label: "SD — Solution Development / PPT Presentation" },
  { value: "ToR", label: "ToR — Terms of Reference" },
  { value: "other", label: "Other" },
];

export const SLA_CATEGORIES: { value: SlaCategory; label: string }[] = [
  { value: "Express", label: "Express (1–2 days)" },
  { value: "Standard", label: "Standard (3–5 days)" },
  { value: "Complex", label: "Complex (5–10 days)" },
];

export const PRESALES_TEAMS = [
  "ERP Pre-Sales Team",
  "Cloud & Infrastructure Team",
  "Security Solutions Team",
  "Digital Transformation Team",
  "Custom Solutions Team",
];

export type PslMember = { name: string; team: string };

export const PSL_MEMBERS: PslMember[] = [
  { name: "Sara Tesfaye",    team: "ERP Pre-Sales Team" },
  { name: "Biruk Mekonnen", team: "Cloud & Infrastructure Team" },
  { name: "Daniel Bekele",  team: "Security Solutions Team" },
  { name: "Nahom Esrael",   team: "Digital Transformation Team" },
  { name: "Hana Worku",     team: "Custom Solutions Team" },
];

export type PseDocType = "SD" | "BE" | "ToR" | "PI" | "VendorSolution";

export type PseDocEntry = {
  fileName: string;
  note: string;
};

export const PSE_DOC_TYPES: { type: PseDocType; name: string; description: string }[] = [
  {
    type: "SD",
    name: "SD — Solution Design / Solution Document",
    description:
      "Technical document covering system architecture, technical specifications, BoQ, integration approach, and scope of work.",
  },
  {
    type: "BE",
    name: "BE — Budgetary Estimate",
    description:
      "Rough commercial cost estimation for initial financial planning — approximate project cost and expected budget range before the final quotation.",
  },
  {
    type: "ToR",
    name: "ToR — Terms of Reference",
    description:
      "Formal document defining project scope, objectives, deliverables, responsibilities, and requirements. Typically provided during RFP or tender processes.",
  },
  {
    type: "PI",
    name: "PI — Proforma Invoice",
    description:
      "Preliminary invoice with product/service details, pricing, payment terms, and delivery terms. Used for budget approval and advance payment requests.",
  },
  {
    type: "VendorSolution",
    name: "Vendor Solution",
    description:
      "Products or technologies provided by a manufacturer or software vendor (e.g., Cisco, Oracle, Microsoft, Huawei).",
  },
];

export type OpportunityChecklist = {
  // 1. Business Readiness (AE)
  br_discoveryComplete: YesNo;
  br_discoveryRemarks: string;
  br_pqqScore: YesNo;
  br_pqqRemarks: string;
  br_requirementsCaptured: YesNo;
  br_requirementsRemarks: string;
  br_scopeDefined: YesNo;
  br_scopeRemarks: string;
  br_stakeholdersIdentified: YesNo;
  br_stakeholdersRemarks: string;
  br_opportunityActive: YesNo;
  br_opportunityRemarks: string;
  br_timelineAligned: YesNo;
  br_timelineRemarks: string;

  // 1.1 Request Type
  rt_type: RequestType;
  rt_typeOther: string;
  rt_typeRemarks: string;

  // 1.2 Delivery Timeline (SLA)
  dt_slaCategory: SlaCategory;
  dt_slaCategoryRemarks: string;
  dt_clientDeadlineRealistic: YesNo;
  dt_clientDeadlineRemarks: string;
  dt_urgentJustified: YesNo;
  dt_urgentJustifiedRemarks: string;

  // 1.3 Exception Justification
  ex_justification: string;
  ex_approvedBy: string;
  ex_remarks: string;

  // 2. Technical Readiness (PSL)
  tr_requirementClear: YesNo;
  tr_requirementRemarks: string;
  tr_solutionReasonable: YesNo;
  tr_solutionRemarks: string;
  tr_noBlockers: YesNo;
  tr_noBlockersRemarks: string;
  tr_technologiesIdentified: YesNo;
  tr_technologiesRemarks: string;

  // 2.1 Final Validation
  fv_pslName: string;
  fv_pslTeam: string;
  fv_decision: PslDecision;
  fv_comments: string;
  fv_pseName: string;

  // PSE Documents
  pse_docs: Partial<Record<PseDocType, PseDocEntry>>;
};

export function createEmptyChecklist(): OpportunityChecklist {
  return {
    br_discoveryComplete: "",
    br_discoveryRemarks: "",
    br_pqqScore: "",
    br_pqqRemarks: "",
    br_requirementsCaptured: "",
    br_requirementsRemarks: "",
    br_scopeDefined: "",
    br_scopeRemarks: "",
    br_stakeholdersIdentified: "",
    br_stakeholdersRemarks: "",
    br_opportunityActive: "",
    br_opportunityRemarks: "",
    br_timelineAligned: "",
    br_timelineRemarks: "",
    rt_type: "",
    rt_typeOther: "",
    rt_typeRemarks: "",
    dt_slaCategory: "",
    dt_slaCategoryRemarks: "",
    dt_clientDeadlineRealistic: "",
    dt_clientDeadlineRemarks: "",
    dt_urgentJustified: "",
    dt_urgentJustifiedRemarks: "",
    ex_justification: "",
    ex_approvedBy: "",
    ex_remarks: "",
    tr_requirementClear: "",
    tr_requirementRemarks: "",
    tr_solutionReasonable: "",
    tr_solutionRemarks: "",
    tr_noBlockers: "",
    tr_noBlockersRemarks: "",
    tr_technologiesIdentified: "",
    tr_technologiesRemarks: "",
    fv_pslName: "",
    fv_pslTeam: "",
    fv_decision: "",
    fv_comments: "",
    fv_pseName: "",
    pse_docs: {},
  };
}

export function getChecklistCompletionPct(c: OpportunityChecklist): number {
  const required: (keyof OpportunityChecklist)[] = [
    "br_discoveryComplete", "br_pqqScore", "br_requirementsCaptured",
    "br_scopeDefined", "br_stakeholdersIdentified", "br_opportunityActive",
    "br_timelineAligned", "rt_type", "dt_slaCategory",
    "dt_clientDeadlineRealistic", "dt_urgentJustified",
    "tr_requirementClear", "tr_solutionReasonable", "tr_noBlockers",
    "tr_technologiesIdentified",
  ];
  const filled = required.filter((k) => c[k] !== "" && c[k] !== undefined).length;
  return Math.round((filled / required.length) * 100);
}

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  not_started: "Not started",
  ae_in_progress: "In progress",
  submitted_to_psl: "Submitted to PSL",
  psl_approved: "PSL Approved",
  psl_rework: "Rework requested",
  psl_rejected: "PSL Rejected",
};

// ─── Checklist Templates ──────────────────────────────────────────────────────

export type PseCustomDoc = {
  id: string;
  name: string;
  definition: string;
};

export type ChecklistTemplateConfig = {
  /** Which of the 5 predefined PSE doc types are required (not just optional) */
  requiredDocTypes: PseDocType[];
  /** Additional custom document types defined for this template */
  customDocs: PseCustomDoc[];
};

export type OpportunityChecklistTemplate = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  order: number;
  config: ChecklistTemplateConfig;
};

export function createEmptyTemplateConfig(): ChecklistTemplateConfig {
  return {
    requiredDocTypes: [],
    customDocs: [],
  };
}

export const DEFAULT_CHECKLIST_TEMPLATES: OpportunityChecklistTemplate[] = [
  {
    id: "checklist-tpl-standard",
    name: "Standard Opportunity Checklist",
    description:
      "Default checklist for all qualified opportunities requiring PSL engagement. Requires SD and BE deliverables from the assigned PSE.",
    isDefault: true,
    order: 0,
    config: {
      requiredDocTypes: ["SD", "BE"],
      customDocs: [],
    },
  },
  {
    id: "checklist-tpl-tender",
    name: "Tender / RFP Checklist",
    description:
      "Extended checklist for formal tender and RFP responses. Requires ToR and PI in addition to SD.",
    isDefault: false,
    order: 1,
    config: {
      requiredDocTypes: ["SD", "ToR", "PI"],
      customDocs: [
        {
          id: "custom-doc-tender-1",
          name: "Technical Compliance Matrix",
          definition:
            "A document mapping each technical requirement from the ToR to the proposed solution, showing coverage and gaps.",
        },
      ],
    },
  },
];
