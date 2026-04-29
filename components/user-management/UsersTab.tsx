"use client";

import { useState } from "react";
import {
  Search,
  MoreHorizontal,
  Users,
  UserCheck,
  Clock3,
  Plane,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Download,
  Trash2,
  Edit,
  Eye,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  users as initialUsers,
  type CRMUser,
  type UserStatus,
  type UserRole,
} from "@/data/userManagementData";
import { UserDetailView } from "./UserDetailView";

// ─── Config ───────────────────────────────────────────────────────────────────
const statusConfig: Record<UserStatus, { label: string; className: string }> = {
  Active: {
    label: "Active",
    className: "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]",
  },
  Inactive: {
    label: "Inactive",
    className: "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]",
  },
  Pending: {
    label: "Pending",
    className: "bg-[#fff8e6] text-[#b07d00] border border-[#fcd34d]",
  },
  Suspended: {
    label: "Suspended",
    className: "bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5]",
  },
};

const roleColors: Record<string, string> = {
  "Super Admin": "bg-[#eef2fd] text-[#4080f0] border border-[#bfcffa]",
  Admin: "bg-[#f0f0ff] text-[#5b5bd6] border border-[#c4c4f5]",
  "Sales Manager": "bg-[#fef3f2] text-[#c0440e] border border-[#fbc4a9]",
  "Sales Rep": "bg-[#f0fdf4] text-[#166534] border border-[#86efac]",
  Viewer: "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]",
  "Support Agent": "bg-[#fdf4ff] text-[#9333ea] border border-[#d8b4fe]",
};

const ROLES: UserRole[] = [
  "Super Admin",
  "Admin",
  "Sales Manager",
  "Sales Rep",
  "Viewer",
  "Support Agent",
];
const DEPARTMENTS = [
  "Management",
  "Sales",
  "IT",
  "Finance",
  "Customer Support",
];
const STATUSES: UserStatus[] = ["Active", "Inactive", "Pending", "Suspended"];

const KNOWN_INVITE_CANDIDATES = [
  {
    id: "kc1",
    name: "Samrawit Bekele",
    email: "samrawit.bekele@company.com",
    phone: "0911001122",
    department: "Sales",
    branch: "Addis Ababa HQ",
    manager: "Sara Tesfaye",
  },
  {
    id: "kc2",
    name: "Mekdes Hailu",
    email: "mekdes.hailu@company.com",
    phone: "0912002233",
    department: "Finance",
    branch: "Addis Ababa HQ",
    manager: "Daniel Bekele",
  },
  {
    id: "kc3",
    name: "Bereket Alemayehu",
    email: "bereket.alemayehu@company.com",
    phone: "0913003344",
    department: "Customer Support",
    branch: "Dire Dawa Branch",
    manager: "Hana Worku",
  },
] as const;

const avatarColors = [
  "bg-[#4080f0]",
  "bg-[#10b981]",
  "bg-[#f59e0b]",
  "bg-[#8b5cf6]",
  "bg-[#ef4444]",
  "bg-[#06b6d4]",
  "bg-[#f97316]",
  "bg-[#ec4899]",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const idx =
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
    avatarColors.length;
  return avatarColors[idx];
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function UsersTab() {
  const [users, setUsers] = useState<CRMUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<CRMUser | null>(null);
  const [detailEditMode, setDetailEditMode] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    candidateIds: [] as string[],
    role: "Sales Rep" as UserRole,
  });
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteFilterDept, setInviteFilterDept] = useState<string>("all");

  const PER_PAGE = 8;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchDept = filterDept === "all" || u.department === filterDept;
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchRole && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selected.length === paged.length) setSelected([]);
    else setSelected(paged.map((u) => u.id));
  };

  const handleInvite = () => {
    const selectedCandidates = inviteCandidates.filter((candidate) =>
      inviteForm.candidateIds.includes(candidate.id),
    );
    if (selectedCandidates.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    const newUsers: CRMUser[] = selectedCandidates.map((candidate, index) => ({
      id: `u-${candidate.id}-${today}-${index}`,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      department: candidate.department,
      branch: candidate.branch,
      manager: candidate.manager,
      role: inviteForm.role,
      team: "—",
      status: "Pending",
      joinedAt: today,
      lastActive: "—",
    }));
    setUsers((prev) => [...newUsers, ...prev]);
    setInviteOpen(false);
    setInviteForm({
      candidateIds: [],
      role: "Sales Rep",
    });
    setInviteSearch("");
    setInviteFilterDept("all");
  };

  const existingEmails = new Set(users.map((user) => user.email.toLowerCase()));
  const inviteCandidates = KNOWN_INVITE_CANDIDATES.filter(
    (candidate) => !existingEmails.has(candidate.email.toLowerCase()),
  );
  const normalizedInviteSearch = inviteSearch.trim().toLowerCase();
  const filteredInviteCandidates = inviteCandidates.filter((candidate) => {
    const matchesSearch =
      !normalizedInviteSearch ||
      candidate.name.toLowerCase().includes(normalizedInviteSearch) ||
      candidate.email.toLowerCase().includes(normalizedInviteSearch) ||
      candidate.phone.includes(normalizedInviteSearch);
    const matchesDept =
      inviteFilterDept === "all" || candidate.department === inviteFilterDept;
    return matchesSearch && matchesDept;
  });
  const hasInviteFilters = Boolean(normalizedInviteSearch) || inviteFilterDept !== "all";
  const handleStatusChange = (id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
  };

  const handleUserUpdate = (updated: CRMUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setDetailUser(updated);
  };

  const openDetail = (user: CRMUser, editMode = false) => {
    setDetailUser(user);
    setDetailEditMode(editMode);
  };

  // ── Render UserDetailView ────────────────────────────────────────────────
  if (detailUser) {
    return (
      <UserDetailView
        user={detailUser}
        users={users}
        initialEditMode={detailEditMode}
        onBack={() => {
          setDetailUser(null);
          setDetailEditMode(false);
        }}
        onUpdate={handleUserUpdate}
      />
    );
  }

  // ── Table view ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <div className="relative w-full sm:w-[240px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            />
            <Input
              placeholder="Search users..."
              className="pl-9 h-9 bg-white border-[#e5e7eb] text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={filterRole}
            onValueChange={(v) => {
              setFilterRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-[150px] bg-white border-[#e5e7eb] text-sm">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterDept}
            onValueChange={(v) => {
              setFilterDept(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-[160px] bg-white border-[#e5e7eb] text-sm">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-[130px] bg-white border-[#e5e7eb] text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-[#dc2626] border-[#fca5a5] hover:bg-[#fef2f2]"
              onClick={() => {
                selected.forEach((id) => handleDelete(id));
                setSelected([]);
              }}
            >
              <Trash2 size={14} className="mr-1.5" />
              Delete ({selected.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-[#e5e7eb] bg-white text-sm"
          >
            <Download size={14} className="mr-1.5" />
            Export
          </Button>
          <Button
            size="sm"
            className="h-9 bg-[#4080f0] hover:bg-[#3070e0] text-white text-sm"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={14} className="mr-1.5" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Users",
            value: users.length,
            color: "text-[#4080f0]",
            bg: "bg-[#eef2fd]",
            icon: Users,
          },
          {
            label: "Active",
            value: users.filter((u) => u.status === "Active").length,
            color: "text-[#1a8a4a]",
            bg: "bg-[#e6f7ee]",
            icon: UserCheck,
          },
          {
            label: "Pending",
            value: users.filter((u) => u.status === "Pending").length,
            color: "text-[#b07d00]",
            bg: "bg-[#fff8e6]",
            icon: Clock3,
          },
          {
            label: "Inactive / Suspended",
            value: users.filter(
              (u) => u.status === "Inactive" || u.status === "Suspended",
            ).length,
            color: "text-[#dc2626]",
            bg: "bg-[#fef2f2]",
            icon: Plane,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-[#e5e7eb] px-4 py-4 flex items-center gap-4"
          >
            <div className={`${stat.bg} rounded-md p-2`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">{stat.label}</p>
              <p className={`font-semibold text-lg ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#e5e7eb] flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                <th className="w-10 px-4 py-3 text-left">
                  <Checkbox
                    checked={
                      selected.length === paged.length && paged.length > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                  Team
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                  Manager
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                  Last Active
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((user) => (
                <tr
                  key={user.id}
                  className="cursor-pointer border-b border-[#f0f2f7] transition-colors hover:bg-[#fafbff]"
                  onClick={() => openDetail(user)}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.includes(user.id)}
                      onClick={(event) => event.stopPropagation()}
                      onCheckedChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          className={`${getAvatarColor(user.name)} text-white text-xs font-medium`}
                        >
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-[#1c1e21] hover:text-[#4080f0] transition-colors">
                          {user.name}
                        </p>
                        <p className="text-xs text-[#9ca3af]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        roleColors[user.role] || ""
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#4b5563]">
                    {user.department}
                  </td>
                  <td className="px-4 py-3 text-[#4b5563]">{user.branch}</td>
                  <td className="px-4 py-3 text-[#4b5563]">{user.manager}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusConfig[user.status].className
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#9ca3af] text-xs">
                    {user.lastActive}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-[#f0f2f7]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => openDetail(user)}
                          className="text-sm cursor-pointer"
                        >
                          <Eye size={13} className="mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDetail(user, true)}
                          className="text-sm cursor-pointer"
                        >
                          <Edit size={13} className="mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "Active" ? (
                          <DropdownMenuItem
                            className="text-sm cursor-pointer text-[#b07d00]"
                            onClick={() =>
                              handleStatusChange(user.id, "Inactive")
                            }
                          >
                            <UserX size={13} className="mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-sm cursor-pointer text-[#1a8a4a]"
                            onClick={() =>
                              handleStatusChange(user.id, "Active")
                            }
                          >
                            <CheckCircle2 size={13} className="mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-sm cursor-pointer text-[#dc2626]"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 size={13} className="mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-[#9ca3af]"
                  >
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e7eb]">
          <p className="text-xs text-[#6b7280]">
            Showing {(page - 1) * PER_PAGE + 1}–
            {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}{" "}
            users
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "ghost"}
                size="icon"
                className={`h-7 w-7 text-xs ${
                  p === page ? "bg-[#4080f0] hover:bg-[#3070e0] text-white" : ""
                }`}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Invite User Dialog ───────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-hidden sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <UserPlus size={18} className="text-[#4080f0]" />
              Invite New User
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 overflow-y-auto py-2 pr-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Known People *</Label>
              <Input
                placeholder="Search by name, email, or phone"
                className="h-9 border-[#e5e7eb]"
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
              />
              <p className="text-[11px] text-[#9ca3af]">
                Search and filter to quickly find the right person.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Filter by Team</Label>
              <Select
                value={inviteFilterDept}
                onValueChange={setInviteFilterDept}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 rounded-md border border-[#e5e7eb]">
              <div className="flex items-center justify-between border-b border-[#eef0f4] px-3 py-2">
                <p className="text-xs text-[#6b7280]">
                  Known people ({filteredInviteCandidates.length})
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-[#6b7280] hover:text-[#1c1e21]"
                    onClick={() =>
                      setInviteForm((f) => ({
                        ...f,
                        candidateIds: Array.from(
                          new Set([
                            ...f.candidateIds,
                            ...filteredInviteCandidates.map((candidate) => candidate.id),
                          ]),
                        ),
                      }))
                    }
                  >
                    Select all
                  </Button>
                  {inviteForm.candidateIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-[#6b7280] hover:text-[#1c1e21]"
                      onClick={() =>
                        setInviteForm((f) => ({
                          ...f,
                          candidateIds: [],
                        }))
                      }
                    >
                      Clear all
                    </Button>
                  )}
                  {hasInviteFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-[#6b7280] hover:text-[#1c1e21]"
                      onClick={() => {
                        setInviteSearch("");
                        setInviteFilterDept("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {filteredInviteCandidates.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-[#9ca3af]">
                    No known users match your search/filter.
                  </p>
                ) : (
                  filteredInviteCandidates.map((candidate) => {
                    const isSelected = inviteForm.candidateIds.includes(candidate.id);
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "border-[#bfd3fb] bg-[#eef2fd]"
                            : "border-transparent hover:border-[#e5e7eb] hover:bg-[#f9fafb]"
                        }`}
                        onClick={() =>
                          setInviteForm((f) => ({
                            ...f,
                            candidateIds: isSelected
                              ? f.candidateIds.filter((id) => id !== candidate.id)
                              : [...f.candidateIds, candidate.id],
                          }))
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#1c1e21]">
                              {candidate.name}
                            </p>
                            <p className="truncate text-xs text-[#6b7280]">
                              {candidate.email}
                            </p>
                            <p className="text-xs text-[#9ca3af]">
                              Team: {candidate.department} · {candidate.branch}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 size={14} className="text-[#4080f0] mt-0.5" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-[#6b7280]">Assign Role *</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) =>
                  setInviteForm((f) => ({ ...f, role: v as UserRole }))
                }
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              onClick={handleInvite}
              disabled={inviteForm.candidateIds.length === 0}
            >
              Send Invite{inviteForm.candidateIds.length > 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
