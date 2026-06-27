export type DemoUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  profile: {
    first_time_login: boolean;
  };
};

export const demoUsers: Record<string, DemoUser> = {
  "contractor@astrobuilds.com": {
    id: 1,
    name: "Alex Contractor",
    email: "contractor@astrobuilds.com",
    role: "Contractor",
    profile: { first_time_login: false },
  },
  "engineer@astrobuilds.com": {
    id: 2,
    name: "Nina Engineer",
    email: "engineer@astrobuilds.com",
    role: "Site Engineer",
    profile: { first_time_login: false },
  },
  "owner@astrobuilds.com": {
    id: 3,
    name: "Priya Owner",
    email: "owner@astrobuilds.com",
    role: "Project Owner",
    profile: { first_time_login: false },
  },
};

export function getDemoUser(email: string): DemoUser | null {
  const normalized = email.trim().toLowerCase();
  if (demoUsers[normalized]) return demoUsers[normalized];

  const role = normalized.includes("owner")
    ? "Project Owner"
    : normalized.includes("engineer")
      ? "Site Engineer"
      : "Contractor";

  return {
    id: 99,
    name: "Demo User",
    email: normalized || "demo@astrobuilds.com",
    role,
    profile: { first_time_login: false },
  };
}

export function isDemoSessionEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("demo_mode") === "true";
}

export function persistDemoSession(user: DemoUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", "demo-token");
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("demo_mode", "true");
  localStorage.removeItem("selected_project_id");
}

export function getDemoProjects(role: string) {
  const baseProjects = [
    {
      id: 1,
      name: "North Harbor Tower",
      code: "NHT-204",
      location: "Mumbai, India",
      budget: 5400000,
      status: "In Progress",
      progress: 68,
      building_type: "Commercial",
    },
    {
      id: 2,
      name: "River View Villas",
      code: "RVV-118",
      location: "Pune, India",
      budget: 3200000,
      status: "Planning",
      progress: 24,
      building_type: "Residential",
    },
  ];

  if (role === "Project Owner") {
    return baseProjects.slice(0, 1);
  }

  return baseProjects;
}
