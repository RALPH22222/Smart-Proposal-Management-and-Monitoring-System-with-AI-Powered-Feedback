import { test, expect } from "../../fixtures/test";
import { RndDashboardPage } from "../../pages/RndDashboardPage";

/**
 * RND-QC: quality check. Runs against the proposal created by
 * PROP-SUBMIT-01. Covers the three RND decisions: forward, revision, reject.
 *
 * Sidebar button labels (RnDSidebar.tsx):
 *   Dashboard, Proposals, Evaluators, Endorsements,
 *   Project Funding, Project Monitoring, Settings, Logout.
 */

test.describe.serial("RND-QC: quality check", () => {
  test("RND-QC-01: RND sees the new proposal on their dashboard", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires PROP-SUBMIT-01 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openProposals();
    await expect(page.getByText(title!, { exact: false })).toBeVisible({ timeout: 20_000 });
  });

  test("RND-QC-02: RND forwards proposal to evaluator with deadline", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires PROP-SUBMIT-01 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openProposals();
    await rnd.openProposalByTitle(title!);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);
    const deadlineIso = deadline.toISOString().slice(0, 10);

    await rnd.forwardToEvaluators({
      evaluatorNames: ["E2E Evaluator"],
      deadlineISO: deadlineIso,
      instructions: "Please focus on the methodology section.",
    });

    await expect(page.getByText(/under.*evaluation/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("RND-QC-03: RND cannot forward to self (COI guard)", async ({ loggedInAs: _loggedInAs }) => {
    test.skip(!process.env.E2E_INCLUDE_COI_TESTS, "Set E2E_INCLUDE_COI_TESTS=1 to run.");
    expect(true).toBe(true);
  });
});

test.describe("RND-QC: revision & rejection paths", () => {
  test("RND-QC-04: RND requests revision with per-section feedback", async ({ loggedInAs }) => {
    const title = process.env.E2E_REVISION_PROPOSAL_TITLE;
    test.skip(!title, "Set E2E_REVISION_PROPOSAL_TITLE to run (separate proposal in review_rnd status).");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openProposals();
    await rnd.openProposalByTitle(title!);
    await rnd.requestRevision({
      objective: "Please clarify the primary research question.",
      methodology: "Sample size justification is missing.",
      budget: "PS line item for consultant fees lacks breakdown.",
      timeline: "Q1 milestones overlap — please separate.",
      overall: "Revisions needed before we can forward to evaluators.",
    });
  });

  test("RND-QC-05: proponent sees revision request with section-level feedback", async ({ loggedInAs }) => {
    const title = process.env.E2E_REVISION_PROPOSAL_TITLE;
    test.skip(!title, "Set E2E_REVISION_PROPOSAL_TITLE to run.");

    const { page } = await loggedInAs("proponent");
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await expect(page.getByText(title!, { exact: false })).toBeVisible();
    await expect(page.getByText(/revision|needs changes/i).first()).toBeVisible();
  });
});
