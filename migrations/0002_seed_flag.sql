-- Tracks whether the demo/sample opportunities have ever been seeded, so a
-- legitimate "clear samples" doesn't cause them to silently reappear on the
-- next load (which a plain "opportunities table is empty" check would do).
alter table sync_meta add column if not exists seeded boolean not null default false;
