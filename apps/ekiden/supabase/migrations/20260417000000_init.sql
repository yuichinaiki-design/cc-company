-- 駅伝盛り上げアプリ: initial schema
create extension if not exists pgcrypto;

create table if not exists races (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists runners (
  race_id uuid not null references races(id) on delete cascade,
  bib int not null,
  name text,
  team text,
  primary key (race_id, bib)
);

create table if not exists sightings (
  id bigserial primary key,
  race_id uuid not null references races(id) on delete cascade,
  bib int not null,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  observed_at timestamptz not null default now(),
  device_id uuid not null,
  foreign key (race_id, bib) references runners(race_id, bib) on delete cascade
);

create index if not exists sightings_race_bib_time_idx
  on sightings (race_id, bib, observed_at desc);
create index if not exists sightings_race_time_idx
  on sightings (race_id, observed_at desc);

alter publication supabase_realtime add table sightings;

alter table races     enable row level security;
alter table runners   enable row level security;
alter table sightings enable row level security;

create policy races_read     on races     for select using (true);
create policy runners_read   on runners   for select using (true);
create policy sightings_read on sightings for select using (true);

create policy sightings_insert on sightings for insert with check (true);
create policy runners_insert   on runners   for insert with check (true);
create policy races_insert     on races     for insert with check (true);
