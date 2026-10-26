-- Accounts and the single-use links that confirm their email address.
create table users (
    id            uuid primary key,
    email         text        not null unique,
    password_hash text        not null,
    language      text        not null check (language in ('en', 'pt-BR')),
    confirmed_at  timestamptz,
    created_at    timestamptz not null
);

-- Only a hash of the token is stored, so a leaked table cannot be used to confirm accounts.
create table confirmation_tokens (
    token_hash text primary key,
    user_id    uuid        not null references users (id) on delete cascade,
    expires_at timestamptz not null
);

create index confirmation_tokens_user_id on confirmation_tokens (user_id);
