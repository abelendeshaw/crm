"use client";

import { useState } from "react";
import {
  Users,
  Shield,
  UsersRound,
  Layers,
  ChevronRight,
} from "lucide-react";
import { UsersTab } from "@/components/user-management/UsersTab";
import { RolesTab } from "@/components/user-management/RolesTab";
import { TeamsTab } from "@/components/user-management/TeamsTab";
import { DepartmentsTab } from "@/components/user-management/DepartmentsTab";
import { cn } from "@/lib/utils";

type Tab = "users" | "roles" | "teams" | "departments";

const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "users",
    label: "Users",
    icon: <Users size={15} />,
    description: "Manage CRM user accounts and access",
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    icon: <Shield size={15} />,
    description: "Define roles and control module access",
  },
  {
    id: "teams",
    label: "Teams",
    icon: <UsersRound size={15} />,
    description: "Organize users into collaborative teams",
  },
  {
    id: "departments",
    label: "Departments",
    icon: <Layers size={15} />,
    description: "Structure your organization by department",
  },
];

export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-[#9ca3af] mb-1">
          <span>Settings</span>
          <ChevronRight size={12} />
          <span className="text-[#4080f0] font-medium">User Management</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-semibold text-[#1c1e21]">User Management</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">
              {active.description}
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mt-4 -mb-4 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-[#4080f0] text-[#4080f0]"
                  : "border-transparent text-[#6b7280] hover:text-[#1c1e21] hover:border-[#e5e7eb]"
              )}
            >
              <span className={activeTab === tab.id ? "text-[#4080f0]" : "text-[#9ca3af]"}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden p-3 sm:p-5">
        {activeTab === "users" && <UsersTab />}
        {activeTab === "roles" && <RolesTab />}
        {activeTab === "teams" && <TeamsTab />}
        {activeTab === "departments" && <DepartmentsTab />}
      </div>
    </div>
  );
}


