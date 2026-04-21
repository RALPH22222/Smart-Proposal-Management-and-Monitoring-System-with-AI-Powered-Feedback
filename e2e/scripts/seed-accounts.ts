/**
 * Seeds the 4 fixture accounts used by the e2e test suite.
 *
 * Why this exists: the tests drive the real frontend → real backend → real
 * Supabase, so they need real auth users to log into. Registering through
 * the UI requires email verification, which is impractical inside a test
 * run — so we use the Supabase service_role key to create verified users
 * server-side, once, before tests start.
 *
 * This script is idempotent: re-running it updates existing fixture users
 * in place rather than failing. Safe to run any time the password policy
 * changes or an account gets locked out.
 *
 * Usage:
 *   cd e2e
 *   cp .env.example .env         # fill in SUPABASE_SERVICE_ROLE_KEY
 *   npm install
 *   npm run seed
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

type FixtureRole = "proponent" | "rnd" | "evaluator" | "admin";

interface Fixture {
  role: FixtureRole;
  email: string;
  firstName: string;
  lastName: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name} (see e2e/.env.example)`);
  }
  return value;
}

const SUPABASE_URL = required("SUPABASE_URL");
const SERVICE_ROLE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");
const FIXTURE_PASSWORD = required("FIXTURE_PASSWORD");

const fixtures: Fixture[] = [
  {
    role: "proponent",
    email: required("FIXTURE_PROPONENT_EMAIL"),
    firstName: "E2E",
    lastName: "Proponent",
  },
  {
    role: "rnd",
    email: required("FIXTURE_RND_EMAIL"),
    firstName: "E2E",
    lastName: "RND",
  },
  {
    role: "evaluator",
    email: required("FIXTURE_EVALUATOR_EMAIL"),
    firstName: "E2E",
    lastName: "Evaluator",
  },
  {
    role: "admin",
    email: required("FIXTURE_ADMIN_EMAIL"),
    firstName: "E2E",
    lastName: "Admin",
  },
];

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveDepartmentId(): Promise<number | null> {
  if (process.env.FIXTURE_DEPARTMENT_ID) {
    return Number(process.env.FIXTURE_DEPARTMENT_ID);
  }
  const { data, error } = await admin.from("departments").select("id").order("id").limit(1);
  if (error) {
    console.warn("Could not auto-resolve department_id:", error.message);
    return null;
  }
  return data?.[0]?.id ?? null;
}

async function findUserByEmail(email: string) {
  // listUsers paginates 50 at a time — fixture emails are unique enough that
  // page 1 is almost always sufficient, but iterate defensively.
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 100) return null;
    page += 1;
  }
}

async function upsertFixture(fx: Fixture, departmentId: number | null) {
  const metadata = {
    first_name: fx.firstName,
    last_name: fx.lastName,
    name: `${fx.firstName} ${fx.lastName}`,
    roles: [fx.role],
    role: fx.role,
  };

  const existing = await findUserByEmail(fx.email);

  if (existing) {
    // Reset password + re-confirm email + re-sync roles metadata so the
    // fixture is usable even if a prior test locked the account or changed
    // its password.
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: FIXTURE_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw new Error(`updateUserById(${fx.email}): ${error.message}`);
    console.log(`  updated  ${fx.role.padEnd(10)} ${fx.email}`);
    await syncPublicUser(existing.id, fx, departmentId);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: fx.email,
    password: FIXTURE_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw new Error(`createUser(${fx.email}): ${error.message}`);
  console.log(`  created  ${fx.role.padEnd(10)} ${fx.email}`);
  await syncPublicUser(data.user.id, fx, departmentId);
}

async function syncPublicUser(userId: string, fx: Fixture, departmentId: number | null) {
  // The handle_new_user trigger auto-inserts into public.users, but we need
  // to top up the fields that aren't in the auth metadata and make sure the
  // roles array, profile_completed flag, and account_type are correct so
  // the frontend doesn't send us through profile-setup on login.
  const patch: Record<string, unknown> = {
    id: userId,
    email: fx.email,
    first_name: fx.firstName,
    last_name: fx.lastName,
    roles: [fx.role],
    profile_completed: true,
    is_disabled: false,
    account_type: "internal",
  };
  if (departmentId !== null) patch.department_id = departmentId;

  const { error } = await admin.from("users").upsert(patch, { onConflict: "id" });
  if (error) {
    // If the public.users row is missing (trigger failed for some reason),
    // upsert creates it. If upsert still fails, log and continue — the auth
    // user exists, the test can still log in.
    console.warn(`  (warn) could not sync public.users for ${fx.email}: ${error.message}`);
  }
}

async function main() {
  console.log("Seeding SPMAMS e2e fixture accounts →", SUPABASE_URL);

  const departmentId = await resolveDepartmentId();
  if (departmentId === null) {
    console.warn("No department_id available — accounts will be created without a department.");
  } else {
    console.log(`Using department_id=${departmentId} for all fixtures.`);
  }

  for (const fx of fixtures) {
    await upsertFixture(fx, departmentId);
  }

  console.log("\nDone. Fixture credentials:");
  for (const fx of fixtures) {
    console.log(`  ${fx.role.padEnd(10)} ${fx.email}  (password: from FIXTURE_PASSWORD)`);
  }
  console.log("\nRun `npm test` to execute the suite.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
