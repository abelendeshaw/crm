"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  Database,
  Download,
  Mail,
  Monitor,
  Moon,
  Palette,
  Phone,
  Save,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = "email" | "push";

// ─── Section list ─────────────────────────────────────────────────────────────

const sections = [
  { key: "profile",       icon: User,    label: "Profile",        description: "Personal information & account" },
  { key: "notifications", icon: Bell,    label: "Notifications",  description: "Email and alert preferences" },
  { key: "appearance",    icon: Palette, label: "Appearance",     description: "Theme and display" },
  { key: "data",          icon: Database,label: "Data & Privacy", description: "Export and deletion" },
] as const;

type Section = typeof sections[number]["key"];

// ─── Notification config ──────────────────────────────────────────────────────

const notifItems = [
  { key: "new_lead",      label: "New Lead Created",          description: "When a new lead is submitted",            email: true,  push: true  },
  { key: "lead_assigned", label: "Lead Assigned to Me",       description: "When a lead is assigned to your account", email: true,  push: true  },
  { key: "deal_won",      label: "Deal Won",                  description: "When a deal is marked as won",            email: true,  push: false },
  { key: "deal_lost",     label: "Deal Lost",                 description: "When a deal is marked as lost",           email: false, push: false },
  { key: "weekly_report", label: "Weekly Performance Report", description: "Summary delivered every Monday",          email: true,  push: false },
  { key: "followup_due",  label: "Follow-up Due",             description: "When a scheduled follow-up is overdue",   email: true,  push: true  },
];

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({ onSave }: { onSave: () => void }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#4080f0] text-xl font-semibold text-white">
            AT
            <button
              type="button"
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted"
            >
              <Camera size={11} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <p className="font-medium">Abraham Tayu</p>
              <p className="text-sm text-muted-foreground">Admin · abreham.t@ienetworks.co</p>
            </div>
            <Button variant="outline" size="sm" className="w-fit">
              Change photo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="Abraham" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Tayu" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" defaultValue="abreham.t@ienetworks.co" className="pl-9" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" defaultValue="+251987654321" className="pl-9" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Input id="role" defaultValue="Admin" disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {[
            { label: "Version",      value: "1.4.2" },
            { label: "Last Updated", value: "March 19, 2026" },
            { label: "License",      value: "Enterprise" },
            { label: "Plan",         value: "Annual · Renews 2027-01-01" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={onSave} className="bg-[#4080f0] text-white hover:bg-[#3070e0]">
        <Save data-icon="inline-start" />
        Save Changes
      </Button>
    </>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────

function NotificationsSection() {
  const [notifState, setNotifState] = useState<Record<string, { email: boolean; push: boolean }>>(
    Object.fromEntries(notifItems.map((item) => [item.key, { email: item.email, push: item.push }]))
  );

  const toggle = (key: string, type: NotifType) =>
    setNotifState((prev) => ({ ...prev, [key]: { ...prev[key], [type]: !prev[key][type] } }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Preferences</CardTitle>
        <CardDescription>Control which events send email or push notifications.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {notifItems.map((item) => (
          <div key={item.key} className="grid grid-cols-3 items-center gap-4 rounded-md border p-3">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <div className="mx-auto flex items-center gap-2">
              <Label htmlFor={`${item.key}-email`} className="text-xs text-muted-foreground">Email</Label>
              <Switch
                id={`${item.key}-email`}
                checked={notifState[item.key].email}
                onCheckedChange={() => toggle(item.key, "email")}
              className="data-checked:bg-[#4080f0]"
              />
            </div>
            <div className="mx-auto flex items-center gap-2">
              <Label htmlFor={`${item.key}-push`} className="text-xs text-muted-foreground">Push</Label>
              <Switch
                id={`${item.key}-push`}
                checked={notifState[item.key].push}
                onCheckedChange={() => toggle(item.key, "push")}
              className="data-checked:bg-[#4080f0]"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

function AppearanceSection() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          {[
            { key: "light"  as const, Icon: Sun,     label: "Light"  },
            { key: "dark"   as const, Icon: Moon,    label: "Dark"   },
            { key: "system" as const, Icon: Monitor, label: "System" },
          ].map(({ key, Icon, label }) => (
            <Button
              key={key}
              variant={theme === key ? "secondary" : "outline"}
              className={theme === key
                ? "h-auto flex-col gap-2 py-4 bg-[#eef2fd] text-[#4080f0] hover:bg-[#e4ecfc] hover:text-[#4080f0] border-[#4080f0]/30"
                : "h-auto flex-col gap-2 py-4"}
              onClick={() => setTheme(key)}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {[
            { label: "Compact Mode",           description: "Reduce spacing throughout the interface" },
            { label: "Show Lead & Deal IDs",   description: "Display record IDs in all pipeline views" },
            { label: "Auto-refresh Dashboard", description: "Refresh dashboard metrics every 5 minutes" },
          ].map(({ label, description }) => (
            <div key={label} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch className="data-checked:bg-[#4080f0]" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Section: Data & Privacy ──────────────────────────────────────────────────

function DataSection() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Data</CardTitle>
          <CardDescription>Download your data in standard formats.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {["Leads (CSV)", "Deals (CSV)", "Contacts (CSV)", "Full Backup (JSON)"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-md border p-3">
              <span>{item}</span>
              <Button variant="outline" size="sm">
                <Download data-icon="inline-start" />
                Export
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <div className="mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="font-semibold text-destructive">Danger Zone</p>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          These actions are permanent and cannot be undone.
        </p>
        <div className="grid gap-2">
          {[
            { label: "Delete all leads", desc: "Permanently remove all lead records" },
            { label: "Reset workspace",  desc: "Clear all CRM data and start fresh" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between rounded-md border border-destructive/30 bg-background/50 p-3">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [active, setActive] = useState<Section>("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const current = sections.find((s) => s.key === active)!;

  return (
    <div className="min-h-full bg-muted/30 p-6">
      <div className="mx-auto flex max-w-6xl gap-6">
        {/* Left nav card */}
        <Card className="h-fit w-72 shrink-0">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Workspace and account configuration</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {sections.map((item) => {
              const NavIcon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant={active === item.key ? "secondary" : "ghost"}
                  className={active === item.key
                    ? "h-auto justify-start py-3 bg-[#eef2fd] text-[#4080f0] hover:bg-[#e4ecfc] hover:text-[#4080f0]"
                    : "h-auto justify-start py-3"}
                  onClick={() => setActive(item.key)}
                >
                  <NavIcon data-icon="inline-start" />
                  <span className="flex flex-col items-start">
                    <span>{item.label}</span>
                    <span className={active === item.key ? "text-xs text-[#4080f0]/70" : "text-xs text-muted-foreground"}>{item.description}</span>
                  </span>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Right content card */}
        <div className="flex-1">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <current.icon className="size-4" />
                  {current.label}
                </CardTitle>
                <CardDescription>{current.description}</CardDescription>
              </div>
              {saved && (
                <Badge className="gap-1 bg-[#eef2fd] text-[#4080f0] hover:bg-[#eef2fd]">
                  <CheckCircle2 className="size-3.5" />
                  Changes saved
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {active === "profile"       && <ProfileSection onSave={handleSave} />}
              {active === "notifications" && <NotificationsSection />}
              {active === "appearance"    && <AppearanceSection />}
              {active === "data"          && <DataSection />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
