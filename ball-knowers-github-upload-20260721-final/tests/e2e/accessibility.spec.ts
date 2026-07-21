import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("FBS game landing has no obvious automated accessibility violations", async ({ page }) => {
  await page.goto("/games/college-football/fbs-teams");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("active game exposes live regions and keyboard focus", async ({ page }) => {
  await page.goto("/games/college-football/fbs-teams");
  await page.getByRole("radio", { name: /easy/i }).click();
  await page.getByRole("button", { name: /start game/i }).click();
  await expect(page.locator("[aria-live='polite']")).toBeAttached();
  await expect(page.getByRole("textbox", { name: /type a school/i })).toBeFocused();
});
