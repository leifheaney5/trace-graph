import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoHighImpactViolations(page: Page, label: string) {
  const result = await new AxeBuilder({ page }).analyze();
  const violations = result.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );
  expect(violations, `${label} should have no critical or serious axe violations`).toEqual([]);
}

test("case-study workflow surfaces remain free of critical and serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("complementary", { name: "TraceGraph workflow guide" }),
  ).toBeVisible();
  await expectNoHighImpactViolations(page, "landing");

  await page.getByRole("button", { name: "Open sample project" }).click();
  await expectNoHighImpactViolations(page, "workbench overview");

  const workflow = page.getByRole("navigation", {
    name: "Canonical digital-thread workflow",
  });

  for (const step of [
    "Requirement",
    "Architecture",
    "Verification",
    "Change impact",
    "Baseline",
  ]) {
    await workflow.getByRole("button", { name: new RegExp(step, "i") }).click();
    await expectNoHighImpactViolations(page, step);
  }
});
