"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Building2,
  Users,
  Edit,
  Trash2,
  Layers,
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
import { departments as initialDepts, type Department } from "@/data/userManagementData";

const BRANCHES = [
  "Addis Ababa HQ","Dire Dawa Branch","Hawassa Branch","Bahir Dar Branch",
];
const MANAGERS = [
  "Nahom Esrael","Sara Tesfaye","Meron Haile","Biruk Mekonnen","Daniel Bekele","Tigist Alemu","Hana Worku",
];

const deptIcons: Record<string, string> = {
  Sales: "💼",
  IT: "💻",
  Finance: "💰",
  Management: "🏛️",
  "Customer Support": "🎧",
};

export function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>(initialDepts);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  const [form, setForm] = useState({
    name: "",
    branch: "Addis Ababa HQ",
    head: "",
    description: "",
  });

  const filtered = departments.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.head.toLowerCase().includes(q);
    const matchBranch = filterBranch === "all" || d.branch === filterBranch;
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchBranch && matchStatus;
  });

  const handleCreate = () => {
    const dept: Department = {
      id: `d${Date.now()}`,
      ...form,
      usersCount: 0,
      teamsCount: 0,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setDepartments((prev) => [...prev, dept]);
    setCreateOpen(false);
    setForm({ name: "", branch: "Addis Ababa HQ", head: "", description: "" });
  };

  const handleSaveEdit = () => {
    if (!editDept) return;
    setDepartments((prev) => prev.map((d) => (d.id === editDept.id ? editDept : d)));
    setEditDept(null);
  };

  const handleDelete = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setDepartments((prev) =>
      prev.map((d) => d.id === id ? { ...d, status: d.status === "Active" ? "Inactive" : "Active" } : d)
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Departments", value: departments.length, color: "text-[#4080f0]", bg: "bg-[#eef2fd]" },
          { label: "Active", value: departments.filter((d) => d.status === "Active").length, color: "text-[#1a8a4a]", bg: "bg-[#e6f7ee]" },
          { label: "Total Users", value: departments.reduce((a, d) => a + d.usersCount, 0), color: "text-[#b07d00]", bg: "bg-[#fff8e6]" },
          { label: "Total Teams", value: departments.reduce((a, d) => a + d.teamsCount, 0), color: "text-[#9333ea]", bg: "bg-[#fdf4ff]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[#e5e7eb] px-4 py-3 flex items-center gap-3">
            <div className={`${s.bg} rounded-md p-2`}>
              <Layers size={16} className={s.color} />
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
            <Input placeholder="Search departments..." className="pl-9 h-9 bg-white border-[#e5e7eb] text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="h-9 w-full sm:w-[160px] bg-white border-[#e5e7eb] text-sm">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
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
          Add Department
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#e5e7eb] flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Head</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Users</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Teams</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Created</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((dept) => (
              <tr key={dept.id} className="border-b border-[#f0f2f7] hover:bg-[#fafbff] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f0f2f7] flex items-center justify-center text-base">
                      {deptIcons[dept.name] || "🏢"}
                    </div>
                    <div>
                      <p className="font-medium text-[#1c1e21]">{dept.name}</p>
                      <p className="text-xs text-[#9ca3af] line-clamp-1">{dept.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[#4b5563] text-sm">{dept.branch}</td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-medium text-[#4080f0]">{dept.head}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-sm text-[#4b5563]">
                    <Users size={13} className="text-[#9ca3af]" />
                    {dept.usersCount}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-sm text-[#4b5563]">
                    <Building2 size={13} className="text-[#9ca3af]" />
                    {dept.teamsCount}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    dept.status === "Active"
                      ? "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]"
                      : "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]"
                  }`}>
                    {dept.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#9ca3af]">{dept.createdAt}</td>
                <td className="px-4 py-3.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#f0f2f7]">
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => setEditDept({ ...dept })}>
                        <Edit size={12} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => handleToggleStatus(dept.id)}>
                        {dept.status === "Active" ? (
                          <><XCircle size={12} className="mr-2 text-[#dc2626]" /> Deactivate</>
                        ) : (
                          <><CheckCircle size={12} className="mr-2 text-[#1a8a4a]" /> Activate</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-sm cursor-pointer text-[#dc2626]" onClick={() => handleDelete(dept.id)}>
                        <Trash2 size={12} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#9ca3af]">
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
              <Layers size={18} className="text-[#4080f0]" />
              Add Department
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Department Name *</Label>
              <Input placeholder="e.g. Marketing" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9 border-[#e5e7eb]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b7280]">Description</Label>
              <Input placeholder="Brief description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-9 border-[#e5e7eb]" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Branch</Label>
                <Select value={form.branch} onValueChange={(v) => setForm((f) => ({ ...f, branch: v }))}>
                  <SelectTrigger className="h-9 border-[#e5e7eb]"><SelectValue /></SelectTrigger>
                  <SelectContent>{BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Department Head</Label>
                <Select value={form.head} onValueChange={(v) => setForm((f) => ({ ...f, head: v }))}>
                  <SelectTrigger className="h-9 border-[#e5e7eb]"><SelectValue placeholder="Select head" /></SelectTrigger>
                  <SelectContent>{MANAGERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" className="border-[#e5e7eb]" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-[#4080f0] hover:bg-[#3070e0] text-white" onClick={handleCreate} disabled={!form.name}>Add Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editDept && (
        <Dialog open={!!editDept} onOpenChange={() => setEditDept(null)}>
          <DialogContent className="max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#1c1e21]">
                <Edit size={18} className="text-[#4080f0]" />
                Edit Department
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Department Name</Label>
                <Input value={editDept.name} onChange={(e) => setEditDept((d) => d ? { ...d, name: e.target.value } : d)} className="h-9 border-[#e5e7eb]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b7280]">Description</Label>
                <Input value={editDept.description} onChange={(e) => setEditDept((d) => d ? { ...d, description: e.target.value } : d)} className="h-9 border-[#e5e7eb]" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Branch</Label>
                  <Select value={editDept.branch} onValueChange={(v) => setEditDept((d) => d ? { ...d, branch: v } : d)}>
                    <SelectTrigger className="h-9 border-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent>{BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#6b7280]">Department Head</Label>
                  <Select value={editDept.head} onValueChange={(v) => setEditDept((d) => d ? { ...d, head: v } : d)}>
                    <SelectTrigger className="h-9 border-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent>{MANAGERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button variant="outline" size="sm" className="border-[#e5e7eb]" onClick={() => setEditDept(null)}>Cancel</Button>
              <Button size="sm" className="bg-[#4080f0] hover:bg-[#3070e0] text-white" onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


