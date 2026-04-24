"use client";

import { useEffect, useState } from "react";
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
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-[#9ca3af] mb-1">
          <span>Settings</span>
          <ChevronRight size={12} />
          <span className="text-[#4080f0] font-medium">{item?.label}</span>
        </div>
        <h1 className="font-semibold text-[#1c1e21]">{item?.label}</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">{item?.description}</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#eef2fd] flex items-center justify-center mx-auto mb-4 text-[#4080f0]">
            {item?.icon}
          </div>
          <h3 className="font-medium text-[#1c1e21] mb-1">{item?.label} Settings</h3>
          <p className="text-sm text-[#9ca3af]">
            This section is coming soon.
          </p>
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

  useEffect(() => {
    setActiveSection(selectedSection);
  }, [selectedSection]);

  return (
    <div className="flex h-full overflow-hidden flex-col lg:flex-row">
      {/* Settings Left Nav */}
      <aside className="w-full lg:w-[220px] lg:min-w-[220px] bg-white border-b lg:border-b-0 lg:border-r border-[#e5e7eb] flex flex-col py-3 lg:py-4 overflow-y-auto">
        <div className="px-4 mb-3">
          <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">
            Settings
          </p>
        </div>
        <nav className="flex gap-0.5 px-2 overflow-x-auto lg:flex-col">
          {settingsNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm min-w-max lg:min-w-0 lg:w-full text-left transition-colors relative",
                activeSection === item.id
                  ? "bg-[#eef2fd] text-[#4080f0] font-medium"
                  : "text-[#6b7280] hover:bg-[#f5f6fa] hover:text-[#1c1e21]"
              )}
            >
              <span
                className={
                  activeSection === item.id ? "text-[#4080f0]" : "text-[#9ca3af]"
                }
              >
                {item.icon}
              </span>
              {item.label}
              {activeSection === item.id && (
                <span className="ml-auto">
                  <ChevronRight size={12} className="text-[#4080f0]" />
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Settings Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PlaceholderSection section={activeSection} />
      </div>
    </div>
  );
}


