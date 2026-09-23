# Jelly Rush Business Game

A browser-based business simulation game where you manage a small jelly dessert business. You start with Rp3,000,000 in cash, a 5-person team, and a production rhythm of 25 cups × 2 per week (~200 cups/month). Over 5 levels you face real business dilemmas — big orders, supplier failures, demand spikes — and every decision moves your cash, capacity, inventory, and reputation.

Built as a case-study trainer for the real business "Bolegi" (Rp15,000/cup pricing, real order sizes of 50/150/300 cups).

## Table of Contents

- [About the Game](#about-the-game)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Commands](#available-commands)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [How the Game Works](#how-the-game-works)
- [Where Things Live](#where-things-live)
- [Deployment](#deployment)
- [Gotchas](#gotchas)

## About the Game

The player becomes the manager of a jelly business and plays through 5 levels, each a business scenario:

| Level | Scenario | Order size |
|-------|----------|-----------|
| 1 | Opening order from Toko Rasa | 50 cups (¼ of monthly production) |
| 2 | Campus festival bulk order | 150 cups (75% of monthly production) |
| 3 | Supplier delays | Production schedule at risk |
| 4 | Market demand spike (+40%) | ~280 cups demand vs 200 capacity |
| 5 | National distributor order | 300 cups (1.5× monthly production) |

Each level has 3 phases:

1. **Brief** — read the situation, mission, and tip
2. **Decide** — pick one of 2–4 options and write a concrete action step
3. **Result** — see the consequences: cash change, challenge outcome, reward badge, a comparison against the ideal choice (with a % score), and a cheeky roast from the jelly mascot

The game ends with a trophy (4 tiers based on how many ideal choices you made), a rank, your final score, and a shareable summary.

**Game flow:** `welcome → profile → briefing → game (5 rounds) → final`

The game runs **entirely client-side** — no API calls, no save/load. The API server and DB schema in this repo are scaffolding for future features (e.g., saving scores).

## Tech Stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React 19.1 + Vite 7, Tailwind CSS v4, wouter (routing), TanStack Query, shadcn/ui (Radix primitives), lucide-react icons
- **Backend:** Express 5 (scaffolded, health check only), pino logging
- **Database:** PostgreSQL + Drizzle ORM (schema not yet defined)
- **Validation:** Zod
- **API codegen:** Orval (generates React Query hooks + Zod schemas from OpenAPI spec)
- **Build:** esbuild (API), Vite (frontend)
- **Deploy:** Vercel

## Getting Started

### Prerequisites

- **Node.js 24**
- **pnpm 10.12.4** (enforced — the `preinstall` script blocks npm/yarn)
- **PostgreSQL** (only needed if you use the DB)

### Install

```bash
pnpm install
```

### Run the game

```bash
pnpm dev
```

This starts the Jelly Rush frontend at `http://localhost:5173` (or `$PORT` if set).

### Run the API server

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

The server exposes `GET /api/healthz` (health check) and `GET /` (service info).

> **Windows note:** the `dev` script uses `export NODE_ENV=development` (bash syntax). Run it through Git Bash / WSL, or call `pnpm run build && PORT=8080 pnpm run start` manually from `artifacts/api-server`.

### Push DB schema changes

```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname" pnpm --filter @workspace/db push
```

### Regenerate API hooks and Zod schemas

```bash
pnpm --filter @workspace/api-spec run codegen
```

Run this after editing `lib/api-spec/openapi.yaml`.

## Available Commands

Run from the repo root:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the game frontend (Vite dev server) |
| `pnpm build` | Typecheck all packages, then build everything |
| `pnpm typecheck` | Full typecheck across all packages |
| `pnpm typecheck:libs` | Typecheck only the `lib/*` packages |
| `pnpm --filter @workspace/api-server run dev` | Start the API server (requires `PORT`, e.g. `8080`) |
| `pnpm --filter @workspace/db push` | Push DB schema to Postgres (requires `DATABASE_URL`) |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client + Zod schemas from OpenAPI |
| `pnpm --filter @workspace/mockup-sandbox dev` | Start the component preview server (requires `PORT=8081` + `BASE_PATH=/__mockup`) |

## Environment Variables

| Variable | Used by | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | api-server, mockup-sandbox, jelly-rush | api-server: yes (use `8080`); jelly-rush: no (default `5173`); mockup-sandbox: yes (use `8081`) | HTTP port |
| `DATABASE_URL` | lib/db (drizzle) | Yes, for DB operations | Postgres connection string |
| `BASE_PATH` | mockup-sandbox | Yes (use `/__mockup`) | Base URL path for the preview server |
| `BASE_PATH` | jelly-rush | No (default `/`) | Base URL path for the frontend |
| `NODE_ENV` | api-server | Set by `dev` script | `development` enables build-before-start |

## Project Structure

```
/
├── artifacts/                  # Deployable apps
│   ├── jelly-rush/             # ⭐ The game (React + Vite)
│   │   ├── src/App.tsx         #    All game logic + content lives here
│   │   ├── src/index.css       #    Theme + design tokens
│   │   ├── src/components/ui/  #    shadcn/ui components
│   │   └── vite.config.ts
│   ├── api-server/             # Express 5 API (scaffolded)
│   │   ├── src/routes/         #    Route handlers (mounted at /api)
│   │   ├── src/app.ts          #    Express app setup
│   │   └── build.mjs           #    esbuild bundle script
│   └── mockup-sandbox/         # Component preview server for design canvas
│
├── lib/                        # Shared libraries
│   ├── db/                     # Drizzle ORM + Postgres client
│   │   ├── src/schema/index.ts #    DB schema source of truth (currently empty)
│   │   └── drizzle.config.ts
│   ├── api-spec/               # OpenAPI spec + Orval config
│   │   ├── openapi.yaml        #    API contract source of truth
│   │   └── orval.config.ts
│   ├── api-client-react/       # Generated React Query hooks (do not edit)
│   └── api-zod/                # Generated Zod schemas (do not edit)
│
├── scripts/                    # Utility scripts (post-merge hook, etc.)
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace packages + dependency catalog
├── tsconfig.json               # Project references for lib/* packages
└── vercel.json                 # Vercel deployment config
```

## How the Game Works

All game logic is in `artifacts/jelly-rush/src/App.tsx`. Key data structures:

### Game state

```ts
type Phase = 'welcome' | 'profile' | 'briefing' | 'game' | 'final';
type Round = 1 | 2 | 3 | 4 | 5;
type Step = 'brief' | 'decide' | 'result';
```

The `Home` component manages phase transitions. `GameScreen` manages rounds and steps within the game.

### Content tables (edit these to change the game)

| Constant | What it controls |
|----------|-----------------|
| `INITIAL` | Starting cash, profit, reputation, capacity, inventory |
| `roundInfo` | Level titles, subtitles, order descriptions |
| `levelStory` | Brief text per level (greeting, situation, task, tip) |
| `optionsByRound` | The decision options per level (cost, profit, capacity, inventory, reputation deltas) |
| `challenges` | Challenge title + description per level |
| `bestChoice` | The "ideal" option per level + explanation + trap warning |
| `roast` (in `GameScreen`) | Mascot roast lines per option |

### Scoring

```ts
// Per-decision value: net cash + reputation weight + challenge bonus
decisionValue = (profit - cost) + reputation * 15000 + (challengeSuccess ? 90000 : 0)

// How close to ideal (0-100%)
idealPct = decisionValue(your choice) / decisionValue(ideal choice) * 100

// Final score (in GameScreen + FinalScreen)
score = profit/100000 + reputation*2 + capacity/10 + inventory/5 + bestStreak*12 + rewards*8
```

### Adding a new level

1. Extend the `Round` type to include `6`
2. Add entries to `roundInfo`, `levelStory`, `optionsByRound`, `challenges`, `bestChoice`
3. Add challenge outcome logic in `evaluateChallenge`
4. Add roast lines in the `roast` map inside `GameScreen`
5. Update the `LevelMap` component's level array (`[1, 2, 3, 4, 5]`)

### Adding a new option to an existing level

Add an `Option` object to the relevant array in `optionsByRound`. Required fields: `id`, `title`, `eyebrow`, `description`, `cost`, `profit`, `capacity`, `inventory`, `reputation`, `rationale`, `icon`, `tone`. Optionally add a roast line and update `bestChoice` if it changes the ideal path.

## Where Things Live

| What | File |
|------|------|
| DB schema (source of truth) | `lib/db/src/schema/index.ts` |
| API contract (source of truth) | `lib/api-spec/openapi.yaml` |
| Game content + logic | `artifacts/jelly-rush/src/App.tsx` |
| Theme / design tokens | `artifacts/jelly-rush/src/index.css` |
| shadcn/ui components | `artifacts/jelly-rush/src/components/ui/` |
| API routes | `artifacts/api-server/src/routes/` |
| Generated React Query hooks | `lib/api-client-react/src/generated/` (do not edit) |
| Generated Zod schemas | `lib/api-zod/src/generated/` (do not edit) |
| Dependency version catalog | `pnpm-workspace.yaml` → `catalog:` |
| TypeScript project references | `tsconfig.json` |

## Deployment

Deployed on **Vercel** (configured in `vercel.json`):

- **Framework:** Vite
- **Install:** `pnpm install --frozen-lockfile`
- **Build:** `pnpm --filter @workspace/jelly-rush build`
- **Output:** `artifacts/jelly-rush/dist/public`
- **SPA rewrites:** all routes → `/index.html`

## Gotchas

- **pnpm is mandatory.** The `preinstall` script deletes `package-lock.json`/`yarn.lock` and exits if you're not using pnpm.
- **React is pinned to 19.1.0** (required by Expo in the catalog). Don't bump it casually.
- **Dependency versions live in `pnpm-workspace.yaml` → `catalog:`.** Packages reference versions as `"catalog:"`. To change a version, edit the catalog, not individual `package.json` files.
- **`minimumReleaseAge: 1440`** in `pnpm-workspace.yaml` — pnpm won't install packages published less than 24 hours ago (supply-chain defense). Don't remove it.
- **Never hand-edit generated files** in `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`. Run `pnpm --filter @workspace/api-spec run codegen` instead.
- **The OpenAPI title must stay `Api`** — import paths in the generated code depend on it.
- **API server `dev` script uses bash syntax** (`export`). On Windows, use Git Bash/WSL or run `build` + `start` manually.
- **Replit leftovers in code are harmless.** `vite.config.ts` still imports `@replit/vite-plugin-runtime-error-modal`, and cartographer/dev-banner only activate when `REPL_ID` is set — outside Replit they never load. Safe to remove later if you want.
- **esbuild is pinned to 0.28.2** and **js-yaml to 4.3.2** via `overrides` in `pnpm-workspace.yaml` (security fixes for transitive deps). The `overrides` section also strips platform-specific binaries for non-Linux architectures — this is intentional for smaller installs.
- **DB schema is currently empty.** `lib/db/src/schema/index.ts` only has `export {}`. Add tables there and run `pnpm --filter @workspace/db push`.
- **The game has no backend persistence.** Progress is lost on page refresh. The API server exists as scaffolding for future save/load features.

## License

MIT
