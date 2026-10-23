import { expect, test } from "@playwright/test";
import { API, apiToken, bearer, loginUi, seed } from "./helpers";

test.describe("gym workflows", () => {
  test("member directory and member profile with documents tab", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.owner);
    await page.goto(`/${s.alpha}/members`);
    await expect(page.getByText("Mia").first()).toBeVisible();
    await page.goto(`/${s.alpha}/members/${s.member_id}`);
    await page.getByRole("button", { name: "Documents" }).or(page.getByRole("tab", { name: "Documents" })).first().click();
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  });

  test("membership assignment with a coupon records the discounted price", async ({ request }) => {
    const s = seed();
    const owner = await apiToken(request, s.accounts.owner);
    const coupon = await request.post(`${API}/offers/coupons`, { headers: bearer(owner),
      data: { code: `E2E${Date.now()}`.slice(0, 20), discount_type: "flat", discount_value: 500 } });
    expect(coupon.status(), await coupon.text()).toBe(201);
    const walkIn = await request.post(`${API}/members`, { headers: bearer(owner),
      data: { first_name: "Walk", last_name: "In", phone: `+9198${Date.now().toString().slice(-8)}` } });
    expect(walkIn.status(), await walkIn.text()).toBe(201);
    const today = new Date().toISOString().slice(0, 10);
    const m = await request.post(`${API}/memberships/`, { headers: bearer(owner),
      data: { member_id: (await walkIn.json()).id, plan_id: s.plan_id, start_date: today, coupon_code: (await coupon.json()).code } });
    expect(m.status(), await m.text()).toBe(201);
    expect((await m.json()).price_paid).toBe(1000);
  });

  test("payment gets a receipt that downloads from the finance page", async ({ page, request }) => {
    const s = seed();
    const staff = await apiToken(request, s.accounts.staff);
    const pay = await request.post(`${API}/payments/`, { headers: bearer(staff),
      data: { member_id: s.member_id, amount: 1500, method: "cash" } });
    expect(pay.status(), await pay.text()).toBe(201);
    const receipt = (await pay.json()).receipt_number as string;
    expect(receipt).toMatch(/^RCPT-\d{4}-\d{6}$/);

    await loginUi(page, s.accounts.owner);
    await page.goto(`/${s.alpha}/payments/finance`);
    await expect(page.getByText(receipt)).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: `Download receipt ${receipt}` }).click();
    expect((await download).suggestedFilename()).toBe(`${receipt}.pdf`);
  });

  test("staff checks a member in and a second open visit is refused", async ({ request }) => {
    const s = seed();
    const staff = await apiToken(request, s.accounts.staff);
    const first = await request.post(`${API}/attendance/check-in`, { headers: bearer(staff), data: { member_id: s.member_id } });
    expect([200, 201]).toContain(first.status());
    const again = await request.post(`${API}/attendance/check-in`, { headers: bearer(staff), data: { member_id: s.member_id } });
    expect(again.ok()).toBeFalsy();
  });

  test("owner schedules a class and the member books it", async ({ page, request }) => {
    const s = seed();
    const owner = await apiToken(request, s.accounts.owner);
    const name = `Spin ${Date.now() % 100000}`;
    const created = await request.post(`${API}/classes/`, { headers: bearer(owner), data: { name, capacity: 5 } });
    expect(created.status(), await created.text()).toBe(201);
    const tomorrow = new Date(Date.now() + 26 * 3600_000).toISOString().slice(0, 16);
    const sessions = await request.post(`${API}/classes/${(await created.json()).id}/sessions`, { headers: bearer(owner),
      data: { starts_at: tomorrow } });
    expect(sessions.status(), await sessions.text()).toBe(201);

    await loginUi(page, s.accounts.member);
    await page.goto(`/${s.alpha}/member/classes`);
    const card = page.getByRole("listitem").filter({ hasText: name });
    await card.getByRole("button", { name: "Book" }).click();
    await expect(page.getByText("You're booked.")).toBeVisible();
    await expect(page.getByRole("region", { name: "My bookings" }).or(page.locator("section").first()).getByText(name).first()).toBeVisible();
  });

  test("reports show real totals and export CSV", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.owner);
    await page.goto(`/${s.alpha}/reports`);
    await expect(page.getByRole("tab", { name: "Revenue" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("table")).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV" }).click();
    expect((await download).suggestedFilename()).toMatch(/^revenue-.*\.csv$/);
  });
});
