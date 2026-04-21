import { test, expect } from "../../fixtures/test";

/**
 * ADMIN: smoke test of the admin dashboard navigation.
 *
 * Sidebar labels (components/admin-component/sidebar.tsx):
 *   Dashboard, Activity Logs, Evaluator Performance, Accounts, Contents,
 *   Lookups, Proposals, Evaluators, Endorsements, Project Funding,
 *   Monitoring, Settings, Logout.
 * All sidebar items are <button>s; URL uses ?tab=<id>.
 */

test.describe("ADMIN: dashboard navigation smoke", () => {
  test("ADMIN-01: dashboard landing page shows system stats", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("admin");
    await expect(page).toHaveURL(/adminMainLayout/i);
    await expect(page.getByText(/proposals?|users?|projects?/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("ADMIN-02: Proposals tab lists proposals", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("admin");
    await page.getByRole("button", { name: "Proposals", exact: true }).click();
    await page.waitForURL(/tab=proposals/, { timeout: 15_000 });
    await expect(page.getByRole("table").or(page.getByRole("grid")).first()).toBeVisible({ timeout: 15_000 });
  });

  test("ADMIN-03: Evaluators tab renders evaluator list", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("admin");
    await page.getByRole("button", { name: "Evaluators", exact: true }).click();
    await page.waitForURL(/tab=evaluators/, { timeout: 15_000 });
    await expect(page.getByRole("heading").or(page.getByRole("table")).first()).toBeVisible({ timeout: 15_000 });
  });

  test("ADMIN-04: Accounts tab lets admin see users", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("admin");
    await page.getByRole("button", { name: "Accounts", exact: true }).click();
    await page.waitForURL(/tab=accounts/, { timeout: 15_000 });
    await expect(page.getByRole("table").or(page.getByRole("grid")).first()).toBeVisible({ timeout: 15_000 });
  });

  test("ADMIN-05: Activity Logs tab renders", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("admin");
    await page.getByRole("button", { name: "Activity Logs", exact: true }).click();
    await page.waitForURL(/tab=activity/, { timeout: 15_000 });
    await expect(page.getByRole("table").or(page.getByText(/activity/i)).first()).toBeVisible({ timeout: 15_000 });
  });

  test("ADMIN-06: Settings tab opens", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("admin");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.waitForURL(/tab=settings/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /settings/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
