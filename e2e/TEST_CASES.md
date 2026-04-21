# SPMAMS E2E Test Case Catalogue

This document is the authoritative index of every automated end-to-end test
in the `e2e/` suite. Every time a test is added, removed, renamed, or its
behaviour materially changes, **this document must be updated in the same
commit** as the test file.

> **Docs-as-contract:** The Test ID, Preconditions, Steps, and Expected
> columns describe what the test is *supposed* to do. The spec file is the
> executable truth. If the two drift, fix whichever is wrong — don't leave
> them out of sync.

---

## Conventions

- **Test ID** — `<AREA>-<NN>`. Area tags: `AUTH-LOGIN`, `AUTH-REG`,
  `AUTH-FORGOT`, `AUTH-LOGOUT`, `PROP-SUBMIT`, `RND-QC`, `EVAL-REVIEW`,
  `RND-ENDORSE`, `MON-FUND`, `MON-REPORT`, `MON-CERT`, `RBAC`, `ADMIN`.
- **Scope** — `happy` / `error` / `edge` / `smoke`.
- **Role** — who the test logs in as. `—` means the test runs anonymously.
- **Depends on** — other test IDs that must have passed first. Tests in a
  single file are serial (`test.describe.serial`); cross-file dependencies
  are tracked through `process.env.E2E_PROPOSAL_TITLE`.

---

## Navigation reference (real DOM)

All role dashboards use a **sidebar of `<button>` elements** (not links)
and switch content via URL query param `?tab=<id>`. Tests click buttons
by their exact visible label.

| Role       | Sidebar buttons (top to bottom)                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------- |
| Proponent  | `Profile`, `Submission`, `Monitoring`, `Settings`, `Logout` (internal). External: `My Projects`, `Profile` |
| RND        | `Dashboard`, `Proposals`, `Evaluators`, `Endorsements`, `Project Funding`, `Project Monitoring`, `Settings`, `Logout` |
| Evaluator  | `Dashboard`, `Proposals`, `Under Review`, `Completed Reviews`, `Settings`, `Logout`               |
| Admin      | `Dashboard`, `Activity Logs`, `Evaluator Performance`, `Accounts`, `Contents`, `Lookups`, `Proposals`, `Evaluators`, `Endorsements`, `Project Funding`, `Monitoring`, `Settings`, `Logout` |

URL slugs (for deep-link verification):

| Role       | Tab slug examples                                                       |
| ---------- | ----------------------------------------------------------------------- |
| Proponent  | `?tab=profile`, `?tab=submission`, `?tab=monitoring`, `?tab=settings`   |
| RND        | `?tab=proposals`, `?tab=endorsements`, `?tab=funding`, `?tab=monitoring`|
| Evaluator  | `?tab=proposals`, `?tab=review`, `?tab=reviewed`                        |
| Admin      | `?tab=proposals`, `?tab=accounts`, `?tab=activity`, `?tab=settings`     |

---

## 1. Authentication

### 1.1 Login (`tests/auth/login.spec.ts`)

| Test ID         | Scope | Role | Preconditions         | Steps                                                                 | Expected                                                                                       |
| --------------- | ----- | ---- | --------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| AUTH-LOGIN-01   | happy | —    | Proponent fixture exists | Visit `/login`, enter proponent creds, click Sign in                 | Lands on `/users/Proponent/ProponentMainLayout`                                                |
| AUTH-LOGIN-02   | happy | —    | RND fixture exists       | Visit `/login`, enter RND creds, click Sign in                        | Lands on `/users/rnd/rndMainLayout`                                                            |
| AUTH-LOGIN-03   | happy | —    | Evaluator fixture exists | Visit `/login`, enter evaluator creds, click Sign in                  | Lands on `/users/evaluator/evaluatorMainLayout`                                                |
| AUTH-LOGIN-04   | happy | —    | Admin fixture exists     | Visit `/login`, enter admin creds, click Sign in                      | Lands on `/users/admin/adminMainLayout`                                                        |
| AUTH-LOGIN-05   | error | —    | Proponent fixture exists | Login with correct email + wrong password                             | Error toast, user stays on `/login`                                                            |
| AUTH-LOGIN-06   | error | —    | —                        | Login with unknown email                                              | Error toast                                                                                    |
| AUTH-LOGIN-07   | error | —    | —                        | Click Sign in with empty email + password                             | Validation toast                                                                               |
| AUTH-LOGIN-08   | smoke | —    | —                        | Click "Forgot password?"                                              | Navigates to `/forgot-password`                                                                |
| AUTH-LOGIN-09   | smoke | —    | —                        | Click "Create one"                                                    | Navigates to `/register`                                                                       |

### 1.2 Registration (`tests/auth/register.spec.ts`)

Registration sends a verification email; the spec only exercises the
client-side form. Page heading is `Sign up` (h2) + step heading
`Account Information` (h3). Birthdate input has no htmlFor/id — located
via `input[type="date"]`. Step 2 validation fires "Missing Fields"
BEFORE "Age Requirement", so the age test must fill all three step-2
inputs (birthdate + sex + R&D department).

| Test ID      | Scope | Role | Preconditions              | Steps                                                                                                                                                      | Expected                                                           |
| ------------ | ----- | ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| AUTH-REG-01  | smoke | —    | —                          | Visit `/register`                                                                                                                                          | Headings "Sign up" + "Account Information" visible; all step-1 placeholders visible |
| AUTH-REG-02  | error | —    | —                          | Click Next with all fields empty                                                                                                                           | SweetAlert "missing / required / fill"                             |
| AUTH-REG-03  | error | —    | —                          | Step 1: valid name/email, password = "weak", click Next                                                                                                    | Toast mentions "weak" or "password"                                |
| AUTH-REG-04  | error | —    | ≥1 row in `departments`    | Advance to step 2; via DOM evaluate, set birthdate to today − 10 years (removes `max=today-18y`, dispatches input/change/blur); pick Sex; pick first department; click Next | Toast mentions "18" or "Age Requirement" (skips if no departments) |
| AUTH-REG-05  | smoke | —    | —                          | Click Back-to-Home link on `/register`                                                                                                                     | Navigates to `/` (skipped if link hidden)                          |

### 1.3 Forgot password (`tests/auth/forgot-password.spec.ts`)

Heading `Forgot Password?`, email placeholder `Enter your registered
email`, button `Send Reset link` (→ `Sending...` → `Email sent`). Supabase
deliberately returns success for unknown emails too, so AUTH-FORGOT-02
uses the seeded proponent email for realism but the system's behaviour
would not differ for any well-formed email.

| Test ID        | Scope | Role | Preconditions            | Steps                                                       | Expected                                                                |
| -------------- | ----- | ---- | ------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| AUTH-FORGOT-01 | smoke | —    | —                        | Visit `/forgot-password`                                    | Heading "Forgot Password?" + email placeholder + "Send Reset link" button visible |
| AUTH-FORGOT-02 | happy | —    | Proponent fixture exists | Enter proponent email, click "Send Reset link"              | Swal "Check your email / reset link / sent" (30 s timeout for Supabase) |
| AUTH-FORGOT-03 | error | —    | —                        | Click "Send Reset link" with empty email                    | Swal "Missing email / enter your email"                                 |
| AUTH-FORGOT-04 | error | —    | —                        | Fill "not-an-email", click submit                           | HTML5 type=email blocks submit; page stays on `/forgot-password`; no success toast |
| AUTH-FORGOT-05 | smoke | —    | —                        | Visit `/reset-password` directly                            | Responds with status < 500                                              |

### 1.4 Logout (`tests/auth/logout.spec.ts`)

Sidebar logout is a `<button>` with exact text "Logout".

| Test ID        | Scope | Role      | Preconditions | Steps                                                              | Expected                                   |
| -------------- | ----- | --------- | ------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| AUTH-LOGOUT-01 | happy | proponent | logged in     | Click sidebar button "Logout"; confirm if prompt appears           | Redirects to `/` or `/login`               |
| AUTH-LOGOUT-02 | edge  | proponent | logged in     | Clear cookies + storage; visit dashboard path                      | Redirects to `/login`                      |

---

## 2. Proposal lifecycle

All tests in this section are serial within their files and share state via
`process.env.E2E_PROPOSAL_TITLE` (stamped by `PROP-SUBMIT-01`).

### 2.1 Submission (`tests/proposal/submission.spec.ts`)

**How the form really works** — a three-section flow, where AI auto-fill
from the uploaded DOCX populates what it can, but every admin-managed
strict taxonomy (see §9 Taxonomy rules below) requires the proponent to
pick from the dropdown when auto-fill's exact name match misses.

| Section           | Auto-filled when DOCX matches lookup                                   | Always requires manual action                                                         |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Basic Info        | program/project title, year (readOnly!), dates, duration, city, email  | **Funding Agency** (strict), **Tags** (click "Auto-generate")                         |
| Research Details  | classification_type, class_input                                       | **Sector** (strict), **Discipline** (strict), **Priorities** (strict), **Implementation sites** |
| Budget Section    | nothing                                                                | **Budget items** — use "Import Template" to parse LIB DOCX                            |

Complete test flow (PROP-SUBMIT-01 and -06):
1. Click sidebar **button "Submission"** → `?tab=submission`.
2. Drop `sample-proposal.docx` on the main upload zone.
   `handleFileSelect` auto-triggers `handleAITemplateCheck` — AI analysis
   starts WITHOUT a second click.
3. "Analyzing Proposal…" SweetAlert loading modal appears (30–60 s on
   Lambda cold start).
4. `applyAutoFill` populates the form from the DOCX extraction.
5. Loading Swal closes; in-app AI Modal opens.
6. Click footer button "Confirm & Close" / "Dismiss".
7. **Basic Info**: Click "Auto-generate" (pill next to the Tags label)
   to let the AI tag service produce 1–4 tags from the project title.
8. Click the "Research Details" section-tab button.
9. Type a site name in "Site Name 1", click "Type City/Municipality 1",
   type a city prefix, click the first option from the PSGC dropdown.
   (Picking from the dropdown is mandatory — onBlur validates the value
   and wipes it if it doesn't match an option.)
10. Click the "Budget Section" section-tab button.
11. Click "Import Template" → LibImportModal opens.
12. Attach `sample-lib-template.docx` via the modal's hidden file input.
13. Parser shows preview with a "Funding source name" input (prefilled).
    Overwrite with a known value.
14. Click "Import N items" button. Modal closes automatically.
15. OPTIONAL: In the sidebar, attach a DOST Form 3 work-plan DOCX.
16. Click sidebar "Submit Proposal" → Swal "Confirm Submission".
17. Click "Yes!". Success toast.

**Required fixtures + seed:**
- `e2e/fixtures/files/sample-proposal.docx` — real DOST Form 1B template.
- `e2e/fixtures/files/sample-lib-template.docx` — WMSU LIB v1 template.
- Supabase lookup rows in `agencies`, `sectors`, `disciplines`,
  `priorities`, `departments`, PSGC `cities` — auto-fill fuzzy-matches
  extracted names to IDs. Unmatched values leave ID fields null and
  keep Submit disabled.

| Test ID          | Scope | Role      | Preconditions                          | Steps (summary)                                                                                                                                                        | Expected                                                                                   |
| ---------------- | ----- | --------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| PROP-SUBMIT-01   | happy | proponent | Both DOCX fixtures + seeded lookups    | Upload proposal → dismiss AI modal → **ensure Funding Agency picked** → Auto-generate tags → Research Details → **ensure Sector/Discipline/Priority picked** → add 1 implementation site (city from dropdown) → Budget → Import LIB → Submit → Yes! | Swal "success/submitted"; project_title stored in `E2E_PROPOSAL_TITLE` |
| PROP-SUBMIT-02   | error | proponent | —                                      | Upload a `.txt` file via setInputFiles                                                                                                                                 | Swal "Invalid File Type" (extension check blocks before analysis)                          |
| PROP-SUBMIT-03   | error | proponent | —                                      | Observe the sidebar's Submit button with no data                                                                                                                       | Submit button is `disabled`                                                                |
| PROP-SUBMIT-04   | error | proponent | —                                      | Upload DOCX, dismiss AI modal, but do NOT fill tags/sites/budget/strict-lookups                                                                                        | Submit button remains `disabled` — auto-fill alone is insufficient                         |
| PROP-SUBMIT-05   | error | proponent | —                                      | setInputFiles with an 11 MB buffer named `huge.docx`                                                                                                                   | Swal "File too large / 10 MB"                                                              |
| PROP-SUBMIT-06   | happy | proponent | Both DOCX fixtures + seeded lookups    | Same as -01, plus attach DOST Form 3 work plan via sidebar                                                                                                             | Same as -01 — proposal submitted with work-plan file attached                              |
| PROP-SUBMIT-07   | edge  | proponent | —                                      | Upload proposal → dismiss AI modal → inspect form                                                                                                                      | Submit disabled; if any of (agency/sector/discipline) didn't match, an amber "couldn't match this to our X list — pick the closest option above" hint is visible |
| PROP-SUBMIT-08   | happy | proponent | PROP-SUBMIT-01                         | Open Profile tab                                                                                                                                                       | Newly submitted proposal title is listed                                                   |

### 2.2 RND quality check (`tests/proposal/rnd-quality-check.spec.ts`)

Navigation: click sidebar button **"Proposals"** (→ `?tab=proposals`).

| Test ID     | Scope | Role | Preconditions                                                        | Steps                                                                            | Expected                                                     |
| ----------- | ----- | ---- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| RND-QC-01   | happy | rnd  | PROP-SUBMIT-01                                                       | Open Proposals tab                                                               | Submitted proposal is listed                                 |
| RND-QC-02   | happy | rnd  | PROP-SUBMIT-01                                                       | Open proposal detail; Forward → tick "E2E Evaluator"; deadline +14d; Confirm    | Success toast; status = "under evaluation"                   |
| RND-QC-03   | edge  | rnd  | `E2E_INCLUDE_COI_TESTS=1`                                            | Attempt to self-assign                                                           | Blocked by COI guard (placeholder — needs env enable)        |
| RND-QC-04   | happy | rnd  | `E2E_REVISION_PROPOSAL_TITLE` set                                    | Open proposal; Request Revision; fill 5 textareas; Submit                        | Success toast                                                |
| RND-QC-05   | happy | proponent | RND-QC-04                                                            | Click "Profile"                                                                  | Revision tag + feedback visible                              |

### 2.3 Evaluator review (`tests/proposal/evaluator-review.spec.ts`)

Navigation: click **"Proposals"** for the queue, **"Under Review"** for
the scoring form.

| Test ID         | Scope | Role      | Preconditions | Steps                                                              | Expected                                                  |
| --------------- | ----- | --------- | ------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| EVAL-REVIEW-01  | happy | evaluator | RND-QC-02     | Open Proposals tab                                                 | Assigned proposal shown                                   |
| EVAL-REVIEW-02  | happy | evaluator | RND-QC-02     | Click Accept for the proposal row, confirm                         | Success toast                                             |
| EVAL-REVIEW-03  | happy | evaluator | EVAL-REVIEW-02 | Open "Under Review" tab; open review; score 4/4/3/4; comment; Approve; Submit | Success toast                                             |
| EVAL-REVIEW-04  | error | evaluator | EVAL-REVIEW-02 | Re-open review; set first score = 9; Submit                        | Error toast mentioning invalid / 1 / 5 / range / score    |

### 2.4 RND endorsement (`tests/proposal/rnd-endorsement.spec.ts`)

Navigation: click sidebar button **"Endorsements"** (plural; → `?tab=endorsements`).

| Test ID         | Scope | Role      | Preconditions    | Steps                                                       | Expected                                                     |
| --------------- | ----- | --------- | ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| RND-ENDORSE-01  | happy | rnd       | EVAL-REVIEW-03   | Open Endorsements tab                                       | Proposal listed                                              |
| RND-ENDORSE-02  | smoke | rnd       | EVAL-REVIEW-03   | Open proposal detail                                        | Evaluator scores visible                                     |
| RND-ENDORSE-03  | happy | rnd       | EVAL-REVIEW-03   | Click Endorse for Funding, Confirm                          | Status → "funded"                                            |
| RND-ENDORSE-04  | happy | proponent | RND-ENDORSE-03   | Click Profile                                               | Proposal tagged "Funded"                                     |

---

## 3. Project monitoring

### 3.1 Fund requests (`tests/monitoring/fund-request.spec.ts`)

Navigation: proponent clicks sidebar button **"Monitoring"**; RND clicks
**"Project Funding"** (→ `?tab=funding`).

| Test ID       | Scope | Role      | Preconditions     | Steps                                                         | Expected                                                           |
| ------------- | ----- | --------- | ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| MON-FUND-01   | smoke | proponent | RND-ENDORSE-03    | Open Monitoring tab                                           | Funded project is visible                                          |
| MON-FUND-02   | happy | proponent | MON-FUND-01       | Open project; Request Funds; Q1; PS=10000 MOOE=5000 CO=0      | Success toast                                                      |
| MON-FUND-03   | error | proponent | MON-FUND-01       | Request Funds Q1; PS=10_000_000                               | Error toast "exceed / insufficient / remaining / over / invalid"   |
| MON-FUND-04   | happy | rnd       | MON-FUND-02       | Open Project Funding; find proposal; approve Q1               | Success toast                                                      |

### 3.2 Quarterly reports (`tests/monitoring/quarterly-report.spec.ts`)

Navigation: RND clicks sidebar button **"Project Monitoring"**.

| Test ID         | Scope | Role      | Preconditions    | Steps                                                                               | Expected                                                   |
| --------------- | ----- | --------- | ---------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| MON-REPORT-01   | edge  | proponent | MON-FUND-04      | Open "Submit Report"; inspect Quarter dropdown                                       | Q2 is absent or `disabled`                                 |
| MON-REPORT-02   | happy | proponent | MON-FUND-04      | Submit Q1 report: progress 25%; comment; attach `sample-report.pdf`                 | Success toast                                              |
| MON-REPORT-03   | happy | rnd       | MON-REPORT-02    | Project Monitoring → open proposal → Verify Q1                                      | Success toast "verified"                                   |
| MON-REPORT-04   | happy | proponent | MON-REPORT-03    | Refresh Monitoring                                                                   | Q1 shows "verified / approved"                             |

### 3.3 Completion certificate (`tests/monitoring/certificate.spec.ts`)

| Test ID       | Scope | Role | Preconditions                                   | Steps                                                        | Expected                                                       |
| ------------- | ----- | ---- | ----------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| MON-CERT-01   | edge  | rnd  | MON-REPORT-03 (only Q1 verified)                | Open proposal monitoring detail                              | "Issue Certificate" button is hidden or disabled               |
| MON-CERT-02   | happy | rnd  | `E2E_ALL_QUARTERS_VERIFIED=1` + Q2-Q4 verified  | Click Issue Certificate, Confirm                             | Success toast "issued"                                         |

---

## 4. Role-based access control

### 4.1 Cross-role guards (`tests/rbac/route-guards.spec.ts`)

For each `(role, forbiddenDashboard)` pair, log in as `role` and navigate
to the other dashboard. `ProtectedRoute` redirects away.

| Test ID                  | Scope | Role      | Attempted Path                          | Expected                                          |
| ------------------------ | ----- | --------- | --------------------------------------- | ------------------------------------------------- |
| RBAC-PROPONENT-ADMIN     | error | proponent | `/users/admin/adminMainLayout`          | Not left on the admin path                        |
| RBAC-PROPONENT-RND       | error | proponent | `/users/rnd/rndMainLayout`              | Not left on the rnd path                          |
| RBAC-PROPONENT-EVALUATOR | error | proponent | `/users/evaluator/evaluatorMainLayout`  | Not left on the evaluator path                    |
| RBAC-EVALUATOR-ADMIN     | error | evaluator | `/users/admin/adminMainLayout`          | Not left on the admin path                        |
| RBAC-EVALUATOR-RND       | error | evaluator | `/users/rnd/rndMainLayout`              | Not left on the rnd path                          |
| RBAC-EVALUATOR-PROPONENT | error | evaluator | `/users/Proponent/ProponentMainLayout`  | Not left on the proponent path                    |
| RBAC-RND-ADMIN           | error | rnd       | `/users/admin/adminMainLayout`          | Not left on the admin path                        |
| RBAC-RND-EVALUATOR       | error | rnd       | `/users/evaluator/evaluatorMainLayout`  | Not left on the evaluator path                    |

### 4.2 Anonymous guards (`tests/rbac/route-guards.spec.ts`)

| Test ID       | Scope | Role | Steps                                         | Expected                                 |
| ------------- | ----- | ---- | --------------------------------------------- | ---------------------------------------- |
| RBAC-ANON-01  | error | —    | Visit `/users/admin/adminMainLayout`          | Redirects to `/login` or `/`             |
| RBAC-ANON-02  | error | —    | Visit `/users/rnd/rndMainLayout`              | Redirects to `/login` or `/`             |
| RBAC-ANON-03  | error | —    | Visit `/users/evaluator/evaluatorMainLayout`  | Redirects to `/login` or `/`             |
| RBAC-ANON-04  | error | —    | Visit `/users/Proponent/ProponentMainLayout`  | Redirects to `/login` or `/`             |
| RBAC-ANON-05  | smoke | —    | Visit `/`                                     | Landing page renders                     |

---

## 5. Admin dashboard

### 5.1 Navigation smoke (`tests/admin/dashboard.spec.ts`)

All nav via `<button>` with exact labels; URL updates to `?tab=<id>`.

| Test ID   | Scope | Role  | Steps                                                       | Expected                                        |
| --------- | ----- | ----- | ----------------------------------------------------------- | ----------------------------------------------- |
| ADMIN-01  | smoke | admin | Visit admin dashboard                                       | Stats about proposals/users/projects visible    |
| ADMIN-02  | smoke | admin | Click button "Proposals"                                    | URL has `tab=proposals`; table/grid visible     |
| ADMIN-03  | smoke | admin | Click button "Evaluators"                                   | URL has `tab=evaluators`; heading/table visible |
| ADMIN-04  | smoke | admin | Click button "Accounts"                                     | URL has `tab=accounts`; table/grid visible      |
| ADMIN-05  | smoke | admin | Click button "Activity Logs"                                | URL has `tab=activity`; log table visible       |
| ADMIN-06  | smoke | admin | Click button "Settings"                                     | URL has `tab=settings`; heading visible         |

---

## 6. Out of scope (intentionally)

These flows are **not** covered by automated e2e tests. Either they require
real email handling, human-in-the-loop review, or side effects too risky
for a shared staging database. They must be tested manually when touched:

- Google OAuth login button (requires a real Google session).
- Email verification link click on registration.
- Password-reset link click from the recovery email.
- Invite-co-lead email link flow (`/accept-invite`).
- Real-time notification WebSocket delivery.
- AI proposal analysis (external VPS, slow, non-deterministic).
- CSV / PDF / DOCX downloads.
- DOST Forms 3/4/5 upload and compliance doc verification.
- Budget realignment / LIB template import (complex modal flow).
- Terminal + surrender reports (terminal-stage monitoring).
- Multi-year proposal Year 2+ monitoring.
- External co-lead invitation flow.
- Leave request / availability toggle.
- Proponent extension request.
- RND transfer between users.

---

## 7. Updating this document

When you change a test:

1. Edit the spec file.
2. Open this file in the same PR. Update the row for the affected test ID
   (scope, steps, expected). If you removed a test, delete the row — do not
   leave dangling rows.
3. If you added a new test, append a new row with a fresh ID in its
   section. Keep IDs sequential within the area.
4. If you added a new area (e.g. `MON-TERMINAL`), add a new section here
   AND add a line in `README.md` under "What's covered".

Tests that are intentionally skipped via `test.skip(...)` should still be
listed here with their precondition documented; that's how we know a gap
is intentional vs forgotten.

---

## 8. Known DOM gotchas (for future test authors)

These are real patterns in the codebase — read them before adding new tests
or you'll repeat mistakes that have already been caught and fixed.

- **Sidebars use `<button>`, not `<a>`**. Always use
  `page.getByRole("button", { name: "ExactLabel", exact: true })`. Never
  use `getByRole("link", ...)` for sidebar navigation.
- **Tab navigation is URL-query-param driven** via
  `setSearchParams({ tab: id })`. After clicking, wait for `?tab=<id>`
  with `page.waitForURL(/tab=id/)`.
- **Many form labels are not associated via htmlFor/id**. `getByLabel()`
  often fails. Use `getByPlaceholder("…")` (preferred — stable), or fall
  back to `input[type="date"]`, `input[type="number"]`, `select`.
- **Toasts are SweetAlert2**. Assert on `.swal2-popup` for the container
  and `.swal2-confirm` for the OK button.
- **Registration birthdate** input has a `max=(today - 18y)` attribute
  that the browser enforces — `fill(…)` won't accept an underage value.
  Use `evaluate()` to remove `max` and set `value` directly, then
  dispatch `input`/`change`/`blur` events manually.
- **Lookup-typeahead fields** (sector, discipline, agency, priority,
  city) need at least one seeded row. Tests pick the first available
  option from the dropdown; if the dropdown is empty, the next validation
  will fail. Seed one row per lookup table before running.
- **Proposal Year input is `readOnly`** — the only way to populate it is
  via the AI auto-fill triggered by uploading a template-compliant DOCX.
  `fill("1")` on this field silently no-ops and `!Number.isInteger(year)`
  keeps Submit disabled. The test fixture `sample-proposal.docx` is a
  real DOST Form 1B template and is what drives the happy-path flow.
- **File upload auto-analyzes immediately**. `handleFileSelect` chains
  directly into `handleAITemplateCheck`. Don't look for a second
  "Analyze" button — waiting for the "Analyzing…" Swal to close is the
  correct signal.
- **Submission has two Swals, in order**: (1) loading "Analyzing
  Proposal…", (2) confirmation "Confirm Submission" with a "Yes!"
  button. Between them the in-app AI Modal must be dismissed ("Confirm
  & Close" or "Dismiss" footer button).
- **Landing page content is CMS-driven** (LogoContext + home JSON),
  which loads async. Never assert on specific heading text there — use
  the stable `a[href="/login"]` selector instead.
- **Auto-fill does not cover tags, implementation_site, or budget**.
  Tests must explicitly: click "Auto-generate" (tags), add one
  implementation site with a dropdown-picked city, and either import
  the LIB template DOCX or add budget rows manually. The sidebar's
  isFormValid gate checks all three and keeps Submit disabled until
  each section's completion check passes.
- **Implementation site city input is a typeahead against PSGC data**.
  onBlur validation wipes the value unless it matches a dropdown
  option exactly — so `.fill("Zamboanga City")` alone will fail.
  Tests must type a prefix, wait for the dropdown, and click a match.
- **The LIB import modal has its own hidden `<input type="file">`**
  scoped to `accept=".docx"`. The outer submission form's file input
  has id `file-upload`; the work-plan sidebar has a third file input.
  Disambiguate by `input#file-upload` vs `input[type="file"][accept*="docx"]`
  with `.nth(0|1)` as shown in `ProposalSubmissionPage.ts`.

---

## 9. Taxonomy rules (post-2026-04-21 rewrite)

The proposal form has **two classes** of lookup field, and they behave
very differently. Every test author touching the submission form must
know which is which:

### 9.1 Strict admin-managed lookups

- **Funding Agency** (`agency`)
- **Sector** (`sector`)
- **Discipline** (`discipline`)
- **Priority Areas** (`priorities_id`)

Rules:
- The backend (`proposal.service.ts:resolveLookupId({..., strict: true})`)
  rejects unknown names and throws `Unknown sector: "X"` at insert time.
- The frontend (`submission/index.tsx:applyAutoFill`) only populates
  these fields when the DOCX's text has an **exact** case-insensitive
  match against a row in the corresponding Supabase table.
- If there's no match, the field is left blank and an amber hint appears:
  > "Auto-detected from your file: 'X' — we couldn't match this to our
  > agency list. Please pick the closest option above, or ask admin to
  > add it."
- The sidebar's Submit button stays disabled until every strict field
  holds a numeric FK id (validated by `typeof X === "number" && X > 0`).
- Typing custom text then blurring wipes the value — you MUST click a
  dropdown option.
- For Priorities: the "Add" handler silently drops text that doesn't
  match an existing priority name.

Test-author implication: after auto-fill, every strict field is a
potential pothole. The page object exposes four idempotent helpers —
`ensureFundingAgencyPicked()`, `ensureSectorPicked()`,
`ensureDisciplinePicked()`, `ensurePriorityPicked()` — that detect the
unmatched state and pick the first available dropdown option. Call
them after `waitForAnalysisAndDismissAIModal()`.

### 9.2 Loose lookups (free text allowed)

- **Cooperating Agencies** (`cooperating_agencies`) — external partners
  such as barangay councils, NGOs, or private firms that shouldn't
  pollute the admin-managed agency list.

Rules:
- Matched entries carry a real `id` (FK); unmatched entries are flagged
  `free_text: true` in the form state and submitted as the bare name
  string.
- The backend splits them into `cooperating_agencies.agency_id` (FK)
  vs `cooperating_agencies.agency_name_text` (free text column) —
  see `backend/src/schemas/proposal-schema.ts:normalizeCooperatingAgencies`
  and `proposal.service.ts` (search for "Cooperating agencies split").
- Free-text chips render with an "external" badge and amber styling.
- Reading back: `Profile.tsx` joins both columns in the display
  (`c.agencies?.name ?? c.agency_name_text`).

Test-author implication: tests that add a custom cooperating agency
will keep working. The chip shows as "external" but the submission
succeeds.

### 9.3 Data seeding for tests

The happy-path tests (PROP-SUBMIT-01 / -06) depend on the following
admin-managed lookup tables having **at least one row each** in your
Supabase project. The test picks whichever row comes first — content
doesn't matter, just presence:

- `agencies`
- `sectors`
- `disciplines`
- `priorities`
- `departments`
- PSGC `cities` (usually pre-seeded from PhilGEPS data)

If the seeded rows happen to match names in `sample-proposal.docx`
exactly, auto-fill resolves them and the test is ~20s faster per run.
If not, the `ensureXPicked()` helpers fall back to picking the first
dropdown option — either way the test completes.
