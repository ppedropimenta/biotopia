-- When the password last changed through a reset. A session that started before this moment is ended, so a
-- reset also logs out whoever was using the old password. Null means the password was never reset.
alter table users add column password_changed_at timestamptz;
