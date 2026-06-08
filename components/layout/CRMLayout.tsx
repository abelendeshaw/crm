"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
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
  Target,
  Bell,
  HelpCircle,
  Search,
  LogOut,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: { label: string; path: string }[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/" },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "Leads",
        icon: <Users size={16} />,
        path: "/leads",
        children: [
          { label: "Pipeline", path: "/leads" },
          { label: "Settings", path: "/leads/settings" },
        ],
      },
      {
        label: "Deals",
        icon: <Handshake size={16} />,
        path: "/deals",
        children: [
          { label: "Pipeline", path: "/deals" },
          { label: "Settings", path: "/deals/settings" },
        ],
      },
      // { label: "Targets", icon: <Target size={16} />, path: "/targets" },
    ],
  },
  {
    label: "Customers",
    items: [
      {
        label: "Customer",
        icon: <Building2 size={16} />,
        path: "/customers",
        children: [
          { label: "Customers", path: "/customers" },
          { label: "Contacts", path: "/contacts" },
        ],
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Activity", icon: <Activity size={16} />, path: "/activity" },
      { label: "Report", icon: <BarChart2 size={16} />, path: "/report" },
    ],
  },
];

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentPathWithQuery =
    typeof window !== "undefined" ? `${pathname}${window.location.search}` : pathname;

  const toggleExpand = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label) ? [] : [label]
    );
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const isChildActive = (children?: { label: string; path: string }[]) => {
    return children?.some((c) => currentPathWithQuery === c.path);
  };

  const navItemClass = (active: boolean, collapsed = false) =>
    cn(
      "flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer group transition-all duration-100 relative",
      collapsed && "justify-center",
      active
        ? "bg-white text-[#4080f0]"
        : "text-white/80 hover:bg-white/15 hover:text-white"
    );

  const navIconClass = (active: boolean) =>
    cn("flex-shrink-0", active ? "text-[#4080f0]" : "group-hover:text-white");

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

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-full flex-col bg-[#4080f0] text-white transition-all duration-200 md:static md:z-10 md:translate-x-0",
          sidebarCollapsed ? "w-[60px] min-w-[60px]" : "w-[220px] min-w-[220px]",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "h-[56px] flex items-center border-b border-white/16 flex-shrink-0",
            sidebarCollapsed ? "px-4 justify-center" : "px-5"
          )}
        >
          {sidebarCollapsed ? (
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/20">
              <span className="text-white font-bold text-xs">A</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/20 flex-shrink-0">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-semibold leading-tight truncate">
                  CRM
                </div>
                <div className="text-white/60 text-xs leading-tight">Workspace</div>
              </div>
              <Grid3x3 size={16} className="text-white/60 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto py-3 px-2">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <div className="mb-1 px-2">
                  <span className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">
                    {group.label}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path) || !!isChildActive(item.children);
                  // Auto-expand when the parent or any child is active; allow
                  // manual toggle for inactive parents.
                  const isExpanded = active || expanded.includes(item.label);

                  return (
                    <div key={item.label}>
                      <div
                        className={navItemClass(active, sidebarCollapsed)}
                        onClick={() => {
                          if (!item.children) return;
                          // Only allow collapsing when this section isn't active
                          if (!active) toggleExpand(item.label);
                        }}
                      >
                        {active && !sidebarCollapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[#4080f0]/40 rounded-full" />
                        )}
                        <span className={navIconClass(active)}>{item.icon}</span>
                        {!sidebarCollapsed && (
                          <>
                            {!item.children ? (
                              <Link
                                href={item.path}
                                className="flex-1 text-[13px] font-medium truncate"
                                onClick={() => setMobileNavOpen(false)}
                              >
                                {item.label}
                              </Link>
                            ) : (
                              <span className="flex-1 text-[13px] font-medium truncate">
                                {item.label}
                              </span>
                            )}
                            {item.children && (
                              <span className="ml-auto flex-shrink-0 opacity-60">
                                {isExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {item.children && isExpanded && !sidebarCollapsed && (
                        <div className="ml-[28px] pl-3 py-1">
                          {item.children.map((child) => {
                            const childActive = currentPathWithQuery === child.path;
                            return (
                              <Link
                                key={child.path}
                                href={child.path}
                                onClick={() => setMobileNavOpen(false)}
                                className={cn(
                                  "block py-1.5 text-[13px] transition-colors",
                                  childActive
                                    ? "text-white font-medium"
                                    : "text-white/70 hover:text-white"
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
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/16 flex-shrink-0 p-2">
          {/* Settings */}
          <div className={navItemClass(isActive("/settings"), sidebarCollapsed)}>
            {isActive("/settings") && !sidebarCollapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[#4080f0]/40 rounded-full" />
            )}
            <span className={navIconClass(isActive("/settings"))}>
              <Settings size={16} />
            </span>
            {!sidebarCollapsed && (
              <Link
                href="/settings"
                className="flex-1 text-[13px] font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                Settings
              </Link>
            )}
          </div>

          {/* User Management */}
          <div className={navItemClass(isActive("/user-management"), sidebarCollapsed)}>
            {isActive("/user-management") && !sidebarCollapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[#4080f0]/40 rounded-full" />
            )}
            <span className={navIconClass(isActive("/user-management"))}>
              <UserCog size={16} />
            </span>
            {!sidebarCollapsed && (
              <Link
                href="/user-management"
                className="flex-1 text-[13px] font-medium"
                onClick={() => setMobileNavOpen(false)}
              >
                User Management
              </Link>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-2 py-2 text-white/70 hover:bg-white/15 hover:text-white transition-all duration-100",
              sidebarCollapsed && "justify-center"
            )}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span className="text-[13px]">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f5f6fa]">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e5e7eb] text-[#6b7280]"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <span className="text-sm font-semibold text-[#1c1e21]">CRM</span>
          <span className="w-9" />
        </div>

        {/* Desktop header */}
        <header className="hidden md:flex h-[56px] items-center gap-4 border-b border-[#e5e7eb] bg-white px-6 flex-shrink-0">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative">
              <Search className="text-[#9ca3af] absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search leads, deals, contacts..."
                className="h-8 min-h-0 w-64 pl-9 pr-4 text-[13px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="text-[#9ca3af] hover:text-[#1c1e21] size-8"
            >
              <Bell className="w-4 h-4" />
            </Button>

            {/* Help */}
            <Button
              variant="ghost"
              size="icon"
              className="text-[#9ca3af] hover:text-[#1c1e21] size-8"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>

            <div className="h-5 w-px bg-[#e5e7eb]" />

            {/* User profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto gap-2 px-0 hover:bg-transparent"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-[#4080f0] text-white text-xs font-semibold">
                    A
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-[#1c1e21] text-[13px] font-medium leading-tight">
                      Admin User
                    </div>
                    <div className="text-[#9ca3af] text-[11px] leading-tight">Admin</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-[13px]">
                  <UserCircle className="w-3.5 h-3.5 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push("/settings")}
                  className="text-[13px]"
                >
                  <Settings className="w-3.5 h-3.5 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[13px] text-red-600">
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
