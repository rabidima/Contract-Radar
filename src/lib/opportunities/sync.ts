import { query } from "@/lib/db";
import { fetchSamOpportunities } from "./sam-sync";
import { appendNewOpportunitiesToSheet } from "./sheets";
import type { Opportunity } from "./types";

function mmddyyyy(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

// api.sam.gov's daily quota is small enough that a few impatient re-clicks
// of "Run search now" in one sitting can burn through the whole day's
// allowance (this happened twice). One call per watched NAICS code per
// sync, so cheap to exhaust — refuse to re-run within this window instead
// of finding out via a 429.
const MIN_SYNC_INTERVAL_MS = 20 * 60 * 1000;

export class SyncCooldownError extends Error {
  constructor(public readonly retryAt: Date) {
    const mins = Math.ceil((retryAt.getTime() - Date.now()) / 60_000);
    super(`Synced recently — try again in about ${mins} minute${mins === 1 ? "" : "s"} to avoid hitting SAM.gov's rate limit.`);
    this.name = "SyncCooldownError";
  }
}

/**
 * The one place that actually talks to api.sam.gov and writes results to
 * Postgres — called both by the "Run search now" server function (a viewer
 * clicked the button) and by the daily cron route. Same code path either
 * way, so there's exactly one sync implementation to reason about.
 */
export async function performSync(): Promise<{ open: number; awarded: number; matched: number }> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) throw new Error("SAM_GOV_API_KEY is not set.");

  // Cron fires once a day, so this only ever matters for "Run search now"
  // — but applying it uniformly means a manual run right before the
  // scheduled cron just makes the cron a no-op too, which is correct: the
  // data is already fresh, no reason to spend more quota confirming it.
  // Gated on the last ATTEMPT, not just the last success, so a 429 starts
  // the same cooldown instead of allowing an immediate identical retry.
  const [{ last_synced_at: lastSyncedAt, last_attempt_at: lastAttemptAt }] = await query<{
    last_synced_at: Date | null;
    last_attempt_at: Date | null;
  }>("select last_synced_at, last_attempt_at from sync_meta where id = 'main'");
  const lastRun = [lastSyncedAt, lastAttemptAt].filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0];
  if (lastRun) {
    const retryAt = new Date(lastRun.getTime() + MIN_SYNC_INTERVAL_MS);
    if (retryAt.getTime() > Date.now()) throw new SyncCooldownError(retryAt);
  }
  await query("update sync_meta set last_attempt_at = now() where id = 'main'");

  const watchRows = await query<{ value: string }>("select value from watchlist");
  const naicsCodes = watchRows.map((w) => w.value);

  const now = new Date();
  // api.sam.gov rejects a range of "more than 1 year" — 365 days measured
  // in milliseconds lands exactly on that boundary and gets bounced with
  // "Date range must be no more than 1 year apart", so stay a few days shy.
  const yearAgo = new Date(now.getTime() - 360 * 86_400_000);

  let matched: Opportunity[] = [];
  const newlyDiscovered: Opportunity[] = [];
  if (naicsCodes.length > 0) {
    matched = await fetchSamOpportunities({
      apiKey,
      naicsCodes,
      postedFrom: mmddyyyy(yearAgo),
      postedTo: mmddyyyy(now),
    });

    for (const o of matched) {
      // `xmax = 0` is the standard Postgres tell for "this command actually
      // inserted the row" vs. hit the ON CONFLICT UPDATE branch — lets us
      // tell a genuinely new notice from one we're just refreshing, without
      // a separate lookup per row.
      const [{ inserted }] = await query<{ inserted: boolean }>(
        `insert into opportunities
           (id, title, naics, notice_type, solicitation_number, dept, office,
            publish_date, response_date, set_aside, status, link, awardee, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now())
         on conflict (id) do update set
           title = excluded.title,
           naics = excluded.naics,
           notice_type = excluded.notice_type,
           solicitation_number = excluded.solicitation_number,
           dept = excluded.dept,
           office = excluded.office,
           publish_date = excluded.publish_date,
           response_date = excluded.response_date,
           set_aside = excluded.set_aside,
           status = excluded.status,
           link = excluded.link,
           awardee = excluded.awardee,
           updated_at = now()
         returning (xmax = 0) as inserted`,
        [
          o.id, o.title, o.naics, o.noticeType, o.solicitationNumber, o.dept, o.office,
          o.publishDate, o.responseDate, o.setAside, o.status, o.link, o.awardee,
        ],
      );
      if (inserted) newlyDiscovered.push(o);
    }
  }

  if (newlyDiscovered.length > 0) {
    try {
      await appendNewOpportunitiesToSheet(newlyDiscovered);
    } catch (err) {
      // The sync itself succeeded and Postgres is the source of truth;
      // the Sheet is a convenience export, so log and move on rather
      // than failing the whole sync over a Sheets hiccup.
      console.error("[sync] Sheets export failed:", err);
    }
  }

  const [{ count: openCount }] = await query<{ count: number }>(
    "select count(*)::int as count from opportunities where status = 'open'",
  );
  const [{ count: awardedCount }] = await query<{ count: number }>(
    "select count(*)::int as count from opportunities where status = 'awarded'",
  );

  await query(
    `update sync_meta set
       last_synced_at = now(), source = 'api.sam.gov', open_count = $1, awarded_count = $2,
       run_requested = false
     where id = 'main'`,
    [openCount, awardedCount],
  );

  return { open: openCount, awarded: awardedCount, matched: matched.length };
}
