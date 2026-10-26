-- One value of one Parameter in one tank at one instant. The parameter is stored by name (see Parameter.java).
-- Deleting a tank deletes its measurements.
create table measurements (
    id          uuid primary key,
    tank_id     uuid           not null references tanks (id) on delete cascade,
    parameter   text           not null,
    value       numeric(12, 4) not null,
    measured_at timestamptz    not null,
    note        text,
    created_at  timestamptz    not null
);

create index measurements_tank_measured_at on measurements (tank_id, measured_at desc);
