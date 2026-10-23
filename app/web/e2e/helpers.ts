import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

export interface Account {
  email: string;
  password: string;
  role: string;
  workspace: string | null;
  user_id: string;
}

export interface Seed {
  alpha: string;
  beta: string;
  plan_id: string;
  member_id: string;
  accounts: Record<"owner" | "staff" | "trainer" | "member" | "other_owner" | "superadmin", Account>;
}

/** Accounts written by app/api/scripts/e2e_seed.py for this run (random passwords, scratch DB). */
export function seed(): Seed {
  return JSON.parse(readFileSync(path.resolve(__dirname, ".tmp/accounts.json"), "utf-8"));
}

export const API = "/api/v1";

/** Signs in through the real login form. */
export async function loginUi(page: Page, account: Account) {
  await page.goto("/login");
  await page.getByLabel("Email or phone").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}

/** API sign-in through the Next proxy; returns the bearer token. */
export async function apiToken(request: APIRequestContext, account: Account): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: { email: account.email, password: account.password } });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()).access_token;
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
