import { createHash, timingSafeEqual } from "node:crypto";
import {
  defineEventHandler,
  getCookie,
  getRequestURL,
  readBody,
  sendRedirect,
  setCookie,
  setResponseHeader,
  setResponseStatus,
} from "h3";

const COOKIE_NAME = "cr_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

function expectedToken(): string | null {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(password).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function loginPage(error?: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Contract Radar</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100dvh; display: flex; align-items: center; justify-content: center;
    background: #ffffff; color: #111111; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  form { width: 100%; max-width: 320px; padding: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { color: #5b6058; margin: 0 0 24px; font-size: 13px; }
  input { width: 100%; padding: 11px 12px; border-radius: 8px; border: 1px solid rgb(17 17 17 / 20%);
    background: #f4f4f2; color: #111111; font-size: 14px; }
  input:focus { outline: 2px solid #3d5a72; outline-offset: 1px; }
  button { margin-top: 12px; width: 100%; padding: 11px; border-radius: 8px; border: none;
    background: #3d5a72; color: #ffffff; font-weight: 600; font-size: 14px; cursor: pointer; }
  button:hover { opacity: 0.9; }
  .error { color: #a8493f; font-size: 13px; margin-top: 10px; }
</style></head>
<body>
  <form method="POST" action="/__auth">
    <h1>Contract Radar</h1>
    <p>48HourDigital internal — enter the shared password.</p>
    <input type="password" name="password" placeholder="Password" autofocus required>
    <button type="submit">Enter</button>
    ${error ? `<p class="error">${error}</p>` : ""}
  </form>
</body></html>`;
}

/** Gate every request behind a single shared password. Not per-user auth —
 * just keeps the dashboard (and the data it reads/writes) off the open
 * internet until it's meaningfully access-controlled. Cron requests carry
 * their own secret header and bypass this entirely. */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);

  // Vercel Cron calls this with its own bearer secret, never the password
  // cookie — let it through before anything else.
  if (url.pathname.startsWith("/api/cron/")) return;

  const expected = expectedToken();
  if (!expected) {
    // No password configured (local dev without .env.local, or misconfigured
    // deploy) — fail open in dev, fail closed in production.
    if (process.env.NODE_ENV !== "production") return;
    setResponseStatus(event, 500);
    return "DASHBOARD_PASSWORD is not set.";
  }

  if (url.pathname === "/__auth" && event.method === "POST") {
    const body = await readBody<{ password?: string }>(event);
    const submitted = body?.password ?? "";
    const token = submitted ? createHash("sha256").update(submitted).digest("hex") : "";
    if (token && safeEqual(token, expected)) {
      setCookie(event, COOKIE_NAME, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: ONE_YEAR,
      });
      return sendRedirect(event, "/", 302);
    }
    setResponseStatus(event, 401);
    setResponseHeader(event, "content-type", "text/html; charset=utf-8");
    return loginPage("Wrong password.");
  }

  const cookie = getCookie(event, COOKIE_NAME);
  if (cookie && safeEqual(cookie, expected)) return;

  setResponseStatus(event, 401);
  setResponseHeader(event, "content-type", "text/html; charset=utf-8");
  return loginPage();
});
