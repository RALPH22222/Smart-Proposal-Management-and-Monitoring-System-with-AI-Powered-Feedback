import { Page, expect } from "@playwright/test";

/**
 * RND dashboard page object. RnDMainLayout.tsx uses `?tab=` query params
 * and the sidebar (RnDSidebar.tsx) renders nav items as <button>s.
 *
 * Exact sidebar labels:
 *   Dashboard, Proposals, Evaluators, Endorsements,
 *   Project Funding, Project Monitoring, Settings, Logout
 */
export class RndDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/users/rnd/rndMainLayout");
    await expect(this.page).toHaveURL(/rndMainLayout/i);
  }

  async openDashboard() {
    await this.page.getByRole("button", { name: "Dashboard", exact: true }).click();
    await this.page.waitForURL(/tab=dashboard/, { timeout: 15_000 });
  }

  async openProposals() {
    await this.page.getByRole("button", { name: "Proposals", exact: true }).click();
    await this.page.waitForURL(/tab=proposals/, { timeout: 15_000 });
  }

  async openEvaluators() {
    await this.page.getByRole("button", { name: "Evaluators", exact: true }).click();
    await this.page.waitForURL(/tab=evaluators/, { timeout: 15_000 });
  }

  async openEndorsements() {
    await this.page.getByRole("button", { name: "Endorsements", exact: true }).click();
    await this.page.waitForURL(/tab=endorsements/, { timeout: 15_000 });
  }

  async openFunding() {
    await this.page.getByRole("button", { name: "Project Funding", exact: true }).click();
    await this.page.waitForURL(/tab=funding/, { timeout: 15_000 });
  }

  async openMonitoring() {
    await this.page.getByRole("button", { name: "Project Monitoring", exact: true }).click();
    await this.page.waitForURL(/tab=monitoring/, { timeout: 15_000 });
  }

  async openProposalByTitle(title: string) {
    // Proposal lists are rendered as card/table rows containing the title.
    // We click the first action button on the row that opens the detail modal.
    const row = this.page.locator(`tr, [role=row], [data-proposal-title]`).filter({ hasText: title }).first();
    const actionButton = row.getByRole("button").filter({ hasText: /view|open|review|details|decision/i }).first();
    if (await actionButton.count()) {
      await actionButton.click();
    } else {
      // Fallback: click the row itself if it's clickable.
      await row.click();
    }
  }

  async forwardToEvaluators(opts: { evaluatorNames: string[]; deadlineISO: string; instructions?: string }) {
    await this.page.getByRole("button", { name: /forward|assign.*evaluator/i }).first().click();
    for (const name of opts.evaluatorNames) {
      const checkbox = this.page.getByRole("checkbox", { name: new RegExp(name, "i") });
      if (await checkbox.count()) {
        await checkbox.first().check();
      } else {
        // Fallback: a clickable row with the name, with a toggle inside.
        await this.page.locator("label, button, tr").filter({ hasText: new RegExp(name, "i") }).first().click();
      }
    }
    await this.page.locator('input[type="date"]').first().fill(opts.deadlineISO);
    if (opts.instructions) {
      await this.page.locator('textarea').first().fill(opts.instructions);
    }
    await this.page.getByRole("button", { name: /confirm|send|assign|submit/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/success|forwarded|assigned/i, { timeout: 15_000 });
  }

  async requestRevision(feedback: {
    objective: string;
    methodology: string;
    budget: string;
    timeline: string;
    overall: string;
  }) {
    await this.page.getByRole("button", { name: /request.*revision|send.*revision/i }).first().click();
    const textareas = this.page.locator("textarea");
    // Four per-section + one overall textarea; fill in order.
    await textareas.nth(0).fill(feedback.objective);
    await textareas.nth(1).fill(feedback.methodology);
    await textareas.nth(2).fill(feedback.budget);
    await textareas.nth(3).fill(feedback.timeline);
    if (await textareas.count() > 4) {
      await textareas.nth(4).fill(feedback.overall);
    }
    await this.page.getByRole("button", { name: /submit|send/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/success|sent/i, { timeout: 15_000 });
  }

  async endorseForFunding() {
    await this.page.getByRole("button", { name: /endorse.*funding|endorse/i }).first().click();
    await this.page.getByRole("button", { name: /confirm|endorse|yes/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/success|endorsed/i, { timeout: 15_000 });
  }

  async verifyQuarterlyReport(quarter: number) {
    const row = this.page.locator("tr, [role=row]").filter({ hasText: new RegExp(`Q${quarter}\\b`, "i") });
    await row.getByRole("button", { name: /verify|approve/i }).first().click();
    await this.page.getByRole("button", { name: /confirm|yes/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/verified|success/i, { timeout: 15_000 });
  }

  async approveFundRequest(quarter: number) {
    const row = this.page.locator("tr, [role=row]").filter({ hasText: new RegExp(`Q${quarter}\\b`, "i") });
    await row.getByRole("button", { name: /approve|release/i }).first().click();
    await this.page.getByRole("button", { name: /confirm|yes/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/approved|success/i, { timeout: 15_000 });
  }

  async issueCompletionCertificate() {
    await this.page.getByRole("button", { name: /issue.*certificate|completion certificate/i }).first().click();
    await this.page.getByRole("button", { name: /confirm|issue|yes/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/issued|success/i, { timeout: 15_000 });
  }
}
