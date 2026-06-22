"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { CrmLead } from "@/data/leadsManagementData";
import type { DealCurrency } from "@/data/dealsManagementData";
import {
  computeLeadTargetPct,
  computeOrgQuarterAchieved,
  computeTeamQuarterAchieved,
  formatCompactMoney,
  getQuarterPeriodLabel,
  getQuarterTarget,
  quarterSum,
  type LeadQuarter,
  type LeadQuarterTarget,
  type LeadTargetingSettings,
  type SalesTeamAllocation,
} from "@/data/leadsTargetsData";
import { CompactQuarterTable } from "@/modules/sales-targeting/shared";

const QUARTERS = [1, 2, 3, 4] as const;

const TEAM_ROW_COLORS = ["#4080f0", "#22c55e", "#a855f7", "#f59e0b", "#3070e0"];

function QuarterMatrixCell({
  target,
  achieved,
  currency,
  onChange,
}: {
  target: number;
  achieved?: number;
  currency: DealCurrency;
  onChange: (value: number) => void;
}) {
  const pct = computeLeadTargetPct(achieved ?? 0, target);

  return (
    <div className="min-w-[6.5rem]">
      <Input
        type="number"
        min={0}
        value={target || ""}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="h-8 border-[#e5e7eb] bg-white text-xs tabular-nums"
        placeholder="0"
      />
      {target > 0 && achieved !== undefined ? (
        <p className="mt-1 text-[10px] leading-tight tabular-nums text-[#9ca3af]">
          {formatCompactMoney(achieved, currency)}
          <span className="ml-1 font-medium text-[#4080f0]">{pct}%</span>
        </p>
      ) : null}
    </div>
  );
}

function TeamQuarterCard({
  team,
  currency,
  quarterDefinitions,
  achievedByQuarter,
  onQuarterChange,
  color,
}: {
  team: SalesTeamAllocation;
  currency: DealCurrency;
  quarterDefinitions: LeadTargetingSettings["quarterDefinitions"];
  achievedByQuarter: Record<LeadQuarter, number>;
  onQuarterChange: (q: LeadQuarter, value: number) => void;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1c1e21]">{team.teamName}</p>
          <p className="text-[11px] tabular-nums text-[#6b7280]">
            Annual {formatCompactMoney(quarterSum(team), currency)}
          </p>
        </div>
      </div>
      <CompactQuarterTable
        quarters={team.quarters}
        quarterDefinitions={quarterDefinitions}
        currency={currency}
        onQuarterChange={onQuarterChange}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#f3f4f6] pt-3 sm:grid-cols-4">
        {QUARTERS.map((q) => {
          const target = getQuarterTarget(team.quarters, q);
          const achieved = achievedByQuarter[q];
          if (target <= 0) return null;
          return (
            <div key={q} className="text-[10px] text-[#9ca3af]">
              <span className="font-medium text-[#6b7280]">Q{q} achieved</span>
              <p className="mt-0.5 tabular-nums text-[#374151]">
                {formatCompactMoney(achieved, currency)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuarterlyCompanyPlanSection({
  fiscalYear,
  quarterDefinitions,
  currency,
  companyQuarters,
  teams,
  leads,
  onCompanyQuarterChange,
  onTeamQuarterChange,
}: {
  fiscalYear: number;
  quarterDefinitions: LeadTargetingSettings["quarterDefinitions"];
  currency: DealCurrency;
  companyQuarters: LeadQuarterTarget[];
  teams: SalesTeamAllocation[];
  leads: CrmLead[];
  onCompanyQuarterChange: (q: LeadQuarter, value: number) => void;
  onTeamQuarterChange: (teamName: string, q: LeadQuarter, value: number) => void;
}) {
  const companyAchievedByQuarter = useMemo(
    () =>
      Object.fromEntries(
        QUARTERS.map((q) => [q, computeOrgQuarterAchieved(leads, currency, q)]),
      ) as Record<LeadQuarter, number>,
    [leads, currency],
  );

  const teamAchievedByQuarter = useMemo(() => {
    const map = new Map<string, Record<LeadQuarter, number>>();
    for (const team of teams) {
      map.set(
        team.teamName,
        Object.fromEntries(
          QUARTERS.map((q) => [
            q,
            computeTeamQuarterAchieved(leads, team.teamName, currency, q),
          ]),
        ) as Record<LeadQuarter, number>,
      );
    }
    return map;
  }, [teams, leads, currency]);

  const allocationByQuarter = useMemo(
    () =>
      QUARTERS.map((q) => {
        const companyTarget = getQuarterTarget(companyQuarters, q);
        const teamSum = teams.reduce(
          (sum, team) => sum + getQuarterTarget(team.quarters, q),
          0,
        );
        return {
          q,
          companyTarget,
          teamSum,
          delta: teamSum - companyTarget,
        };
      }),
    [companyQuarters, teams],
  );

  const companyAnnual = quarterSum({ quarters: companyQuarters });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-[#1c1e21]">
          Quarterly company plan · FY {fiscalYear}
        </p>
        <p className="mt-0.5 text-[12px] text-[#6b7280]">
          Company and sales-team targets for each quarter in {currency}
        </p>
      </div>

      <div className="rounded-lg border border-[#e5e7eb] bg-[#fafbfc] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
              Company quarterly targets
            </p>
            <p className="mt-1 text-[12px] text-[#6b7280]">
              Annual plan {formatCompactMoney(companyAnnual, currency)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <CompactQuarterTable
            quarters={companyQuarters}
            quarterDefinitions={quarterDefinitions}
            currency={currency}
            onQuarterChange={onCompanyQuarterChange}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#e5e7eb] pt-4 sm:grid-cols-4">
          {QUARTERS.map((q) => {
            const target = getQuarterTarget(companyQuarters, q);
            const achieved = companyAchievedByQuarter[q];
            if (target <= 0) return null;
            return (
              <div key={q} className="rounded-md border border-[#eef1f6] bg-white px-3 py-2">
                <p className="text-[10px] font-medium text-[#9ca3af]">Q{q} achieved</p>
                <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-[#1c1e21]">
                  {formatCompactMoney(achieved, currency)}
                </p>
                <p className="text-[10px] tabular-nums text-[#4080f0]">
                  {computeLeadTargetPct(achieved, target)}% of target
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {teams.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white lg:block">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                    Team
                  </th>
                  {QUARTERS.map((q) => (
                    <th
                      key={q}
                      className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]"
                    >
                      <span>Q{q}</span>
                      <span className="mt-0.5 block font-normal normal-case text-[#c4c9d4]">
                        {getQuarterPeriodLabel(quarterDefinitions, q)}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                    Annual
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#eef1f6] bg-[#f8fbff]">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-[#1c1e21]">Company</p>
                    <p className="text-[11px] text-[#9ca3af]">Org-wide plan</p>
                  </td>
                  {QUARTERS.map((q) => (
                    <td key={q} className="px-3 py-3 align-top">
                      <QuarterMatrixCell
                        target={getQuarterTarget(companyQuarters, q)}
                        achieved={companyAchievedByQuarter[q]}
                        currency={currency}
                        onChange={(value) => onCompanyQuarterChange(q, value)}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right align-top">
                    <p className="text-sm font-semibold tabular-nums text-[#1c1e21]">
                      {formatCompactMoney(companyAnnual, currency)}
                    </p>
                  </td>
                </tr>

                {teams.map((team, index) => {
                  const achieved = teamAchievedByQuarter.get(team.teamName)!;
                  const color = TEAM_ROW_COLORS[index % TEAM_ROW_COLORS.length]!;
                  return (
                    <tr key={team.teamName} className="border-b border-[#f3f4f6] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-sm font-medium text-[#374151]">{team.teamName}</p>
                        </div>
                      </td>
                      {QUARTERS.map((q) => (
                        <td key={q} className="px-3 py-3 align-top">
                          <QuarterMatrixCell
                            target={getQuarterTarget(team.quarters, q)}
                            achieved={achieved[q]}
                            currency={currency}
                            onChange={(value) => onTeamQuarterChange(team.teamName, q, value)}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right align-top">
                        <p className="text-sm font-semibold tabular-nums text-[#374151]">
                          {formatCompactMoney(quarterSum(team), currency)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#e5e7eb] bg-[#fafbfc]">
                  <td className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                    Team allocation
                  </td>
                  {allocationByQuarter.map((row) => (
                    <td key={row.q} className="px-3 py-3 align-top">
                      <p className="text-[11px] tabular-nums text-[#6b7280]">
                        {formatCompactMoney(row.teamSum, currency)}
                      </p>
                      {row.companyTarget > 0 ? (
                        <p
                          className={cn(
                            "mt-0.5 text-[10px] font-medium tabular-nums",
                            row.delta === 0
                              ? "text-[#16a34a]"
                              : row.delta > 0
                                ? "text-[#dc2626]"
                                : "text-[#9ca3af]",
                          )}
                        >
                          {row.delta === 0
                            ? "Fully allocated"
                            : row.delta > 0
                              ? `+${formatCompactMoney(row.delta, currency)} over`
                              : `${formatCompactMoney(Math.abs(row.delta), currency)} open`}
                        </p>
                      ) : null}
                    </td>
                  ))}
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {teams.map((team, index) => (
              <TeamQuarterCard
                key={team.teamName}
                team={team}
                currency={currency}
                quarterDefinitions={quarterDefinitions}
                achievedByQuarter={teamAchievedByQuarter.get(team.teamName)!}
                color={TEAM_ROW_COLORS[index % TEAM_ROW_COLORS.length]!}
                onQuarterChange={(q, value) => onTeamQuarterChange(team.teamName, q, value)}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-[#9ca3af]">No Sales teams configured for quarterly planning.</p>
      )}
    </div>
  );
}
