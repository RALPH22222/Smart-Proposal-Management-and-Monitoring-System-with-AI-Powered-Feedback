import { test, expect } from "@playwright/test";
import { accounts } from "../../fixtures/accounts";
import { LoginPage } from "../../pages/LoginPage";

/**
 * AUTH-LOGIN: Happy paths, wrong-credential errors, empty-field validation,
 * and role-based redirect. Runs without any pre-authenticated storage state
 * — every test logs in through the UI from cold.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("AUTH-LOGIN: login form", () => {
  test("AUTH-LOGIN-01: proponent logs in and lands on proponent dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillCredentials(accounts.proponent.email, accounts.proponent.password);
    await login.submit();
    await page.waitForURL(/ProponentMainLayout/i, { timeout: 30_000 });
    await expect(page).toHaveURL(/ProponentMainLayout/i);
  });

  test("AUTH-LOGIN-02: RND logs in and lands on RND dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillCredentials(accounts.rnd.email, accounts.rnd.password);
    await login.submit();
    await page.waitForURL(/rndMainLayout/i, { timeout: 30_000 });
  });

  test("AUTH-LOGIN-03: evaluator logs in and lands on evaluator dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillCredentials(accounts.evaluator.email, accounts.evaluator.password);
    await login.submit();
    await page.waitForURL(/evaluatorMainLayout/i, { timeout: 30_000 });
  });

  test("AUTH-LOGIN-04: admin logs in and lands on admin dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillCredentials(accounts.admin.email, accounts.admin.password);
    await login.submit();
    await page.waitForURL(/adminMainLayout/i, { timeout: 30_000 });
  });

  test("AUTH-LOGIN-05: wrong password shows error toast and stays on /login", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillCredentials(accounts.proponent.email, "DefinitelyNotMyPassword!123");
    await login.submit();
    await login.expectErrorToast(/invalid|incorrect|failed/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("AUTH-LOGIN-06: unknown email shows error toast", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillCredentials("nobody-here-1234567@wmsu-test.local", accounts.proponent.password);
    await login.submit();
    await login.expectErrorToast(/invalid|not found|failed|incorrect/i);
  });

  test("AUTH-LOGIN-07: empty fields block submit with validation toast", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit();
    await login.expectErrorToast(/missing|required|provide/i);
  });

  test("AUTH-LOGIN-08: forgot-password link navigates to /forgot-password", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.forgotPasswordLink.click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test("AUTH-LOGIN-09: register link navigates to /register", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.registerLink.click();
    await expect(page).toHaveURL(/register/);
  });
});
