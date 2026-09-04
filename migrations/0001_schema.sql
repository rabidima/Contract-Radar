-- Contract Radar schema. Applied by scripts/migrate.mjs (idempotent — each
-- statement uses IF NOT EXISTS so re-running is safe).

create table if not exists opportunities (
  id text primary key, -- SAM.gov noticeId for synced rows, uid('opp') for manual ones
  title text not null,
  notice_id text not null, -- human-facing solicitation number
  agency text not null,
  office text,
  naics text not null,
  psc text,
  notice_type text not null,
  set_aside text not null,
  posted_at timestamptz not null,
  due_at timestamptz not null,
  est_value numeric,
  place text,
  incumbent text,
  bucket text not null,
  stage text not null,
  notes text not null default '',
  sample boolean not null default false,
  go jsonb,
  capture jsonb,
  proposal jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_stage_idx on opportunities (stage);
create index if not exists opportunities_naics_idx on opportunities (naics);

-- Single shared row: company posture + playbook reading-progress checks.
create table if not exists company (
  id text primary key default 'main',
  name text not null default '',
  uei text not null default '',
  cage text not null default '',
  naics text[] not null default '{}',
  certs text[] not null default '{}',
  vehicles text[] not null default '{}',
  footprint text not null default '',
  typical_bid_cost numeric not null default 0,
  target_pwin numeric not null default 0,
  min_contract numeric not null default 0,
  max_concurrent_bids integer not null default 1,
  setup_complete boolean not null default false,
  playbook_checks jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

insert into company (id) values ('main') on conflict (id) do nothing;

create table if not exists watchlist (
  id text primary key,
  type text not null, -- 'naics' | 'keyword'
  value text not null,
  label text,
  created_at timestamptz not null default now()
);

-- Single shared row: last sync timestamp + manual "run now" request flag.
create table if not exists sync_meta (
  id text primary key default 'main',
  last_synced_at timestamptz,
  source text,
  open_count integer,
  awarded_count integer,
  run_requested boolean not null default false,
  run_requested_at timestamptz
);

insert into sync_meta (id) values ('main') on conflict (id) do nothing;
