"use client";

import { Check, X, Lock, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CRM_MODULES,
  MODULE_ACTIONS,
  type Role,
} from "@/data/userManagementData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PermissionsTabProps {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  selectedRoleId: string;
  setSelectedRoleId: React.Dispatch<React.SetStateAction<string>>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const roleColorDot: Record<string, string> = {
  "Super Admin": "bg-[#4080f0]",
  Admin: "bg-[#5b5bd6]",
  "Sales Manager": "bg-[#f97316]",
  "Sales Rep": "bg-[#10b981]",
  Viewer: "bg-[#6b7280]",
  "Support Agent": "bg-[#8b5cf6]",
};

function getRoleDot(name: string) {
  return roleColorDot[name] ?? "bg-[#4080f0]";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PermissionsTab({
  roles,
  setRoles,
  selectedRoleId,
  setSelectedRoleId,
}: PermissionsTabProps) {
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0];

  function togglePerm(mod: string, action: string) {
    if (!selectedRole || selectedRole.isSystem) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRole.id
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

  function toggleModule(mod: string, val: boolean) {
    if (!selectedRole || selectedRole.isSystem) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRole.id
          ? {
              ...r,
              permissions: {
                ...r.permissions,
                [mod]: Object.fromEntries(
                  MODULE_ACTIONS.map((a) => [a, val])
                ),
              },
            }
          : r
      )
    );
  }

  function toggleAll(val: boolean) {
    if (!selectedRole || selectedRole.isSystem) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRole.id
          ? {
              ...r,
              permissions: Object.fromEntries(
                CRM_MODULES.map((mod) => [
                  mod,
                  Object.fromEntries(MODULE_ACTIONS.map((a) => [a, val])),
                ])
              ),
            }
          : r
      )
    );
  }

  const allGranted =
    selectedRole &&
    CRM_MODULES.every((mod) =>
      MODULE_ACTIONS.every((a) => selectedRole.permissions[mod]?.[a] ?? false)
    );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-[#1c1e21]">Permissions</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger className="h-9 w-52 bg-white border-[#e5e7eb] text-sm shadow-none">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${getRoleDot(r.name)}`}
                    />
                    {r.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main panel */}
      <div className="bg-white rounded-lg border border-[#e5e7eb] flex flex-col flex-1 min-h-0 overflow-hidden">
        {selectedRole ? (
          <>
            {/* Role header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-3 w-3 rounded-full shrink-0 ${getRoleDot(selectedRole.name)}`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1c1e21]">
                      {selectedRole.name}
                    </span>
                    {selectedRole.isSystem && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#9ca3af] bg-[#f5f5f5] px-1.5 py-0.5 rounded-full">
                        <Lock size={9} />
                        System Role
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9ca3af]">
                    {selectedRole.description}
                  </p>
                </div>
              </div>
              {!selectedRole.isSystem && (
                <button
                  type="button"
                  className="text-xs text-[#4080f0] hover:underline"
                  onClick={() => toggleAll(!allGranted)}
                >
                  {allGranted ? "Clear all" : "Select all"}
                </button>
              )}
            </div>

            {/* Permissions matrix */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide w-36">
                      Module
                    </th>
                    {MODULE_ACTIONS.map((a) => (
                      <th
                        key={a}
                        className="px-3 py-2.5 text-center text-xs font-semibold text-[#6b7280] uppercase tracking-wide"
                      >
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRM_MODULES.map((mod) => {
                    const modPerms = selectedRole.permissions[mod] ?? {};
                    const allModGranted = MODULE_ACTIONS.every(
                      (a) => modPerms[a] ?? false
                    );
                    return (
                      <tr
                        key={mod}
                        className="border-b border-[#f0f2f7] hover:bg-[#fafbff]"
                      >
                        <td className="px-4 py-2.5 font-medium text-[#1c1e21] text-sm">
                          {selectedRole.isSystem ? (
                            mod
                          ) : (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={allModGranted}
                                onCheckedChange={(v) =>
                                  toggleModule(mod, !!v)
                                }
                              />
                              <span>{mod}</span>
                            </div>
                          )}
                        </td>
                        {MODULE_ACTIONS.map((action) => {
                          const checked = modPerms[action] ?? false;
                          return (
                            <td
                              key={action}
                              className="px-3 py-2.5 text-center"
                            >
                              {selectedRole.isSystem ? (
                                checked ? (
                                  <Check
                                    size={15}
                                    className="inline-block text-[#1a8a4a]"
                                  />
                                ) : (
                                  <X
                                    size={15}
                                    className="inline-block text-[#d1d5db]"
                                  />
                                )
                              ) : (
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() =>
                                    togglePerm(mod, action)
                                  }
                                  className="mx-auto"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer legend */}
            <div className="px-5 py-3 border-t border-[#f0f2f7] bg-[#f9fafb] flex items-center gap-4 text-xs text-[#9ca3af]">
              {selectedRole.isSystem ? (
                <>
                  <span className="flex items-center gap-1">
                    <Check size={12} className="text-[#1a8a4a]" /> Permission
                    Granted
                  </span>
                  <span className="flex items-center gap-1">
                    <X size={12} className="text-[#d1d5db]" /> No Access
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock size={11} /> System role permissions cannot be
                    modified
                  </span>
                </>
              ) : (
                <span className="text-[#9ca3af]">
                  Changes are saved automatically as you check or uncheck
                  permissions.
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 text-[#9ca3af] text-sm">
            <Shield size={16} />
            Select a role to view permissions
          </div>
        )}
      </div>
    </div>
  );
}
