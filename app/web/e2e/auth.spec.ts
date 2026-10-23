import { expect, test } from "@playwright/test";
import { API, apiToken, bearer, loginUi, seed } from "./helpers";

test.describe("authentication and sessions", () => {
  test("owner signs in and lands on the gym dashboard", async ({ page }) => {
    const s = seed();
    await loginUi(page, s.accounts.owner);
    await expect(page).toHaveURL(new RegExp(`/${s.alpha}/dashboard`));
    await expect(page.getByRole("link", { name: "Reports", exact: true })).toBeVisible();
  });

  test("wrong password shows an error and stays on login", async ({ page }) => {
    const s = seed();
    await page.goto("/login");
    await page.getByLabel("Email or phone").fill(s.accounts.owner.email);
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/incorrect email, phone or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected pages redirect to login without a session", async ({ page }) => {
    const s = seed();
    await page.goto(`/${s.alpha}/members`);
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });

  test("logout revokes the token on the server", async ({ request }) => {
    const s = seed();
    const token = await apiToken(request, s.accounts.staff);
    expect((await request.get(`${API}/auth/me`, { headers: bearer(token) })).status()).toBe(200);
    expect((await request.post(`${API}/auth/logout`, { headers: bearer(token) })).status()).toBe(200);
    expect((await request.get(`${API}/auth/me`, { headers: bearer(token) })).status()).toBe(401);
  });

  test("refresh token rotates and the old one stops working", async ({ request }) => {
    const s = seed();
    const login = await (await request.post(`${API}/auth/login`, {
      data: { email: s.accounts.trainer.email, password: s.accounts.trainer.password },
    })).json();
    const rotated = await request.post(`${API}/auth/refresh`, { data: { refresh_token: login.refresh_token } });
    expect(rotated.status()).toBe(200);
    expect((await request.post(`${API}/auth/refresh`, { data: { refresh_token: login.refresh_token } })).status()).toBe(401);
  });
});
