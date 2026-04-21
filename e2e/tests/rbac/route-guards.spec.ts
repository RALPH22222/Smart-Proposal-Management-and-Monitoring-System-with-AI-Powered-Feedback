import { test, expect } from "../../fixtures/test";
import { accounts } from "../../fixtures/accounts";

/**
 * RBAC: role-based route protection. Every role should reach its own
 * dashboard and be denied others. Unauthenticated visits redirect to
 * /login (or the landing page, depending on the route).
 */

const crossRoutes = [
  { role: "proponent" as const, forbiddenPath: accounts.admin.dashboardPath, name: "admin" },
  { role: "proponent" as const, forbiddenPath: accounts.rnd.dashboardPath, name: "rnd" },
  { role: "proponent" as const, forbiddenPath: accounts.evaluator.dashboardPath, name: "evaluator" },
  { role: "evaluator" as const, forbiddenPath: accounts.admin.dashboardPath, name: "admin" },
  { role: "evaluator" as const, forbiddenPath: accounts.rnd.dashboardPath, name: "rnd" },
  { role: "evaluator" as const, forbiddenPath: accounts.proponent.dashboardPath, name: "proponent" },
  { role: "rnd" as const, forbiddenPath: accounts.admin.dashboardPath, name: "admin" },
  { role: "rnd" as const, forbiddenPath: accounts.evaluator.dashboardPath, name: "evaluator" },
];

test.describe("RBAC: cross-role route access", () => {
  for (const { role, forbiddenPath, name } of crossRoutes) {
    test(`RBAC-${role.toUpperCase()}-${name.toUpperCase()}: ${role} cannot access ${name} dashboard`, async ({
      loggedInAs,
    }) => {
      const { page } = await loggedInAs(role);
      await page.goto(forbiddenPath);
      // ProtectedRoute redirects to the user's own dashboard (or /login
      // if somehow unauthenticated). Verify we did NOT land on the
      // forbidden path.
      await expect(page).not.toHaveURL(new RegExp(forbiddenPath.split("/").pop()!, "i"));
    });
  }
});

test.describe("RBAC: unauthenticated access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("RBAC-ANON-01: unauthenticated user on /users/admin/... redirects to /login", async ({ page }) => {
    await page.goto(accounts.admin.dashboardPath);
    await page.waitForURL(/login|\/$/i, { timeout: 15_000 });
  });

  test("RBAC-ANON-02: unauthenticated user on /users/rnd/... redirects to /login", async ({ page }) => {
    await page.goto(accounts.rnd.dashboardPath);
    await page.waitForURL(/login|\/$/i, { timeout: 15_000 });
  });

  test("RBAC-ANON-03: unauthenticated user on /users/evaluator/... redirects to /login", async ({ page }) => {
    await page.goto(accounts.evaluator.dashboardPath);
    await page.waitForURL(/login|\/$/i, { timeout: 15_000 });
  });

  test("RBAC-ANON-04: unauthenticated user on /users/Proponent/... redirects to /login", async ({ page }) => {
    await page.goto(accounts.proponent.dashboardPath);
    await page.waitForURL(/login|\/$/i, { timeout: 15_000 });
  });

  test("RBAC-ANON-05: public landing page is reachable without auth", async ({ page }) => {
    const response = await page.goto("/");
    // Landing page content is CMS-driven (LogoContext, home JSON) and
    // loads asynchronously — so asserting on any specific heading text
    // is flaky. Instead verify: the server responded successfully, the
    // URL stayed on "/", and at least one "Get Started" CTA (a stable
    // anchor to /login rendered by both the navbar and the hero) is
    // present. This proves the landing page renders without redirect.
    expect(response?.status() ?? 200).toBeLessThan(400);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('a[href="/login"]').first()).toBeVisible({ timeout: 15_000 });
  });
});
