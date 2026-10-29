-- The Demo Tank is an ordinary tank that anyone may read. At most one tank in the system can be flagged, and the
-- database enforces it. The flag is set by the operator (see DemoTankSetup), never by a user.
alter table tanks add column demo boolean not null default false;

create unique index tanks_one_demo on tanks (demo) where demo;
