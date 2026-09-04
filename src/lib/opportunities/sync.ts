import { query } from "@/lib/db";
import { fetchSamOpportunities } from "./sam-sync";
import type { Opportunity } from "./types";

function mmddyyyy(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
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

  const watchRows = await query<{ value: string }>("select value from watchlist");
  const naicsCodes = watchRows.map((w) => w.value);

  const now = new Date();
  // api.sam.gov rejects a range of "more than 1 year" — 365 days measured
  // in milliseconds lands exactly on that boundary and gets bounced with
  // "Date range must be no more than 1 year apart", so stay a few days shy.
  const yearAgo = new Date(now.getTime() - 360 * 86_400_000);

  let matched: Opportunity[] = [];
  if (naicsCodes.length > 0) {
    matched = await fetchSamOpportunities({
      apiKey,
      naicsCodes,
      postedFrom: mmddyyyy(yearAgo),
      postedTo: mmddyyyy(now),
    });

    for (const o of matched) {
      await query(
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
           updated_at = now()`,
        [
          o.id, o.title, o.naics, o.noticeType, o.solicitationNumber, o.dept, o.office,
          o.publishDate, o.responseDate, o.setAside, o.status, o.link, o.awardee,
        ],
      );
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
