"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  email: "",
  phone: "",
  city: "",
  country: "Ethiopia",
  website: "",
  owner: "",
  status: "Lead" as CustomerStatus,
  lifecycleStage: "Lead" as CustomerLifecycleStage,
  leadSource: "",
  expectedDealValue: "",
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

export function CustomerManagementPage() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [accounts, setAccounts] = useState<CustomerAccount[]>(initialAccounts);
  const [contacts, setContacts] = useState<CustomerContact[]>(initialContacts);
  const [associations, setAssociations] =
    useState<AccountContactAssociation[]>(initialAssociations);

  const [search, setSearch] = useState("");
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountDialogStep, setAccountDialogStep] = useState<"basic" | "details">("basic");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({
    accountId: "",
    contactId: "",
    role: associationRoles[0],
    isPrimary: false,
  });

  useEffect(() => {
    if (tabQuery === "contacts") {
      setActiveTab("contacts");
      return;
    }
    setActiveTab("accounts");
  }, [tabQuery]);

  const filteredAccounts = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q),
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
  const accountStats = useMemo(
    () => ({
      total: accounts.length,
      active: accounts.filter((account) => account.status === "Active").length,
      leads: accounts.filter((account) => account.status === "Lead").length,
      linkedContacts: associations.length,
    }),
    [accounts, associations],
  );

  const resetAccountForm = () => {
    setAccountForm(emptyAccountForm);
    setEditingAccountId(null);
    setAccountDialogStep("basic");
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
                expectedDealValue: accountForm.expectedDealValue
                  ? Number(accountForm.expectedDealValue)
                  : undefined,
              }
            : account,
        ),
      );
    } else {
      const newAccount: CustomerAccount = {
        id: `acc-${Date.now()}`,
        ...accountForm,
        expectedDealValue: accountForm.expectedDealValue
          ? Number(accountForm.expectedDealValue)
          : undefined,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setAccounts((prev) => [newAccount, ...prev]);
    }

    setAccountDialogOpen(false);
    resetAccountForm();
  };

  useEffect(() => {
    if (accountDialogOpen) {
      setAccountDialogStep("basic");
    }
  }, [accountDialogOpen]);

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
        onBack={() => setSelectedAccount(null)}
        onMoveStage={(stage) => moveCustomerStage(selectedAccount.id, stage)}
        onUpdateAccount={(updatedAccount) => {
          setAccounts((prev) =>
            prev.map((item) => (item.id === updatedAccount.id ? updatedAccount : item)),
          );
          setSelectedAccount(updatedAccount);
        }}
        allContacts={contacts}
        onAddContact={addContactForSelectedCustomer}
        onAddExistingContact={addExistingContactForSelectedCustomer}
        onAssignPrimaryContact={assignPrimaryContactForSelectedCustomer}
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">Customer Management</h1>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-5">
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Total Customers" value={String(accountStats.total)} icon={Building2} />
          <StatCard title="Active Customers" value={String(accountStats.active)} icon={Users} />
          <StatCard title="Lead Customers" value={String(accountStats.leads)} icon={UserRound} />
          <StatCard title="Account-Contact Links" value={String(accountStats.linkedContacts)} icon={Link2} />
        </div>

        {(activeTab === "accounts" || activeTab === "contacts") && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-[340px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === "accounts"
                    ? "Search customers by name, industry, owner"
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
            duplicateAccountIds={duplicateAccountIds}
            onSetStatus={setAccountStatus}
            onEdit={(account) => {
              setEditingAccountId(account.id);
              setAccountForm({
                name: account.name,
                industry: account.industry,
                size: account.size,
                email: account.email,
                phone: account.phone,
                city: account.city,
                country: account.country,
                website: account.website,
                owner: account.owner,
                status: account.status,
                lifecycleStage: account.lifecycleStage,
                leadSource: account.leadSource ?? "",
                expectedDealValue: account.expectedDealValue
                  ? String(account.expectedDealValue)
                  : "",
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
          <Tabs value={accountDialogStep} className="w-full">
            <TabsList className="mb-3 grid w-full grid-cols-2">
              <TabsTrigger value="basic">Step 1: Basic</TabsTrigger>
              <TabsTrigger value="details">Step 2: Details</TabsTrigger>
            </TabsList>
            <TabsContent value="basic">
              <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
                <FormField label="Account Name *">
                  <Input
                    value={accountForm.name}
                    onChange={(event) => setAccountForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Industry *">
                  <Select
                    value={accountForm.industry}
                    onValueChange={(value) => setAccountForm((prev) => ({ ...prev, industry: value }))}
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
                    onValueChange={(value) => setAccountForm((prev) => ({ ...prev, size: value }))}
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
                <FormField label="Owner">
                  <Select
                    value={accountForm.owner || "unassigned"}
                    onValueChange={(value) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        owner: value === "unassigned" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-9 border-[#e5e7eb]">
                      <SelectValue placeholder="Assign later" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {customerOwners.map((owner) => (
                        <SelectItem key={owner} value={owner}>
                          {owner}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Email">
                  <Input
                    value={accountForm.email}
                    onChange={(event) => setAccountForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Phone">
                  <Input
                    value={accountForm.phone}
                    onChange={(event) => setAccountForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
              </div>
            </TabsContent>
            <TabsContent value="details">
              <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
                <FormField label="City">
                  <Input
                    value={accountForm.city}
                    onChange={(event) => setAccountForm((prev) => ({ ...prev, city: event.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Country">
                  <Input
                    value={accountForm.country}
                    onChange={(event) => setAccountForm((prev) => ({ ...prev, country: event.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Website">
                  <Input
                    value={accountForm.website}
                    onChange={(event) => setAccountForm((prev) => ({ ...prev, website: event.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Customer Status">
                  <Select
                    value={accountForm.status}
                    onValueChange={(value) =>
                      setAccountForm((prev) => ({ ...prev, status: value as CustomerStatus }))
                    }
                  >
                    <SelectTrigger className="h-9 border-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Lifecycle Stage (Lead/Deal)">
                  <Select
                    value={accountForm.lifecycleStage}
                    onValueChange={(value) =>
                      setAccountForm((prev) => ({ ...prev, lifecycleStage: value as CustomerLifecycleStage }))
                    }
                  >
                    <SelectTrigger className="h-9 border-[#e5e7eb]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Deal">Deal</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Lead Source">
                  <Input
                    value={accountForm.leadSource}
                    onChange={(event) => setAccountForm((prev) => ({ ...prev, leadSource: event.target.value }))}
                    className="h-9 border-[#e5e7eb]"
                  />
                </FormField>
                <FormField label="Expected Deal Value">
                  <Input
                    value={accountForm.expectedDealValue}
                    onChange={(event) =>
                      setAccountForm((prev) => ({ ...prev, expectedDealValue: event.target.value }))
                    }
                    className="h-9 border-[#e5e7eb]"
                    placeholder="e.g. 125000"
                  />
                </FormField>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAccountDialogOpen(false)}>
              Cancel
            </Button>
            {accountDialogStep === "basic" ? (
              <Button
                size="sm"
                className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                onClick={() => setAccountDialogStep("details")}
              >
                Next
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAccountDialogStep("basic")}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  className="bg-[#4080f0] text-white hover:bg-[#3070e0]"
                  onClick={handleSaveAccount}
                >
                  {editingAccountId ? "Save Changes" : "Create Customer"}
                </Button>
              </>
            )}
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
            <FormField label="Status">
              <Select
                value={contactForm.status}
                onValueChange={(value) =>
                  setContactForm((prev) => ({ ...prev, status: value as "Active" | "Inactive" }))
                }
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
  allContacts,
  onBack,
  onMoveStage,
  onUpdateAccount,
  onAddContact,
  onAddExistingContact,
  onAssignPrimaryContact,
}: {
  account: CustomerAccount;
  accountContacts: { association: AccountContactAssociation; contact: CustomerContact }[];
  allContacts: CustomerContact[];
  onBack: () => void;
  onMoveStage: (stage: CustomerLifecycleStage) => void;
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
  onAssignPrimaryContact: (contactId: string) => void;
}) {
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addContactTab, setAddContactTab] = useState<"new" | "existing">("new");
  const [detailTab, setDetailTab] = useState<"profile" | "activity">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<CustomerAccount>(account);
  const [confirmPrimaryContactId, setConfirmPrimaryContactId] = useState<
    string | null
  >(null);
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
  const contactToConfirm = accountContacts.find(
    (item) => item.contact.id === confirmPrimaryContactId,
  );
  const activityItems = useMemo(
    () =>
      [
        {
          id: `account-created-${account.id}`,
          date: account.createdAt,
          text: `Customer account created (${account.status} / ${account.lifecycleStage}).`,
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
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [account, accountContacts],
  );
  const selectedPrimaryContact = accountContacts.find(
    (item) => item.contact.id === profileDraft.primaryContactId,
  )?.contact;
  const linkedContactIds = new Set(accountContacts.map((item) => item.contact.id));
  const availableExistingContacts = allContacts.filter(
    (contact) => !linkedContactIds.has(contact.id),
  );

  useEffect(() => {
    setProfileDraft(account);
    setIsEditingProfile(false);
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
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center rounded-md border border-[#d6deef] bg-white p-1">
            <button
              type="button"
              onClick={() => onMoveStage("Lead")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                account.lifecycleStage === "Lead"
                  ? "bg-[#fff8e6] text-[#9a6a00]"
                  : "text-[#6b7280] hover:bg-[#f5f7fb]",
              )}
            >
              Lead
            </button>
            <button
              type="button"
              onClick={() => onMoveStage("Deal")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                account.lifecycleStage === "Deal"
                  ? "bg-[#e6f7ee] text-[#1a8a4a]"
                  : "text-[#6b7280] hover:bg-[#f5f7fb]",
              )}
            >
              Deal
            </button>
          </div>
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
                  <Button
                    size="sm"
                    className="h-8 bg-[#4080f0] text-white hover:bg-[#3070e0]"
                    onClick={() => setAddContactOpen(true)}
                  >
                    <UserPlus size={13} className="mr-1.5" />
                    Add Contact
                  </Button>
                </div>
              </div>
              <TabsContent value="profile">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#1c1e21]">Profile</h3>
                  <span className="rounded-full border border-[#e2e8f5] bg-[#f8faff] px-2 py-0.5 text-xs text-[#4b5563]">
                    {profileDraft.status} • {profileDraft.lifecycleStage}
                  </span>
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
                  <ProfileField label="Owner" value={profileDraft.owner} isEditing={isEditingProfile}>
                    <Select
                      value={profileDraft.owner}
                      onValueChange={(value) => setProfileDraft((prev) => ({ ...prev, owner: value }))}
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
                  </ProfileField>
                  <ProfileField label="Email Address" value={profileDraft.email || "—"} isEditing={isEditingProfile}>
                    <Input
                      value={profileDraft.email}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="h-9 border-[#e5e7eb]"
                    />
                  </ProfileField>
                  <ProfileField label="Phone Number" value={profileDraft.phone || "—"} isEditing={isEditingProfile}>
                    <Input
                      value={profileDraft.phone}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      className="h-9 border-[#e5e7eb]"
                    />
                  </ProfileField>
                  <ProfileField label="Customer Status" value={profileDraft.status} isEditing={isEditingProfile}>
                    <Select
                      value={profileDraft.status}
                      onValueChange={(value) =>
                        setProfileDraft((prev) => ({ ...prev, status: value as CustomerStatus }))
                      }
                    >
                      <SelectTrigger className="h-9 border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </ProfileField>
                  <ProfileField label="Lifecycle Stage" value={profileDraft.lifecycleStage} isEditing={isEditingProfile}>
                    <Select
                      value={profileDraft.lifecycleStage}
                      onValueChange={(value) =>
                        setProfileDraft((prev) => ({
                          ...prev,
                          lifecycleStage: value as CustomerLifecycleStage,
                        }))
                      }
                    >
                      <SelectTrigger className="h-9 border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Deal">Deal</SelectItem>
                      </SelectContent>
                    </Select>
                  </ProfileField>
                  <ProfileField label="Lead Source" value={profileDraft.leadSource || "—"} isEditing={isEditingProfile}>
                    <Input
                      value={profileDraft.leadSource || ""}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, leadSource: event.target.value }))
                      }
                      className="h-9 border-[#e5e7eb]"
                    />
                  </ProfileField>
                  <ProfileField
                    label="Expected Deal Value"
                    value={
                      profileDraft.expectedDealValue
                        ? `$${profileDraft.expectedDealValue.toLocaleString()}`
                        : "—"
                    }
                    isEditing={isEditingProfile}
                  >
                    <Input
                      value={profileDraft.expectedDealValue ? String(profileDraft.expectedDealValue) : ""}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({
                          ...prev,
                          expectedDealValue: event.target.value ? Number(event.target.value) : undefined,
                        }))
                      }
                      className="h-9 border-[#e5e7eb]"
                      placeholder="e.g. 125000"
                    />
                  </ProfileField>
                  <ProfileField
                    label="Primary Contact"
                    value={
                      selectedPrimaryContact
                        ? `${selectedPrimaryContact.firstName} ${selectedPrimaryContact.lastName}`
                        : "Unassigned"
                    }
                    isEditing={isEditingProfile}
                  >
                    <Select
                      value={profileDraft.primaryContactId || "none"}
                      onValueChange={(value) =>
                        setProfileDraft((prev) => ({
                          ...prev,
                          primaryContactId: value === "none" ? undefined : value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-9 border-[#e5e7eb]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Assign Later</SelectItem>
                        {accountContacts.map(({ contact }) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
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

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Lead/Deal Conversion
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoLine label="Lifecycle Stage" value={account.lifecycleStage} />
                <InfoLine label="Customer Status" value={account.status} />
              </div>
            </div>

            <div className="my-4 h-px bg-[#eef1f6]" />

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Contact
              </h4>
              {accountContacts.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {accountContacts.map(({ association, contact }) => (
                    <div
                      key={association.id}
                      className="group h-[80px] overflow-hidden rounded-md border border-[#e5e7eb] bg-[#fafbff] px-3 py-2 transition-[height] duration-200 hover:h-[106px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[#1c1e21]">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="truncate text-xs text-[#6b7280]">{contact.email}</p>
                          <p className="text-xs text-[#6b7280]">{association.role}</p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            association.isPrimary
                              ? "border border-[#a3d9b8] bg-[#e6f7ee] text-[#1a8a4a]"
                              : "border border-[#d9e1f0] bg-white text-[#6b7280]",
                          )}
                        >
                          {association.isPrimary ? "Primary" : "Contact"}
                        </span>
                      </div>
                      {!association.isPrimary && (
                        <div className="mt-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 border-[#d6deef] bg-white px-2 text-xs"
                            onClick={() => setConfirmPrimaryContactId(contact.id)}
                          >
                            Make Primary
                          </Button>
                        </div>
                      )}
                    </div>
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
  duplicateAccountIds,
  onSetStatus,
  onEdit,
  onDelete,
  onOpenDetails,
}: {
  accounts: CustomerAccount[];
  contacts: CustomerContact[];
  associations: AccountContactAssociation[];
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
                Owner
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Industry
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Primary Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Stage
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
                  <td className="px-4 py-3 text-[#4b5563]">{account.owner}</td>
                  <td className="px-4 py-3 text-[#4b5563]">{account.industry}</td>
                  <td className="px-4 py-3 text-[#4b5563]">
                    {primaryContact
                      ? `${primaryContact.firstName} ${primaryContact.lastName}`
                      : "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        customerStatusConfig[account.status],
                      )}
                    >
                      {account.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#4b5563]">{account.lifecycleStage}</td>
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
                        {account.status === "Active" ? (
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              onSetStatus(account.id, "Inactive");
                            }}
                            className="text-[#b07d00]"
                          >
                            <UserX size={13} className="mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              onSetStatus(account.id, "Active");
                            }}
                            className="text-[#1a8a4a]"
                          >
                            <CheckCircle2 size={13} className="mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Associated Customers
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Owner
              </th>
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
                  <td className="px-4 py-3 text-[#4b5563]">{contact.owner}</td>
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

