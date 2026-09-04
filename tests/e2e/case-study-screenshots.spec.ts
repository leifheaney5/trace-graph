import { expect, test, type Page } from "@playwright/test";

const screenshot = async (page: Page, name: string) => {
  await page.screenshot({
    path: `docs/screenshots/case-study-${name}.png`,
    fullPage: false,
  });
};

const primaryNav = (page: Page) =>
  page.locator('nav[aria-label="Primary navigation"]');

test("capture case-study evidence from deterministic sample data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await expect(
    page.getByRole("complementary", { name: "TraceGraph workflow guide" }),
  ).toBeVisible();
  await screenshot(page, "landing");

  await page
    .getByRole("button", { name: "Restart digital-thread tour" })
    .click();
  await expect(
    page.getByRole("dialog", { name: /Start with stakeholder intent/i }),
  ).toBeVisible();
  await screenshot(page, "guided-tour");
  await page
    .getByRole("button", { name: "Dismiss digital-thread tour" })
    .click();

  await page.goto("/");
  await page.getByRole("button", { name: "Explore sample" }).click();
  await expect(
    page.getByRole("heading", {
      name: /From stakeholder need to verified evidence/i,
    }),
  ).toBeVisible();

  await primaryNav(page)
    .getByRole("button", { name: /Requirements/ })
    .click();
  await page
    .getByRole("button", { name: "REQ-042 Mission telemetry availability" })
    .click();
  const statement = page.getByLabel("Requirement statement");
  await expect(statement).toBeVisible();
  await statement.scrollIntoViewIfNeeded();
  await screenshot(page, "requirement-authoring");

  await primaryNav(page)
    .getByRole("button", { name: /Traceability/ })
    .click();
  await expect(
    page.getByRole("heading", { name: /digital thread/i }),
  ).toBeVisible();
  await screenshot(page, "trace-graph");

  await primaryNav(page)
    .getByRole("button", { name: /Verification/ })
    .click();
  const verificationHeading = page.getByRole("heading", {
    name: "Requirement to evidence",
  });
  await expect(verificationHeading).toBeVisible();
  await verificationHeading.scrollIntoViewIfNeeded();
  await screenshot(page, "verification-matrix");

  await primaryNav(page)
    .getByRole("button", { name: /Impact/ })
    .click();
  await page.getByRole("button", { name: "Run impact simulation" }).click();
  const impactEvidence = page.getByText("Potentially affected artifacts");
  await expect(impactEvidence).toBeVisible();
  await impactEvidence.scrollIntoViewIfNeeded();
  await screenshot(page, "impact-analysis");

  await primaryNav(page)
    .getByRole("button", { name: /Baselines/ })
    .click();
  const baselineHeading = page.getByRole("heading", {
    name: "Compare baselines",
  });
  await expect(baselineHeading).toBeVisible();
  await baselineHeading.scrollIntoViewIfNeeded();
  await screenshot(page, "baseline-comparison");

  await primaryNav(page)
    .getByRole("button", { name: /Overview/ })
    .click();
  await page.getByLabel("Export title").scrollIntoViewIfNeeded();
  await expect(page.getByLabel("PNG scale")).toBeVisible();
  await screenshot(page, "exports");
});
