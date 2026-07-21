drop view if exists public_leaderboard;

drop table if exists security_events cascade;
drop table if exists moderation_flags cascade;
drop table if exists leaderboard_entries cascade;
drop table if exists quiz_answer_events cascade;
drop table if exists quiz_attempts cascade;
drop table if exists quiz_datasets cascade;
drop table if exists profiles cascade;

drop type if exists quiz_difficulty cascade;
drop type if exists attempt_status cascade;
drop type if exists moderation_state cascade;
