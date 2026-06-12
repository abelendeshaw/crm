export type LeadQuarter = 1 | 2 | 3 | 4;

export const QUARTER_SHORT_LABELS: Record<LeadQuarter, string> = {
  1: "Jan – Mar",
  2: "Apr – Jun",
  3: "Jul – Sep",
  4: "Oct – Dec",
};

export type FiscalQuarterDefinition = {
  q: LeadQuarter;
  periodLabel: string;
};

export function defaultQuarterDefinitions(): FiscalQuarterDefinition[] {
  return ([1, 2, 3, 4] as const).map((q) => ({
    q,
    periodLabel: QUARTER_SHORT_LABELS[q],
  }));
}

export function getQuarterPeriodLabel(
  quarterDefinitions: FiscalQuarterDefinition[] | undefined,
  q: LeadQuarter,
): string {
  return (
    quarterDefinitions?.find((row) => row.q === q)?.periodLabel ?? QUARTER_SHORT_LABELS[q]
  );
}
