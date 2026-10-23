import { expect, test } from "@playwright/test";
import { loginUi, seed } from "./helpers";

test.describe("mobile layout", () => {
  test("member menu opens from the menu button and shows member links only", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.member);
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Book Classes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Members", exact: true })).toHaveCount(0);
  });

  test("no horizontal page scroll on the member dashboard", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.member);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
