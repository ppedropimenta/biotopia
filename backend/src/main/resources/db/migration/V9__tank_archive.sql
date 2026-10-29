-- An archived tank is one that is no longer running. It keeps all its history; null means the tank is active.
alter table tanks add column archived_at timestamptz;
