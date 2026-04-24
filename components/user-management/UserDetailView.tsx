"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Mail,
  Phone,
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
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          label="Team"
          value={user.team}
          isEditing={isEditing}
          icon={<Users size={11} />}
        >
          <Select
            value={user.team}
            onValueChange={(v) => onChange({ team: v })}
          >
            <SelectTrigger className="h-9 border-[#e5e7eb]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="—">No Team</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.name}>
                  {team.name}
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
    <div className="w-full">
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

      <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="grid grid-cols-[minmax(180px,1fr)_repeat(5,minmax(86px,auto))_120px] items-center gap-2 border-b border-[#eef1f5] bg-[#f9fafb] px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
            Module
          </span>
          {MODULE_ACTIONS.map((action) => (
            <span
              key={action}
              className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]"
            >
              {action}
            </span>
          ))}
          <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
            Scope
          </span>
        </div>

        <div className="divide-y divide-[#f0f2f7]">
          {CRM_MODULES.map((module) => (
            <div
              key={module}
              className="grid grid-cols-[minmax(180px,1fr)_repeat(5,minmax(86px,auto))_120px] items-center gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1f2937]">{module}</p>
              </div>

              {MODULE_ACTIONS.map((action) => {
                const enabled = permissions[module]?.[action] ?? false;
                return (
                  <div key={action} className="flex justify-center">
                    {isEditing ? (
                      <Checkbox
                        checked={enabled}
                        onCheckedChange={() => onToggle(module, action)}
                        className="data-[state=checked]:bg-[#4080f0] data-[state=checked]:border-[#4080f0]"
                      />
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center h-6 min-w-6 rounded-full px-1 text-[11px] font-bold",
                          enabled
                            ? "text-[#1a8a4a] bg-[#e8f7ef]"
                            : "text-[#9ca3af] bg-[#f3f4f6]"
                        )}
                      >
                        {enabled ? "✓" : "—"}
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-center">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => toggleAll(module)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                      allEnabled(module)
                        ? "border-[#bfd0fb] bg-[#eef3ff] text-[#245fcb]"
                        : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#cfd7e6]"
                    )}
                  >
                    {allEnabled(module) ? "Custom" : "Limited"}
                  </button>
                ) : (
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium",
                      allEnabled(module)
                        ? "bg-[#eef3ff] text-[#245fcb]"
                        : "bg-[#f3f4f6] text-[#6b7280]"
                    )}
                  >
                    {allEnabled(module) ? "Full" : "Custom"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
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
  const otherUsers = allUsers.filter((u) => u.id !== user.id);
  const usersByName = new Map(allUsers.map((item) => [item.name, item]));
  const reportsByManager = new Map<string, CRMUser[]>();

  allUsers.forEach((person) => {
    if (!person.manager || person.manager === "—") return;
    const list = reportsByManager.get(person.manager) ?? [];
    list.push(person);
    reportsByManager.set(person.manager, list);
  });

  const getDirectReports = (name: string) => reportsByManager.get(name) ?? [];

  const findTopLeader = (person: CRMUser) => {
    const seen = new Set<string>();
    let cursor: CRMUser | undefined = person;

    while (cursor?.manager && cursor.manager !== "—") {
      if (seen.has(cursor.id)) break;
      seen.add(cursor.id);

      const nextManager = usersByName.get(cursor.manager);
      if (!nextManager) break;
      cursor = nextManager;
    }

    return cursor ?? person;
  };

  const topLeader = findTopLeader(user);
  const isExecutiveView = topLeader.id === user.id;
  const managerData = usersByName.get(user.manager);
  const rootNode = isExecutiveView ? topLeader : user;
  const firstLevelManagers = getDirectReports(rootNode.name);
  const upstreamNodes: CRMUser[] = [];

  if (!isExecutiveView && managerData && managerData.id !== topLeader.id) {
    upstreamNodes.push(topLeader);
  }
  if (!isExecutiveView && managerData) {
    upstreamNodes.push(managerData);
  }

  const chainNodes = [...upstreamNodes, rootNode];

  const BranchTree = ({
    parent,
    depth = 0,
  }: {
    parent: CRMUser;
    depth?: number;
  }) => {
    if (depth > 2) return null;
    const reports = getDirectReports(parent.name);
    if (!reports.length) return null;

    return (
      <div className="mt-3 space-y-2.5">
        {reports.map((report) => (
          <div key={report.id} className="relative pl-5">
            <span className="absolute left-2 top-0 h-full w-px bg-[#d8deeb]" />
            <span className="absolute left-2 top-5 h-px w-3 bg-[#d8deeb]" />
            <CondensedPersonCard
              user={report}
              isFocus={report.id === user.id}
              reportCount={getDirectReports(report.name).length}
            />
            <BranchTree parent={report} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {isEditing ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b7280]">Team</Label>
            <Select value={user.team} onValueChange={(v) => onChange({ team: v })}>
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
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b7280]">Reports To</Label>
            <Select value={user.manager} onValueChange={(v) => onChange({ manager: v })}>
              <SelectTrigger className="h-9 border-[#e5e7eb]">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="—">None</SelectItem>
                {otherUsers.map((u) => (
                  <SelectItem key={u.id} value={u.name}>
                    {u.name} <span className="text-[#9ca3af]">· {u.role}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-[#dfe4ee] bg-white p-4 sm:p-5">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {chainNodes.map((node, idx) => {
              const isLastInChain = idx === chainNodes.length - 1;
              const shouldDrawConnector = !isLastInChain || firstLevelManagers.length > 0;

              return (
                <div
                  key={`${node.id}-${idx}`}
                  className="flex flex-col items-center pb-2"
                >
                  <CondensedPersonCard
                    user={node}
                    isFocus={node.id === rootNode.id}
                    reportCount={getDirectReports(node.name).length}
                    elevated={node.id === rootNode.id}
                  />
                  {shouldDrawConnector ? (
                    <span className="mt-1 h-7 w-px bg-[#d8deeb]" />
                  ) : null}
                </div>
              );
            })}

            {firstLevelManagers.length > 0 ? (
              <div className="relative pt-8">
                <div className="relative mx-auto w-max">
                  <span className="absolute left-[110px] right-[110px] top-0 h-px bg-[#d8deeb]" />
                  <div className="flex w-max items-start gap-5">
                    {firstLevelManagers.map((manager) => (
                      <div key={manager.id} className="relative w-[220px] pt-6">
                        <span className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-[#d8deeb]" />
                        <div className="mb-3 flex justify-center">
                          <CondensedPersonCard
                            user={manager}
                            isFocus={manager.id === user.id}
                            reportCount={getDirectReports(manager.name).length}
                          />
                        </div>
                        <BranchTree parent={manager} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-[#d7deeb] bg-[#fafbff] p-4 text-sm text-[#6b7280]">
                No reporting hierarchy available for this user yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CondensedPersonCard({
  user,
  isFocus = false,
  elevated = false,
  reportCount = 0,
}: {
  user: CRMUser;
  isFocus?: boolean;
  elevated?: boolean;
  reportCount?: number;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-[220px] rounded-lg border bg-white px-3 py-2 shadow-sm",
        isFocus ? "border-[#6b93ef] ring-2 ring-[#dfe9ff]" : "border-[#e5e7eb]",
        elevated && "border-[#cad8fb]"
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback
            className={`${getAvatarColor(user.name)} text-white text-[10px] font-semibold`}
          >
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[#1f2937]">{user.name}</p>
          <p className="truncate text-[11px] text-[#6b7280]">{user.role}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[#64748b]">
        <span className="truncate">{user.team}</span>
        <span className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] px-1.5 py-0.5">
          <Users size={10} />
          {reportCount}
        </span>
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

  const tabConfig: {
    id: DetailTab;
    label: string;
    icon: React.ReactNode;
    hint: string;
  }[] = [
    {
      id: "profile",
      label: "Profile",
      icon: <User size={13} />,
      hint: "Identity and org details",
    },
    {
      id: "permissions",
      label: "Permissions",
      icon: <Key size={13} />,
      hint: "Module access matrix",
    },
    {
      id: "team",
      label: "Team & Access",
      icon: <Users size={13} />,
      hint: "Reporting and assignment",
    },
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
            <h2 className="font-semibold text-[#1c1e21] mb-1.5">{user.name}</h2>
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
                <Users size={11} />
                {user.team}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {user.branch}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Section Switcher + Content ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fb]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <aside className="w-full lg:w-[260px] lg:min-w-[260px]">
            <div className="flex flex-col gap-2">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors",
                    activeTab === tab.id
                      ? "border-[#bfd0fb] bg-[#eef3ff]"
                      : "border-[#e5e7eb] bg-white hover:border-[#cfd7e6]"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={
                        activeTab === tab.id ? "text-[#4080f0]" : "text-[#9ca3af]"
                      }
                    >
                      {tab.icon}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        activeTab === tab.id ? "text-[#245fcb]" : "text-[#1f2937]"
                      )}
                    >
                      {tab.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#9ca3af]">{tab.hint}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
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
      </div>
    </div>
  );
}


