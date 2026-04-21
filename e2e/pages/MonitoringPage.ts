import { Page, expect } from "@playwright/test";

/**
 * Proponent-side project monitoring: fund requests, quarterly reports.
 *
 * The proponent sidebar uses <button> elements. To reach the monitoring
 * tab from anywhere in the proponent layout, click the "Monitoring" (or
 * "My Projects" for external) sidebar button — this updates the URL to
 * `?tab=monitoring`.
 */
export class ProponentMonitoringPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/users/Proponent/ProponentMainLayout?tab=monitoring");
    await expect(this.page).toHaveURL(/tab=monitoring/);
  }

  async gotoViaSidebar() {
    await this.page.goto("/users/Proponent/ProponentMainLayout");
    await this.page.getByRole("button", { name: /^(Monitoring|My Projects)$/ }).click();
    await this.page.waitForURL(/tab=monitoring/);
  }

  async openProjectByTitle(title: string) {
    const row = this.page.locator("tr, [role=row], [data-project-title]").filter({ hasText: title }).first();
    const button = row.getByRole("button").filter({ hasText: /view|open|details|manage/i }).first();
    if (await button.count()) {
      await button.click();
    } else {
      await row.click();
    }
  }

  async requestFunds(opts: {
    quarter: number;
    ps: number;
    mooe: number;
    co: number;
  }) {
    await this.page.getByRole("button", { name: /request.*funds|new fund request|fund request/i }).first().click();

    // Quarter can be a <select> or a custom dropdown. Try select first.
    const quarterSelect = this.page.locator("select").first();
    if (await quarterSelect.count()) {
      await quarterSelect.selectOption({ label: `Q${opts.quarter}` }).catch(async () => {
        await quarterSelect.selectOption(String(opts.quarter));
      });
    }

    // PS/MOOE/CO amount inputs — in source order in the request form.
    const numberInputs = this.page.locator('input[type="number"]');
    if (await numberInputs.count() >= 3) {
      await numberInputs.nth(0).fill(String(opts.ps));
      await numberInputs.nth(1).fill(String(opts.mooe));
      await numberInputs.nth(2).fill(String(opts.co));
    }

    await this.page.getByRole("button", { name: /submit|send|request/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/submitted|success|requested/i, { timeout: 15_000 });
  }

  async submitQuarterlyReport(opts: {
    quarter: number;
    progressPercent: number;
    comments: string;
    absolutePath: string;
  }) {
    await this.page.getByRole("button", { name: /submit.*report|new.*report/i }).first().click();

    const quarterSelect = this.page.locator("select").first();
    if (await quarterSelect.count()) {
      await quarterSelect.selectOption({ label: `Q${opts.quarter}` }).catch(async () => {
        await quarterSelect.selectOption(String(opts.quarter));
      });
    }

    // Progress % — usually an input[type=number] near a "progress" label.
    const progressInput = this.page.locator('input[type="number"]').first();
    if (await progressInput.count()) {
      await progressInput.fill(String(opts.progressPercent));
    }

    await this.page.locator("textarea").first().fill(opts.comments);
    await this.page.locator('input[type="file"]').first().setInputFiles(opts.absolutePath);
    await this.page.getByRole("button", { name: /submit|send/i }).last().click();
    await expect(this.page.locator(".swal2-popup")).toContainText(/submitted|success/i, { timeout: 20_000 });
  }
}
