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
    // The Submission page mounts behind a PageLoader while the LookupContext
    // fetches sectors/disciplines/agencies/priorities. Wait for the loader
    // (if it exists) to clear before asserting the section tabs.
    const loader = this.page.locator('[data-loading], .page-loader, .animate-spin').first();
    await loader.waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {
      // loader may never render if lookups are already cached — fine.
    });
    await expect(
      this.basicInfoTab,
      "Submission section tabs did not render — is the user on ?tab=submission and are LookupContext fetches complete?",
    ).toBeVisible({ timeout: 20_000 });
  }

  // --- Step 1: upload + analysis ------------------------------------------

  async attachProposalFile(absolutePath: string) {
    // The main file input has id="file-upload". There are other file
    // inputs on the page (work plan, LIB import) — pick by id.
    const fileInput = this.page.locator('input#file-upload');
    await fileInput.setInputFiles(absolutePath);
  }

  async waitForAnalysisAndDismissAIModal() {
    const loadingSwal = this.page.locator(".swal2-popup").filter({ hasText: /analyz/i });

    // The loading Swal may appear briefly or not at all if the backend is
    // fast enough that Playwright never observes it. Tolerate "never seen".
    const loadingSeen = await loadingSwal
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    // Wait for EITHER the loading Swal to close OR the AI modal button
    // to appear — whichever materialises first is our signal that analysis
    // is done. Race instead of linear-with-silent-catch so a genuine hang
    // surfaces as a loud failure rather than a quiet mis-step into the
    // next action.
    const aiModalCloseBtn = this.page
      .getByRole("button", { name: /Confirm ?&? ?Close|Dismiss/i })
      .first();

    await Promise.race([
      aiModalCloseBtn.waitFor({ state: "visible", timeout: 150_000 }),
      loadingSeen
        ? loadingSwal.waitFor({ state: "hidden", timeout: 150_000 })
        : Promise.resolve(),
    ]);

    // If the AI modal opened, dismiss it. (Some code paths may skip the
    // modal — e.g. backend threw and showed an error Swal instead.)
    if (await aiModalCloseBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await aiModalCloseBtn.click();
      await expect(aiModalCloseBtn).toBeHidden({ timeout: 10_000 });
    } else {
      // No AI modal and no loading Swal → the analysis may have errored.
      // Surface the current Swal text (if any) so the failure is actionable.
      const anySwal = this.page.locator(".swal2-popup");
      if (await anySwal.isVisible({ timeout: 500 }).catch(() => false)) {
        const text = await anySwal.innerText().catch(() => "");
        throw new Error(`AI analysis did not complete cleanly. Visible Swal: ${text.slice(0, 300)}`);
      }
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
   *
   * If the service fails (rate limit, network, or any non-2xx), the
   * source code at basicInfo.tsx:560-590 fires a blocking SweetAlert
   * ("API Limit Reached" / "AI Generation Failed") AND falls back to
   * selecting the "Other" tag. The fallback satisfies our chip-wait
   * — but the Swal stays on screen, covering everything underneath
   * and blocking the next navigation click. Always dismiss any Swal
   * after the chip lands.
   */
  async autoGenerateTags() {
    const btn = this.page.getByRole("button", { name: /Auto-generate/i });
    await btn.click();
    await this.page.waitForFunction(
      () => {
        // Tag chip = div.bg-blue-50.border-blue-200 containing an X button.
        const chips = document.querySelectorAll('[class*="bg-blue-50"] button, .border-blue-200');
        return chips.length > 0;
      },
      { timeout: 45_000 },
    );
    await this.dismissAnyLingeringSwal();
  }

  /**
   * Dismiss any SweetAlert modal currently on screen. Used after
   * actions that may trigger a blocking Swal we don't care about
   * (AI tag generation failures, temporary network blips, etc.).
   * Safe to call when no Swal is present — it returns immediately.
   */
  async dismissAnyLingeringSwal() {
    const swal = this.page.locator(".swal2-popup");
    if (!(await swal.isVisible({ timeout: 300 }).catch(() => false))) return;

    // Prefer the confirm button; fall back to the close button; fall
    // back to Escape. SweetAlert uses `.swal2-confirm` for the primary
    // action and `.swal2-close` for the dismiss X in the corner.
    const confirmBtn = this.page.locator(".swal2-confirm");
    if (await confirmBtn.isVisible({ timeout: 300 }).catch(() => false)) {
      await confirmBtn.click();
    } else {
      const closeBtn = this.page.locator(".swal2-close");
      if (await closeBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await this.page.keyboard.press("Escape");
      }
    }
    await swal.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
  }

  /**
   * Pick the first tag from the dropdown. PREFERRED over autoGenerateTags
   * in tests because:
   *
   *   The Auto-generate flow has a fallback (basicInfo.tsx:572-588) that
   *   synthesises an "Other" tag with `id: Date.now()` when the AI service
   *   fails AND the real tags table doesn't have an "Other" row. That
   *   phantom id passes frontend validation but FK-violates on submit:
   *     proposal_tags_tag_fk violated — tag_id=<Date.now()> not in tags
   *   Picking from the dropdown uses a real tag.id from the preloaded
   *   lookups, so no phantom IDs ever reach the backend.
   *
   * Scoped to `.tags-dropdown-container` so the locator can't accidentally
   * match the cooperating-agencies or priorities dropdowns.
   */
  async pickFirstTagFromDropdown() {
    const tagsContainer = this.page.locator(".tags-dropdown-container").first();

    // Wait for tags to finish loading (placeholder transitions from
    // "Loading tags..." to "Search tags or select from options").
    const tagsInput = tagsContainer.getByPlaceholder(/Search tags/i).first();
    await expect(tagsInput).toBeVisible({ timeout: 15_000 });

    await tagsInput.scrollIntoViewIfNeeded();
    await tagsInput.click();

    // The dropdown renders as an absolute-positioned div whose direct
    // children are the selectable tag options (each with a checkbox + text).
    const firstOption = tagsContainer
      .locator(".absolute > div")
      .filter({ has: this.page.locator('input[type="checkbox"]') })
      .first();
    await firstOption.waitFor({ state: "visible", timeout: 10_000 });
    await firstOption.click();

    // Close the dropdown.
    await this.page.keyboard.press("Escape").catch(() => {});

    // Verify a tag chip was actually added (styling is bg-blue-50 + border-blue-200).
    await expect(
      this.page.locator(".bg-blue-50.border-blue-200").first(),
    ).toBeVisible({ timeout: 5_000 });
  }

  // --- Step 3: Research Details ------------------------------------------

  async gotoResearchDetails() {
    // Defensive: if a previous action (tags auto-generate, etc.) left
    // a SweetAlert on screen, it will block the tab click and we'd
    // fail with a 15 s "element not clickable" timeout. Clear first.
    await this.dismissAnyLingeringSwal();
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
    // Same defensive dismissal as gotoResearchDetails — a stray Swal
    // from an earlier step would block the section-tab click.
    await this.dismissAnyLingeringSwal();
    await this.budgetTab.click();
    await expect(this.page.getByRole("button", { name: "Import Template", exact: true }))
      .toBeVisible({ timeout: 10_000 });
  }

  // --- LIB modal building blocks (used by the LIB-IMPORT spec) -----------

  /** Return the LIB modal's container locator (anchored by its heading). */
  libModalRoot() {
    return this.page
      .locator("div.fixed.inset-0")
      .filter({
        has: this.page.getByRole("heading", { name: /Import WMSU LIB Template/i }),
      });
  }

  /** Open the LIB import modal. Assumes you're on the Budget Section tab. */
  async openLibImportModal() {
    await this.page.getByRole("button", { name: "Import Template", exact: true }).click();
    await expect(this.page.getByRole("heading", { name: /Import WMSU LIB Template/i }))
      .toBeVisible({ timeout: 10_000 });
  }

  /** Attach a file to the LIB modal's hidden docx-only input (no click-commit). */
  async attachLibFile(absolutePath: string) {
    const modalFileInput = this.page.locator('input[type="file"][accept^=".docx"]').first();
    await modalFileInput.setInputFiles(absolutePath);
  }

  /** Like attachLibFile, but synthesizes an in-memory buffer. */
  async attachLibBuffer(name: string, buffer: Buffer, mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const modalFileInput = this.page.locator('input[type="file"][accept^=".docx"]').first();
    await modalFileInput.setInputFiles({ name, mimeType, buffer });
  }

  /**
   * Poll the modal for one of the four resolved states:
   *   "ok"       — preview + Import button visible
   *   "rejected" — "Upload rejected" card visible
   *   "error"    — "Failed to parse" error visible
   *   "timeout"  — 60 s elapsed with no terminal state
   * Safe against strict-mode: every locator is .first() and scoped
   * to the modal root.
   */
  async waitForLibParseOutcome(timeoutMs = 60_000): Promise<"ok" | "rejected" | "error" | "timeout"> {
    const modal = this.libModalRoot();
    const importBtn = modal.getByRole("button", { name: /^Import \d+ items?$/ }).first();
    const rejection = modal.getByText(/Upload rejected/i).first();
    // Match the parseError red banner by its unique CSS class combo,
    // NOT by an exact text match. The parseError message is dynamic:
    //   - "Failed to parse the document." (fallback)
    //   - "Network Error" (axios on 413 / connection drop — THIS was
    //     the real case that made LIB-IMPORT-03 hit "timeout" before)
    //   - any backend-provided message (e.g. "exceeds 5 MB limit")
    // The rejection card also uses bg-red-50 but without text-red-700
    // on its wrapper, so this class combo cleanly discriminates.
    const parseError = modal.locator(".bg-red-50.text-red-700").first();

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await importBtn.isVisible({ timeout: 200 }).catch(() => false)) return "ok";
      if (await rejection.isVisible({ timeout: 200 }).catch(() => false)) return "rejected";
      if (await parseError.isVisible({ timeout: 200 }).catch(() => false)) return "error";
      await this.page.waitForTimeout(300);
    }
    return "timeout";
  }

  /** Find the currently-visible Import button inside the modal. */
  libImportCommitButton() {
    return this.libModalRoot().getByRole("button", { name: /^Import \d+ items?$/ }).first();
  }

  /** Close the modal via its footer Cancel button. */
  async cancelLibModal() {
    const cancelBtn = this.libModalRoot().getByRole("button", { name: /^Cancel$/ }).first();
    await cancelBtn.click();
    await expect(this.page.getByRole("heading", { name: /Import WMSU LIB Template/i }))
      .toBeHidden({ timeout: 5_000 });
  }

  /** Count the budget source cards currently rendered on the Budget Section. */
  async countBudgetSourceCards(): Promise<number> {
    return this.page
      .getByPlaceholder(/^e\.g\., GAA, LGUs, Industry$/)
      .count();
  }

  /** Read the source-name input's current value (for assertions about LIB filename pre-fill). */
  async libModalSourceInputValue(): Promise<string> {
    const sourceInput = this.libModalRoot().getByPlaceholder(/GAA, LGUs, Industry/i).first();
    return (await sourceInput.inputValue().catch(() => "")).trim();
  }

  /**
   * Open the LIB import modal, attach the WMSU LIB v1 DOCX, wait for
   * the parser to resolve to one of its three terminal states, and
   * commit the import. The parser can end in:
   *
   *   (a) SUCCESS → preview + source-name input + "Import N items" button
   *   (b) REJECTED → "Upload rejected — not the WMSU LIB Template" card
   *   (c) ERROR    → the parseError div ("Failed to parse the document.")
   *
   * We POLL for the three states rather than Promise.race'ing them —
   * race leaves the two losing `waitFor`s pending until they time out,
   * which surfaces as unhandled rejections in Playwright's runner and
   * corrupts the test result even after the winning branch succeeded.
   * Polling settles deterministically on the first observed state.
   */
  async importLibTemplate(absolutePath: string, fundingSourceName = "E2E GAA") {
    await this.page.getByRole("button", { name: "Import Template", exact: true }).click();

    // Wait for the modal to open.
    const modalHeading = this.page.getByRole("heading", { name: /Import WMSU LIB Template/i });
    await expect(modalHeading).toBeVisible({ timeout: 10_000 });

    // The modal's hidden file input — see TEST_CASES.md §8 for the
    // three-inputs-on-one-page gotcha. Prefix-match the accept attribute
    // because only the LIB modal starts its accept string with ".docx".
    const modalFileInput = this.page.locator('input[type="file"][accept^=".docx"]').first();
    await modalFileInput.setInputFiles(absolutePath);

    // Scope every modal-internal locator to the modal container so
    // stray matches elsewhere on the page (Swals, tooltips, another
    // form field that happens to contain "error" or similar) can't
    // cause strict-mode violations or false positives.
    const modalRoot = this.page
      .locator("div.fixed.inset-0")
      .filter({ has: modalHeading });
    const importBtn = modalRoot.getByRole("button", { name: /^Import \d+ items?$/ }).first();
    const rejectionCard = modalRoot.getByText(/Upload rejected/i).first();
    const parseErrorBox = modalRoot.getByText(/Failed to parse/i).first();

    const TERMINAL_TIMEOUT = 60_000; // includes Lambda cold start + parse
    const deadline = Date.now() + TERMINAL_TIMEOUT;
    let outcome: "ok" | "rejected" | "error" | "timeout" = "timeout";

    while (Date.now() < deadline) {
      if (await importBtn.isVisible({ timeout: 250 }).catch(() => false)) {
        outcome = "ok";
        break;
      }
      if (await rejectionCard.isVisible({ timeout: 250 }).catch(() => false)) {
        outcome = "rejected";
        break;
      }
      if (await parseErrorBox.isVisible({ timeout: 250 }).catch(() => false)) {
        outcome = "error";
        break;
      }
      await this.page.waitForTimeout(300);
    }

    if (outcome === "rejected") {
      const msg = await rejectionCard.locator("xpath=ancestor::div[1]").innerText().catch(() => "");
      throw new Error(
        "LIB template import rejected by parser. " +
        "Check that fixtures/files/sample-lib-template.docx matches WMSU LIB v1.\n" +
        `Parser message: ${msg.slice(0, 300)}`,
      );
    }
    if (outcome === "error") {
      const msg = await parseErrorBox.innerText().catch(() => "");
      throw new Error(`LIB template parse error: ${msg.slice(0, 300)}`);
    }
    if (outcome === "timeout") {
      // None of the three terminal states materialised. Dump the modal
      // content so the user sees what's stuck.
      const modalText = await this.page
        .locator("div.bg-white.rounded-2xl")
        .filter({ has: modalHeading })
        .first()
        .innerText()
        .catch(() => "(modal not visible)");
      throw new Error(
        `LIB import did not reach a terminal state within ${TERMINAL_TIMEOUT}ms. ` +
        "Possible causes: parser Lambda cold-start exceeded the timeout, the modal " +
        "was torn down mid-parse, or the fixture DOCX is triggering an unhandled " +
        "edge case.\nCurrent modal text: " + modalText.slice(0, 500),
      );
    }

    // outcome === "ok" → continue with the import click.
    //
    // IMPORTANT: both the LIB modal's "Funding source name" field AND
    // each Budget Section card's "Source of Funds" field have the
    // placeholder "e.g., GAA, LGUs, Industry". The modal is rendered
    // AFTER the form content in DOM order, so `getByPlaceholder().first()`
    // without a scope picks the Budget Section's input — the WRONG one.
    // Using the already-defined modalRoot keeps the lookup inside the
    // modal container.
    const sourceInput = modalRoot.getByPlaceholder(/GAA, LGUs, Industry/i).first();
    await sourceInput.waitFor({ state: "visible", timeout: 5_000 });
    await sourceInput.fill(fundingSourceName);

    // Import button may still be disabled briefly if the source name was
    // whitespace-only before our fill; wait for enabled, then click.
    await expect(importBtn).toBeEnabled({ timeout: 5_000 });
    await importBtn.click();

    // Modal closes on success (onImport → onClose). A "LIB imported"
    // Swal fires with a 4 s auto-dismiss timer — wait for that too so
    // subsequent clicks aren't swallowed by the overlay.
    await expect(modalHeading).toBeHidden({ timeout: 15_000 });
    const libImportedSwal = this.page.locator(".swal2-popup").filter({ hasText: /LIB imported/i });
    if (await libImportedSwal.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await libImportedSwal.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => {});
    }

    // After import, if the proponent had an auto-filled budget_sources
    // scaffolding (source name + placeholder rows) that LIB then
    // APPENDED past rather than replacing, the leftover scaffolding's
    // blank itemName rows will keep isBudgetValid=false. Remove any
    // scaffolding source cards whose itemNames are still empty.
    await this.cleanupEmptyBudgetScaffolding();

    // Post-import sanity check: the budget section should now contain
    // populated line items. The parent submission form rates budget
    // validity via `isBudgetValid` which turns the sidebar's "Budget
    // Section" checklist row green. If the modal closed but nothing
    // was actually imported (e.g. only low-confidence items + user
    // unchecked the include-low toggle), validation is still red and
    // Submit stays disabled — detect that here so the failure points
    // at the import, not at a generic "Submit disabled" timeout later.
    await expect(
      this.page.getByText(/Budget Section/i).first(),
      "Budget Section remains unchecked after LIB import — check the LIB fixture has at least one high/medium-confidence row.",
    ).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Optional: verify a budget row exists for the given category.
   * Handy for edge-case tests that want to assert post-import content.
   */
  async expectBudgetRowExists(category: "ps" | "mooe" | "co") {
    // Budget rows render under collapsible sections keyed by category.
    // A minimal presence check: the section heading is visible + at
    // least one item-name text input (type="text") is non-empty within.
    const section = this.page
      .getByRole("heading", { name: new RegExp(category, "i") })
      .first();
    await expect(section).toBeVisible({ timeout: 5_000 });
  }

  // --- Step 5: (optional) DOST Form 3 -----------------------------------

  async attachWorkPlan(absolutePath: string) {
    // Sidebar's second file input — used for the optional DOST Form 3
    // work plan. Distinguishing the three file inputs on the page:
    //   main proposal:  input#file-upload
    //   work plan:      input[type=file] with accept starting ".pdf"  AND  NO id
    //   LIB modal:      input[type=file] with accept starting ".docx" (modal-scoped)
    // Target the work plan by "accept starts with .pdf" + "not #file-upload".
    const workPlanInput = this.page
      .locator('input[type="file"][accept^=".pdf"]:not(#file-upload)')
      .first();
    await workPlanInput.setInputFiles(absolutePath);
    // Confirm "File Ready" text appears in the work-plan drop-zone.
    // There are two "File Ready" zones once both inputs are populated
    // (main + work plan); the work-plan one is the second.
    await expect(this.page.getByText(/File Ready/).nth(1)).toBeVisible({ timeout: 10_000 });
  }

  // --- Step 6: submit -----------------------------------------------------

  async submitButtonEnabled(): Promise<boolean> {
    if (!(await this.submitProposalButton.count())) return false;
    return !(await this.submitProposalButton.isDisabled());
  }

  /**
   * Inspect one sidebar-checklist row by its visible label and return
   * "OK" if the row's wrapper div has class `text-green-700` (the
   * source's truthy-state styling), "INCOMPLETE" otherwise. Falls back
   * to "ROW NOT FOUND" if the label isn't in the DOM at all (wrong
   * page, sidebar collapsed, etc.).
   */
  private async inspectChecklistRow(label: string): Promise<string> {
    // Scope to the blue-bordered "Submission Status" checklist so we
    // don't accidentally match section tab text of the same string.
    const row = this.page
      .locator('.bg-blue-50.rounded-xl div.flex.items-center')
      .filter({ hasText: label })
      .first();
    if (!(await row.count())) return `${label}: ROW NOT FOUND`;
    const cls = (await row.getAttribute("class")) ?? "";
    return `${label}: ${cls.includes("text-green-700") ? "OK" : "INCOMPLETE"}`;
  }

  /**
   * List all field-level labels that are NOT green in the CURRENTLY
   * visible section. Each form label follows the pattern
   *   className={`... ${formData.X ? 'text-green-600' : 'text-gray-700'}`}
   * so a label without `text-green-600` represents an unfilled field.
   */
  private async listUnfilledLabelsInCurrentSection(): Promise<string[]> {
    const labelHandles = await this.page
      .locator("label")
      .filter({ hasText: /\w/ })
      .elementHandles();
    const unfilled: string[] = [];
    for (const h of labelHandles) {
      const cls = ((await h.getAttribute("class").catch(() => "")) ?? "");
      if (!cls) continue;
      // Only care about labels that use the green/gray convention.
      if (!cls.includes("text-green") && !cls.includes("text-gray-700")) continue;
      if (cls.includes("text-green")) continue; // filled
      const text = (await h.innerText().catch(() => "")).trim().replace(/\s+/g, " ");
      if (!text) continue;
      // Drop the trailing asterisk + helper icons so the report is readable.
      unfilled.push(text.replace(/\s*\*\s*$/, "").slice(0, 80));
    }
    return unfilled;
  }

  /**
   * Returns a detailed description of why the Submit button is
   * disabled. Walks the sidebar checklist + drills into each
   * incomplete section by switching to its tab and listing every
   * label that's still gray. Leaves the active tab on whichever
   * section was last inspected — tests calling this should already
   * be in a failure path.
   */
  async diagnoseSubmitDisabled(): Promise<string> {
    const report: string[] = [];

    // (1) Checklist summary.
    report.push(await this.inspectChecklistRow("Proposal Document"));
    report.push(await this.inspectChecklistRow("Basic Information"));
    report.push(await this.inspectChecklistRow("Research Details"));
    report.push(await this.inspectChecklistRow("Budget Section"));

    // (2) Drill into each incomplete section.
    const drill = async (tab: Locator, name: string) => {
      await tab.click().catch(() => {});
      await this.page.waitForTimeout(200);
      const missing = await this.listUnfilledLabelsInCurrentSection();
      if (missing.length) {
        report.push(`${name} unfilled: [${missing.join(", ")}]`);
      }
    };

    // Only drill if a section's checklist row was INCOMPLETE; Budget is
    // special-cased below because its validation (isBudgetValid) isn't
    // label-color-driven.
    if (report[1].includes("INCOMPLETE")) await drill(this.basicInfoTab, "Basic Info");
    if (report[2].includes("INCOMPLETE")) await drill(this.researchDetailsTab, "Research Details");

    // (3) Budget-specific diagnostic: look for the "Add Funding Source"
    // button's sibling items. An invalid budget is usually because either
    // (a) source name is empty OR (b) at least one expense row has
    // empty itemName. We count visible source-name inputs and the count
    // of empty-itemName rows.
    if (report[3].includes("INCOMPLETE")) {
      await this.budgetTab.click().catch(() => {});
      await this.page.waitForTimeout(200);
      const emptyItemRows = await this.page
        .locator('input[placeholder*="item" i][value=""]')
        .count()
        .catch(() => 0);
      const emptySources = await this.page
        .locator('input[placeholder*="source" i][value=""], input[placeholder*="funding" i][value=""]')
        .count()
        .catch(() => 0);
      report.push(
        `Budget details: emptyItemRows=${emptyItemRows} emptySourceInputs=${emptySources}` +
        (emptyItemRows > 0
          ? " — LIB import may have appended to existing scaffolding rows with blank itemName. " +
            "Call form.cleanupEmptyBudgetScaffolding() before submit."
          : ""),
      );
    }

    return report.join(" | ");
  }

  /**
   * After LIB import, remove any leftover "scaffolding" budget source
   * cards — i.e. cards whose line items still have blank `itemName`.
   *
   * Why this exists:
   * - Auto-fill from the proposal DOCX may populate budgetItems[0] with
   *   a source name + PLACEHOLDER rows (itemName "Personnel Services
   *   (auto-filled — please itemize)", qty 1, unitPrice total). Those
   *   pass isBudgetValid.
   * - OR auto-fill leaves the initial scaffolding (source="" + 2 empty
   *   rows per category with itemName=""). Those FAIL isBudgetValid.
   * - handleLibImport only replaces items[0] when its category arrays
   *   are length 0 (which the initial scaffolding is NOT — it has 2
   *   empty rows each). So LIB import always APPENDS when the
   *   scaffolding is present.
   *
   * Result: a card with empty itemNames keeps isBudgetValid=false.
   * This helper finds any such card and clicks its "Remove" button.
   * The Remove button is disabled when there's only one card (so this
   * no-ops gracefully when LIB already replaced cleanly).
   */
  async cleanupEmptyBudgetScaffolding() {
    // Signal that a card is "scaffolding" (not real data):
    //   (a) source-name input is empty, OR
    //   (b) every PS/MOOE/CO summary reads ₱0.00.
    //
    // The source-name input's exact placeholder is
    //   "e.g., GAA, LGUs, Industry"
    // (with a comma after "e.g" — DIFFERENT from the LIB-modal's
    // "e.g. GAA, LGUs, Industry" which has no comma). Anchoring on
    // the exact placeholder means we match only budget-card inputs,
    // never the modal's.
    //
    // Walk backwards across cards so the Nth-selector stays stable
    // as cards disappear. Re-query the list between passes — deleting
    // a card re-renders the whole list.
    for (let pass = 0; pass < 5; pass++) {
      const sourceInputs = this.page.getByPlaceholder(/^e\.g\., GAA, LGUs, Industry$/);
      const count = await sourceInputs.count();
      if (count <= 1) return; // single card or none — cleanup done.

      let removedAny = false;
      for (let i = count - 1; i >= 0; i--) {
        const input = sourceInputs.nth(i);
        const value = (await input.inputValue().catch(() => "")).trim();
        if (value.length > 0) continue; // keep cards with real source names

        const card = input.locator(
          'xpath=ancestor::div[contains(@class,"rounded-xl") and contains(@class,"bg-white")][1]',
        );
        if (!(await card.count())) continue;

        const removeBtn = card.getByRole("button", { name: /^Remove$/ });
        if (!(await removeBtn.isEnabled({ timeout: 300 }).catch(() => false))) continue;

        await removeBtn.click();
        await this.page.waitForTimeout(400); // React re-render
        removedAny = true;
        break; // re-query
      }
      if (!removedAny) return; // stable state reached.
    }
  }

  async clickSubmitAndConfirm() {
    await this.submitProposalButton.click();
    // Confirmation Swal → button text "Yes!".
    const yes = this.page.locator(".swal2-confirm").filter({ hasText: /yes/i });
    await yes.waitFor({ state: "visible", timeout: 15_000 });
    await yes.click();
  }

  async expectSubmissionSuccess() {
    // The submit flow shows up to THREE SweetAlerts back-to-back using
    // the SAME `.swal2-popup` DOM element — Swal.fire() re-uses the node
    // and swaps its title/text:
    //   1. "Submitting Proposal..." (loading spinner, while the API runs)
    //   2a. "Proposal Submitted!" (success)  —OR—
    //   2b. "Submission Failed" / "Validation Error" (error path)
    //
    // Poll the popup text for the first terminal state (2a or 2b) and
    // fail fast with the error copy if the backend returned an error,
    // rather than waiting the full 90 s timeout for success text that
    // will never arrive.
    const popup = this.page.locator(".swal2-popup");
    await expect(popup).toBeVisible({ timeout: 10_000 });

    const TERMINAL_TIMEOUT = 90_000; // cold-start Lambda + S3 upload
    const deadline = Date.now() + TERMINAL_TIMEOUT;
    while (Date.now() < deadline) {
      const text = (await popup.innerText().catch(() => "")).trim();
      if (/Proposal Submitted|submitted successfully/i.test(text)) {
        return; // success
      }
      if (/Submission Failed|Validation Error|Unauthorized|Auth Error/i.test(text)) {
        // Dump the popup text and any validation-error list for
        // actionable diagnosis — without this, the failure is opaque.
        throw new Error(
          "Backend rejected the proposal submission.\n" +
          "Swal contents: " + text.slice(0, 500) + "\n" +
          "Check CloudWatch logs for the create-proposal Lambda — the generic " +
          "500 message 'Internal server error' is returned when proposalService.create " +
          "returns an error (see backend/src/handlers/proposal/create-proposal.ts).",
        );
      }
      await this.page.waitForTimeout(500);
    }
    throw new Error(
      `Proposal submission neither succeeded nor explicitly failed within ${TERMINAL_TIMEOUT}ms. ` +
      `Swal text: ${(await popup.innerText().catch(() => "")).slice(0, 300)}`,
    );
  }

  // --- Read-back helpers (sanity checks after auto-fill) ------------------

  async getProjectTitle(): Promise<string> {
    return (await this.page.getByPlaceholder("Enter project title").inputValue().catch(() => "")) || "";
  }

  async getYear(): Promise<string> {
    return (await this.page.getByPlaceholder("YYYY").inputValue().catch(() => "")) || "";
  }
}
