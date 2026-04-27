"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  Building2,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { branches as initialBranches, type Branch } from "@/data/userManagementData";

const MANAGERS = [
  "Nahom Esrael","Sara Tesfaye","Meron Haile","Biruk Mekonnen","Daniel Bekele","Yonas Tadesse",
];

function BranchCard({
  branch,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  branch: Branch;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const isActive = branch.status === "Active";
  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] p-5 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#eef2fd] flex items-center justify-center">
            <Building2 size={18} className="text-[#4080f0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-[#1c1e21] text-sm">{branch.name}</h4>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isActive
                    ? "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]"
                    : "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]"
                }`}
              >
                {branch.status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#9ca3af] mt-0.5">
              <MapPin size={10} />
              <span>{branch.location}</span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#f0f2f7]">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="text-sm cursor-pointer" onClick={onEdit}>
              <Edit size={12} className="mr-2" /> Edit Branch
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm cursor-pointer" onClick={onToggleStatus}>
              {isActive ? (
                <><XCircle size={12} className="mr-2 text-[#dc2626]" /> Deactivate</>
              ) : (
                <><CheckCircle size={12} className="mr-2 text-[#1a8a4a]" /> Activate</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm cursor-pointer text-[#dc2626]" onClick={onDelete}>
              <Trash2 size={12} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
          <Phone size={11} />
          <span>{branch.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
          <Mail size={11} />
          <span className="truncate">{branch.email}</span>
        </div>
      </div>

      <div className="border-t border-[#f0f2f7] pt-3 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="font-semibold text-[#1c1e21] text-sm">{branch.usersCount}</p>
          <p className="text-[10px] text-[#9ca3af]">Users</p>
        </div>
        <div className="text-center border-x border-[#f0f2f7]">
          <p className="font-semibold text-[#1c1e21] text-sm">{branch.departmentsCount}</p>
          <p className="text-[10px] text-[#9ca3af]">Departments</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-[#4080f0] text-xs truncate">{branch.manager}</p>
          <p className="text-[10px] text-[#9ca3af]">Manager</p>
        </div>
      </div>
    </div>
  );
}

export function BranchesTab() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    manager: "",
    phone: "",
    email: "",
  });

  const filtered = branches.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    const branch: Branch = {
      id: `b${Date.now()}`,
      ...form,
      departmentsCount: 0,
      usersCount: 0,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setBranches((prev) => [...prev, branch]);
    setCreateOpen(false);
    setForm({ name: "", location: "", manager: "", phone: "", email: "" });
  };

  const handleSaveEdit = () => {
    if (!editBranch) return;
    setBranches((prev) => prev.map((b) => (b.id === editBranch.id ? editBranch : b)));
    setEditBranch(null);
  };

  const handleDelete = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: b.status === "Active" ? "Inactive" : "Active" } : b
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="grid grid-cols-1 gap- mb-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Branches", value: branches.length, color: "text-[#4080f0]", bg: "bg-[#eef2fd]" },
          { label: "Active", value: branches.filter((b) => b.status === "Active").length, color: "text-[#1a8a4a]", bg: "bg-[#e6f7ee]" },
          { label: "Inactive", value: branches.filter((b) => b.status === "Inactive").length, color: "text-[#6b7280]", bg: "bg-[#f5f5f5]" },
          { label: "Total Users", value: branches.reduce((a, b) => a + b.usersCount, 0), color: "text-[#b07d00]", bg: "bg-[#fff8e6]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[#e5e7eb] px-4 py-3 flex items-center gap-3">
            <div className={`${s.bg} rounded-md p-2`}>
              <Building2 size={16} className={s.color} />
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <Input placeholder="Search branches..." className="pl-9 h-9 bg-white border-[#e5e7eb] text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-full sm:w-[130px] bg-white border-[#e5e7eb] text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-9 bg-[#4080f0] hover:bg-[#3070e0] text-white text-sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          Add Branch
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto flex-1 pb-2 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onEdit={() => setEditBranch({ ...branch })}
            onDelete={() => handleDelete(branch.id)}
            onToggleStatus={() => handleToggleStatus(branch.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex items-center justify-center py-16 text-[#9ca3af]">
            No branches found.
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <Building2 size={18} className="text-[#4080f0]" />
              Add New Branch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Branch Name *</Label>
              <Input placeholder="e.g. Jimma Branch" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9 border-[#e5e7eb]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Location *</Label>
              <Input placeholder="e.g. Jimma, Oromia" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="h-9 border-[#e5e7eb]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Branch Manager</Label>
              <Select value={form.manager} onValueChange={(v) => setForm((f) => ({ ...f, manager: v }))}>
                <SelectTrigger className="h-9 border-[#e5e7eb]"><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>{MANAGERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Phone</Label>
                <Input placeholder="0xxxxxxxxx" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="h-9 border-[#e5e7eb]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Email</Label>
                <Input type="email" placeholder="branch@company.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="h-9 border-[#e5e7eb]" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" className="border-[#e5e7eb]" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-[#4080f0] hover:bg-[#3070e0] text-white" onClick={handleCreate} disabled={!form.name || !form.location}>Add Branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editBranch && (
        <Dialog open={!!editBranch} onOpenChange={() => setEditBranch(null)}>
          <DialogContent className="max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
                <Edit size={18} className="text-[#4080f0]" />
                Edit Branch
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Branch Name</Label>
                <Input value={editBranch.name} onChange={(e) => setEditBranch((b) => b ? { ...b, name: e.target.value } : b)} className="h-9 border-[#e5e7eb]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Location</Label>
                <Input value={editBranch.location} onChange={(e) => setEditBranch((b) => b ? { ...b, location: e.target.value } : b)} className="h-9 border-[#e5e7eb]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Branch Manager</Label>
                <Select value={editBranch.manager} onValueChange={(v) => setEditBranch((b) => b ? { ...b, manager: v } : b)}>
                  <SelectTrigger className="h-9 border-[#e5e7eb]"><SelectValue /></SelectTrigger>
                  <SelectContent>{MANAGERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Phone</Label>
                  <Input value={editBranch.phone} onChange={(e) => setEditBranch((b) => b ? { ...b, phone: e.target.value } : b)} className="h-9 border-[#e5e7eb]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Email</Label>
                  <Input value={editBranch.email} onChange={(e) => setEditBranch((b) => b ? { ...b, email: e.target.value } : b)} className="h-9 border-[#e5e7eb]" />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button variant="outline" size="sm" className="border-[#e5e7eb]" onClick={() => setEditBranch(null)}>Cancel</Button>
              <Button size="sm" className="bg-[#4080f0] hover:bg-[#3070e0] text-white" onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


