"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type CrmLead,
  RENEWAL_WARNING_DAYS,
  DEFAULT_LEAD_PIPELINE_STAGES,
} from "@/data/leadsManagementData";
import {
  customerAccounts,
} from "@/data/customerManagementData";
import { mockLeadStore } from "@/data/mockStore";

function daysUntilRenewal(renewalDate: string): number {
  const now = new Date();
  const renewal = new Date(renewalDate + "T12:00:00").getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime();
  return Math.floor((renewal - today) / 86400000);
}

function getRenewalStatus(renewalDate?: string): "expired" | "warning" | null {
  if (!renewalDate) return null;
  const days = daysUntilRenewal(renewalDate);
  if (days < 0) return "expired";
  if (days <= RENEWAL_WARNING_DAYS) return "warning";
  return null;
}

export function LeadsEolPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<CrmLead[]>(() => mockLeadStore.leads);
  const [stages] = useState(() => mockLeadStore.stages);

  useEffect(() => {
    return mockLeadStore.subscribeLeads((newLeads) => setLeads([...newLeads]));
  }, []);

  const accountById = useMemo(
    () => new Map(customerAccounts.map((a) => [a.id, a])),
    [],
  );

  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );

  const eolLeads = useMemo(() => {
    return leads
      .filter((l) => {
        const s = getRenewalStatus(l.renewalDate);
        return s === "expired" || s === "warning";
      })
      .sort((a, b) => (a.renewalDate ?? "").localeCompare(b.renewalDate ?? ""));
  }, [leads]);

  const expired = eolLeads.filter((l) => getRenewalStatus(l.renewalDate) === "expired");
  const warning = eolLeads.filter((l) => getRenewalStatus(l.renewalDate) === "warning");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-[#6b7280] hover:text-[#1c1e21]"
            onClick={() => router.push("/leads")}
          >
            <ArrowLeft size={15} />
            Back
          </Button>
          <div className="h-4 w-px bg-[#e5e7eb]" />
          <div>
            <h1 className="font-semibold text-[#1c1e21]">End-of-Life Leads</h1>
            <p className="mt-0.5 text-xs text-[#6b7280]">
              Leads expiring within {RENEWAL_WARNING_DAYS} days or past their renewal date
            </p>
          </div>
          {eolLeads.length > 0 && (
            <span
              className={cn(
                "ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                expired.length > 0
                  ? "bg-rose-50 text-rose-700"
                  : "bg-amber-50 text-amber-700",
              )}
            >
              {eolLeads.length} lead{eolLeads.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#f5f6fa] px-4 py-6 sm:px-6">
        {eolLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50">
              <Check size={28} className="text-emerald-500" />
            </div>
            <p className="text-base font-semibold text-[#1c1e21]">All leads are healthy</p>
            <p className="mt-1.5 text-sm text-[#6b7280]">
              No leads are approaching or past their renewal date.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6 gap-1.5 border-[#e5e7eb]"
              onClick={() => router.push("/leads")}
            >
              <ArrowLeft size={14} />
              Back to pipeline
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-8">

            {/* Summary strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-4">
                <p className="text-xs font-medium text-[#9ca3af]">Total at risk</p>
                <p className="mt-1 text-2xl font-bold text-[#1c1e21]">{eolLeads.length}</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-4">
                <p className="text-xs font-medium text-rose-500">Expired</p>
                <p className="mt-1 text-2xl font-bold text-rose-700">{expired.length}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4">
                <p className="text-xs font-medium text-amber-600">Expiring soon</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{warning.length}</p>
              </div>
            </div>

            {/* Expired */}
            {expired.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    <X size={11} />
                    Expired
                  </span>
                  <span className="text-xs text-[#9ca3af]">
                    {expired.length} lead{expired.length !== 1 ? "s" : ""} — will be automatically renewed to the first pipeline stage
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-rose-50 hover:bg-rose-50">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Lead</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Customer</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Stage</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Owner</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Renewal date</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Overdue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expired.map((lead) => {
                        const customer = accountById.get(lead.customerId);
                        const stage = stageById.get(lead.stageId);
                        const days = Math.abs(daysUntilRenewal(lead.renewalDate!));
                        return (
                          <TableRow
                            key={lead.id}
                            className="cursor-pointer hover:bg-rose-50/40"
                            onClick={() => router.push(`/leads/${lead.id}`)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-rose-50">
                                  <X size={13} className="text-rose-500" />
                                </div>
                                <span className="font-medium text-[#1c1e21]">{lead.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-[#6b7280]">{customer?.name ?? "—"}</TableCell>
                            <TableCell>
                              {stage ? (
                                <Badge
                                  variant="outline"
                                  className={cn("border text-[10px]", stage.borderClass, stage.columnClass, "text-[#1c1e21]")}
                                >
                                  {stage.name}
                                </Badge>
                              ) : (
                                <span className="text-xs text-[#9ca3af]">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-[#6b7280]">{lead.primarySales}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5 text-sm text-rose-600">
                                <Calendar size={13} />
                                {lead.renewalDate}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-xs text-rose-700">
                                {days}d overdue
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {/* Expiring Soon */}
            {warning.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <AlertTriangle size={11} />
                    Expiring soon
                  </span>
                  <span className="text-xs text-[#9ca3af]">
                    {warning.length} lead{warning.length !== 1 ? "s" : ""} — renewal date within {RENEWAL_WARNING_DAYS} days
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-amber-50 hover:bg-amber-50">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Lead</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Customer</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Stage</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Owner</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Renewal date</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Days left</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warning.map((lead) => {
                        const customer = accountById.get(lead.customerId);
                        const stage = stageById.get(lead.stageId);
                        const days = daysUntilRenewal(lead.renewalDate!);
                        return (
                          <TableRow
                            key={lead.id}
                            className="cursor-pointer hover:bg-amber-50/40"
                            onClick={() => router.push(`/leads/${lead.id}`)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-50">
                                  <Clock size={13} className="text-amber-500" />
                                </div>
                                <span className="font-medium text-[#1c1e21]">{lead.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-[#6b7280]">{customer?.name ?? "—"}</TableCell>
                            <TableCell>
                              {stage ? (
                                <Badge
                                  variant="outline"
                                  className={cn("border text-[10px]", stage.borderClass, stage.columnClass, "text-[#1c1e21]")}
                                >
                                  {stage.name}
                                </Badge>
                              ) : (
                                <span className="text-xs text-[#9ca3af]">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-[#6b7280]">{lead.primarySales}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                                <Calendar size={13} />
                                {lead.renewalDate}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border text-xs",
                                  days === 0
                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                    : days <= 3
                                    ? "border-orange-200 bg-orange-50 text-orange-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700",
                                )}
                              >
                                {days === 0 ? "Today" : `${days}d left`}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {/* Footer note */}
            <p className="text-center text-xs text-[#9ca3af]">
              <RefreshCw size={11} className="mr-1 inline" />
              Expired leads are automatically re-entered into the first pipeline stage with the renewal date advanced by one year.
            </p>

          </div>
        )}
      </div>
    </div>
  );
}
