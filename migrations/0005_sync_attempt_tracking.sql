-- Tracked separately from last_synced_at (which only updates on success)
-- so a failed attempt (e.g. api.sam.gov rate limit) still starts the
-- cooldown and blocks an immediate retry loop.
alter table sync_meta add column if not exists last_attempt_at timestamptz;
