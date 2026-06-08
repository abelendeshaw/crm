"use client";

import { useState } from "react";
import {
  Settings,
  Plug,
  Bell,
  Lock,
  Palette,
  Globe,
  Database,
  ChevronRight,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type SettingSection =
  | "general"
  | "integrations"
  | "notifications"
  | "security"
  | "appearance"
  | "localization"
  | "data";

const settingsNav: {
  id: SettingSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "general",
    label: "General",
    icon: <Settings size={15} />,
    description: "Basic CRM configuration",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: <Plug size={15} />,
    description: "Connect third-party services",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell size={15} />,
    description: "Alert & email preferences",
  },
  {
    id: "security",
    label: "Security",
    icon: <Lock size={15} />,
    description: "Auth, 2FA & audit logs",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: <Palette size={15} />,
    description: "Theme & branding",
  },
  {
    id: "localization",
    label: "Localization",
    icon: <Globe size={15} />,
    description: "Language, timezone & currency",
  },
  {
    id: "data",
    label: "Data & Backup",
    icon: <Database size={15} />,
    description: "Import, export & backups",
  },
];

const settingSectionIds: SettingSection[] = [
  "general",
  "integrations",
  "notifications",
  "security",
  "appearance",
  "localization",
  "data",
];

function PlaceholderSection({ section }: { section: SettingSection }) {
  const item = settingsNav.find((s) => s.id === section);
  return (
    <div className="flex flex-col">
      <div className="border-b border-[#e5e7eb] px-5 py-4">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-[#9ca3af]">
          <span>Settings</span>
          <ChevronRight size={11} />
          <span className="font-medium text-[#4080f0]">{item?.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#4080f0]">{item?.icon}</span>
          <h2 className="text-[15px] font-semibold text-[#1c1e21]">{item?.label}</h2>
        </div>
        <p className="mt-0.5 text-[13px] text-[#9ca3af]">{item?.description}</p>
      </div>
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef2fd] text-[#4080f0]">
            {item?.icon}
          </div>
          <p className="text-sm font-medium text-[#1c1e21]">{item?.label} Settings</p>
          <p className="mt-1 text-xs text-[#9ca3af]">This section is coming soon.</p>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const selectedSection: SettingSection = settingSectionIds.includes(
    sectionParam as SettingSection
  )
    ? (sectionParam as SettingSection)
    : "general";
  const [activeSection, setActiveSection] =
    useState<SettingSection>(selectedSection);

  return (
    <div className="min-h-full overflow-y-auto bg-[#f5f6fa] p-6">
      <div className="mx-auto flex max-w-5xl items-start gap-6">
        {/* Left nav card */}
        <div className="w-64 shrink-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] px-4 py-3.5">
            <h2 className="text-[13px] font-semibold text-[#1c1e21]">Settings</h2>
            <p className="text-[11px] text-[#9ca3af]">Workspace configuration</p>
          </div>
          <nav className="flex flex-col gap-0.5 p-2">
            {settingsNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  activeSection === item.id
                    ? "bg-[#eef2fd]"
                    : "hover:bg-[#f5f6fa]"
                )}
              >
                <span
                  className={cn(
                    "shrink-0",
                    activeSection === item.id ? "text-[#4080f0]" : "text-[#9ca3af]"
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      "text-[13px] font-medium",
                      activeSection === item.id ? "text-[#4080f0]" : "text-[#1c1e21]"
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="truncate text-[11px] text-[#9ca3af]">
                    {item.description}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right content card */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          <PlaceholderSection section={activeSection} />
        </div>
      </div>
    </div>
  );
}
