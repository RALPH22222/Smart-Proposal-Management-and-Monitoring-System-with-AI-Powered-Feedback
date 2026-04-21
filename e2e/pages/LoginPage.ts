import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("Email address");
    this.passwordInput = page.getByPlaceholder("Password");
    this.submitButton = page.getByRole("button", { name: /sign in/i });
    this.forgotPasswordLink = page.getByRole("link", { name: /forgot password/i });
    this.registerLink = page.getByRole("link", { name: /create one/i });
  }

  async goto() {
    await this.page.goto("/login");
    await expect(this.emailInput).toBeVisible();
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectErrorToast(messageRe: RegExp) {
    // SweetAlert2 renders a dialog with role=dialog; the body text lives
    // inside .swal2-html-container / .swal2-title.
    await expect(this.page.locator(".swal2-popup")).toBeVisible({ timeout: 15_000 });
    await expect(this.page.locator(".swal2-popup")).toContainText(messageRe);
  }

  async dismissToast() {
    const ok = this.page.locator(".swal2-confirm");
    if (await ok.isVisible({ timeout: 500 }).catch(() => false)) {
      await ok.click();
    }
  }
}
