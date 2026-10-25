import { expect, test } from "@playwright/test";

import { API, apiToken, bearer, loginUi, seed } from "./helpers";

// Central checkout (repsi.app/pay). The e2e API has SAAS_BILLING_ENABLED=true and no Cashfree credentials,
// so these cover sign-in, server-side pricing, roles and handoff; a real sandbox payment is a manual check.

test("owner sees the trial and server-priced plans", async ({ page }) => {
  await loginUi(page, seed().accounts.owner);
  await page.goto("/pay");
  await expect(page.getByRole("heading", { name: "Growth (trial)" })).toBeVisible();
  await expect(page.getByText("Free trial", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Choose a plan" }).click();
  await expect(page).toHaveURL(/\/pay\/subscribe/);
  await page.getByRole("radio", { name: "Annual" }).click();
  await expect(page.getByRole("radio", { name: /Growth/ })).toContainText("₹7,788");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  // No provider credentials on the e2e stack: the order is refused, nothing is charged.
  await expect(page.getByRole("main").getByRole("alert")).toContainText("not configured");
});

test("signed-out visitors are asked to sign in", async ({ page }) => {
  await page.goto("/pay");
  await expect(page.getByRole("heading", { name: "Sign in to manage billing" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login?redirect=%2Fpay");
});

test("staff cannot open billing or create orders", async ({ page, request }) => {
  const { staff } = seed().accounts;
  await loginUi(page, staff);
  await page.goto("/pay");
  await expect(page.getByRole("heading", { name: "Billing is managed by the gym owner" })).toBeVisible();
  const token = await apiToken(request, staff);
  const res = await request.post(`${API}/saas-billing/orders`, {
    headers: bearer(token),
    data: { plan_code: "growth", billing_cycle: "monthly", currency: "INR", idempotency_key: "e2e-staff-attempt" },
  });
  expect(res.status()).toBe(403);
});

test("app handoff link signs in once and is then rejected", async ({ page, request }) => {
  const token = await apiToken(request, seed().accounts.owner);
  const res = await request.post(`${API}/saas-billing/handoff`, { headers: bearer(token) });
  expect(res.status()).toBe(200);
  const handoff = new URL((await res.json()).url).searchParams.get("t")!;
  await page.goto(`/pay?t=${handoff}`);
  await expect(page.getByRole("heading", { name: "Growth (trial)" })).toBeVisible();
  await expect(page).toHaveURL(/\/pay$/); // token removed from the address bar
  const reuse = await request.post(`${API}/saas-billing/handoff/consume`, { data: { token: handoff } });
  expect(reuse.status()).toBe(401);
});

test("failed page offers a retry", async ({ page }) => {
  await page.goto("/pay/failed?order=rps_00000000000000000000000000000000");
  await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/pay/subscribe");
});
