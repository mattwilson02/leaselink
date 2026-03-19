# CLAUDE.md — LeaseLink API

## Overview

NestJS REST API with Domain-Driven Design architecture, Prisma ORM (PostgreSQL), and Better Auth for authentication. Part of a Turborepo monorepo (`@leaselink/api`).

## Architecture

### DDD Layers

```
src/
├── core/           # Base classes: Entity, AggregateRoot, ValueObject, UniqueEntityId, Either
├── domain/         # Business logic by bounded context
│   ├── authentication/
│   ├── financial-management/   # Client (tenant) + Employee (manager) management
│   ├── notification/
│   └── document/
└── infra/          # Framework + infrastructure
    ├── auth/       # Better Auth integration, guards
    ├── database/   # Prisma repos, mappers
    ├── http/       # Controllers, DTOs, presenters, pipes
    ├── env/        # Env validation (Zod)
    ├── blob-storage/   # Azure Blob Storage
    └── push-notifications/  # Expo push
```

### Domain Layer Pattern

Each bounded context follows:
```
domain/<context>/
├── application/
│   ├── repositories/   # Abstract interfaces (abstract class)
│   └── use-cases/      # Business logic + spec files
│       └── errors/     # Domain-specific error classes
└── enterprise/
    ├── entities/       # Domain entities extending Entity/AggregateRoot
    └── value-objects/  # Immutable value objects
```

### Key Conventions

| Pattern | Implementation |
|---------|---------------|
| Error handling | `Either<L, R>` — use cases return `left(error)` or `right(result)`, never throw |
| Entity IDs | `UniqueEntityId` wrapper around UUID strings |
| Repositories | Abstract class in `domain/`, Prisma implementation in `infra/database/` |
| Mappers | `toDomain()` and `toPrisma()` static methods converting between layers |
| Controllers | One per endpoint, each in its own folder: `controllers/<name>/<name>.controller.ts` |
| Validation | Zod schemas with `ZodValidationPipe` |
| Auth | Better Auth + custom `EnhancedAuthGuard` (global), `EmployeeOnlyGuard` for manager routes |
| Testing | Unit tests use in-memory repos, E2E tests use real DB via `PrismaService` |

## Adding a New Feature

### 1. Domain Entity (`domain/<context>/enterprise/entities/`)
```typescript
export class MyEntity extends Entity<MyEntityProps> {
  get field() { return this.props.field }
  static create(props: Optional<MyEntityProps, 'createdAt'>, id?: UniqueEntityId) {
    return new MyEntity({ ...props, createdAt: props.createdAt ?? new Date() }, id)
  }
}
```

### 2. Repository Interface (`domain/<context>/application/repositories/`)
```typescript
export abstract class MyEntityRepository {
  abstract create(entity: MyEntity): Promise<void>
  abstract findById(id: string): Promise<MyEntity | null>
}
```

### 3. Use Case (`domain/<context>/application/use-cases/`)
```typescript
@Injectable()
export class CreateMyEntityUseCase {
  constructor(private repo: MyEntityRepository) {}
  async execute(req: Request): Promise<Either<SomeError, { entity: MyEntity }>> {
    // business logic
    return right({ entity })
  }
}
```

### 4. Prisma Mapper + Repository (`infra/database/prisma/`)
- Mapper: `mappers/prisma-my-entity-mapper.ts` with `toDomain()` and `toPrisma()`
- Repo: `repositories/prisma-my-entity-repository.ts` implementing the abstract class

### 5. Controller (`infra/http/controllers/<name>/`)
- Controller with Swagger decorators, Zod body validation, `Either` response handling
- Error map: domain error class name → HTTP exception

### 6. Module Wiring
- Register repo binding in `infra/database/database.module.ts`
- Register controller + use case in `infra/http/http.module.ts`

### 7. Tests
- Unit test: `use-cases/<name>.spec.ts` with in-memory repos
- E2E test: `controllers/<name>/<name>.e2e-spec.ts` with `JwtFactory` for auth

## Commands

```bash
npm run dev              # Start with hot reload (.env.local)
npm run test             # Unit tests (vitest)
npm run test:e2e         # E2E tests (needs DB + Azurite)
npm run format           # Biome format
npm run type-check       # tsc --noEmit
npm run validate-all     # format + type-check + build + test + e2e
npm run db:migrate       # Prisma migrate dev
npm run db:reset         # Reset DB + reseed
npm run db:studio        # Prisma Studio GUI
```

## Auth System

- Better Auth with bearer tokens, email/password, phone OTP (Twilio), email OTP (SMTP), Microsoft OAuth
- `EnhancedAuthGuard` is global — populates `request.user` with full context
- `EmployeeOnlyGuard` restricts manager-only routes
- Test helpers: `JwtFactory` creates test tokens, `isTestEmail()`/`isTestPhone()` bypass real sends
- Test OTP: hardcoded when email matches `test(+*)?@example.com`

## Test Factories

Located in `test/factories/`:
- `make-client.ts` — Client entity with faker data
- `make-valid-jwt-factory.ts` — `JwtFactory` injectable for E2E auth
- In-memory repos in `test/repositories/` for unit tests

## Environment

Required env vars defined in `src/infra/env/env.ts` (Zod validated):
- `DATABASE_URL`, `BLOB_STORAGE_*`, `TWILIO_*`, `SMTP_*`, `AZURE_AD_*`, `APP_NAME`

## Naming Note

The Prisma schema uses `Employee` (manager) and `Client` (tenant). The product spec uses `PropertyManager` and `Tenant`. Shared types in `@leaselink/shared` use the spec naming. Prisma keeps the original table names — mappers handle the translation.
