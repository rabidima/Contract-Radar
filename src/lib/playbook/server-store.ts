import { createServerFn } from "@tanstack/react-start";
import { query, queryOne } from "@/lib/db";
import type {
  Cert,
  Company,
  GoNoGo,
  CapturePlan,
  Opportunity,
  PlaybookChecks,
  ProposalProgress,
} from "./types";

type OpportunityRow = {
  id: string;
  title: string;
  notice_id: string;
  agency: string;
  office: string | null;
  naics: string;
  psc: string | null;
  notice_type: string;
  set_aside: string;
  posted_at: Date;
  due_at: Date;
  est_value: number | null;
  place: string | null;
  incumbent: string | null;
  bucket: string;
  stage: string;
  notes: string;
  sample: boolean;
  go: GoNoGo | null;
  capture: CapturePlan | null;
  proposal: ProposalProgress | null;
};

function rowToOpportunity(r: OpportunityRow): Opportunity {
  return {
    id: r.id,
    title: r.title,
    noticeId: r.notice_id,
    agency: r.agency,
    office: r.office ?? undefined,
    naics: r.naics,
    psc: r.psc ?? undefined,
    noticeType: r.notice_type as Opportunity["noticeType"],
    setAside: r.set_aside as Opportunity["setAside"],
    postedAt: r.posted_at.toISOString(),
    dueAt: r.due_at.toISOString(),
    estValue: r.est_value ?? undefined,
    place: r.place ?? undefined,
    incumbent: r.incumbent ?? undefined,
    bucket: r.bucket as Opportunity["bucket"],
    stage: r.stage as Opportunity["stage"],
    notes: r.notes,
    sample: r.sample,
    go: r.go ?? undefined,
    capture: r.capture ?? undefined,
    proposal: r.proposal ?? undefined,
  };
}

export const fetchOpportunities = createServerFn({ method: "GET" }).handler(
  async (): Promise<Opportunity[]> => {
    const rows = await query<OpportunityRow>(
      "select * from opportunities order by due_at asc",
    );
    return rows.map(rowToOpportunity);
  },
);

/** Insert-or-replace, keyed by id. Used for both a manual "Add SAM notice"
 * and the daily sync upserting matches from api.sam.gov. */
export const upsertOpportunities = createServerFn({ method: "POST" })
  .validator((data: Opportunity[]) => data)
  .handler(async ({ data }) => {
    for (const o of data) {
      await query(
        `insert into opportunities
           (id, title, notice_id, agency, office, naics, psc, notice_type, set_aside,
            posted_at, due_at, est_value, place, incumbent, bucket, stage, notes, sample,
            go, capture, proposal, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21, now())
         on conflict (id) do update set
           title = excluded.title,
           notice_id = excluded.notice_id,
           agency = excluded.agency,
           office = excluded.office,
           naics = excluded.naics,
           psc = excluded.psc,
           notice_type = excluded.notice_type,
           set_aside = excluded.set_aside,
           posted_at = excluded.posted_at,
           due_at = excluded.due_at,
           est_value = excluded.est_value,
           place = excluded.place,
           incumbent = excluded.incumbent,
           bucket = excluded.bucket,
           stage = excluded.stage,
           notes = excluded.notes,
           sample = excluded.sample,
           go = excluded.go,
           capture = excluded.capture,
           proposal = excluded.proposal,
           updated_at = now()`,
        [
          o.id, o.title, o.noticeId, o.agency, o.office ?? null, o.naics, o.psc ?? null,
          o.noticeType, o.setAside, o.postedAt, o.dueAt, o.estValue ?? null, o.place ?? null,
          o.incumbent ?? null, o.bucket, o.stage, o.notes, o.sample ?? false,
          o.go ? JSON.stringify(o.go) : null,
          o.capture ? JSON.stringify(o.capture) : null,
          o.proposal ? JSON.stringify(o.proposal) : null,
        ],
      );
    }
  });

export const patchOpportunity = createServerFn({ method: "POST" })
  .validator((data: { id: string; patch: Partial<Opportunity> }) => data)
  .handler(async ({ data: { id, patch } }) => {
    const existingRows = await query<OpportunityRow>(
      "select * from opportunities where id = $1",
      [id],
    );
    const existing = existingRows[0];
    if (!existing) throw new Error(`Opportunity ${id} not found`);
    const merged: Opportunity = { ...rowToOpportunity(existing), ...patch };
    await query(
      `update opportunities set
         title=$2, notice_id=$3, agency=$4, office=$5, naics=$6, psc=$7, notice_type=$8,
         set_aside=$9, posted_at=$10, due_at=$11, est_value=$12, place=$13, incumbent=$14,
         bucket=$15, stage=$16, notes=$17, sample=$18, go=$19, capture=$20, proposal=$21,
         updated_at=now()
       where id=$1`,
      [
        merged.id, merged.title, merged.noticeId, merged.agency, merged.office ?? null,
        merged.naics, merged.psc ?? null, merged.noticeType, merged.setAside, merged.postedAt,
        merged.dueAt, merged.estValue ?? null, merged.place ?? null, merged.incumbent ?? null,
        merged.bucket, merged.stage, merged.notes, merged.sample ?? false,
        merged.go ? JSON.stringify(merged.go) : null,
        merged.capture ? JSON.stringify(merged.capture) : null,
        merged.proposal ? JSON.stringify(merged.proposal) : null,
      ],
    );
  });

export const deleteOpportunity = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await query("delete from opportunities where id = $1", [data.id]);
  });

export const deleteSampleOpportunities = createServerFn({ method: "POST" }).handler(async () => {
  await query("delete from opportunities where sample = true");
});

/** True the very first time the app loads against an empty database — used
 * to seed the demo opportunities exactly once, so a later legitimate
 * "clear samples" doesn't cause them to silently come back. */
export const claimFirstSeed = createServerFn({ method: "POST" }).handler(
  async (): Promise<boolean> => {
    const row = await queryOne<{ seeded: boolean }>(
      "update sync_meta set seeded = true where id = 'main' and seeded = false returning seeded",
    );
    return row !== null;
  },
);

type CompanyRow = {
  name: string;
  uei: string;
  cage: string;
  naics: string[];
  certs: string[];
  vehicles: string[];
  footprint: string;
  typical_bid_cost: number;
  target_pwin: number;
  min_contract: number;
  max_concurrent_bids: number;
  setup_complete: boolean;
  playbook_checks: PlaybookChecks;
};

function rowToCompany(r: CompanyRow): Company {
  return {
    name: r.name,
    uei: r.uei,
    cage: r.cage,
    naics: r.naics,
    certs: r.certs as Cert[],
    vehicles: r.vehicles,
    footprint: r.footprint,
    typicalBidCost: r.typical_bid_cost,
    targetPwin: r.target_pwin,
    minContract: r.min_contract,
    maxConcurrentBids: r.max_concurrent_bids,
    setupComplete: r.setup_complete,
  };
}

export const fetchCompany = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ company: Company; playbookChecks: PlaybookChecks }> => {
    const row = await queryOne<CompanyRow>("select * from company where id = 'main'");
    if (!row) throw new Error("company row missing — did migrations run?");
    return { company: rowToCompany(row), playbookChecks: row.playbook_checks ?? {} };
  },
);

export const saveCompany = createServerFn({ method: "POST" })
  .validator((data: Partial<Company>) => data)
  .handler(async ({ data }) => {
    const row = await queryOne<CompanyRow>("select * from company where id = 'main'");
    const current = row ? rowToCompany(row) : null;
    const merged: Company = {
      name: "", uei: "", cage: "", naics: [], certs: [], vehicles: [], footprint: "",
      typicalBidCost: 0, targetPwin: 0, minContract: 0, maxConcurrentBids: 1,
      setupComplete: false, ...current, ...data,
    };
    await query(
      `update company set
         name=$1, uei=$2, cage=$3, naics=$4, certs=$5, vehicles=$6, footprint=$7,
         typical_bid_cost=$8, target_pwin=$9, min_contract=$10, max_concurrent_bids=$11,
         setup_complete=$12, updated_at=now()
       where id='main'`,
      [
        merged.name, merged.uei, merged.cage, merged.naics, merged.certs, merged.vehicles,
        merged.footprint, merged.typicalBidCost, merged.targetPwin, merged.minContract,
        merged.maxConcurrentBids, merged.setupComplete,
      ],
    );
  });

export const savePlaybookChecks = createServerFn({ method: "POST" })
  .validator((data: PlaybookChecks) => data)
  .handler(async ({ data }) => {
    await query("update company set playbook_checks = $1, updated_at = now() where id = 'main'", [
      JSON.stringify(data),
    ]);
  });

type WatchlistRow = { id: string; type: "naics" | "keyword"; value: string; label: string | null };

export const fetchWatchlist = createServerFn({ method: "GET" }).handler(
  async (): Promise<WatchlistRow[]> => {
    return query<WatchlistRow>("select id, type, value, label from watchlist order by created_at asc");
  },
);

export const addWatchlistItem = createServerFn({ method: "POST" })
  .validator((data: { id: string; type: "naics" | "keyword"; value: string; label?: string }) => data)
  .handler(async ({ data }) => {
    await query(
      "insert into watchlist (id, type, value, label) values ($1,$2,$3,$4) on conflict (id) do nothing",
      [data.id, data.type, data.value, data.label ?? null],
    );
  });

export const removeWatchlistItem = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await query("delete from watchlist where id = $1", [data.id]);
  });

type SyncMetaRow = {
  last_synced_at: Date | null;
  source: string | null;
  open_count: number | null;
  awarded_count: number | null;
  run_requested: boolean;
  run_requested_at: Date | null;
};

export const fetchSyncMeta = createServerFn({ method: "GET" }).handler(async () => {
  const row = await queryOne<SyncMetaRow>("select * from sync_meta where id = 'main'");
  return {
    lastSyncedAt: row?.last_synced_at?.toISOString() ?? null,
    source: row?.source ?? null,
    openCount: row?.open_count ?? null,
    awardedCount: row?.awarded_count ?? null,
    runRequested: row?.run_requested ?? false,
    runRequestedAt: row?.run_requested_at?.toISOString() ?? null,
  };
});

export const requestSync = createServerFn({ method: "POST" }).handler(async () => {
  await query(
    "update sync_meta set run_requested = true, run_requested_at = now() where id = 'main'",
  );
});
