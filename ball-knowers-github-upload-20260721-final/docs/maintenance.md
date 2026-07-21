# Maintenance Notes

## Updating FBS Data

- Do not mutate a published dataset in place after release.
- Create a new version such as `fbs-2026.2` or `fbs-2027.1`.
- Copy the previous module, update team conference fields, aliases and source notes, then update the game config.
- Run `pnpm validate:data`, `pnpm test` and `pnpm build`.

## Adding Aliases

- Add aliases inside the dataset record only.
- Keep broad aliases in `easyAliases`, standard aliases in `mediumAliases`, and strict entries in `hardAnswers`.
- Do not add ambiguous aliases such as `Miami` or `USC` for South Carolina.
- Run the validator; it fails on alias collisions.

## Moving Teams Between Conferences

- Change only the new dataset version.
- Update `expectedConferenceTotals`.
- Add a `sourceNotes` entry for realignment-sensitive moves.
- Never infer current conference from a stale table header.

## Adding A Conference

- Add the conference key to `ConferenceId`.
- Add conference metadata with `expectedTeams`.
- Update tests and any stable share-grid ordering.

## Recalculating Leaderboard Eligibility

- Keep raw attempts private.
- Recompute from `quiz_attempts` and `quiz_answer_events`.
- Insert or update `leaderboard_entries` only after server-side validation.
- Flag suspicious records rather than deleting them silently.

## Moderation

- Public fields are `display_name`, `city`, `country_code` and leaderboard result fields.
- Use `moderation_flags` to record automated or manual reasons.
- Hide abusive entries by setting `leaderboard_entries.moderation_state = 'hidden'`.
- Remove abusive names by editing `profiles.display_name` through a protected admin process.
- Do not expose `security_events` publicly.

## Import And Export

- `pnpm data:export` writes the active dataset JSON to `outputs/fbs-2026.1.json`.
- `pnpm data:inspect path/to/file.json` summarizes a dataset file before manual review.
- Importing a changed dataset should become a new TypeScript dataset module, not a mutation of a published one.
