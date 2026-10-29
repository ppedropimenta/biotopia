-- A dated picture of a tank. The file itself is not in the database: storage_key names it in the photo storage
-- (see PhotoStorage.java). size_bytes is the size of the stored file, the number the user's quota counts.
-- Deleting a tank deletes these rows but not the files: whatever deletes a tank must remove them too.
create table tank_photos (
    id          uuid primary key,
    tank_id     uuid          not null references tanks (id) on delete cascade,
    taken_at    timestamptz   not null,
    note        text,
    storage_key text          not null,
    size_bytes  bigint        not null,
    width       integer       not null,
    height      integer       not null,
    created_at  timestamptz   not null
);

create index tank_photos_tank_taken_at on tank_photos (tank_id, taken_at desc);
