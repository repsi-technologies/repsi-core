import { expect, test } from "@playwright/test";
import { API, apiToken, bearer, loginUi, seed } from "./helpers";

test.describe("roles and tenant isolation", () => {
  test("member is kept inside the member portal", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.member);
    await page.goto(`/${s.alpha}/members`);
    await expect(page).toHaveURL(new RegExp(`/${s.alpha}/member/dashboard`));
    await expect(page.getByRole("link", { name: "Book Classes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reports", exact: true })).toHaveCount(0);
  });

  test("trainer cannot open owner-only reports", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.trainer);
    await page.goto(`/${s.alpha}/reports`);
    await expect(page).toHaveURL(new RegExp(`/${s.alpha}/trainer/dashboard`));
  });

  test("front-desk staff get the staff menu", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.staff);
    await expect(page.getByRole("link", { name: "Check-in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Receipts & Dues" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Subscription & Billing", exact: true })).toHaveCount(0);
  });

  test("another gym's owner is redirected away from this gym's URLs", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.other_owner);
    await page.goto(`/${s.alpha}/members`);
    await expect(page).toHaveURL(new RegExp(`/${s.beta}/dashboard`));
  });

  test("the API enforces roles and tenancy, not just the UI", async ({ request }) => {
    const s = seed();
    const member = await apiToken(request, s.accounts.member);
    const other = await apiToken(request, s.accounts.other_owner);
    expect((await request.get(`${API}/dashboard/metrics`, { headers: bearer(member) })).status()).toBe(403);
    expect((await request.get(`${API}/reports/revenue`, { headers: bearer(member) })).status()).toBe(403);
    expect((await request.get(`${API}/members/${s.member_id}`, { headers: bearer(other) })).status()).toBe(404);
    expect((await request.get(`${API}/superadmin/overview`, { headers: bearer(other) })).status()).toBe(403);
  });

  test("super admin reaches the platform dashboard", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.superadmin);
    await expect(page).toHaveURL(/\/superadmin/);
  });
});
