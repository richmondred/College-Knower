create extension if not exists pgcrypto;

do $$ begin
  create type attempt_status as enum ('active', 'completed', 'expired', 'abandoned', 'invalid', 'flagged');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type moderation_state as enum ('visible', 'hidden', 'flagged');
exception when duplicate_object then null;
end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 32),
  city text check (city is null or char_length(city) <= 40),
  country_code char(2) not null,
  show_city boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quiz_datasets (
  quiz_id text not null,
  dataset_version text not null,
  season integer not null,
  title text not null,
  team_count integer not null,
  immutable boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (quiz_id, dataset_version)
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  anonymous_session_id text not null,
  quiz_id text not null,
  dataset_version text not null,
  difficulty text not null,
  started_at timestamptz not null,
  deadline_at timestamptz,
  finished_at timestamptz,
  score integer not null default 0,
  total integer not null,
  completed boolean not null default false,
  hint_count integer not null default 0,
  resumed boolean not null default false,
  eligible boolean not null default false,
  status attempt_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, quiz_id, dataset_version)
);

create table if not exists quiz_answer_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  team_id text not null,
  client_ts timestamptz not null,
  sequence integer not null,
  difficulty text not null,
  created_at timestamptz not null default now(),
  unique (attempt_id, team_id),
  unique (attempt_id, sequence)
);

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references quiz_attempts(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  quiz_id text not null,
  dataset_version text not null,
  difficulty text not null,
  score integer not null,
  total integer not null,
  completion_ms integer,
  completed boolean not null default false,
  verified boolean not null default false,
  moderation_state moderation_state not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moderation_flags (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  attempt_id uuid references quiz_attempts(id) on delete set null,
  leaderboard_entry_id uuid references leaderboard_entries(id) on delete set null,
  reason text not null,
  state moderation_state not null default 'flagged',
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists security_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id text,
  pseudonymous_ip_bucket text,
  event_type text not null,
  severity text not null default 'info',
  metadata jsonb not null default '{}',
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

drop view if exists public_leaderboard;

alter table if exists quiz_attempts
  alter column difficulty type text using difficulty::text;

alter table if exists quiz_answer_events
  alter column difficulty type text using difficulty::text;

alter table if exists leaderboard_entries
  alter column difficulty type text using difficulty::text;

drop type if exists quiz_difficulty;

insert into quiz_datasets (quiz_id, dataset_version, season, title, team_count)
values
  ('fbs-schools-2026', 'fbs-2026.1', 2026, 'Name Every Current FBS College Football Team', 138),
  ('cfb-past-champions', 'knowledge-2026.1', 2026, 'College Football Past Champions Quiz', 194),
  ('cfb-heisman-winners', 'knowledge-2026.1', 2026, 'Heisman Winners Quiz', 273),
  ('nfl-all-teams', 'knowledge-2026.1', 2026, 'NFL All Teams Quiz', 32),
  ('nfl-past-champions', 'knowledge-2026.1', 2026, 'Super Bowl Champions Quiz', 60),
  ('nfl-mvp', 'knowledge-2026.1', 2026, 'NFL MVP Quiz', 70),
  ('english-all-teams', 'knowledge-2026.1', 2026, 'English Football Teams Quiz', 747),
  ('english-past-champions', 'knowledge-2026.1', 2026, 'English Past Champions Quiz', 252),
  ('europe-all-teams', 'knowledge-2026.1', 2026, 'European Football Teams Quiz', 1210),
  ('world-all-clubs', 'knowledge-2026.1', 2026, 'World Football Clubs Quiz', 1954)
on conflict (quiz_id, dataset_version) do update
set
  title = excluded.title,
  team_count = excluded.team_count;

create index if not exists quiz_attempts_quiz_idx on quiz_attempts (quiz_id, dataset_version, difficulty);
create index if not exists quiz_attempts_status_idx on quiz_attempts (status, completed, score);
create index if not exists quiz_attempts_profile_idx on quiz_attempts (profile_id, created_at desc);
create index if not exists answer_events_attempt_idx on quiz_answer_events (attempt_id, sequence);
create index if not exists leaderboard_rank_idx on leaderboard_entries (
  quiz_id,
  dataset_version,
  difficulty,
  completed desc,
  score desc,
  completion_ms asc,
  created_at asc
) where verified = true and moderation_state = 'visible';
create index if not exists leaderboard_profile_best_idx on leaderboard_entries (profile_id, quiz_id, dataset_version, difficulty);
create index if not exists profiles_country_city_idx on profiles (country_code, city);
create index if not exists security_events_expiry_idx on security_events (expires_at);

alter table profiles enable row level security;
alter table quiz_datasets enable row level security;
alter table quiz_attempts enable row level security;
alter table quiz_answer_events enable row level security;
alter table leaderboard_entries enable row level security;
alter table moderation_flags enable row level security;
alter table security_events enable row level security;

drop policy if exists "Public can read quiz datasets" on quiz_datasets;
create policy "Public can read quiz datasets" on quiz_datasets
  for select using (true);

drop policy if exists "Public can read public profile fields" on profiles;
create policy "Public can read public profile fields" on profiles
  for select using (true);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can delete their own profile" on profiles;
create policy "Users can delete their own profile" on profiles
  for delete using (auth.uid() = id);

drop policy if exists "Public can read visible leaderboard entries" on leaderboard_entries;
create policy "Public can read visible leaderboard entries" on leaderboard_entries
  for select using (verified = true and moderation_state = 'visible');

drop policy if exists "Users can read own attempts" on quiz_attempts;
create policy "Users can read own attempts" on quiz_attempts
  for select using (profile_id = auth.uid());

drop policy if exists "Users can read own answer events" on quiz_answer_events;
create policy "Users can read own answer events" on quiz_answer_events
  for select using (
    exists (
      select 1 from quiz_attempts qa
      where qa.id = quiz_answer_events.attempt_id
      and qa.profile_id = auth.uid()
    )
  );

drop policy if exists "No direct leaderboard writes" on leaderboard_entries;
create policy "No direct leaderboard writes" on leaderboard_entries
  for insert with check (false);

drop policy if exists "No direct moderation reads" on moderation_flags;
create policy "No direct moderation reads" on moderation_flags
  for select using (false);

drop policy if exists "No direct security reads" on security_events;
create policy "No direct security reads" on security_events
  for select using (false);

create or replace view public_leaderboard as
select distinct on (leaderboard_entries.profile_id, leaderboard_entries.quiz_id, leaderboard_entries.dataset_version, leaderboard_entries.difficulty)
  leaderboard_entries.id,
  leaderboard_entries.attempt_id,
  leaderboard_entries.profile_id,
  leaderboard_entries.quiz_id,
  leaderboard_entries.dataset_version,
  leaderboard_entries.difficulty,
  profiles.display_name,
  case when profiles.show_city then profiles.city else null end as city,
  profiles.show_city,
  profiles.country_code,
  leaderboard_entries.score,
  leaderboard_entries.total,
  leaderboard_entries.completion_ms,
  leaderboard_entries.completed,
  leaderboard_entries.verified,
  leaderboard_entries.moderation_state,
  leaderboard_entries.created_at,
  leaderboard_entries.updated_at
from leaderboard_entries
join profiles on profiles.id = leaderboard_entries.profile_id
where leaderboard_entries.verified = true
  and leaderboard_entries.moderation_state = 'visible'
order by
  leaderboard_entries.profile_id,
  leaderboard_entries.quiz_id,
  leaderboard_entries.dataset_version,
  leaderboard_entries.difficulty,
  leaderboard_entries.completed desc,
  leaderboard_entries.score desc,
  leaderboard_entries.completion_ms asc nulls last,
  leaderboard_entries.created_at asc;
