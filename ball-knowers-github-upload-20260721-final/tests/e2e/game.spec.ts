import { expect, test } from "@playwright/test";

test("Easy cascade recognises Texas and Texas A&M while keeping focus", async ({ page }) => {
  await page.goto("/games/college-football/fbs-teams");
  await page.getByRole("radio", { name: /easy/i }).click();
  await page.getByRole("button", { name: /start game/i }).click();
  const input = page.getByRole("textbox", { name: /type a school/i });
  await expect(input).toBeFocused();
  await input.pressSequentially("Texas A&M");
  await expect(page.getByText("Texas", { exact: true })).toBeVisible();
  await expect(page.getByText("Texas A&M", { exact: true })).toBeVisible();
  await expect(input).toBeFocused();
});

test("Hard mode requires Enter", async ({ page }) => {
  await page.goto("/games/college-football/fbs-teams");
  await page.getByRole("radio", { name: /hard/i }).click();
  await page.getByRole("button", { name: /start game/i }).click();
  const input = page.getByRole("textbox", { name: /type a school/i });
  await input.fill("USC");
  await expect(page.getByText("USC", { exact: true })).not.toBeVisible();
  await input.press("Enter");
  await expect(page.getByText("USC", { exact: true })).toBeVisible();
});

test("Medium timer survives reload through saved resume", async ({ page }) => {
  await page.goto("/games/college-football/fbs-teams");
  await page.getByRole("button", { name: /start game/i }).click();
  await page.getByRole("textbox", { name: /type a school/i }).fill("Army");
  await page.reload();
  await page.getByRole("button", { name: /resume saved run/i }).click();
  await expect(page.getByRole("textbox", { name: /type a school/i })).toBeFocused();
  await expect(page.getByText("Army", { exact: true })).toBeVisible();
  await expect(page.getByText(/14:/)).toBeVisible();
});

test("end game and save local profile fallback", async ({ page }) => {
  await page.goto("/games/college-football/fbs-teams");
  await page.getByRole("radio", { name: /easy/i }).click();
  await page.getByRole("button", { name: /start game/i }).click();
  await page.getByRole("button", { name: /end game/i }).click();
  await page.getByRole("dialog").getByRole("button", { name: /end game/i }).click();
  await page.getByLabel("Display name").fill("Quiz Fan");
  await page.getByLabel("City").fill("Austin");
  await page.getByRole("button", { name: /save result/i }).click();
  await expect(page.getByText(/public leaderboard is unavailable/i)).toBeVisible();
});
