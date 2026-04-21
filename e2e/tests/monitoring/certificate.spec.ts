import { test, expect } from "../../fixtures/test";
import { RndDashboardPage } from "../../pages/RndDashboardPage";

/**
 * MON-CERT: completion certificate issuance.
 *
 * The system requires all 4 quarterly reports verified before a
 * certificate can be issued. Driving 4 quarters through the UI in one
 * test run is expensive, so:
 *
 *   - MON-CERT-01 asserts the "issue certificate" button is HIDDEN /
 *     disabled when only Q1 is verified (the regression guard).
 *   - MON-CERT-02 runs only if E2E_ALL_QUARTERS_VERIFIED=1.
 */

test.describe.serial("MON-CERT: completion certificate", () => {
  test("MON-CERT-01: certificate button is not available with only Q1 verified", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires MON-REPORT-03 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openMonitoring();
    await rnd.openProposalByTitle(title!);

    const issueBtn = page.getByRole("button", { name: /issue.*certificate|completion certificate/i });
    const visible = await issueBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    if (visible) {
      await expect(issueBtn).toBeDisabled();
    }
  });

  test("MON-CERT-02: RND issues certificate when all 4 quarters verified", async ({ loggedInAs }) => {
    test.skip(
      process.env.E2E_ALL_QUARTERS_VERIFIED !== "1",
      "Requires Q2-Q4 pre-verified in the DB (set E2E_ALL_QUARTERS_VERIFIED=1).",
    );
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires the full monitoring pipeline.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openMonitoring();
    await rnd.openProposalByTitle(title!);
    await rnd.issueCompletionCertificate();
    await expect(page.getByText(/certificate|completed|issued/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
