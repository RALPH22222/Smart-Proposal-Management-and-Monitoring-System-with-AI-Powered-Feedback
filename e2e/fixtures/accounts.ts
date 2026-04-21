import "dotenv/config";
import path from "path";

export type Role = "proponent" | "rnd" | "evaluator" | "admin";

export interface Account {
  role: Role;
  email: string;
  password: string;
  dashboardPath: string;
}

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env var ${name} — copy e2e/.env.example to e2e/.env`);
  return value;
}

const password = env("FIXTURE_PASSWORD");

export const accounts: Record<Role, Account> = {
  proponent: {
    role: "proponent",
    email: env("FIXTURE_PROPONENT_EMAIL"),
    password,
    dashboardPath: "/users/Proponent/ProponentMainLayout",
  },
  rnd: {
    role: "rnd",
    email: env("FIXTURE_RND_EMAIL"),
    password,
    dashboardPath: "/users/rnd/rndMainLayout",
  },
  evaluator: {
    role: "evaluator",
    email: env("FIXTURE_EVALUATOR_EMAIL"),
    password,
    dashboardPath: "/users/evaluator/evaluatorMainLayout",
  },
  admin: {
    role: "admin",
    email: env("FIXTURE_ADMIN_EMAIL"),
    password,
    dashboardPath: "/users/admin/adminMainLayout",
  },
};

// Absolute path so it resolves identically no matter which cwd Playwright
// runs from (config cwd vs per-test cwd vs webServer cwd).
const AUTH_DIR = path.resolve(__dirname, "..", ".auth");
export const authStateFile = (role: Role) => path.join(AUTH_DIR, `${role}.json`);
