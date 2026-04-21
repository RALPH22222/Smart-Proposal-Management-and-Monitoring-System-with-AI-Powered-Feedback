import { test, expect } from "../../fixtures/test";
import { RndDashboardPage } from "../../pages/RndDashboardPage";

/**
 * RND-ENDORSE: after evaluators finish, RND makes the final call.
 * Depends on EVAL-REVIEW-03.
 *
 * Sidebar label is "Endorsements" (plural), tab slug is `tab=endorsements`.
 */

test.describe.serial("RND-ENDORSE: final endorsement", () => {
  test("RND-ENDORSE-01: endorsement tab lists proposals with completed evaluations", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires EVAL-REVIEW-03 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openEndorsements();
    await expect(page.getByText(title!, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("RND-ENDORSE-02: RND views evaluator scores and comments", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires EVAL-REVIEW-03 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openEndorsements();
    await rnd.openProposalByTitle(title!);
    await expect(page.getByText(/objective/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/methodology/i).first()).toBeVisible();
  });

  test("RND-ENDORSE-03: RND endorses proposal for funding", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires EVAL-REVIEW-03 to have run first.");

    const { page } = await loggedInAs("rnd");
    const rnd = new RndDashboardPage(page);
    await rnd.openEndorsements();
    await rnd.openProposalByTitle(title!);
    await rnd.endorseForFunding();

    await expect(page.getByText(/funded|endorsed/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("RND-ENDORSE-04: proponent sees funded status on their proposal", async ({ loggedInAs }) => {
    const title = process.env.E2E_PROPOSAL_TITLE;
    test.skip(!title, "Requires RND-ENDORSE-03 to have run first.");

    const { page } = await loggedInAs("proponent");
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await expect(page.getByText(title!, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/funded/i).first()).toBeVisible();
  });
});
