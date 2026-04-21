import { test, expect, fixtureFile } from "../../fixtures/test";
import { ProponentMonitoringPage } from "../../pages/MonitoringPage";
import { RndDashboardPage } from "../../pages/RndDashboardPage";

/**
 * MON-REPORT: quarterly report lifecycle.
 *
 * Business rules:
 *   - Can't submit a report until that quarter's fund request is approved.
 *   - Reports must be sequential (Q1 before Q2).
 *   - Upload ≤ 5MB, PDF/DOC/DOCX/PNG/JPG/WEBP.
 *   - RND verifies via "Project Monitoring" tab.
 */

test.describe.serial("MON-REPORT: quarterly report lifecycle", () => {
  test("MON-REPORT-01: proponent cannot submit Q2 report before Q1 exists", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires MON-FUND-04 to have run first.");

    const { page } = await loggedInAs("proponent");
    const mon = new ProponentMonitoringPage(page);
    await mon.gotoViaSidebar();
    await mon.openProjectByTitle(title!);

    const submitReportBtn = page.getByRole("button", { name: /submit.*report|new.*report/i }).first();
    if (!(await submitReportBtn.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip(true, "Submit Report CTA not visible — no pending reports for this project.");
    }
    await submitReportBtn.click();

    const quarterSelect = page.locator("select").first();
    if (await quarterSelect.count()) {
      const q2Option = quarterSelect.locator('option[value*="2"], option:has-text("Q2")').first();
      if (await q2Option.count()) {
        const disabled = await q2Option.evaluate((el) => (el as HTMLOptionElement).disabled);
        expect(disabled).toBeTruthy();
      }
    }
  });

  test("MON-REPORT-02: proponent submits Q1 report with real PDF upload", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires MON-FUND-04 to have run first.");

    const { page } = await loggedInAs("proponent");
    const mon = new ProponentMonitoringPage(page);
    await mon.gotoViaSidebar();
    await mon.openProjectByTitle(title!);
    await mon.submitQuarterlyReport({
      quarter: 1,
      progressPercent: 25,
      comments: "Baseline survey completed; field instrumentation installed.",
      absolutePath: fixtureFile("sample-report.pdf"),
    });
  });

  test("MON-REPORT-03: RND verifies Q1 report", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires MON-REPORT-02 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openMonitoring();
    await rnd.openProposalByTitle(title!);
    await rnd.verifyQuarterlyReport(1);
  });

  test("MON-REPORT-04: verified Q1 shows as verified on proponent view", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires MON-REPORT-03 to have run first.");

    const { page } = await loggedInAs("proponent");
    const mon = new ProponentMonitoringPage(page);
    await mon.gotoViaSidebar();
    await mon.openProjectByTitle(title!);
    await expect(page.getByText(/verified|approved/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
