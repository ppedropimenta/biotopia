-- A tank belongs to one user. Dimensions are in cm and Net Volume in liters; every one of them is optional, and
-- Net Volume is never filled in from the dimensions. Deleting an account deletes its tanks.
create table tanks (
    id                uuid primary key,
    owner_id          uuid          not null references users (id) on delete cascade,
    name              text          not null,
    start_date        date          not null,
    length_cm         numeric(7, 2),
    width_cm          numeric(7, 2),
    height_cm         numeric(7, 2),
    net_volume_liters numeric(9, 2),
    note              text,
    created_at        timestamptz   not null
);

create index tanks_owner_id on tanks (owner_id);
