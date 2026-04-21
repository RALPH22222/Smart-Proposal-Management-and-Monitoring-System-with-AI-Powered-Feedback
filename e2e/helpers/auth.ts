import { Page, expect } from "@playwright/test";
import { Account } from "../fixtures/accounts";

/**
 * Perform a real login through the UI, then wait for the role dashboard
 * to land. Uses the /login form directly — no API shortcuts, so failures
 * here indicate a genuine regression in the auth flow.
 */
export async function loginAs(page: Page, account: Account) {
  await page.goto("/login");

  await page.getByPlaceholder("Email address").fill(account.email);
  await page.getByPlaceholder("Password").fill(account.password);

  await Promise.all([
    // hard navigation is triggered after the success SweetAlert,
    // so we wait for the dashboard URL rather than a SPA transition.
    page.waitForURL((url) => url.pathname.toLowerCase().includes(account.role), { timeout: 30_000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);

  // Swal success auto-dismisses after 1.5s — just wait for the URL to settle.
  await expect(page).toHaveURL(new RegExp(account.role, "i"));
}

/**
 * Navigate to the landing page after clearing browser storage. Useful at
 * the top of a test when we want to verify the unauthenticated redirect.
 */
export async function logout(page: Page) {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Dismiss any SweetAlert modal that may be blocking the page. The app
 * uses Swal.fire extensively for success/error toasts.
 */
export async function dismissSwal(page: Page) {
  const ok = page.getByRole("button", { name: /ok|confirm|continue/i }).first();
  if (await ok.isVisible({ timeout: 500 }).catch(() => false)) {
    await ok.click();
  }
}
