import { test, expect } from "../../fixtures/test";
import { accounts } from "../../fixtures/accounts";

/**
 * AUTH-LOGOUT: session termination. The sidebar's logout item is a
 * <button> with the exact label "Logout" (see Proponent-sidebar.tsx).
 * On click, the button calls useAuthContext().logout() which clears
 * cookies/storage and navigates to "/".
 */

test.describe("AUTH-LOGOUT: session termination", () => {
  test("AUTH-LOGOUT-01: proponent can log out from the dashboard", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("proponent");
    await page.getByRole("button", { name: "Logout", exact: true }).click();

    // Some builds show a confirm dialog; others log out immediately. If
    // a Swal/modal appears, accept it.
    const confirm = page.getByRole("button", { name: /yes|confirm|log ?out/i });
    if (await confirm.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirm.click();
    }

    await page.waitForURL((url) => url.pathname === "/" || /login/i.test(url.pathname), { timeout: 15_000 });
  });

  test("AUTH-LOGOUT-02: cleared cookies redirect protected routes to /login", async ({ loggedInAs }) => {
    const { page, context } = await loggedInAs("proponent");
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(accounts.proponent.dashboardPath);
    await page.waitForURL(/login|\/$/i, { timeout: 15_000 });
  });
});
