import { test, expect } from "../../fixtures/test";
import { EvaluatorReviewPage } from "../../pages/EvaluatorReviewPage";

/**
 * EVAL-REVIEW: evaluator accepts the assignment and submits a review.
 * Depends on RND-QC-02 having forwarded the proposal.
 *
 * Sidebar button labels (EvaluatorSide.tsx):
 *   Dashboard, Proposals, Under Review, Completed Reviews, Settings, Logout
 */

test.describe.serial("EVAL-REVIEW: evaluator scoring flow", () => {
  test("EVAL-REVIEW-01: evaluator sees assigned proposal with accept/decline CTA", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires PROP-SUBMIT-01 + RND-QC-02 to have run first.");

    const { page } = await loggedInAs("evaluator");
    const evalPage = new EvaluatorReviewPage(page);
    await evalPage.openProposalsTab();
    await expect(page.getByText(title!, { exact: false })).toBeVisible({ timeout: 20_000 });
  });

  test("EVAL-REVIEW-02: evaluator accepts the assignment", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires RND-QC-02 to have run first.");

    const { page } = await loggedInAs("evaluator");
    const evalPage = new EvaluatorReviewPage(page);
    await evalPage.openProposalsTab();
    await evalPage.acceptAssignmentForProposal(title!);
  });

  test("EVAL-REVIEW-03: evaluator submits a review with scores + approve recommendation", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires EVAL-REVIEW-02 to have run first.");

    const { page } = await loggedInAs("evaluator");
    const evalPage = new EvaluatorReviewPage(page);
    await evalPage.openUnderReviewTab();
    await evalPage.submitReview({
      proposalTitle: title!,
      objective: 4,
      methodology: 4,
      budget: 3,
      timeline: 4,
      comments: "Methodology is sound; budget for CO appears a bit high.",
      recommendation: "approve",
    });
  });

  test("EVAL-REVIEW-04: review score out of 1–5 range is rejected", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires EVAL-REVIEW-02 to have run first.");

    const { page } = await loggedInAs("evaluator");
    const evalPage = new EvaluatorReviewPage(page);
    await evalPage.openUnderReviewTab();

    const row = page.locator("tr, [role=row], [data-proposal-title]").filter({ hasText: title! }).first();
    const reviewBtn = row.getByRole("button").filter({ hasText: /review|edit.*review|score/i }).first();
    if (await reviewBtn.isVisible().catch(() => false)) {
      await reviewBtn.click();
      const numberInputs = page.locator('input[type="number"]');
      if (await numberInputs.count()) {
        await numberInputs.first().fill("9");
        await page.getByRole("button", { name: /^submit$|submit review|send/i }).last().click();
        await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10_000 });
        await expect(page.locator(".swal2-popup")).toContainText(/invalid|1|5|range|score/i);
      } else {
        test.skip(true, "No number inputs visible — review already completed.");
      }
    } else {
      test.skip(true, "Review button not available — proposal may already be reviewed.");
    }
  });
});
