"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { PipelineStageCategory } from "@/data/dealsManagementData";

export type FinalizationOutcome = "won" | "lost";

export function categoryToFinalization(category: PipelineStageCategory): {
  isFinalization: boolean;
  outcome: FinalizationOutcome;
} {
  return {
    isFinalization: category !== "open",
    outcome: category === "lost" ? "lost" : "won",
  };
}

export function finalizationToCategory(
  isFinalization: boolean,
  outcome: FinalizationOutcome,
): PipelineStageCategory {
  return isFinalization ? outcome : "open";
}

export function StageFinalizationFields({
  entityLabel,
  isFinalization,
  outcome,
  onFinalizationChange,
  onOutcomeChange,
  disabled = false,
}: {
  entityLabel: "lead" | "deal";
  isFinalization: boolean;
  outcome: FinalizationOutcome;
  onFinalizationChange: (value: boolean) => void;
  onOutcomeChange: (value: FinalizationOutcome) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#1c1e21]">Finalization stage</p>
          <p className="text-xs text-[#6b7280]">
            Treat this as a closing stage when a {entityLabel} reaches it
          </p>
        </div>
        <Switch
          checked={isFinalization}
          onCheckedChange={onFinalizationChange}
          disabled={disabled}
        />
      </div>
      {isFinalization ? (
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
            Outcome
          </label>
          <Select
            value={outcome}
            onValueChange={(value) => onOutcomeChange(value as FinalizationOutcome)}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 border-[#e5e7eb] bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
