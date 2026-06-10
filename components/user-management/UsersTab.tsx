"use client";

import { useState, useMemo, useRef } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  ChevronDown,
  ArrowLeft,
  Inbox,
  UserCheck,
  UserX,
  Mail,
  ChevronLeft,
  ChevronRight,
  Edit,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  users as initialUsers,
  type CRMUser,
  type UserStatus,
  type UserRole,
  type Role,
} from "@/data/userManagementData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsersTabProps {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
}

// ─── Mock pool for Add User ───────────────────────────────────────────────────

const CRM_USER_POOL: Omit<
  CRMUser,
  "role" | "status" | "lastActive" | "joinedAt" | "customPermissions"
>[] = [
  {
    id: "pool-1",
    name: "Samrawit Bekele",
    email: "samrawit.bekele@company.com",
    phone: "0911001122",
    department: "Sales",
    branch: "Addis Ababa HQ",
    team: "—",
    manager: "Sara Tesfaye",
  },
  {
    id: "pool-2",
    name: "Mekdes Hailu",
    email: "mekdes.hailu@company.com",
    phone: "0912002233",
    department: "Pre-sales",
    branch: "Addis Ababa HQ",
    team: "—",
    manager: "Daniel Bekele",
  },
  {
    id: "pool-3",
    name: "Bereket Alemayehu",
    email: "bereket.alemayehu@company.com",
    phone: "0913003344",
    department: "Pre-sales",
    branch: "Dire Dawa Branch",
    team: "—",
    manager: "Hana Worku",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusColor(s: UserStatus) {
  if (s === "Active") return "bg-[#e6f7ee] text-[#1a8a4a]";
  if (s === "Inactive") return "bg-[#f5f5f5] text-[#6b7280]";
  if (s === "Pending") return "bg-[#fff8e6] text-[#b07d00]";
  return "bg-[#fef2f2] text-[#dc2626]";
}

function roleColor(r: string) {
  const k = r.toLowerCase();
  if (k === "super admin") return "bg-[#eef2fd] text-[#4080f0]";
  if (k === "admin") return "bg-[#f0f0ff] text-[#5b5bd6]";
  if (k === "sales manager") return "bg-[#fef3f2] text-[#c0440e]";
  if (k === "sales rep") return "bg-[#f0fdf4] text-[#166534]";
  if (k === "support agent") return "bg-[#fdf4ff] text-[#9333ea]";
  return "bg-[#f5f5f5] text-[#6b7280]";
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatJoinDate(iso: string): string {
  if (!iso || iso === "—") return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return iso;
  return `${parseInt(d, 10)} ${MONTH_NAMES[idx]}, ${y}`;
}

// Subset of modules shown in user-detail permissions card (matches Selamnew pattern)
const DETAIL_PERM_MODULES = ["Leads", "Deals", "Contacts", "Reports"];
const DETAIL_PERM_ACTIONS = ["View", "Create", "Edit", "Delete"];

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-normal text-[#6b7280]">{label}</p>
      <div className="mt-1 text-sm text-[#1c1e21]">{value}</div>
    </div>
  );
}

// ─── UserDetailPage ───────────────────────────────────────────────────────────

function UserDetailPage({
  user,
  onBack,
  onRemove,
  onUpdateUser,
  roleDefinitions,
}: {
  user: CRMUser;
  onBack: () => void;
  onRemove: () => void;
  onUpdateUser: (next: CRMUser) => void;
  roleDefinitions: Role[];
}) {
  const [editingCard, setEditingCard] = useState<"roles" | null>(null);
  const [draft, setDraft] = useState<CRMUser>(user);

  const initialPermissions = (
    roleName: string
  ): Record<string, Record<string, boolean>> => {
    const found = roleDefinitions.find((r) => r.name === roleName);
    if (found) return JSON.parse(JSON.stringify(found.permissions));
    return Object.fromEntries(
      DETAIL_PERM_MODULES.map((mod) => [
        mod,
        Object.fromEntries(DETAIL_PERM_ACTIONS.map((a) => [a, false])),
      ])
    );
  };

  const [draftPermissions, setDraftPermissions] = useState<
    Record<string, Record<string, boolean>>
  >(() => initialPermissions(user.role));

  const startEditRoles = () => {
    setDraft(user);
    setDraftPermissions(
      user.customPermissions ?? initialPermissions(user.role)
    );
    setEditingCard("roles");
  };
  const cancelEdit = () => {
    setEditingCard(null);
    setDraft(user);
  };
  const saveEdit = () => {
    onUpdateUser({ ...draft, customPermissions: draftPermissions });
    setEditingCard(null);
  };

  const toggleDraftPerm = (mod: string, action: string) => {
    setDraftPermissions((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: !prev[mod]?.[action] },
    }));
  };

  // Avatar dialog
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [draggedOver, setDraggedOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickFile = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedOver(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) setSelectedFile(file);
  };
  const resetAvatarDialog = () => {
    setSelectedFile(null);
    setDraggedOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded border-[#e5e7eb] hover:bg-transparent"
            onClick={onBack}
            aria-label="Back to users list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <p className="text-base font-semibold text-[#1c1e21]">User detail</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-[#fca5a5] text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#dc2626]"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>

      {/* Profile header section */}
      <section className="bg-white rounded-lg border border-[#e5e7eb] p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
            <div className="relative">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-[#eef2fd] text-sm font-semibold text-[#4080f0]">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                aria-label="Change profile image"
                onClick={() => setAvatarDialogOpen(true)}
                className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#4080f0] shadow-sm transition-colors hover:bg-[#4080f0] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4080f0]/40"
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0 space-y-0.5 pt-0.5">
              <h2 className="text-base font-semibold leading-tight text-[#1c1e21]">
                {user.name}
              </h2>
              <p className="text-xs text-[#6b7280]">{user.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`inline-flex h-6 w-fit shrink-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded border px-2.5 py-1 text-[10px] font-medium whitespace-nowrap transition-opacity hover:opacity-90 focus-visible:outline-none ${statusColor(user.status)}`}
                aria-label={`Status ${user.status}. Open menu to change`}
              >
                {user.status}
                <ChevronDown className="size-3 opacity-70" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {(
                ["Active", "Inactive", "Pending", "Suspended"] as UserStatus[]
              ).map((s) => (
                <DropdownMenuItem
                  key={s}
                  className="text-xs"
                  onClick={() => onUpdateUser({ ...user, status: s })}
                >
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="my-5 bg-[#e5e7eb]" />

        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-normal text-[#6b7280]">Joined at</p>
            <p className="mt-1 text-sm text-[#1c1e21]">
              {formatJoinDate(user.joinedAt)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-normal text-[#6b7280]">Role</p>
            <p className="mt-1 text-sm text-[#1c1e21]">{user.role}</p>
          </div>
          <div>
            <p className="text-[11px] font-normal text-[#6b7280]">Branch</p>
            <p className="mt-1 text-sm text-[#1c1e21]">{user.branch || "—"}</p>
          </div>
        </div>
      </section>

      {/* Info cards grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Personal Information */}
        <section className="bg-white rounded-lg border border-[#e5e7eb] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#1c1e21]">
              Personal Information
            </h3>
          </div>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailField label="Name" value={user.name} />
            <DetailField label="Email" value={user.email} />
            <DetailField label="Phone" value={user.phone || "—"} />
            <DetailField label="Team" value={user.team || "—"} />
          </div>
        </section>

        {/* Organization */}
        <section className="bg-white rounded-lg border border-[#e5e7eb] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#1c1e21]">
              Organization
            </h3>
          </div>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailField label="Branch" value={user.branch || "—"} />
            <DetailField label="Department" value={user.department || "—"} />
            <DetailField label="Manager" value={user.manager || "—"} />
          </div>
        </section>

        {/* Role & Permission */}
        <section className="bg-white rounded-lg border border-[#e5e7eb] p-5 md:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#1c1e21]">
              Role &amp; Permission
            </h3>
            {editingCard === "roles" ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-[#e5e7eb] text-xs"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 bg-[#4080f0] hover:bg-[#3070e0] text-white text-xs"
                  onClick={saveEdit}
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-[#e5e7eb] text-xs"
                onClick={startEditRoles}
              >
                <Edit size={12} />
                Edit
              </Button>
            )}
          </div>

          {editingCard === "roles" ? (
            <div className="space-y-4">
              <p className="text-[11px] leading-relaxed text-[#6b7280]">
                Each user can have only one role. Use the edit action to change
                this user&apos;s role and permissions.
              </p>
              {/* Role radio buttons */}
              <div className="flex flex-wrap gap-2">
                {roleDefinitions.map((rec) => {
                  const checked = draft.role === rec.name;
                  return (
                    <label
                      key={rec.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                        checked
                          ? "border-[#4080f0] bg-[#f4f7ff]"
                          : "border-[#e5e7eb] bg-white hover:border-[#bfcffa]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="user-detail-role"
                        className="sr-only"
                        checked={checked}
                        onChange={() => {
                          setDraft({ ...draft, role: rec.name as UserRole });
                          setDraftPermissions(initialPermissions(rec.name));
                        }}
                      />
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          checked
                            ? "border-[#4080f0] bg-[#4080f0]"
                            : "border-[#9ca3af] bg-transparent"
                        }`}
                        aria-hidden
                      >
                        {checked ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        ) : null}
                      </span>
                      <span
                        className={`font-medium ${checked ? "text-[#1c1e21]" : "text-[#6b7280]"}`}
                      >
                        {rec.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              {/* Permissions table */}
              {draft.role ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-[#1c1e21]">
                    Permissions
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
                    <table className="w-full text-xs">
                      <thead className="border-b border-[#e5e7eb]">
                        <tr>
                          <th className="w-40 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                            Module
                          </th>
                          {DETAIL_PERM_ACTIONS.map((a) => (
                            <th
                              key={a}
                              className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]"
                            >
                              {a}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {DETAIL_PERM_MODULES.map((mod) => {
                          const perms = draftPermissions[mod] ?? {};
                          return (
                            <tr key={mod}>
                              <td className="px-3 py-2.5 font-medium text-[#1c1e21]">
                                {mod}
                              </td>
                              {DETAIL_PERM_ACTIONS.map((action) => (
                                <td
                                  key={action}
                                  className="px-2 py-2.5 text-center"
                                >
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={perms[action] ?? false}
                                      onCheckedChange={() =>
                                        toggleDraftPerm(mod, action)
                                      }
                                      className="h-4 w-4"
                                    />
                                  </div>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Badge
                className={`text-[10px] hover:opacity-100 ${roleColor(user.role)}`}
              >
                {user.role}
              </Badge>
              <p className="text-[11px] text-[#6b7280]">
                Each user can have only one role. Use the edit action to change
                this user&apos;s role and permissions.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Avatar change dialog */}
      <Dialog
        open={avatarDialogOpen}
        onOpenChange={(open) => {
          setAvatarDialogOpen(open);
          if (!open) resetAvatarDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Profile Image</DialogTitle>
          </DialogHeader>
          <div
            role="button"
            tabIndex={0}
            onClick={handlePickFile}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePickFile();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              draggedOver
                ? "border-[#4080f0] bg-[#f4f7ff]"
                : "border-[#e5e7eb] hover:border-[#bfcffa] hover:bg-[#fafbff]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Inbox className="h-10 w-10 text-[#4080f0]" />
            <p className="text-sm font-medium text-[#1c1e21]">
              {selectedFile
                ? selectedFile.name
                : "Drag and drop your image here or click to upload."}
            </p>
            {selectedFile ? (
              <p className="text-[11px] text-[#6b7280]">
                {(selectedFile.size / 1024).toFixed(1)} KB · click to choose a
                different file
              </p>
            ) : null}
          </div>
          <DialogFooter className="border-t-0 pt-0">
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => {
                resetAvatarDialog();
                setAvatarDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              disabled={!selectedFile}
              onClick={() => {
                resetAvatarDialog();
                setAvatarDialogOpen(false);
              }}
            >
              Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── UsersTab (UsersScreen) ───────────────────────────────────────────────────

export function UsersTab({ roles, setRoles }: UsersTabProps) {
  const [users, setUsers] = useState<CRMUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [addRole, setAddRole] = useState<string>(
    () => roles.find((r) => r.name === "Viewer")?.name ?? roles[0]?.name ?? "Viewer"
  );
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CRMUser | null>(null);

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const viewingUser = useMemo(
    () =>
      viewingUserId ? users.find((u) => u.id === viewingUserId) ?? null : null,
    [users, viewingUserId]
  );

  const existingEmails = useMemo(
    () => new Set(users.map((u) => u.id)),
    [users]
  );
  const poolCandidates = useMemo(
    () =>
      CRM_USER_POOL.filter(
        (u) =>
          !existingEmails.has(u.id) &&
          (u.name.toLowerCase().includes(addSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(addSearch.toLowerCase()))
      ),
    [existingEmails, addSearch]
  );

  const defaultRoleName = useMemo(
    () =>
      roles.find((r) => r.name === "Viewer")?.name ??
      roles[0]?.name ??
      "Viewer",
    [roles]
  );

  const looksLikeEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const canAddUser = !!selectedPoolId || looksLikeEmail(addSearch);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      const q = search.toLowerCase();
      return (
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  function handleAddUser() {
    const pool = CRM_USER_POOL.find((u) => u.id === selectedPoolId);
    let newUser: CRMUser;
    if (pool) {
      newUser = {
        ...pool,
        role: addRole as UserRole,
        status: "Pending",
        lastActive: "—",
        joinedAt: new Date().toISOString().slice(0, 10),
      };
    } else {
      const email = addSearch.trim();
      const localPart = email.split("@")[0] ?? "";
      const derivedName =
        localPart
          .split(/[._-]+/)
          .filter(Boolean)
          .map((p) => p[0]!.toUpperCase() + p.slice(1))
          .join(" ") || "Invited User";
      newUser = {
        id: `invited-${Date.now()}`,
        name: derivedName,
        email,
        phone: "",
        role: addRole as UserRole,
        department: "—",
        branch: "",
        team: "—",
        manager: "—",
        status: "Pending",
        lastActive: "—",
        joinedAt: new Date().toISOString().slice(0, 10),
      };
    }
    setUsers((prev) => [newUser, ...prev]);
    closeAddDialog();
  }

  function closeAddDialog() {
    setAddDialogOpen(false);
    setSelectedPoolId(null);
    setAddSearch("");
    setComboboxOpen(false);
    setAddRole(defaultRoleName);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    if (viewingUserId === deleteTarget.id) setViewingUserId(null);
    setDeleteTarget(null);
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (viewingUser) {
    return (
      <UserDetailPage
        user={viewingUser}
        roleDefinitions={roles}
        onBack={() => setViewingUserId(null)}
        onRemove={() => setDeleteTarget(viewingUser)}
        onUpdateUser={(next) => {
          setUsers((prev) => prev.map((u) => (u.id === next.id ? next : u)));
          // Keep viewing the updated user
        }}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#1c1e21]">
            Team Members
          </h2>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-[#4080f0] hover:bg-[#3070e0] text-white"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add User
          </Button>
        </div>
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-[#9ca3af]" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search users…"
              className="h-9 w-56 pl-8 shadow-none border-[#e5e7eb] text-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-40 text-xs shadow-none border-[#e5e7eb]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All roles
                </SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name} className="text-xs">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-32 text-xs shadow-none border-[#e5e7eb]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All
                </SelectItem>
                {(
                  [
                    "Active",
                    "Inactive",
                    "Pending",
                    "Suspended",
                  ] as UserStatus[]
                ).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Users",
            value: users.length,
            icon: Users,
          },
          {
            label: "Active",
            value: users.filter((u) => u.status === "Active").length,
            icon: UserCheck,
          },
          {
            label: "Pending",
            value: users.filter((u) => u.status === "Pending").length,
            icon: Mail,
          },
          {
            label: "Inactive",
            value: users.filter(
              (u) => u.status === "Inactive" || u.status === "Suspended"
            ).length,
            icon: UserX,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-lg border border-[#e5e7eb] p-4 hover:translate-y-0 hover:bg-[#fafbff] hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xl font-semibold tabular-nums leading-tight text-[#1c1e21]">
                {value}
              </p>
              <Icon
                className="h-4 w-4 shrink-0 text-[#4080f0]"
                aria-hidden
              />
            </div>
            <p className="text-xs font-medium text-[#6b7280] leading-snug mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white">
            <TableRow>
              <TableHead className="pl-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">User</TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Team</TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                Department
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Role</TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Status</TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                Last Active
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-xs text-[#6b7280]"
                >
                  No users match the current filter.
                </TableCell>
              </TableRow>
            )}
            {pagedUsers.map((user) => (
              <TableRow
                key={user.id}
                className="group cursor-pointer hover:bg-[#fafbff]"
                onClick={() => setViewingUserId(user.id)}
              >
                <TableCell className="pl-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-[#eef2fd] text-[10px] font-semibold text-[#4080f0]">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-medium leading-tight text-[#1c1e21]">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-[#6b7280]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs text-[#6b7280]">
                  {user.team}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs text-[#6b7280]">
                  {user.department}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Badge
                    className={`text-[10px] hover:opacity-100 ${roleColor(user.role)}`}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Badge
                    className={`text-[10px] hover:opacity-100 ${statusColor(user.status)}`}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-xs text-[#6b7280] font-mono">
                  {user.lastActive}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#6b7280]">
            <span>
              Showing{" "}
              {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filtered.length)} of{" "}
              {filtered.length} users
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs shadow-none border-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-[#e5e7eb]"
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p =
                totalPages <= 5
                  ? i + 1
                  : safePage <= 3
                    ? i + 1
                    : safePage >= totalPages - 2
                      ? totalPages - 4 + i
                      : safePage - 2 + i;
              return (
                <Button
                  key={p}
                  variant={p === safePage ? "default" : "ghost"}
                  size="icon"
                  className={`h-7 w-7 text-xs ${p === safePage ? "bg-[#4080f0] hover:bg-[#3070e0] text-white" : "hover:bg-[#f0f2f7]"}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-[#e5e7eb]"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeAddDialog();
          else setAddDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1c1e21]">
                Employee{" "}
                <span className="text-[#dc2626]" aria-hidden="true">
                  *
                </span>
              </label>
              <div
                className="relative"
                onBlurCapture={(e) => {
                  if (
                    !e.currentTarget.contains(e.relatedTarget as Node | null)
                  ) {
                    window.setTimeout(() => setComboboxOpen(false), 120);
                  }
                }}
              >
                <Input
                  value={addSearch}
                  placeholder="Select"
                  className="h-9 pr-8 text-xs shadow-none border-[#e5e7eb]"
                  onFocus={() => setComboboxOpen(true)}
                  onClick={() => setComboboxOpen(true)}
                  onChange={(e) => {
                    setAddSearch(e.target.value);
                    setSelectedPoolId(null);
                    setComboboxOpen(true);
                  }}
                />
                <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7280]" />
                {comboboxOpen ? (
                  <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-[#e5e7eb] bg-white p-1 shadow-md">
                    {poolCandidates.length === 0 ? (
                      <div className="px-2 py-2 text-xs text-[#6b7280]">
                        {looksLikeEmail(addSearch)
                          ? `Press "Add User" to invite ${addSearch.trim()}.`
                          : "No matching users. Type an email to invite someone new."}
                      </div>
                    ) : (
                      poolCandidates.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedPoolId(u.id);
                            setAddSearch(u.name);
                            setComboboxOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-[#f9fafb] ${
                            selectedPoolId === u.id
                              ? "bg-[#eef2fd] ring-1 ring-[#bfcffa]"
                              : ""
                          }`}
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-[#eef2fd] text-[10px] font-semibold text-[#4080f0]">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-xs font-medium leading-tight text-[#1c1e21]">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-[#6b7280]">
                              {u.email} · {u.department}
                            </div>
                          </div>
                          {selectedPoolId === u.id && (
                            <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#4080f0]" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              <p className="mt-1 text-[10px] text-[#6b7280]">
                Pick a known employee or type an email address to invite someone
                new.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1c1e21]">
                Assign Role
              </label>
              <Select value={addRole} onValueChange={(v) => setAddRole(v)}>
                <SelectTrigger className="h-9 w-full text-xs shadow-none border-[#e5e7eb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name} className="text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t-0 pt-0">
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={closeAddDialog}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              disabled={!canAddUser}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      {deleteTarget && (
        <Dialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">Remove user</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-[#6b7280]">
              Are you sure you want to remove{" "}
              <span className="font-medium text-[#1c1e21]">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone — the user will lose access
              immediately.
            </p>
            <DialogFooter className="border-t-0 pt-0">
              <Button
                variant="outline"
                size="sm"
                className="border-[#e5e7eb]"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
