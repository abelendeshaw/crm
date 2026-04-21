export type UserStatus = "active" | "pending" | "suspended";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  branch: string;
  manager: string;
  status: UserStatus;
  mfa: boolean;
};

export const users: User[] = [
  {
    id: "u1",
    name: "Nahom Esrael",
    email: "nahom@company.com",
    role: "Branch Manager",
    team: "Enterprise Sales",
    branch: "Addis HQ",
    manager: "Meron Bekele",
    status: "active",
    mfa: true,
  },
  {
    id: "u2",
    name: "Robel Solomon",
    email: "robel@company.com",
    role: "Sales Agent",
    team: "East Region",
    branch: "Dire Dawa",
    manager: "Nahom Esrael",
    status: "pending",
    mfa: false,
  },
  {
    id: "u3",
    name: "Samrawit Hailu",
    email: "samrawit@company.com",
    role: "CRM Admin",
    team: "Customer Success",
    branch: "Addis HQ",
    manager: "Yonas Mulu",
    status: "active",
    mfa: true,
  },
  {
    id: "u4",
    name: "Kidus Alemu",
    email: "kidus@company.com",
    role: "Sales Agent",
    team: "SMB Sales",
    branch: "Mekelle",
    manager: "Nahom Esrael",
    status: "suspended",
    mfa: false,
  },
];

export function getUserById(id: string) {
  return users.find((user) => user.id === id);
}
