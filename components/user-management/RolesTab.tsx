"use client";

import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Shield,
  Check,
  X,
  Edit,
  Trash2,
  Lock,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  roles as initialRoles,
  CRM_MODULES,
  MODULE_ACTIONS,
  type Role,
} from "@/data/userManagementData";

const roleColorMap: Record<string, string> = {
  "Super Admin": "bg-[#4080f0] text-white",
  Admin: "bg-[#5b5bd6] text-white",
  "Sales Manager": "bg-[#f97316] text-white",
  "Sales Rep": "bg-[#10b981] text-white",
  Viewer: "bg-[#6b7280] text-white",
  "Support Agent": "bg-[#8b5cf6] text-white",
};

function RoleCard({
  role,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: {
  role: Role;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colorClass =
    roleColorMap[role.name] || "bg-[#4080f0] text-white";

  return (
    <div
      className={`bg-white rounded-lg border-2 cursor-pointer transition-all p-4 ${
        isSelected ? "border-[#4080f0] shadow-sm" : "border-[#e5e7eb] hover:border-[#bfcffa]"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}
        >
          <Shield size={18} />
        </div>
        <div className="flex items-center gap-1">
          {role.isSystem && (
            <span className="flex items-center gap-0.5 text-[10px] text-[#9ca3af] bg-[#f5f5f5] px-1.5 py-0.5 rounded-full">
              <Lock size={9} />
              System
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-[#f0f2f7]"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="text-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit size={12} className="mr-2" /> Edit Role
              </DropdownMenuItem>
              {!role.isSystem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-sm cursor-pointer text-[#dc2626]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 size={12} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <h4 className="font-semibold text-[#1c1e21] text-sm mb-0.5">
        {role.name}
      </h4>
      <p className="text-xs text-[#9ca3af] mb-3 leading-relaxed line-clamp-2">
        {role.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-[#6b7280]">
          <Users size={12} />
          <span>{role.usersCount} users</span>
        </div>
        <ChevronRight
          size={13}
          className={`transition-colors ${isSelected ? "text-[#4080f0]" : "text-[#d1d5db]"}`}
        />
      </div>
    </div>
  );
}

function RoleTabButton({
  role,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: {
  role: Role;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group min-w-[210px] rounded-lg border px-3 py-2 text-left transition-all ${
        isSelected
          ? "border-[#4080f0] bg-[#f8fbff] shadow-sm"
          : "border-[#e5e7eb] bg-white hover:border-[#bfcffa]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1c1e21]">{role.name}</p>
          <p className="truncate text-xs text-[#9ca3af]">{role.usersCount} users</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-[#f0f2f7]"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={13} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-sm cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit size={12} className="mr-2" /> Edit Role
            </DropdownMenuItem>
            {!role.isSystem && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-sm cursor-pointer text-[#dc2626]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 size={12} className="mr-2" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            roleColorMap[role.name] || "bg-[#eef2fd] text-[#4080f0]"
          }`}
        >
          {role.isSystem ? "System Role" : "Custom Role"}
        </span>
        <ChevronRight
          size={13}
          className={isSelected ? "text-[#4080f0]" : "text-[#d1d5db] group-hover:text-[#9ca3af]"}
        />
      </div>
    </div>
  );
}

function PermissionsMatrix({
  permissions,
  onChange,
  onToggleModule,
  readOnly = false,
}: {
  permissions: Record<string, Record<string, boolean>>;
  onChange?: (mod: string, action: string, val: boolean) => void;
  onToggleModule?: (mod: string, val: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide w-32">
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
          {CRM_MODULES.map((mod) => (
            <tr
              key={mod}
              className="border-b border-[#f0f2f7] hover:bg-[#fafbff]"
            >
              <td className="px-4 py-2.5 font-medium text-[#1c1e21] text-sm">
                {!readOnly && onToggleModule ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={MODULE_ACTIONS.every(
                        (action) => permissions[mod]?.[action] ?? false
                      )}
                      onCheckedChange={(v) => onToggleModule(mod, !!v)}
                    />
                    <span>{mod}</span>
                  </div>
                ) : (
                  mod
                )}
              </td>
              {MODULE_ACTIONS.map((action) => {
                const checked = permissions[mod]?.[action] ?? false;
                return (
                  <td key={action} className="px-3 py-2.5 text-center">
                    {readOnly ? (
                      checked ? (
                        <Check
                          size={15}
                          className="inline-block text-[#1a8a4a]"
                        />
                      ) : (
                        <X size={15} className="inline-block text-[#d1d5db]" />
                      )
                    ) : (
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          onChange?.(mod, action, !!v)
                        }
                        className="mx-auto"
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RolesTab() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<Role>(initialRoles[0]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  const emptyPermissions = Object.fromEntries(
    CRM_MODULES.map((mod) => [
      mod,
      Object.fromEntries(MODULE_ACTIONS.map((a) => [a, false])),
    ])
  );

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: emptyPermissions,
  });

  const applyModulePermissions = (
    permissions: Record<string, Record<string, boolean>>,
    mod: string,
    val: boolean
  ) => ({
    ...permissions,
    [mod]: Object.fromEntries(MODULE_ACTIONS.map((action) => [action, val])),
  });

  const applyAllPermissions = (
    permissions: Record<string, Record<string, boolean>>,
    val: boolean
  ) =>
    Object.fromEntries(
      CRM_MODULES.map((mod) => [
        mod,
        Object.fromEntries(MODULE_ACTIONS.map((action) => [action, val])),
      ])
    );

  const handleCreate = () => {
    const role: Role = {
      id: `r${Date.now()}`,
      ...newRole,
      usersCount: 0,
      isSystem: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setRoles((prev) => [...prev, role]);
    setCreateOpen(false);
    setNewRole({ name: "", description: "", permissions: emptyPermissions });
  };

  const handleSaveEdit = () => {
    if (!editRole) return;
    setRoles((prev) =>
      prev.map((r) => (r.id === editRole.id ? editRole : r))
    );
    if (selectedRole.id === editRole.id) setSelectedRole(editRole);
    setEditRole(null);
  };

  const handleDeleteRole = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    if (selectedRole.id === id && roles.length > 1) {
      setSelectedRole(roles.find((r) => r.id !== id)!);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#9ca3af] mb-1">Roles</p>
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 pb-1">
              {roles.map((role) => (
                <RoleTabButton
                  key={role.id}
                  role={role}
                  isSelected={selectedRole?.id === role.id}
                  onClick={() => setSelectedRole(role)}
                  onEdit={() => setEditRole({ ...role })}
                  onDelete={() => handleDeleteRole(role.id)}
                />
              ))}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-[#4080f0] hover:bg-[#3070e0] text-white h-9 flex-shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={14} className="mr-1.5" />
          Create Role
        </Button>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-[#e5e7eb] overflow-hidden flex flex-col">
        {selectedRole ? (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-[#1c1e21]">{selectedRole.name}</h3>
                  {selectedRole.isSystem && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#9ca3af] bg-[#f5f5f5] px-1.5 py-0.5 rounded-full">
                      <Lock size={9} />
                      System Role
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9ca3af]">{selectedRole.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-[#6b7280] bg-[#f5f6fa] px-3 py-1.5 rounded-md">
                  <Users size={14} />
                  <span>{selectedRole.usersCount} users with this role</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-[#e5e7eb] text-sm"
                  onClick={() => setEditRole({ ...selectedRole })}
                >
                  <Edit size={13} className="mr-1.5" />
                  Edit Role
                </Button>
              </div>
            </div>
            <div className="overflow-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <PermissionsMatrix permissions={selectedRole.permissions} readOnly={true} />
            </div>
            <div className="px-5 py-3 border-t border-[#f0f2f7] bg-[#f9fafb] flex items-center gap-4 text-xs text-[#9ca3af]">
              <span className="flex items-center gap-1">
                <Check size={12} className="text-[#1a8a4a]" /> = Permission Granted
              </span>
              <span className="flex items-center gap-1">
                <X size={12} className="text-[#d1d5db]" /> = No Access
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#9ca3af]">
            Select a role to view permissions
          </div>
        )}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex w-[800px] max-w-[95vw] flex-col sm:!max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <Shield size={18} className="text-[#4080f0]" />
              Create New Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Role Name *</Label>
                <Input
                  placeholder="e.g. Regional Manager"
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole((f) => ({ ...f, name: e.target.value }))
                  }
                  className="h-9 border-[#e5e7eb]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Description</Label>
                <Input
                  placeholder="Brief description of this role"
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole((f) => ({ ...f, description: e.target.value }))
                  }
                  className="h-9 border-[#e5e7eb]"
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="text-xs text-[#6b7280]">
                  Permissions Matrix
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] normal-case text-[#4080f0] hover:text-[#3070e0]"
                  onClick={() =>
                    setNewRole((f) => ({
                      ...f,
                      permissions: applyAllPermissions(
                        f.permissions,
                        !CRM_MODULES.every((mod) =>
                          MODULE_ACTIONS.every(
                            (action) => f.permissions[mod]?.[action] ?? false
                          )
                        )
                      ),
                    }))
                  }
                >
                  {CRM_MODULES.every((mod) =>
                    MODULE_ACTIONS.every(
                      (action) => newRole.permissions[mod]?.[action] ?? false
                    )
                  )
                    ? "Clear all"
                    : "Select all"}
                </Button>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                <PermissionsMatrix
                  permissions={newRole.permissions}
                  onToggleModule={(mod, val) =>
                    setNewRole((f) => ({
                      ...f,
                      permissions: applyModulePermissions(f.permissions, mod, val),
                    }))
                  }
                  onChange={(mod, action, val) =>
                    setNewRole((f) => ({
                      ...f,
                      permissions: {
                        ...f.permissions,
                        [mod]: { ...f.permissions[mod], [action]: val },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              onClick={handleCreate}
              disabled={!newRole.name}
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      {editRole && (
        <Dialog open={!!editRole} onOpenChange={() => setEditRole(null)}>
          <DialogContent className="flex w-[800px] max-w-[95vw] flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
                <Edit size={18} className="text-[#4080f0]" />
                Edit Role: {editRole.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Role Name</Label>
                  <Input
                    value={editRole.name}
                    onChange={(e) =>
                      setEditRole((r) =>
                        r ? { ...r, name: e.target.value } : r
                      )
                    }
                    disabled={editRole.isSystem}
                    className="h-9 border-[#e5e7eb]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Description</Label>
                  <Input
                    value={editRole.description}
                    onChange={(e) =>
                      setEditRole((r) =>
                        r ? { ...r, description: e.target.value } : r
                      )
                    }
                    className="h-9 border-[#e5e7eb]"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#6b7280] mb-2 block">
                  Permissions
                </Label>
                <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                  <PermissionsMatrix
                    permissions={editRole.permissions}
                    readOnly={editRole.isSystem}
                    onChange={(mod, action, val) =>
                      setEditRole((r) =>
                        r
                          ? {
                              ...r,
                              permissions: {
                                ...r.permissions,
                                [mod]: {
                                  ...r.permissions[mod],
                                  [action]: val,
                                },
                              },
                            }
                          : r
                      )
                    }
                  />
                </div>
                {editRole.isSystem && (
                  <p className="text-xs text-[#9ca3af] mt-2 flex items-center gap-1">
                    <Lock size={11} />
                    System roles have fixed permissions and cannot be modified.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="border-[#e5e7eb]"
                onClick={() => setEditRole(null)}
              >
                Cancel
              </Button>
              {!editRole.isSystem && (
                <Button
                  size="sm"
                  className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


