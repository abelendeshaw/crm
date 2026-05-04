"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Target,
  TrendingUp,
  Wallet,
  BarChart2,
  CalendarDays,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  initialTargets,
  type SalesTarget,
} from "@/data/salesTargetsData";
import {
  initialDeals,
  type CrmDeal,
  dealCustomerAccounts,
  DEFAULT_PIPELINE_STAGES,
} from "@/data/dealsManagementData";
import { mockDealStore } from "@/data/mockStore";
import { useEffect } from "react";

/* ─── helpers ─── */

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMoney(amount: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `ETB ${amount.toLocaleString()}`;
  }
}

function progressColor(pct: number) {
  if (pct >= 80) return "bg-[#22c55e]";
  if (pct >= 50) return "bg-[#4080f0]";
  return "bg-[#9ca3af]";
}

function progressTextColor(pct: number) {
  if (pct >= 80) return "text-[#16a34a]";
  if (pct >= 50) return "text-[#4080f0]";
  return "text-[#6b7280]";
}

function dealStatusLabel(deal: CrmDeal) {
  const stage = DEFAULT_PIPELINE_STAGES.find((s) => s.id === deal.stageId);
  if (!stage) return "Unknown";
  if (stage.category === "won") return "Won";
  if (stage.category === "lost") return "Lost";
  return "Open";
}

function dealStatusBadge(deal: CrmDeal) {
  const status = dealStatusLabel(deal);
  switch (status) {
    case "Won":
      return (
        <Badge variant="outline" className="text-[10px] bg-[#ecfdf5] text-[#16a34a] border-[#a7f3d0]">
          Won
        </Badge>
      );
    case "Lost":
      return (
        <Badge variant="outline" className="text-[10px] bg-[#fef2f2] text-[#ef4444] border-[#fecaca]">
          Lost
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] bg-[#eff6ff] text-[#4080f0] border-[#bfdbfe]">
          Open
        </Badge>
      );
  }
}

/* ─── component ─── */

export function SalesTargetDetailPage({ id }: { id: string }) {
  const router = useRouter();

  const [target, setTarget] = useState<SalesTarget | undefined>(() => mockDealStore.getTarget(id));
  const [deals, setDeals] = useState<CrmDeal[]>(() => [...mockDealStore.deals]);

  useEffect(() => {
    const unsubTargets = mockDealStore.subscribeTargets((newTargets) => {
      const found = newTargets.find(t => t.id === id);
      setTarget(found);
    });
    const unsubDeals = mockDealStore.subscribeDeals((newDeals) => {
      setDeals([...newDeals]);
    });
    return () => {
      unsubTargets();
      unsubDeals();
    };
  }, [id]);

  const accountById = useMemo(
    () => new Map(dealCustomerAccounts.map((a) => [a.id, a])),
    [],
  );

  if (!target) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
          <h1 className="font-semibold text-[#1c1e21]">Sales Targets</h1>
        </div>
        <div className="flex flex-1 items-center justify-center bg-[#f5f6fa]">
          <div className="text-center">
            <Target size={32} className="mx-auto text-[#d1d5db] mb-3" />
            <p className="text-sm font-medium text-[#6b7280]">Target not found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-[#e5e7eb]"
              onClick={() => router.push("/targets")}
            >
              <ChevronLeft size={14} className="mr-1" />
              Back to targets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pct =
    target.targetValue > 0
      ? Math.min(100, Math.round((target.achievedValue / target.targetValue) * 100))
      : 0;
  const remaining = Math.max(0, target.targetValue - target.achievedValue);

  const contributingDeals = deals.filter((d) =>
    target.contributingDealIds.includes(d.id),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-[#e5e7eb] shrink-0"
              onClick={() => router.push("/targets")}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="min-w-0">
              <h1 className="font-semibold text-[#1c1e21] truncate">{target.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Avatar className="size-4">
                  <AvatarFallback className="text-[7px] bg-[#eef2fd] text-[#4080f0]">
                    {initials(target.assignedTo)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-[#6b7280]">{target.assignedTo}</span>
                <span className="text-xs text-[#d1d5db]">·</span>
                <span className="text-xs text-[#6b7280]">
                  {target.startDate} → {target.endDate}
                </span>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              target.status === "active"
                ? "bg-[#ecfdf5] text-[#16a34a] border-[#a7f3d0]"
                : "bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]",
            )}
          >
            {target.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[#f5f6fa] no-scrollbar">
        <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="border-[#e5e7eb] shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-md bg-[#eef2fd] p-2">
                  <Target size={16} className="text-[#4080f0]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Target</p>
                  <p className="text-sm font-bold text-[#1c1e21]">{formatMoney(target.targetValue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e7eb] shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-md bg-[#ecfdf5] p-2">
                  <TrendingUp size={16} className="text-[#16a34a]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Achieved</p>
                  <p className="text-sm font-bold text-[#1c1e21]">{formatMoney(target.achievedValue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e7eb] shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("rounded-md p-2", pct >= 80 ? "bg-[#ecfdf5]" : pct >= 50 ? "bg-[#eef2fd]" : "bg-[#f9fafb]")}>
                  <BarChart2 size={16} className={progressTextColor(pct)} />
                </div>
                <div>
                  <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Progress</p>
                  <p className={cn("text-sm font-bold", progressTextColor(pct))}>{pct}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e7eb] shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-md bg-[#fffbeb] p-2">
                  <Wallet size={16} className="text-[#d97706]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Remaining</p>
                  <p className="text-sm font-bold text-[#1c1e21]">{formatMoney(remaining)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Large Progress */}
          <Card className="border-[#e5e7eb] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Progress Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">
                  {formatMoney(target.achievedValue)} of {formatMoney(target.targetValue)}
                </span>
                <span className={cn("text-2xl font-bold", progressTextColor(pct))}>
                  {pct}%
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-[#f0f0f5]">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor(pct))}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#9ca3af]">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>

          {/* Contributing Deals */}
          <Card className="border-[#e5e7eb] shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Contributing Deals</CardTitle>
                <Badge variant="outline" className="text-[10px] bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]">
                  {contributingDeals.length} deals
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {contributingDeals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f9fafb] mb-3">
                    <Target size={20} className="text-[#d1d5db]" />
                  </div>
                  <p className="text-sm text-[#6b7280]">No contributing deals linked yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-[#f9fafb]">
                    <TableRow className="hover:bg-transparent border-[#e5e7eb]">
                      <TableHead className="px-6 py-3 font-medium">Deal Name</TableHead>
                      <TableHead className="px-6 py-3 font-medium">Customer</TableHead>
                      <TableHead className="px-6 py-3 font-medium text-right">Amount</TableHead>
                      <TableHead className="px-6 py-3 font-medium">Close Date</TableHead>
                      <TableHead className="px-6 py-3 font-medium text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributingDeals.map((deal) => {
                      const customer = accountById.get(deal.customerId);
                      return (
                        <TableRow
                          key={deal.id}
                          className="hover:bg-[#fcfcff] cursor-pointer border-[#e5e7eb]"
                          onClick={() => router.push(`/deals/${deal.id}`)}
                        >
                          <TableCell className="px-6 py-4">
                            <span className="text-sm font-medium text-[#1c1e21]">
                              {deal.name}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="size-5">
                                <AvatarFallback className="text-[7px] bg-[#eef2fd] text-[#4080f0]">
                                  {initials(customer?.name ?? "?")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-[#6b7280]">
                                {customer?.name ?? "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-[#1c1e21]">
                              {formatMoney(deal.baseValue)}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-xs text-[#6b7280]">
                              {deal.expectedClose}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            {dealStatusBadge(deal)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
