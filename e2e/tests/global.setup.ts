import { test as setup, expect } from "@playwright/test";
import { existsSync, mkdirSync } from "fs";
import { accounts, authStateFile, Role } from "../fixtures/accounts";
import { loginAs } from "../helpers/auth";
import path from "path";

/**
 * Global setup: logs into each role once and persists storage state to
 * disk. Every subsequent test reuses these storage states via the shared
 * fixture, so we pay the login cost four times per run instead of once
 * per test. If a storage state is missing when tests start, they fail
 * fast with a clear message rather than redirecting to /login.
 */

const authDir = path.resolve(__dirname, "..", ".auth");
if (!existsSync(authDir)) mkdirSync(authDir, { recursive: true });

for (const role of Object.keys(accounts) as Role[]) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const account = accounts[role];
    await loginAs(page, account);
    // Sanity check: the dashboard rendered something role-specific.
    await expect(page).toHaveURL(new RegExp(role, "i"));
    await page.context().storageState({ path: authStateFile(role) });
  });
}
