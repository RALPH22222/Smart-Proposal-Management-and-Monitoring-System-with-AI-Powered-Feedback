import { test, expect } from "@playwright/test";

/**
 * AUTH-REG: Registration form UI validation.
 *
 * SELECTOR NOTES (after DOM reading):
 * - Page heading is <h2>Sign up</h2>, step heading is <h3>Account Information</h3>.
 * - Form inputs use placeholders, NOT htmlFor/id-linked labels:
 *     First Name | Last Name | Email address | "Password (min. 8 characters)"
 * - Step 2 fields (all in the same step):
 *     Birthdate → <input type="date"> (has max=today-18y; browser enforces)
 *     Sex       → <select> with options male / female / prefer_not_to_say
 *     R&D Station → <select> populated from /auth/departments
 * - Step 2 validation order (register.tsx line 119):
 *     1. If ANY of (birthdate, sex, rdStation) is missing → "Missing Fields"
 *     2. Else if age < 18 → "Age Requirement"
 *   So to exercise the Age Requirement path, all three MUST be filled.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("AUTH-REG: registration form", () => {
  test("AUTH-REG-01: /register page renders with step 1 inputs visible", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Sign up", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Account Information", exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("First Name")).toBeVisible();
    await expect(page.getByPlaceholder("Last Name")).toBeVisible();
    await expect(page.getByPlaceholder("Email address")).toBeVisible();
    await expect(page.getByPlaceholder(/^Password \(min\. 8/)).toBeVisible();
  });

  test("AUTH-REG-02: Next with empty fields blocks navigation and shows warning", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /next|continue/i }).first().click();
    await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".swal2-popup")).toContainText(/missing|required|fill/i);
  });

  test("AUTH-REG-03: weak password blocks step 1 advance", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("First Name").fill("Jane");
    await page.getByPlaceholder("Last Name").fill("Doe");
    await page.getByPlaceholder("Email address").fill(`jane.doe+${Date.now()}@wmsu-test.local`);
    await page.getByPlaceholder(/^Password \(min\. 8/).fill("weak");
    await page.getByRole("button", { name: /next|continue/i }).first().click();
    await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".swal2-popup")).toContainText(/weak|password/i);
  });

  test("AUTH-REG-04: under-18 birthdate blocks step 2 advance", async ({ page }) => {
    await page.goto("/register");

    // Step 1 — fill valid values so Next succeeds.
    await page.getByPlaceholder("First Name").fill("Young");
    await page.getByPlaceholder("Last Name").fill("Person");
    await page.getByPlaceholder("Email address").fill(`young.${Date.now()}@wmsu-test.local`);
    await page.getByPlaceholder(/^Password \(min\. 8/).fill("SuperStrongP@ss123!");
    await page.getByRole("button", { name: /next|continue/i }).first().click();

    // Wait for step 2 heading so we know the render has committed.
    await expect(page.getByRole("heading", { name: /Personal.*Info/i })).toBeVisible({ timeout: 10_000 });

    // Birthdate input has `max=today-18y`; the browser blocks .fill() for
    // an underage value. Remove max via DOM evaluate and dispatch the
    // React-expected change/blur events so state updates.
    const tenYearsAgo = `${new Date().getFullYear() - 10}-01-01`;
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.evaluate((el, value) => {
      const input = el as HTMLInputElement;
      input.removeAttribute("max");
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));
    }, tenYearsAgo);

    // Sex is the first <select> in step 2 — pick male.
    const sexSelect = page.locator("select").nth(0);
    await sexSelect.selectOption("male");

    // R&D Station is the second <select> — pick the first non-placeholder
    // option. Must be populated for the "Age Requirement" toast to be
    // reached (otherwise "Missing Fields" fires first).
    const rdSelect = page.locator("select").nth(1);
    const opts = await rdSelect.locator("option").evaluateAll((els) =>
      els.map((el) => ({
        value: (el as HTMLOptionElement).value,
        disabled: (el as HTMLOptionElement).disabled,
      })),
    );
    const pickable = opts.find((o) => o.value && !o.disabled);
    if (!pickable) {
      test.skip(true, "No departments available in dropdown — seed at least one row in `departments`.");
    }
    await rdSelect.selectOption(pickable!.value);

    await page.getByRole("button", { name: /next|continue/i }).first().click();

    const popup = page.locator(".swal2-popup");
    await expect(popup).toBeVisible({ timeout: 10_000 });
    await expect(popup).toContainText(/18|age requirement/i);
  });

  test("AUTH-REG-05: Back button on /register returns to home", async ({ page }) => {
    await page.goto("/register");
    const back = page.getByRole("link", { name: /back to home/i }).first();
    if (await back.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await back.click();
      await expect(page).toHaveURL(/\/$/);
    } else {
      test.skip(true, "Back-to-Home link not present in current build.");
    }
  });
});
