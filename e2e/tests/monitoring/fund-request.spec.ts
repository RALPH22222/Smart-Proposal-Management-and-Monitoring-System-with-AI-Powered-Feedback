import { test, expect } from "../../fixtures/test";
import { ProponentMonitoringPage } from "../../pages/MonitoringPage";
import { RndDashboardPage } from "../../pages/RndDashboardPage";

/**
 * MON-FUND: fund-request lifecycle for Q1. Depends on RND-ENDORSE-03.
 *
 * Navigation:
 *   - Proponent: click "Monitoring" sidebar button (→ ?tab=monitoring)
 *   - RND:       click "Project Funding" sidebar button (→ ?tab=funding)
 */

test.describe.serial("MON-FUND: fund-request lifecycle", () => {
  test("MON-FUND-01: proponent sees funded project on monitoring tab", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires RND-ENDORSE-03 to have run first.");

    const { page } = await loggedInAs("proponent");
    const mon = new ProponentMonitoringPage(page);
    await mon.gotoViaSidebar();
    await expect(page.getByText(title!, { exact: false })).toBeVisible({ timeout: 20_000 });
  });

  test("MON-FUND-02: proponent submits Q1 fund request within budget", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires MON-FUND-01 to have run first.");

    const { page } = await loggedInAs("proponent");
    const mon = new ProponentMonitoringPage(page);
    await mon.gotoViaSidebar();
    await mon.openProjectByTitle(title!);
    await mon.requestFunds({ quarter: 1, ps: 10000, mooe: 5000, co: 0 });
  });

  test("MON-FUND-03: fund request exceeding remaining budget is rejected", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires MON-FUND-01 to have run first.");

    const { page } = await loggedInAs("proponent");
    const mon = new ProponentMonitoringPage(page);
    await mon.gotoViaSidebar();
    await mon.openProjectByTitle(title!);

    await page.getByRole("button", { name: /request.*funds|new fund request|fund request/i }).first().click();
    const quarterSelect = page.locator("select").first();
    if (await quarterSelect.count()) {
      await quarterSelect.selectOption({ label: "Q1" }).catch(() => {});
    }
    const numberInputs = page.locator('input[type="number"]');
    if (await numberInputs.count()) {
      await numberInputs.first().fill("10000000");
    }
    await page.getByRole("button", { name: /submit|send|request/i }).last().click();
    await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".swal2-popup")).toContainText(/exceed|insufficient|remaining|over|invalid/i);
  });

  test("MON-FUND-04: RND approves the Q1 fund request", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires MON-FUND-02 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openFunding();
    await rnd.openProposalByTitle(title!);
    await rnd.approveFundRequest(1);
  });
});
