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

export type FiscalYearConfig = {
  year: number;
  quarterDefinitions: FiscalQuarterDefinition[];
};

export function defaultQuarterDefinitions(): FiscalQuarterDefinition[] {
  return ([1, 2, 3, 4] as const).map((q) => ({
    q,
    periodLabel: QUARTER_SHORT_LABELS[q],
  }));
}

export function cloneFiscalYearConfig(config: FiscalYearConfig): FiscalYearConfig {
  return {
    year: config.year,
    quarterDefinitions: config.quarterDefinitions.map((row) => ({ ...row })),
  };
}

export function defaultFiscalYearCatalog(activeYear = 2026): FiscalYearConfig[] {
  return [activeYear - 1, activeYear, activeYear + 1].map((year) => ({
    year,
    quarterDefinitions: defaultQuarterDefinitions(),
  }));
}

export function formatFiscalYearQuartersSummary(
  quarterDefinitions: FiscalQuarterDefinition[],
): string {
  return ([1, 2, 3, 4] as const)
    .map((q) => {
      const label =
        quarterDefinitions.find((row) => row.q === q)?.periodLabel ??
        QUARTER_SHORT_LABELS[q];
      return `Q${q} ${label}`;
    })
    .join(" · ");
}

export function getQuarterPeriodLabel(
  quarterDefinitions: FiscalQuarterDefinition[] | undefined,
  q: LeadQuarter,
): string {
  return (
    quarterDefinitions?.find((row) => row.q === q)?.periodLabel ?? QUARTER_SHORT_LABELS[q]
  );
}
