# Sprint 17: Business Logic Integrity & Scheduler Hardening

## Overview

This sprint resolves the HIGH-severity business logic issues from the [codebase audit](../AUDIT_ISSUES.md) — broken schedulers, timezone bugs, payment duplication, Stripe webhook failures, and missing authorization checks. These are correctness and reliability issues that affect rent collection, lease lifecycle, and data integrity in production.

**Goal:** The scheduler reliably activates leases and sends rent reminders. Date comparisons are timezone-safe. Payments cannot be duplicated. Stripe webhook failures are tracked. Authorization gaps on lease and audit-log endpoints are closed. Domain entities enforce valid status transitions.

**Scope:** Backend only (`apps/api`). No web or mobile changes.

---

## What Exists

| Layer | Status |
|-------|--------|
| **Scheduler** | `payment-scheduler.service.ts` runs three crons: `ActivateUpcomingPayments` (midnight), `GenerateAllLeasePayments` (00:05), `MarkOverduePayments` (00:30). All gated by `SCHEDULER_ENABLED` env var. |
| **Lease Activation** | `ActivatePendingLeasesUseCase` exists in `domain/lease-management/application/use-cases/` but is **not called by any scheduler**. Leases stay PENDING past their start date. |
| **Rent Reminders** | `SendRentDueRemindersUseCase` exists but is **not called by any scheduler**. Tenants never receive automatic rent-due reminders. |
| **Date Handling** | Five use cases use `new Date()` with `setHours(0,0,0,0)` (local timezone) for date comparisons. Server timezone affects which day "today" is. |
| **Payment Generation** | `RenewLeaseUseCase` generates payments on auto-activate. `UpdateLeaseStatusUseCase` also generates payments on PENDING→ACTIVE. If both run, payments can be generated twice (fragile dedup). |
| **Stripe Webhook** | `stripe-webhook.controller.ts` catches errors, logs `console.error()`, and always returns `{ received: true }`. Failed webhook processing is invisible — payments may stay unpaid in the database despite Stripe success. |
| **Lease Retrieval** | `GetLeaseByIdUseCase` and `PrismaLeasesRepository.findById()` return any lease with no ownership filter. Any employee can view leases for properties they don't manage. |
| **Audit Logs** | `GetAuditLogsByResourceController` accepts any `resourceId` with no ownership verification. Any employee can view audit trails for any resource. |
| **Folder Summary** | `GetFolderSummaryController` returns ALL documents globally for employees, with no manager/property scoping. |
| **Payment Entity** | `payment.ts` status setter accepts any `PaymentStatusType` — no transition validation. Invalid transitions (e.g., PAID→PENDING) possible if entity is used outside intended use cases. |
| **Property Entity** | `property.ts` status setter has the same issue — any `PropertyStatusType` accepted without transition check. |
| **Renewal** | `RenewLeaseUseCase` skips the "one active lease per tenant" check that `CreateLeaseUseCase` enforces. |

---

## Architectural Decisions

1. **Extend existing scheduler service** — Add lease activation and rent reminder crons to `payment-scheduler.service.ts` (or rename to a general `scheduler.service.ts`). Don't create a separate scheduler service — one service with all crons is simpler to manage and already has the `SCHEDULER_ENABLED` gate.

2. **UTC everywhere for date comparisons** — Replace all `setHours(0,0,0,0)` with `setUTCHours(0,0,0,0)`. This is a targeted find-and-replace in five files. No schema or data migration needed — dates in Postgres are already stored as UTC.

3. **Guard payment generation at the use-case level** — In `UpdateLeaseStatusUseCase`, only generate payments when transitioning from PENDING and when payments don't already exist for the lease. Check `paymentRepository.findMany({ leaseId })` before calling `GenerateLeasePaymentsUseCase`.

4. **Structured webhook error logging via NestJS Logger** — Replace `console.error()` with the NestJS `Logger` service and add a `FailedWebhook` Prisma model to persist failed webhook events for manual review/retry. This creates a durable audit trail without blocking Stripe's retry mechanism.

5. **Ownership checks in use cases, not controllers** — Move authorization logic into use cases by adding `requestingUserId` / `requestingManagerId` parameters. This ensures all code paths (not just HTTP controllers) enforce ownership. Follow the pattern established by `GetVendorByIdUseCase` which checks `vendor.managerId === request.managerId`.

6. **Entity-level status validation via transition maps** — Add a `VALID_TRANSITIONS` map to `Payment` and `Property` entities. The status setter checks the map and throws a domain error on invalid transitions. This makes the entities self-protecting regardless of which use case calls them.

---

## Task 1: Scheduler Completion — Lease Activation & Rent Reminders

### Audit Issues Resolved
- **BIZ-2**: No auto-activation scheduler for PENDING leases
- **BIZ-3**: Missing rent reminder in scheduler

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/scheduler/payment-scheduler.service.ts` | Modify | Add two new cron methods |

### Requirements

#### Lease Auto-Activation Cron

- Schedule: `@Cron('0 0 * * *')` — run at midnight, before payment activation
- Call `ActivatePendingLeasesUseCase.execute()`
- Log result: number of leases activated
- Gate behind existing `SCHEDULER_ENABLED` env check

#### Rent Due Reminder Cron

- Schedule: `@Cron('0 8 * * *')` — run at 8 AM daily
- Call `SendRentDueRemindersUseCase.execute()`
- Log result: number of reminders sent
- Gate behind existing `SCHEDULER_ENABLED` env check

#### Cron Ordering

Update the midnight crons to run in logical order:
1. `0 0 * * *` — Activate pending leases (so they become ACTIVE before payments are processed)
2. `1 0 * * *` — Activate upcoming payments
3. `5 0 * * *` — Generate lease payments
4. `30 0 * * *` — Mark overdue payments
5. `0 8 * * *` — Send rent due reminders

### Patterns to Follow

- Existing cron methods in `payment-scheduler.service.ts` — same structure with try/catch, logging, and `SCHEDULER_ENABLED` gate
- Inject `ActivatePendingLeasesUseCase` and `SendRentDueRemindersUseCase` via constructor

### Acceptance Criteria

- `ActivatePendingLeasesUseCase` is called daily at midnight
- `SendRentDueRemindersUseCase` is called daily at 8 AM
- Both are gated by `SCHEDULER_ENABLED`
- Lease activation runs before payment activation

### Test Cases

1. Scheduler calls `ActivatePendingLeasesUseCase` when `SCHEDULER_ENABLED=true`
2. Scheduler calls `SendRentDueRemindersUseCase` when `SCHEDULER_ENABLED=true`
3. Neither use case is called when `SCHEDULER_ENABLED=false`

---

## Task 2: Date & Payment Integrity Fixes

### Audit Issues Resolved
- **BIZ-4**: Timezone-naive date comparisons
- **BIZ-5**: Payment generation can be called twice on renewal

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/lease-management/application/use-cases/create-lease.ts` | Modify | `setHours` → `setUTCHours` |
| `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts` | Modify | `setHours` → `setUTCHours` |
| `apps/api/src/domain/lease-management/application/use-cases/update-lease-status.ts` | Modify | `setHours` → `setUTCHours` + payment dedup guard |
| `apps/api/src/domain/payment/application/use-cases/activate-upcoming-payments.ts` | Modify | `setHours` → `setUTCHours` |
| `apps/api/src/domain/payment/application/use-cases/mark-overdue-payments.ts` | Modify | `setHours` → `setUTCHours` |

### Requirements

#### Timezone Fix (BIZ-4)

In all five files listed above, replace every instance of:
```
setHours(0, 0, 0, 0)
```
with:
```
setUTCHours(0, 0, 0, 0)
```

This is a targeted replacement — no other logic changes needed.

#### Payment Dedup Guard (BIZ-5)

In `update-lease-status.ts`, before calling `GenerateLeasePaymentsUseCase` on PENDING→ACTIVE transition:

1. Check if payments already exist for this lease (query `paymentRepository.findMany({ leaseId })`)
2. Only call `GenerateLeasePaymentsUseCase` if no payments exist
3. This prevents the double-generation scenario when `RenewLeaseUseCase` auto-activates and generates payments, then `UpdateLeaseStatusUseCase` is called again

### Patterns to Follow

- Existing `paymentRepository.findMany()` call pattern used in other use cases
- Keep the `setUTCHours` fix purely mechanical — don't restructure date logic

### Acceptance Criteria

- All date comparisons use UTC hours
- Activating an already-payment-generated lease does not create duplicate payments
- Existing lease creation, renewal, payment activation, and overdue detection still work correctly

### Test Cases

1. `CreateLeaseUseCase` compares dates using UTC (mock `new Date()` to verify)
2. `UpdateLeaseStatusUseCase` skips payment generation when payments already exist for the lease
3. `UpdateLeaseStatusUseCase` generates payments when transitioning PENDING→ACTIVE with no existing payments

---

## Task 3: Stripe Webhook Resilience

### Audit Issues Resolved
- **BIZ-6**: Stripe webhook silently swallows errors

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/prisma/schema.prisma` | Modify | Add `FailedWebhook` model |
| `apps/api/src/infra/http/controllers/stripe-webhook/stripe-webhook.controller.ts` | Modify | Structured error handling + persist failures |

### Requirements

#### FailedWebhook Prisma Model

Add to `schema.prisma`:

```
model FailedWebhook {
  id              String   @id @default(uuid())
  eventId         String
  eventType       String
  payload         Json
  errorMessage    String
  createdAt       DateTime @default(now())
}
```

Run `npx prisma generate` (no migration needed for dev — the builder should generate the migration).

#### Webhook Controller Changes

1. Replace `console.error()` with NestJS `Logger` (`this.logger.error(...)`)
2. In the catch block, persist the failed event to the `FailedWebhook` table:
   - `eventId`: `event.id`
   - `eventType`: `event.type`
   - `payload`: `event.data.object` (the session object)
   - `errorMessage`: `error.message`
3. Continue returning `{ received: true }` — we still don't want to block Stripe retries
4. Add a `Logger` instance: `private readonly logger = new Logger(StripeWebhookController.name)`

### Patterns to Follow

- NestJS `Logger` usage pattern from other services in the codebase
- Prisma direct access in controller (same pattern as session management endpoints from Sprint 16)

### Acceptance Criteria

- Failed webhook events are persisted to the `FailedWebhook` table
- Errors are logged via NestJS Logger (not `console.error`)
- Successful webhooks continue to work as before
- Controller still returns `{ received: true }` in all cases (no Stripe retry disruption)

### Test Cases

1. Successful webhook processes payment and returns `{ received: true }`
2. Failed webhook persists to `FailedWebhook` table and still returns `{ received: true }`
3. `FailedWebhook` record contains correct `eventId`, `eventType`, and `errorMessage`

---

## Task 4: Authorization Gap Closure

### Issues Resolved
- Lease retrieval has no ownership filter (from auth audit)
- Audit log endpoint has no ownership check (from auth audit)
- Folder summary too permissive for employees (from auth audit)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/lease-management/application/use-cases/get-lease-by-id.ts` | Modify | Add `requestingUserId` + `requestingUserType` params, verify ownership |
| `apps/api/src/infra/http/controllers/get-lease-by-id/get-lease-by-id.controller.ts` | Modify | Pass user context to use case |
| `apps/api/src/infra/http/controllers/get-audit-logs-by-resource/get-audit-logs-by-resource.controller.ts` | Modify | Add ownership verification before returning logs |
| `apps/api/src/infra/http/controllers/get-folder-summary/get-folder-summary.controller.ts` | Modify | Scope employee results to their managed properties' clients |

### Requirements

#### Lease Ownership Check

In `GetLeaseByIdUseCase`:
1. Add `requestingUserId` and `requestingUserType` (CLIENT or EMPLOYEE) to the request interface
2. After fetching the lease:
   - If CLIENT: verify `lease.tenantId === requestingUserId`, otherwise return `ForbiddenError`
   - If EMPLOYEE: verify the lease's property belongs to the requesting manager (check `property.managerId === requestingUserId`), otherwise return `ForbiddenError`
3. Update the controller to pass `user.id` and `user.type` from `@CurrentUser()`

#### Audit Log Ownership Check

In `GetAuditLogsByResourceController`:
1. Before returning audit logs, verify the requesting employee owns the resource being audited
2. Accept `resourceType` as a query param alongside `resourceId`
3. Based on `resourceType`, look up the resource and verify `managerId` ownership:
   - `property`: check `property.managerId === user.id`
   - `lease`: check via `lease → property → managerId === user.id`
   - `expense`: check `expense.managerId === user.id` (expenses already have managerId)
   - `vendor`: check `vendor.managerId === user.id`
4. Return 403 if ownership check fails

#### Folder Summary Scoping

In `GetFolderSummaryController`:
1. For EMPLOYEE users, pass `managerId` to the use case
2. The use case should filter documents to only those belonging to clients who have leases on the manager's properties
3. For CLIENT users, behavior is unchanged (already scoped to their own documents)

### Patterns to Follow

- `GetVendorByIdUseCase` ownership pattern: fetch entity, compare `managerId`, return error on mismatch
- `@CurrentUser()` decorator for extracting user context
- Existing `ForbiddenException` usage in controllers

### Acceptance Criteria

- CLIENT users can only view their own leases
- EMPLOYEE users can only view leases for properties they manage
- Audit logs require ownership of the audited resource
- Folder summary returns only managed clients' documents for employees
- All existing functionality continues to work for authorized users

### Test Cases

1. `GET /leases/:id` returns 403 when CLIENT requests another tenant's lease
2. `GET /leases/:id` returns 403 when EMPLOYEE requests lease for a property they don't manage
3. `GET /leases/:id` returns 200 for authorized CLIENT (own lease) and EMPLOYEE (managed property)
4. `GET /audit-logs` returns 403 when requesting logs for an unowned resource
5. `GET /documents/folder-summary` returns only managed clients' documents for EMPLOYEE users

---

## Task 5: Domain Entity Safeguards

### Audit Issues Resolved
- **BIZ-7**: Renewal doesn't check tenant for active lease on different property
- **BIZ-8**: Payment status transitions not validated at entity level
- **BIZ-9**: Property status transitions not validated at entity level

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/payment/enterprise/entities/payment.ts` | Modify | Add transition validation to status setter |
| `apps/api/src/domain/property-management/enterprise/entities/property.ts` | Modify | Add transition validation to status setter |
| `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts` | Modify | Add active lease check for tenant |

### Requirements

#### Payment Status Transitions (BIZ-8)

Add a `VALID_TRANSITIONS` map to the `Payment` entity:

| From | Allowed To |
|------|-----------|
| `UPCOMING` | `ACTIVE` |
| `ACTIVE` | `PAID`, `OVERDUE` |
| `OVERDUE` | `PAID` |
| `PAID` | (none — terminal) |

The status setter should:
1. If current status is undefined/null (new entity), allow any status
2. If current status is set, validate the transition against the map
3. Throw `InvalidPaymentStatusTransitionError` (new domain error) on invalid transition

#### Property Status Transitions (BIZ-9)

Add a `VALID_TRANSITIONS` map to the `Property` entity:

| From | Allowed To |
|------|-----------|
| `VACANT` | `LISTED`, `OCCUPIED` |
| `LISTED` | `VACANT`, `OCCUPIED` |
| `OCCUPIED` | `VACANT` |
| `MAINTENANCE` | `VACANT`, `LISTED` |

Same setter pattern as Payment — validate and throw `InvalidPropertyStatusTransitionError`.

#### Renewal Active Lease Check (BIZ-7)

In `RenewLeaseUseCase`, before creating the renewed lease:
1. Check for any ACTIVE lease for the same tenant (excluding the original lease being renewed)
2. Use the existing `leasesRepository.findMany({ tenantId, status: 'ACTIVE' })` pattern
3. If an active lease exists (on any property), return an error: `TenantHasActiveLeaseError`
4. This matches the validation already in `CreateLeaseUseCase`

### Patterns to Follow

- Domain error classes in `apps/api/src/domain/*/application/use-cases/errors/` — each is a simple class extending `UseCaseError`
- Entity setter pattern already established in both entities
- Active lease check pattern from `CreateLeaseUseCase`

### Acceptance Criteria

- `Payment` entity rejects invalid status transitions (e.g., PAID→PENDING throws)
- `Property` entity rejects invalid status transitions (e.g., OCCUPIED→LISTED throws)
- New entities (no current status) can be set to any initial status
- Lease renewal fails if tenant has an active lease on a different property
- Existing valid transitions continue to work

### Test Cases

1. Payment: ACTIVE→PAID succeeds
2. Payment: PAID→PENDING throws `InvalidPaymentStatusTransitionError`
3. Payment: new entity can be set to any status
4. Property: VACANT→LISTED succeeds
5. Property: OCCUPIED→LISTED throws `InvalidPropertyStatusTransitionError`
6. Renewal: fails with `TenantHasActiveLeaseError` when tenant has active lease on another property
7. Renewal: succeeds when tenant's only active lease is the one being renewed

---

## API Response Contracts

No new API endpoints are introduced in this sprint. All changes are to existing endpoint behavior:

- **Lease by ID**: Unchanged response shape. New 403 response when unauthorized.
- **Audit logs**: Unchanged response shape. New 403 response when unauthorized.
- **Folder summary**: Unchanged response shape. Reduced result set for employees (scoped to managed clients).
- **Stripe webhook**: Unchanged response (`{ received: true }`). Side effect: failed events persisted to `FailedWebhook` table.

---

## Implementation Order

```
Task 2 (Date & Payment Integrity — standalone fixes, no dependencies)
  ↓
Task 1 (Scheduler — depends on Task 2 for correct UTC date handling in activated leases)
  ↓
Task 5 (Entity Safeguards — standalone, but should be in place before Task 4 changes use cases)
  ↓
Task 4 (Authorization — modifies use cases, should build on corrected entities)
  ↓
Task 3 (Webhook Resilience — requires Prisma migration, run last to avoid migration conflicts)
```

Tasks 2 and 5 are independent and can run in parallel. Task 3 is independent of Tasks 4 and 5.

---

## Human Action Items

- **Run Prisma migration** after Task 3: `cd apps/api && npx prisma migrate dev --name add-failed-webhook` to create the `FailedWebhook` table
- No new env vars (uses existing `SCHEDULER_ENABLED`)
- No new package dependencies

---

## Definition of Done

1. `cd apps/api && npx nest build` passes
2. Scheduler runs 5 crons in correct order: lease activation → payment activation → payment generation → overdue detection → rent reminders
3. All date comparisons use `setUTCHours(0,0,0,0)` — no local timezone dependencies
4. Activating a lease that already has generated payments does not create duplicates
5. Failed Stripe webhook events are persisted to `FailedWebhook` table with event details
6. `GET /leases/:id` returns 403 for unauthorized users (both CLIENT and EMPLOYEE)
7. `GET /audit-logs` returns 403 when requesting logs for resources the employee doesn't own
8. Folder summary returns only managed clients' documents for employees
9. Payment entity rejects invalid status transitions
10. Property entity rejects invalid status transitions
11. Lease renewal rejects when tenant has an active lease on another property
