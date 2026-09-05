import { defineEventHandler, getHeader, setResponseStatus } from "h3";
import { performSync, SyncCooldownError } from "@/lib/opportunities/sync";

/** Vercel Cron hits this daily with `Authorization: Bearer <CRON_SECRET>`
 * (Vercel's own convention when CRON_SECRET is set on the project) — the
 * auth-gate middleware already lets /api/cron/* through without the
 * dashboard password cookie, so this checks the cron secret itself. */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET;
  const auth = getHeader(event, "authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    setResponseStatus(event, 401);
    return { ok: false, error: "unauthorized" };
  }

  try {
    const result = await performSync();
    return { ok: true, ...result };
  } catch (err) {
    if (err instanceof SyncCooldownError) {
      // A manual run happened recently enough that data is already
      // fresh — not a failure, just nothing to do.
      return { ok: true, skipped: true, reason: err.message };
    }
    console.error("[cron/sync] failed:", err);
    setResponseStatus(event, 500);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
