"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Filter,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { users } from "@/lib/user-management-data";

type Role = {
  id: string;
  name: string;
  scope: string;
  description: string;
  users: number;
};

type Team = {
  id: string;
  name: string;
  branch: string;
  manager: string;
  users: number;
};

const initialRoles: Role[] = [
  { id: "r1", name: "Super Admin", scope: "Global", description: "Full product and security control.", users: 2 },
  { id: "r2", name: "CRM Admin", scope: "Global", description: "Administers users, pipelines and settings.", users: 6 },
  { id: "r3", name: "Branch Manager", scope: "Branch", description: "Manages branch users and deals.", users: 12 },
  { id: "r4", name: "Sales Agent", scope: "Self + Team", description: "Manages own pipeline and activities.", users: 64 },
];

const initialTeams: Team[] = [
  { id: "t1", name: "Enterprise Sales", branch: "Addis HQ", manager: "Nahom Esrael", users: 18 },
  { id: "t2", name: "SMB Sales", branch: "Mekelle", manager: "Tigist Ayele", users: 14 },
  { id: "t3", name: "East Region", branch: "Dire Dawa", manager: "Robel Solomon", users: 11 },
];

const allPermissions = [
  "users.create",
  "users.update",
  "users.transfer",
  "users.status_change",
  "roles.manage",
  "roles.assign",
  "deals.view_all",
  "deals.reassign_branch",
  "reports.export",
];

const rolePermissions: Record<string, string[]> = {
  r1: allPermissions,
  r2: ["users.create", "users.update", "users.transfer", "roles.assign", "deals.view_all", "reports.export"],
  r3: ["users.transfer", "users.status_change", "deals.view_all", "deals.reassign_branch"],
  r4: ["deals.reassign_branch"],
};

const permissionGroups = [
  { title: "User Access", keys: ["users.create", "users.update", "users.transfer", "users.status_change"] },
  { title: "Role Management", keys: ["roles.manage", "roles.assign"] },
  { title: "CRM Data", keys: ["deals.view_all", "deals.reassign_branch", "reports.export"] },
];

function statusBadge(status: string) {
  if (status === "active") return <Badge>Active</Badge>;
  if (status === "pending") return <Badge variant="secondary">Pending Invite</Badge>;
  return <Badge variant="destructive">Suspended</Badge>;
}

export default function Home() {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoles[1].id);
  const [teams, setTeams] = useState(initialTeams);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);
  const [deleteTeamOpen, setDeleteTeamOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const textMatch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const roleMatch = roleFilter === "all" || user.role === roleFilter;
      const branchMatch = branchFilter === "all" || user.branch === branchFilter;
      return textMatch && roleMatch && branchMatch;
    });
  }, [search, roleFilter, branchFilter]);

  const pendingInvites = users.filter((user) => user.status === "pending").length;
  const mfaCoverage = Math.round((users.filter((user) => user.mfa).length / users.length) * 100);
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const selectedRolePermissions = rolePermissions[selectedRole.id] ?? [];

  function deleteRole(roleId: string) {
    const role = roles.find((item) => item.id === roleId);
    const roleInUse = users.some((user) => user.role === role?.name);
    if (roleInUse) {
      setRiskOpen(true);
      return;
    }
    setRoles((prev) => prev.filter((item) => item.id !== roleId));
  }

  function confirmDeleteTeam() {
    if (!teamToDelete) return;
    if (teamToDelete.users > 0) {
      setRiskOpen(true);
      setDeleteTeamOpen(false);
      return;
    }
    setTeams((prev) => prev.filter((team) => team.id !== teamToDelete.id));
    setDeleteTeamOpen(false);
    setTeamToDelete(null);
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-[250px_1fr]">
        <aside className="border-r bg-card">
          <div className="flex h-16 items-center border-b px-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="text-primary" />
              CRM
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4 text-sm">
            <Button variant="ghost" className="justify-start"><LayoutDashboard data-icon="inline-start" />Dashboard</Button>
            <Button variant="ghost" className="justify-start"><Users data-icon="inline-start" />Leads</Button>
            <Button variant="ghost" className="justify-start"><ShieldCheck data-icon="inline-start" />Deals</Button>
            <Button variant="ghost" className="justify-start"><MapPin data-icon="inline-start" />Activity</Button>
            <Button variant="secondary" className="justify-start"><Settings data-icon="inline-start" />Settings</Button>
            <div className="ml-9 mt-1 flex flex-col gap-1 border-l pl-3">
              <Button variant="ghost" size="sm" className="justify-start">General</Button>
              <Button variant="secondary" size="sm" className="justify-start">User Management</Button>
              <Button variant="ghost" size="sm" className="justify-start">Integrations</Button>
            </div>
          </nav>
        </aside>

        <main className="flex flex-col gap-4 p-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage CRM access, roles, teams, branches, departments, and permissions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline"><Filter data-icon="inline-start" />Filter</Button>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild><Button><UserCog data-icon="inline-start" />Invite User</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite CRM User</DialogTitle>
                    <DialogDescription>Assign role, manager, team, and branch before sending invite.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <Input placeholder="Full name" />
                    <Input placeholder="Work email" type="email" />
                    <Select>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crm-admin">CRM Admin</SelectItem>
                        <SelectItem value="branch-manager">Branch Manager</SelectItem>
                        <SelectItem value="team-lead">Team Lead</SelectItem>
                        <SelectItem value="sales-agent">Sales Agent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Optional onboarding notes" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                    <Button onClick={() => setInviteOpen(false)}>Send Invite</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <div className="grid gap-3 md:grid-cols-4">
            <Card><CardHeader><CardDescription>Total Users</CardDescription><CardTitle>{users.length}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Pending Invites</CardDescription><CardTitle>{pendingInvites}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Roles</CardDescription><CardTitle>{roles.length}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>MFA Coverage</CardDescription><CardTitle>{mfaCoverage}%</CardTitle></CardHeader></Card>
          </div>

          <Tabs defaultValue="users" className="flex flex-col gap-4">
            <TabsList className="w-fit">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
              <TabsTrigger value="org">Teams & Structure</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="m-0">
              <Card id="users">
                <CardHeader>
                  <CardTitle>CRM Users</CardTitle>
                  <CardDescription>Table view only. Open the dedicated details page to edit profile and run user actions.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input className="pl-8" placeholder="Search users by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        {roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Branch" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All branches</SelectItem>
                        <SelectItem value="Addis HQ">Addis HQ</SelectItem>
                        <SelectItem value="Dire Dawa">Dire Dawa</SelectItem>
                        <SelectItem value="Mekelle">Mekelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><Checkbox /></TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell><Checkbox /></TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>{user.team}</TableCell>
                          <TableCell>{user.branch}</TableCell>
                          <TableCell>{statusBadge(user.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm">
                              <Link href={`/settings/user-management/users/${user.id}`}>Manage User</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="m-0">
              <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Role Catalog</CardTitle>
                    <CardDescription>Choose a role to review scope, assignees, and permission behavior.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex justify-end">
                      <Button onClick={() => setCreateRoleOpen(true)}>Create Role</Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRoleId(role.id)}
                          className="cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{role.name}</p>
                            <Badge variant={selectedRoleId === role.id ? "default" : "outline"}>{role.scope}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{role.users} assigned users</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline">Edit Role</Button>
                      <Button className="flex-1" variant="destructive" onClick={() => deleteRole(selectedRole.id)}>Delete Role</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Permissions: {selectedRole.name}</CardTitle>
                    <CardDescription>Permission matrix grouped by module with clearer visibility of enabled access.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {permissionGroups.map((group) => (
                      <div key={group.title} className="rounded-lg border p-3">
                        <p className="mb-2 text-sm font-medium">{group.title}</p>
                        <div className="flex flex-col gap-2">
                          {group.keys.map((permission) => (
                            <div key={permission} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-2">
                              <span className="text-xs">{permission}</span>
                              <Checkbox checked={selectedRolePermissions.includes(permission)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <Button onClick={() => setAssignRoleOpen(true)}>Assign Role To User</Button>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium">Require approval for sensitive actions</p>
                        <p className="text-xs text-muted-foreground">Exports, bulk deletion, and stage rollback.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="org" className="m-0">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Teams</CardTitle>
                    <CardDescription>Create, edit, view users, transfer users, and delete teams.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex justify-end">
                      <Button onClick={() => setCreateTeamOpen(true)}>Create Team</Button>
                    </div>
                    {teams.map((team) => (
                      <div key={team.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium">{team.name}</p>
                            <p className="text-xs text-muted-foreground">Manager: {team.manager} • Branch: {team.branch}</p>
                          </div>
                          <Badge variant="outline">{team.users} users</Badge>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">View Users</Button>
                          <Button size="sm" variant="outline">Transfer Users</Button>
                          <Button size="sm" variant="outline">Edit Team</Button>
                          <Button size="sm" variant="destructive" onClick={() => { setTeamToDelete(team); setDeleteTeamOpen(true); }}>Delete Team</Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Frontend Risk Handling</CardTitle>
                    <CardDescription>Edge cases are handled through guard modals and guided actions.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Alert>
                      <AlertTriangle />
                      <AlertTitle>Team delete with active users</AlertTitle>
                      <AlertDescription>Deletion is blocked and UI requests transfer before team removal.</AlertDescription>
                    </Alert>
                    <Alert>
                      <AlertTriangle />
                      <AlertTitle>Role conflict and privilege escalation</AlertTitle>
                      <AlertDescription>Conflicting updates show risk modal and require explicit admin confirmation.</AlertDescription>
                    </Alert>
                    <Alert>
                      <AlertTriangle />
                      <AlertTitle>MFA missing for high-privilege role</AlertTitle>
                      <AlertDescription>Role assignment action opens a modal and blocks save until MFA is enabled.</AlertDescription>
                    </Alert>
                    <Button variant="secondary" onClick={() => setRiskOpen(true)}>Test Risk Modal</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Define role scope and permission set.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input placeholder="Role name" />
            <Select defaultValue="Branch">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Global">Global</SelectItem>
                <SelectItem value="Branch">Branch</SelectItem>
                <SelectItem value="Team">Team</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Role description" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoleOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateRoleOpen(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignRoleOpen} onOpenChange={setAssignRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role To User</DialogTitle>
            <DialogDescription>Assign role and apply risk checks before save.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Select defaultValue={users[0]?.id}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select defaultValue={roles[0]?.name}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignRoleOpen(false)}>Cancel</Button>
            <Button onClick={() => { setAssignRoleOpen(false); setRiskOpen(true); }}>Assign Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>Create and configure a team in branch structure.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input placeholder="Team name" />
            <Select defaultValue="Addis HQ">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Addis HQ">Addis HQ</SelectItem>
                <SelectItem value="Dire Dawa">Dire Dawa</SelectItem>
                <SelectItem value="Mekelle">Mekelle</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Manager name" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTeamOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateTeamOpen(false)}>Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTeamOpen} onOpenChange={setDeleteTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>Delete {teamToDelete?.name}. Teams with assigned users require transfers first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTeamOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteTeam}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={riskOpen} onOpenChange={setRiskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Risk Control Triggered</DialogTitle>
            <DialogDescription>Action blocked by frontend guardrails.</DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle />
            <AlertTitle>Resolve before continuing</AlertTitle>
            <AlertDescription>
              Transfer users before deleting team, avoid deleting in-use roles, and enforce MFA before privileged role assignment.
            </AlertDescription>
          </Alert>
          <DialogFooter><Button onClick={() => setRiskOpen(false)}>Understood</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
