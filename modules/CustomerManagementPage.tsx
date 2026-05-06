"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Contact,
  GitBranch,
  Search,
  Plus,
  Link2,
  Users,
  UserRound,
  GitCompareArrows,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  UserX,
  CheckCircle2,
  Check,
  X,
  Edit2,
  Phone,
  MessageSquare,
  Mail,
  ClipboardList,
  BadgeCheck,
  BadgeX,
  Briefcase,
  BriefcaseBusiness,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  accountContactAssociations as initialAssociations,
  accountSizes,
  associationRoles,
  customerAccounts as initialAccounts,
  customerActivities as initialCustomerActivities,
  customerContacts as initialContacts,
  customerOwners,
  industries,
  type AccountContactAssociation,
  type CustomerAccount,
  type CustomerLifecycleStage,
  type CustomerContact,
  type CustomerStatus,
} from "@/data/customerManagementData";

type Tab = "accounts" | "contacts";
type CustomerActivityKind = "Call" | "Message" | "Email" | "Note";
type PipelineItemStatus = "Active" | "Closed";

type PipelineLead = {
  id: string;
  accountId: string;
  title: string;
  source: string;
  status: PipelineItemStatus;
  createdAt: string;
};

type PipelineDeal = {
  id: string;
  accountId: string;
  title: string;
  value: number;
  stage: string;
  status: PipelineItemStatus;
  closedAt?: string;
};

const statusOptions: CustomerStatus[] = ["Lead", "Active", "Inactive"];
const customerStatusConfig: Record<CustomerStatus, string> = {
  Active: "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]",
  Inactive: "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]",
  Lead: "bg-[#fff8e6] text-[#b07d00] border border-[#fcd34d]",
};

const emptyAccountForm = {
  name: "",
  industry: "",
  size: "",
  city: "",
  country: "Ethiopia",
  website: "",
};

const emptyContactForm = {
  firstName: "",
  lastName: "",
  roleTitle: "",
  email: "",
  phone: "",
  owner: customerOwners[0],
  status: "Active" as "Active" | "Inactive",
};

interface CustomerManagementPageProps {
  defaultTab?: Tab;
  lockedTab?: Tab;
}

export function CustomerManagementPage({
  defaultTab = "accounts",
  lockedTab,
}: CustomerManagementPageProps = {}) {
  const [tabState] = useState<Tab>(() => {
    if (typeof window === "undefined") return defaultTab;
    const tabQuery = new URLSearchParams(window.location.search).get("tab");
    return tabQuery === "contacts" ? "contacts" : defaultTab;
  });
  const activeTab = lockedTab ?? tabState;
  const [accounts, setAccounts] = useState<CustomerAccount[]>(initialAccounts);
  const [contacts, setContacts] = useState<CustomerContact[]>(initialContacts);
  const [associations, setAssociations] =
    useState<AccountContactAssociation[]>(initialAssociations);

  const [search, setSearch] = useState("");
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [customerActivities, setCustomerActivities] = useState<
    {
      id: string;
      accountId: string;
      kind: CustomerActivityKind;
      note: string;
      date: string;
    }[]
  >([]);

  const [pipelineLeads, setPipelineLeads] = useState<PipelineLead[]>(() => {
    const today = new Date().toISOString().split("T")[0];
    return initialAccounts.flatMap((account, idx) => {
      const baseId = `lead-${account.id}`;
      const hasSeed = idx % 2 === 0;
      if (!hasSeed) return [];
      return [
        {
          id: `${baseId}-a`,
          accountId: account.id,
          title: `Inbound interest from ${account.name}`,
          source: "Website",
          status: "Active",
          createdAt: today,
        },
        {
          id: `${baseId}-c`,
          accountId: account.id,
          title: `Re-engagement outreach`,
          source: "Outbound",
          status: "Closed",
          createdAt: today,
        },
      ];
    });
  });

  const [pipelineDeals, setPipelineDeals] = useState<PipelineDeal[]>(() => {
    const today = new Date().toISOString().split("T")[0];
    const seededDealsFromActivities = initialCustomerActivities
      .filter((activity) => activity.type === "Deal")
      .map((activity) => ({
        id: `deal-${activity.id}`,
        accountId: activity.accountId,
        title: activity.title,
        value: 0,
        stage: "Proposal",
        status: "Active" as const,
      }));

    const syntheticDeals = initialAccounts.map((account, idx) => ({
      id: `deal-${account.id}-${idx}`,
      accountId: account.id,
      title: `Deal for ${account.name}`,
      value: 125000 + idx * 25000,
      stage: idx % 3 === 0 ? "Negotiation" : "Qualification",
      status: idx % 4 === 0 ? ("Closed" as const) : ("Active" as const),
      closedAt: idx % 4 === 0 ? today : undefined,
    }));

    return [...seededDealsFromActivities, ...syntheticDeals];
  });
  const [linkForm, setLinkForm] = useState({
    accountId: "",
    contactId: "",
    role: associationRoles[0],
    isPrimary: false,
  });

  const filteredAccounts = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter(
      (item) =>
        `${item.firstName} ${item.lastName}`.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.roleTitle.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const duplicateAccounts = useMemo(() => {
    const keys = new Map<string, CustomerAccount[]>();
    for (const account of accounts) {
      const key = `${account.name.trim().toLowerCase()}|${account.email.trim().toLowerCase()}`;
      const list = keys.get(key) ?? [];
      list.push(account);
      keys.set(key, list);
    }
    return Array.from(keys.values()).filter((group) => group.length > 1);
  }, [accounts]);

  const duplicateContacts = useMemo(() => {
    const keys = new Map<string, CustomerContact[]>();
    for (const contact of contacts) {
      const key = `${contact.firstName.trim().toLowerCase()}|${contact.lastName
        .trim()
        .toLowerCase()}|${contact.email.trim().toLowerCase()}`;
      const list = keys.get(key) ?? [];
      list.push(contact);
      keys.set(key, list);
    }
    return Array.from(keys.values()).filter((group) => group.length > 1);
  }, [contacts]);

  const duplicateAccountIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of duplicateAccounts) {
      for (const account of group) {
        ids.add(account.id);
      }
    }
    return ids;
  }, [duplicateAccounts]);

  const duplicateContactIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of duplicateContacts) {
      for (const contact of group) {
        ids.add(contact.id);
      }
    }
    return ids;
  }, [duplicateContacts]);

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const contactById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  );


  const resetAccountForm = () => {
    setAccountForm(emptyAccountForm);
    setEditingAccountId(null);
  };

  const resetContactForm = () => {
    setContactForm(emptyContactForm);
    setEditingContactId(null);
  };

  const handleSaveAccount = () => {
    const required = [accountForm.name, accountForm.industry, accountForm.size];
    if (required.some((value) => !value.trim())) return;

    if (editingAccountId) {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === editingAccountId
            ? {
                ...account,
                ...accountForm,
                address: account.address ?? "",
              }
            : account,
        ),
      );
    } else {
      const newAccount: CustomerAccount = {
        id: `acc-${Date.now()}`,
        name: accountForm.name,
        industry: accountForm.industry,
        size: accountForm.size,
        email: "",
        phone: "",
        address: "",
        city: accountForm.city,
        country: accountForm.country,
        website: accountForm.website,
        owner: "",
        status: "Lead",
        lifecycleStage: "Lead",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setAccounts((prev) => [newAccount, ...prev]);
    }

    setAccountDialogOpen(false);
    resetAccountForm();
  };

  const removeContactFromAccount = (associationId: string) => {
    setAssociations((prev) => prev.filter((a) => a.id !== associationId));
  };

  const handleSaveContact = () => {
    const required = [contactForm.firstName, contactForm.lastName, contactForm.email];
    if (required.some((value) => !value.trim())) return;

    if (editingContactId) {
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === editingContactId ? { ...contact, ...contactForm } : contact,
        ),
      );
    } else {
      const newContact: CustomerContact = {
        id: `con-${Date.now()}`,
        ...contactForm,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setContacts((prev) => [newContact, ...prev]);
    }

    setContactDialogOpen(false);
    resetContactForm();
  };

  const upsertAssociation = () => {
    if (!linkForm.accountId || !linkForm.contactId) return;

    const associationId = `assoc-${Date.now()}`;
    setAssociations((prev) => {
      const withoutCurrent = prev.filter(
        (association) =>
          !(
            association.accountId === linkForm.accountId &&
            association.contactId === linkForm.contactId
          ),
      );

      const adjusted = linkForm.isPrimary
        ? withoutCurrent.map((association) =>
            association.accountId === linkForm.accountId
              ? { ...association, isPrimary: false }
              : association,
          )
        : withoutCurrent;

      return [
        ...adjusted,
        {
          id: associationId,
          accountId: linkForm.accountId,
          contactId: linkForm.contactId,
          role: linkForm.role,
          isPrimary: linkForm.isPrimary,
        },
      ];
    });

    if (linkForm.isPrimary) {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === linkForm.accountId
            ? { ...account, primaryContactId: linkForm.contactId }
            : account,
        ),
      );
    }

    setLinkDialogOpen(false);
    setLinkForm({
      accountId: "",
      contactId: "",
      role: associationRoles[0],
      isPrimary: false,
    });
  };

  const deleteAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== accountId));
    setAssociations((prev) =>
      prev.filter((association) => association.accountId !== accountId),
    );
    if (selectedAccount?.id === accountId) {
      setSelectedAccount(null);
    }
  };

  const deleteContact = (contactId: string) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
    setAssociations((prev) =>
      prev.filter((association) => association.contactId !== contactId),
    );
  };

  const setAccountStatus = (accountId: string, status: CustomerStatus) => {
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === accountId
          ? {
              ...account,
              status,
            }
          : account,
      ),
    );
    setSelectedAccount((prev) =>
      prev && prev.id === accountId
        ? {
            ...prev,
            status,
          }
        : prev,
    );
  };

  const moveCustomerStage = (accountId: string, lifecycleStage: CustomerLifecycleStage) => {
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === accountId
          ? {
              ...account,
              lifecycleStage,
              status: lifecycleStage === "Deal" ? "Active" : "Lead",
            }
          : account,
      ),
    );
    setSelectedAccount((prev) =>
      prev && prev.id === accountId
        ? {
            ...prev,
            lifecycleStage,
            status: lifecycleStage === "Deal" ? "Active" : "Lead",
          }
        : prev,
    );
  };

  const addContactForSelectedCustomer = ({
    form,
    role,
    isPrimary,
  }: {
    form: {
      firstName: string;
      lastName: string;
      roleTitle: string;
      email: string;
      phone: string;
      owner: string;
    };
    role: (typeof associationRoles)[number];
    isPrimary: boolean;
  }) => {
    if (!selectedAccount) return;
    const required = [
      form.firstName,
      form.lastName,
      form.email,
    ];
    if (required.some((value) => !value.trim())) return;

    const newContact: CustomerContact = {
      id: `con-${Date.now()}`,
      ...form,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setContacts((prev) => [newContact, ...prev]);

    setAssociations((prev) => {
      const adjusted = isPrimary
        ? prev.map((association) =>
            association.accountId === selectedAccount.id
              ? { ...association, isPrimary: false }
              : association,
          )
        : prev;
      return [
        ...adjusted,
        {
          id: `assoc-${Date.now()}`,
          accountId: selectedAccount.id,
          contactId: newContact.id,
          role,
          isPrimary,
        },
      ];
    });

    if (isPrimary) {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === selectedAccount.id
            ? { ...account, primaryContactId: newContact.id }
            : account,
        ),
      );
      setSelectedAccount((prev) =>
        prev ? { ...prev, primaryContactId: newContact.id } : prev,
      );
    }
  };

  const addExistingContactForSelectedCustomer = ({
    contactId,
    role,
    isPrimary,
  }: {
    contactId: string;
    role: (typeof associationRoles)[number];
    isPrimary: boolean;
  }) => {
    if (!selectedAccount) return;

    setAssociations((prev) => {
      const adjusted = isPrimary
        ? prev.map((association) =>
            association.accountId === selectedAccount.id
              ? { ...association, isPrimary: false }
              : association,
          )
        : prev;

      const existingAssociation = adjusted.find(
        (association) =>
          association.accountId === selectedAccount.id && association.contactId === contactId,
      );

      if (existingAssociation) {
        return adjusted.map((association) =>
          association.id === existingAssociation.id
            ? { ...association, role, isPrimary }
            : association,
        );
      }

      return [
        ...adjusted,
        {
          id: `assoc-${Date.now()}`,
          accountId: selectedAccount.id,
          contactId,
          role,
          isPrimary,
        },
      ];
    });

    if (isPrimary) {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === selectedAccount.id
            ? { ...account, primaryContactId: contactId }
            : account,
        ),
      );
      setSelectedAccount((prev) =>
        prev ? { ...prev, primaryContactId: contactId } : prev,
      );
    }
  };

  const assignPrimaryContactForSelectedCustomer = (contactId: string) => {
    if (!selectedAccount) return;

    setAssociations((prev) =>
      prev.map((association) =>
        association.accountId === selectedAccount.id
          ? { ...association, isPrimary: association.contactId === contactId }
          : association,
      ),
    );

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === selectedAccount.id
          ? { ...account, primaryContactId: contactId }
          : account,
      ),
    );

    setSelectedAccount((prev) =>
      prev ? { ...prev, primaryContactId: contactId } : prev,
    );
  };

  const addActivityForSelectedCustomer = ({
    kind,
    note,
  }: {
    kind: CustomerActivityKind;
    note: string;
  }) => {
    if (!selectedAccount) return;
    if (!note.trim()) return;
    setCustomerActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        accountId: selectedAccount.id,
        kind,
        note: note.trim(),
        date: new Date().toISOString().split("T")[0],
      },
      ...prev,
    ]);
  };

  const mergeDuplicateAccounts = (group: CustomerAccount[]) => {
    const keeper = group[0];
    const toRemoveIds = new Set(group.slice(1).map((item) => item.id));
    setAccounts((prev) => prev.filter((item) => !toRemoveIds.has(item.id)));
    setAssociations((prev) =>
      prev.map((association) =>
        toRemoveIds.has(association.accountId)
          ? { ...association, accountId: keeper.id }
          : association,
      ),
    );
  };

  const mergeDuplicateContacts = (group: CustomerContact[]) => {
    const keeper = group[0];
    const toRemoveIds = new Set(group.slice(1).map((item) => item.id));
    setContacts((prev) => prev.filter((item) => !toRemoveIds.has(item.id)));
    setAssociations((prev) =>
      prev.map((association) =>
        toRemoveIds.has(association.contactId)
          ? { ...association, contactId: keeper.id }
          : association,
      ),
    );
  };

  const accountChildrenMap = useMemo(() => {
    const map = new Map<string, CustomerAccount[]>();
    for (const account of accounts) {
      if (!account.parentAccountId) continue;
      const list = map.get(account.parentAccountId) ?? [];
      list.push(account);
      map.set(account.parentAccountId, list);
    }
    return map;
  }, [accounts]);

  if (selectedAccount) {
    const selectedAccountContacts = associations
      .filter((association) => association.accountId === selectedAccount.id)
      .map((association) => ({
        association,
        contact: contactById.get(association.contactId),
      }))
      .filter((item): item is { association: AccountContactAssociation; contact: CustomerContact } =>
        Boolean(item.contact),
      );

    return (
      <CustomerAccountDetailView
        account={selectedAccount}
        accountContacts={selectedAccountContacts}
        pipelineLeads={pipelineLeads.filter((lead) => lead.accountId === selectedAccount.id)}
        pipelineDeals={pipelineDeals.filter((deal) => deal.accountId === selectedAccount.id)}
        accountActivities={customerActivities.filter(
          (activity) => activity.accountId === selectedAccount.id,
        )}
        onBack={() => setSelectedAccount(null)}
        onUpdateAccount={(updatedAccount) => {
          setAccounts((prev) =>
            prev.map((item) => (item.id === updatedAccount.id ? updatedAccount : item)),
          );
          setSelectedAccount(updatedAccount);
        }}
        allContacts={contacts}
        onAddContact={addContactForSelectedCustomer}
        onAddExistingContact={addExistingContactForSelectedCustomer}
        onAddActivity={addActivityForSelectedCustomer}
        onAssignPrimaryContact={assignPrimaryContactForSelectedCustomer}
        onRemoveContact={removeContactFromAccount}
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">Customer Management</h1>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-5">


        {(activeTab === "accounts" || activeTab === "contacts") && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-[340px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === "accounts"
                    ? "Search customers by name, industry"
                    : "Search contacts by name, email, title"
                }
                className="h-9 border-[#e5e7eb] bg-white pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "accounts" ? (
                <Button
                  size="sm"
                  className="h-9 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                  onClick={() => {
                    resetAccountForm();
                    setAccountDialogOpen(true);
                  }}
                >
                  <Plus size={14} className="mr-1.5" />
                  New Customer
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-9 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                  onClick={() => {
                    resetContactForm();
                    setContactDialogOpen(true);
                  }}
                >
                  <Plus size={14} className="mr-1.5" />
                  New Contact
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === "accounts" && (
          <AccountsTable
            accounts={filteredAccounts}
            contacts={contacts}
            associations={associations}
            pipelineLeads={pipelineLeads}
            pipelineDeals={pipelineDeals}
            duplicateAccountIds={duplicateAccountIds}
            onSetStatus={setAccountStatus}
            onEdit={(account) => {
              setEditingAccountId(account.id);
              setAccountForm({
                name: account.name,
                industry: account.industry,
                size: account.size,
                city: account.city,
                country: account.country,
                website: account.website,
              });
              setAccountDialogOpen(true);
            }}
            onDelete={deleteAccount}
            onOpenDetails={setSelectedAccount}
          />
        )}

        {activeTab === "contacts" && (
          <ContactsTable
            contacts={filteredContacts}
            associations={associations}
            accountById={accountById}
            duplicateContactIds={duplicateContactIds}
            onEdit={(contact) => {
              setEditingContactId(contact.id);
              setContactForm({
                firstName: contact.firstName,
                lastName: contact.lastName,
                roleTitle: contact.roleTitle,
                email: contact.email,
                phone: contact.phone,
                owner: contact.owner,
                status: contact.status,
              });
              setContactDialogOpen(true);
            }}
            onDelete={deleteContact}
          />
        )}

      </div>

      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle>{editingAccountId ? "Edit Customer Account" : "New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <FormField label="Account Name *">
              <Input
                value={accountForm.name}
                onChange={(event) =>
                  setAccountForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
            <FormField label="Industry *">
              <Select
                value={accountForm.industry}
                onValueChange={(value) =>
                  setAccountForm((prev) => ({ ...prev, industry: value }))
                }
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Organization Size *">
              <Select
                value={accountForm.size}
                onValueChange={(value) =>
                  setAccountForm((prev) => ({ ...prev, size: value }))
                }
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {accountSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="City">
              <Input
                value={accountForm.city}
                onChange={(event) =>
                  setAccountForm((prev) => ({ ...prev, city: event.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
            <FormField label="Country">
              <Input
                value={accountForm.country}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    country: event.target.value,
                  }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
            <FormField label="Website">
              <Input
                value={accountForm.website}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    website: event.target.value,
                  }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={handleSaveAccount}
            >
              {editingAccountId ? "Save Changes" : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editingContactId ? "Edit Contact" : "Add Contact"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <FormField label="First Name *">
              <Input
                value={contactForm.firstName}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
            <FormField label="Last Name *">
              <Input
                value={contactForm.lastName}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
            <FormField label="Role / Title">
              <Input
                value={contactForm.roleTitle}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, roleTitle: event.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
            <FormField label="Email *">
              <Input
                value={contactForm.email}
                onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={contactForm.phone}
                onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="h-9 border-[#e5e7eb]"
              />
            </FormField>

          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={handleSaveContact}
            >
              {editingContactId ? "Save Changes" : "Create Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Associate Contact to Customer</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2">
            <FormField label="Customer Account">
              <Select
                value={linkForm.accountId}
                onValueChange={(value) => setLinkForm((prev) => ({ ...prev, accountId: value }))}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Contact">
              <Select
                value={linkForm.contactId}
                onValueChange={(value) => setLinkForm((prev) => ({ ...prev, contactId: value }))}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Relationship Role">
              <Select
                value={linkForm.role}
                onValueChange={(value) =>
                  setLinkForm((prev) => ({ ...prev, role: value as (typeof associationRoles)[number] }))
                }
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {associationRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={linkForm.isPrimary}
                onCheckedChange={(checked) =>
                  setLinkForm((prev) => ({ ...prev, isPrimary: Boolean(checked) }))
                }
              />
              <Label className="text-sm text-[#4b5563]">Set as primary contact for this account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-[#4080f0] text-white hover:bg-[#3070e0]" onClick={upsertAssociation}>
              Save Association
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function CustomerAccountDetailView({
  account,
  accountContacts,
  pipelineLeads,
  pipelineDeals,
  accountActivities,
  allContacts,
  onBack,
  onUpdateAccount,
  onAddContact,
  onAddExistingContact,
  onAddActivity,
  onAssignPrimaryContact,
  onRemoveContact,
}: {
  account: CustomerAccount;
  accountContacts: { association: AccountContactAssociation; contact: CustomerContact }[];
  pipelineLeads: PipelineLead[];
  pipelineDeals: PipelineDeal[];
  accountActivities: {
    id: string;
    accountId: string;
    kind: CustomerActivityKind;
    note: string;
    date: string;
  }[];
  allContacts: CustomerContact[];
  onBack: () => void;
  onUpdateAccount: (account: CustomerAccount) => void;
  onAddContact: (payload: {
    form: {
      firstName: string;
      lastName: string;
      roleTitle: string;
      email: string;
      phone: string;
      owner: string;
    };
    role: (typeof associationRoles)[number];
    isPrimary: boolean;
  }) => void;
  onAddExistingContact: (payload: {
    contactId: string;
    role: (typeof associationRoles)[number];
    isPrimary: boolean;
  }) => void;
  onAddActivity: (payload: { kind: CustomerActivityKind; note: string }) => void;
  onAssignPrimaryContact: (contactId: string) => void;
  onRemoveContact: (associationId: string) => void;
}) {
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [addContactTab, setAddContactTab] = useState<"new" | "existing">("new");
  const [detailTab, setDetailTab] = useState<"profile" | "activity">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<CustomerAccount>(account);
  const [confirmPrimaryContactId, setConfirmPrimaryContactId] = useState<
    string | null
  >(null);
  const [confirmRemoveAssociationId, setConfirmRemoveAssociationId] = useState<
    string | null
  >(null);
  const [pipelineKind, setPipelineKind] = useState<
    "activeLeads" | "closedLeads" | "activeDeals" | "closedDeals"
  >("activeLeads");
  const [expandedPipelineItemId, setExpandedPipelineItemId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    roleTitle: "",
    email: "",
    phone: "",
    owner: customerOwners[0],
  });
  const [contactRole, setContactRole] = useState<(typeof associationRoles)[number]>(
    associationRoles[0],
  );
  const [contactIsPrimary, setContactIsPrimary] = useState(false);
  const [existingContactId, setExistingContactId] = useState<string>("none");
  const [activityForm, setActivityForm] = useState<{
    kind: CustomerActivityKind;
    note: string;
  }>({
    kind: "Call",
    note: "",
  });
  const contactToConfirm = accountContacts.find(
    (item) => item.contact.id === confirmPrimaryContactId,
  );
  const contactToRemoveFromAccount = accountContacts.find(
    (item) => item.association.id === confirmRemoveAssociationId,
  );
  const activityItems = useMemo(
    () =>
      [
        {
          id: `account-created-${account.id}`,
          date: account.createdAt,
          text: "Customer account created.",
          type: "accountCreated" as const,
        },
        ...accountContacts.map(({ association, contact }) => ({
          id: association.id,
          date: contact.createdAt,
          text: `${contact.firstName} ${contact.lastName} linked as ${association.role}${
            association.isPrimary ? " (Primary)" : ""
          }.`,
          type: association.isPrimary ? ("primaryContact" as const) : ("contactLinked" as const),
        })),
        ...accountActivities.map((activity) => ({
          id: activity.id,
          date: activity.date,
          text: activity.note,
          type:
            activity.kind === "Call"
              ? ("call" as const)
              : activity.kind === "Message"
                ? ("message" as const)
                : activity.kind === "Email"
                  ? ("email" as const)
                  : ("note" as const),
        })),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [account, accountContacts, accountActivities],
  );

  const pipelineSummary = useMemo(() => {
    const activeLeads = pipelineLeads.filter((lead) => lead.status === "Active");
    const closedLeads = pipelineLeads.filter((lead) => lead.status === "Closed");
    const activeDeals = pipelineDeals.filter((deal) => deal.status === "Active");
    const closedDeals = pipelineDeals.filter((deal) => deal.status === "Closed");
    return {
      activeLeads,
      closedLeads,
      activeDeals,
      closedDeals,
    };
  }, [pipelineLeads, pipelineDeals]);

  const openPipeline = (
    kind: "activeLeads" | "closedLeads" | "activeDeals" | "closedDeals",
  ) => {
    setPipelineKind(kind);
    setExpandedPipelineItemId(null);
  };
  const selectedPrimaryContact = accountContacts.find(
    (item) => item.contact.id === profileDraft.primaryContactId,
  )?.contact;
  const linkedContactIds = new Set(accountContacts.map((item) => item.contact.id));
  const availableExistingContacts = allContacts.filter(
    (contact) => !linkedContactIds.has(contact.id),
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setProfileDraft(account);
      setIsEditingProfile(false);
    }, 0);
    return () => clearTimeout(id);
  }, [account]);

  const handleAddContact = () => {
    if (addContactTab === "existing") {
      if (existingContactId === "none") return;
      onAddExistingContact({
        contactId: existingContactId,
        role: contactRole,
        isPrimary: contactIsPrimary,
      });
    } else {
      onAddContact({
        form: contactForm,
        role: contactRole,
        isPrimary: contactIsPrimary,
      });
    }
    setContactForm({
      firstName: "",
      lastName: "",
      roleTitle: "",
      email: "",
      phone: "",
      owner: customerOwners[0],
    });
    setContactRole(associationRoles[0]);
    setContactIsPrimary(false);
    setExistingContactId("none");
    setAddContactTab("new");
    setAddContactOpen(false);
  };

  const handleProfileSave = () => {
    onUpdateAccount(profileDraft);
    setIsEditingProfile(false);
  };

  const handleProfileCancel = () => {
    setProfileDraft(account);
    setIsEditingProfile(false);
  };

  const handleAddActivity = () => {
    onAddActivity(activityForm);
    setActivityForm({
      kind: "Call",
      note: "",
    });
    setAddActivityOpen(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1c1e21]"
          >
            <ArrowLeft size={13} />
            Back to Customers
          </button>
          <h2 className="font-semibold text-[#1c1e21]">{account.name}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f8f9fb] p-3 sm:p-5">
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
            <Tabs
              value={detailTab}
              onValueChange={(value) => setDetailTab(value as "profile" | "activity")}
              className="w-full"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  {detailTab === "profile" && (
                    <>
                      {isEditingProfile ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-[#e5e7eb]"
                            onClick={handleProfileCancel}
                          >
                            <X size={13} className="mr-1.5" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                            onClick={handleProfileSave}
                          >
                            <Check size={13} className="mr-1.5" />
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-[#e5e7eb]"
                          onClick={() => setIsEditingProfile(true)}
                        >
                          <Edit2 size={13} className="mr-1.5" />
                          Edit Profile
                        </Button>
                      )}
                    </>
                  )}
                  {detailTab === "profile" && (
                    <Button
                      size="sm"
                      className="h-8 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                      onClick={() => setAddContactOpen(true)}
                    >
                      <UserPlus size={13} className="mr-1.5" />
                      Add Contact
                    </Button>
                  )}
                  {detailTab === "activity" && (
                    <Button
                      size="sm"
                      className="h-8 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                      onClick={() => setAddActivityOpen(true)}
                    >
                      <Plus size={13} className="mr-1.5" />
                      Add Activity
                    </Button>
                  )}
                </div>
              </div>
              <TabsContent value="profile" className="rounded-md p-3">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#1c1e21]">Profile</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ProfileField label="Account Name" value={profileDraft.name} isEditing={isEditingProfile}>
                    <Input
                      value={profileDraft.name}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="h-9 border-[#e5e7eb]"
                    />
                  </ProfileField>
                  <ProfileField label="Industry" value={profileDraft.industry} isEditing={isEditingProfile}>
                    <Select
                      value={profileDraft.industry}
                      onValueChange={(value) => setProfileDraft((prev) => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger className="h-9 border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </ProfileField>
                  <ProfileField label="Organization Size" value={profileDraft.size} isEditing={isEditingProfile}>
                    <Select
                      value={profileDraft.size}
                      onValueChange={(value) => setProfileDraft((prev) => ({ ...prev, size: value }))}
                    >
                      <SelectTrigger className="h-9 border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </ProfileField>
                
                  <ProfileField label="City" value={profileDraft.city || "—"} isEditing={isEditingProfile}>
                    <Input
                      value={profileDraft.city}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, city: event.target.value }))
                      }
                      className="h-9 border-[#e5e7eb]"
                    />
                  </ProfileField>
                  <ProfileField label="Country" value={profileDraft.country || "—"} isEditing={isEditingProfile}>
                    <Input
                      value={profileDraft.country}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, country: event.target.value }))
                      }
                      className="h-9 border-[#e5e7eb]"
                    />
                  </ProfileField>
                  <ProfileField label="Website" value={profileDraft.website || "—"} isEditing={isEditingProfile}>
                    <Input
                      value={profileDraft.website}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, website: event.target.value }))
                      }
                      className="h-9 border-[#e5e7eb]"
                    />
                  </ProfileField>
                </div>

            <div className="my-4 h-px bg-[#eef1f6]" />

            <div className="rounded-[14px] bg-[#F9FAFB] p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Leads & Deals
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-auto justify-start gap-3 border-[#e5e7eb] bg-white px-3 py-3 transition-colors",
                    pipelineKind === "activeLeads" && "border-[#d1d5db] bg-[#f3f4f6]",
                  )}
                  onClick={() => openPipeline("activeLeads")}
                >
                  <span className="rounded-md bg-[#eef2fd] p-2 text-[#4080f0]">
                    <BadgeCheck size={16} />
                  </span>
                  <span className="text-left">
                    <p className="text-[11px] text-[#6b7280]">Active Leads</p>
                    <p className="text-base font-semibold text-[#1c1e21]">
                      {pipelineSummary.activeLeads.length}
                    </p>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-auto justify-start gap-3 border-[#e5e7eb] bg-white px-3 py-3 transition-colors",
                    pipelineKind === "closedLeads" && "border-[#d1d5db] bg-[#f3f4f6]",
                  )}
                  onClick={() => openPipeline("closedLeads")}
                >
                  <span className="rounded-md bg-[#fef2f2] p-2 text-[#dc2626]">
                    <BadgeX size={16} />
                  </span>
                  <span className="text-left">
                    <p className="text-[11px] text-[#6b7280]">Closed Leads</p>
                    <p className="text-base font-semibold text-[#1c1e21]">
                      {pipelineSummary.closedLeads.length}
                    </p>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-auto justify-start gap-3 border-[#e5e7eb] bg-white px-3 py-3 transition-colors",
                    pipelineKind === "activeDeals" && "border-[#d1d5db] bg-[#f3f4f6]",
                  )}
                  onClick={() => openPipeline("activeDeals")}
                >
                  <span className="rounded-md bg-[#e6f7ee] p-2 text-[#1a8a4a]">
                    <BriefcaseBusiness size={16} />
                  </span>
                  <span className="text-left">
                    <p className="text-[11px] text-[#6b7280]">Active Deals</p>
                    <p className="text-base font-semibold text-[#1c1e21]">
                      {pipelineSummary.activeDeals.length}
                    </p>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-auto justify-start gap-3 border-[#e5e7eb] bg-white px-3 py-3 transition-colors",
                    pipelineKind === "closedDeals" && "border-[#d1d5db] bg-[#f3f4f6]",
                  )}
                  onClick={() => openPipeline("closedDeals")}
                >
                  <span className="rounded-md bg-[#fff8e6] p-2 text-[#b07d00]">
                    <Briefcase size={16} />
                  </span>
                  <span className="text-left">
                    <p className="text-[11px] text-[#6b7280]">Closed Deals</p>
                    <p className="text-base font-semibold text-[#1c1e21]">
                      {pipelineSummary.closedDeals.length}
                    </p>
                  </span>
                </Button>
              </div>
              <Card className="mt-3 gap-2 rounded-md border-[#e5e7eb] bg-white py-3 shadow-none ring-0">
                <CardContent className="px-3 pt-0">
                  <div className="space-y-2">
                    {(pipelineKind === "activeLeads" ? pipelineSummary.activeLeads : []).map((lead) => {
                      const isOpen = expandedPipelineItemId === lead.id;
                      return (
                        <div
                          key={lead.id}
                          className={cn(
                            "overflow-hidden rounded-md border border-[#e5e7eb] bg-white transition-colors",
                            isOpen && "bg-[#f3f4f6]",
                          )}
                        >
                          <button
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left transition-colors hover:bg-[#fafbff]",
                              isOpen && "bg-[#f3f4f6] hover:bg-[#eceff3]",
                            )}
                            onClick={() =>
                              setExpandedPipelineItemId((prev) => (prev === lead.id ? null : lead.id))
                            }
                          >
                            <p className="text-sm font-medium text-[#1c1e21]">{lead.title}</p>
                            <p className="text-xs text-[#6b7280]">
                              Source: {lead.source} · Created: {lead.createdAt}
                            </p>
                          </button>
                          {isOpen && (
                            <div className="border-t border-[#eef1f6] bg-white px-3 py-2">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <InfoLine label="Status" value={lead.status} />
                                <InfoLine label="Source" value={lead.source} />
                                <InfoLine label="Created" value={lead.createdAt} />
                                <InfoLine label="Customer" value={account.name} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(pipelineKind === "closedLeads" ? pipelineSummary.closedLeads : []).map((lead) => {
                      const isOpen = expandedPipelineItemId === lead.id;
                      return (
                        <div
                          key={lead.id}
                          className={cn(
                            "overflow-hidden rounded-md border border-[#e5e7eb] bg-white transition-colors",
                            isOpen && "bg-[#f3f4f6]",
                          )}
                        >
                          <button
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left transition-colors hover:bg-[#fafbff]",
                              isOpen && "bg-[#f3f4f6] hover:bg-[#eceff3]",
                            )}
                            onClick={() =>
                              setExpandedPipelineItemId((prev) => (prev === lead.id ? null : lead.id))
                            }
                          >
                            <p className="text-sm font-medium text-[#1c1e21]">{lead.title}</p>
                            <p className="text-xs text-[#6b7280]">
                              Source: {lead.source} · Created: {lead.createdAt}
                            </p>
                          </button>
                          {isOpen && (
                            <div className="border-t border-[#eef1f6] bg-white px-3 py-2">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <InfoLine label="Status" value={lead.status} />
                                <InfoLine label="Source" value={lead.source} />
                                <InfoLine label="Created" value={lead.createdAt} />
                                <InfoLine label="Customer" value={account.name} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(pipelineKind === "activeDeals" ? pipelineSummary.activeDeals : []).map((deal) => {
                      const isOpen = expandedPipelineItemId === deal.id;
                      return (
                        <div
                          key={deal.id}
                          className={cn(
                            "overflow-hidden rounded-md border border-[#e5e7eb] bg-white transition-colors",
                            isOpen && "bg-[#f3f4f6]",
                          )}
                        >
                          <button
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left transition-colors hover:bg-[#fafbff]",
                              isOpen && "bg-[#f3f4f6] hover:bg-[#eceff3]",
                            )}
                            onClick={() =>
                              setExpandedPipelineItemId((prev) => (prev === deal.id ? null : deal.id))
                            }
                          >
                            <p className="text-sm font-medium text-[#1c1e21]">{deal.title}</p>
                            <p className="text-xs text-[#6b7280]">
                              Stage: {deal.stage} · Value: ${deal.value.toLocaleString()}
                            </p>
                          </button>
                          {isOpen && (
                            <div className="border-t border-[#eef1f6] bg-white px-3 py-2">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <InfoLine label="Status" value={deal.status} />
                                <InfoLine label="Stage" value={deal.stage} />
                                <InfoLine label="Value" value={`$${deal.value.toLocaleString()}`} />
                                <InfoLine label="Customer" value={account.name} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(pipelineKind === "closedDeals" ? pipelineSummary.closedDeals : []).map((deal) => {
                      const isOpen = expandedPipelineItemId === deal.id;
                      return (
                        <div
                          key={deal.id}
                          className={cn(
                            "overflow-hidden rounded-md border border-[#e5e7eb] bg-white transition-colors",
                            isOpen && "bg-[#f3f4f6]",
                          )}
                        >
                          <button
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left transition-colors hover:bg-[#fafbff]",
                              isOpen && "bg-[#f3f4f6] hover:bg-[#eceff3]",
                            )}
                            onClick={() =>
                              setExpandedPipelineItemId((prev) => (prev === deal.id ? null : deal.id))
                            }
                          >
                            <p className="text-sm font-medium text-[#1c1e21]">{deal.title}</p>
                            <p className="text-xs text-[#6b7280]">
                              Stage: {deal.stage} · Value: ${deal.value.toLocaleString()}
                              {deal.closedAt ? ` · Closed: ${deal.closedAt}` : ""}
                            </p>
                          </button>
                          {isOpen && (
                            <div className="border-t border-[#eef1f6] bg-white px-3 py-2">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <InfoLine label="Status" value={deal.status} />
                                <InfoLine label="Stage" value={deal.stage} />
                                <InfoLine label="Value" value={`$${deal.value.toLocaleString()}`} />
                                <InfoLine label="Closed" value={deal.closedAt ?? "—"} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {pipelineKind === "activeLeads" && pipelineSummary.activeLeads.length === 0 && (
                      <p className="py-6 text-center text-sm text-[#9ca3af]">
                        No active leads for this customer.
                      </p>
                    )}
                    {pipelineKind === "closedLeads" && pipelineSummary.closedLeads.length === 0 && (
                      <p className="py-6 text-center text-sm text-[#9ca3af]">
                        No closed leads for this customer.
                      </p>
                    )}
                    {pipelineKind === "activeDeals" && pipelineSummary.activeDeals.length === 0 && (
                      <p className="py-6 text-center text-sm text-[#9ca3af]">
                        No active deals for this customer.
                      </p>
                    )}
                    {pipelineKind === "closedDeals" && pipelineSummary.closedDeals.length === 0 && (
                      <p className="py-6 text-center text-sm text-[#9ca3af]">
                        No closed deals for this customer.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="my-4 h-px bg-[#eef1f6]" />

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Contact
              </h4>
              {accountContacts.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {accountContacts.map(({ association, contact }) => (
                    <Card key={association.id} className="relative overflow-hidden border-[#e5e7eb] py-4 hover:shadow-sm transition-shadow">
                      <CardContent className="px-3 py-1">
                        {isEditingProfile ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="absolute right-3 top-3 z-10 h-6 px-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#dc2626] border-[#fecaca] bg-[#fef2f2] hover:bg-[#fee2e2] transition-colors"
                            onClick={() => setConfirmRemoveAssociationId(association.id)}
                            title="Remove contact from account"
                          >
                            <Minus size={10} className="mr-1" strokeWidth={3} />
                            Remove
                          </Button>
                        ) : null}
                        <div className="flex items-start gap-2.5">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <Avatar className="size-8">
                              <AvatarFallback className="text-xs">
                                {`${contact.firstName} ${contact.lastName}`
                                  .split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part) => part[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-medium text-[#1c1e21]">
                                  {contact.firstName} {contact.lastName}
                                </p>
                                {association.isPrimary ? (
                                  <Badge className="bg-[#e6f7ee] text-[#1a8a4a] hover:bg-[#e6f7ee]">
                                    Primary
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Contact</Badge>
                                )}
                              </div>
                              <p className="truncate text-xs text-[#6b7280]">{contact.email}</p>
                              <p className="truncate text-xs text-[#9ca3af]">{contact.phone || "—"}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge variant="secondary">{association.role}</Badge>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 text-[#6b7280] hover:text-[#4080f0]"
                                    onClick={() => window.open(`mailto:${contact.email}`, "_blank")}
                                  >
                                    <Mail size={11} />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 text-[#6b7280] hover:text-[#4080f0]"
                                    onClick={() => window.open(`tel:${contact.phone}`, "_blank")}
                                    disabled={!contact.phone}
                                  >
                                    <Phone size={11} />
                                  </Button>
                                </div>
                                {!isEditingProfile && !association.isPrimary ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="ml-auto h-7 text-xs opacity-0 transition-opacity group-hover/card:opacity-100"
                                    onClick={() => setConfirmPrimaryContactId(contact.id)}
                                  >
                                    Make primary
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9ca3af]">No contact linked yet.</p>
              )}
            </div>
              </TabsContent>
              <TabsContent value="activity">
              <div>
                <h3 className="mb-3 text-sm font-medium text-[#1c1e21]">Activity</h3>
                {activityItems.length === 0 ? (
                  <p className="text-sm text-[#9ca3af]">No activity yet.</p>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute bottom-0 left-2 top-0 w-px bg-[#dfe4ef]" />
                    {activityItems.map((item) => (
                      <div key={item.id} className="relative mb-3 last:mb-0">
                        <span className="absolute -left-7 top-1.5 flex size-5 items-center justify-center rounded-full border border-[#d7deef] bg-white text-[#6b7280]">
                          {item.type === "accountCreated" && <Building2 size={11} />}
                          {item.type === "contactLinked" && <UserPlus size={11} />}
                          {item.type === "primaryContact" && <CheckCircle2 size={11} />}
                          {item.type === "call" && <Phone size={11} />}
                          {item.type === "message" && <MessageSquare size={11} />}
                          {item.type === "email" && <Mail size={11} />}
                          {item.type === "note" && <ClipboardList size={11} />}
                        </span>
                        <div className="rounded-md border border-[#e5e7eb] bg-[#fafbff] px-3 py-2">
                          <p className="text-sm text-[#1c1e21]">{item.text}</p>
                          <p className="text-xs text-[#6b7280]">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

      </div>

      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Add Contact for {account.name}</DialogTitle>
          </DialogHeader>
          <Tabs
            value={addContactTab}
            onValueChange={(value) => setAddContactTab(value as "new" | "existing")}
            className="w-full"
          >
            <TabsList className="mb-3">
              <TabsTrigger value="new">New Contact</TabsTrigger>
              <TabsTrigger value="existing">Existing Contact</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
                <FormField label="First Name *">
                  <Input
                    value={contactForm.firstName}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Last Name *">
                  <Input
                    value={contactForm.lastName}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Role / Title">
                  <Input
                    value={contactForm.roleTitle}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, roleTitle: event.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Owner">
                  <Select
                    value={contactForm.owner}
                    onValueChange={(value) => setContactForm((prev) => ({ ...prev, owner: value }))}
                  >
                    <SelectTrigger className="h-9 border-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customerOwners.map((owner) => (
                        <SelectItem key={owner} value={owner}>
                          {owner}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Email *">
                  <Input
                    value={contactForm.email}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Phone">
                  <Input
                    value={contactForm.phone}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
              </div>
            </TabsContent>
            <TabsContent value="existing">
              <div className="grid grid-cols-1 gap-4 py-2">
                <FormField label="Existing Contact">
                  <Select
                    value={existingContactId}
                    onValueChange={setExistingContactId}
                  >
                    <SelectTrigger className="h-9 border-[#e5e7eb]">
                      <SelectValue placeholder="Select existing contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select existing contact</SelectItem>
                      {availableExistingContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName} ({contact.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                {availableExistingContacts.length === 0 && (
                  <p className="text-sm text-[#9ca3af]">
                    All contacts are already linked to this customer.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <FormField label="Relationship Role">
              <Select value={contactRole} onValueChange={(value) => setContactRole(value as (typeof associationRoles)[number])}>
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {associationRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-center gap-2 self-end pb-1">
              <Checkbox
                checked={contactIsPrimary}
                onCheckedChange={(checked) => setContactIsPrimary(Boolean(checked))}
              />
              <Label className="text-sm text-[#4b5563]">Set as primary contact</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddContactOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={handleAddContact}
              disabled={addContactTab === "existing" && existingContactId === "none"}
            >
              Save Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add Activity for {account.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2">
            <FormField label="Activity Type">
              <Select
                value={activityForm.kind}
                onValueChange={(value) =>
                  setActivityForm((prev) => ({
                    ...prev,
                    kind: value as CustomerActivityKind,
                  }))
                }
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Message">Message</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Note">Note</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Activity Note">
              <Input
                value={activityForm.note}
                onChange={(event) =>
                  setActivityForm((prev) => ({ ...prev, note: event.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
                placeholder="e.g. Follow-up call completed, requested proposal."
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddActivityOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={handleAddActivity}
              disabled={!activityForm.note.trim()}
            >
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmPrimaryContactId)}
        onOpenChange={(open) => {
          if (!open) setConfirmPrimaryContactId(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Set Primary Contact</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#4b5563]">
            {contactToConfirm
              ? `Set ${contactToConfirm.contact.firstName} ${contactToConfirm.contact.lastName} as the primary contact for this customer?`
              : "Set this contact as primary for this customer?"}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmPrimaryContactId(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
              onClick={() => {
                if (confirmPrimaryContactId) {
                  onAssignPrimaryContact(confirmPrimaryContactId);
                }
                setConfirmPrimaryContactId(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmRemoveAssociationId)}
        onOpenChange={(open) => {
          if (!open) setConfirmRemoveAssociationId(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-[460px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove contact from customer?</AlertDialogTitle>
            <AlertDialogDescription>
              {contactToRemoveFromAccount
                ? `${contactToRemoveFromAccount.contact.firstName} ${contactToRemoveFromAccount.contact.lastName} will be unlinked from ${account.name}. The contact record is not deleted.`
                : "This contact will be unlinked from this customer. The contact record is not deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirmRemoveAssociationId) {
                  onRemoveContact(confirmRemoveAssociationId);
                }
                setConfirmRemoveAssociationId(null);
              }}
            >
              Remove from customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className="text-sm text-[#1c1e21]">{value}</p>
    </div>
  );
}

function ProfileField({
  label,
  value,
  isEditing,
  children,
  className,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-[#6b7280]">{label}</Label>
      {isEditing && children ? (
        children
      ) : (
        <div className="min-h-[38px] rounded-md border border-[#f0f2f7] bg-[#f9fafb] px-3 py-2.5 text-sm text-[#1c1e21]">
          {value || "—"}
        </div>
      )}
    </div>
  );
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

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3">
      <div className="rounded-md bg-[#eef2fd] p-2">
        <Icon size={16} className="text-[#4080f0]" />
      </div>
      <div>
        <p className="text-xs text-[#6b7280]">{title}</p>
        <p className="text-base font-semibold text-[#1c1e21]">{value}</p>
      </div>
    </div>
  );
}

function AccountsTable({
  accounts,
  contacts,
  associations,
  pipelineLeads,
  pipelineDeals,
  duplicateAccountIds,
  onSetStatus,
  onEdit,
  onDelete,
  onOpenDetails,
}: {
  accounts: CustomerAccount[];
  contacts: CustomerContact[];
  associations: AccountContactAssociation[];
  pipelineLeads: PipelineLead[];
  pipelineDeals: PipelineDeal[];
  duplicateAccountIds: Set<string>;
  onSetStatus: (accountId: string, status: CustomerStatus) => void;
  onEdit: (account: CustomerAccount) => void;
  onDelete: (accountId: string) => void;
  onOpenDetails: (account: CustomerAccount) => void;
}) {
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));

  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Industry
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Deal/Lead
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Primary Contact
              </th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const isDuplicate = duplicateAccountIds.has(account.id);
              const primaryLink = associations.find(
                (association) => association.accountId === account.id && association.isPrimary,
              );
              const primaryContact = primaryLink
                ? contactById.get(primaryLink.contactId)
                : account.primaryContactId
                  ? contactById.get(account.primaryContactId)
                  : undefined;
              
              const accountLeads = pipelineLeads.filter(l => l.accountId === account.id).length;
              const accountDeals = pipelineDeals.filter(d => d.accountId === account.id).length;

              return (
                <tr
                  key={account.id}
                  onClick={() => onOpenDetails(account)}
                  className={cn(
                    "cursor-pointer border-b border-[#f0f2f7] transition-colors hover:bg-[#fafbff]",
                    isDuplicate && "bg-[#fff7ed] hover:bg-[#ffedd5]",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#1c1e21]">{account.name}</p>
                      {isDuplicate && (
                        <span className="rounded-full border border-[#fdba74] bg-[#fff1df] px-2 py-0.5 text-[11px] font-medium text-[#9a3412]">
                          Duplicate
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9ca3af]">{account.city}</p>
                  </td>
                  <td className="px-4 py-3 text-[#4b5563]">{account.industry}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="bg-[#e6f7ee] text-[#1a8a4a] border-[#a3d9b8] h-5 px-1.5 text-[10px]">
                        {accountDeals} D
                      </Badge>
                      <Badge variant="outline" className="bg-[#fff8e6] text-[#b07d00] border-[#fcd34d] h-5 px-1.5 text-[10px]">
                        {accountLeads} L
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#4b5563]">
                    {primaryContact
                      ? `${primaryContact.firstName} ${primaryContact.lastName}`
                      : "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 hover:bg-[#f0f2f7]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(account);
                          }}
                        >
                          <Pencil size={13} className="mr-2" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(account.id);
                          }}
                          className="text-[#dc2626]"
                        >
                          <Trash2 size={13} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactsTable({
  contacts,
  associations,
  accountById,
  duplicateContactIds,
  onEdit,
  onDelete,
}: {
  contacts: CustomerContact[];
  associations: AccountContactAssociation[];
  accountById: Map<string, CustomerAccount>;
  duplicateContactIds: Set<string>;
  onEdit: (contact: CustomerContact) => void;
  onDelete: (contactId: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Contact
              </th>
              <th className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Role
              </th>
              <th className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Associated Customers
              </th>
                {/* <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Owner
                </th> */}
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const isDuplicate = duplicateContactIds.has(contact.id);
              const linkedAccounts = associations
                .filter((association) => association.contactId === contact.id)
                .map((association) => accountById.get(association.accountId)?.name)
                .filter(Boolean)
                .join(", ");

              return (
                <tr
                  key={contact.id}
                  className={cn(
                    "border-b border-[#f0f2f7] transition-colors hover:bg-[#fafbff]",
                    isDuplicate && "bg-[#fff7ed] hover:bg-[#ffedd5]",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#1c1e21]">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {isDuplicate && (
                        <span className="rounded-full border border-[#fdba74] bg-[#fff1df] px-2 py-0.5 text-[11px] font-medium text-[#9a3412]">
                          Duplicate
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9ca3af]">{contact.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#4b5563]">{contact.roleTitle || "—"}</td>
                  <td className="px-4 py-3 text-[#4b5563]">{linkedAccounts || "Unlinked"}</td>
                  {/* <td className="px-4 py-3 text-[#4b5563]">{contact.owner}</td> */}
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 hover:bg-[#f0f2f7]">
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(contact)}>
                          <Pencil size={13} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(contact.id)} className="text-[#dc2626]">
                          <Trash2 size={13} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

