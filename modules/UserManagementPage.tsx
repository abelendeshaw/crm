"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Users, Shield } from "lucide-react";
import { UsersTab } from "@/components/user-management/UsersTab";
import { RolesTab } from "@/components/user-management/RolesTab";
import { cn } from "@/lib/utils";
import { TabbedModulePageSkeleton } from "@/components/loading/skeleton-screens";
import { usePageLoading } from "@/hooks/usePageLoading";
import { roles as initialRoles, type Role } from "@/data/userManagementData";

export type UserManagementTab = "users" | "roles";

const tabs: { id: UserManagementTab; label: string; icon: React.ReactNode }[] = [
  { id: "users", label: "Users", icon: <Users size={15} /> },
  { id: "roles", label: "Roles & Permissions", icon: <Shield size={15} /> },
];

function parseTab(raw: string | null): UserManagementTab {
  if (raw === "users" || raw === "roles") return raw;
  return "users";
}

export function UserManagementPage() {
  const isPageLoading = usePageLoading();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = parseTab(searchParams.get("tab"));
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    initialRoles[0]?.id ?? ""
  );
  const [isViewingUser, setIsViewingUser] = useState(false);

  const setActiveTab = (id: UserManagementTab) => {
    const next = new URLSearchParams(searchParams.toString());
    if (id === "users") {
      next.delete("tab");
    } else {
      next.set("tab", id);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  if (isPageLoading) {
    return <TabbedModulePageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!(activeTab === "users" && isViewingUser) && (
        <div className="bg-white border-b border-[#e5e7eb] px-6 flex-shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-[#4080f0] text-[#4080f0]"
                    : "border-transparent text-[#6b7280] hover:text-[#1c1e21] hover:border-[#e5e7eb]"
                )}
              >
                <span
                  className={
                    activeTab === tab.id ? "text-[#4080f0]" : "text-[#9ca3af]"
                  }
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden min-h-0 flex flex-col p-3 sm:p-5">
        {activeTab === "users" && (
          <UsersTab roles={roles} setRoles={setRoles} onViewingChange={setIsViewingUser} />
        )}
        {activeTab === "roles" && (
          <RolesTab
            roles={roles}
            setRoles={setRoles}
            selectedRoleId={selectedRoleId}
            setSelectedRoleId={setSelectedRoleId}
          />
        )}
      </div>
    </div>
  );
}
