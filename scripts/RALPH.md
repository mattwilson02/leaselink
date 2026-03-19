# Ralph

Ralph is LeaseLink's autonomous sprint runner. You give him a product spec, he gives you a PR.

## What He Does

Ralph reads `PRODUCT_SPEC.md`, figures out what to build next, writes a detailed sprint spec, implements it across the entire monorepo, verifies everything works, and opens a PR — all without human intervention.

## How He Works

```
PRODUCT_SPEC.md
      │
      ▼
┌─────────────┐
│  Spec Writer │  ← Claude Opus — reads product spec + previous sprints,
│  (Phase 1)   │    writes a new sprint spec to docs/sprints/
└──────┬──────┘
       │
       ▼
┌──────────────┐
│   Backend    │  ← Claude Sonnet — implements shared types, API domain
│   Builder    │    entities, use cases, controllers, repos, unit tests
│  (Phase 2a)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Verification│  ← Automated gate: shared build → prisma generate →
│    Gate      │    format → type-check → unit tests → boot smoke test
│  (Phase 2b)  │    If this fails, fix agent retries up to 3x.
└──────┬───────┘    Frontend agents don't start until backend is green.
       │
       ▼
┌──────────────────────────────┐
│  Frontend Coordinator        │
│  (Phase 2c)                  │
│  ┌────────┐   ┌────────┐    │  ← Spawns web + mobile subagents
│  │  Web   │   │ Mobile │    │    in parallel. They share the
│  │ Agent  │   │ Agent  │    │    filesystem and see backend changes.
│  └────────┘   └────────┘    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────┐
│    Full      │  ← Everything again + E2E tests (real Postgres + Azurite)
│ Verification │    + web build + mobile type-check
│  (Phase 3)   │    Fix agent gets 3 more attempts if needed.
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Commit, PR, │  ← git add → commit → push → gh pr create → auto-merge
│    Merge     │
│  (Phase 4)   │
└──────────────┘
       │
       ▼
    Next sprint
```

## Model Allocation

| Agent | Model | Why |
|-------|-------|-----|
| Spec Writer | Opus | High-leverage decisions — what to build and why |
| Backend Builder | Sonnet | Execution — follows established patterns |
| Web Agent | Sonnet | Scoped to apps/web/ |
| Mobile Agent | Sonnet | Scoped to apps/mobile/ |
| Fix Agent | Sonnet | Reads errors, applies targeted fixes |

## Verification Checks

**Backend gate** (must pass before frontend starts):
1. `packages/shared` — TypeScript build
2. `apps/api` — Prisma generate, Biome format, type-check, unit tests
3. Boot smoke test — actually starts the compiled API, catches runtime module errors that `tsc --noEmit` misses

**Full verification** (after all agents finish):
4. E2E tests — real database, real blob storage
5. `apps/web` — Next.js build
6. `apps/mobile` — TypeScript type-check

## Usage

```bash
cd scripts

# Run all remaining sprints (2-11)
npm run ralph

# Run a single sprint
npm run ralph:single

# Start from a specific sprint
npm run ralph -- --start-sprint=3

# Run N sprints from a starting point
npm run ralph -- --start-sprint=3 --max-sprints=2
```

## Resilience

Ralph doesn't die when he runs out of context. Every agent call tracks its session ID, turn count, and cost. If an agent hits `maxTurns`:

1. Ralph logs a warning with turn count and spend so far
2. Captures the session ID from the interrupted run
3. Resumes the same session with a continuation prompt — full context preserved
4. Up to 3 resume attempts per agent before falling back to partial work
5. Verification gate catches anything the agent missed

This means a 200-turn backend builder that runs out of gas gets 3 more 200-turn windows to finish the job — 800 turns total before Ralph gives up and lets the fix agent clean up.

## Why "Ralph"

He works the night shift at the dark factory.
