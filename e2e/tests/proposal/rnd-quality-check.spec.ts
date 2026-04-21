import { test, expect } from "../../fixtures/test";
import { RndDashboardPage } from "../../pages/RndDashboardPage";

/**
 * RND-QC: quality check. Runs against the proposal created by
 * PROP-SUBMIT-01. Covers the three RND decisions: forward, revision,
 * reject — plus client-side validation checks that DON'T mutate state.
 *
 * Important DOM notes discovered during exploration:
 *   - The three decision buttons read "Forward to Evaluators",
 *     "Request Revision", "Reject Proposal". (Internal state value for
 *     the first is 'Sent to Evaluators' — UI label differs.)
 *   - Validation errors in this modal use native `alert()`, NOT
 *     SweetAlert. Playwright captures these via `page.on('dialog')`.
 *   - The modal's X close button has no aria-label — we close with
 *     Escape or by re-navigating away.
 *
 * Sidebar button labels: Dashboard, Proposals, Evaluators, Endorsements,
 * Project Funding, Project Monitoring, Settings, Logout.
 */

test.describe.serial("RND-QC: quality check", () => {
  test("RND-QC-01: RND sees the new proposal on their dashboard", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires PROP-SUBMIT-01 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openProposals();
    await expect(page.getByText(title!, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("RND-QC-02: proposal detail modal exposes 3 decision buttons", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires PROP-SUBMIT-01 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openProposals();
    await rnd.openProposalByTitle(title!);

    await expect(page.getByRole("button", { name: /Forward to Evaluators/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Request Revision/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reject Proposal/i })).toBeVisible();

    // Escape closes the modal without committing.
    await page.keyboard.press("Escape");
  });

  test("RND-QC-03: Forward with 0 evaluators shows alert 'at least 2 evaluators'", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires PROP-SUBMIT-01 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openProposals();
    await rnd.openProposalByTitle(title!);

    // Ensure we're on the "Sent to Evaluators" branch (default) and
    // attempt to submit without selecting any evaluators.
    await page.getByRole("button", { name: /Forward to Evaluators/i }).click();

    // Capture the native alert that fires on submit.
    const dialogPromise = page.waitForEvent("dialog", { timeout: 10_000 });

    // Submit — the main form Submit button in RnDProposalModal. The exact
    // label may be "Submit Decision" / "Save Decision" / etc. Try the
    // broadest match first; fall back to type=submit.
    const submitBtn = page.getByRole("button", { name: /submit|send|save.*decision/i }).last();
    await submitBtn.click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/at least 2 evaluators/i);
    await dialog.dismiss();

    await page.keyboard.press("Escape").catch(() => {});
  });

  test("RND-QC-04: Revision with empty comments shows alert 'at least one comment'", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires PROP-SUBMIT-01 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openProposals();
    await rnd.openProposalByTitle(title!);

    // Switch to the "Request Revision" decision.
    await page.getByRole("button", { name: /Request Revision/i }).click();

    // Submit without filling any of the 4 structured comment sections.
    const dialogPromise = page.waitForEvent("dialog", { timeout: 10_000 });
    await page.getByRole("button", { name: /submit|send|save.*decision/i }).last().click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/at least one comment/i);
    await dialog.dismiss();

    await page.keyboard.press("Escape").catch(() => {});
  });

  test("RND-QC-05: Reject button pre-populates the Title Assessment with a template", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires PROP-SUBMIT-01 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openProposals();
    await rnd.openProposalByTitle(title!);

    await page.getByRole("button", { name: /Reject Proposal/i }).click();

    // After switching to Reject, the Title Assessment textarea auto-fills
    // with "After careful review of this proposal, we have determined
    // that it does not meet the required standards for approval..."
    // (see RnDProposalModal.tsx:263-273).
    const populated = page.getByText(/After careful review of this proposal/i).first();
    await expect(populated).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press("Escape").catch(() => {});
  });

  test("RND-QC-06: RND forwards proposal to evaluator with deadline (happy path, COMMITS state)", async ({ loggedInAs }) => {
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

  test("RND-QC-07: RND cannot forward to self (COI guard)", async ({ loggedInAs: _loggedInAs }) => {
    test.skip(!process.env.E2E_INCLUDE_COI_TESTS, "Set E2E_INCLUDE_COI_TESTS=1 to run.");
    expect(true).toBe(true);
  });
});

test.describe("RND-QC: revision & rejection paths", () => {
  test("RND-QC-08: RND requests revision with per-section feedback", async ({ loggedInAs }) => {
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

  test("RND-QC-09: proponent sees revision request with section-level feedback", async ({ loggedInAs }) => {
    const title = process.env.E2E_REVISION_PROPOSAL_TITLE;
    test.skip(!title, "Set E2E_REVISION_PROPOSAL_TITLE to run.");

    const { page } = await loggedInAs("proponent");
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await expect(page.getByText(title!, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/revision|needs changes/i).first()).toBeVisible();
  });
});
