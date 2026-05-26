"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Kanban,
  List as ListIcon,
  Percent,
  Plus,
  Search,
  ShieldCheck,
  SkipForward,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customerOwners,
  industries,
  accountSizes,
  customerContacts as initialCustomerContacts,
  accountContactAssociations as initialAccountContactAssociations,
  associationRoles,
  type CustomerAccount,
  type CustomerContact,
  type AccountContactAssociation,
} from "@/data/customerManagementData";
import {
  AUTOMATION_DEFAULT_LEAD_ROLES,
  AUTOMATION_DEFAULT_LEAD_SOURCE_ID,
  AUTOMATION_DEFAULT_LEAD_STAGE_ID,
  BASE_CURRENCY,
  CURRENCY_OPTIONS,
  type CrmLead,
  type DealCurrency,
  type LeadSource,
  STAGE_AGING_WARNING_DAYS,
  computeBaseValue,
  leadCustomerAccounts,
  type PipelineStage,
} from "@/data/leadsManagementData";
import { type DealPqq } from "@/data/dealsManagementData";
import {
  clonePqqFormValues,
  createEmptyPqqFormValues,
  getDefaultPqqFormDefinition,
  getDefaultPqqWorksheet,
  hasCustomPqqFormFields,
  isLeadPqqQualified,
  type LeadPqqSettings,
  type PqqFormValues,
} from "@/data/pqqTemplateData";
import { mockLeadStore } from "@/data/mockStore";
import { PQQ_UI_ENABLED } from "@/lib/featureFlags";
import { DealPqqSection } from "@/modules/DealPqqSection";
import { DynamicPqqForm } from "@/modules/DynamicPqqForm";

type ProbabilityFilter = "all" | "high" | "medium" | "low";

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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

const SALES_TEAM_BADGE_STYLES: Record<string, string> = {
  "Public and Telecom Sales":
    "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  "International and Corporate Sales":
    "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]",
  BFSI: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
};

function salesTeamBadgeClass(team?: string) {
  if (!team) return "border-[#e5e7eb] bg-[#f9fafb] text-[#374151]";
  return (
    SALES_TEAM_BADGE_STYLES[team] ??
    "border-[#e5e7eb] bg-[#f9fafb] text-[#374151]"
  );
}

function daysBetween(fromIso: string, toDate = new Date()) {
  const a = new Date(fromIso + "T12:00:00").getTime();
  const b = new Date(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate(),
    12,
  ).getTime();
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-[#6b7280]">{label}</Label>
      {children}
    </div>
  );
}

export function LeadsManagementPage() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<{
    manual?: string;
  }>({});

  const [stages, setStages] = useState<PipelineStage[]>(() =>
    [...mockLeadStore.stages].sort((a, b) => a.order - b.order),
  );
  const [leadSources, setLeadSources] = useState<LeadSource[]>(() => [...mockLeadStore.leadSources]);
  const [pqqTemplates, setPqqTemplates] = useState(() => [...mockLeadStore.pqqTemplates]);
  const [pqqSettings, setPqqSettings] = useState<LeadPqqSettings>(() => ({
    ...mockLeadStore.pqqSettings,
  }));
  const [leads, _setLeads] = useState<CrmLead[]>(() => mockLeadStore.leads);

  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsPageLoading(false), 500);

    const unsubLeads = mockLeadStore.subscribeLeads((newLeads) => {
      _setLeads([...newLeads]);
    });
    const unsubStages = mockLeadStore.subscribeStages((newStages) => {
      setStages([...newStages].sort((a, b) => a.order - b.order));
    });
    const unsubSources = mockLeadStore.subscribeLeadSources((newSources) => {
      setLeadSources([...newSources]);
    });
    const unsubPqqTemplates = mockLeadStore.subscribePqqTemplates((newTemplates) => {
      setPqqTemplates([...newTemplates]);
    });
    const unsubPqqSettings = mockLeadStore.subscribePqqSettings((newSettings) => {
      setPqqSettings({ ...newSettings });
    });

    return () => {
      clearTimeout(loadingTimer);
      unsubLeads();
      unsubStages();
      unsubSources();
      unsubPqqTemplates();
      unsubPqqSettings();
    };
  }, []);

  useEffect(() => {
    if (!saveFeedback) return;
    const timer = setTimeout(() => setSaveFeedback(null), 2800);
    return () => clearTimeout(timer);
  }, [saveFeedback]);

  const [search, setSearch] = useState("");
  const [filterStageId, setFilterStageId] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterProbability, setFilterProbability] =
    useState<ProbabilityFilter>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const [createOpen, setCreateOpen] = useState(false);
  const [quickCapture, setQuickCapture] = useState(false);

  const [extraCustomerAccounts, setExtraCustomerAccounts] = useState<CustomerAccount[]>([]);
  const [inlineAccountIds, setInlineAccountIds] = useState<Set<string>>(() => new Set());
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    industry: industries[0] ?? "Technology",
    size: accountSizes[0] ?? "1-10",
    city: "",
    country: "Ethiopia",
    website: "",
  });

  const [extraContacts, setExtraContacts] =
    useState<CustomerContact[]>([]);
  const [extraAssociations, setExtraAssociations] =
    useState<AccountContactAssociation[]>([]);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactRoleFilter, setContactRoleFilter] = useState<string>("all");
  const [contactMode, setContactMode] = useState<"pick" | "add">("pick");
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    roleTitle: "",
    email: "",
    phone: "",
    associationRole: associationRoles[0] ?? "Decision Maker",
  });

  const [createForm, setCreateForm] = useState({
    name: "",
    customerId: "",
    contactId: "",
    sourceId: AUTOMATION_DEFAULT_LEAD_SOURCE_ID,
    value: "",
    currency: "ETB" as DealCurrency,
    primarySales: AUTOMATION_DEFAULT_LEAD_ROLES.primarySales,
    presales: AUTOMATION_DEFAULT_LEAD_ROLES.presales,
    channel: AUTOMATION_DEFAULT_LEAD_ROLES.channel,
  });
  const [createPqq, setCreatePqq] = useState<DealPqq | null>(null);
  const [createPqqFormValues, setCreatePqqFormValues] = useState<PqqFormValues | null>(null);
  const [pqqDialogOpen, setPqqDialogOpen] = useState(false);
  const [pqqActiveTab, setPqqActiveTab] = useState<"discovery" | "bant">("discovery");
  const [discoveryStep, setDiscoveryStep] = useState(0);
  const [bantStep, setBantStep] = useState(0);
  const [pqqDraft, setPqqDraft] = useState<DealPqq>(() =>
    getDefaultPqqWorksheet(mockLeadStore.pqqTemplates),
  );
  const [pqqFormDraft, setPqqFormDraft] = useState<PqqFormValues>(() =>
    createEmptyPqqFormValues(getDefaultPqqFormDefinition(mockLeadStore.pqqTemplates)),
  );

  const defaultPqqFormDefinition = useMemo(
    () => getDefaultPqqFormDefinition(pqqTemplates),
    [pqqTemplates],
  );
  const usesCustomPqqForm = hasCustomPqqFormFields(defaultPqqFormDefinition);

  const pqqWizardSections = useMemo(() => {
    const def = defaultPqqFormDefinition;
    const orderedSteps = [...def.steps].sort((a, b) => a.order - b.order);
    const result: Array<{
      section: typeof def.sections[0];
      step: typeof def.steps[0];
      fields: typeof def.fields;
    }> = [];
    for (const step of orderedSteps) {
      const stepSections = [...def.sections]
        .filter((s) => s.stepId === step.id)
        .sort((a, b) => a.order - b.order);
      for (const section of stepSections) {
        const fields = [...def.fields]
          .filter((f) => f.sectionId === section.id)
          .sort((a, b) => a.order - b.order);
        result.push({ section, step, fields });
      }
    }
    return result;
  }, [defaultPqqFormDefinition]);


  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );
  const allCustomerAccounts = useMemo(
    () => [...leadCustomerAccounts, ...extraCustomerAccounts],
    [extraCustomerAccounts],
  );

  const accountById = useMemo(
    () => new Map(allCustomerAccounts.map((a) => [a.id, a])),
    [allCustomerAccounts],
  );

  const allContacts = useMemo(
    () => [...initialCustomerContacts, ...extraContacts],
    [extraContacts],
  );

  const contactById = useMemo(
    () => new Map(allContacts.map((c) => [c.id, c])),
    [allContacts],
  );

  const allAssociations = useMemo(
    () => [...initialAccountContactAssociations, ...extraAssociations],
    [extraAssociations],
  );

  const contactsForAccountId = (accountId: string): CustomerContact[] => {
    const ids = allAssociations
      .filter((a) => a.accountId === accountId)
      .map((a) => a.contactId);
    return ids
      .map((id) => contactById.get(id))
      .filter((c): c is CustomerContact => Boolean(c));
  };

  const associationFor = (accountId: string, contactId: string) =>
    allAssociations.find(
      (a) => a.accountId === accountId && a.contactId === contactId,
    ) ?? null;

  useEffect(() => {
    if (!createForm.customerId) {
      if (createForm.contactId) {
        setCreateForm((p) => ({ ...p, contactId: "" }));
      }
      return;
    }
    const ids = allAssociations
      .filter((a) => a.accountId === createForm.customerId)
      .map((a) => a.contactId);
    const contacts = ids
      .map((id) => contactById.get(id))
      .filter((c): c is CustomerContact => Boolean(c));
    if (contacts.length === 1 && contacts[0]) {
      if (createForm.contactId !== contacts[0].id) {
        setCreateForm((p) => ({ ...p, contactId: contacts[0]!.id }));
      }
      return;
    }
    if (
      createForm.contactId &&
      !contacts.some((c) => c.id === createForm.contactId)
    ) {
      setCreateForm((p) => ({ ...p, contactId: "" }));
    }
  }, [createForm.customerId, createForm.contactId, allAssociations, contactById]);

  const ownerOptions = useMemo(() => {
    const set = new Set<string>(customerOwners);
    for (const lead of leads) {
      set.add(lead.primarySales);
      set.add(lead.presales);
      set.add(lead.channel);
    }
    return Array.from(set).sort();
  }, [leads]);

  const filteredPipelineLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const customer = accountById.get(lead.customerId);
      const customerName = customer?.name ?? "";
      if (q && !lead.name.toLowerCase().includes(q) && !customerName.toLowerCase().includes(q)) {
        return false;
      }
      if (filterStageId !== "all" && lead.stageId !== filterStageId) return false;
      if (filterOwner !== "all" && lead.primarySales !== filterOwner) return false;
      const p = lead.probability;
      if (filterProbability === "high" && p < 70) return false;
      if (filterProbability === "medium" && (p < 40 || p > 69)) return false;
      if (filterProbability === "low" && p >= 40) return false;
      return true;
    });
  }, [leads, search, filterStageId, filterOwner, filterProbability, accountById]);

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages],
  );
  const sortedLeadSources = useMemo(
    () => [...leadSources].sort((a, b) => a.order - b.order),
    [leadSources],
  );

  const setLeads = (next: CrmLead[] | ((prev: CrmLead[]) => CrmLead[])) => {
    _setLeads((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      mockLeadStore.leads = resolved;
      return resolved;
    });
  };

  const router = useRouter();

  const openLeadDetail = (lead: CrmLead) => {
    router.push(`/leads/${lead.id}`);
  };

  const moveLeadToStage = (leadId: string, stageId: string) => {
    const today = new Date().toISOString().split("T")[0]!;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stageId,
              stageEnteredAt: l.stageId === stageId ? l.stageEnteredAt : today,
            }
          : l,
      ),
    );
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("application/lead-id", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnStage = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("application/lead-id");
    if (!id) return;
    moveLeadToStage(id, stageId);
  };

  const saveNewLead = () => {
    setFormErrors((prev) => ({ ...prev, manual: undefined }));

    if (!createForm.name.trim() || !createForm.customerId) {
      setFormErrors((prev) => ({
        ...prev,
        manual: "Lead name and customer are required.",
      }));
      return;
    }
    if (!createForm.contactId) {
      setFormErrors((prev) => ({
        ...prev,
        manual: "Choose a contact person for this lead.",
      }));
      return;
    }
    const valueNum = Number(createForm.value.replace(/,/g, "")) || 0;
    const value = Math.max(0, valueNum);

    setIsSavingLead(true);

    const today = new Date().toISOString().split("T")[0]!;
    const currency = createForm.currency;
    const probability = quickCapture ? 40 : 50;
    const initialStageId = sortedStages[0]?.id ?? AUTOMATION_DEFAULT_LEAD_STAGE_ID;
    const newLeadId = `lead-${crypto.randomUUID()}`;
    const newLead: CrmLead = {
      id: newLeadId,
      name: createForm.name.trim(),
      customerId: createForm.customerId,
      contactId: createForm.contactId || undefined,
      sourceId: createForm.sourceId,
      value,
      currency,
      baseValue: computeBaseValue(value, currency),
      probability: Math.min(100, Math.max(0, probability)),
      expectedClose: today,
      stageId: initialStageId,
      stageEnteredAt: today,
      primarySales: quickCapture
        ? AUTOMATION_DEFAULT_LEAD_ROLES.primarySales
        : createForm.primarySales,
      presales: quickCapture ? AUTOMATION_DEFAULT_LEAD_ROLES.presales : createForm.presales,
      channel: quickCapture ? AUTOMATION_DEFAULT_LEAD_ROLES.channel : createForm.channel,
      pqq: usesCustomPqqForm ? undefined : createPqq ?? undefined,
      pqqFormValues: usesCustomPqqForm
        ? createPqqFormValues
          ? clonePqqFormValues(createPqqFormValues)
          : undefined
        : undefined,
      activities: [],
    };
    setLeads((prev) => [newLead, ...prev]);
    setCreateOpen(false);
    setCreateForm({
      name: "",
      customerId: "",
      contactId: "",
      sourceId:
        sortedLeadSources.find((source) => source.isDefault)?.id ??
        sortedLeadSources[0]?.id ??
        AUTOMATION_DEFAULT_LEAD_SOURCE_ID,
      value: "",
      currency: "ETB",
      primarySales: AUTOMATION_DEFAULT_LEAD_ROLES.primarySales,
      presales: AUTOMATION_DEFAULT_LEAD_ROLES.presales,
      channel: AUTOMATION_DEFAULT_LEAD_ROLES.channel,
    });
    setCreatePqq(null);
    setCreatePqqFormValues(null);
    setPqqDraft(getDefaultPqqWorksheet(pqqTemplates));
    setPqqFormDraft(createEmptyPqqFormValues(defaultPqqFormDefinition));
    setSaveFeedback({ type: "success", message: "Lead created successfully." });
    setIsSavingLead(false);
  };

  const addInlineCustomer = () => {
    const name = newCustomer.name.trim();
    if (!name || !newCustomer.industry || !newCustomer.size) return;
    const today = new Date().toISOString().split("T")[0]!;
    const owner = customerOwners[0] ?? "Sara Tesfaye";
    const id = `acc-new-${crypto.randomUUID().slice(0, 8)}`;
    const account: CustomerAccount = {
      id,
      name,
      industry: newCustomer.industry,
      size: newCustomer.size,
      email: "",
      phone: "",
      address: "",
      city: newCustomer.city.trim() || "Addis Ababa",
      country: newCustomer.country.trim() || "Ethiopia",
      website: newCustomer.website.trim(),
      owner,
      status: "Lead",
      lifecycleStage: "Lead",
      leadSource: "CRM",
      createdAt: today,
    };
    setExtraCustomerAccounts((prev) => [...prev, account]);
    setInlineAccountIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setCreateForm((p) => ({ ...p, customerId: id, contactId: "" }));
    setNewCustomer({
      name: "",
      industry: industries[0] ?? "Technology",
      size: accountSizes[0] ?? "1-10",
      city: "",
      country: "Ethiopia",
      website: "",
    });
    setAddCustomerOpen(false);
    setContactSearch("");
    setContactRoleFilter("all");
    setNewContact({
      firstName: "",
      lastName: "",
      roleTitle: "",
      email: "",
      phone: "",
      associationRole: associationRoles[0] ?? "Decision Maker",
    });
    setContactMode("add");
    setContactPickerOpen(true);
  };

  const isForcedContactCreation = (accountId: string | "") => {
    if (!accountId) return false;
    if (!inlineAccountIds.has(accountId)) return false;
    return contactsForAccountId(accountId).length === 0;
  };

  const openContactPickerForExistingAccount = () => {
    if (!createForm.customerId) return;
    setContactSearch("");
    setContactRoleFilter("all");
    setContactMode(isForcedContactCreation(createForm.customerId) ? "add" : "pick");
    setContactPickerOpen(true);
  };

  const selectContactForLead = (contactId: string) => {
    if (!createForm.customerId) return;
    const accountId = createForm.customerId;
    const existing = associationFor(accountId, contactId);
    if (!existing) {
      const newAssoc: AccountContactAssociation = {
        id: `assoc-new-${crypto.randomUUID().slice(0, 8)}`,
        accountId,
        contactId,
        role: associationRoles[0] ?? "Decision Maker",
        isPrimary: contactsForAccountId(accountId).length === 0,
      };
      setExtraAssociations((prev) => [...prev, newAssoc]);
    }
    setCreateForm((p) => ({ ...p, contactId }));
    setContactPickerOpen(false);
  };

  const addInlineContact = () => {
    const first = newContact.firstName.trim();
    const last = newContact.lastName.trim();
    const email = newContact.email.trim();
    if (!first || !last || !email) return;
    if (!createForm.customerId) return;
    const today = new Date().toISOString().split("T")[0]!;
    const owner = customerOwners[0] ?? "Sara Tesfaye";
    const contactId = `con-new-${crypto.randomUUID().slice(0, 8)}`;
    const contact: CustomerContact = {
      id: contactId,
      firstName: first,
      lastName: last,
      roleTitle: newContact.roleTitle.trim() || "—",
      email: newContact.email.trim(),
      phone: newContact.phone.trim(),
      owner,
      status: "Active",
      createdAt: today,
    };
    const newAssoc: AccountContactAssociation = {
      id: `assoc-new-${crypto.randomUUID().slice(0, 8)}`,
      accountId: createForm.customerId,
      contactId,
      role: newContact.associationRole,
      isPrimary: contactsForAccountId(createForm.customerId).length === 0,
    };
    setExtraContacts((prev) => [...prev, contact]);
    setExtraAssociations((prev) => [...prev, newAssoc]);
    setCreateForm((p) => ({ ...p, contactId }));
    setNewContact({
      firstName: "",
      lastName: "",
      roleTitle: "",
      email: "",
      phone: "",
      associationRole: associationRoles[0] ?? "Decision Maker",
    });
    setContactMode("pick");
    setContactPickerOpen(false);
  };

  const contactDisplayName = (c: CustomerContact) =>
    `${c.firstName} ${c.lastName}`.trim() || c.email || "Untitled contact";

  const buildPqqDraftFromCreateForm = (): DealPqq => {
    const base = createPqq ?? getDefaultPqqWorksheet(pqqTemplates);
    const account = createForm.customerId
      ? accountById.get(createForm.customerId)
      : undefined;
    const contact = createForm.contactId
      ? contactById.get(createForm.contactId)
      : undefined;

    return {
      ...base,
      opportunityName: createForm.name.trim() || base.opportunityName,
      clientName: account?.name ?? base.clientName,
      industry: account?.industry ?? base.industry,
      contactPerson: contact ? contactDisplayName(contact) : base.contactPerson,
    };
  };

  const openFillPqq = () => {
    if (usesCustomPqqForm) {
      setPqqFormDraft(
        createPqqFormValues
          ? clonePqqFormValues(createPqqFormValues)
          : createEmptyPqqFormValues(defaultPqqFormDefinition),
      );
    } else {
      setPqqDraft(buildPqqDraftFromCreateForm());
    }
    setPqqActiveTab("discovery");
    setDiscoveryStep(0);
    setBantStep(0);
    setPqqDialogOpen(true);
  };

  const saveCreatePqq = () => {
    if (usesCustomPqqForm) {
      setCreatePqqFormValues(clonePqqFormValues(pqqFormDraft));
    } else {
      setCreatePqq(pqqDraft);
    }
    setPqqDialogOpen(false);
  };

  const agingLabel = (lead: CrmLead) => {
    const st = stageById.get(lead.stageId);
    if (!st || st.category !== "open") return null;
    const days = daysBetween(lead.stageEnteredAt);
    if (days < STAGE_AGING_WARNING_DAYS) return null;
    return `Stuck for ${days} days`;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">Leads</h1>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          Pipeline, scoring, and lead qualification in one view
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-[#f5f6fa]">
        {saveFeedback && (
          <div
            className={cn(
              "mx-3 mt-3 rounded-md border px-3 py-2 text-sm sm:mx-5",
              saveFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {saveFeedback.message}
          </div>
        )}

        {isPageLoading ? (
          <div className="space-y-4 p-3 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-[#e5e7eb]" />
              ))}
            </div>
            <div className="h-10 animate-pulse rounded-lg bg-[#e5e7eb]" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[280px] animate-pulse rounded-lg bg-[#e5e7eb]" />
              ))}
            </div>
          </div>
        ) : (
          <>
        <div className="flex-shrink-0 space-y-4 p-3 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 sm:gap-3">
              <div className="relative w-full min-w-[200px] sm:max-w-[320px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leads by name or customer"
                  className="h-9 border-[#e5e7eb] bg-white pl-9"
                />
              </div>
              <FormField label="Stage" className="w-[150px]">
                <Select value={filterStageId} onValueChange={setFilterStageId}>
                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-xs">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {sortedStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Teams" className="w-[150px]">
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-xs">
                    <SelectValue placeholder="Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    {ownerOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Qualification score" className="w-[160px]">
                <Select
                  value={filterProbability}
                  onValueChange={(v) => setFilterProbability(v as ProbabilityFilter)}
                >
                  <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High (70%+)</SelectItem>
                    <SelectItem value="medium">Medium (40–69%)</SelectItem>
                    <SelectItem value="low">Low (under 40%)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Toggle view"
                className="inline-flex h-9 items-center rounded-md border border-[#e5e7eb] bg-white p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={viewMode === "kanban"}
                  aria-label="Kanban view"
                  onClick={() => setViewMode("kanban")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors",
                    viewMode === "kanban"
                      ? "bg-[#eef2fd] text-[#245fcb]"
                      : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1c1e21]",
                  )}
                >
                  <Kanban size={14} />
                  Kanban
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === "list"}
                  aria-label="List view"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors",
                    viewMode === "list"
                      ? "bg-[#eef2fd] text-[#245fcb]"
                      : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1c1e21]",
                  )}
                >
                  <ListIcon size={14} />
                  List
                </button>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-9 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                onClick={() => {
                  setQuickCapture(false);
                  setCreateOpen(true);
                }}
              >
                <Plus size={14} className="mr-1.5" />
                New Lead
              </Button>
            </div>
          </div>
        </div>

        {viewMode === "kanban" ? (
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-3 pb-4 sm:px-5 no-scrollbar">
          {sortedStages.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[#d1d5db] bg-white p-6 text-center">
              <div>
                <p className="text-sm font-medium text-[#374151]">No pipeline stages configured.</p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Add stages from Leads Settings before creating or moving leads.
                </p>
              </div>
            </div>
          ) : (
          <div className="flex h-full min-w-max gap-3 pb-1">
            {sortedStages.map((stage) => {
              const columnLeads = filteredPipelineLeads.filter((l) => l.stageId === stage.id);
              const totalBase = columnLeads.reduce((sum, l) => sum + l.baseValue, 0);
              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex h-full w-[280px] shrink-0 flex-col rounded-lg border",
                    stage.columnClass,
                    stage.borderClass,
                  )}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnStage(e, stage.id)}
                >
                  <div className="border-b border-black/5 px-3 py-2.5">
                    <p className="text-sm font-semibold text-[#1c1e21]">{stage.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6b7280]">
                      <span>{columnLeads.length} leads</span>
                      <span className="text-[#d1d5db]">·</span>
                      <span className="font-medium text-[#374151]">
                        {formatMoney(totalBase, BASE_CURRENCY)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto p-2 no-scrollbar">
                    {columnLeads.length === 0 && (
                      <div className="rounded-md border border-dashed border-[#d1d5db] bg-white/70 p-3 text-center text-xs text-[#6b7280]">
                        No leads in this stage
                      </div>
                    )}
                    {columnLeads.map((lead) => {
                      const customer = accountById.get(lead.customerId);
                      const stuck = agingLabel(lead);
                      const pqqQualification = isLeadPqqQualified(
                        lead.pqq,
                        pqqSettings.bantDecisionThreshold,
                        {
                          formDefinition: defaultPqqFormDefinition,
                          formValues: lead.pqqFormValues,
                        },
                      );
                      const hasSavedPqq = usesCustomPqqForm
                        ? Boolean(lead.pqqFormValues)
                        : Boolean(lead.pqq);
                      return (
                        <Card
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className="cursor-pointer border-[#e5e7eb] bg-white shadow-sm hover:border-[#4080f0] transition-colors"
                          onClick={() => openLeadDetail(lead)}
                        >
                          <CardContent className="space-y-2 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug text-[#1c1e21]">
                                {lead.name}
                              </p>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                {PQQ_UI_ENABLED && !hasSavedPqq && (
                                  <Badge
                                    variant="outline"
                                    className="border-[#fdba74] bg-[#fff7ed] text-[10px] text-[#9a3412]"
                                  >
                                    PQQ missing
                                  </Badge>
                                )}
                                {PQQ_UI_ENABLED && pqqQualification === false && (
                                  <Badge
                                    variant="outline"
                                    className="border-rose-200 bg-rose-50 text-[10px] text-rose-900"
                                  >
                                    Non-qualified
                                  </Badge>
                                )}
                                {stuck && (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-200 bg-amber-50 text-[10px] text-amber-900"
                                  >
                                    <AlertTriangle className="mr-0.5 size-3" />
                                    {stuck}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {lead.team && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-medium",
                                    salesTeamBadgeClass(lead.team),
                                  )}
                                >
                                  {lead.team}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-[#6b7280]">{customer?.name ?? "—"}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-[#1c1e21]">
                                {formatMoney(lead.value, lead.currency)}
                              </span>
                              {lead.currency !== BASE_CURRENCY && (
                                <span className="text-[#9ca3af]">
                                  ({formatMoney(lead.baseValue, BASE_CURRENCY)})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                              <span className="inline-flex items-center gap-0.5">
                                <Percent size={12} />
                                {lead.probability}%
                              </span>
                              <span className="text-[#d1d5db]">·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Calendar size={12} />
                                {lead.expectedClose}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
        ) : (
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-4 sm:px-5 no-scrollbar">
          <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Lead
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Customer
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Stage
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Value
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Score
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Expected close
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Owner
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPipelineLeads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-[#6b7280]"
                    >
                      No leads match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPipelineLeads.map((lead) => {
                    const customer = accountById.get(lead.customerId);
                    const stage = stageById.get(lead.stageId);
                    const stuck = agingLabel(lead);
                    return (
                      <TableRow
                        key={lead.id}
                        className="cursor-pointer"
                        onClick={() => openLeadDetail(lead)}
                      >
                        <TableCell className="font-medium text-[#1c1e21]">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{lead.name}</span>
                            {stuck && (
                              <Badge
                                variant="outline"
                                className="shrink-0 border-amber-200 bg-amber-50 text-[10px] text-amber-900"
                              >
                                <AlertTriangle className="mr-0.5 size-3" />
                                {stuck}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-[#374151]">
                          {customer?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {stage ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "border text-xs font-medium",
                                stage.borderClass,
                                stage.columnClass,
                                "text-[#1c1e21]",
                              )}
                            >
                              {stage.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-[#9ca3af]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-[#1c1e21]">
                          <div className="inline-flex flex-col items-end">
                            <span>{formatMoney(lead.value, lead.currency)}</span>
                            {lead.currency !== BASE_CURRENCY && (
                              <span className="text-[10px] font-normal text-[#9ca3af]">
                                {formatMoney(lead.baseValue, BASE_CURRENCY)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-[#374151]">
                          <span className="inline-flex items-center gap-0.5 text-xs text-[#6b7280]">
                            <Percent size={12} />
                            {lead.probability}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-[#374151]">
                          <span className="inline-flex items-center gap-1 text-xs text-[#6b7280]">
                            <Calendar size={12} />
                            {lead.expectedClose}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="bg-[#eef2fd] text-[9px] text-[#245fcb]">
                                {initials(lead.primarySales)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs text-[#374151]">
                              {lead.primarySales}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        )}
          </>
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setAddCustomerOpen(false);
            setCreatePqq(null);
            setCreatePqqFormValues(null);
            setPqqDialogOpen(false);
            setPqqDraft(getDefaultPqqWorksheet(pqqTemplates));
            setPqqFormDraft(createEmptyPqqFormValues(defaultPqqFormDefinition));
          }
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Create new lead</DialogTitle>
          </DialogHeader>

          <div className="mb-4 flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#fafbff] px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[#1c1e21]">Quick capture</p>
              <p className="text-xs text-[#6b7280]">Minimal fields for direct sales</p>
            </div>
            <Switch checked={quickCapture} onCheckedChange={setQuickCapture} />
          </div>

          <div className="grid gap-4 py-1">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Lead name *">
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-9 border-[#e5e7eb]"
                  placeholder="Lead Name"
                />
              </FormField>
              <FormField label="Customer account *">
                <Select
                  value={createForm.customerId}
                  onValueChange={(v) =>
                    setCreateForm((p) => ({ ...p, customerId: v, contactId: "" }))
                  }
                >
                  <SelectTrigger className="h-9 border-[#e5e7eb]">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCustomerAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                    <div
                      className="border-t border-[#e5e7eb] p-1"
                      onPointerDown={(e) => e.preventDefault()}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-full justify-start gap-1.5 font-medium text-[#4080f0] hover:bg-[#eef2fd] hover:text-[#3070e0]"
                        onClick={() => {
                          setNewCustomer({
                            name: "",
                            industry: industries[0] ?? "Technology",
                            size: accountSizes[0] ?? "1-10",
                            city: "",
                            country: "Ethiopia",
                            website: "",
                          });
                          setAddCustomerOpen(true);
                        }}
                      >
                        <Plus size={14} />
                        + New Customer
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Lead source *">
                <Select
                  value={createForm.sourceId}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, sourceId: v }))}
                >
                  <SelectTrigger className="h-9 border-[#e5e7eb]">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedLeadSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {createForm.customerId && (() => {
              const accountId = createForm.customerId;
              const isInline = inlineAccountIds.has(accountId);
              const contacts = contactsForAccountId(accountId);
              const selectedContact = createForm.contactId
                ? contactById.get(createForm.contactId)
                : null;
              return (
                <FormField label="Contact person *">
                  {selectedContact ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border border-[#e5e7eb] bg-[#fafbff] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#1c1e21]">
                          {contactDisplayName(selectedContact)}
                        </p>
                        <p className="truncate text-xs text-[#6b7280]">
                          {selectedContact.roleTitle}
                          {selectedContact.email
                            ? ` · ${selectedContact.email}`
                            : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[#4080f0] hover:bg-[#eef2fd] hover:text-[#3070e0]"
                        onClick={openContactPickerForExistingAccount}
                      >
                        Change
                      </Button>
                    </div>
                  ) : isInline || contacts.length === 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-full justify-start gap-1.5 border-dashed border-[#cbd5e1] text-[#4080f0] hover:bg-[#eef2fd] hover:text-[#3070e0]"
                      onClick={openContactPickerForExistingAccount}
                    >
                      <Plus size={14} />
                      Choose contact person
                    </Button>
                  ) : (
                    <div className="space-y-1.5">
                      <Select
                        value={createForm.contactId || undefined}
                        onValueChange={(v) =>
                          setCreateForm((p) => ({ ...p, contactId: v }))
                        }
                      >
                        <SelectTrigger className="h-9 border-[#e5e7eb]">
                          <SelectValue placeholder="Select contact" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map((c) => {
                            const assoc = associationFor(accountId, c.id);
                            return (
                              <SelectItem key={c.id} value={c.id}>
                                <span className="flex items-baseline gap-1.5">
                                  {contactDisplayName(c)}
                                  {assoc?.isPrimary && (
                                    <span className="text-[10px] font-medium uppercase tracking-wide text-[#4080f0]">
                                      primary
                                    </span>
                                  )}
                                  <span className="text-xs text-[#9ca3af]">
                                    · {c.roleTitle}
                                  </span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        className="text-xs font-medium text-[#4080f0] hover:underline"
                        onClick={openContactPickerForExistingAccount}
                      >
                        + Add another contact
                      </button>
                    </div>
                  )}
                </FormField>
              );
            })()}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Estimated value (optional)">
                  <Input
                    value={createForm.value}
                    onChange={(e) => setCreateForm((p) => ({ ...p, value: e.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                    placeholder="0"
                    inputMode="decimal"
                  />
                </FormField>
                <FormField label="Currency">
                  <Select
                    value={createForm.currency}
                    onValueChange={(v) =>
                      setCreateForm((p) => ({ ...p, currency: v as DealCurrency }))
                    }
                  >
                    <SelectTrigger className="h-9 border-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="Pipeline stage">
                <Input
                  readOnly
                  value={sortedStages[0]?.name ?? "New"}
                  className="h-9 border-[#e5e7eb] bg-[#fafbff] text-[#374151]"
                />
              </FormField>
            </div>

            {!quickCapture && (
              <>
                <Separator className="my-2" />
                <div className="space-y-3">
                  <p className="text-xs font-medium text-[#6b7280]">Assign roles</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField label="Primary sales">
                      <Select
                        value={createForm.primarySales}
                        onValueChange={(v) =>
                          setCreateForm((p) => ({ ...p, primarySales: v }))
                        }
                      >
                        <SelectTrigger className="h-9 border-[#e5e7eb]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ownerOptions.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Pre-sales">
                      <Select
                        value={createForm.presales}
                        onValueChange={(v) => setCreateForm((p) => ({ ...p, presales: v }))}
                      >
                        <SelectTrigger className="h-9 border-[#e5e7eb]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ownerOptions.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Channel">
                      <Select
                        value={createForm.channel}
                        onValueChange={(v) => setCreateForm((p) => ({ ...p, channel: v }))}
                      >
                        <SelectTrigger className="h-9 border-[#e5e7eb]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ownerOptions.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                </div>
              </>
            )}
          </div>
          {formErrors.manual && (
            <p className="text-xs text-red-600">{formErrors.manual}</p>
          )}

          <DialogFooter
            className={cn(
              "flex-col gap-3 sm:flex-row sm:items-center",
              PQQ_UI_ENABLED ? "sm:justify-between" : "sm:justify-end",
            )}
          >
            {PQQ_UI_ENABLED && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openFillPqq}
                >
                  Fill PQQ
                </Button>
                {(usesCustomPqqForm ? createPqqFormValues : createPqq) && (
                  <span className="text-xs text-[#6b7280]">PQQ attached</span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                onClick={saveNewLead}
                disabled={isSavingLead}
              >
                {isSavingLead ? "Saving..." : "Create lead"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {PQQ_UI_ENABLED && (
      <Dialog open={pqqDialogOpen} onOpenChange={setPqqDialogOpen}>
        <DialogContent className="flex max-h-[min(88vh,660px)] max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-lg">
          {usesCustomPqqForm && pqqWizardSections.length > 0 ? (() => {
            const discoverySections = pqqWizardSections.filter((ws) => ws.step.id === "discovery");
            const bantSections = pqqWizardSections.filter((ws) => ws.step.id === "bant");
            const activeTabSections = pqqActiveTab === "discovery" ? discoverySections : bantSections;
            const activeStep = pqqActiveTab === "discovery" ? discoveryStep : bantStep;
            const setActiveStep = pqqActiveTab === "discovery" ? setDiscoveryStep : setBantStep;

            const current = activeTabSections[activeStep];
            const total = activeTabSections.length;
            const isLast = activeStep === total - 1;
            const isFirst = activeStep === 0;
            const pct = total > 0 ? Math.round(((activeStep + 1) / total) * 100) : 0;
            const allOptional = current?.fields.every((f) => !f.required) ?? true;
            const discoveryDone = discoverySections.length > 0 && discoveryStep >= discoverySections.length - 1;
            const bantDone = bantSections.length > 0 && bantStep >= bantSections.length - 1;

            return (
              <>
                {/* Header */}
                <DialogHeader className="shrink-0 pb-0">
                  <div className="flex items-center justify-between gap-2 pr-7">
                    <DialogTitle className="text-sm">PQQ Assessment</DialogTitle>
                    <button
                      type="button"
                      className="rounded-full bg-[#eef2fd] px-2.5 py-1 text-[11px] font-semibold text-[#4080f0]"
                      onClick={saveCreatePqq}
                    >
                      Save &amp; close
                    </button>
                  </div>

                  {/* Tab bar */}
                  <div className="mt-3 flex gap-1 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-1">
                    {(
                      [
                        { key: "discovery" as const, label: "Discovery", done: discoveryDone, step: discoveryStep, sections: discoverySections },
                        { key: "bant" as const, label: "BANT Scoring", done: bantDone, step: bantStep, sections: bantSections },
                      ] as const
                    ).map((tab) => {
                      const isActive = pqqActiveTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setPqqActiveTab(tab.key)}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all",
                            isActive
                              ? "bg-white shadow-sm text-[#1c1e21]"
                              : "text-[#6b7280] hover:text-[#374151]",
                          )}
                        >
                          {tab.done ? (
                            <CheckCircle2
                              size={13}
                              className={isActive ? "text-emerald-500" : "text-emerald-400"}
                            />
                          ) : tab.key === "bant" ? (
                            <ShieldCheck size={13} className={isActive ? "text-[#4080f0]" : "text-[#9ca3af]"} />
                          ) : null}
                          {tab.label}
                          {tab.sections.length > 0 && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                                isActive
                                  ? "bg-[#eef2fd] text-[#4080f0]"
                                  : "bg-[#e5e7eb] text-[#9ca3af]",
                              )}
                            >
                              {tab.step + 1}/{tab.sections.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Section progress within active tab */}
                  {total > 0 && (
                    <div className="mt-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-xs font-medium text-[#1c1e21]">{current?.section.title}</p>
                        <span className="text-[11px] font-semibold text-[#4080f0]">
                          {activeStep + 1}/{total}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2f7]">
                        <div
                          className="h-full rounded-full bg-[#4080f0] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex gap-1">
                        {activeTabSections.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveStep(i)}
                            className={cn(
                              "shrink-0 rounded-full transition-all",
                              i === activeStep
                                ? "h-1.5 w-4 bg-[#4080f0]"
                                : i < activeStep
                                  ? "h-1.5 w-1.5 bg-[#4080f0]/40"
                                  : "h-1.5 w-1.5 bg-[#e5e7eb]",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </DialogHeader>

                {/* Section fields */}
                <div className="min-h-0 flex-1 overflow-y-auto py-2">
                  {total === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
                      <p className="text-sm font-medium text-[#374151]">No sections here</p>
                      <p className="text-xs text-[#9ca3af]">
                        Switch to the other tab or configure sections in template settings.
                      </p>
                    </div>
                  ) : current ? (
                    <div className="space-y-4 px-1">
                      {current.section.description && (
                        <p className="text-xs text-[#6b7280]">{current.section.description}</p>
                      )}
                      {current.fields.length === 0 ? (
                        <p className="py-4 text-center text-xs text-[#9ca3af]">No fields in this section.</p>
                      ) : (
                        current.fields.map((field) => (
                          <div key={field.id} className="space-y-1.5">
                            {field.type !== "checkbox" && (
                              <label className="text-xs font-medium text-[#374151]">
                                {field.label}
                                {field.required && <span className="ml-0.5 text-red-400">*</span>}
                              </label>
                            )}

                            {field.type === "checkbox" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPqqFormDraft((prev) => ({
                                    ...prev,
                                    [field.id]: !(prev[field.id] === true),
                                  }))
                                }
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors",
                                  pqqFormDraft[field.id] === true
                                    ? "border-[#4080f0] bg-[#eef2fd] text-[#245fcb]"
                                    : "border-[#e5e7eb] bg-white text-[#4b5563] hover:border-[#cbd5e1]",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                    pqqFormDraft[field.id] === true
                                      ? "border-[#4080f0] bg-[#4080f0]"
                                      : "border-[#d1d5db]",
                                  )}
                                >
                                  {pqqFormDraft[field.id] === true && (
                                    <Check size={11} className="text-white" />
                                  )}
                                </span>
                                <span className="text-sm font-medium">{field.label}</span>
                              </button>
                            ) : field.type === "textarea" ? (
                              <Textarea
                                value={String(pqqFormDraft[field.id] ?? "")}
                                onChange={(e) =>
                                  setPqqFormDraft((prev) => ({ ...prev, [field.id]: e.target.value }))
                                }
                                placeholder={field.placeholder}
                                className="min-h-[80px] resize-none border-[#e5e7eb] text-sm"
                              />
                            ) : field.type === "select" ? (
                              <Select
                                value={String(pqqFormDraft[field.id] ?? "")}
                                onValueChange={(v) =>
                                  setPqqFormDraft((prev) => ({ ...prev, [field.id]: v }))
                                }
                              >
                                <SelectTrigger className="h-9 border-[#e5e7eb] text-sm">
                                  <SelectValue placeholder={field.placeholder ?? "Select"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {(field.options ?? []).map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.type === "slider" ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0f2f7]">
                                    <div
                                      className="h-full rounded-full bg-[#4080f0] transition-all"
                                      style={{
                                        width: `${((Number(pqqFormDraft[field.id] ?? field.min ?? 0) - (field.min ?? 0)) / ((field.max ?? 12) - (field.min ?? 0))) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="ml-3 w-10 text-right text-sm font-bold tabular-nums text-[#1c1e21]">
                                    {Number(pqqFormDraft[field.id] ?? field.min ?? 0)}/{field.max ?? 12}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={field.min ?? 0}
                                  max={field.max ?? 12}
                                  value={Number(pqqFormDraft[field.id] ?? field.min ?? 0)}
                                  onChange={(e) =>
                                    setPqqFormDraft((prev) => ({
                                      ...prev,
                                      [field.id]: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full accent-[#4080f0]"
                                />
                              </div>
                            ) : (
                              <Input
                                type={field.type === "number" ? "number" : "text"}
                                value={String(pqqFormDraft[field.id] ?? "")}
                                onChange={(e) =>
                                  setPqqFormDraft((prev) => ({
                                    ...prev,
                                    [field.id]:
                                      field.type === "number"
                                        ? Number(e.target.value) || 0
                                        : e.target.value,
                                  }))
                                }
                                placeholder={field.placeholder}
                                className="h-9 border-[#e5e7eb] text-sm"
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Footer nav */}
                <div className="shrink-0 border-t border-[#e5e7eb] pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-[#6b7280]"
                      onClick={() => {
                        if (isFirst) {
                          if (pqqActiveTab === "bant") {
                            setPqqActiveTab("discovery");
                          } else {
                            setPqqDialogOpen(false);
                          }
                        } else {
                          setActiveStep((s) => s - 1);
                        }
                      }}
                    >
                      <ArrowLeft size={13} />
                      {isFirst && pqqActiveTab === "bant"
                        ? "Discovery"
                        : isFirst
                          ? "Cancel"
                          : "Back"}
                    </Button>

                    <div className="flex items-center gap-2">
                      {allOptional && !isLast && total > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-[#9ca3af] hover:text-[#6b7280]"
                          onClick={() => setActiveStep((s) => s + 1)}
                        >
                          <SkipForward size={12} />
                          Skip
                        </Button>
                      )}
                      {total > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          className={cn(
                            "gap-1.5",
                            isLast && pqqActiveTab === "bant"
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-[#4080f0] text-white hover:bg-[#3070e0]",
                          )}
                          onClick={() => {
                            if (isLast) {
                              if (pqqActiveTab === "discovery") {
                                setPqqActiveTab("bant");
                                setBantStep(0);
                              } else {
                                saveCreatePqq();
                              }
                            } else {
                              setActiveStep((s) => s + 1);
                            }
                          }}
                        >
                          {isLast && pqqActiveTab === "bant" ? (
                            <>
                              <Check size={13} /> Save PQQ
                            </>
                          ) : isLast && pqqActiveTab === "discovery" ? (
                            <>
                              BANT <ArrowRight size={13} />
                            </>
                          ) : (
                            <>
                              Next <ArrowRight size={13} />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })() : (
            <>
              <DialogHeader>
                <DialogTitle>Fill PQQ</DialogTitle>
                <DialogDescription>
                  Optional qualification worksheet. Skip and fill it later on the lead record.
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <DealPqqSection
                  compact
                  value={pqqDraft}
                  onChange={setPqqDraft}
                  decisionThreshold={pqqSettings.bantDecisionThreshold}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setPqqDialogOpen(false)}>
                  Skip for now
                </Button>
                <Button
                  size="sm"
                  className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                  onClick={saveCreatePqq}
                >
                  Save PQQ
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      )}

      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>
              Capture firmographic details for this account. After saving, you&apos;ll be asked to add a
              primary contact.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2">
            <FormField label="Account Name *" className="sm:col-span-2">
              <Input
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, name: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
                placeholder="Company name"
                autoFocus
              />
            </FormField>
            <FormField label="Industry *">
              <Select
                value={newCustomer.industry}
                onValueChange={(v) => setNewCustomer((p) => ({ ...p, industry: v }))}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Organization Size *">
              <Select
                value={newCustomer.size}
                onValueChange={(v) => setNewCustomer((p) => ({ ...p, size: v }))}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {accountSizes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="City">
              <Input
                value={newCustomer.city}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, city: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
                placeholder="City"
              />
            </FormField>
            <FormField label="Country">
              <Input
                value={newCustomer.country}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, country: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
                placeholder="Country"
              />
            </FormField>
            <FormField label="Website" className="sm:col-span-2">
              <Input
                value={newCustomer.website}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, website: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
                placeholder="https://example.com"
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddCustomerOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={addInlineCustomer}
              disabled={
                !newCustomer.name.trim() ||
                !newCustomer.industry ||
                !newCustomer.size
              }
            >
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={contactPickerOpen}
        onOpenChange={(open) => {
          setContactPickerOpen(open);
          if (!open) setContactMode("pick");
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[640px]">
          {(() => {
            const accountId = createForm.customerId;
            const acc = accountId ? accountById.get(accountId) : null;
            const forced = accountId ? isForcedContactCreation(accountId) : false;
            return (
              <DialogHeader>
                <DialogTitle>
                  {forced || contactMode === "add" ? "Add Contact" : "Choose contact person"}
                </DialogTitle>
                <DialogDescription>
                  {forced
                    ? `Please create a contact for ${acc?.name ?? "this account"} to link to this lead.`
                    : contactMode === "add"
                      ? `Create a new contact and link them to ${acc?.name ?? "this account"}.`
                      : `Pick or add a contact for ${acc?.name ?? "this account"}.`}
                </DialogDescription>
              </DialogHeader>
            );
          })()}

          {contactMode === "pick" ? (
            (() => {
              const accountId = createForm.customerId;
              const isInline = accountId ? inlineAccountIds.has(accountId) : false;
              const accountContacts = accountId
                ? contactsForAccountId(accountId)
                : [];
              const showAll = isInline || accountContacts.length === 0;
              const pool = showAll ? allContacts : accountContacts;
              const q = contactSearch.trim().toLowerCase();
              const roleQ = contactRoleFilter;
              const filtered = pool.filter((c) => {
                if (
                  q &&
                  !contactDisplayName(c).toLowerCase().includes(q) &&
                  !c.email.toLowerCase().includes(q) &&
                  !c.roleTitle.toLowerCase().includes(q)
                ) {
                  return false;
                }
                if (roleQ !== "all" && accountId) {
                  const assoc = associationFor(accountId, c.id);
                  if (!assoc || assoc.role !== roleQ) return false;
                }
                return true;
              });
              return (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                      />
                      <Input
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search name, email, or title"
                        className="h-9 border-[#e5e7eb] pl-9"
                      />
                    </div>
                    {!showAll && (
                      <Select
                        value={contactRoleFilter}
                        onValueChange={setContactRoleFilter}
                      >
                        <SelectTrigger className="h-9 w-full border-[#e5e7eb] sm:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All roles</SelectItem>
                          {associationRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto rounded-md border border-[#e5e7eb]">
                    {filtered.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-[#6b7280]">
                        No contacts match. Try adjusting filters or add a new contact.
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#f0f2f7]">
                        {filtered.map((c) => {
                          const assoc = accountId
                            ? associationFor(accountId, c.id)
                            : null;
                          return (
                            <li
                              key={c.id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafbff]"
                            >
                              <Avatar className="size-9 border border-[#e5e7eb]">
                                <AvatarFallback className="bg-[#eef2fd] text-[10px] text-[#245fcb]">
                                  {initials(contactDisplayName(c))}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-[#1c1e21]">
                                  {contactDisplayName(c)}
                                  {assoc?.isPrimary && (
                                    <span className="ml-1.5 rounded-full bg-[#eef2fd] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#4080f0]">
                                      Primary
                                    </span>
                                  )}
                                </p>
                                <p className="truncate text-xs text-[#6b7280]">
                                  {c.roleTitle}
                                  {c.email ? ` · ${c.email}` : ""}
                                  {assoc ? ` · ${assoc.role}` : ""}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 border-[#e5e7eb]"
                                onClick={() => selectContactForLead(c.id)}
                              >
                                Select
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center gap-1.5 text-[#4080f0] hover:bg-[#eef2fd] hover:text-[#3070e0]"
                    onClick={() => setContactMode("add")}
                  >
                    <Plus size={14} />
                    Add new contact
                  </Button>
                </div>
              );
            })()
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="First Name *">
                  <Input
                    value={newContact.firstName}
                    onChange={(e) =>
                      setNewContact((p) => ({ ...p, firstName: e.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                    placeholder="First name"
                    autoFocus
                  />
                </FormField>
                <FormField label="Last Name *">
                  <Input
                    value={newContact.lastName}
                    onChange={(e) =>
                      setNewContact((p) => ({ ...p, lastName: e.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                    placeholder="Last name"
                  />
                </FormField>
                <FormField label="Role / Title">
                  <Input
                    value={newContact.roleTitle}
                    onChange={(e) =>
                      setNewContact((p) => ({ ...p, roleTitle: e.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                    placeholder="e.g. Procurement Director"
                  />
                </FormField>
                <FormField label="Email *">
                  <Input
                    type="email"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact((p) => ({ ...p, email: e.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                    placeholder="name@company.com"
                  />
                </FormField>
                <FormField label="Phone" className="sm:col-span-2">
                  <Input
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                    placeholder="0911..."
                  />
                </FormField>
              </div>
            </div>
          )}

          {(() => {
            const accountId = createForm.customerId;
            const forced = accountId ? isForcedContactCreation(accountId) : false;
            return (
              <DialogFooter>
                {contactMode === "add" ? (
                  <>
                    {!forced && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setContactMode("pick")}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                      onClick={addInlineContact}
                      disabled={
                        !newContact.firstName.trim() ||
                        !newContact.lastName.trim() ||
                        !newContact.email.trim()
                      }
                    >
                      Create Contact
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContactPickerOpen(false)}
                  >
                    Cancel
                  </Button>
                )}
              </DialogFooter>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
