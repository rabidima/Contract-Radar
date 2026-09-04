import { createServerFn } from "@tanstack/react-start";
import { query, queryOne } from "@/lib/db";
import { performSync } from "./sync";
import { uid } from "../utils";
import type { Opportunity, SyncMeta, WatchlistItem } from "./types";

type OpportunityRow = {
  id: string;
  title: string;
  naics: string | null;
  notice_type: string;
  solicitation_number: string | null;
  dept: string | null;
  office: string | null;
  publish_date: Date;
  response_date: Date | null;
  set_aside: string | null;
  status: Opportunity["status"];
  link: string;
  awardee: string | null;
  matched_keyword: string | null;
};

function rowToOpportunity(r: OpportunityRow): Opportunity {
  return {
    id: r.id,
    title: r.title,
    naics: r.naics,
    noticeType: r.notice_type,
    solicitationNumber: r.solicitation_number,
    dept: r.dept,
    office: r.office,
    publishDate: r.publish_date.toISOString(),
    responseDate: r.response_date ? r.response_date.toISOString() : null,
    setAside: r.set_aside,
    status: r.status,
    link: r.link,
    awardee: r.awardee,
    matchedKeyword: r.matched_keyword,
  };
}

export const fetchOpportunities = createServerFn({ method: "GET" }).handler(
  async (): Promise<Opportunity[]> => {
    const rows = await query<OpportunityRow>(
      "select * from opportunities order by publish_date desc",
    );
    return rows.map(rowToOpportunity);
  },
);

type WatchlistRow = { id: string; type: "naics" | "keyword"; value: string; label: string | null };

export const fetchWatchlist = createServerFn({ method: "GET" }).handler(
  async (): Promise<WatchlistItem[]> => {
    return query<WatchlistRow>(
      "select id, type, value, label from watchlist order by created_at asc",
    );
  },
);

export const addWatchlistItem = createServerFn({ method: "POST" })
  .validator((data: { type: "naics" | "keyword"; value: string; label?: string }) => data)
  .handler(async ({ data }): Promise<WatchlistItem> => {
    const id = uid(data.type === "naics" ? "naics" : "kw");
    await query(
      "insert into watchlist (id, type, value, label) values ($1,$2,$3,$4)",
      [id, data.type, data.value, data.label ?? null],
    );
    return { id, type: data.type, value: data.value, label: data.label ?? null };
  });

export const removeWatchlistItem = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await query("delete from watchlist where id = $1", [data.id]);
  });

export const fetchSyncMeta = createServerFn({ method: "GET" }).handler(
  async (): Promise<SyncMeta> => {
    const row = await queryOne<{
      last_synced_at: Date | null;
      source: string | null;
      open_count: number | null;
      awarded_count: number | null;
      run_requested: boolean;
      run_requested_at: Date | null;
    }>("select * from sync_meta where id = 'main'");
    return {
      lastSyncedAt: row?.last_synced_at?.toISOString() ?? null,
      source: row?.source ?? null,
      openCount: row?.open_count ?? null,
      awardedCount: row?.awarded_count ?? null,
      runRequested: row?.run_requested ?? false,
      runRequestedAt: row?.run_requested_at?.toISOString() ?? null,
    };
  },
);

/** "Run search now" — unlike the old Claude-artifact version of this
 * dashboard, this app has real server compute, so the button can actually
 * call api.sam.gov synchronously instead of just flagging a request. */
export const runSyncNow = createServerFn({ method: "POST" }).handler(async () => {
  return performSync();
});
