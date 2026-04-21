import { test, expect } from "@playwright/test";
import { accounts } from "../../fixtures/accounts";

/**
 * AUTH-FORGOT: the recovery request flow (frontend/src/auth/forgotPassword.tsx).
 *
 * DOM notes:
 *   - Heading: <h2>Forgot Password?</h2>
 *   - Email input: placeholder "Enter your registered email" — the label
 *     above it ("Email address") is not associated via htmlFor.
 *   - Submit button text transitions: "Send Reset link" → "Sending..." → "Email sent".
 *   - Success toast: Swal "Check your email" with the note
 *     "If an account exists for that email, we've sent a password reset link."
 *   - Supabase's resetPasswordForEmail deliberately returns success even
 *     for unknown emails (to prevent user enumeration) — so the success
 *     toast is expected regardless of whether the email is in the DB.
 *     An error toast ONLY appears for other failures (rate limit, network).
 *
 * AUTH-FORGOT-02 uses the seeded proponent email to make the test
 * semantically correct, but the system-under-test behaviour would match
 * for any well-formed email.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("AUTH-FORGOT: forgot-password flow", () => {
  test("AUTH-FORGOT-01: /forgot-password page renders email input + submit button", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot Password?", exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Enter your registered email")).toBeVisible();
    await expect(page.getByRole("button", { name: /Send Reset link/i })).toBeVisible();
  });

  test("AUTH-FORGOT-02: submitting a registered email shows success confirmation", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByPlaceholder("Enter your registered email").fill(accounts.proponent.email);

    const submit = page.getByRole("button", { name: /Send Reset link/i });
    await submit.click();

    // Some builds show an intermediate "Sending..." state on the button;
    // wait for it to disappear or for the success toast to arrive.
    // The success Swal title is "Check your email".
    const popup = page.locator(".swal2-popup");
    await expect(popup).toBeVisible({ timeout: 30_000 });
    await expect(popup).toContainText(/check your email|reset link|sent/i);
  });

  test("AUTH-FORGOT-03: empty email shows 'Missing email' warning", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("button", { name: /Send Reset link/i }).click();
    // forgotPassword.tsx fires a Swal {icon:"warning", title:"Missing email"} on empty input.
    const popup = page.locator(".swal2-popup");
    await expect(popup).toBeVisible({ timeout: 10_000 });
    await expect(popup).toContainText(/missing email|enter your email/i);
  });

  test("AUTH-FORGOT-04: malformed email is blocked by type=email validation", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByPlaceholder("Enter your registered email").fill("not-an-email");
    await page.getByRole("button", { name: /Send Reset link/i }).click();
    // The form won't submit (HTML5 type=email); the page stays on
    // /forgot-password and no success Swal appears.
    await page.waitForTimeout(1_500);
    await expect(page).toHaveURL(/forgot-password/);
    const successSwal = page.locator(".swal2-popup").filter({ hasText: /check your email/i });
    await expect(successSwal).toHaveCount(0);
  });

  test("AUTH-FORGOT-05: /reset-password route responds (200-range, no server error)", async ({ page }) => {
    // Without a recovery token Supabase redirects back; we only prove
    // the route exists and doesn't crash the server.
    const res = await page.goto("/reset-password");
    expect(res?.status() ?? 200).toBeLessThan(500);
  });
});
