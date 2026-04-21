import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for the proposal submission multi-step form
 * (frontend/src/pages/users/Proponent/submission/).
 *
 * END-TO-END FLOW (the whole reason this file is long — there is a lot
 * going on, and the test must drive all of it):
 *
 *   1. Click "Submission" sidebar button → URL becomes ?tab=submission.
 *   2. Drop a PDF/DOC/DOCX onto the main upload zone. `handleFileSelect`
 *      AUTO-TRIGGERS the AI analysis, no second click needed.
 *   3. SweetAlert "Analyzing Proposal..." loading modal appears.
 *   4. `applyAutoFill()` populates MOST of Basic Info + Research Details
 *      from the DOCX (program/project title, year, telephone, email,
 *      agency, city, classification_type, class_input, priorities_id,
 *      sector, discipline, planned dates, duration).
 *      **It does NOT populate: tags, implementation_site, budget items.**
 *      The Year input is READONLY — only auto-fill can set it.
 *   5. Loading Swal closes; an in-app AI Modal opens.
 *   6. Click "Confirm & Close" / "Dismiss" to close the AI modal.
 *
 *   7. Basic Info tab — still active:
 *        - Click "Auto-generate" (the little pill next to the Tags label)
 *          to let the AI tag service produce 1–4 tags from the title.
 *          This covers the tags gap in auto-fill.
 *        - OR pick a tag manually from the dropdown.
 *
 *   8. Click the "Research Details" section-tab button (top of the form).
 *        - Add at least ONE implementation site:
 *            - Type a site name in "Site Name 1".
 *            - Click the "Type City/Municipality 1" input; a typeahead
 *              dropdown appears. Click a city option — you MUST pick
 *              from the dropdown, otherwise onBlur validation sets
 *              cityErrors[i]=true and the section stays invalid.
 *
 *   9. Click the "Budget Section" section-tab button.
 *        - Click "Import Template" → the LibImportModal opens.
 *        - In the modal, click "Choose file" → attach the WMSU LIB
 *          Template v1 DOCX (fixtures/files/sample-lib-template.docx).
 *        - After parsing, the modal shows a preview with a
 *          "Funding source name" input (prefilled from the filename).
 *        - Click the "Import N items" button to commit.
 *
 *  10. OPTIONAL: In the sidebar, attach a DOST Form 3 (work & financial
 *      plan) DOCX. Test PROP-SUBMIT-06 covers this path.
 *
 *  11. Click the sidebar's "Submit Proposal" button. If every section's
 *      completion check passes, this opens a "Confirm Submission" Swal.
 *  12. Click "Yes!" on the confirmation Swal.
 *  13. Swal success toast — proposal is now in review_rnd status.
 *
 * If something blocks progress, `diagnoseSubmitDisabled()` returns a
 * human-readable reason to attach to the failing assertion.
 */
export class ProposalSubmissionPage {
  readonly page: Page;

  // Section tabs ------------------------------------------------------------
  readonly basicInfoTab: Locator;
  readonly researchDetailsTab: Locator;
  readonly budgetTab: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;

  // Sidebar -----------------------------------------------------------------
  readonly submitProposalButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.basicInfoTab = page.getByRole("button", { name: "Basic Information", exact: true });
    this.researchDetailsTab = page.getByRole("button", { name: "Research Details", exact: true });
    this.budgetTab = page.getByRole("button", { name: "Budget Section", exact: true });
    this.nextButton = page.getByRole("button", { name: /^Next$/ });
    this.previousButton = page.getByRole("button", { name: /^Previous$/ });
    this.submitProposalButton = page.getByRole("button", { name: /Submit Proposal/ });
  }

  async expectOpen() {
    await expect(this.basicInfoTab).toBeVisible({ timeout: 20_000 });
  }

  // --- Step 1: upload + analysis ------------------------------------------

  async attachProposalFile(absolutePath: string) {
    // The main file input has id="file-upload". There are other file
    // inputs on the page (work plan, LIB import) — pick by id.
    const fileInput = this.page.locator('input#file-upload');
    await fileInput.setInputFiles(absolutePath);
  }

  async waitForAnalysisAndDismissAIModal() {
    // The "Analyzing Proposal..." loading Swal is shown, then Swal.close()
    // fires and the in-app AI modal opens.
    const loadingSwal = this.page.locator(".swal2-popup").filter({ hasText: /analyz/i });
    await loadingSwal.waitFor({ state: "visible", timeout: 30_000 }).catch(() => {});
    await loadingSwal.waitFor({ state: "hidden", timeout: 120_000 }).catch(() => {});

    // Close the AI modal via its footer button.
    const closeBtn = this.page.getByRole("button", { name: /Confirm ?&? ?Close|Dismiss/i }).first();
    if (await closeBtn.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await closeBtn.click();
      await expect(closeBtn).toBeHidden({ timeout: 5_000 }).catch(() => {});
    }
  }

  // --- Step 2: Basic Info fills that auto-fill misses ---------------------

  /**
   * Ensure the **Funding Agency** strict lookup is resolved to a real
   * FK id. Under the new taxonomy (backend proposal-schema.ts, 2026-04-21)
   * agency/sector/discipline no longer auto-create from free text — if
   * auto-fill couldn't match the DOCX's agency name to a row in
   * `agencies`, the field stays blank and an amber hint is shown.
   *
   * This helper detects that state (amber hint visible OR input empty)
   * and picks the first available option from the dropdown. Idempotent:
   * if an agency is already picked cleanly, it returns immediately.
   */
  async ensureFundingAgencyPicked() {
    const unmatchedHint = this.page.getByText(/couldn't match this to our agency list/i);
    const input = this.page.getByPlaceholder("Search or type your agency name");

    const hintVisible = await unmatchedHint.isVisible({ timeout: 500 }).catch(() => false);
    const currentValue = await input.inputValue().catch(() => "");

    // If the input has a value AND no hint, a real FK has been picked.
    // (handleAgencyNameSelect sets the input to the agency name AND
    // updates formData.agency to the numeric id.)
    if (!hintVisible && currentValue.trim().length > 0) return;

    await input.click();
    await input.fill(""); // clear any residual text so the full list appears
    // Dropdown renders options as absolute-positioned divs under the input.
    const firstOption = this.page
      .locator(".absolute.z-20 > div")
      .filter({ has: this.page.locator("span") })
      .first();
    await firstOption.waitFor({ state: "visible", timeout: 5_000 });
    await firstOption.click();
  }

  /**
   * Click the "Auto-generate" tags button and wait until at least one
   * tag chip appears. The backend AI service needs the project_title
   * (which is already auto-filled by the earlier analysis) to run.
   */
  async autoGenerateTags() {
    const btn = this.page.getByRole("button", { name: /Auto-generate/i });
    await btn.click();
    // Success = either a tag chip appears in the "selectedTags" area,
    // or the API rate-limits and fallback "Other" is picked. Either way,
    // a chip is visible.
    const anyTagChip = this.page.locator(".text-blue-700.border-blue-200, [class*='bg-blue-50']").first();
    // The selected-tags area only renders when selectedTags.length > 0,
    // so waiting for any visible tag chip with an "×" close button is
    // the most reliable signal.
    await this.page.waitForFunction(
      () => {
        // Tag chips contain an × (X) button and match the styling; any
        // button inside a .bg-blue-50 container is a tag remove control.
        const chips = document.querySelectorAll('[class*="bg-blue-50"] button, .border-blue-200');
        return chips.length > 0;
      },
      { timeout: 45_000 },
    );
  }

  /**
   * Fallback: pick the first tag from the dropdown. Used when the
   * AI tag service is unavailable in the test env.
   */
  async pickFirstTagFromDropdown() {
    const tagsInput = this.page.getByPlaceholder(/Search tags|Loading tags/).first();
    await tagsInput.click();
    const firstOption = this.page.locator('[class*="cursor-pointer"]').filter({ hasText: /./ }).first();
    await firstOption.click();
    // Click outside to close the dropdown.
    await this.page.locator("body").click({ position: { x: 10, y: 10 } });
  }

  // --- Step 3: Research Details ------------------------------------------

  async gotoResearchDetails() {
    await this.researchDetailsTab.click();
    // Heading + "Implementation Sites" label should be visible.
    await expect(this.page.getByText(/Implementation Sites/i).first()).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Strict-taxonomy guard: Sector must be a real FK id, else Submit stays
   * disabled. Mirrors `ensureFundingAgencyPicked` for the Research tab.
   */
  async ensureSectorPicked() {
    const unmatchedHint = this.page.getByText(/couldn't match this to our sector list/i);
    const input = this.page.getByPlaceholder(/Search sector|Loading sectors/i);

    const hintVisible = await unmatchedHint.isVisible({ timeout: 500 }).catch(() => false);
    const currentValue = await input.inputValue().catch(() => "");

    if (!hintVisible && currentValue.trim().length > 0) return;

    await input.click();
    await input.fill("");
    const firstOption = this.page
      .locator(".absolute.z-20 > div")
      .filter({ has: this.page.locator("span") })
      .first();
    await firstOption.waitFor({ state: "visible", timeout: 5_000 });
    await firstOption.click();
  }

  async ensureDisciplinePicked() {
    const unmatchedHint = this.page.getByText(/couldn't match this to our discipline list/i);
    const input = this.page.getByPlaceholder(/Search discipline|Loading disciplines/i);

    const hintVisible = await unmatchedHint.isVisible({ timeout: 500 }).catch(() => false);
    const currentValue = await input.inputValue().catch(() => "");

    if (!hintVisible && currentValue.trim().length > 0) return;

    await input.click();
    await input.fill("");
    const firstOption = this.page
      .locator(".absolute.z-20 > div")
      .filter({ has: this.page.locator("span") })
      .first();
    await firstOption.waitFor({ state: "visible", timeout: 5_000 });
    await firstOption.click();
  }

  /**
   * Priorities is a strict multi-select. If no pill exists, pick the
   * first item from the dropdown. Admin-managed taxonomy — free-text
   * entries are silently dropped under the new rules.
   */
  async ensurePriorityPicked() {
    // Priority chips live in a container just above the input. A single
    // picked priority is enough for validation.
    const existingPill = this.page.locator(
      ".inline-flex.items-center.gap-1\\.5.px-3.py-1\\.5.bg-blue-50",
    );
    if (await existingPill.count()) return;

    const input = this.page.getByPlaceholder(/priority area|Loading priorities/i);
    await input.click();
    // The priority dropdown option uses checkbox + text inside a cursor-pointer div.
    const firstOption = this.page
      .locator(".absolute.z-20 > div")
      .filter({ has: this.page.locator('input[type="checkbox"]') })
      .first();
    await firstOption.waitFor({ state: "visible", timeout: 5_000 });
    await firstOption.click();
    // Click outside so the blur handler closes the dropdown.
    await this.page.locator("body").click({ position: { x: 10, y: 10 } });
  }

  /**
   * Fill the first implementation-site row. The city field is a
   * typeahead over the PSGC dataset — on blur, if the text doesn't
   * match an option exactly, cityErrors[i]=true is set and the city
   * is wiped. So we MUST pick from the dropdown.
   */
  async fillFirstImplementationSite(opts: { siteName: string; cityQuery: string }) {
    const siteInput = this.page.getByPlaceholder("Site Name 1").first();
    await siteInput.fill(opts.siteName);

    const cityInput = this.page.getByPlaceholder("Type City/Municipality 1").first();
    await cityInput.click();
    await cityInput.fill(opts.cityQuery);

    // Wait for the dropdown to render and click the first match.
    const firstCityOption = this.page
      .locator(".custom-scrollbar, .animate-in.zoom-in-95")
      .locator("div")
      .filter({ hasText: new RegExp(opts.cityQuery, "i") })
      .first();
    // Give PSGC autocomplete up to 5s to populate.
    await firstCityOption.waitFor({ state: "visible", timeout: 5_000 });
    await firstCityOption.click();
  }

  // --- Step 4: Budget via LIB import -------------------------------------

  async gotoBudget() {
    await this.budgetTab.click();
    await expect(this.page.getByRole("button", { name: "Import Template", exact: true }))
      .toBeVisible({ timeout: 10_000 });
  }

  /**
   * Open the LIB import modal, attach the WMSU LIB v1 DOCX, wait for
   * the parser, set a funding source name if needed, and click Import.
   */
  async importLibTemplate(absolutePath: string, fundingSourceName = "E2E GAA") {
    await this.page.getByRole("button", { name: "Import Template", exact: true }).click();

    // Wait for the modal to open.
    await expect(this.page.getByRole("heading", { name: /Import WMSU LIB Template/i }))
      .toBeVisible({ timeout: 10_000 });

    // The modal uses a "Choose file" button wired to a hidden <input
    // type="file" accept=".docx">. setInputFiles works directly on the
    // input without clicking the visible button.
    const modalFileInput = this.page.locator('input[type="file"][accept*="docx"]').first();
    await modalFileInput.setInputFiles(absolutePath);

    // Parsing state → wait for "Parsing your LIB document..." to vanish.
    const parsingIndicator = this.page.getByText(/Parsing your LIB document/i);
    await parsingIndicator.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
    await parsingIndicator.waitFor({ state: "hidden", timeout: 30_000 }).catch(() => {});

    // If the template was rejected, fail loudly with the rejection
    // message rather than timing out on the Import button later.
    const rejection = this.page.getByText(/Upload rejected — not the WMSU LIB Template/i);
    if (await rejection.isVisible({ timeout: 1_000 }).catch(() => false)) {
      throw new Error(
        "LIB template import rejected. Check fixtures/files/sample-lib-template.docx " +
        "matches WMSU LIB Template v1.",
      );
    }

    // Funding source input: prefilled from the file basename, but we
    // overwrite to a known value so downstream assertions can match it.
    const sourceInput = this.page.getByPlaceholder(/GAA, LGUs, Industry/i);
    if (await sourceInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await sourceInput.fill(fundingSourceName);
    }

    // Click the commit button ("Import N items").
    const importBtn = this.page.getByRole("button", { name: /^Import \d+ items?$/ });
    await importBtn.waitFor({ state: "visible", timeout: 10_000 });
    await importBtn.click();

    // Modal closes on success (onImport → onClose).
    await expect(this.page.getByRole("heading", { name: /Import WMSU LIB Template/i }))
      .toBeHidden({ timeout: 15_000 });
  }

  // --- Step 5: (optional) DOST Form 3 -----------------------------------

  async attachWorkPlan(absolutePath: string) {
    // Sidebar has a second input[type=file] for the work plan.
    // There's no id on it, so locate by the nearest "DOST Form 3" label.
    const workPlanInput = this.page.locator('input[type="file"][accept*="docx"]').nth(1);
    await workPlanInput.setInputFiles(absolutePath);
    // Confirm "File Ready" text appears in the work-plan drop-zone.
    await expect(this.page.getByText(/File Ready/).nth(1)).toBeVisible({ timeout: 10_000 });
  }

  // --- Step 6: submit -----------------------------------------------------

  async submitButtonEnabled(): Promise<boolean> {
    if (!(await this.submitProposalButton.count())) return false;
    return !(await this.submitProposalButton.isDisabled());
  }

  /**
   * Returns a best-effort description of why the Submit button is
   * disabled. Used in assertions so a failing test surfaces the cause
   * instead of a terse "element is not enabled" timeout.
   */
  async diagnoseSubmitDisabled(): Promise<string> {
    // The upload sidebar has a small checklist with three indicator rows:
    //   Basic Info | Research Details | Budget Section.
    // Each is green when complete, gray when not. Scrape their text.
    const diag: string[] = [];
    for (const label of ["Basic Info", "Research Details", "Budget Section"]) {
      const row = this.page.locator(`text=${label}`).first();
      const classes = (await row.getAttribute("class").catch(() => "")) ?? "";
      diag.push(`${label}: ${classes.includes("green") ? "OK" : "INCOMPLETE"}`);
    }
    return diag.join(" | ");
  }

  async clickSubmitAndConfirm() {
    await this.submitProposalButton.click();
    // Confirmation Swal → button text "Yes!".
    const yes = this.page.locator(".swal2-confirm").filter({ hasText: /yes/i });
    await yes.waitFor({ state: "visible", timeout: 15_000 });
    await yes.click();
  }

  async expectSubmissionSuccess() {
    const popup = this.page.locator(".swal2-popup");
    await expect(popup).toBeVisible({ timeout: 60_000 });
    await expect(popup).toContainText(/success|submitted|created/i);
  }

  // --- Read-back helpers (sanity checks after auto-fill) ------------------

  async getProjectTitle(): Promise<string> {
    return (await this.page.getByPlaceholder("Enter project title").inputValue().catch(() => "")) || "";
  }

  async getYear(): Promise<string> {
    return (await this.page.getByPlaceholder("YYYY").inputValue().catch(() => "")) || "";
  }
}
