# SPMAMS End-to-End Tests

Playwright test suite that drives the SPMAMS frontend like a real user,
end-to-end through the real Lambda backend and real Supabase. Designed to
catch regressions in the critical flows: auth, proposal submission, RND
quality check, evaluator review, endorsement, fund requests, quarterly
reports, and role-based access control.

**Every test case is catalogued in [`TEST_CASES.md`](./TEST_CASES.md).**
That document and the spec files stay in sync — update both together.

## Prerequisites

- Node 20+
- The main SPMAMS repo already cloned; this folder is a sibling of
  `frontend/` and `backend/`.
- Credentials for the Supabase project (service_role key) so you can run
  the one-time account seeder.

## First-time setup

```bash
cd e2e

# 1. Install deps (Playwright + tsx + pdf-lib + supabase-js)
npm install

# 2. Install the Chromium browser Playwright will drive
npm run install:browsers

# 3. Copy the env template and fill in real Supabase keys
cp .env.example .env
# Edit .env → fill SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY,
# FIXTURE_PASSWORD, and any FIXTURE_*_EMAIL you want to change.

# 4. Generate the small quarterly-report PDF fixture once
#    (sample-proposal.docx + sample-lib-template.docx are committed to
#    the repo — they must be real DOST Form 1B / LIB templates and can't
#    be synthesised)
npx tsx fixtures/files/generate.ts

# 5. Seed the four fixture accounts into Supabase
npm run seed
```

The seed step creates one user per role with `email_confirmed=true`, so
you can log into them immediately without clicking an email link.
Re-running the seed is safe — it updates existing fixture users in place.

## Running tests

The Vite dev server is auto-started by Playwright's `webServer`. If you
already have `npm run dev` running in `frontend/`, Playwright will reuse
it.

```bash
# Everything
npm test

# Only auth / proposal / monitoring / rbac
npm run test:auth
npm run test:proposal
npm run test:monitoring
npm run test:rbac

# Watch the browser (debugging)
npm run test:headed

# Interactive UI mode
npm run test:ui

# View the last HTML report
npm run report
```

### Targeting a different URL

By default tests run against `http://localhost:5173`. To hit a deployed
environment, set `BASE_URL`:

```bash
BASE_URL=https://wmsu-rdec.com npm test
```

When `BASE_URL` is set, the `webServer` auto-start is skipped.

### Running only lifecycle stages

The proposal lifecycle tests chain together:
`submission → RND QC → evaluator review → endorsement → monitoring`. They
pass the proposal title between files through `process.env.E2E_PROPOSAL_TITLE`
and skip gracefully if the upstream test didn't run. So you can run
`npm run test:proposal` on its own, but running `npm run test:monitoring`
in isolation will skip most of its tests.

## What's covered

| Area                      | Count | Spec file                                          |
| ------------------------- | ----- | -------------------------------------------------- |
| Login (happy + error)     | 9     | `tests/auth/login.spec.ts`                         |
| Registration validation   | 5     | `tests/auth/register.spec.ts`                      |
| Forgot password           | 5     | `tests/auth/forgot-password.spec.ts`               |
| Logout                    | 2     | `tests/auth/logout.spec.ts`                        |
| Proposal submission       | 8     | `tests/proposal/submission.spec.ts`                |
| RND quality check         | 5     | `tests/proposal/rnd-quality-check.spec.ts`         |
| Evaluator review          | 4     | `tests/proposal/evaluator-review.spec.ts`          |
| RND endorsement           | 4     | `tests/proposal/rnd-endorsement.spec.ts`           |
| Fund requests             | 4     | `tests/monitoring/fund-request.spec.ts`            |
| Quarterly reports         | 4     | `tests/monitoring/quarterly-report.spec.ts`        |
| Completion certificate    | 2     | `tests/monitoring/certificate.spec.ts`             |
| RBAC cross-role           | 8     | `tests/rbac/route-guards.spec.ts`                  |
| RBAC anonymous            | 5     | `tests/rbac/route-guards.spec.ts`                  |
| Admin dashboard smoke     | 6     | `tests/admin/dashboard.spec.ts`                    |
| **Total**                 | **71** |                                                    |

See [`TEST_CASES.md`](./TEST_CASES.md) for the full test-case matrix and
the list of flows intentionally left out.

## Project structure

```
e2e/
├── playwright.config.ts     # test runner config + webServer
├── tsconfig.json
├── .env.example             # copy to .env, fill credentials
├── TEST_CASES.md            # authoritative test catalogue
├── README.md
├── scripts/
│   └── seed-accounts.ts     # one-time Supabase user seeding
├── fixtures/
│   ├── accounts.ts          # role → credential mapping
│   ├── test.ts              # `loggedInAs(role)` Playwright fixture
│   └── files/
│       ├── generate.ts      # produces sample-proposal.pdf etc.
│       └── *.pdf            # generated — not committed
├── helpers/
│   └── auth.ts              # login helper used by global setup
├── pages/
│   ├── LoginPage.ts
│   ├── ProponentLayout.ts
│   ├── ProposalSubmissionPage.ts
│   ├── RndDashboardPage.ts
│   ├── EvaluatorReviewPage.ts
│   └── MonitoringPage.ts
└── tests/
    ├── global.setup.ts      # logs in each role, stores .auth/*.json
    ├── auth/*.spec.ts
    ├── proposal/*.spec.ts
    ├── monitoring/*.spec.ts
    ├── rbac/*.spec.ts
    └── admin/*.spec.ts
```

## Important notes

### Shared DB means shared data
Tests run against a real Supabase project, so every run creates real
rows (proposals, evaluations, fund requests). The submission test stamps a
unique title containing a timestamp + `E2E-` prefix so you can filter
them out in the admin UI or clean them up via SQL:

```sql
DELETE FROM proposals WHERE project_title LIKE 'E2E-%';
```

### Workers = 1 is deliberate
The lifecycle chain has strict serial dependencies (submit → QC →
evaluate → endorse → monitor), and the app relies on single-tab auth
cookies. Running more than one worker will cause cross-test interference.

### Real DOM conventions (read before adding tests)
- **Sidebars use `<button>`, not `<a>`.** Use
  `getByRole("button", { name: "ExactLabel", exact: true })` for nav.
- **Tabs switch via `?tab=<id>` query param** (not hash). Wait with
  `page.waitForURL(/tab=submission/)` after clicking.
- **Many form labels are not linked to inputs via `htmlFor`/`id`** —
  `getByLabel()` often fails. Prefer `getByPlaceholder("…")` with the
  literal placeholder text from the JSX, or fall back to `input[type=date]`,
  `input[type=number]`, `select`.
- **Registration birthdate** has `max=(today − 18y)` — the browser refuses
  underage values in `.fill()`. See `register.spec.ts` for the
  `evaluate()` workaround.
- **Proposal Year input is `readOnly`** — only AI auto-fill populates
  it. Attempting to `fill("1")` silently fails and leaves Submit disabled.
- **File upload auto-triggers AI analysis** (no second click). The test
  waits for the "Analyzing…" Swal to close, dismisses the AI modal via
  its "Confirm & Close" / "Dismiss" button, then clicks Submit Proposal
  and confirms "Yes!" on the second Swal.
- **Lookup-typeahead fields** (sector, discipline, agency, priority,
  city) are only populated if the corresponding Supabase tables have
  rows the auto-fill can fuzzy-match against. Seed one row per table
  before running the submission test.
- **Strict admin-managed taxonomies** (funding agency, sector,
  discipline, priorities) reject unknown names under the current
  schema (post-2026-04-21 rewrite). Auto-fill only populates them on
  exact case-insensitive match; otherwise the field stays blank with
  an amber "couldn't match this to our X list" hint. Tests use
  `form.ensureFundingAgencyPicked()`, `ensureSectorPicked()`,
  `ensureDisciplinePicked()`, `ensurePriorityPicked()` to resolve
  unmatched fields by picking the first dropdown option. Full rules
  in TEST_CASES.md §9.
- **Cooperating Agencies** remain a loose lookup — free-text external
  partners save to `cooperating_agencies.agency_name_text` and render
  with an "external" badge.
- **Landing page content is CMS-driven**. Never assert on specific
  heading text. Use the stable `a[href="/login"]` selector instead.

### When a selector misses
The fix is almost always to add a `data-testid` to the source component
and update the matching locator in the page object. Don't fall back to
CSS classes or DOM indexes — they break the next time the design ships.

### COI / multi-role / extension / leave flows
Intentionally skipped by default, gated behind feature-flag env vars
(`E2E_INCLUDE_COI_TESTS`, etc.). See `TEST_CASES.md` § 6 for the full
out-of-scope list and why.

## Troubleshooting

- **`Missing env var FIXTURE_PROPONENT_EMAIL`** — You haven't copied
  `.env.example` → `.env` yet. Do that and fill in the values.
- **`Missing required env var: SUPABASE_SERVICE_ROLE_KEY`** when running
  the seed — Paste your project's service_role key into `.env`. Never
  commit it.
- **Seed prints `updated ...` for all four accounts but tests still fail
  AUTH-LOGIN** — The fixture accounts exist but the public.users row
  may be missing the `profile_completed=true` flag. Re-run the seed;
  it upserts the public row too.
- **Test hangs at the first `page.goto`** — The dev server isn't up.
  Either wait for Vite to start (~15 s cold), or `cd frontend && npm run dev`
  in another terminal and re-run.
- **Proposal submission fails on the budget step** — The lookup tables
  (departments, sectors, agencies) may be empty on your Supabase project.
  Seed one row per table via the admin UI before running this suite.
