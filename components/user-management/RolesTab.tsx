"use client";

import { useState } from "react";
import {
  Plus,
  UserPlus,
  HandCoins,
  Building2,
  Clock,
  FileBarChart2,
  Settings,
  Shield,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CRM_MODULES,
  MODULE_ACTIONS,
  type Role,
} from "@/data/userManagementData";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RolesTabProps {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  selectedRoleId: string;
  setSelectedRoleId: React.Dispatch<React.SetStateAction<string>>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type CRMModuleKey = (typeof CRM_MODULES)[number];
type CRMActionKey = (typeof MODULE_ACTIONS)[number];

const MODULE_ICONS: Record<CRMModuleKey, React.ElementType> = {
  Leads: UserPlus,
  Deals: HandCoins,
  Contacts: Building2,
  Activities: Clock,
  Reports: FileBarChart2,
  Settings: Settings,
  Users: Shield,
};

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "#4080f0",
  Admin: "#5b5bd6",
  "Sales Manager": "#f97316",
  "Sales Rep": "#10b981",
  Viewer: "#94a3b8",
  "Support Agent": "#8b5cf6",
};

function getRoleColor(name: string) {
  return ROLE_COLORS[name] ?? "#4080f0";
}

function makeEmptyPerms(): Record<string, Record<string, boolean>> {
  return Object.fromEntries(
    CRM_MODULES.map((mod) => [
      mod,
      Object.fromEntries(MODULE_ACTIONS.map((a) => [a, false])),
    ])
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RolesTab({
  roles,
  setRoles,
  selectedRoleId,
  setSelectedRoleId,
}: RolesTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [createPerms, setCreatePerms] = useState<
    Record<string, Record<string, boolean>>
  >(() => makeEmptyPerms());

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0];

  // ── Permission toggle ────────────────────────────────────────────────────

  function togglePerm(mod: CRMModuleKey, action: CRMActionKey) {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRoleId
          ? {
              ...r,
              permissions: {
                ...r.permissions,
                [mod]: {
                  ...r.permissions[mod],
                  [action]: !r.permissions[mod]?.[action],
                },
              },
            }
          : r
      )
    );
  }

  // ── Create role ──────────────────────────────────────────────────────────

  function handleCreateRole() {
    if (!newRoleName.trim()) return;
    const newRole: Role = {
      id: `r${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
      usersCount: 0,
      isSystem: false,
      permissions: createPerms,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setRoles((prev) => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
    setCreateOpen(false);
    setNewRoleName("");
    setNewRoleDesc("");
    setCreatePerms(makeEmptyPerms());
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setNewRoleName("");
    setNewRoleDesc("");
    setCreatePerms(makeEmptyPerms());
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
        <h2 className="shrink-0 text-sm font-semibold leading-none text-[#1c1e21]">
          Roles &amp; Permissions
        </h2>
        <Button
          size="sm"
          className="ml-auto h-9 gap-1.5 bg-[#4080f0] hover:bg-[#3070e0] text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Create Role
        </Button>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-[220px_1fr] gap-4">
        {/* Left: role list */}
        <div className="space-y-1.5">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRoleId(role.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4080f0]/40",
                selectedRoleId === role.id
                  ? "border-[#bfcffa] bg-[#f4f7ff] shadow-sm"
                  : "border-[#e5e7eb] hover:border-[#bfcffa] hover:bg-[#fafbff]"
              )}
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getRoleColor(role.name) }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-tight text-[#1c1e21]">
                  {role.name}
                </div>
                <div className="text-[10px] text-[#6b7280]">
                  {role.usersCount} users
                </div>
              </div>
              {role.isSystem && (
                <Badge className="shrink-0 text-[9px] bg-[#f5f5f5] text-[#9ca3af] hover:opacity-100">
                  Default
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Right: permissions panel */}
        {selectedRole && (
          <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {/* Role header */}
            <div className="border-b border-[#e5e7eb] px-5 py-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: getRoleColor(selectedRole.name) }}
                />
                <span className="text-sm font-semibold text-[#1c1e21]">
                  {selectedRole.name}
                </span>
                {selectedRole.isSystem && (
                  <Badge className="text-[10px] bg-[#f5f5f5] text-[#9ca3af] hover:opacity-100">
                    Default
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-[#6b7280]">
                {selectedRole.description}
              </p>
            </div>

            {/* Permissions table */}
            <div className="p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="w-40 pb-2 text-left font-medium text-[#6b7280]">
                      Module
                    </th>
                    {MODULE_ACTIONS.map((a) => (
                      <th
                        key={a}
                        className="pb-2 text-center capitalize font-medium text-[#6b7280]"
                      >
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {CRM_MODULES.map((mod) => {
                    const Icon = MODULE_ICONS[mod as CRMModuleKey];
                    const perms = selectedRole.permissions[mod] ?? {};
                    const isLocked =
                      selectedRole.isSystem &&
                      selectedRole.name === "Super Admin";
                    return (
                      <tr key={mod} className="group">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-[#6b7280]" />
                            <span className="font-medium text-[#1c1e21]">
                              {mod}
                            </span>
                          </div>
                        </td>
                        {MODULE_ACTIONS.map((action) => (
                          <td key={action} className="py-2.5 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={perms[action] ?? false}
                                onCheckedChange={() =>
                                  togglePerm(
                                    mod as CRMModuleKey,
                                    action as CRMActionKey
                                  )
                                }
                                disabled={isLocked}
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

            {/* Locked footer */}
            {selectedRole.isSystem && selectedRole.name === "Super Admin" && (
              <div className="border-t border-[#e5e7eb] px-5 py-2.5">
                <p className="text-[10px] text-[#6b7280]">
                  Super Admin permissions cannot be modified.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createOpen} onOpenChange={closeCreateDialog}>
        <DialogContent className="max-w-2xl gap-0 bg-white p-0 sm:max-w-2xl">
          <DialogHeader className="gap-0 px-6 py-4 text-left">
            <DialogTitle className="text-base font-semibold leading-tight text-[#1c1e21]">
              Create Role
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[min(70vh,520px)] space-y-5 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-start">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="create-role-name"
                  className="text-xs font-medium text-[#1c1e21]"
                >
                  Role name
                </label>
                <Input
                  id="create-role-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Sales Manager"
                  className="h-9 border-[#e5e7eb] text-xs shadow-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="create-role-desc"
                  className="text-xs font-medium text-[#1c1e21]"
                >
                  Description
                </label>
                <Textarea
                  id="create-role-desc"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Manage sales team, leads, deals and reports."
                  className="min-h-[72px] resize-none border-[#e5e7eb] text-xs shadow-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-[#1c1e21]">
                Permissions
              </p>
              <p className="text-[11px] leading-snug text-[#6b7280]">
                The selected permissions will be linked to the new role after
                the role record is created.
              </p>
              <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#fafbff]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f5f6fa]">
                      <th className="w-40 px-3 py-2.5 text-left font-medium text-[#6b7280]">
                        Module
                      </th>
                      {MODULE_ACTIONS.map((a) => (
                        <th
                          key={a}
                          className="px-2 py-2.5 text-center font-medium capitalize text-[#6b7280]"
                        >
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {CRM_MODULES.map((mod) => {
                      const Icon = MODULE_ICONS[mod as CRMModuleKey];
                      const perms = createPerms[mod] ?? {};
                      return (
                        <tr key={mod}>
                          <td className="px-3 py-2.5 font-medium text-[#1c1e21]">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-[#6b7280]" />
                              {mod}
                            </div>
                          </td>
                          {MODULE_ACTIONS.map((action) => (
                            <td
                              key={action}
                              className="px-2 py-2.5 text-center"
                            >
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={perms[action] ?? false}
                                  onCheckedChange={() =>
                                    setCreatePerms((prev) => ({
                                      ...prev,
                                      [mod]: {
                                        ...prev[mod],
                                        [action]: !prev[mod]?.[action],
                                      },
                                    }))
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
          </div>
          <DialogFooter className="mx-0 mt-0 gap-2 border-t border-[#e5e7eb] bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={closeCreateDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              disabled={!newRoleName.trim()}
              onClick={handleCreateRole}
            >
              Create role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
