drop view if exists public_leaderboard;

alter table quiz_attempts
  alter column difficulty type text using difficulty::text;

alter table quiz_answer_events
  alter column difficulty type text using difficulty::text;

alter table leaderboard_entries
  alter column difficulty type text using difficulty::text;

drop type if exists quiz_difficulty;

insert into quiz_datasets (quiz_id, dataset_version, season, title, team_count)
values
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
