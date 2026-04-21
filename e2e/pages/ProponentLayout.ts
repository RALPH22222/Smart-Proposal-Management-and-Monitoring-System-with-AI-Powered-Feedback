import { Page, Locator, expect } from "@playwright/test";

/**
 * Navigation wrapper for the Proponent dashboard. ProponentMainLayout.tsx
 * uses URL query params (`?tab=submission`, `?tab=profile`, `?tab=monitoring`,
 * `?tab=settings`) to switch content, and the sidebar renders each nav entry
 * as a <button> (see Proponent-sidebar.tsx — nav items are buttons, not
 * <a> links).
 *
 * Visible labels (internal proponent):  Profile, Submission, Monitoring,
 *                                       Settings, Logout
 * Visible labels (external co-lead):    My Projects, Profile, Settings, Logout
 */
export class ProponentLayout {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly profileButton: Locator;
  readonly submissionButton: Locator;
  readonly monitoringButton: Locator;
  readonly settingsButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator("aside").first();
    this.profileButton = page.getByRole("button", { name: "Profile", exact: true });
    this.submissionButton = page.getByRole("button", { name: "Submission", exact: true });
    this.monitoringButton = page.getByRole("button", { name: /^(Monitoring|My Projects)$/ });
    this.settingsButton = page.getByRole("button", { name: "Settings", exact: true });
    this.logoutButton = page.getByRole("button", { name: "Logout", exact: true });
  }

  async goto() {
    await this.page.goto("/users/Proponent/ProponentMainLayout");
    await expect(this.page).toHaveURL(/ProponentMainLayout/i);
  }

  async openSubmission() {
    await this.submissionButton.click();
    await this.page.waitForURL(/tab=submission/, { timeout: 15_000 });
  }

  async openProfile() {
    await this.profileButton.click();
    await this.page.waitForURL(/tab=profile/, { timeout: 15_000 });
  }

  async openMonitoring() {
    await this.monitoringButton.click();
    await this.page.waitForURL(/tab=monitoring/, { timeout: 15_000 });
  }

  async openSettings() {
    await this.settingsButton.click();
    await this.page.waitForURL(/tab=settings/, { timeout: 15_000 });
  }

  async logout() {
    await this.logoutButton.click();
  }
}
