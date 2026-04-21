import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, UserCog, UserRoundCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getUserById } from "@/lib/user-management-data";

function statusBadge(status: string) {
  if (status === "active") return <Badge>Active</Badge>;
  if (status === "pending") return <Badge variant="secondary">Pending Invite</Badge>;
  return <Badge variant="destructive">Suspended</Badge>;
}

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link href="/#users">
              <ArrowLeft data-icon="inline-start" />
              Back to Users
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserCog data-icon="inline-start" />
                Invite & Onboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite & Onboard User</DialogTitle>
                <DialogDescription>Review details before sending onboarding access.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-2">
                <Input defaultValue={user.name} />
                <Input defaultValue={user.email} />
                <Textarea placeholder="Onboarding notes" />
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Send Invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            {statusBadge(user.status)}
            <Badge variant="outline">{user.role}</Badge>
            <Badge variant="outline">{user.team}</Badge>
            <Badge variant="outline">{user.branch}</Badge>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update identity, reporting line, and organizational placement.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input defaultValue={user.name} />
              <Input defaultValue={user.email} />
              <Select defaultValue={user.role}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRM Admin">CRM Admin</SelectItem>
                  <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                  <SelectItem value="Sales Agent">Sales Agent</SelectItem>
                </SelectContent>
              </Select>
              <Input defaultValue={user.manager} />
              <div className="grid grid-cols-2 gap-2">
                <Button>Save Changes</Button>
                <Button variant="outline">Reset</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Actions</CardTitle>
              <CardDescription>Transfer, status management, and risk controls.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Transfer User</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer User</DialogTitle>
                    <DialogDescription>Move user to another branch/team while retaining audit history.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 py-2">
                    <Select defaultValue={user.branch}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Addis HQ">Addis HQ</SelectItem>
                        <SelectItem value="Dire Dawa">Dire Dawa</SelectItem>
                        <SelectItem value="Mekelle">Mekelle</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue={user.team}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Enterprise Sales">Enterprise Sales</SelectItem>
                        <SelectItem value="East Region">East Region</SelectItem>
                        <SelectItem value="SMB Sales">SMB Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Confirm Transfer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Change Status</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Status</DialogTitle>
                    <DialogDescription>Set account state and apply access policies immediately.</DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2 py-2">
                    <Button variant="outline">Active</Button>
                    <Button variant="outline">Pending</Button>
                    <Button variant="destructive">Suspend</Button>
                  </div>
                  <DialogFooter>
                    <Button>Done</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">MFA enforced</span>
                <Switch checked={user.mfa} />
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ShieldAlert />
                  Risk Guardrails
                </div>
                <p className="text-xs text-muted-foreground">
                  High-privilege actions require MFA and explicit confirmation before save.
                </p>
              </div>

              <Button variant="secondary">
                <UserRoundCheck data-icon="inline-start" />
                Re-activate Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
