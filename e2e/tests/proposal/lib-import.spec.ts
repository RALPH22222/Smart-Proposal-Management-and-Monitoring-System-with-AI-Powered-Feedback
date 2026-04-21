import { test, expect, fixtureFile } from "../../fixtures/test";
import { ProposalSubmissionPage } from "../../pages/ProposalSubmissionPage";
import { ProponentLayout } from "../../pages/ProponentLayout";

/**
 * LIB-IMPORT: variant coverage for the WMSU LIB Template import modal.
 *
 * The LIB modal has three terminal states after a file is attached:
 *   ok       — preview + "Import N items" button visible (parser accepted)
 *   rejected — "Upload rejected — not the WMSU LIB Template" card
 *   error    — red "Failed to parse..." error box
 *
 * These tests exercise each state and the interactions around them.
 * They run INDEPENDENT of the full proposal-submission flow — we just
 * open the Budget Section tab (no file upload, no auto-fill) and drive
 * the LIB modal directly. No cross-spec dependencies.
 */

test.describe.serial("LIB-IMPORT: LIB template import variants", () => {
  test("LIB-IMPORT-01: valid WMSU LIB v1 template imports cleanly", async ({ loggedInAs }) => {
    test.setTimeout(120_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();
    await form.gotoBudget();

    await form.openLibImportModal();
    await form.attachLibFile(fixtureFile("sample-lib-template.docx"));

    const outcome = await form.waitForLibParseOutcome();
    expect(outcome, "Parser should accept the WMSU LIB v1 fixture").toBe("ok");

    // The filename auto-prefills the source name (cleaned for spaces/underscores).
    // Overwrite with a deterministic value so the budget card is easy to find.
    const sourceInput = form
      .libModalRoot()
      .getByPlaceholder(/GAA, LGUs, Industry/i)
      .first();
    await sourceInput.fill("LIB-IMPORT-01 GAA");

    const importBtn = form.libImportCommitButton();
    await expect(importBtn).toBeEnabled({ timeout: 5_000 });
    await importBtn.click();

    // Modal closes; success Swal "LIB imported" fires with 4s timer.
    await expect(page.getByRole("heading", { name: /Import WMSU LIB Template/i }))
      .toBeHidden({ timeout: 15_000 });
    const libImportedSwal = page.locator(".swal2-popup").filter({ hasText: /LIB imported/i });
    if (await libImportedSwal.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await libImportedSwal.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => {});
    }

    // After import, a new budget source card with our name should exist.
    const sourceInputs = page.getByPlaceholder(/^e\.g\., GAA, LGUs, Industry$/);
    const values = await sourceInputs.evaluateAll((els) =>
      (els as HTMLInputElement[]).map((el) => el.value),
    );
    expect(values.some((v) => v.includes("LIB-IMPORT-01 GAA"))).toBe(true);
  });

  test("LIB-IMPORT-02: non-LIB DOCX shows the rejection card", async ({ loggedInAs }) => {
    test.setTimeout(120_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();
    await form.gotoBudget();

    // Record the current source-card count so we can prove it didn't grow.
    const beforeCount = await form.countBudgetSourceCards();

    await form.openLibImportModal();
    // sample-proposal.docx is a valid DOCX but NOT a WMSU LIB template —
    // parser should surface a structural rejection rather than a parse error.
    await form.attachLibFile(fixtureFile("sample-proposal.docx"));

    const outcome = await form.waitForLibParseOutcome();
    expect(outcome, "Parser should reject a non-LIB DOCX").toBe("rejected");

    // Rejection card is visible with the canonical message + recovery actions.
    await expect(form.libModalRoot().getByText(/Upload rejected/i).first()).toBeVisible();
    await expect(
      form.libModalRoot().getByRole("link", { name: /Download WMSU LIB Template/i }).first(),
    ).toBeVisible();

    // Import button must NOT be rendered in the rejected state.
    await expect(form.libImportCommitButton()).toHaveCount(0);

    await form.cancelLibModal();

    // No budget rows added.
    const afterCount = await form.countBudgetSourceCards();
    expect(afterCount).toBe(beforeCount);
  });

  // Oversized uploads DO surface a user-visible error — the parseError
  // red banner shows "Network Error" (from axios' 413 handling). The
  // earlier `test.fail` marker was based on a wrong diagnosis: the
  // polling helper was matching only /Failed to parse/i and ignored
  // "Network Error". With waitForLibParseOutcome now detecting the
  // parseError banner by its .bg-red-50.text-red-700 class combo,
  // this test passes legitimately.
  test("LIB-IMPORT-03: oversized DOCX surfaces a user-visible error (not silent)", async ({ loggedInAs }) => {
    test.setTimeout(120_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();
    await form.gotoBudget();

    await form.openLibImportModal();

    // Synthesize an 11 MB buffer named as a DOCX. The modal advertises
    // "Maximum size 5 MB" — enforcement happens at parseLibDocument
    // (backend), which must surface a parseError or rejection card.
    const big = Buffer.alloc(11 * 1024 * 1024, 0);
    await form.attachLibBuffer("oversized.docx", big);

    const outcome = await form.waitForLibParseOutcome(45_000);

    // Require a SPECIFIC terminal state — not just "not ok". Without this
    // stricter check, a silent network failure (parser never updates the
    // modal) would pass the test vacuously. "timeout" is a test-side
    // failure, not a user-visible error, so we disallow it.
    expect(
      ["error", "rejected"],
      `Oversized LIB must produce a user-visible error/rejection state, not "${outcome}". ` +
      `A "timeout" outcome means the UI silently swallowed the failure — that's a bug.`,
    ).toContain(outcome);

    // The Import button must NOT render.
    await expect(form.libImportCommitButton()).toHaveCount(0);

    // The user MUST see some human-readable text about the failure.
    // Broaden the regex to cover "Network Error" (axios on 413), the
    // "Failed to parse..." fallback, and any backend size/exceeds
    // wording.
    const errorOrRejectionText = form
      .libModalRoot()
      .locator("text=/too large|exceeds|size|5 ?MB|parse|rejected|network|error/i")
      .first();
    await expect(
      errorOrRejectionText,
      "No size/error/rejection message visible to the user after oversized upload",
    ).toBeVisible({ timeout: 2_000 });

    await form.cancelLibModal();
  });

  test("LIB-IMPORT-04: Import button disabled when source name is cleared", async ({ loggedInAs }) => {
    test.setTimeout(120_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();
    await form.gotoBudget();

    await form.openLibImportModal();
    await form.attachLibFile(fixtureFile("sample-lib-template.docx"));

    const outcome = await form.waitForLibParseOutcome();
    expect(outcome).toBe("ok");

    // Clear the (auto-prefilled) source name input.
    const sourceInput = form.libModalRoot().getByPlaceholder(/GAA, LGUs, Industry/i).first();
    await sourceInput.fill("");

    // With a blank source name, the Import commit button must be disabled.
    const importBtn = form.libImportCommitButton();
    await expect(importBtn).toBeDisabled();

    // Typing a non-empty name re-enables it.
    await sourceInput.fill("LIB-IMPORT-04 Source");
    await expect(importBtn).toBeEnabled({ timeout: 3_000 });

    await form.cancelLibModal();
  });

  test("LIB-IMPORT-05: Cancel button closes modal without mutating budget state", async ({ loggedInAs }) => {
    test.setTimeout(60_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();
    await form.gotoBudget();

    const beforeCount = await form.countBudgetSourceCards();

    // Open, attach a valid LIB, wait for preview, then CANCEL without importing.
    await form.openLibImportModal();
    await form.attachLibFile(fixtureFile("sample-lib-template.docx"));
    const outcome = await form.waitForLibParseOutcome();
    expect(outcome).toBe("ok");

    await form.cancelLibModal();

    // Cancel must not mutate the budget; row count unchanged.
    const afterCount = await form.countBudgetSourceCards();
    expect(afterCount).toBe(beforeCount);
  });

  test("LIB-IMPORT-06: re-importing appends a second budget source card", async ({ loggedInAs }) => {
    test.setTimeout(180_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();
    await form.gotoBudget();

    // First import.
    await form.openLibImportModal();
    await form.attachLibFile(fixtureFile("sample-lib-template.docx"));
    expect(await form.waitForLibParseOutcome()).toBe("ok");
    await form.libModalRoot().getByPlaceholder(/GAA, LGUs, Industry/i).first().fill("LIB-06 First");
    await form.libImportCommitButton().click();
    await expect(page.getByRole("heading", { name: /Import WMSU LIB Template/i }))
      .toBeHidden({ timeout: 15_000 });
    await page.locator(".swal2-popup").filter({ hasText: /LIB imported/i })
      .waitFor({ state: "hidden", timeout: 8_000 })
      .catch(() => {});

    await form.cleanupEmptyBudgetScaffolding();
    const countAfterFirst = await form.countBudgetSourceCards();

    // Second import — same fixture, different source name. Must APPEND, not replace.
    await form.openLibImportModal();
    await form.attachLibFile(fixtureFile("sample-lib-template.docx"));
    expect(await form.waitForLibParseOutcome()).toBe("ok");
    await form.libModalRoot().getByPlaceholder(/GAA, LGUs, Industry/i).first().fill("LIB-06 Second");
    await form.libImportCommitButton().click();
    await expect(page.getByRole("heading", { name: /Import WMSU LIB Template/i }))
      .toBeHidden({ timeout: 15_000 });
    await page.locator(".swal2-popup").filter({ hasText: /LIB imported/i })
      .waitFor({ state: "hidden", timeout: 8_000 })
      .catch(() => {});

    const countAfterSecond = await form.countBudgetSourceCards();
    expect(countAfterSecond).toBe(countAfterFirst + 1);

    // Both named sources should be present.
    const values = await page
      .getByPlaceholder(/^e\.g\., GAA, LGUs, Industry$/)
      .evaluateAll((els) => (els as HTMLInputElement[]).map((el) => el.value));
    expect(values.some((v) => v === "LIB-06 First")).toBe(true);
    expect(values.some((v) => v === "LIB-06 Second")).toBe(true);
  });

  test("LIB-IMPORT-07: corrupt DOCX surfaces a parse error (never reaches 'ok')", async ({ loggedInAs }) => {
    test.setTimeout(60_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();
    await form.gotoBudget();

    await form.openLibImportModal();

    // Random bytes named as .docx — not a valid ZIP/Office file. The
    // parser should throw, which the modal catches into `parseError`.
    const corruptBuf = Buffer.from("this is definitely not a valid docx payload");
    await form.attachLibBuffer("corrupt.docx", corruptBuf);

    const outcome = await form.waitForLibParseOutcome(30_000);
    expect(outcome, "A corrupt DOCX must NOT produce an importable result").not.toBe("ok");
    expect(["error", "rejected"], `Unexpected outcome for corrupt DOCX: ${outcome}`)
      .toContain(outcome);

    await expect(form.libImportCommitButton()).toHaveCount(0);

    await form.cancelLibModal();
  });
});
