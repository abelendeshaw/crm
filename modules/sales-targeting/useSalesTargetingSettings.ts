"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DealCurrency } from "@/data/dealsManagementData";
import {
  cloneLeadTargetingSettings,
  migrateCurrencyTarget,
  syncAllTargetingLayers,
  type CurrencyQuarterlyTargets,
  type LeadTargetingSettings,
} from "@/data/leadsTargetsData";
import { mockLeadStore } from "@/data/mockStore";

export function useSalesTargetingSettings() {
  const [settings, setSettings] = useState<LeadTargetingSettings>(() =>
    cloneLeadTargetingSettings(mockLeadStore.targetingSettings),
  );
  const [saved, setSaved] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<DealCurrency>(
    () => mockLeadStore.targetingSettings.currencyTargets[0]?.currency ?? "ETB",
  );

  useEffect(() => {
    return mockLeadStore.subscribeTargetingSettings((next) => {
      setSettings(cloneLeadTargetingSettings(next));
    });
  }, []);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(settings) !==
      JSON.stringify(cloneLeadTargetingSettings(mockLeadStore.targetingSettings)),
    [settings],
  );

  const activeCurrencyTarget = useMemo(
    () => settings.currencyTargets.find((ct) => ct.currency === activeCurrency),
    [settings.currencyTargets, activeCurrency],
  );

  const updateCurrencyTargets = useCallback(
    (
      currency: DealCurrency,
      updater: (ct: CurrencyQuarterlyTargets) => void,
      options?: { persist?: boolean },
    ) => {
      setSettings((current) => {
        const next = cloneLeadTargetingSettings(current);
        const row = next.currencyTargets.find((ct) => ct.currency === currency);
        if (!row) return next;

        updater(row);

        if (!options?.persist) return next;

        const synced = cloneLeadTargetingSettings(next);
        synced.currencyTargets = synced.currencyTargets.map((ct) => syncAllTargetingLayers(ct));
        mockLeadStore.targetingSettings = synced;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return synced;
      });
    },
    [],
  );

  const save = useCallback(() => {
    const synced = cloneLeadTargetingSettings(settings);
    synced.currencyTargets = synced.currencyTargets.map((ct) => syncAllTargetingLayers(ct));
    mockLeadStore.targetingSettings = synced;
    setSettings(synced);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  return {
    settings,
    setSettings,
    saved,
    hasChanges,
    save,
    activeCurrency,
    setActiveCurrency,
    activeCurrencyTarget,
    updateCurrencyTargets,
    migrateCurrencyTarget,
  };
}
