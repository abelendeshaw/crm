"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Users,
  Edit,
  Trash2,
  MapPin,
  ArrowLeft,
  UserPlus,
  ArrowRightLeft,
  Crown,
  UserMinus,
  Calendar,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  teams as initialTeams,
  users as initialUsers,
  type Team,
  type CRMUser,
} from "@/data/userManagementData";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Sales",
  "IT",
  "Finance",
  "Customer Support",
  "Management",
];
const BRANCHES = [
  "Addis Ababa HQ",
  "Dire Dawa Branch",
  "Hawassa Branch",
  "Bahir Dar Branch",
];

const deptColors: Record<string, string> = {
  Sales: "bg-[#eef2fd] text-[#4080f0]",
  IT: "bg-[#f0fdf4] text-[#166534]",
  Finance: "bg-[#fff8e6] text-[#b07d00]",
  "Customer Support": "bg-[#fdf4ff] text-[#9333ea]",
  Management: "bg-[#fef2f2] text-[#dc2626]",
};

const statusColors: Record<string, string> = {
  Active: "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]",
  Inactive: "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]",
  Pending: "bg-[#fff8e6] text-[#b07d00] border border-[#fcd34d]",
  Suspended: "bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5]",
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

// ─── TeamCard (list view) ─────────────────────────────────────────────────────
function TeamCard({
  team,
  onView,
  onEdit,
  onDelete,
}: {
  team: Team;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="self-start bg-white rounded-lg border border-[#e5e7eb] p-3.5 hover:border-[#bfcffa] hover:shadow-sm transition-all cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-[#1c1e21] text-sm">
              {team.name}
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                deptColors[team.department] || "bg-[#f5f5f5] text-[#6b7280]"
              }`}
            >
              {team.department}
            </span>
          </div>
          <p className="text-xs text-[#9ca3af] line-clamp-1">
            {team.description}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-[#f0f2f7] flex-shrink-0 ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-sm cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <Users size={12} className="mr-2" /> View Team
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-sm cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit size={12} className="mr-2" /> Edit Team
            </DropdownMenuItem>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5 mb-2.5 text-xs text-[#6b7280]">
        <MapPin size={11} />
        <span>{team.branch}</span>
      </div>

      <div className="flex items-center gap-2.5 mb-3">
        <div className="text-center">
          <p className="font-semibold text-[#1c1e21]">{team.membersCount}</p>
          <p className="text-xs text-[#9ca3af]">Members</p>
        </div>
        <div className="h-8 w-px bg-[#e5e7eb]" />
        <div>
          <p className="text-xs text-[#9ca3af]">Manager</p>
          <p className="font-medium text-[#1c1e21] text-sm">{team.manager}</p>
        </div>
      </div>

      <div className="flex items-center -space-x-2">
        {team.members.slice(0, 5).map((member, idx) => (
          <Avatar key={idx} className="h-7 w-7 border-2 border-white">
            <AvatarFallback
              className={`${getAvatarColor(member)} text-white text-[10px] font-medium`}
            >
              {getInitials(member)}
            </AvatarFallback>
          </Avatar>
        ))}
        {team.membersCount > 5 && (
          <div className="h-7 w-7 rounded-full bg-[#f0f2f7] border-2 border-white flex items-center justify-center text-[10px] text-[#6b7280] font-medium">
            +{team.membersCount - 5}
          </div>
        )}
        {team.membersCount === 0 && (
          <span className="text-xs text-[#9ca3af]">No members yet</span>
        )}
      </div>
    </div>
  );
}

// ─── TeamDetailView ────────────────────────────────────────────────────────────
function TeamDetailView({
  team,
  allTeams,
  allUsers,
  onBack,
  onUpdateTeam,
  onDeleteTeam,
  onTransferMember,
}: {
  team: Team;
  allTeams: Team[];
  allUsers: CRMUser[];
  onBack: () => void;
  onUpdateTeam: (updated: Team) => void;
  onDeleteTeam: (id: string) => void;
  onTransferMember: (memberName: string, fromTeamId: string, toTeamId: string) => void;
}) {
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showChangeManager, setShowChangeManager] = useState(false);
  const [transferMemberName, setTransferMemberName] = useState("");
  const [transferTargetId, setTransferTargetId] = useState("");
  const [addMemberName, setAddMemberName] = useState("");
  const [newManagerName, setNewManagerName] = useState(team.manager);
  const [editForm, setEditForm] = useState({
    name: team.name,
    description: team.description,
    department: team.department,
    branch: team.branch,
  });

  // Users already in this team
  const memberObjects = team.members.map(
    (name) =>
      allUsers.find((u) => u.name === name) || {
        id: name,
        name,
        role: "—",
        status: "Active" as const,
        email: "",
        phone: "",
        department: "",
        branch: "",
        team: team.name,
        manager: "",
        joinedAt: "",
        lastActive: "",
      }
  );

  // Users NOT in this team (available to add)
  const availableUsers = allUsers.filter(
    (u) => !team.members.includes(u.name)
  );

  // Other teams (for transfer)
  const otherTeams = allTeams.filter((t) => t.id !== team.id);

  const handleSaveEdit = () => {
    onUpdateTeam({ ...team, ...editForm });
    setShowEditTeam(false);
  };

  const handleAddMember = () => {
    if (!addMemberName) return;
    onUpdateTeam({
      ...team,
      members: [...team.members, addMemberName],
      membersCount: team.membersCount + 1,
    });
    setAddMemberName("");
    setShowAddMember(false);
  };

  const handleRemoveMember = (name: string) => {
    onUpdateTeam({
      ...team,
      members: team.members.filter((m) => m !== name),
      membersCount: team.membersCount - 1,
      // Clear manager if removed
      manager: team.manager === name ? "—" : team.manager,
    });
  };

  const handleTransfer = () => {
    if (!transferMemberName || !transferTargetId) return;
    onTransferMember(transferMemberName, team.id, transferTargetId);
    setShowTransfer(false);
    setTransferMemberName("");
    setTransferTargetId("");
  };

  const handleChangeManager = () => {
    onUpdateTeam({ ...team, manager: newManagerName });
    setShowChangeManager(false);
  };

  const managerUser = allUsers.find((u) => u.name === team.manager);

  return (
    <div className="flex flex-col h-full -m-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[#6b7280] hover:text-[#1c1e21] -ml-2 h-8"
            onClick={onBack}
          >
            <ArrowLeft size={14} />
            All Teams
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-[#e5e7eb] gap-1.5"
              onClick={() => setShowEditTeam(true)}
            >
              <Edit size={13} />
              Edit Team
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-[#fca5a5] text-[#dc2626] hover:bg-[#fef2f2] gap-1.5"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={13} />
              Delete
            </Button>
          </div>
        </div>

        {/* Team hero */}
        <div className="flex items-center gap-4 mt-4">
          <div className="w-12 h-12 rounded-xl bg-[#eef2fd] flex items-center justify-center flex-shrink-0">
            <Users size={22} className="text-[#4080f0]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-semibold text-[#1c1e21]">{team.name}</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  deptColors[team.department] || "bg-[#f5f5f5] text-[#6b7280]"
                }`}
              >
                {team.department}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {team.branch}
              </span>
              <span className="flex items-center gap-1">
                <Users size={11} />
                {team.membersCount} members
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                Created {team.createdAt}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fb] space-y-5">
        {/* Description */}
        {team.description && (
          <div className="bg-white rounded-lg border border-[#e5e7eb] px-4 py-3">
            <p className="text-sm text-[#4b5563]">{team.description}</p>
          </div>
        )}

        {/* Manager Section */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f2f7]">
            <div className="flex items-center gap-2">
              <Crown size={14} className="text-[#f59e0b]" />
              <h3 className="font-medium text-[#1c1e21] text-sm">
                Team Manager
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-[#e5e7eb]"
              onClick={() => {
                setNewManagerName(team.manager);
                setShowChangeManager(true);
              }}
            >
              Change Manager
            </Button>
          </div>
          <div className="px-4 py-4">
            {managerUser ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className={`${getAvatarColor(managerUser.name)} text-white text-xs font-medium`}
                  >
                    {getInitials(managerUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#1c1e21]">
                    {managerUser.name}
                  </p>
                  <p className="text-xs text-[#9ca3af]">
                    {managerUser.role} · {managerUser.department}
                  </p>
                </div>
                <span
                  className={cn(
                    "ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    statusColors[managerUser.status] || ""
                  )}
                >
                  {managerUser.status}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f0f2f7] flex items-center justify-center">
                  <Crown size={16} className="text-[#9ca3af]" />
                </div>
                <div>
                  <p className="font-medium text-[#1c1e21]">
                    {team.manager === "—" ? "No manager assigned" : team.manager}
                  </p>
                  <p className="text-xs text-[#9ca3af]">
                    Click &quot;Change Manager&quot; to assign one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f2f7]">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#4080f0]" />
              <h3 className="font-medium text-[#1c1e21] text-sm">
                Members
              </h3>
              <span className="text-xs bg-[#eef2fd] text-[#4080f0] px-1.5 py-0.5 rounded-full font-medium">
                {team.membersCount}
              </span>
            </div>
            <Button
              size="sm"
              className="h-7 bg-[#4080f0] hover:bg-[#3070e0] text-white text-xs gap-1.5"
              onClick={() => {
                setAddMemberName("");
                setShowAddMember(true);
              }}
            >
              <UserPlus size={12} />
              Add Member
            </Button>
          </div>

          {memberObjects.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Users size={28} className="text-[#d1d5db] mx-auto mb-2" />
              <p className="text-sm text-[#9ca3af]">No members yet.</p>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                Click &quot;Add Member&quot; to start building the team.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                    Member
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                    Role
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                    Type
                  </th>
                  <th className="w-24 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {memberObjects.map((member) => (
                  <tr
                    key={member.id || member.name}
                    className="border-b border-[#f0f2f7] last:border-0 hover:bg-[#fafbff] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={`${getAvatarColor(member.name)} text-white text-xs font-medium`}
                          >
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[#1c1e21]">
                            {member.name}
                          </p>
                          <p className="text-xs text-[#9ca3af]">
                            {member.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4b5563] text-sm">
                      {member.role}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          statusColors[member.status] || ""
                        )}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {team.manager === member.name ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b]">
                          <Crown size={11} />
                          Manager
                        </span>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">Member</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#6b7280] hover:text-[#4080f0] hover:bg-[#eef2fd] gap-1"
                          onClick={() => {
                            setTransferMemberName(member.name);
                            setTransferTargetId("");
                            setShowTransfer(true);
                          }}
                        >
                          <ArrowRightLeft size={12} />
                          Transfer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#dc2626] hover:bg-[#fef2f2] gap-1"
                          onClick={() => handleRemoveMember(member.name)}
                        >
                          <UserMinus size={12} />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Edit Team */}
      <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <Edit size={16} className="text-[#4080f0]" />
              Edit Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Team Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
                placeholder="Brief description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Department</Label>
                <Select
                  value={editForm.department}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, department: v }))
                  }
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Branch</Label>
                <Select
                  value={editForm.branch}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, branch: v }))
                  }
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
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => setShowEditTeam(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              onClick={handleSaveEdit}
              disabled={!editForm.name}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Manager */}
      <Dialog open={showChangeManager} onOpenChange={setShowChangeManager}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <Crown size={16} className="text-[#f59e0b]" />
              Assign Team Manager
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-[#6b7280]">
              Select a user to be the manager of{" "}
              <span className="font-medium text-[#1c1e21]">{team.name}</span>.
              The manager can be any user in the system.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Select Manager</Label>
              <Select
                value={newManagerName}
                onValueChange={setNewManagerName}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="—">No Manager</SelectItem>
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.name}>
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        <span className="text-[#9ca3af]">· {u.role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => setShowChangeManager(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              onClick={handleChangeManager}
            >
              Assign Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <UserPlus size={16} className="text-[#4080f0]" />
              Add Member to {team.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-[#6b7280]">
              Select a user to add to this team. Only users not currently in
              this team are shown.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Select User</Label>
              <Select
                value={addMemberName}
                onValueChange={setAddMemberName}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Choose a user to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-[#9ca3af]">
                      All users are already in this team.
                    </div>
                  ) : (
                    availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className="text-[#9ca3af]">· {u.role}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => setShowAddMember(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              onClick={handleAddMember}
              disabled={!addMemberName}
            >
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Member */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <ArrowRightLeft size={16} className="text-[#4080f0]" />
              Transfer Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="bg-[#f9fafb] rounded-lg border border-[#e5e7eb] p-3 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback
                  className={`${getAvatarColor(transferMemberName)} text-white text-xs font-medium`}
                >
                  {getInitials(transferMemberName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-[#1c1e21] text-sm">
                  {transferMemberName}
                </p>
                <p className="text-xs text-[#9ca3af]">
                  Currently in {team.name}
                </p>
              </div>
              <ChevronRight size={16} className="ml-auto text-[#d1d5db]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Transfer To Team</Label>
              <Select
                value={transferTargetId}
                onValueChange={setTransferTargetId}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Select target team" />
                </SelectTrigger>
                <SelectContent>
                  {otherTeams.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-[#9ca3af]">
                      No other teams available.
                    </div>
                  ) : (
                    otherTeams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}{" "}
                        <span className="text-[#9ca3af]">· {t.department}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-[#9ca3af]">
              The user will be removed from{" "}
              <span className="font-medium">{team.name}</span> and added to the
              selected team.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => setShowTransfer(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white gap-1.5"
              onClick={handleTransfer}
              disabled={!transferTargetId}
            >
              <ArrowRightLeft size={13} />
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <AlertTriangle size={16} className="text-[#dc2626]" />
              Delete Team
            </DialogTitle>
          </DialogHeader>
          <div className="py-1 space-y-2">
            <p className="text-sm text-[#4b5563]">
              Are you sure you want to delete{" "}
              <span className="font-medium text-[#1c1e21]">{team.name}</span>?
              This action cannot be undone.
            </p>
            {team.membersCount > 0 && (
              <div className="bg-[#fff8e6] border border-[#fcd34d] rounded-lg p-3 flex items-start gap-2 text-sm text-[#b07d00]">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  This team has {team.membersCount} member
                  {team.membersCount > 1 ? "s" : ""}. They will no longer have
                  a team assignment.
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-[#e5e7eb]"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white gap-1.5"
              onClick={() => {
                onDeleteTeam(team.id);
                setShowDeleteConfirm(false);
              }}
            >
              <Trash2 size={13} />
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main TeamsTab ─────────────────────────────────────────────────────────────
export function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [users] = useState<CRMUser[]>(initialUsers);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);

  const [form, setForm] = useState({
    name: "",
    department: "Sales",
    branch: "Addis Ababa HQ",
    manager: "",
    description: "",
  });

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || null;

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.manager.toLowerCase().includes(q);
    const matchDept = filterDept === "all" || t.department === filterDept;
    const matchBranch = filterBranch === "all" || t.branch === filterBranch;
    return matchSearch && matchDept && matchBranch;
  });

  const handleUpdateTeam = (updated: Team) => {
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTeamId(updated.id);
  };

  const handleTransferMember = (
    memberName: string,
    fromTeamId: string,
    toTeamId: string
  ) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === fromTeamId) {
          const isManager = t.manager === memberName;
          return {
            ...t,
            members: t.members.filter((m) => m !== memberName),
            membersCount: t.membersCount - 1,
            manager: isManager ? "—" : t.manager,
          };
        }
        if (t.id === toTeamId) {
          if (t.members.includes(memberName)) return t;
          return {
            ...t,
            members: [...t.members, memberName],
            membersCount: t.membersCount + 1,
          };
        }
        return t;
      })
    );
  };

  // Wrap onUpdateTeam to also handle transfer side effects
  const handleTeamDetailUpdate = (updated: Team) => {
    // Check if a member was transferred (simplified: just update the team)
    handleUpdateTeam(updated);
  };

  const handleDeleteTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
    setViewMode("list");
    setSelectedTeamId(null);
  };

  const handleCreate = () => {
    const team: Team = {
      id: `t${Date.now()}`,
      ...form,
      membersCount: 0,
      members: [],
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTeams((prev) => [...prev, team]);
    setCreateOpen(false);
    setForm({
      name: "",
      department: "Sales",
      branch: "Addis Ababa HQ",
      manager: "",
      description: "",
    });
  };

  const handleSaveEdit = () => {
    if (!editTeam) return;
    setTeams((prev) =>
      prev.map((t) => (t.id === editTeam.id ? editTeam : t))
    );
    setEditTeam(null);
  };

  const handleDeleteFromList = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Detail view ──────────────────────────────────────────────────────────
  if (viewMode === "detail" && selectedTeam) {
    return (
      <TeamDetailView
        team={selectedTeam}
        allTeams={teams}
        allUsers={users}
        onBack={() => {
          setViewMode("list");
          setSelectedTeamId(null);
        }}
        onUpdateTeam={handleTeamDetailUpdate}
        onDeleteTeam={handleDeleteTeam}
        onTransferMember={handleTransferMember}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Total Teams",
            value: teams.length,
            color: "text-[#4080f0]",
            bg: "bg-[#eef2fd]",
          },
          {
            label: "Total Members",
            value: teams.reduce((a, t) => a + t.membersCount, 0),
            color: "text-[#1a8a4a]",
            bg: "bg-[#e6f7ee]",
          },
          {
            label: "Departments",
            value: [...new Set(teams.map((t) => t.department))].length,
            color: "text-[#b07d00]",
            bg: "bg-[#fff8e6]",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-[#e5e7eb] px-4 py-3 flex items-center gap-3"
          >
            <div className={`${s.bg} rounded-md p-2`}>
              <Users size={16} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">{s.label}</p>
              <p className={`font-semibold text-lg ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-[220px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            />
            <Input
              placeholder="Search teams..."
              className="pl-9 h-9 bg-white border-[#e5e7eb] text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="h-9 w-full sm:w-[150px] bg-white border-[#e5e7eb] text-sm">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="h-9 w-full sm:w-[160px] bg-white border-[#e5e7eb] text-sm">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {BRANCHES.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="h-9 bg-[#4080f0] hover:bg-[#3070e0] text-white text-sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={14} className="mr-1.5" />
          Create Team
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 items-start gap-4 overflow-y-auto flex-1 pb-2 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onView={() => {
              setSelectedTeamId(team.id);
              setViewMode("detail");
            }}
            onEdit={() => setEditTeam({ ...team })}
            onDelete={() => handleDeleteFromList(team.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex items-center justify-center py-16 text-[#9ca3af]">
            No teams found.
          </div>
        )}
      </div>

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <Users size={18} className="text-[#4080f0]" />
              Create New Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Team Name *</Label>
              <Input
                placeholder="e.g. Sales Team E"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Description</Label>
              <Input
                placeholder="Brief description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="h-9 border-[#e5e7eb]"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, department: v }))
                  }
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Branch</Label>
                <Select
                  value={form.branch}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, branch: v }))
                  }
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
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">
                Team Manager (optional)
              </Label>
              <Select
                value={form.manager}
                onValueChange={(v) => setForm((f) => ({ ...f, manager: v }))}
              >
                <SelectTrigger className="h-9 border-[#e5e7eb]">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="—">No Manager</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.name}>
                      {u.name}{" "}
                      <span className="text-[#9ca3af]">· {u.role}</span>
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
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
              onClick={handleCreate}
              disabled={!form.name}
            >
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      {editTeam && (
        <Dialog open={!!editTeam} onOpenChange={() => setEditTeam(null)}>
          <DialogContent className="max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
                <Edit size={18} className="text-[#4080f0]" />
                Edit Team
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Team Name</Label>
                <Input
                  value={editTeam.name}
                  onChange={(e) =>
                    setEditTeam((t) =>
                      t ? { ...t, name: e.target.value } : t
                    )
                  }
                  className="h-9 border-[#e5e7eb]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Description</Label>
                <Input
                  value={editTeam.description}
                  onChange={(e) =>
                    setEditTeam((t) =>
                      t ? { ...t, description: e.target.value } : t
                    )
                  }
                  className="h-9 border-[#e5e7eb]"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Department</Label>
                  <Select
                    value={editTeam.department}
                    onValueChange={(v) =>
                      setEditTeam((t) =>
                        t ? { ...t, department: v } : t
                      )
                    }
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
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Branch</Label>
                  <Select
                    value={editTeam.branch}
                    onValueChange={(v) =>
                      setEditTeam((t) => (t ? { ...t, branch: v } : t))
                    }
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
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Manager</Label>
                <Select
                  value={editTeam.manager}
                  onValueChange={(v) =>
                    setEditTeam((t) => (t ? { ...t, manager: v } : t))
                  }
                >
                  <SelectTrigger className="h-9 border-[#e5e7eb]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="—">No Manager</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        {u.name}{" "}
                        <span className="text-[#9ca3af]">· {u.role}</span>
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
                onClick={() => setEditTeam(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#4080f0] hover:bg-[#3070e0] text-white"
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

