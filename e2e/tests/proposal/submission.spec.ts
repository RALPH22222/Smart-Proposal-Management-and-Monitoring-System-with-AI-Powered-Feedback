import { test, expect, fixtureFile } from "../../fixtures/test";
import { ProposalSubmissionPage } from "../../pages/ProposalSubmissionPage";
import { ProponentLayout } from "../../pages/ProponentLayout";

/**
 * PROP-SUBMIT: proposal submission happy path + validation edges.
 *
 * The real submission flow after DOCX upload + AI analysis has THREE
 * sections, and auto-fill only handles parts of the first two:
 *
 *   Basic Info    — auto-fill covers everything EXCEPT tags.
 *   Research      — auto-fill covers sector/discipline/classification
 *                   /priorities, BUT NOT implementation_site.
 *   Budget        — NOT auto-filled at all. The simplest path is to
 *                   use the "Import Template" button in the budget
 *                   section, which parses the WMSU LIB v1 DOCX and
 *                   generates all PS/MOOE/CO line items in one go.
 *
 * So the test drives: upload proposal → dismiss AI modal →
 * auto-generate tags → go to Research Details → add 1 implementation
 * site → go to Budget → import LIB template → Submit → confirm "Yes!".
 */

const RUN_ID = `E2E-${Date.now()}`;

test.describe.serial("PROP-SUBMIT: proposal submission", () => {
  test("PROP-SUBMIT-01: proponent submits a complete proposal end-to-end", async ({ loggedInAs }, testInfo) => {
    // Real Lambda cold start + AI analysis + LIB parse + S3 upload → generous timeout.
    test.setTimeout(240_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    // (1) Open submission page.
    await layout.openSubmission();
    await form.expectOpen();

    // (2) Upload the DOCX. AI analysis auto-starts.
    await form.attachProposalFile(fixtureFile("sample-proposal.docx"));
    await form.waitForAnalysisAndDismissAIModal();

    // Sanity-check that auto-fill worked — if project_title is empty
    // the DOCX didn't match the template and the rest of the flow
    // would be a cascade of failures.
    const projectTitle = await form.getProjectTitle();
    expect(projectTitle, "Auto-fill did not populate project_title — is the DOCX a valid DOST Form 1B?")
      .not.toBe("");
    const year = await form.getYear();
    expect(Number(year), "Auto-fill did not populate Year (readonly input)").toBeGreaterThan(1999);

    // (3) Basic Info — auto-fill covered everything except tags and
    // (post-taxonomy-rewrite) possibly the strict Funding Agency.
    await form.ensureFundingAgencyPicked();
    // Pick a real tag from the dropdown instead of using Auto-generate.
    // The AI Auto-generate has a fallback path (basicInfo.tsx:572-588)
    // that synthesizes a fake tag_id=Date.now() when the AI service
    // fails AND no "Other" tag exists in the tags table — that fake id
    // then FK-violates on submit (proposal_tags_tag_fk). Dropdown picks
    // use real tag.id values from the preloaded lookup.
    await form.pickFirstTagFromDropdown();

    // (4) Research Details — add 1 implementation site, and backstop
    // sector/discipline/priorities in case auto-fill's fuzzy match
    // missed the admin-managed taxonomies (they no longer fall back
    // to free text — unmatched names are dropped and the field stays
    // blank with an amber hint).
    await form.gotoResearchDetails();
    await form.ensureSectorPicked();
    await form.ensureDisciplinePicked();
    await form.ensurePriorityPicked();
    await form.fillFirstImplementationSite({
      siteName: "E2E Test Site A",
      cityQuery: "Zamboanga",
    });

    // (5) Budget — import the WMSU LIB template.
    await form.gotoBudget();
    await form.importLibTemplate(fixtureFile("sample-lib-template.docx"), "E2E GAA");

    // (6) Submit — everything should now pass the sidebar's isFormValid check.
    if (!(await form.submitButtonEnabled())) {
      const diag = await form.diagnoseSubmitDisabled();
      throw new Error(`Submit button still disabled after all sections filled. Checklist: ${diag}`);
    }

    await form.clickSubmitAndConfirm();
    await form.expectSubmissionSuccess();

    // Persist the auto-filled title for downstream tests (RND QC, etc.).
    await testInfo.attach("proposal-title.txt", {
      body: projectTitle,
      contentType: "text/plain",
    });
    process.env.E2E_PROPOSAL_TITLE = projectTitle;
  });

  test("PROP-SUBMIT-02: invalid file type is rejected before any analysis", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();

    // The onChange handler rejects non-pdf/doc/docx files BEFORE any
    // analysis runs.
    const fileInput = page.locator('input#file-upload');
    await fileInput.setInputFiles({
      name: "not-a-proposal.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("this is not a proposal"),
    });

    const popup = page.locator(".swal2-popup");
    await expect(popup).toBeVisible({ timeout: 10_000 });
    await expect(popup).toContainText(/invalid file type|pdf|doc|docx/i);
  });

  test("PROP-SUBMIT-03: Submit button stays disabled before any data is entered", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();

    // No file, no fields filled — sidebar Submit is disabled.
    expect(await form.submitButtonEnabled()).toBe(false);
  });

  test("PROP-SUBMIT-04: Submit stays disabled after upload when tags + sites + budget are still empty", async ({ loggedInAs }) => {
    test.setTimeout(180_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();

    await form.attachProposalFile(fixtureFile("sample-proposal.docx"));
    await form.waitForAnalysisAndDismissAIModal();

    // Auto-fill did its bit, but tags/sites/budget are still empty.
    // The sidebar's isFormValid gate should keep Submit disabled.
    expect(await form.submitButtonEnabled()).toBe(false);
  });

  test("PROP-SUBMIT-05: oversized file (>10 MB) is rejected at the upload gate", async ({ loggedInAs }) => {
    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();

    const big = Buffer.alloc(11 * 1024 * 1024, 0);
    const fileInput = page.locator('input#file-upload');
    await fileInput.setInputFiles({
      name: "huge.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: big,
    });

    const popup = page.locator(".swal2-popup");
    await expect(popup).toBeVisible({ timeout: 10_000 });
    await expect(popup).toContainText(/too large|10 ?MB|size/i);
  });

  test("PROP-SUBMIT-06: submitting with optional DOST Form 3 work plan attached", async ({ loggedInAs }, testInfo) => {
    // Same happy path as -01, but with the optional work-plan file
    // attached to confirm the upload sidebar's second file input is
    // wired correctly and doesn't interfere with the main flow.
    test.setTimeout(240_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();

    await form.attachProposalFile(fixtureFile("sample-proposal.docx"));
    await form.waitForAnalysisAndDismissAIModal();
    const projectTitle = `${await form.getProjectTitle()} (with Form 3)`;

    await form.ensureFundingAgencyPicked();
    // Pick a real tag from the dropdown instead of using Auto-generate.
    // The AI Auto-generate has a fallback path (basicInfo.tsx:572-588)
    // that synthesizes a fake tag_id=Date.now() when the AI service
    // fails AND no "Other" tag exists in the tags table — that fake id
    // then FK-violates on submit (proposal_tags_tag_fk). Dropdown picks
    // use real tag.id values from the preloaded lookup.
    await form.pickFirstTagFromDropdown();

    await form.gotoResearchDetails();
    await form.ensureSectorPicked();
    await form.ensureDisciplinePicked();
    await form.ensurePriorityPicked();
    await form.fillFirstImplementationSite({
      siteName: "E2E Form-3 Site A",
      cityQuery: "Zamboanga",
    });

    await form.gotoBudget();
    await form.importLibTemplate(fixtureFile("sample-lib-template.docx"), "E2E GAA-F3");

    // Attach the optional DOST Form 3. Use a different DOCX than the
    // main proposal (sample-lib-template.docx) so the S3 upload + any
    // backend deduplication don't see two files with identical names/
    // contents. The backend only checks MIME/extension/size, not
    // template shape, so any valid DOCX is fine here.
    await form.attachWorkPlan(fixtureFile("sample-lib-template.docx"));

    expect(await form.submitButtonEnabled()).toBe(true);
    await form.clickSubmitAndConfirm();
    await form.expectSubmissionSuccess();

    await testInfo.attach("proposal-title-with-form3.txt", {
      body: projectTitle,
      contentType: "text/plain",
    });
    // Stash so downstream admin-view tests can find a proposal with a
    // work plan attached. Separate env var from E2E_PROPOSAL_TITLE so
    // each test knows exactly which proposal it's referencing.
    process.env.E2E_PROPOSAL_WITH_WORKPLAN_TITLE = projectTitle;
  });

  test("PROP-SUBMIT-07: strict-taxonomy unmatched fields block Submit until resolved", async ({ loggedInAs }) => {
    test.setTimeout(180_000);

    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    const form = new ProposalSubmissionPage(page);

    await layout.openSubmission();
    await form.expectOpen();

    await form.attachProposalFile(fixtureFile("sample-proposal.docx"));
    await form.waitForAnalysisAndDismissAIModal();

    // If the DOCX contained a sector/discipline/agency that doesn't exist
    // in our Supabase lookup rows, the form renders amber "couldn't match"
    // hints and leaves the FK field blank. If the DOCX matched everything
    // cleanly, no hints render. Either way, Submit must remain disabled
    // because tags / implementation site / budget still aren't filled.
    expect(await form.submitButtonEnabled()).toBe(false);

    // Whenever a hint IS visible, verify the explanatory copy is present.
    // This doubles as a regression test for the inline guidance copy.
    const anyHint = page.getByText(/couldn't match this to our (agency|sector|discipline) list/i);
    const hintCount = await anyHint.count();
    if (hintCount > 0) {
      await expect(anyHint.first()).toBeVisible();
      await expect(anyHint.first()).toContainText(/pick the closest option above/i);
    }
  });

  test("PROP-SUBMIT-08: proponent sees the submitted proposal in their Profile tab", async ({ loggedInAs }) => {
    test.skip(!process.env.E2E_PROPOSAL_TITLE, "PROP-SUBMIT-01 must have succeeded first.");

    const title = process.env.E2E_PROPOSAL_TITLE!;
    const { page } = await loggedInAs("proponent");
    const layout = new ProponentLayout(page);
    await layout.openProfile();
    // Use .first() — the auto-filled title is shared by every proposal
    // this test has ever created (title is extracted from the DOCX by
    // the AI analyzer, so every run produces the same string). Multiple
    // matches are the expected state, not a failure. We just need to
    // verify at least one proposal with this title landed in profile.
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  });
});
