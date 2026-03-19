# Architecture

## System Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Mobile App │     │    Web App   │     │   Ralph (CI)    │
│  (Expo/RN)  │     │  (Next.js)  │     │  Agent SDK      │
│  Tenants    │     │  Managers   │     │  Sprint runner  │
└──────┬──────┘     └──────┬──────┘     └────────┬────────┘
       │                   │                     │
       └───────────┬───────┘                     │
                   ▼                             │
          ┌────────────────┐                     │
          │   REST API     │◄────────────────────┘
          │   (NestJS)     │
          └───────┬────────┘
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
  PostgreSQL   Azure Blob  Twilio/SMTP
              Storage
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | NestJS, Prisma, Better Auth, Vitest |
| Web | Next.js 14, React, shadcn/ui, Tailwind |
| Mobile | Expo, React Native, Expo Router |
| Shared | TypeScript, Zod |
| Database | PostgreSQL |
| Storage | Azure Blob Storage |
| Auth | Better Auth (email/password, phone OTP, email OTP, Microsoft OAuth) |
| Push | Expo Push Notifications |
| CI | GitHub Actions, Docker, GHCR |
| Monorepo | Turborepo, npm workspaces |

## API Architecture (DDD)

The API follows Domain-Driven Design with clean architecture layers:

```
src/
├── core/              # Base abstractions
│   ├── Entity          # Base entity class
│   ├── AggregateRoot   # Entity with domain events
│   ├── ValueObject     # Immutable value types
│   ├── UniqueEntityId  # UUID wrapper
│   └── Either<L, R>    # Functional error handling
│
├── domain/            # Business logic (no framework deps)
│   ├── authentication/
│   ├── financial-management/    # Client (tenant) + Employee (manager)
│   ├── property-management/     # Properties
│   ├── notification/
│   └── document/
│
└── infra/             # Framework + external services
    ├── auth/           # Better Auth, guards
    ├── database/       # Prisma repos, mappers
    ├── http/           # Controllers, DTOs, presenters
    ├── env/            # Zod-validated config
    ├── blob-storage/   # Azure Blob
    └── push-notifications/
```

### Domain Layer Pattern

Each bounded context follows the same structure:

```
domain/<context>/
├── application/
│   ├── repositories/      # Abstract interfaces
│   └── use-cases/         # Business logic
│       └── errors/        # Domain error classes
└── enterprise/
    ├── entities/           # Domain entities
    └── value-objects/      # Immutable value types
```

### Key Patterns

| Pattern | How It Works |
|---------|-------------|
| **Error handling** | Use cases return `Either<Error, Result>` — never throw |
| **Entity IDs** | `UniqueEntityId` wraps UUID strings |
| **Repositories** | Abstract class in domain, Prisma implementation in infra |
| **Mappers** | `toDomain()` / `toPrisma()` static methods bridge layers |
| **Controllers** | One per endpoint, each in its own folder |
| **Validation** | Zod schemas with `ZodValidationPipe` |
| **Auth** | Global `EnhancedAuthGuard`, `EmployeeOnlyGuard` for manager routes |
| **Testing** | Unit tests with in-memory repos, E2E with real DB |

### Data Flow

```
HTTP Request
  → Controller (validates DTO with Zod)
    → Use Case (business logic, returns Either)
      → Repository (abstract interface)
        → Prisma Repository (implementation)
          → Mapper.toDomain() / .toPrisma()
            → PostgreSQL

HTTP Response
  ← Controller (maps Either to HTTP status)
    ← Presenter (formats entity for API response)
```

## Naming Convention

The Prisma schema uses `Employee` (manager) and `Client` (tenant). The product spec and shared package use `PropertyManager` and `Tenant`. Mappers handle the translation — Prisma keeps the original table names.

## Auth System

- Better Auth with bearer tokens
- Sign-in methods: email/password, phone OTP (Twilio), email OTP (SMTP), Microsoft OAuth
- `EnhancedAuthGuard` is global — populates `request.user` with full context
- `EmployeeOnlyGuard` restricts manager-only routes
- Test helpers: `JwtFactory` creates test tokens, `isTestEmail()`/`isTestPhone()` bypass real sends

## Sprint Development

Sprints are driven by `PRODUCT_SPEC.md` and implemented via ralph (`scripts/ralph.ts`):

1. **Spec writer** reads the product spec + previous sprints, writes a detailed spec to `docs/sprints/`
2. **Builder agent** implements backend/shared first, then delegates web/mobile to subagents
3. **Verification** runs format, type-check, tests, and builds across all apps
4. **Fix agent** retries up to 3 times if verification fails
5. **PR** is opened against `dev` and auto-merged

Sprint specs live in `docs/sprints/`. Each spec defines tasks by agent (backend, web, mobile) with file paths, business rules, acceptance criteria, and test cases.
