"use client";

import { useState } from "react";
import { SettingsLayoutPageSkeleton } from "@/components/loading/skeleton-screens";
import { usePageLoading } from "@/hooks/usePageLoading";
import {
  CalendarRange,
  Camera,
  CheckCircle2,
  Mail,
  Monitor,
  Moon,
  Palette,
  Phone,
  Save,
  Sun,
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
import { Badge } from "@/components/ui/badge";
import { FiscalYearQuartersSettingsSection } from "@/modules/FiscalYearQuartersSettingsSection";

// ─── Section list ─────────────────────────────────────────────────────────────

const sections = [
  { key: "profile",    icon: User,          label: "Profile",              description: "Personal information & account" },
  { key: "fiscal",     icon: CalendarRange, label: "Fiscal Year & Quarters", description: "Fiscal year and quarter periods" },
  { key: "appearance", icon: Palette,       label: "Appearance",           description: "Theme and display" },
] as const;

type Section = typeof sections[number]["key"];

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
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const isPageLoading = usePageLoading();
  const [active, setActive] = useState<Section>("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const current = sections.find((s) => s.key === active)!;

  if (isPageLoading) {
    return <SettingsLayoutPageSkeleton />;
  }

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
              {active === "profile"    && <ProfileSection onSave={handleSave} />}
              {active === "fiscal"     && <FiscalYearQuartersSettingsSection onSave={handleSave} />}
              {active === "appearance" && <AppearanceSection />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
