export type UserStatus = "Active" | "Inactive" | "Pending" | "Suspended";
export type UserRole =
  | "Super Admin"
  | "Admin"
  | "Sales Manager"
  | "Sales Rep"
  | "Viewer"
  | "Support Agent";

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  branch: string;
  team: string;
  manager: string;
  status: UserStatus;
  avatar?: string;
  joinedAt: string;
  lastActive: string;
  customPermissions?: Record<string, Record<string, boolean>>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  isSystem: boolean;
  permissions: Record<string, Record<string, boolean>>;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  department: string;
  branch: string;
  manager: string;
  membersCount: number;
  members: string[];
  description: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  email: string;
  departmentsCount: number;
  usersCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  branch: string;
  head: string;
  description: string;
  usersCount: number;
  teamsCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

export const CRM_MODULES = [
  "Leads",
  "Deals",
  "Contacts",
  "Activities",
  "Reports",
  "Settings",
  "Users",
];

export const MODULE_ACTIONS = ["View", "Create", "Edit", "Delete", "Export"];

export const users: CRMUser[] = [
  {
    id: "u1",
    name: "Nahom Esrael",
    email: "nahom@company.com",
    phone: "0912345678",
    role: "Super Admin",
    department: "Management",
    branch: "Addis Ababa HQ",
    team: "Executive",
    manager: "—",
    status: "Active",
    joinedAt: "2024-01-15",
    lastActive: "2025-04-21",
  },
  {
    id: "u2",
    name: "Sara Tesfaye",
    email: "sara@company.com",
    phone: "0911234567",
    role: "Sales Manager",
    department: "Sales",
    branch: "Addis Ababa HQ",
    team: "Sales Team A",
    manager: "Nahom Esrael",
    status: "Active",
    joinedAt: "2024-02-10",
    lastActive: "2025-04-20",
  },
  {
    id: "u3",
    name: "Abel Girma",
    email: "abel@company.com",
    phone: "0913456789",
    role: "Sales Rep",
    department: "Sales",
    branch: "Addis Ababa HQ",
    team: "Sales Team A",
    manager: "Sara Tesfaye",
    status: "Active",
    joinedAt: "2024-03-05",
    lastActive: "2025-04-19",
  },
  {
    id: "u4",
    name: "Meron Haile",
    email: "meron@company.com",
    phone: "0914567890",
    role: "Sales Rep",
    department: "Sales",
    branch: "Dire Dawa Branch",
    team: "Sales Team B",
    manager: "Sara Tesfaye",
    status: "Active",
    joinedAt: "2024-03-12",
    lastActive: "2025-04-18",
  },
  {
    id: "u5",
    name: "Daniel Bekele",
    email: "daniel@company.com",
    phone: "0915678901",
    role: "Admin",
    department: "IT",
    branch: "Addis Ababa HQ",
    team: "IT Team",
    manager: "Nahom Esrael",
    status: "Active",
    joinedAt: "2024-01-20",
    lastActive: "2025-04-21",
  },
  {
    id: "u6",
    name: "Tigist Alemu",
    email: "tigist@company.com",
    phone: "0916789012",
    role: "Viewer",
    department: "Finance",
    branch: "Addis Ababa HQ",
    team: "Finance Team",
    manager: "Daniel Bekele",
    status: "Inactive",
    joinedAt: "2024-04-01",
    lastActive: "2025-03-15",
  },
  {
    id: "u7",
    name: "Yonas Tadesse",
    email: "yonas@company.com",
    phone: "0917890123",
    role: "Sales Rep",
    department: "Sales",
    branch: "Hawassa Branch",
    team: "Sales Team C",
    manager: "Sara Tesfaye",
    status: "Pending",
    joinedAt: "2025-04-10",
    lastActive: "—",
  },
  {
    id: "u8",
    name: "Hana Worku",
    email: "hana@company.com",
    phone: "0918901234",
    role: "Support Agent",
    department: "Customer Support",
    branch: "Addis Ababa HQ",
    team: "Support Team",
    manager: "Daniel Bekele",
    status: "Active",
    joinedAt: "2024-05-15",
    lastActive: "2025-04-20",
  },
  {
    id: "u9",
    name: "Biruk Mekonnen",
    email: "biruk@company.com",
    phone: "0919012345",
    role: "Sales Manager",
    department: "Sales",
    branch: "Bahir Dar Branch",
    team: "Sales Team D",
    manager: "Nahom Esrael",
    status: "Active",
    joinedAt: "2024-02-28",
    lastActive: "2025-04-17",
  },
  {
    id: "u10",
    name: "Liya Solomon",
    email: "liya@company.com",
    phone: "0910123456",
    role: "Sales Rep",
    department: "Sales",
    branch: "Bahir Dar Branch",
    team: "Sales Team D",
    manager: "Biruk Mekonnen",
    status: "Suspended",
    joinedAt: "2024-06-01",
    lastActive: "2025-02-10",
  },
];

export const roles: Role[] = [
  {
    id: "r1",
    name: "Super Admin",
    description: "Full access to all CRM modules and system settings",
    usersCount: 1,
    isSystem: true,
    createdAt: "2024-01-01",
    permissions: Object.fromEntries(
      CRM_MODULES.map((mod) => [
        mod,
        Object.fromEntries(MODULE_ACTIONS.map((a) => [a, true])),
      ])
    ),
  },
  {
    id: "r2",
    name: "Admin",
    description: "Manage users, roles, and most CRM settings",
    usersCount: 1,
    isSystem: true,
    createdAt: "2024-01-01",
    permissions: {
      Leads: { View: true, Create: true, Edit: true, Delete: true, Export: true },
      Deals: { View: true, Create: true, Edit: true, Delete: true, Export: true },
      Contacts: { View: true, Create: true, Edit: true, Delete: true, Export: true },
      Activities: { View: true, Create: true, Edit: true, Delete: true, Export: false },
      Reports: { View: true, Create: true, Edit: false, Delete: false, Export: true },
      Settings: { View: true, Create: true, Edit: true, Delete: false, Export: false },
      Users: { View: true, Create: true, Edit: true, Delete: false, Export: true },
    },
  },
  {
    id: "r3",
    name: "Sales Manager",
    description: "Manage sales team, leads, deals and view reports",
    usersCount: 2,
    isSystem: false,
    createdAt: "2024-01-15",
    permissions: {
      Leads: { View: true, Create: true, Edit: true, Delete: true, Export: true },
      Deals: { View: true, Create: true, Edit: true, Delete: false, Export: true },
      Contacts: { View: true, Create: true, Edit: true, Delete: false, Export: true },
      Activities: { View: true, Create: true, Edit: true, Delete: false, Export: false },
      Reports: { View: true, Create: false, Edit: false, Delete: false, Export: true },
      Settings: { View: false, Create: false, Edit: false, Delete: false, Export: false },
      Users: { View: true, Create: false, Edit: false, Delete: false, Export: false },
    },
  },
  {
    id: "r4",
    name: "Sales Rep",
    description: "Create and manage own leads and deals",
    usersCount: 4,
    isSystem: false,
    createdAt: "2024-01-15",
    permissions: {
      Leads: { View: true, Create: true, Edit: true, Delete: false, Export: false },
      Deals: { View: true, Create: true, Edit: true, Delete: false, Export: false },
      Contacts: { View: true, Create: true, Edit: true, Delete: false, Export: false },
      Activities: { View: true, Create: true, Edit: true, Delete: false, Export: false },
      Reports: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false, Export: false },
      Users: { View: false, Create: false, Edit: false, Delete: false, Export: false },
    },
  },
  {
    id: "r5",
    name: "Viewer",
    description: "Read-only access to leads, deals and contacts",
    usersCount: 1,
    isSystem: false,
    createdAt: "2024-02-01",
    permissions: {
      Leads: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Deals: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Contacts: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Activities: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Reports: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false, Export: false },
      Users: { View: false, Create: false, Edit: false, Delete: false, Export: false },
    },
  },
  {
    id: "r6",
    name: "Support Agent",
    description: "Handle customer support tickets and contacts",
    usersCount: 1,
    isSystem: false,
    createdAt: "2024-03-01",
    permissions: {
      Leads: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Deals: { View: false, Create: false, Edit: false, Delete: false, Export: false },
      Contacts: { View: true, Create: true, Edit: true, Delete: false, Export: false },
      Activities: { View: true, Create: true, Edit: true, Delete: false, Export: false },
      Reports: { View: false, Create: false, Edit: false, Delete: false, Export: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false, Export: false },
      Users: { View: false, Create: false, Edit: false, Delete: false, Export: false },
    },
  },
];

export const teams: Team[] = [
  {
    id: "t1",
    name: "Sales Team A",
    department: "Sales",
    branch: "Addis Ababa HQ",
    manager: "Sara Tesfaye",
    membersCount: 3,
    members: ["Abel Girma", "Hana Worku", "Tigist Alemu"],
    description: "Core sales team covering Addis Ababa region",
    createdAt: "2024-01-20",
  },
  {
    id: "t2",
    name: "Sales Team B",
    department: "Sales",
    branch: "Dire Dawa Branch",
    manager: "Meron Haile",
    membersCount: 2,
    members: ["Meron Haile", "Yonas Tadesse"],
    description: "Sales team for Dire Dawa and Eastern region",
    createdAt: "2024-02-05",
  },
  {
    id: "t3",
    name: "Sales Team C",
    department: "Sales",
    branch: "Hawassa Branch",
    manager: "Sara Tesfaye",
    membersCount: 2,
    members: ["Yonas Tadesse", "Liya Solomon"],
    description: "Sales coverage for Southern Ethiopia",
    createdAt: "2024-02-15",
  },
  {
    id: "t4",
    name: "Sales Team D",
    department: "Sales",
    branch: "Bahir Dar Branch",
    manager: "Biruk Mekonnen",
    membersCount: 2,
    members: ["Biruk Mekonnen", "Liya Solomon"],
    description: "Sales team for Northern Ethiopia",
    createdAt: "2024-03-01",
  },
  {
    id: "t5",
    name: "IT Team",
    department: "IT",
    branch: "Addis Ababa HQ",
    manager: "Daniel Bekele",
    membersCount: 1,
    members: ["Daniel Bekele"],
    description: "System administration and technical support",
    createdAt: "2024-01-20",
  },
  {
    id: "t6",
    name: "Support Team",
    department: "Customer Support",
    branch: "Addis Ababa HQ",
    manager: "Hana Worku",
    membersCount: 1,
    members: ["Hana Worku"],
    description: "Customer support and after-sales service",
    createdAt: "2024-05-20",
  },
];

export const branches: Branch[] = [
  {
    id: "b1",
    name: "Addis Ababa HQ",
    location: "Bole, Addis Ababa",
    manager: "Nahom Esrael",
    phone: "0111234567",
    email: "hq@company.com",
    departmentsCount: 4,
    usersCount: 6,
    status: "Active",
    createdAt: "2024-01-01",
  },
  {
    id: "b2",
    name: "Dire Dawa Branch",
    location: "Dire Dawa City",
    manager: "Meron Haile",
    phone: "0252345678",
    email: "diredawa@company.com",
    departmentsCount: 1,
    usersCount: 1,
    status: "Active",
    createdAt: "2024-02-01",
  },
  {
    id: "b3",
    name: "Hawassa Branch",
    location: "Hawassa, SNNPR",
    manager: "Yonas Tadesse",
    phone: "0462345678",
    email: "hawassa@company.com",
    departmentsCount: 1,
    usersCount: 1,
    status: "Active",
    createdAt: "2024-02-15",
  },
  {
    id: "b4",
    name: "Bahir Dar Branch",
    location: "Bahir Dar, Amhara",
    manager: "Biruk Mekonnen",
    phone: "0582345678",
    email: "bahirdar@company.com",
    departmentsCount: 1,
    usersCount: 2,
    status: "Active",
    createdAt: "2024-03-01",
  },
  {
    id: "b5",
    name: "Mekelle Branch",
    location: "Mekelle, Tigray",
    manager: "—",
    phone: "0342345678",
    email: "mekelle@company.com",
    departmentsCount: 0,
    usersCount: 0,
    status: "Inactive",
    createdAt: "2024-06-01",
  },
];

export const departments: Department[] = [
  {
    id: "d1",
    name: "Sales",
    branch: "Addis Ababa HQ",
    head: "Sara Tesfaye",
    description: "Responsible for all sales activities and revenue generation",
    usersCount: 5,
    teamsCount: 4,
    status: "Active",
    createdAt: "2024-01-01",
  },
  {
    id: "d2",
    name: "Management",
    branch: "Addis Ababa HQ",
    head: "Nahom Esrael",
    description: "Executive and top-level management",
    usersCount: 1,
    teamsCount: 1,
    status: "Active",
    createdAt: "2024-01-01",
  },
  {
    id: "d3",
    name: "IT",
    branch: "Addis Ababa HQ",
    head: "Daniel Bekele",
    description: "Information technology and system administration",
    usersCount: 1,
    teamsCount: 1,
    status: "Active",
    createdAt: "2024-01-01",
  },
  {
    id: "d4",
    name: "Finance",
    branch: "Addis Ababa HQ",
    head: "Tigist Alemu",
    description: "Financial management and accounting",
    usersCount: 1,
    teamsCount: 1,
    status: "Active",
    createdAt: "2024-01-01",
  },
  {
    id: "d5",
    name: "Customer Support",
    branch: "Addis Ababa HQ",
    head: "Hana Worku",
    description: "Customer service and after-sales support",
    usersCount: 1,
    teamsCount: 1,
    status: "Active",
    createdAt: "2024-05-01",
  },
];