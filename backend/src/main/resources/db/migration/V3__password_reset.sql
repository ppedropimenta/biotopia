-- Single-use links that let someone who forgot their password choose a new one.
-- Like confirmation links, only a hash of the token is stored.
create table password_reset_tokens (
    token_hash text primary key,
    user_id    uuid        not null references users (id) on delete cascade,
    expires_at timestamptz not null
);

create index password_reset_tokens_user_id on password_reset_tokens (user_id);
