import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing and workbench have no critical or serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  const landing = await new AxeBuilder({ page }).analyze();
  expect(
    landing.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Open sample project" }).click();
  const workbench = await new AxeBuilder({ page }).analyze();
  expect(
    workbench.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    ),
  ).toEqual([]);
});
