-- Care work already done on a tank. The type is stored by name (see MaintenanceType.java); the percentage is set
-- only for a water change. Deleting a tank deletes its maintenance.
create table maintenance (
    id           uuid primary key,
    tank_id      uuid          not null references tanks (id) on delete cascade,
    type         text          not null,
    percent      numeric(5, 2),
    performed_at timestamptz   not null,
    note         text,
    created_at   timestamptz   not null
);

create index maintenance_tank_performed_at on maintenance (tank_id, performed_at desc);
