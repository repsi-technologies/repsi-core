/**
 * The one place the web app decides where the REPSI API lives.
 * - On localhost the browser calls the Next proxy (/api/v1 → app/api/v1/[...path]/route.ts → local API).
 * - Elsewhere it uses NEXT_PUBLIC_API_URL, defaulting to production over HTTPS.
 */
export const API_BASE =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "/api/v1"
    : process.env.NEXT_PUBLIC_API_URL || "https://api.repsi.app/api/v1";
