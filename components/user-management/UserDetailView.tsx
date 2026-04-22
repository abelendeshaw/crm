"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Mail,
  Phone,
  Building2,
  Users,
  MapPin,
  Calendar,
  Clock,
  Key,
  User,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CRMUser,
  UserRole,
  UserStatus,
  CRM_MODULES,
  MODULE_ACTIONS,
  roles,
  teams,
} from "@/data/userManagementData";
import { cn } from "@/lib/utils";

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
const BRANCHES = [
  "Addis Ababa HQ",
  "Dire Dawa Branch",
  "Hawassa Branch",
  "Bahir Dar Branch",
  "Mekelle Branch",
];

const statusConfig: Record<
  UserStatus,
  { className: string; dot: string }
> = {
  Active: {
    className: "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]",
    dot: "bg-[#1a8a4a]",
  },
  Inactive: {
    className: "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]",
    dot: "bg-[#9ca3af]",
  },
  Pending: {
    className: "bg-[#fff8e6] text-[#b07d00] border border-[#fcd34d]",
    dot: "bg-[#f59e0b]",
  },
  Suspended: {
    className: "bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5]",
    dot: "bg-[#dc2626]",
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

function getRolePermissions(
  roleName: string
): Record<string, Record<string, boolean>> {
  const role = roles.find((r) => r.name === roleName);
  if (role) return JSON.parse(JSON.stringify(role.permissions));
  return Object.fromEntries(
    CRM_MODULES.map((m) => [
      m,
      Object.fromEntries(MODULE_ACTIONS.map((a) => [a, false])),
    ])
  );
}

// ─── InfoField ────────────────────────────────────────────────────────────────
function InfoField({
  label,
  value,
  isEditing,
  children,
  icon,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[#6b7280] flex items-center gap-1">
        {icon && <span className="text-[#9ca3af]">{icon}</span>}
        {label}
      </Label>
      {isEditing && children ? (
        children
      ) : (
        <div className="bg-[#f9fafb] border border-[#f0f2f7] rounded-md px-3 py-2.5 text-sm text-[#1c1e21] min-h-[38px] flex items-center">
          {value || "—"}
        </div>
      )}
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────
function ProfileTab({
  user,
  isEditing,
  allUsers,
  onChange,
  onRoleChange,
}: {
  user: CRMUser;
  isEditing: boolean;
  allUsers: CRMUser[];
  onChange: (partial: Partial<CRMUser>) => void;
  onRoleChange: (role: UserRole) => void;
}) {
  const otherUsers = allUsers.filter((u) => u.id !== user.id);

  return (
    <div className="grid grid-cols-1 gap-4 max-w-3xl md:grid-cols-2">
      <InfoField
        label="Full Name"
        value={user.name}
        isEditing={isEditing}
        icon={<User size={11} />}
      >
        <Input
          value={user.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="h-9 border-[#e5e7eb]"
          placeholder="Full name"
        />
      </InfoField>

      <InfoField
        label="Email Address"
        value={user.email}
        isEditing={isEditing}
        icon={<Mail size={11} />}
      >
        <Input
          type="email"
          value={user.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className="h-9 border-[#e5e7eb]"
          placeholder="email@company.com"
        />
      </InfoField>

      <InfoField
        label="Phone Number"
        value={user.phone}
        isEditing={isEditing}
        icon={<Phone size={11} />}
      >
        <Input
          value={user.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className="h-9 border-[#e5e7eb]"
          placeholder="09xxxxxxxx"
        />
      </InfoField>

      <InfoField
        label="Account Status"
        value={user.status}
        isEditing={isEditing}
        icon={<Shield size={11} />}
      >
        <Select
          value={user.status}
          onValueChange={(v) => onChange({ status: v as UserStatus })}
        >
          <SelectTrigger className="h-9 border-[#e5e7eb]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["Active", "Inactive", "Pending", "Suspended"] as UserStatus[]).map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </InfoField>

      <InfoField
        label="CRM Role"
        value={user.role}
        isEditing={isEditing}
        icon={<Key size={11} />}
      >
        <Select value={user.role} onValueChange={(v) => onRoleChange(v as UserRole)}>
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
      </InfoField>

      <InfoField
        label="Department"
        value={user.department}
        isEditing={isEditing}
        icon={<Building2 size={11} />}
      >
        <Select
          value={user.department}
          onValueChange={(v) => onChange({ department: v })}
        >
          <SelectTrigger className="h-9 border-[#e5e7eb]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InfoField>

      <InfoField
        label="Branch"
        value={user.branch}
        isEditing={isEditing}
        icon={<MapPin size={11} />}
      >
        <Select
          value={user.branch}
          onValueChange={(v) => onChange({ branch: v })}
        >
          <SelectTrigger className="h-9 border-[#e5e7eb]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BRANCHES.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InfoField>

      <InfoField
        label="Reports To (Manager)"
        value={user.manager}
        isEditing={isEditing}
        icon={<User size={11} />}
      >
        <Select
          value={user.manager}
          onValueChange={(v) => onChange({ manager: v })}
        >
          <SelectTrigger className="h-9 border-[#e5e7eb]">
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="—">None</SelectItem>
            {otherUsers.map((u) => (
              <SelectItem key={u.id} value={u.name}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InfoField>

      <InfoField
        label="Joined Date"
        value={user.joinedAt}
        isEditing={false}
        icon={<Calendar size={11} />}
      />

      <InfoField
        label="Last Active"
        value={user.lastActive}
        isEditing={false}
        icon={<Clock size={11} />}
      />
    </div>
  );
}

// ─── PermissionsTab ───────────────────────────────────────────────────────────
function PermissionsTab({
  permissions,
  role,
  isEditing,
  onToggle,
  onReset,
}: {
  permissions: Record<string, Record<string, boolean>>;
  role: string;
  isEditing: boolean;
  onToggle: (module: string, action: string) => void;
  onReset: () => void;
}) {
  const allEnabled = (module: string) =>
    MODULE_ACTIONS.every((a) => permissions[module]?.[a]);
  const toggleAll = (module: string) => {
    const shouldEnable = !allEnabled(module);
    MODULE_ACTIONS.forEach((a) => {
      if (permissions[module]?.[a] !== shouldEnable) onToggle(module, a);
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="font-medium text-[#1c1e21]">Module Permissions</h3>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            {isEditing
              ? "Toggle individual permissions. Changes override the role defaults for this user."
              : "Showing permissions for this user. Switch to edit mode to customize."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[#6b7280] bg-[#f0f2f7] px-2 py-1 rounded-md">
            Based on: <span className="font-medium text-[#1c1e21]">{role}</span>
          </span>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-[#e5e7eb] text-xs gap-1.5"
              onClick={onReset}
            >
              <RefreshCw size={11} />
              Reset to Defaults
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                Module
              </th>
              {MODULE_ACTIONS.map((action) => (
                <th
                  key={action}
                  className="px-4 py-3 text-center text-xs font-semibold text-[#6b7280] uppercase tracking-wide"
                >
                  {action}
                </th>
              ))}
              {isEditing && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                  All
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {CRM_MODULES.map((module, i) => (
              <tr
                key={module}
                className={cn(
                  "border-b border-[#f0f2f7] last:border-0",
                  i % 2 === 0 ? "bg-white" : "bg-[#fafbff]"
                )}
              >
                <td className="px-4 py-3 font-medium text-[#1c1e21] text-sm">
                  {module}
                </td>
                {MODULE_ACTIONS.map((action) => {
                  const enabled = permissions[module]?.[action] ?? false;
                  return (
                    <td key={action} className="px-4 py-3 text-center">
                      {isEditing ? (
                        <Checkbox
                          checked={enabled}
                          onCheckedChange={() => onToggle(module, action)}
                          className="mx-auto data-[state=checked]:bg-[#4080f0] data-[state=checked]:border-[#4080f0]"
                        />
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded-full mx-auto text-xs font-bold",
                            enabled
                              ? "text-[#1a8a4a] bg-[#e6f7ee]"
                              : "text-[#d1d5db] bg-[#f5f5f5]"
                          )}
                        >
                          {enabled ? "✓" : "✗"}
                        </span>
                      )}
                    </td>
                  );
                })}
                {isEditing && (
                  <td className="px-4 py-3 text-center">
                    <Checkbox
                      checked={allEnabled(module)}
                      onCheckedChange={() => toggleAll(module)}
                      className="mx-auto data-[state=checked]:bg-[#4080f0] data-[state=checked]:border-[#4080f0]"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TeamAccessTab ────────────────────────────────────────────────────────────
function TeamAccessTab({
  user,
  allUsers,
  isEditing,
  onChange,
}: {
  user: CRMUser;
  allUsers: CRMUser[];
  isEditing: boolean;
  onChange: (partial: Partial<CRMUser>) => void;
}) {
  const currentTeamData = teams.find((t) => t.name === user.team);
  const managerData = allUsers.find((u) => u.name === user.manager);
  const otherUsers = allUsers.filter((u) => u.id !== user.id);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current Team */}
      <div>
        <h3 className="font-medium text-[#1c1e21] mb-1">Team Assignment</h3>
        <p className="text-xs text-[#9ca3af] mb-3">
          The team this user belongs to within the organization.
        </p>
        {isEditing ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b7280]">Assign to Team</Label>
            <Select
              value={user.team}
              onValueChange={(v) => onChange({ team: v })}
            >
              <SelectTrigger className="h-9 border-[#e5e7eb]">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="—">No Team</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name} — {t.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : currentTeamData ? (
          <div className="bg-white rounded-lg border border-[#e5e7eb] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eef2fd] flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-[#4080f0]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#1c1e21]">
                  {currentTeamData.name}
                </p>
                <p className="text-xs text-[#9ca3af] mt-0.5">
                  {currentTeamData.department} · {currentTeamData.branch}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-[#4080f0]">
                  {currentTeamData.membersCount}
                </p>
                <p className="text-xs text-[#9ca3af]">Members</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#f0f2f7] flex items-center gap-2 text-xs text-[#6b7280]">
              <User size={11} />
              <span>
                Manager:{" "}
                <span className="font-medium text-[#1c1e21]">
                  {currentTeamData.manager}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#f9fafb] rounded-lg border border-dashed border-[#d1d5db] p-6 text-center">
            <Users size={24} className="text-[#d1d5db] mx-auto mb-2" />
            <p className="text-sm text-[#9ca3af]">
              Not assigned to any team
            </p>
          </div>
        )}
      </div>

      {/* Manager */}
      <div>
        <h3 className="font-medium text-[#1c1e21] mb-1">Reports To</h3>
        <p className="text-xs text-[#9ca3af] mb-3">
          The manager this user directly reports to.
        </p>
        {isEditing ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b7280]">Manager</Label>
            <Select
              value={user.manager}
              onValueChange={(v) => onChange({ manager: v })}
            >
              <SelectTrigger className="h-9 border-[#e5e7eb]">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="—">None</SelectItem>
                {otherUsers.map((u) => (
                  <SelectItem key={u.id} value={u.name}>
                    {u.name}{" "}
                    <span className="text-[#9ca3af]">· {u.role}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : managerData ? (
          <div className="bg-white rounded-lg border border-[#e5e7eb] p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className={`${getAvatarColor(managerData.name)} text-white text-xs font-medium`}
                >
                  {getInitials(managerData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-[#1c1e21]">
                  {managerData.name}
                </p>
                <p className="text-xs text-[#9ca3af]">
                  {managerData.role} · {managerData.department}
                </p>
              </div>
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  statusConfig[managerData.status].className
                )}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusConfig[managerData.status].dot}`}
                />
                {managerData.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#f9fafb] rounded-lg border border-dashed border-[#d1d5db] p-6 text-center">
            <User size={24} className="text-[#d1d5db] mx-auto mb-2" />
            <p className="text-sm text-[#9ca3af]">
              {user.manager === "—"
                ? "No manager assigned"
                : user.manager}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
type DetailTab = "profile" | "permissions" | "team";

type Props = {
  user: CRMUser;
  users: CRMUser[];
  initialEditMode?: boolean;
  onBack: () => void;
  onUpdate: (updated: CRMUser) => void;
};

export function UserDetailView({
  user,
  users,
  initialEditMode = false,
  onBack,
  onUpdate,
}: Props) {
  const [activeTab, setActiveTab] = useState<DetailTab>("profile");
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editData, setEditData] = useState<CRMUser>({ ...user });
  const [permissions, setPermissions] = useState<
    Record<string, Record<string, boolean>>
  >(() => user.customPermissions || getRolePermissions(user.role));

  const handleChange = (partial: Partial<CRMUser>) => {
    setEditData((prev) => ({ ...prev, ...partial }));
  };

  const handleRoleChange = (role: UserRole) => {
    setEditData((prev) => ({ ...prev, role }));
    setPermissions(getRolePermissions(role));
  };

  const handleSave = () => {
    const updated: CRMUser = { ...editData, customPermissions: permissions };
    onUpdate(updated);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ ...user });
    setPermissions(user.customPermissions || getRolePermissions(user.role));
    setIsEditing(false);
  };

  const togglePermission = (module: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  const resetToRoleDefaults = () => {
    setPermissions(getRolePermissions(editData.role));
  };

  const tabConfig: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={13} /> },
    { id: "permissions", label: "Permissions", icon: <Key size={13} /> },
    { id: "team", label: "Team & Access", icon: <Users size={13} /> },
  ];

  return (
    <div className="flex flex-col h-full -m-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 pt-4 pb-0 flex-shrink-0">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[#6b7280] hover:text-[#1c1e21] -ml-2 h-8"
            onClick={onBack}
          >
            <ArrowLeft size={14} />
            All Users
          </Button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#e5e7eb] h-8 gap-1.5"
                  onClick={handleCancel}
                >
                  <X size={13} />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[#4080f0] hover:bg-[#3070e0] text-white h-8 gap-1.5"
                  onClick={handleSave}
                >
                  <Check size={13} />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-[#e5e7eb] h-8 gap-1.5"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={13} />
                Edit User
              </Button>
            )}
          </div>
        </div>

        {/* User hero */}
        <div className="flex items-center gap-4 pb-4 border-b border-[#f0f2f7]">
          <Avatar className="h-14 w-14 flex-shrink-0">
            <AvatarFallback
              className={`${getAvatarColor(user.name)} text-white text-lg font-semibold`}
            >
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h2 className="font-semibold text-[#1c1e21]">{user.name}</h2>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  roleColors[user.role] || ""
                }`}
              >
                {user.role}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  statusConfig[user.status].className
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    statusConfig[user.status].dot
                  }`}
                />
                {user.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#9ca3af] flex-wrap">
              <span className="flex items-center gap-1">
                <Mail size={11} />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={11} />
                {user.phone}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={11} />
                {user.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {user.branch}
              </span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mt-1">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-[#4080f0] text-[#4080f0]"
                  : "border-transparent text-[#6b7280] hover:text-[#1c1e21]"
              )}
            >
              <span
                className={
                  activeTab === tab.id ? "text-[#4080f0]" : "text-[#9ca3af]"
                }
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fb]">
        {activeTab === "profile" && (
          <ProfileTab
            user={editData}
            isEditing={isEditing}
            allUsers={users}
            onChange={handleChange}
            onRoleChange={handleRoleChange}
          />
        )}
        {activeTab === "permissions" && (
          <PermissionsTab
            permissions={permissions}
            role={editData.role}
            isEditing={isEditing}
            onToggle={togglePermission}
            onReset={resetToRoleDefaults}
          />
        )}
        {activeTab === "team" && (
          <TeamAccessTab
            user={editData}
            allUsers={users}
            isEditing={isEditing}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
}


