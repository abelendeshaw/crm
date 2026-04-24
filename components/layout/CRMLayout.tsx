"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Activity,
  BarChart2,
  Settings,
  UserCog,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
  {
    label: "Leads",
    icon: <Users size={18} />,
    path: "/leads",
    children: [
      { label: "Leads", path: "/leads" },
      { label: "Activity", path: "/leads/activity" },
      { label: "Settings", path: "/leads/settings" },
    ],
  },
  { label: "Deals", icon: <Handshake size={18} />, path: "/deals" },
  { label: "Activity", icon: <Activity size={18} />, path: "/activity" },
  { label: "Report", icon: <BarChart2 size={18} />, path: "/report" },
  {
    label: "Settings",
    icon: <Settings size={18} />,
    path: "/settings",
    children: [
      { label: "General", path: "/settings?section=general" },
      { label: "Integrations", path: "/settings?section=integrations" },
      { label: "Notifications", path: "/settings?section=notifications" },
      { label: "Security", path: "/settings?section=security" },
      { label: "Appearance", path: "/settings?section=appearance" },
      { label: "Localization", path: "/settings?section=localization" },
      { label: "Data & Backup", path: "/settings?section=data" },
    ],
  },
];

const userManagementNav: NavItem = {
  label: "User Management",
  icon: <UserCog size={18} />,
  path: "/user-management",
};

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleExpand = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const isChildActive = (children?: { label: string; path: string }[]) => {
    return children?.some((c) => {
      const [childPath] = c.path.split("?");
      return pathname.startsWith(childPath);
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-full w-[220px] min-w-[220px] flex-col bg-white border-r border-[#e5e7eb] transition-transform md:static md:z-10 md:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e5e7eb] h-[52px]">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#4080f0]">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="font-semibold text-[#1c1e21] text-sm tracking-wide">
            CRM
          </span>
          <div className="ml-auto">
            <Grid3x3 size={16} className="text-[#9ca3af]" />
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path) || isChildActive(item.children);
            const isExpanded = expanded.includes(item.label);

            return (
              <div key={item.label}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer group transition-colors relative",
                    active
                      ? "text-[#4080f0] bg-[#eef2fd]"
                      : "text-[#6b7280] hover:bg-[#f5f6fa] hover:text-[#1c1e21]"
                  )}
                  onClick={() => item.children && toggleExpand(item.label)}
                >
                  {active && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#4080f0] rounded-r" />
                  )}
                  <span
                    className={cn(
                      active
                        ? "text-[#4080f0]"
                        : "text-[#9ca3af] group-hover:text-[#6b7280]"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.path && !item.children ? (
                    <Link
                      href={item.path}
                      className="flex-1 text-sm font-medium"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                  )}
                  {item.children && (
                    <span className="ml-auto">
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </span>
                  )}
                </div>

                {item.children && isExpanded && (
                  <div className="ml-[34px] border-l border-[#e5e7eb] pl-3 py-1">
                    {item.children.map((child) => {
                      const [childPath] = child.path.split("?");
                      const childActive = pathname === childPath;
                      return (
                        <Link
                          key={child.path}
                          href={child.path}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            "block py-1.5 text-sm transition-colors",
                            childActive
                              ? "text-[#4080f0] font-medium"
                              : "text-[#6b7280] hover:text-[#1c1e21]"
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[#e5e7eb] p-3">
          <Link
            href={userManagementNav.path ?? "/user-management"}
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors",
              isActive(userManagementNav.path)
                ? "border-[#bfd0fb] bg-[#eef2fd] text-[#245fcb]"
                : "border-[#e5e7eb] bg-[#fafbff] text-[#4b5563] hover:bg-[#f3f6ff]"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                isActive(userManagementNav.path)
                  ? "bg-[#dfe9ff] text-[#3b78e7]"
                  : "bg-white text-[#6b7280]"
              )}
            >
              {userManagementNav.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">
                {userManagementNav.label}
              </p>
              <p className="text-xs text-[#9ca3af]">Users, roles, teams</p>
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f5f6fa]">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e5e7eb] text-[#6b7280]"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm font-semibold text-[#1c1e21]">CRM</span>
          <span className="w-9" />
        </div>
        {children}
      </div>
    </div>
  );
}
