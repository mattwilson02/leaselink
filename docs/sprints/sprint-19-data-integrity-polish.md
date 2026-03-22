# Sprint 19: Data Integrity & Domain Polish

## Overview

With all CRITICAL and HIGH audit issues resolved (Sprints 16–17), API contracts standardized (Sprint 18), and every core feature delivered, this sprint addresses the remaining LOW-severity audit findings and domain gaps. These are correctness and robustness improvements: lease duration validation (IMP-1), Stripe session ID leakage (IMP-3), early termination fee support (IMP-4), domain-specific upload errors (IMP-5), and hardcoded status strings in the web frontend (IMP-2).

**Goal:** Close all remaining audit issues. Lease creation rejects unreasonable durations. Payment responses no longer expose internal Stripe identifiers. Early lease termination incurs a configurable fee. Upload failures return actionable domain errors. Web components import status enums from the shared package.

**Scope:** `apps/api` (entities, use cases, presenters), `apps/web` (components), `packages/shared` (validation schemas, constants). No mobile changes. No new endpoints.

---

## What Exists

| Area | Current State |
|------|--------------|
| **Lease Duration** | `createLeaseSchema` in `packages/shared/src/validation/lease.schema.ts` validates `endDate > startDate` via `.refine()` but allows 1-day or 50-year leases. `CreateLeaseUseCase` accepts any date range that passes schema validation. |
| **Stripe Session ID** | `HttpPaymentPresenter` (`apps/api/src/infra/http/presenters/http-payment-presenter.ts`) includes `stripeCheckoutSessionId` in every payment response. Frontend clients never use this value — it exists solely for webhook correlation. |
| **Early Termination** | `Lease` entity has no `earlyTerminationFee` field. `UpdateLeaseStatusUseCase` handles TERMINATED transitions by setting property to VACANT and deleting unpaid payments, but applies no financial penalty. |
| **Upload Errors** | `UploadPropertyPhotosUseCase` returns generic `Error` for photo limit exceeded (line 41). `StorageRepository.generateUploadUrl` returns generic `Error` on blob storage failures. Only `BlobDoesNotExistError` exists as a domain-specific storage error. |
| **Hardcoded Status Strings** | `apps/web/src/components/leases/lease-form.tsx` (line 106) uses `"LISTED"` and `"VACANT"` string literals instead of importing `PropertyStatus` from `@leaselink/shared`. The mobile app uses generated API types (in `src/gen/`) and does not import enums directly from shared. All API-side code already uses shared enums correctly. |

---

## Architectural Decisions

1. **Lease duration bounds in shared Zod schema** — Add `MIN_LEASE_DURATION_DAYS` and `MAX_LEASE_DURATION_DAYS` constants to `@leaselink/shared` and add a `.refine()` to the lease schemas. This catches invalid durations at the API boundary (controller validation) so the use case never sees them. No entity-level changes needed.

2. **Strip Stripe internals at the presenter layer** — Remove `stripeCheckoutSessionId` from `HttpPaymentPresenter` and `PaymentHttpResponse`. The webhook controller already correlates via database lookup — the frontend never needs this value. This is a deletion, not a new abstraction.

3. **Early termination fee as an optional lease field** — Add `earlyTerminationFee` (nullable decimal) to the `Lease` entity, Prisma schema, shared DTOs, and creation flow. The `UpdateLeaseStatusUseCase` records the fee when transitioning to TERMINATED before the end date. This is a data field — no payment generation or Stripe charge logic in this sprint.

4. **Domain error classes for upload failures** — Replace generic `Error` returns with specific domain error classes following the existing `UseCaseError` pattern. Map each to the appropriate HTTP status in the controller's error handler.

5. **Web enum imports from shared** — The web app does not currently import from `@leaselink/shared`. Add the dependency and replace hardcoded status strings with enum references. This is a small change (only `lease-form.tsx` uses hardcoded status strings) but establishes the pattern for future web development.

---

## Task 1: Lease Duration Validation

### Audit Issues Resolved
- **IMP-1**: No lease duration validation

### Files to Create

| File | Purpose |
|------|---------|
| `packages/shared/src/constants/lease.ts` | `MIN_LEASE_DURATION_DAYS` (30) and `MAX_LEASE_DURATION_DAYS` (1825 = 5 years) constants |

### Files to Modify

| File | Change |
|------|--------|
| `packages/shared/src/constants/index.ts` | Export new lease constants |
| `packages/shared/src/validation/lease.schema.ts` | Add `.refine()` checks for min/max duration using the new constants |
| `packages/shared/src/validation/__tests__/schemas.test.ts` | Add test cases for duration bounds |

### Requirements

1. Add constants `MIN_LEASE_DURATION_DAYS = 30` and `MAX_LEASE_DURATION_DAYS = 1825` to a new `lease.ts` constants file
2. In both `createLeaseSchema` and `editLeaseSchema`, add a `.refine()` that calculates the difference in days between `endDate` and `startDate` and rejects values outside the bounds
3. Error messages should be descriptive: `"Lease duration must be at least 30 days"` and `"Lease duration cannot exceed 5 years"`
4. The existing `endDate > startDate` refine must remain

### Patterns to Follow

- Existing constants in `packages/shared/src/constants/` (e.g., `MAX_PROPERTY_PHOTOS`)
- Existing `.refine()` pattern in `lease.schema.ts` for the `endDate > startDate` check

### Acceptance Criteria

- `createLeaseSchema` rejects leases shorter than 30 days
- `createLeaseSchema` rejects leases longer than 5 years
- `editLeaseSchema` applies the same bounds
- Constants are importable from `@leaselink/shared`
- Existing schema tests still pass

### Test Cases

1. Lease with 29-day duration fails validation with descriptive message
2. Lease with 30-day duration passes validation
3. Lease with 1825-day (5 year) duration passes validation
4. Lease with 1826-day duration fails validation with descriptive message
5. Existing `endDate > startDate` test still passes

---

## Task 2: Remove Stripe Session ID from Payment Responses

### Audit Issues Resolved
- **IMP-3**: Stripe session ID exposed in payment API response

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/infra/http/presenters/http-payment-presenter.ts` | Remove `stripeCheckoutSessionId` from `PaymentHttpResponse` interface and `toHTTP()` return |
| `packages/shared/src/types/payment.ts` | Remove `stripeCheckoutSessionId` from payment type if present |
| `packages/shared/src/dto/payment.dto.ts` | Remove `stripeCheckoutSessionId` from payment DTO if present |

### Requirements

1. Delete `stripeCheckoutSessionId` from the `PaymentHttpResponse` interface
2. Delete the `stripeCheckoutSessionId` line from the `toHTTP()` method
3. Remove from shared types/DTOs if present
4. Verify no web or mobile code reads `stripeCheckoutSessionId` from API responses (it is only used server-side for webhook correlation)

### Patterns to Follow

- The presenter is the single point where entity fields are mapped to HTTP response fields — removing a field here removes it from all payment endpoints

### Acceptance Criteria

- `GET /payments`, `GET /payments/:id`, and `GET /payments-by-tenant` responses no longer include `stripeCheckoutSessionId`
- Stripe webhook processing continues to work (it reads from the database entity, not the HTTP response)
- API builds successfully
- Existing E2E tests pass (update any that assert on `stripeCheckoutSessionId`)

### Test Cases

1. `GET /payments/:id` response body does not contain `stripeCheckoutSessionId` key
2. Stripe checkout session creation and webhook processing still work end-to-end

---

## Task 3: Early Termination Fee Field

### Audit Issues Resolved
- **IMP-4**: No early termination fee logic

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `earlyTerminationFee Float?` to `Lease` model |
| `apps/api/src/domain/lease-management/enterprise/entities/lease.ts` | Add `earlyTerminationFee` property (nullable number) with getter/setter |
| `apps/api/src/domain/lease-management/application/use-cases/create-lease.ts` | Accept optional `earlyTerminationFee` in request, pass to `Lease.create()` |
| `apps/api/src/domain/lease-management/application/use-cases/update-lease-status.ts` | On ACTIVE→TERMINATED transition: if `endDate > today` (early termination), log the fee amount in the audit trail |
| `apps/api/src/infra/http/presenters/http-lease-presenter.ts` | Include `earlyTerminationFee` in lease response |
| `packages/shared/src/types/lease.ts` | Add `earlyTerminationFee?: number \| null` |
| `packages/shared/src/dto/lease.dto.ts` | Add `earlyTerminationFee` to create/edit DTOs |
| `packages/shared/src/validation/lease.schema.ts` | Add optional `earlyTerminationFee: z.number().min(0).optional()` to create/edit schemas |
| `apps/api/src/infra/database/prisma/mappers/prisma-lease-mapper.ts` | Map `earlyTerminationFee` between Prisma and domain entity |

### Requirements

1. Add `earlyTerminationFee` as a nullable float field to the Prisma `Lease` model
2. Add getter/setter to `Lease` entity — follows the same pattern as `securityDeposit`
3. `CreateLeaseUseCase` accepts optional `earlyTerminationFee` and passes it through to the entity
4. `UpdateLeaseStatusUseCase` on TERMINATED: if the lease is being terminated before `endDate`, include the `earlyTerminationFee` value in the audit log entry (via existing `CreateAuditLogUseCase` pattern). No payment generation or Stripe charge — just data recording
5. Lease presenter includes the new field in HTTP responses
6. Shared types and schemas include the new field as optional

### Patterns to Follow

- `securityDeposit` field on `Lease` entity — same nullable number pattern
- `PrismaLeaseMapper` for Prisma ↔ entity field mapping
- Audit log creation pattern from existing `UpdateLeaseStatusUseCase`

### Acceptance Criteria

- Leases can be created with an optional `earlyTerminationFee`
- Lease responses include `earlyTerminationFee` (null when not set)
- Terminating a lease early records the fee in the audit log
- Prisma migration runs successfully
- Existing lease creation and termination flows still work

### Test Cases

1. Create lease with `earlyTerminationFee: 500` — lease entity stores value, API response includes it
2. Create lease without `earlyTerminationFee` — defaults to null
3. Terminate lease early — audit log entry includes early termination fee amount
4. Terminate lease at or after `endDate` — no early termination fee applied

---

## Task 4: Domain-Specific Upload Error Classes

### Audit Issues Resolved
- **IMP-5**: Photo upload limit uses generic error

### Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/domain/property-management/application/use-cases/errors/photo-limit-exceeded-error.ts` | `PhotoLimitExceededError` — thrown when upload would exceed `MAX_PROPERTY_PHOTOS` |
| `apps/api/src/domain/document/application/use-cases/errors/file-upload-failed-error.ts` | `FileUploadFailedError` — wraps blob storage failures with context |

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/domain/property-management/application/use-cases/upload-property-photos.ts` | Replace `new Error(...)` on line 41 with `new PhotoLimitExceededError(currentCount, request.fileNames.length, MAX_PROPERTY_PHOTOS)` |
| `apps/api/src/infra/blob-storage/repositories/blob-storage-repository.ts` | Replace generic `Error` in `generateUploadUrl` with `new FileUploadFailedError(blobKey, error.message)` |
| `apps/api/src/infra/http/controllers/upload-property-photos/upload-property-photos.controller.ts` | Add case for `PhotoLimitExceededError` → 422 Unprocessable Entity |
| `apps/api/src/infra/http/controllers/upload-document/upload-document.controller.ts` | Add case for `FileUploadFailedError` → 502 Bad Gateway (upstream storage failure) |

### Requirements

1. `PhotoLimitExceededError` extends `Error implements UseCaseError` — constructor takes `currentCount`, `attemptedCount`, `maxAllowed` and builds a descriptive message
2. `FileUploadFailedError` extends `Error implements UseCaseError` — constructor takes `blobKey` and `reason` for debugging
3. Replace generic `Error` instantiations with the new domain errors
4. Controllers map errors to appropriate HTTP status codes
5. The `UploadPropertyPhotosUseCase` Either type union should include `PhotoLimitExceededError` instead of bare `Error`

### Patterns to Follow

- Existing error classes in `apps/api/src/domain/*/application/use-cases/errors/` — all implement `UseCaseError` interface
- Controller error handling pattern: `if (result.value instanceof SpecificError) { throw new HttpException(...) }`

### Acceptance Criteria

- Exceeding photo limit returns 422 with descriptive message including current count, attempted count, and max
- Blob storage failures return 502 with context about which upload failed
- No generic `Error` class used for upload failures in property or document domains
- All existing upload flows still work for valid requests

### Test Cases

1. Upload photos exceeding `MAX_PROPERTY_PHOTOS` returns 422 with `PhotoLimitExceededError` message
2. Blob storage failure returns 502 with `FileUploadFailedError` context
3. Valid photo upload succeeds unchanged

---

## Task 5: Replace Hardcoded Status Strings in Web App

### Audit Issues Resolved
- **IMP-2**: Hardcoded status strings in frontend

### Files to Modify

| File | Change |
|------|--------|
| `apps/web/package.json` | Add `@leaselink/shared` as a workspace dependency (if not already present) |
| `apps/web/src/components/leases/lease-form.tsx` | Import `PropertyStatus` from `@leaselink/shared` and replace `"LISTED"` / `"VACANT"` string literals with `PropertyStatus.LISTED` / `PropertyStatus.VACANT` |

### Requirements

1. Ensure `@leaselink/shared` is listed as a dependency in `apps/web/package.json` (it may already be — verify before adding)
2. In `lease-form.tsx` line 106, replace:
   - `p.status === "LISTED"` → `p.status === PropertyStatus.LISTED`
   - `p.status === "VACANT"` → `p.status === PropertyStatus.VACANT`
3. Search the full `apps/web/src/` directory for any other hardcoded status string literals and replace with shared enum imports
4. Web app builds successfully after changes

### Patterns to Follow

- API-side code already imports enums from `@leaselink/shared` throughout
- Standard workspace dependency: `"@leaselink/shared": "*"` in `package.json`

### Acceptance Criteria

- No hardcoded status string literals in `apps/web/src/`
- All status comparisons use imported enums from `@leaselink/shared`
- `cd apps/web && npx next build` passes
- Lease form property filtering still works correctly

### Test Cases

1. Lease form still filters properties to only LISTED and VACANT statuses
2. Web build succeeds with shared package dependency

---

## API Response Contracts

No new endpoints. Changes to existing response shapes:

### Payment Responses (all payment endpoints)

**Before:**
```
{
  id, leaseId, tenantId, amount, dueDate, status,
  stripeCheckoutSessionId: string | null,  // REMOVED
  paidAt, createdAt, updatedAt
}
```

**After:**
```
{
  id, leaseId, tenantId, amount, dueDate, status,
  paidAt, createdAt, updatedAt
}
```

### Lease Responses (all lease endpoints)

**Before:**
```
{
  id, propertyId, tenantId, startDate, endDate,
  monthlyRent, securityDeposit, status,
  renewedFromLeaseId, createdAt, updatedAt
}
```

**After:**
```
{
  id, propertyId, tenantId, startDate, endDate,
  monthlyRent, securityDeposit, earlyTerminationFee: number | null,  // NEW
  status, renewedFromLeaseId, createdAt, updatedAt
}
```

### Error Responses (upload endpoints)

**Before:**
```
400 Bad Request — generic error message
```

**After:**
```
422 Unprocessable Entity — "Cannot exceed 10 photos per property. Current: 8, attempting to add: 5."
502 Bad Gateway — "File upload failed for blob key 'properties/123/photos/abc': <storage error>"
```

---

## Implementation Order

```
Task 1 (Lease Duration Validation — shared package only, no API changes)
Task 2 (Remove Stripe Session ID — presenter-only, no dependencies)
Task 5 (Web Enum Imports — web-only, no dependencies)
  ↓
Task 4 (Upload Error Classes — new error files + use case changes)
  ↓
Task 3 (Early Termination Fee — Prisma migration, entity, use case, presenter, shared types)
```

Tasks 1, 2, and 5 are fully independent — run in parallel. Task 4 is independent but best done before Task 3 to avoid migration conflicts. Task 3 runs last as it requires a Prisma migration.

---

## Human Action Items

- **Run Prisma migration** after Task 3: `cd apps/api && npx prisma migrate dev --name add-early-termination-fee`
- No new environment variables
- No new package dependencies (except potentially adding `@leaselink/shared` to web's `package.json`)

---

## Definition of Done

1. `cd apps/api && npx nest build` passes
2. `cd apps/web && npx next build` passes
3. Lease creation rejects durations < 30 days or > 5 years at the schema level
4. Payment API responses do not include `stripeCheckoutSessionId`
5. Leases can be created with an optional `earlyTerminationFee`
6. Early lease termination records the fee in the audit log
7. Photo limit exceeded returns 422 with `PhotoLimitExceededError`
8. Blob storage failures return 502 with `FileUploadFailedError`
9. No hardcoded status string literals in `apps/web/src/`
10. All existing E2E tests pass (with updated assertions where needed)
