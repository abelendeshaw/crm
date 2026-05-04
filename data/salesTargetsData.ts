import { initialDeals, type CrmDeal, BASE_CURRENCY, FX_TO_ETB } from "./dealsManagementData";

export type TargetStatus = "active" | "inactive";
export type TargetMetric = "Revenue";

export type SalesTarget = {
  id: string;
  name: string;
  metric: TargetMetric;
  targetValue: number;
  achievedValue: number;
  assignedTo: string;
  startDate: string;
  endDate: string;
  status: TargetStatus;
  /** Deal IDs that contribute to this target */
  contributingDealIds: string[];
};

const ownersPool = [
  "Sara Tesfaye",
  "Biruk Mekonnen",
  "Daniel Bekele",
  "Nahom Esrael",
  "Hana Worku",
];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0]!;
}

function isoMonthStart(monthsAgo = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo, 1);
  return d.toISOString().split("T")[0]!;
}

function isoMonthEnd(monthsAgo = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo + 1, 0);
  return d.toISOString().split("T")[0]!;
}

function seedTargets(): SalesTarget[] {
  const deals = initialDeals;

  return [
    {
      id: "target-1",
      name: "May Revenue Target",
      metric: "Revenue",
      targetValue: 15_000_000,
      achievedValue: 8_925_000,
      assignedTo: "Sara Tesfaye",
      startDate: isoMonthStart(0),
      endDate: isoMonthEnd(0),
      status: "active",
      contributingDealIds: [deals[0]?.id, deals[2]?.id, deals[4]?.id].filter(Boolean) as string[],
    },
    {
      id: "target-2",
      name: "Q2 Pipeline Growth",
      metric: "Revenue",
      targetValue: 25_000_000,
      achievedValue: 21_500_000,
      assignedTo: "Biruk Mekonnen",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      status: "active",
      contributingDealIds: [deals[1]?.id, deals[3]?.id, deals[5]?.id].filter(Boolean) as string[],
    },
    {
      id: "target-3",
      name: "April Closing Push",
      metric: "Revenue",
      targetValue: 12_000_000,
      achievedValue: 12_000_000,
      assignedTo: "Daniel Bekele",
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      status: "active",
      contributingDealIds: [deals[6]?.id, deals[7]?.id].filter(Boolean) as string[],
    },
    {
      id: "target-4",
      name: "New Accounts Revenue",
      metric: "Revenue",
      targetValue: 8_000_000,
      achievedValue: 2_400_000,
      assignedTo: "Nahom Esrael",
      startDate: isoMonthStart(0),
      endDate: isoMonthEnd(0),
      status: "active",
      contributingDealIds: [deals[0]?.id].filter(Boolean) as string[],
    },
    {
      id: "target-5",
      name: "March Target (Completed)",
      metric: "Revenue",
      targetValue: 10_000_000,
      achievedValue: 7_200_000,
      assignedTo: "Hana Worku",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      status: "inactive",
      contributingDealIds: [],
    },
  ];
}

export const initialTargets: SalesTarget[] = seedTargets();
