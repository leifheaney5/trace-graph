import { expect, test } from "@playwright/test";

test("engineer can inspect impact, query the thread, and accept an elicitation candidate", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Engineering intelligence", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Engineering intelligence workbench" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/zero are canonical automatically/i)).toBeVisible();

  await dialog.getByRole("button", { name: "Impact", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: /Follow the reason for every consequence/i })).toBeVisible();
  await expect(dialog.getByText("Evidence at risk", { exact: true })).toBeVisible();
  await expect(dialog.getByText(/verified-by/).first()).toBeVisible();

  await dialog.getByRole("button", { name: "Trace queries" }).click();
  await dialog
    .getByRole("button", { name: "show every path from REQ-042 to EVD-017" })
    .click();
  await expect(dialog.getByText(/directed paths found from REQ-042 to EVD-017/i)).toBeVisible();

  await dialog.getByRole("button", { name: "Evidence validity" }).click();
  await expect(dialog.getByRole("heading", { name: "Existence is not validity" })).toBeVisible();
  await expect(dialog.getByRole("table")).toBeVisible();

  await dialog.getByRole("button", { name: "Elicitation", exact: true }).click();
  await dialog.getByRole("button", { name: "Extract candidate engineering records" }).click();
  await expect(dialog.getByText("SUGGESTED · NOT CANONICAL").first()).toBeVisible();
  await dialog.getByRole("button", { name: "Accept into canonical thread" }).first().click();
  await expect(dialog.getByRole("status")).toContainText(/accepted into the canonical project/i);

  await dialog.getByRole("button", { name: "Apply & return to core views" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: /stakeholder need/i })).toBeVisible();
});
