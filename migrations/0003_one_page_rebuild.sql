-- Rebuild: dropping the multi-page capture-workflow model (Go/No-Go
-- scoring, capture plans, proposal checklists, company posture) in favor
-- of the single-page dashboard: a watched list of NAICS codes/keywords,
-- and the SAM.gov notices that match them.

drop table if exists company;
drop table if exists opportunities;

create table opportunities (
  id text primary key, -- SAM.gov noticeId
  title text not null,
  naics text,
  notice_type text not null, -- raw SAM.gov label: "Solicitation", "Sources Sought", "Award Notice", ...
  solicitation_number text,
  dept text,
  office text,
  publish_date timestamptz not null,
  response_date timestamptz,
  set_aside text,
  status text not null, -- 'open' | 'awarded'
  link text not null,
  awardee text,
  matched_keyword text, -- set when this notice matched a keyword search rather than (or in addition to) a NAICS code
  updated_at timestamptz not null default now()
);

create index opportunities_status_idx on opportunities (status);
create index opportunities_naics_idx on opportunities (naics);
create index opportunities_response_date_idx on opportunities (response_date);
