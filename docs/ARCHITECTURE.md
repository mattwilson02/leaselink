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
       ┌──────────┼──────────┬──────────┐
       ▼          ▼          ▼          ▼
  PostgreSQL   Azure Blob  Twilio    Stripe
              Storage      /SMTP
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | NestJS, Prisma, Better Auth, Vitest |
| Web | Next.js 14, React, shadcn/ui, Tailwind |
| Mobile | Expo SDK 53, React Native 0.79, Expo Router |
| Shared | TypeScript, Zod |
| Database | PostgreSQL |
| Storage | Azure Blob Storage (Azurite for local dev) |
| Auth | Better Auth (email/password, phone OTP, email OTP, Microsoft OAuth, 2FA) |
| Payments | Stripe (checkout sessions, webhooks) |
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
│   ├── authentication/            # Login, sessions, 2FA
│   ├── financial-management/      # Client (tenant) + Employee (manager)
│   ├── property-management/       # Properties, photos, status transitions
│   ├── lease-management/          # Leases, renewals, status lifecycle
│   ├── payment/                   # Payments, Stripe checkout, overdue detection
│   ├── maintenance/               # Maintenance requests, vendor assignment
│   ├── expense-management/        # Expenses, receipts, CSV export
│   ├── notification/              # Notifications, push, action tracking
│   ├── document/                  # Document upload, folders, requests
│   ├── signature/                 # E-signatures, signature image storage
│   └── audit/                     # Audit logs
│
└── infra/             # Framework + external services
    ├── auth/           # Better Auth, guards, 2FA
    ├── database/       # Prisma repos, mappers
    ├── http/           # Controllers, DTOs, presenters, pipes
    ├── env/            # Zod-validated config
    ├── blob-storage/   # Azure Blob
    ├── stripe/         # Stripe service, webhook handling
    ├── scheduler/      # Cron jobs (payments, leases, reminders)
    └── push-notifications/
```

### Domain Bounded Contexts

| Context | Entities | Key Features |
|---------|----------|-------------|
| **authentication** | Session, TwoFactorAuth | Email/password, OTP, Microsoft OAuth, TOTP 2FA |
| **financial-management** | Client, Employee | Tenant/manager profiles, onboarding, device management |
| **property-management** | Property | CRUD, photos, status transitions (VACANT→LISTED→OCCUPIED) |
| **lease-management** | Lease | Create, renew, terminate, status lifecycle with validation |
| **payment** | Payment | Auto-generation from lease, Stripe checkout, overdue marking |
| **maintenance** | MaintenanceRequest | Tenant requests, manager assignment, vendor tracking, status flow |
| **expense-management** | Expense, Vendor | Property expenses, receipt upload, CSV export |
| **notification** | Notification | Action/info types, push notifications, archive, deep linking |
| **document** | Document, DocumentRequest | Upload to folders, download with signed URLs, requests |
| **signature** | Signature | E-signatures on lease agreements, signature image storage |
| **audit** | AuditLog | Action tracking across all domains |

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
| **Status transitions** | Shared constants define valid transitions, validated in use cases |
| **Display labels** | `@leaselink/shared` exports label maps for all enums |

### API Response Contract

All endpoints follow a standardized response format:

```typescript
// List endpoints
{ data: Resource[], meta: { page, pageSize, totalCount, totalPages } }

// Single resource endpoints
{ data: Resource }
```

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

## Web App Architecture

Next.js 14 app router with shadcn/ui components:

```
apps/web/src/
├── app/(dashboard)/       # Authenticated manager pages
│   ├── properties/        # Property CRUD
│   ├── leases/            # Lease management
│   ├── tenants/           # Tenant management
│   ├── payments/          # Payment tracking
│   ├── maintenance/       # Maintenance requests
│   ├── expenses/          # Expense management
│   ├── vendors/           # Vendor management
│   ├── documents/         # Document management
│   ├── audit-log/         # Audit trail
│   └── settings/          # Profile, security
├── components/            # Reusable UI components
├── hooks/                 # TanStack Query hooks per domain
└── lib/                   # API client, auth, utilities
```

## Mobile App Architecture

Expo Router with custom design system:

```
apps/mobile/
├── app/                   # File-based routing
│   ├── (main)/            # Authenticated tenant screens
│   │   ├── home/          # Dashboard, lease detail
│   │   ├── payments/      # Payment list, detail, checkout
│   │   ├── maintenance/   # Request list, create, detail
│   │   ├── documents/     # Document list, detail, sign
│   │   └── upload-document/ # Document upload flow
│   ├── (onboarding)/      # First-time setup
│   ├── (new-device)/      # Device verification
│   └── (forgot-password)/ # Password reset
└── src/
    ├── components/        # Feature-organized components
    ├── design-system/     # Custom component library
    ├── hooks/             # Data fetching, auth, biometrics
    ├── gen/               # Auto-generated API client (Kubb)
    ├── i18n/              # Translations (en, de, es, fr)
    └── services/          # API client, auth config
```

## Shared Package

`@leaselink/shared` provides the single source of truth:

- **Enums** — All status types, categories, roles
- **Display labels** — Human-readable labels for all enums
- **Status transitions** — Valid state machine transitions
- **Validation schemas** — Zod schemas shared between API and clients
- **Types/DTOs** — Shared TypeScript interfaces
- **Constants** — Grace periods, defaults, error messages

## Naming Convention

The Prisma schema uses `Employee` (manager) and `Client` (tenant). The product spec and shared package use `PropertyManager` and `Tenant`. Mappers handle the translation — Prisma keeps the original table names.

## Auth System

- Better Auth with bearer tokens
- Sign-in methods: email/password, phone OTP (Twilio), email OTP (SMTP), Microsoft OAuth
- Two-factor authentication: TOTP with backup codes
- `EnhancedAuthGuard` is global — populates `request.user` with full context
- `EmployeeOnlyGuard` restricts manager-only routes
- Mobile: biometric auth via SecureStore + LocalAuthentication
- Device management: new device verification flow
- Test helpers: `JwtFactory` creates test tokens, `isTestEmail()`/`isTestPhone()` bypass real sends

## Scheduled Tasks

Cron jobs in `infra/scheduler/`:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Activate upcoming payments | Daily | Move UPCOMING → PENDING when due date approaches |
| Mark overdue payments | Daily | Move PENDING → OVERDUE after grace period |
| Send rent reminders | Daily | Notify tenants 3 days before due date |
| Activate pending leases | Daily | Move PENDING → ACTIVE when start date arrives |

## Sprint Development

Sprints are driven by `PRODUCT_SPEC.md` and implemented via Ralph (`scripts/ralph.ts`):

1. **Spec writer** reads the product spec + previous sprints, writes a detailed spec to `docs/sprints/`
2. **Builder agent** implements backend/shared first, then delegates web/mobile to subagents
3. **Verification** runs format, type-check, tests, and builds across all apps
4. **Fix agent** retries up to 3 times if verification fails
5. **PR** is opened against `dev` and auto-merged

Sprint specs live in `docs/sprints/`. Each spec defines tasks by agent (backend, web, mobile) with file paths, business rules, acceptance criteria, and test cases.

19 sprints completed covering: foundation, property management, leases, maintenance, payments, dashboard, documents, scheduled tasks, E2E tests, human actions, expense/vendor/audit, web pages, e-signatures, CSV export, 2FA, business logic integrity, API contract standardization, and data integrity polish.
