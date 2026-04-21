import { Page, expect } from "@playwright/test";

/**
 * Evaluator review flow. Evaluators first accept the assignment, then
 * score the proposal across 4 assessment areas (objective, methodology,
 * budget, timeline) and give an overall recommendation.
 *
 * Sidebar labels (EvaluatorSide.tsx):
 *   Dashboard, Proposals, Under Review, Completed Reviews, Settings, Logout
 *
 * All are <button>s wired to `setSearchParams({ tab: id })`.
 */
export class EvaluatorReviewPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/users/evaluator/evaluatorMainLayout");
    await expect(this.page).toHaveURL(/evaluatorMainLayout/i);
  }

  async openDashboard() {
    await this.page.getByRole("button", { name: "Dashboard", exact: true }).click();
    await this.page.waitForURL(/tab=dashboard/, { timeout: 15_000 });
  }

  async openProposalsTab() {
    await this.page.getByRole("button", { name: "Proposals", exact: true }).click();
    await this.page.waitForURL(/tab=proposals/, { timeout: 15_000 });
  }

  async openUnderReviewTab() {
    await this.page.getByRole("button", { name: "Under Review", exact: true }).click();
    await this.page.waitForURL(/tab=review/, { timeout: 15_000 });
  }

  async openCompletedReviewsTab() {
    await this.page.getByRole("button", { name: "Completed Reviews", exact: true }).click();
    await this.page.waitForURL(/tab=reviewed/, { timeout: 15_000 });
  }

  async acceptAssignmentForProposal(title: string) {
    const row = this.page.locator("tr, [role=row], [data-proposal-title]").filter({ hasText: title }).first();
    await row.getByRole("button", { name: /accept/i }).first().click();
    await this.page.getByRole("button", { name: /confirm|yes|accept/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/accepted|success/i, { timeout: 15_000 });
  }

  async declineAssignmentForProposal(title: string, reason: string) {
    const row = this.page.locator("tr, [role=row], [data-proposal-title]").filter({ hasText: title }).first();
    await row.getByRole("button", { name: /decline/i }).first().click();
    await this.page.locator("textarea").first().fill(reason);
    await this.page.getByRole("button", { name: /submit|send|decline|confirm/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/declined|success/i, { timeout: 15_000 });
  }

  /**
   * Score + recommend. Scores are 1–5. Recommendation is one of
   * "approve" | "revise" | "reject".
   */
  async submitReview(opts: {
    proposalTitle: string;
    objective: number;
    methodology: number;
    budget: number;
    timeline: number;
    comments: string;
    recommendation: "approve" | "revise" | "reject";
  }) {
    const row = this.page.locator("tr, [role=row], [data-proposal-title]").filter({ hasText: opts.proposalTitle }).first();
    await row.getByRole("button").filter({ hasText: /review|score|evaluate|rate/i }).first().click();

    // ReviewModal renders 4 numeric score inputs; they live near headings
    // matching the assessment names. Use heading-anchored locators.
    const scoreInputs = this.page.locator('input[type="number"]');
    const count = await scoreInputs.count();
    if (count >= 4) {
      await scoreInputs.nth(0).fill(String(opts.objective));
      await scoreInputs.nth(1).fill(String(opts.methodology));
      await scoreInputs.nth(2).fill(String(opts.budget));
      await scoreInputs.nth(3).fill(String(opts.timeline));
    }

    const commentsBox = this.page.locator("textarea").first();
    await commentsBox.fill(opts.comments);

    const recRegex =
      opts.recommendation === "approve"
        ? /approve/i
        : opts.recommendation === "revise"
        ? /revise|revision/i
        : /reject/i;
    // Recommendation renders as radios OR clickable cards — try both.
    const radio = this.page.getByRole("radio", { name: recRegex });
    if (await radio.count()) {
      await radio.first().check();
    } else {
      await this.page.getByRole("button", { name: recRegex }).first().click();
    }

    await this.page.getByRole("button", { name: /^submit$|submit review|send/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/submitted|success/i, { timeout: 15_000 });
  }
}
