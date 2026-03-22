# LeaseLink

Property management platform connecting property managers with their tenants.

- **API** — NestJS REST API with DDD architecture, Prisma (PostgreSQL), Better Auth
- **Web** — Next.js 14 dashboard for property managers
- **Mobile** — Expo React Native app for tenants
- **Shared** — Types, enums, DTOs, and Zod validation schemas

## Monorepo Structure

```
apps/
├── api/          # @leaselink/api — NestJS backend
├── web/          # @leaselink/web — Next.js dashboard
└── mobile/       # @leaselink/mobile — Expo mobile app
packages/
└── shared/       # @leaselink/shared — Shared types & validation
scripts/
└── ralph.ts      # Automated sprint runner (Claude Agent SDK)
docs/
├── PRODUCT_SPEC.md
└── sprints/      # Sprint specs
```

## Getting Started

```bash
npm install           # Install all workspaces
npm run dev           # Start all apps
npm run dev:api       # Start API only
npm run dev:web       # Start web only
npm run dev:mobile    # Start mobile only
```

### API Setup

```bash
cd apps/api
cp .env.example .env.local    # Configure env vars
npm run db:migrate             # Run Prisma migrations
npm run dev                    # Start with hot reload
```

### Prerequisites

- Node.js 20+
- PostgreSQL
- Azure Blob Storage (or Azurite for local dev)

## Development

```bash
npm run build         # Build all apps
npm run test          # Run all tests
npm run lint          # Lint all apps
npm run format        # Format with Prettier
```

### Per-App Commands

| Command | API | Web | Mobile |
|---------|-----|-----|--------|
| Dev | `npm run dev` | `npm run dev` | `npx expo start` |
| Build | `npm run build` | `npm run build` | `npx expo build` |
| Test | `npm run test` | — | — |
| Type check | `npm run type-check` | `npm run type-check` | `npx tsc --noEmit` |

### Sprint Runner

Ralph is an automated sprint runner built with the Claude Agent SDK. He writes specs, builds features, runs tests, and opens PRs.

```bash
cd scripts
npm run ralph                              # Run all remaining sprints
npm run ralph:single                       # Run one sprint
npm run ralph -- --start-sprint=3          # Start from sprint 3
npm run ralph -- --max-sprints=2           # Limit to 2 sprints
```

## CI/CD

GitHub Actions (`.github/workflows/api-ci.yaml`):
- Lint + type-check
- Unit tests
- E2E tests (Postgres + Azurite service containers)
- Docker build + push to `ghcr.io/mattwilson02/leaselink-api`

Branch strategy: `dev` for sprint work, `main` for reviewed merges.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Full architecture overview (DDD, bounded contexts, data flow)
- [docs/AUDIT_ISSUES.md](docs/AUDIT_ISSUES.md) — Security & business logic audit with status tracking
- [docs/FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md) — Parking list of future improvements & nice-to-haves
- [apps/api/CLAUDE.md](apps/api/CLAUDE.md) — API-specific patterns and conventions
- [apps/mobile/CLAUDE.md](apps/mobile/CLAUDE.md) — Mobile app development guide
- [PRODUCT_SPEC.md](PRODUCT_SPEC.md) — Complete product specification
