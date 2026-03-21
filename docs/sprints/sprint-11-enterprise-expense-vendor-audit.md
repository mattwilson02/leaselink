# Sprint 11: Enterprise Features — Expense Tracking, Vendor Management & Audit Logs

## Overview

This sprint delivers the first batch of enterprise features from Product Spec Section 9: **Expense Tracking** (9.2), **Vendor Management** (9.3), and **Audit Logs** (9.4). These three features are tightly related — expenses link to properties and optionally to maintenance requests, vendors link to maintenance requests, and audit logs track all changes across these and existing entities. Delivering them together avoids multiple rounds of schema migration and module wiring.

**E-Signatures (9.1) are deferred** to a future sprint. They require a different UI paradigm (embedded canvas, document versioning) and are independent of the features in this sprint.

**Goal:** Property managers can log property-related expenses (with receipt uploads), manage a vendor/contractor directory, assign vendors to maintenance requests, and view an immutable audit trail of all significant actions. **This sprint is backend-only** — web dashboard pages are handled in Sprints 12 and 13.

**Why this sprint:** All core CRUD features are complete (Sprints 1–10). The platform handles properties, tenants, leases, maintenance, payments, documents, notifications, and scheduled tasks. Enterprise features are the next product milestone. Expense tracking and vendor management extend the property management workflow naturally — managers already track maintenance requests and payments, now they can track costs and contractors. Audit logs provide accountability across the entire platform.

---

## What Exists (from Sprints 1–10)

| Layer | What's Done |
|-------|-------------|
| **Shared package** | All core enums + enterprise enums (ExpenseCategory, AuditAction, AuditResourceType), types, DTOs, Zod schemas, constants, display labels. **DONE in this sprint.** |
| **Prisma schema** | 11 domain models including Expense, Vendor, AuditLog (added in this sprint) + MaintenanceRequest vendorId FK. **DONE in this sprint.** |
| **API** | 65+ controllers across 10 domain contexts including expense-management and audit. All use cases, repositories, mappers, presenters, and controllers for expenses, vendors, and audit logs. **DONE in this sprint.** |
| **Web** | Complete dashboard with core pages. No expense, vendor, or audit log pages yet — **deferred to Sprints 12 and 13.** |
| **Mobile** | 4-tab layout (Home, Maintenance, Payments, Documents). Not touched in this sprint. |

---

## Architectural Decisions

1. **Expense and Vendor live in a new domain context:** `apps/api/src/domain/expense-management/`. Both are manager-side features closely related to property operations. Audit logs live in `apps/api/src/domain/audit/` as a cross-cutting concern.

2. **Audit logs are implemented via a lightweight service, not domain events.** A `CreateAuditLogUseCase` is injected into controllers (not use cases) — the controller knows the HTTP actor, action, and resource. This avoids deep coupling between domain use cases and audit infrastructure. The audit service is called AFTER the primary action succeeds.

3. **Vendor assignment to maintenance requests** adds an optional `vendorId` FK to the existing `MaintenanceRequest` Prisma model. The domain entity gets a new optional property. The `UpdateMaintenanceRequest` use case is extended (not replaced) to accept `vendorId`.

4. **Receipt uploads use the existing blob storage SAS URL pattern** — same as document and maintenance photo uploads. `POST /expenses/:id/receipt` generates a signed URL, client uploads directly, then confirms.

5. **Follow all existing DDD patterns exactly:** Entity with value objects → Use cases returning `Either` → Abstract repository → Prisma implementation → Controller with `ZodValidationPipe` and `errorMap` → Presenter. Reference existing patterns by name — builders have full codebase access.

6. **Web pages follow the established component patterns:** TanStack Query hooks in `hooks/`, list pages with shadcn Table + filters + pagination, detail pages with info cards, create/edit forms with `react-hook-form` + `zodResolver` + shared Zod schemas.

7. **Audit log is append-only.** No update or delete endpoints. The `AuditLog` Prisma model has no `updatedAt` field. The API only exposes `GET` endpoints for listing and filtering.

8. **Single Prisma migration** for all three new models (Expense, Vendor, AuditLog) plus the `vendorId` addition to MaintenanceRequest.

---

## Task 1: Shared Package — Enterprise Types, Enums, Schemas & Constants (Backend Agent)

### Objective

Add all enterprise-related enums, TypeScript interfaces, DTOs, Zod validation schemas, constants, and display labels to `@leaselink/shared`.

### Dependencies

- None (starting point)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared/src/enums.ts` | Modify | Add `ExpenseCategory`, `AuditAction`, `AuditResourceType` enums |
| `packages/shared/src/types/expense.ts` | Create | Expense entity interface |
| `packages/shared/src/types/vendor.ts` | Create | Vendor entity interface |
| `packages/shared/src/types/audit-log.ts` | Create | AuditLog entity interface |
| `packages/shared/src/types/index.ts` | Modify | Add exports |
| `packages/shared/src/dto/expense.dto.ts` | Create | Expense CRUD DTOs |
| `packages/shared/src/dto/vendor.dto.ts` | Create | Vendor CRUD DTOs |
| `packages/shared/src/dto/audit-log.dto.ts` | Create | AuditLog filter DTOs |
| `packages/shared/src/dto/index.ts` | Modify | Add exports |
| `packages/shared/src/validation/expense.schema.ts` | Create | Expense Zod schemas |
| `packages/shared/src/validation/vendor.schema.ts` | Create | Vendor Zod schemas |
| `packages/shared/src/validation/audit-log.schema.ts` | Create | AuditLog filter schema |
| `packages/shared/src/validation/index.ts` | Modify | Add exports |
| `packages/shared/src/constants/display-labels.ts` | Modify | Add labels for new enums |
| `packages/shared/src/constants/error-messages.ts` | Modify | Add error messages for new entities |
| `packages/shared/src/constants/defaults.ts` | Modify | Add max receipt size constant |

### Requirements

#### New Enums

```typescript
export enum ExpenseCategory {
  MAINTENANCE = "MAINTENANCE",
  INSURANCE = "INSURANCE",
  TAX = "TAX",
  UTILITY = "UTILITY",
  MANAGEMENT_FEE = "MANAGEMENT_FEE",
  REPAIR = "REPAIR",
  IMPROVEMENT = "IMPROVEMENT",
  OTHER = "OTHER",
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  STATUS_CHANGE = "STATUS_CHANGE",
  LOGIN = "LOGIN",
  UPLOAD = "UPLOAD",
  DOWNLOAD = "DOWNLOAD",
  SIGN = "SIGN",
}

export enum AuditResourceType {
  PROPERTY = "PROPERTY",
  LEASE = "LEASE",
  TENANT = "TENANT",
  PAYMENT = "PAYMENT",
  MAINTENANCE_REQUEST = "MAINTENANCE_REQUEST",
  DOCUMENT = "DOCUMENT",
  EXPENSE = "EXPENSE",
  VENDOR = "VENDOR",
}
```

#### Entity Interfaces

**Expense** — matches Product Spec Section 9.2:
- `id: string`, `propertyId: string`, `managerId: string`, `maintenanceRequestId: string | null`, `category: ExpenseCategory`, `amount: number`, `description: string`, `receiptBlobKey: string | null`, `expenseDate: string`, `createdAt: string`, `updatedAt: string | null`

**Vendor** — matches Product Spec Section 9.3:
- `id: string`, `managerId: string`, `name: string`, `specialty: MaintenanceCategory`, `phone: string | null`, `email: string | null`, `notes: string | null`, `createdAt: string`, `updatedAt: string | null`

**AuditLog** — matches Product Spec Section 9.4:
- `id: string`, `actorId: string`, `actorType: string` ("EMPLOYEE" | "CLIENT"), `action: AuditAction`, `resourceType: AuditResourceType`, `resourceId: string`, `metadata: Record<string, unknown> | null`, `createdAt: string`

#### DTOs

**Expense DTOs:**
- `CreateExpenseDto`: `propertyId`, `category`, `amount` (positive number), `description`, `expenseDate` (ISO datetime), `maintenanceRequestId?`
- `UpdateExpenseDto`: all fields optional except `propertyId`
- `ExpenseFilterDto`: `propertyId?`, `category?`, `dateFrom?`, `dateTo?`, `page`, `pageSize`

**Vendor DTOs:**
- `CreateVendorDto`: `name`, `specialty` (MaintenanceCategory), `phone?`, `email?`, `notes?`
- `UpdateVendorDto`: all fields optional
- `VendorFilterDto`: `specialty?`, `search?`, `page`, `pageSize`

**AuditLog DTOs:**
- `AuditLogFilterDto`: `resourceType?`, `resourceId?`, `action?`, `actorId?`, `dateFrom?`, `dateTo?`, `page`, `pageSize`

#### Zod Schemas

Follow the exact patterns in existing schemas (`packages/shared/src/validation/property.schema.ts`):
- Use `z.nativeEnum()` for enum validation
- UUID fields use `z.string().uuid()`
- Filter schemas have `page` (default 1) and `pageSize` (default 20, max 100) with `z.coerce.number()`
- Date fields use `z.string().datetime()`
- Export inferred types (e.g., `CreateExpenseInput`)

**Expense schema specifics:**
- `amount`: `z.number().positive("Amount must be greater than 0")`
- `description`: `z.string().min(1, "Description is required")`
- `expenseDate`: `z.string().datetime({ message: "Invalid expense date" })`

**Vendor schema specifics:**
- `name`: `z.string().min(1, "Name is required")`
- `specialty`: `z.nativeEnum(MaintenanceCategory)` — vendors map to maintenance categories
- `email`: `z.string().email().optional().or(z.literal(""))`

#### Constants

**Display labels** — add to `packages/shared/src/constants/display-labels.ts`:
- `EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string>` (e.g., `MANAGEMENT_FEE` → "Management Fee")
- `AUDIT_ACTION_LABELS: Record<AuditAction, string>`
- `AUDIT_RESOURCE_TYPE_LABELS: Record<AuditResourceType, string>`

**Error messages** — add to `packages/shared/src/constants/error-messages.ts`:
- `EXPENSE_NOT_FOUND`, `EXPENSE_PROPERTY_NOT_FOUND`, `VENDOR_NOT_FOUND`, `VENDOR_HAS_ASSIGNED_REQUESTS`

**Defaults** — add to `packages/shared/src/constants/defaults.ts`:
- `MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024` (10 MB)

### Acceptance Criteria

- [ ] 3 new enums added to `packages/shared/src/enums.ts`
- [ ] 3 entity interfaces match Product Spec Section 9 field-for-field
- [ ] DTOs exist for Create, Update (Expense/Vendor only), and Filter for each entity
- [ ] Zod schemas validate all required fields, amounts, dates, UUIDs
- [ ] Display labels exist for all 3 new enums with every value covered
- [ ] Error message constants exist for Expense and Vendor errors
- [ ] All new types are re-exported via barrel files
- [ ] `tsc --noEmit` passes on the shared package

### Test Cases

Add to `packages/shared/src/validation/__tests__/schemas.test.ts`:

**Expense schema:**
| Test | Input | Expected |
|------|-------|----------|
| Valid create | `{ propertyId: uuid, category: "MAINTENANCE", amount: 500, description: "Plumber", expenseDate: isoDate }` | Passes |
| Negative amount | `{ ..., amount: -100 }` | Fails |
| Missing description | `{ ..., description: "" }` | Fails |
| Invalid category | `{ ..., category: "FAKE" }` | Fails |
| Valid with maintenance link | `{ ..., maintenanceRequestId: uuid }` | Passes |

**Vendor schema:**
| Test | Input | Expected |
|------|-------|----------|
| Valid create | `{ name: "Joe's Plumbing", specialty: "PLUMBING" }` | Passes |
| Missing name | `{ name: "", specialty: "PLUMBING" }` | Fails |
| Invalid specialty | `{ name: "X", specialty: "MAGIC" }` | Fails |
| Valid with all fields | `{ name: "X", specialty: "HVAC", phone: "555-1234", email: "x@y.com", notes: "Good" }` | Passes |

**AuditLog filter:**
| Test | Input | Expected |
|------|-------|----------|
| Empty filter | `{}` | Passes with page=1, pageSize=20 defaults |
| Filter by resource | `{ resourceType: "PROPERTY", resourceId: uuid }` | Passes |

---

## Task 2: Database Schema — New Models (Backend Agent)

### Objective

Add Expense, Vendor, and AuditLog models to the Prisma schema. Add optional `vendorId` FK to MaintenanceRequest. Generate and verify the migration.

### Dependencies

- Task 1 (enum values must align with shared package)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/prisma/schema.prisma` | Modify | Add 3 new models, update MaintenanceRequest, add enums |

### Requirements

#### New Prisma Enums

```prisma
enum EXPENSE_CATEGORY {
  MAINTENANCE
  INSURANCE
  TAX
  UTILITY
  MANAGEMENT_FEE
  REPAIR
  IMPROVEMENT
  OTHER
}

enum AUDIT_ACTION {
  CREATE
  UPDATE
  DELETE
  STATUS_CHANGE
  LOGIN
  UPLOAD
  DOWNLOAD
  SIGN
}

enum AUDIT_RESOURCE_TYPE {
  PROPERTY
  LEASE
  TENANT
  PAYMENT
  MAINTENANCE_REQUEST
  DOCUMENT
  EXPENSE
  VENDOR
}
```

#### New Models

**Expense** — follow the Property model pattern for field naming (`@map` snake_case):

```prisma
model Expense {
  id                     String           @id @default(uuid())
  propertyId             String           @map("property_id")
  managerId              String           @map("manager_id")
  maintenanceRequestId   String?          @map("maintenance_request_id")
  category               EXPENSE_CATEGORY
  amount                 Float
  description            String
  receiptBlobKey         String?          @map("receipt_blob_key")
  expenseDate            DateTime         @map("expense_date")
  createdAt              DateTime         @default(now()) @map("created_at")
  updatedAt              DateTime?        @updatedAt @map("updated_at")

  property            Property             @relation(fields: [propertyId], references: [id])
  manager             Employee             @relation(fields: [managerId], references: [id])
  maintenanceRequest  MaintenanceRequest?  @relation(fields: [maintenanceRequestId], references: [id])

  @@index([propertyId])
  @@index([managerId])
  @@index([category])
  @@index([expenseDate])
  @@map("expenses")
}
```

**Vendor:**

```prisma
model Vendor {
  id         String               @id @default(uuid())
  managerId  String               @map("manager_id")
  name       String
  specialty  MAINTENANCE_CATEGORY
  phone      String?
  email      String?
  notes      String?
  createdAt  DateTime             @default(now()) @map("created_at")
  updatedAt  DateTime?            @updatedAt @map("updated_at")

  manager              Employee              @relation(fields: [managerId], references: [id])
  maintenanceRequests  MaintenanceRequest[]

  @@index([managerId])
  @@index([specialty])
  @@map("vendors")
}
```

**AuditLog:**

```prisma
model AuditLog {
  id           String              @id @default(uuid())
  actorId      String              @map("actor_id")
  actorType    String              @map("actor_type")
  action       AUDIT_ACTION
  resourceType AUDIT_RESOURCE_TYPE @map("resource_type")
  resourceId   String              @map("resource_id")
  metadata     Json?
  createdAt    DateTime            @default(now()) @map("created_at")

  @@index([resourceType, resourceId])
  @@index([actorId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

Note: AuditLog has NO `updatedAt` and NO relations (it references IDs but is intentionally decoupled — it must survive even if the referenced resource is deleted).

#### MaintenanceRequest Update

Add optional `vendorId` field and relation:

```prisma
model MaintenanceRequest {
  // ... existing fields ...
  vendorId    String?  @map("vendor_id")

  // ... existing relations ...
  vendor      Vendor?  @relation(fields: [vendorId], references: [id])
  expenses    Expense[]

  @@index([vendorId])
  // ... existing indexes ...
}
```

#### Existing Model Updates

**Employee** — add relations:
```prisma
expenses  Expense[]
vendors   Vendor[]
```

**Property** — add relation:
```prisma
expenses  Expense[]
```

#### Migration

Run `npx prisma migrate dev --name sprint11_enterprise_features` from `apps/api/`. The migration should be additive (new tables, new columns, new indexes) — no destructive changes. Verify `npx prisma generate` succeeds.

### Acceptance Criteria

- [ ] `npx prisma validate` passes
- [ ] `npx prisma migrate dev` generates a migration without errors
- [ ] 3 new models exist: Expense, Vendor, AuditLog
- [ ] MaintenanceRequest has optional `vendorId` with FK to Vendor
- [ ] AuditLog has NO `updatedAt` field (immutable)
- [ ] All indexes are created (propertyId, managerId, category, expenseDate, specialty, resourceType+resourceId, actorId, action, createdAt)
- [ ] Enum values in Prisma match the shared package enums exactly
- [ ] `npx prisma generate` succeeds
- [ ] Existing tests pass: `cd apps/api && npm run test`

---

## Task 3: Expense Domain & Infrastructure (Backend Agent)

### Objective

Create the Expense domain entity, use cases, repository, mapper, controllers, presenter, and wire into NestJS modules. Follow the Property entity pattern exactly.

### Dependencies

- Task 1 (shared types/schemas)
- Task 2 (Prisma schema)

### Files to Create

**Domain layer — `apps/api/src/domain/expense-management/`:**

| File | Purpose |
|------|---------|
| `enterprise/entities/expense.ts` | Expense entity — follow Property entity pattern |
| `enterprise/entities/value-objects/expense-category.ts` | ExpenseCategory value object — follow PropertyStatus pattern |
| `application/repositories/expenses-repository.ts` | Abstract repository |
| `application/use-cases/create-expense.ts` | Create expense |
| `application/use-cases/get-expense-by-id.ts` | Get single expense |
| `application/use-cases/get-expenses.ts` | List expenses with filtering/pagination |
| `application/use-cases/get-expense-summary.ts` | Monthly summary by property |
| `application/use-cases/update-expense.ts` | Update expense |
| `application/use-cases/delete-expense.ts` | Delete expense |
| `application/use-cases/upload-expense-receipt.ts` | Generate SAS URL for receipt upload |
| `application/use-cases/confirm-expense-receipt.ts` | Confirm receipt upload, store blob key |
| `application/use-cases/errors/expense-not-found-error.ts` | Error class |
| `application/use-cases/errors/expense-property-not-found-error.ts` | Error class |

**Infrastructure layer:**

| File | Purpose |
|------|---------|
| `apps/api/src/infra/database/prisma/mappers/prisma-expense-mapper.ts` | Prisma ↔ domain mapper |
| `apps/api/src/infra/database/prisma/repositories/prisma-expenses-repository.ts` | Prisma repository |
| `apps/api/src/infra/http/controllers/create-expense/create-expense.controller.ts` | POST /expenses |
| `apps/api/src/infra/http/controllers/get-expenses/get-expenses.controller.ts` | GET /expenses |
| `apps/api/src/infra/http/controllers/get-expense-by-id/get-expense-by-id.controller.ts` | GET /expenses/:id |
| `apps/api/src/infra/http/controllers/get-expense-summary/get-expense-summary.controller.ts` | GET /expenses/summary |
| `apps/api/src/infra/http/controllers/update-expense/update-expense.controller.ts` | PUT /expenses/:id |
| `apps/api/src/infra/http/controllers/delete-expense/delete-expense.controller.ts` | DELETE /expenses/:id |
| `apps/api/src/infra/http/controllers/upload-expense-receipt/upload-expense-receipt.controller.ts` | POST /expenses/:id/receipt |
| `apps/api/src/infra/http/controllers/confirm-expense-receipt/confirm-expense-receipt.controller.ts` | POST /expenses/:id/receipt/confirm |
| `apps/api/src/infra/http/presenters/http-expense-presenter.ts` | Expense → JSON |
| `apps/api/src/infra/http/DTOs/expense/*.ts` | Swagger DTOs |

**Test files:**

| File | Purpose |
|------|---------|
| `test/factories/make-expense.ts` | Test factory |
| `test/repositories/prisma/in-memory-expenses-repository.ts` | In-memory repository |

### Requirements

#### Expense Entity

Follow the Property entity pattern. Props include: `propertyId: UniqueEntityId`, `managerId: UniqueEntityId`, `maintenanceRequestId: UniqueEntityId | null`, `category: ExpenseCategory` (value object), `amount: number`, `description: string`, `receiptBlobKey: string | null`, `expenseDate: Date`, `createdAt: Date`, `updatedAt: Date | null`.

Default: no defaults needed — all fields are required on creation except `maintenanceRequestId` and `receiptBlobKey`.

#### Repository Interface

```typescript
abstract class ExpensesRepository {
  abstract create(expense: Expense): Promise<void>
  abstract findById(expenseId: string): Promise<Expense | null>
  abstract findMany(params: ExpensesFilterParams): Promise<ExpensesPaginatedResult>
  abstract findSummaryByProperty(managerId: string, startDate: Date, endDate: Date): Promise<ExpenseSummaryResult[]>
  abstract update(expense: Expense): Promise<Expense>
  abstract delete(expenseId: string): Promise<void>
}
```

`ExpensesFilterParams`: `managerId` (required — scope to manager's properties), `propertyId?`, `category?`, `dateFrom?`, `dateTo?`, `page`, `pageSize`.

`ExpenseSummaryResult`: `{ propertyId: string, propertyAddress: string, totalAmount: number, count: number }` — aggregation by property for a date range.

#### Use Cases

**CreateExpense:**
- Input: `managerId` (from auth), `propertyId`, `category`, `amount`, `description`, `expenseDate`, `maintenanceRequestId?`
- Validate property exists and belongs to manager (inject `PropertiesRepository`)
- If `maintenanceRequestId` provided, validate it exists and belongs to the property
- Create expense entity and persist

**GetExpenses:**
- Input: filter params + `managerId`
- All expenses are scoped to manager's properties via `managerId` filter

**GetExpenseSummary:**
- Input: `managerId`, optional `startDate`/`endDate` (default to current month)
- Returns aggregated expenses by property for the date range
- The Prisma implementation uses `groupBy` with `_sum` and `_count`

**UpdateExpense:**
- Verify manager owns the expense (via property ownership)
- Allow updating: `category`, `amount`, `description`, `expenseDate`, `maintenanceRequestId`

**DeleteExpense:**
- Verify manager owns the expense
- Delete the record

**UploadExpenseReceipt / ConfirmExpenseReceipt:**
- Follow the exact pattern of `UploadMaintenancePhotos` / `ConfirmMaintenancePhotos`
- Receipt blob key pattern: `expenses/{expenseId}/receipt/{uuid}-{fileName}`
- Only one receipt per expense (replaces existing if present)
- Use `BlobStorageRepository.generateUploadUrl()`

#### Controllers

All controllers:
- `@ApiTags('Expenses')`
- `@UseGuards(EmployeeOnlyGuard)` — expenses are manager-only
- Validate with shared Zod schemas from `@leaselink/shared`
- Follow the Property controller patterns for error mapping

**Route ordering:** Register `GET /expenses/summary` BEFORE `GET /expenses/:id` to avoid route conflicts.

#### Presenter Response Shape

```typescript
{
  id: string
  propertyId: string
  managerId: string
  maintenanceRequestId: string | null
  category: string
  amount: number
  description: string
  receiptBlobKey: string | null
  expenseDate: string     // ISO 8601
  createdAt: string
  updatedAt: string | null
}
```

### API Response Contracts

| Endpoint | Response Shape |
|----------|---------------|
| `POST /expenses` | `{ expense: ExpenseHttpResponse }` — 201 |
| `GET /expenses` | `{ data: ExpenseHttpResponse[], meta: { page, pageSize, totalCount, totalPages } }` — 200 |
| `GET /expenses/:id` | `{ expense: ExpenseHttpResponse }` — 200 |
| `GET /expenses/summary` | `{ summary: Array<{ propertyId, propertyAddress, totalAmount, count }> }` — 200 |
| `PUT /expenses/:id` | `{ expense: ExpenseHttpResponse }` — 200 |
| `DELETE /expenses/:id` | 204 No Content |
| `POST /expenses/:id/receipt` | `{ uploadUrl: string, blobKey: string }` — 200 |
| `POST /expenses/:id/receipt/confirm` | `{ expense: ExpenseHttpResponse }` — 200 |

### Acceptance Criteria

- [ ] Expense entity follows Property entity pattern with `ExpenseCategory` value object
- [ ] Repository has 6 methods including `findSummaryByProperty` aggregation
- [ ] `CreateExpense` validates property ownership and optional maintenance request link
- [ ] `GetExpenses` scopes all results to manager's properties
- [ ] `GetExpenseSummary` returns aggregated totals by property
- [ ] Receipt upload/confirm follows maintenance photo pattern with `BlobStorageRepository`
- [ ] All 8 controllers registered with `EmployeeOnlyGuard`
- [ ] Swagger DTOs document all request/response types
- [ ] All files pass `tsc --noEmit`
- [ ] API starts without errors

### Test Cases

Create unit test files alongside each use case.

**CreateExpense:**
| Test | Setup | Expected |
|------|-------|----------|
| should create expense | Valid property, valid data | `isRight()`, expense created |
| should reject if property not found | Non-existent propertyId | `isLeft()`, error |
| should reject if manager doesn't own property | Different managerId | `isLeft()`, error |
| should create with maintenance request link | Valid maintenanceRequestId | `isRight()`, `maintenanceRequestId` set |

**GetExpenses:**
| Test | Setup | Expected |
|------|-------|----------|
| should list expenses for manager | 3 expenses across 2 properties | Returns all 3 |
| should filter by category | MAINTENANCE and TAX expenses | Filter by MAINTENANCE returns 1 |
| should filter by date range | Expenses in Jan and Feb | Filter for Jan returns only Jan |
| should paginate | 5 expenses, pageSize=2 | Returns 2, totalCount=5 |

**GetExpenseSummary:**
| Test | Setup | Expected |
|------|-------|----------|
| should aggregate by property | 3 expenses on property A ($500 total), 1 on B ($200) | Returns [{ propertyId: A, totalAmount: 500, count: 3 }, ...] |
| should filter by date range | Expenses in Jan and Feb | Summary for Jan only shows Jan expenses |

**UpdateExpense:**
| Test | Setup | Expected |
|------|-------|----------|
| should update expense | Valid data | `isRight()`, fields updated |
| should reject if not owner | Different manager | `isLeft()`, error |

**DeleteExpense:**
| Test | Setup | Expected |
|------|-------|----------|
| should delete expense | Valid expense | `isRight()`, removed |
| should reject if not owner | Different manager | `isLeft()`, error |

**E2E tests** — create `.e2e-spec.ts` for every controller following the existing E2E pattern (`JwtFactory.makeJwt(false)` for EMPLOYEE auth, Prisma for data setup/teardown).

---

## Task 4: Vendor Domain & Infrastructure (Backend Agent)

### Objective

Create the Vendor domain entity, use cases, repository, mapper, controllers, presenter. Also extend the `UpdateMaintenanceRequestStatus` use case to accept an optional `vendorId` for vendor assignment.

### Dependencies

- Task 1 (shared types/schemas)
- Task 2 (Prisma schema)

### Files to Create

**Domain layer — `apps/api/src/domain/expense-management/`** (same domain context as expenses — vendors are closely related):

| File | Purpose |
|------|---------|
| `enterprise/entities/vendor.ts` | Vendor entity — follow Property entity pattern |
| `application/repositories/vendors-repository.ts` | Abstract repository |
| `application/use-cases/create-vendor.ts` | Create vendor |
| `application/use-cases/get-vendor-by-id.ts` | Get single vendor |
| `application/use-cases/get-vendors.ts` | List vendors with filtering |
| `application/use-cases/update-vendor.ts` | Update vendor |
| `application/use-cases/delete-vendor.ts` | Delete vendor (reject if assigned to open requests) |
| `application/use-cases/errors/vendor-not-found-error.ts` | Error class |
| `application/use-cases/errors/vendor-has-assigned-requests-error.ts` | Error class |

**Infrastructure layer:**

| File | Purpose |
|------|---------|
| `apps/api/src/infra/database/prisma/mappers/prisma-vendor-mapper.ts` | Prisma ↔ domain mapper |
| `apps/api/src/infra/database/prisma/repositories/prisma-vendors-repository.ts` | Prisma repository |
| `apps/api/src/infra/http/controllers/create-vendor/create-vendor.controller.ts` | POST /vendors |
| `apps/api/src/infra/http/controllers/get-vendors/get-vendors.controller.ts` | GET /vendors |
| `apps/api/src/infra/http/controllers/get-vendor-by-id/get-vendor-by-id.controller.ts` | GET /vendors/:id |
| `apps/api/src/infra/http/controllers/update-vendor/update-vendor.controller.ts` | PUT /vendors/:id |
| `apps/api/src/infra/http/controllers/delete-vendor/delete-vendor.controller.ts` | DELETE /vendors/:id |
| `apps/api/src/infra/http/presenters/http-vendor-presenter.ts` | Vendor → JSON |
| `apps/api/src/infra/http/DTOs/vendor/*.ts` | Swagger DTOs |

**Maintenance update:**

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/maintenance/enterprise/entities/maintenance-request.ts` | Modify | Add optional `vendorId` property |
| `apps/api/src/domain/maintenance/application/use-cases/update-maintenance-request-status.ts` | Modify | Accept optional `vendorId` in request |
| `apps/api/src/infra/database/prisma/mappers/prisma-maintenance-request-mapper.ts` | Modify | Map `vendorId` field |
| `apps/api/src/infra/http/controllers/update-maintenance-request-status/update-maintenance-request-status.controller.ts` | Modify | Accept `vendorId` in body |
| `apps/api/src/infra/http/presenters/http-maintenance-request-presenter.ts` | Modify | Include `vendorId` in response |

**Test files:**

| File | Purpose |
|------|---------|
| `test/factories/make-vendor.ts` | Test factory |
| `test/repositories/prisma/in-memory-vendors-repository.ts` | In-memory repository |

### Requirements

#### Vendor Entity

Follow Property entity pattern. Props: `managerId: UniqueEntityId`, `name: string`, `specialty: MaintenanceCategory` (reuse existing value object or create a simple one), `phone: string | null`, `email: string | null`, `notes: string | null`, `createdAt: Date`, `updatedAt: Date | null`.

Note: `specialty` uses `MaintenanceCategory` — the same enum that maintenance requests use for `category`. This allows filtering vendors by their trade when assigning to requests.

#### Repository Interface

```typescript
abstract class VendorsRepository {
  abstract create(vendor: Vendor): Promise<void>
  abstract findById(vendorId: string): Promise<Vendor | null>
  abstract findManyByManager(params: VendorsFilterParams): Promise<VendorsPaginatedResult>
  abstract update(vendor: Vendor): Promise<Vendor>
  abstract delete(vendorId: string): Promise<void>
  abstract hasOpenMaintenanceRequests(vendorId: string): Promise<boolean>
}
```

`VendorsFilterParams`: `managerId` (required), `specialty?`, `search?` (name/email), `page`, `pageSize`.

#### Business Rules

- Vendors belong to a manager (`managerId` from auth context)
- Each manager has their own vendor list — no cross-manager access
- A vendor cannot be deleted if they are assigned to any OPEN or IN_PROGRESS maintenance requests
- `hasOpenMaintenanceRequests` queries: `maintenanceRequest.count({ where: { vendorId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }) > 0`

#### Maintenance Request — Vendor Assignment

Extend the existing `UpdateMaintenanceRequestStatus` use case request interface to accept an optional `vendorId`:

```typescript
interface UpdateMaintenanceRequestStatusUseCaseRequest {
  // ... existing fields ...
  vendorId?: string | null  // null to unassign, string to assign, undefined to leave unchanged
}
```

When `vendorId` is provided:
- If string: validate vendor exists and belongs to the manager. Set `request.vendorId`.
- If null: unassign vendor (`request.vendorId = null`).

The controller's Zod schema should be updated to accept `vendorId: z.string().uuid().optional().nullable()` alongside the existing `status` field.

#### Controllers

All controllers:
- `@ApiTags('Vendors')`
- `@UseGuards(EmployeeOnlyGuard)` — vendors are manager-only

### API Response Contracts

| Endpoint | Response Shape |
|----------|---------------|
| `POST /vendors` | `{ vendor: VendorHttpResponse }` — 201 |
| `GET /vendors` | `{ data: VendorHttpResponse[], meta: { page, pageSize, totalCount, totalPages } }` — 200 |
| `GET /vendors/:id` | `{ vendor: VendorHttpResponse }` — 200 |
| `PUT /vendors/:id` | `{ vendor: VendorHttpResponse }` — 200 |
| `DELETE /vendors/:id` | 204 No Content |

**VendorHttpResponse:**
```typescript
{
  id: string
  managerId: string
  name: string
  specialty: string
  phone: string | null
  email: string | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
}
```

**Updated MaintenanceRequest response** — add `vendorId: string | null` to the existing response shape.

### Acceptance Criteria

- [ ] Vendor entity follows Property entity pattern
- [ ] Repository has 6 methods including `hasOpenMaintenanceRequests`
- [ ] `DeleteVendor` rejects deletion when vendor has open/in-progress maintenance requests
- [ ] Vendors are scoped to their manager (no cross-manager access)
- [ ] MaintenanceRequest entity has optional `vendorId` property
- [ ] `UpdateMaintenanceRequestStatus` accepts optional `vendorId` for assignment
- [ ] Maintenance request mapper and presenter include `vendorId`
- [ ] All 5 vendor controllers registered with `EmployeeOnlyGuard`
- [ ] All files pass `tsc --noEmit`

### Test Cases

**CreateVendor:**
| Test | Setup | Expected |
|------|-------|----------|
| should create vendor | Valid data | `isRight()`, vendor created |

**GetVendors:**
| Test | Setup | Expected |
|------|-------|----------|
| should list manager's vendors | 3 vendors for manager A, 2 for B | Manager A gets 3 |
| should filter by specialty | PLUMBING and ELECTRICAL vendors | Filter by PLUMBING returns only PLUMBING |
| should search by name | Vendor named "Joe's Plumbing" | Search "Joe" matches |

**DeleteVendor:**
| Test | Setup | Expected |
|------|-------|----------|
| should delete vendor | No open requests | `isRight()`, removed |
| should reject if has open requests | Vendor assigned to OPEN request | `isLeft()`, VendorHasAssignedRequestsError |
| should allow delete if only CLOSED requests | Vendor assigned to CLOSED request | `isRight()`, removed |

**Vendor assignment via maintenance update:**
| Test | Setup | Expected |
|------|-------|----------|
| should assign vendor to request | Valid vendorId | `isRight()`, request.vendorId set |
| should unassign vendor | vendorId: null | `isRight()`, request.vendorId is null |
| should reject if vendor not found | Non-existent vendorId | `isLeft()`, error |

**E2E tests** for all 5 vendor controllers + updated maintenance controller.

---

## Task 5: Audit Log Domain & Infrastructure (Backend Agent)

### Objective

Create the AuditLog entity, repository, use cases (create + query), mapper, controllers, and integrate audit logging into existing controllers for key actions.

### Dependencies

- Task 1 (shared types/schemas)
- Task 2 (Prisma schema)

### Files to Create

**Domain layer — `apps/api/src/domain/audit/`:**

| File | Purpose |
|------|---------|
| `enterprise/entities/audit-log.ts` | AuditLog entity — simpler than others (no value objects needed, immutable) |
| `application/repositories/audit-logs-repository.ts` | Abstract repository |
| `application/use-cases/create-audit-log.ts` | Create a single audit log entry |
| `application/use-cases/get-audit-logs.ts` | List with filtering/pagination |
| `application/use-cases/get-audit-logs-by-resource.ts` | Get trail for a specific resource |

**Infrastructure layer:**

| File | Purpose |
|------|---------|
| `apps/api/src/infra/database/prisma/mappers/prisma-audit-log-mapper.ts` | Prisma ↔ domain mapper |
| `apps/api/src/infra/database/prisma/repositories/prisma-audit-logs-repository.ts` | Prisma repository |
| `apps/api/src/infra/http/controllers/get-audit-logs/get-audit-logs.controller.ts` | GET /audit-logs |
| `apps/api/src/infra/http/controllers/get-audit-logs-by-resource/get-audit-logs-by-resource.controller.ts` | GET /audit-logs/:resourceType/:resourceId |
| `apps/api/src/infra/http/presenters/http-audit-log-presenter.ts` | AuditLog → JSON |
| `apps/api/src/infra/http/DTOs/audit-log/*.ts` | Swagger DTOs |

### Requirements

#### AuditLog Entity

Simpler than other entities — it's immutable (no setters, no `touch()`, no `updatedAt`):

```typescript
interface AuditLogProps {
  actorId: UniqueEntityId
  actorType: string  // "EMPLOYEE" or "CLIENT"
  action: string     // AuditAction enum value
  resourceType: string  // AuditResourceType enum value
  resourceId: UniqueEntityId
  metadata: Record<string, unknown> | null
  createdAt: Date
}
```

Static `create()` factory only — no setters. The entity is created once and never modified.

#### Repository Interface

```typescript
abstract class AuditLogsRepository {
  abstract create(auditLog: AuditLog): Promise<void>
  abstract findMany(params: AuditLogsFilterParams): Promise<AuditLogsPaginatedResult>
  abstract findByResource(resourceType: string, resourceId: string, page: number, pageSize: number): Promise<AuditLogsPaginatedResult>
}
```

`AuditLogsFilterParams`: `resourceType?`, `resourceId?`, `action?`, `actorId?`, `dateFrom?`, `dateTo?`, `page`, `pageSize`.

No `update` or `delete` methods — audit logs are immutable.

#### CreateAuditLog Use Case

Input: `actorId`, `actorType`, `action`, `resourceType`, `resourceId`, `metadata?`

No business rules — always succeeds. Returns `Either<never, { auditLog: AuditLog }>`.

This use case is deliberately simple. It's called from controllers after primary actions succeed. If audit log creation fails, it should log the error but NOT fail the primary request.

#### Controllers

- `@ApiTags('Audit Logs')`
- `@UseGuards(EmployeeOnlyGuard)` — audit logs are manager-only to view
- Read-only: only GET endpoints (no POST/PUT/DELETE exposed via HTTP)

**GET /audit-logs** — filterable list, validate with `auditLogFilterSchema` from `@leaselink/shared`.

**GET /audit-logs/:resourceType/:resourceId** — audit trail for a specific resource. E.g., `GET /audit-logs/PROPERTY/uuid` shows all actions on that property.

#### Integrating Audit Logging into Existing Controllers

After the audit use case and repository are wired up, add audit log creation calls to the following **existing controllers**. Each call is a fire-and-forget after the primary response (use `try/catch` to prevent audit failures from breaking primary operations):

| Controller | Action | Resource Type | Metadata |
|------------|--------|---------------|----------|
| `CreatePropertyController` | `CREATE` | `PROPERTY` | `{ address }` |
| `UpdatePropertyController` | `UPDATE` | `PROPERTY` | `{ updatedFields }` |
| `UpdatePropertyStatusController` | `STATUS_CHANGE` | `PROPERTY` | `{ from, to }` |
| `DeletePropertyController` | `DELETE` | `PROPERTY` | `{ address }` |
| `CreateLeaseController` | `CREATE` | `LEASE` | `{ propertyId, tenantId }` |
| `UpdateLeaseStatusController` | `STATUS_CHANGE` | `LEASE` | `{ from, to }` |
| `CreateMaintenanceRequestController` | `CREATE` | `MAINTENANCE_REQUEST` | `{ title, priority }` |
| `UpdateMaintenanceRequestStatusController` | `STATUS_CHANGE` | `MAINTENANCE_REQUEST` | `{ from, to }` |
| `CreateExpenseController` | `CREATE` | `EXPENSE` | `{ amount, category }` |
| `DeleteExpenseController` | `DELETE` | `EXPENSE` | `{ amount }` |
| `CreateVendorController` | `CREATE` | `VENDOR` | `{ name }` |
| `DeleteVendorController` | `DELETE` | `VENDOR` | `{ name }` |
| `ConfirmUploadDocumentController` | `UPLOAD` | `DOCUMENT` | `{ name, folder }` |
| `DownloadDocumentController` | `DOWNLOAD` | `DOCUMENT` | `{ name }` |

The pattern in each controller:

```typescript
// After the primary use case succeeds and before returning:
this.createAuditLog.execute({
  actorId: user.id,
  actorType: 'EMPLOYEE', // or determine from auth context
  action: 'CREATE',
  resourceType: 'PROPERTY',
  resourceId: property.id.toString(),
  metadata: { address: body.address },
}).catch((err) => {
  // Log but don't fail the request
  this.logger.error('Failed to create audit log', err)
})
```

Inject `CreateAuditLogUseCase` into each controller. Use `@Optional()` decorator to avoid breaking existing tests that don't provide it.

### API Response Contracts

| Endpoint | Response Shape |
|----------|---------------|
| `GET /audit-logs` | `{ data: AuditLogHttpResponse[], meta: { page, pageSize, totalCount, totalPages } }` — 200 |
| `GET /audit-logs/:resourceType/:resourceId` | `{ data: AuditLogHttpResponse[], meta: { page, pageSize, totalCount, totalPages } }` — 200 |

**AuditLogHttpResponse:**
```typescript
{
  id: string
  actorId: string
  actorType: string
  action: string
  resourceType: string
  resourceId: string
  metadata: Record<string, unknown> | null
  createdAt: string
}
```

### Acceptance Criteria

- [ ] AuditLog entity is immutable (no setters, no updatedAt)
- [ ] Repository has `create`, `findMany`, `findByResource` — NO update or delete
- [ ] Only GET endpoints exposed via HTTP (no POST/PUT/DELETE for audit logs)
- [ ] `GET /audit-logs` supports filtering by resourceType, action, actorId, date range
- [ ] `GET /audit-logs/:resourceType/:resourceId` returns trail for a specific resource
- [ ] Audit logging integrated into 14 existing controllers (fire-and-forget)
- [ ] Audit failures do NOT break primary operations
- [ ] All files pass `tsc --noEmit`
- [ ] Existing tests still pass (audit injection uses `@Optional()`)

### Test Cases

**CreateAuditLog:**
| Test | Setup | Expected |
|------|-------|----------|
| should create audit log | Valid data | `isRight()`, log persisted |

**GetAuditLogs:**
| Test | Setup | Expected |
|------|-------|----------|
| should list all logs | 5 logs across resources | Returns all 5 |
| should filter by resourceType | PROPERTY and LEASE logs | Filter by PROPERTY returns only PROPERTY |
| should filter by action | CREATE and DELETE logs | Filter by CREATE returns only CREATE |
| should filter by date range | Logs from Jan and Feb | Filter for Jan returns only Jan |

**GetAuditLogsByResource:**
| Test | Setup | Expected |
|------|-------|----------|
| should return trail for property | 3 actions on property X | Returns 3 logs for that resource |
| should return empty for no actions | New resource with no logs | Empty array, totalCount: 0 |

**E2E tests** for both GET controllers. Integration test: create a property → verify audit log appears in `GET /audit-logs?resourceType=PROPERTY`.

---

## Task 6: ~~DEFERRED TO SPRINT 12~~ — Expense Pages — Web Dashboard (Web Agent)

### Objective

Build the expense management UI: list page with filtering, detail page, create/edit forms, receipt upload, and expense summary. Add "Expenses" to the sidebar navigation.

### Dependencies

- Task 3 (expense API endpoints must exist)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/hooks/use-expenses.ts` | Create | TanStack Query hooks |
| `apps/web/src/app/(dashboard)/expenses/page.tsx` | Create | Expense list page |
| `apps/web/src/app/(dashboard)/expenses/new/page.tsx` | Create | Create expense page |
| `apps/web/src/app/(dashboard)/expenses/[id]/page.tsx` | Create | Expense detail page |
| `apps/web/src/app/(dashboard)/expenses/[id]/edit/page.tsx` | Create | Edit expense page |
| `apps/web/src/components/expenses/expense-form.tsx` | Create | Shared create/edit form |
| `apps/web/src/components/expenses/expense-category-badge.tsx` | Create | Category badge |
| `apps/web/src/components/expenses/expense-summary-cards.tsx` | Create | Monthly summary display |
| `apps/web/src/components/expenses/receipt-upload.tsx` | Create | Receipt upload component |
| `apps/web/src/components/layout/app-sidebar.tsx` | Modify | Add Expenses nav item |
| `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` | Modify | Add expenses section to property detail |

### Requirements

#### Sidebar Update

Add to `mainNavItems` in `apps/web/src/components/layout/app-sidebar.tsx`:

```typescript
{ title: "Expenses", href: "/expenses", icon: Receipt },  // lucide-react Receipt icon
```

Place it after "Payments" and before "Documents" in the list.

#### TanStack Query Hooks — `use-expenses.ts`

Follow `use-payments.ts` pattern:
- `useExpenses(filters)` — `GET /expenses` with propertyId, category, dateFrom, dateTo, page, pageSize
- `useExpense(id)` — `GET /expenses/:id`
- `useExpenseSummary(startDate?, endDate?)` — `GET /expenses/summary`
- `useCreateExpense()` — `POST /expenses`
- `useUpdateExpense(id)` — `PUT /expenses/:id`
- `useDeleteExpense()` — `DELETE /expenses/:id`

Mutations invalidate `['expenses']` on success.

#### Expense List Page

Features:
- Page header: "Expenses" title + "Add Expense" button
- **Summary cards at the top:** total expenses this month, by-property breakdown (from `useExpenseSummary`). Show total amount formatted as currency and count.
- Filter bar: property dropdown, category dropdown (from `EXPENSE_CATEGORY_LABELS`), date range picker (month/year)
- Table columns: Date, Property, Category, Amount, Description, Receipt, Actions
  - Date: formatted date
  - Property: address (resolve from propertyId — fetch properties in parallel)
  - Category: `ExpenseCategoryBadge`
  - Amount: formatted currency ($X,XXX.XX)
  - Description: truncated to 1 line
  - Receipt: icon indicating if receipt is attached
  - Actions: View, Edit, Delete
- Pagination
- Empty state: "No expenses recorded yet."

#### Create/Edit Expense Form

Shared `ExpenseForm` component:
- Property selector: dropdown of manager's properties (use `useProperties`)
- Category: select from `EXPENSE_CATEGORY_LABELS`
- Amount: number input with $ prefix
- Description: textarea
- Expense Date: date picker
- Maintenance Request (optional): dropdown of maintenance requests for selected property (filter appears after property is selected)
- Validates with `createExpenseSchema` / `updateExpenseSchema` from `@leaselink/shared`

#### Expense Detail Page

- Header: description, category badge, amount (large)
- Info card: property (link), date, category, amount, description
- Maintenance request link (if linked)
- Receipt section: if receipt exists, show image/PDF preview with download link. If no receipt, show "Upload Receipt" button with `ReceiptUpload` component.

#### Receipt Upload Component

Follows the property photo upload pattern:
1. File picker (accept `image/*,application/pdf`)
2. Call `POST /expenses/:id/receipt` to get upload URL
3. Upload to blob storage
4. Call `POST /expenses/:id/receipt/confirm`
5. Refetch expense data

#### Property Detail — Expenses Section

Add an "Expenses" section to `apps/web/src/app/(dashboard)/properties/[id]/page.tsx`:
- Show 5 most recent expenses for this property
- Each expense: date, category badge, amount, description (truncated)
- "View all" link to `/expenses?propertyId=<id>`

#### ExpenseCategoryBadge

| Category | Color |
|----------|-------|
| MAINTENANCE | amber |
| INSURANCE | blue |
| TAX | purple |
| UTILITY | teal |
| MANAGEMENT_FEE | `outline` |
| REPAIR | red |
| IMPROVEMENT | green |
| OTHER | `outline` (gray) |

### Acceptance Criteria

- [ ] "Expenses" appears in sidebar navigation
- [ ] Expense list shows all expenses with filters and pagination
- [ ] Summary cards show monthly totals by property
- [ ] Create form validates and submits to API
- [ ] Edit form pre-fills and submits partial update
- [ ] Delete confirmation dialog works
- [ ] Receipt upload works (file picker → blob upload → confirm)
- [ ] Receipt preview displays on detail page
- [ ] Property detail page shows recent expenses
- [ ] `next build` passes

---

## Task 7: ~~DEFERRED TO SPRINT 13~~ — Vendor & Audit Log Pages — Web Dashboard (Web Agent)

### Objective

Build the vendor management pages and audit log viewer on the web dashboard. Add "Vendors" to settings (or as a nav item). Add audit log viewer to the settings area.

### Dependencies

- Task 4 (vendor API endpoints)
- Task 5 (audit log API endpoints)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/hooks/use-vendors.ts` | Create | TanStack Query hooks for vendors |
| `apps/web/src/hooks/use-audit-logs.ts` | Create | TanStack Query hooks for audit logs |
| `apps/web/src/app/(dashboard)/vendors/page.tsx` | Create | Vendor list page |
| `apps/web/src/app/(dashboard)/vendors/new/page.tsx` | Create | Create vendor page |
| `apps/web/src/app/(dashboard)/vendors/[id]/page.tsx` | Create | Vendor detail page |
| `apps/web/src/app/(dashboard)/vendors/[id]/edit/page.tsx` | Create | Edit vendor page |
| `apps/web/src/components/vendors/vendor-form.tsx` | Create | Shared create/edit form |
| `apps/web/src/components/vendors/vendor-specialty-badge.tsx` | Create | Specialty badge |
| `apps/web/src/app/(dashboard)/settings/audit-log/page.tsx` | Create | Audit log viewer |
| `apps/web/src/components/audit/audit-log-table.tsx` | Create | Audit log table component |
| `apps/web/src/components/audit/audit-action-badge.tsx` | Create | Action badge |
| `apps/web/src/components/audit/audit-resource-badge.tsx` | Create | Resource type badge |
| `apps/web/src/components/layout/app-sidebar.tsx` | Modify | Add Vendors nav item |
| `apps/web/src/app/(dashboard)/maintenance/[id]/page.tsx` | Modify | Show assigned vendor info + vendor selector |

### Requirements

#### Sidebar Update

Add "Vendors" to `mainNavItems` after "Documents":
```typescript
{ title: "Vendors", href: "/vendors", icon: HardHat },  // or Users2 from lucide
```

Add "Audit Log" to `bottomNavItems` alongside Settings:
```typescript
{ title: "Audit Log", href: "/settings/audit-log", icon: ScrollText },
```

#### Vendor Pages

Follow the property pages pattern:

**Vendor List:**
- Page header: "Vendors" title + "Add Vendor" button
- Filter: specialty dropdown (from `MAINTENANCE_CATEGORY_LABELS`), search input
- Table: Name, Specialty, Phone, Email, Actions
- Specialty column: badge using `MAINTENANCE_CATEGORY_LABELS` with color coding (reuse maintenance category colors)

**Vendor Form:**
- Name (text, required)
- Specialty (select from `MaintenanceCategory` enum, required)
- Phone (text, optional)
- Email (text, optional, validated)
- Notes (textarea, optional)
- Validates with shared Zod schemas

**Vendor Detail:**
- Info card: name, specialty badge, phone, email, notes
- Assigned maintenance requests section: list of open/in-progress requests assigned to this vendor

**Delete dialog:** Shows warning if vendor has open requests (the API will return 409 — show the error message).

#### Maintenance Detail — Vendor Integration

Modify `apps/web/src/app/(dashboard)/maintenance/[id]/page.tsx`:
- If `vendorId` is set, show vendor info card (name, specialty, phone, email)
- Add "Assign Vendor" dropdown/dialog allowing manager to select a vendor (filtered by matching specialty to request category) or clear the assignment
- On assignment: call `PATCH /maintenance-requests/:id/status` with `{ vendorId }` (can be sent alongside or without a status change)

#### Audit Log Viewer

**`apps/web/src/app/(dashboard)/settings/audit-log/page.tsx`:**

- Page header: "Audit Log"
- Filter bar: resource type dropdown (`AUDIT_RESOURCE_TYPE_LABELS`), action dropdown (`AUDIT_ACTION_LABELS`), date range picker
- Table columns: Timestamp, Actor, Action, Resource Type, Resource ID, Details
  - Timestamp: formatted date/time
  - Actor: actor ID (future enhancement: resolve to name)
  - Action: `AuditActionBadge` (color-coded: CREATE=green, UPDATE=blue, DELETE=red, STATUS_CHANGE=amber)
  - Resource Type: `AuditResourceBadge`
  - Resource ID: clickable link to the resource detail page (construct URL from resourceType + resourceId)
  - Details: expand row to show metadata JSON (collapsible)
- Pagination
- Empty state: "No audit logs yet."

This page is also accessible from property/lease/maintenance detail pages via a "View Audit Trail" link that navigates to `/settings/audit-log?resourceType=PROPERTY&resourceId=<id>`.

#### Add "View Audit Trail" links to detail pages

Modify the following detail pages to add a small "Audit Trail" link (text link, not a button) that navigates to the filtered audit log:
- `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` → `/settings/audit-log?resourceType=PROPERTY&resourceId=<id>`
- `apps/web/src/app/(dashboard)/leases/[id]/page.tsx` → `/settings/audit-log?resourceType=LEASE&resourceId=<id>`
- `apps/web/src/app/(dashboard)/maintenance/[id]/page.tsx` → `/settings/audit-log?resourceType=MAINTENANCE_REQUEST&resourceId=<id>`

### Acceptance Criteria

- [ ] "Vendors" appears in sidebar navigation
- [ ] Vendor CRUD works end-to-end (list, create, view, edit, delete)
- [ ] Delete shows error when vendor has open maintenance requests
- [ ] Maintenance detail shows assigned vendor info
- [ ] Vendor assignment works from maintenance detail page
- [ ] Audit log viewer shows filterable, paginated log entries
- [ ] Action and resource type badges render with correct colors
- [ ] Metadata is viewable (expandable row or modal)
- [ ] Resource ID links navigate to detail pages
- [ ] "View Audit Trail" links on property/lease/maintenance detail pages work
- [ ] `next build` passes

---

## Task 8: Module Wiring & Registration (Backend Agent)

### Objective

Register all new repositories, use cases, and controllers in the NestJS modules. This is listed as a separate task because it touches `database.module.ts` and `http.module.ts` which are shared across all backend tasks.

### Dependencies

- Tasks 3, 4, 5 (all domain/infra code must exist)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/database/database.module.ts` | Modify | Register ExpensesRepository, VendorsRepository, AuditLogsRepository |
| `apps/api/src/infra/http/http.module.ts` | Modify | Register all new controllers (10 expense + 5 vendor + 2 audit) and use cases |

### Requirements

**database.module.ts** — add to providers and exports:
```typescript
{ provide: ExpensesRepository, useClass: PrismaExpensesRepository },
{ provide: VendorsRepository, useClass: PrismaVendorsRepository },
{ provide: AuditLogsRepository, useClass: PrismaAuditLogsRepository },
```

**http.module.ts** — add all new controllers and use cases. Route ordering:
- `GetExpenseSummaryController` BEFORE `GetExpenseByIdController` (avoid `summary` matching `:id`)
- `GetAuditLogsByResourceController` can use a compound path and doesn't conflict

### Acceptance Criteria

- [ ] `npm run start:dev` starts without dependency injection errors
- [ ] All new endpoints appear in Swagger UI under correct tags (Expenses, Vendors, Audit Logs)
- [ ] `tsc --noEmit` passes
- [ ] Existing tests still pass

---

## Implementation Order

```
Task 1 ──> Task 2 ──> Task 3 ──> Task 8
(Shared)   (Prisma)   (Expense    (Module
                       Domain)     Wiring)
               │
               ├─────> Task 4
               │       (Vendor Domain)
               │
               └─────> Task 5
                       (Audit Domain)

Task 6 ─────────────────────── (after Task 3 + 8)
(Expense Web)

Task 7 ─────────────────────── (after Tasks 4, 5 + 8)
(Vendor + Audit Web)
```

**Parallel work:**
- **Task 1** first (shared package — everything depends on it)
- **Task 2** depends on Task 1
- **Tasks 3, 4, 5** can run in parallel after Task 2 (independent domain contexts)
- **Task 8** after Tasks 3, 4, 5 (registers everything)
- **Task 6** after Tasks 3 + 8 (needs expense API)
- **Task 7** after Tasks 4, 5 + 8 (needs vendor and audit APIs)

**Recommended execution:**
1. **Task 1** (shared package)
2. **Task 2** (Prisma migration)
3. **Tasks 3, 4, 5** in parallel (3 independent domain/infra implementations)
4. **Task 8** (wiring)
5. **Tasks 6, 7** in parallel (web pages)

---

## Human Action Items

### Environment Variables

**NONE** — no new env vars needed. Expense receipts use existing blob storage config. No new external services.

### Database Migration

The builder agent will run `npx prisma migrate dev --name sprint11_enterprise_features`. This is additive (3 new tables, 1 new column on MaintenanceRequest) — no destructive changes. No manual SQL edits needed.

---

## Status

**Backend: COMPLETE.** Tasks 1–5 and 8 are done. All API endpoints, Prisma models, use cases, controllers, mappers, presenters, and unit tests are implemented and passing. Audit logging covers CREATE, UPDATE, and DELETE actions across all new controllers.

**Frontend: DEFERRED.** Tasks 6 and 7 (web dashboard pages) have been split into separate sprints to avoid timeout:
- **Sprint 12** — Expense web pages (Task 6)
- **Sprint 13** — Vendor + Audit Log web pages (Task 7)

---

## Definition of Done (Backend Only — this sprint)

Sprint 11 is complete when:

1. `cd apps/api && npx tsc --noEmit` passes
2. `cd apps/api && npm run test` passes (all existing + new use case tests)
3. `cd apps/api && npm run start:dev` starts without errors
4. Swagger UI shows all new endpoints under Expenses (8), Vendors (5), and Audit Logs (2) tags
5. No regressions in existing functionality
6. No mobile changes (mobile is unchanged in this sprint)
