import { teams } from "@/data/userManagementData";

export type PresalesTeam = {
  id: string;
  name: string;
  manager: string;
  members: string[];
};

export function getPresalesTeams(): PresalesTeam[] {
  return teams
    .filter((team) => team.department === "Pre-sales")
    .map((team) => ({
      id: team.id,
      name: team.name,
      manager: team.manager,
      members: team.members,
    }));
}

export function findPresalesTeamByMember(memberName: string): PresalesTeam | null {
  if (!memberName) return null;
  return getPresalesTeams().find((team) => team.members.includes(memberName)) ?? null;
}

export function findPresalesTeamById(teamId: string): PresalesTeam | null {
  if (!teamId) return null;
  return getPresalesTeams().find((team) => team.id === teamId) ?? null;
}
