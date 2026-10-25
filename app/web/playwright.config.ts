import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

/**
 * End-to-end tests against a scratch stack:
 * - API on 127.0.0.1:8000 with a throwaway SQLite file under e2e/.tmp (never the developer's .env
 *   database), test OTPs, no provider keys, seeded with random-password accounts (scripts/e2e_seed.py).
 * - Next dev server on :3000, which proxies /api/v1 to that API.
 * Set E2E_REUSE_SERVERS=1 to reuse servers you already started.
 */
const API_DIR = path.resolve(__dirname, "../api");
const TMP = path.resolve(__dirname, "e2e/.tmp");
const DB = path.join(TMP, "e2e.db");
const ACCOUNTS = path.join(TMP, "accounts.json");
const PYTHON = `"${process.env.E2E_PYTHON || path.join(API_DIR, process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python")}"`;
const reuse = !!process.env.E2E_REUSE_SERVERS;

if (!reuse && !process.env.PLAYWRIGHT_CHILD) {
  // Fresh database for every run (the config is evaluated once in the runner process).
  process.env.PLAYWRIGHT_CHILD = "1";
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
}

const apiEnv = {
  DATABASE_URL: `sqlite:///${DB.replace(/\\/g, "/")}`,
  ENVIRONMENT: "development",
  OTP_PROVIDER: "test",
  OTP_TEST_CODE: "123456",
  SECRET_KEY: process.env.E2E_SECRET_KEY || randomBytes(32).toString("hex"),
  AISENSY_API_KEY: "",
  SMTP_USER: "",
  SMTP_PASSWORD: "",
  GEMINI_API_KEY: "",
  SCHEDULER_ENABLED: "false",
  STORAGE_BACKEND: "local",
  // Every spec signs in several accounts from one IP; limits are covered by the pytest suite.
  RATE_LIMITS_ENABLED: "false",
  PYTHONUTF8: "1",
  // Central SaaS billing on, with no payment provider credentials: a developer .env can never make the
  // e2e stack reach Cashfree (orders stop with "not configured"; real payments are a manual sandbox check).
  SAAS_BILLING_ENABLED: "true",
  CASHFREE_APP_ID: "",
  CASHFREE_SECRET_KEY: "",
  CASHFREE_ENV: "TEST",
  SAAS_ALERT_EMAIL: "",
};

export const E2E_ACCOUNTS_FILE = ACCOUNTS;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: [
    {
      command: `${PYTHON} -m scripts.e2e_seed --out "${ACCOUNTS}" && ${PYTHON} -m uvicorn app.main:app --host 127.0.0.1 --port 8000`,
      cwd: API_DIR,
      url: "http://127.0.0.1:8000/health",
      env: apiEnv,
      reuseExistingServer: reuse,
      timeout: 180_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000/login",
      env: { REMOTE_API_URL: "http://127.0.0.1:8000/api/v1", NEXT_TELEMETRY_DISABLED: "1" },
      reuseExistingServer: reuse,
      timeout: 240_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
