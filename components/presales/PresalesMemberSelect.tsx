"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  findPresalesTeamById,
  findPresalesTeamByMember,
  getPresalesTeams,
} from "@/data/presalesTeamsData";

function TeamLeadBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-4 border-[#bfdbfe] bg-[#eff6ff] px-1 text-[9px] font-semibold uppercase tracking-wide text-[#1d4ed8]",
        className,
      )}
    >
      TL
    </Badge>
  );
}

export function PresalesMemberSelect({
  value,
  onValueChange,
  triggerClassName = "h-9 border-[#e5e7eb]",
  disabled = false,
}: {
  value: string;
  onValueChange: (member: string) => void;
  triggerClassName?: string;
  disabled?: boolean;
}) {
  const teams = useMemo(() => getPresalesTeams(), []);

  const resolvedTeamId = useMemo(() => findPresalesTeamByMember(value)?.id ?? "", [value]);

  const [teamId, setTeamId] = useState(resolvedTeamId);

  useEffect(() => {
    setTeamId(resolvedTeamId);
  }, [resolvedTeamId]);

  const selectedTeam = findPresalesTeamById(teamId);

  const handleTeamChange = (nextTeamId: string) => {
    setTeamId(nextTeamId);
    const team = findPresalesTeamById(nextTeamId);
    if (!team || !team.members.includes(value)) {
      onValueChange("");
    }
  };

  const handleClearTeam = () => {
    setTeamId("");
    onValueChange("");
  };

  return (
    <div
      className={cn(
        "flex min-h-9 items-center gap-2",
        !selectedTeam && "w-full",
      )}
    >
      {selectedTeam ? (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={handleClearTeam}
            className={cn(
              "inline-flex h-9 max-w-[46%] shrink-0 items-center gap-1.5 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-2.5 text-[11px] font-medium text-[#1d4ed8] transition-colors",
              "hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label={`Remove ${selectedTeam.name}`}
          >
            <span className="truncate">{selectedTeam.name}</span>
            <X className="size-3 shrink-0 opacity-70" />
          </button>

          <Select
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(triggerClassName, "min-w-0 flex-1")}>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {selectedTeam.members.map((member) => (
                <SelectItem key={member} value={member}>
                  <span className="flex items-center gap-2">
                    <span>{member}</span>
                    {member === selectedTeam.manager ? <TeamLeadBadge /> : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : (
        <Select
          value={teamId}
          onValueChange={handleTeamChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn(triggerClassName, "w-full")}>
            <SelectValue placeholder="Select pre-sales team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
