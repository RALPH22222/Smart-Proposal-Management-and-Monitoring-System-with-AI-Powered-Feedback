import { test as base, expect, Page, BrowserContext, Browser } from "@playwright/test";
import { accounts, authStateFile, Role } from "./accounts";
import path from "path";

/**
 * Shared test fixture with:
 *  - `loggedInAs(role)` → returns a fresh Page already authenticated as `role`,
 *    by loading the storage state written by tests/global.setup.ts.
 *
 * This lets a single test talk to multiple roles (e.g. proponent submits,
 * rnd reviews) without logging in through the UI more than once.
 */

type LoggedInContext = {
  page: Page;
  context: BrowserContext;
  close: () => Promise<void>;
};

type SpmamsFixtures = {
  loggedInAs: (role: Role) => Promise<LoggedInContext>;
};

export const test = base.extend<SpmamsFixtures>({
  loggedInAs: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const factory = async (role: Role): Promise<LoggedInContext> => {
      const context = await browser.newContext({
        storageState: authStateFile(role),
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(accounts[role].dashboardPath);
      contexts.push(context);
      return {
        page,
        context,
        close: async () => {
          await context.close();
        },
      };
    };

    await use(factory);

    for (const ctx of contexts) {
      await ctx.close().catch(() => {});
    }
  },
});

export { expect };

export const fixtureFile = (name: string) => path.resolve(__dirname, "files", name);
