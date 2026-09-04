-- Default NAICS codes can't be removed from the watchlist, only added to.
alter table watchlist add column if not exists locked boolean not null default false;

update watchlist set locked = true
where type = 'naics' and value in ('541511', '541810', '541430', '541613', '518210');
