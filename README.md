# ball knowers

Production-ready first version of a scalable sports-games site. The first live game is **College Football Knowers: All Teams Quiz**, using dataset `fbs-2026.1` with exactly 138 teams.

## Built

- Next.js App Router, React, TypeScript and Tailwind CSS.
- Versioned FBS dataset with validator and curated aliases.
- Reusable quiz engine for normalisation, alias matching, cascading recognition, timers, results and leaderboard ranking.
- Easy, Medium and Hard modes.
- Responsive conference grid with accessible mobile accordion behavior.
- Local fallback for attempts, history, profile drafts and local result storage.
- Supabase route handlers and migration for profiles, attempts, answer events, leaderboard entries, moderation flags and security events.
- Privacy, terms, profile and leaderboard pages.
- Vitest unit tests and Playwright/Axe E2E test files.

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/games/college-football/fbs-teams`.

## Verification Commands

```bash
pnpm validate:data
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Playwright tests require a browser that can launch in your environment:

```bash
PLAYWRIGHT_BROWSERS_PATH=.ms-playwright pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:a11y
```

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/202607130001_init.sql`.
3. Copy `.env.example` to `.env.local`.
4. Set:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ATTEMPT_SIGNING_SECRET=
RATE_LIMIT_SECRET=
```

5. Restart the app.

Without these variables, the game remains fully playable and clearly marks the public leaderboard as unavailable.

## Dataset Utilities

```bash
pnpm data:export
pnpm data:inspect outputs/fbs-2026.1.json
```

Published datasets are treated as immutable. For realignment changes, create a new dataset module and version rather than silently editing `fbs-2026.1`.

## Adding Another Game

1. Add a dataset module under `data/`.
2. Add a `GameConfig` with groups and difficulty settings.
3. Reuse the quiz engine modules in `lib/quiz`.
4. Create a route under `app/games/...`.
5. Add dataset and matcher tests for the new game’s collision cases.
