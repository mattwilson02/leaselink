# Sprint 8: Scheduled Tasks & Notification Completeness

## Overview

This sprint adds **automated background tasks** and **completes the notification system** across the platform. Currently, all recurring operations — monthly payment generation, overdue payment detection, lease expiry warnings, and rent reminders — require manual manager action via the web dashboard. The product spec describes these as automated behaviors. Additionally, several notification triggers from the product spec (Section 3.8) are defined but never fire: document request creation doesn't notify tenants, document uploads don't notify managers, lease creation doesn't notify tenants, and lease renewals don't notify tenants.

**Goal:** The system automatically generates monthly payments, detects overdue payments, sends lease expiry warnings (60/30/7 days), and sends rent due reminders — all via NestJS scheduled tasks. All notification triggers from the product spec are wired up. Push notification messages include meaningful content (not the current empty body). The web dashboard displays a scheduled tasks status section so managers know automation is running.

**Why this sprint:** All core CRUD features, the dashboard, and the notification infrastructure are complete (Sprints 1–7). But the system is passive — nothing happens automatically. A real property management platform must proactively notify tenants about rent due dates, warn both parties about lease expirations, and generate payment records without manual intervention. This sprint transforms LeaseLink from a CRUD tool into an actively-managed platform.

---

## What Exists (from Sprints 1–7)

| Layer | What's Done |
|-------|-------------|
| **API — Payments** | `GenerateLeasePaymentsUseCase` generates payments for a single lease (current + next month). `MarkOverduePaymentsUseCase` transitions PENDING → OVERDUE after grace period. Both are manually triggered via `POST /payments/generate` and `POST /payments/mark-overdue`. Payment generation also runs as a side effect when a lease is activated. |
| **API — Notifications** | `CreateNotificationUseCase` creates in-app + push notifications. Domain `ActionType` enum has 7 values: `SIGN_DOCUMENT`, `UPLOAD_DOCUMENT`, `BASIC_COMPLETE`, `MAINTENANCE_UPDATE`, `RENT_REMINDER`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`. Missing from domain: `SIGN_LEASE`, `LEASE_EXPIRY`, `INSPECTION_SCHEDULED`, `LEASE_RENEWAL`. Push notification body is hardcoded to empty string `''`. |
| **API — Leases** | `LeasesRepository` with `findMany()` supporting status/date filters. No method to find leases expiring within a date range. |
| **API — Documents** | `CreateDocumentRequestUseCase` and `ConfirmUploadDocumentUseCase` exist but do NOT send notifications. |
| **API — Lease Creation** | `CreateLeaseUseCase` creates a lease but does NOT notify the tenant. |
| **API — Lease Renewal** | `RenewLeaseUseCase` creates a renewal lease but does NOT notify the tenant. |
| **API — Scheduled Tasks** | **None.** No `@nestjs/schedule`, no cron jobs, no Bull/BullMQ queues. |
| **Shared package** | `PAYMENT_GRACE_PERIOD_DAYS` (5), `LEASE_EXPIRY_NOTIFICATION_DAYS` ([60, 30, 7]), all ActionType values defined in enums. |
| **Web** | Dashboard summary endpoint. Manual "Generate Payments" and "Mark Overdue" buttons on payments page. |
| **Mobile** | Full notification list with push support. Notifications display title but push body is empty. |

---

## Architectural Decisions

1. **Use `@nestjs/schedule` for cron jobs.** NestJS has a first-party scheduling module that uses `cron` decorators on service methods. No external queue system (Bull/BullMQ) needed — the scheduled tasks are lightweight and run in-process. Install `@nestjs/schedule` in `apps/api/`.

2. **Scheduled tasks live in a new infra module:** `apps/api/src/infra/scheduler/`. This is infrastructure, not domain logic — the scheduler calls existing use cases. Each scheduled task is a `@Injectable()` service with `@Cron()` decorated methods.

3. **Task scheduling times (UTC):**
   - **Payment generation:** Daily at 00:05 UTC — generates payments for ALL active leases (current + next month). Idempotent via `findExistingForLease`.
   - **Overdue detection:** Daily at 00:30 UTC — marks PENDING payments past grace period as OVERDUE.
   - **Lease expiry check:** Daily at 06:00 UTC — sends notifications for leases expiring within 60/30/7 days. Must track which notifications have already been sent to avoid duplicates.
   - **Rent due reminders:** Daily at 08:00 UTC — sends reminders for PENDING payments due within 3 days.

4. **Lease expiry notification deduplication.** To avoid sending the same "60 days until expiry" notification every day, track sent notifications. Two approaches:
   - **Option A:** Add a `leaseExpiryNotificationsSent` JSON column to the Lease model tracking which intervals were sent (e.g., `[60, 30]`).
   - **Option B:** Check if a notification with `actionType: LEASE_EXPIRY` and `linkedTransactionId: leaseId` already exists within a date range.
   - **Use Option B** — query-based dedup avoids schema changes. The `NotificationRepository` needs a new `existsByActionTypeAndLinkedId` method.

5. **Push notification messages get real content.** Update `CreateNotificationUseCase` to use the notification `text` as the push body instead of empty string. This is a one-line fix in the existing use case.

6. **Missing ActionType values added to domain enum.** Add `SIGN_LEASE`, `LEASE_EXPIRY`, `LEASE_RENEWAL` to the domain `ActionType` enum. `INSPECTION_SCHEDULED` is defined in shared but not needed yet (no inspection feature) — add it anyway for completeness.

7. **Notification triggers are added as side effects in existing use cases.** Inject `CreateNotificationUseCase` into `CreateLeaseUseCase`, `RenewLeaseUseCase`, `CreateDocumentRequestUseCase`, and `ConfirmUploadDocumentUseCase`. This follows the established pattern from `CreateMaintenanceRequestUseCase` which already does this.

8. **New use cases for scheduled notifications.** Create `SendLeaseExpiryNotificationsUseCase`, `SendRentDueRemindersUseCase`, and `GenerateAllLeasePaymentsUseCase` (iterates all active leases). These are thin orchestration use cases that call existing infrastructure.

9. **Environment variable for scheduler enable/disable.** Add `SCHEDULER_ENABLED=true|false` to env config. Defaults to `true`. Allows disabling scheduled tasks in test environments.

---

## Task 1: Notification Domain Updates (Backend Agent)

### Objective

Add missing `ActionType` values to the domain notification entity, fix the push notification body to use actual notification text, and add a deduplication query method to the notification repository.

### Dependencies

- None (modifies existing code)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/notification/enterprise/entities/notification.ts` | Modify | Add `SIGN_LEASE`, `LEASE_EXPIRY`, `INSPECTION_SCHEDULED`, `LEASE_RENEWAL` to `ActionType` enum |
| `apps/api/src/domain/notification/application/use-cases/create-notification.ts` | Modify | Use `text` as push notification body instead of empty string |
| `apps/api/src/domain/notification/application/repositories/notification-repository.ts` | Modify | Add `existsByActionTypeAndLinkedId` method |
| `apps/api/src/infra/database/prisma/repositories/prisma-notification-repository.ts` | Modify | Implement `existsByActionTypeAndLinkedId` |
| `test/repositories/prisma/in-memory-notification-repository.ts` | Modify | Implement `existsByActionTypeAndLinkedId` |

### Requirements

#### ActionType Enum Update

Add the 4 missing values to the domain `ActionType` enum at `apps/api/src/domain/notification/enterprise/entities/notification.ts`:

```
SIGN_LEASE = 'SIGN_LEASE'
LEASE_EXPIRY = 'LEASE_EXPIRY'
INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED'
LEASE_RENEWAL = 'LEASE_RENEWAL'
```

This aligns the domain enum with the Prisma schema and `@leaselink/shared` enums (which already have all 11 values).

#### Push Notification Body Fix

In `CreateNotificationUseCase.execute()`, change the push notification call from:

```typescript
body: '',
```

to:

```typescript
body: text,
```

Also update the push `title` to be more descriptive based on `actionType` if available. Use a simple switch/map:

| ActionType | Push Title |
|------------|-----------|
| `MAINTENANCE_UPDATE` | "Maintenance Update" |
| `RENT_REMINDER` | "Rent Reminder" |
| `PAYMENT_RECEIVED` | "Payment Received" |
| `PAYMENT_OVERDUE` | "Payment Overdue" |
| `UPLOAD_DOCUMENT` | "Document Requested" |
| `SIGN_LEASE` | "New Lease Available" |
| `LEASE_EXPIRY` | "Lease Expiring Soon" |
| `LEASE_RENEWAL` | "Lease Renewal Available" |
| Default / `INFO` | "LeaseLink Notification" |

Create a helper map `ACTION_TYPE_PUSH_TITLES: Record<ActionType, string>` in the use case file (or import from shared if `ACTION_TYPE_LABELS` is close enough).

#### Notification Repository — Dedup Method

Add to the abstract `NotificationRepository`:

```typescript
abstract existsByActionTypeAndLinkedId(params: {
  actionType: string
  linkedTransactionId?: string
  linkedPaymentId?: string
  personId: string
  createdAfter: Date
}): Promise<boolean>
```

This checks if a notification with the given action type and linked entity ID was already sent to the person after a certain date. Used by the lease expiry scheduler to avoid duplicate notifications.

**Prisma implementation:**
```typescript
async existsByActionTypeAndLinkedId(params): Promise<boolean> {
  const count = await this.prisma.notification.count({
    where: {
      actionType: params.actionType as any,
      personId: params.personId,
      ...(params.linkedTransactionId && { linkedMaintenanceRequestId: params.linkedTransactionId }),
      ...(params.linkedPaymentId && { linkedPaymentId: params.linkedPaymentId }),
      createdAt: { gte: params.createdAfter },
    },
  })
  return count > 0
}
```

Note: The Prisma model maps `linkedTransactionId` to `linkedMaintenanceRequestId`. For lease expiry notifications, we'll use `linkedTransactionId` to store the lease ID (it's a general-purpose linked ID field despite the Prisma column name). If this is confusing, an alternative is to check by `personId` + `actionType` + `createdAfter` date range without linked ID — this is simpler and sufficient for dedup.

### Acceptance Criteria

- [ ] Domain `ActionType` enum includes all 11 values matching the Prisma/shared enums
- [ ] Push notifications include the notification `text` as body (not empty string)
- [ ] Push notification titles are descriptive based on `actionType`
- [ ] `NotificationRepository.existsByActionTypeAndLinkedId` method exists in abstract class
- [ ] Prisma implementation queries correctly
- [ ] In-memory repository implements the method for testing
- [ ] Existing notification tests still pass
- [ ] `tsc --noEmit` passes

### Test Cases

**Push notification body:**
| Test | Setup | Expected |
|------|-------|----------|
| should use text as push body | Create notification with text "Your rent is due" | Push sent with body "Your rent is due" |
| should use action-type-specific title | actionType: RENT_REMINDER | Push title is "Rent Reminder" |

**Dedup query:**
| Test | Setup | Expected |
|------|-------|----------|
| should return true if notification exists | Create notification with LEASE_EXPIRY for person, query same params | `true` |
| should return false if no matching notification | Query for non-existent combo | `false` |
| should respect createdAfter filter | Notification created yesterday, query with createdAfter = today | `false` |

---

## Task 2: Notification Triggers for Existing Actions (Backend Agent)

### Objective

Wire up notification side effects in existing use cases that currently don't send notifications: lease creation, lease renewal, document request creation, and document upload confirmation.

### Dependencies

- Task 1 (new ActionType values must exist)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/lease-management/application/use-cases/create-lease.ts` | Modify | Notify tenant when lease is created |
| `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts` | Modify | Notify tenant when renewal is created |
| `apps/api/src/domain/document/application/use-cases/create-document-request.ts` | Modify | Notify tenant when document is requested |
| `apps/api/src/domain/document/application/use-cases/confirm-upload-document.ts` | Modify | Notify manager when tenant uploads document |
| `apps/api/src/infra/http/http.module.ts` | Modify | Update provider registrations if needed |
| Corresponding `.spec.ts` files | Modify | Add tests for notification side effects |

### Requirements

#### CreateLease → Notify Tenant (SIGN_LEASE)

Inject `CreateNotificationUseCase` into `CreateLeaseUseCase` (use `@Optional()` decorator to avoid breaking existing tests that don't provide it).

After successfully creating the lease, send a notification:
- **personId:** `request.tenantId`
- **text:** "A new lease has been created for you. Please review the details."
- **notificationType:** `NotificationType.ACTION`
- **actionType:** `ActionType.SIGN_LEASE`

Follow the pattern in `CreateMaintenanceRequestUseCase` which already injects and calls `CreateNotificationUseCase`.

#### RenewLease → Notify Tenant (LEASE_RENEWAL)

Inject `CreateNotificationUseCase` into `RenewLeaseUseCase`.

After creating the renewal lease:
- **personId:** the tenant ID from the original lease
- **text:** "A lease renewal is available for your review."
- **notificationType:** `NotificationType.ACTION`
- **actionType:** `ActionType.LEASE_RENEWAL`

Read the existing `RenewLeaseUseCase` to find the correct file path and understand its structure before specifying the injection pattern.

#### CreateDocumentRequest → Notify Tenant (UPLOAD_DOCUMENT)

Inject `CreateNotificationUseCase` into `CreateDocumentRequestUseCase`.

After creating the document request:
- **personId:** the tenant the request is for (from `request.tenantId` or however the use case identifies the tenant)
- **text:** "You have a new document request: {requestType label}. Please upload the required document."
- **notificationType:** `NotificationType.ACTION`
- **actionType:** `ActionType.UPLOAD_DOCUMENT`
- **linkedDocumentId:** the document request ID (if applicable — check if the notification entity supports linking to document requests, or use `linkedDocumentId` generically)

Read the existing `CreateDocumentRequestUseCase` to understand its request interface and determine where to find `tenantId`.

#### ConfirmUploadDocument → Notify Manager (BASIC_COMPLETE)

Inject `CreateNotificationUseCase` into `ConfirmUploadDocumentUseCase`.

After confirming the upload:
- **personId:** the manager's ID. This requires looking up the property manager. The document has a `clientId` (tenant) — from the tenant, look up their active lease → property → managerId. If this cross-domain lookup is too complex, use the property's `managerId` if the document has a `propertyId`. Read the use case to determine what data is available.
- **text:** "A document has been uploaded by {tenant name}."
- **notificationType:** `NotificationType.INFO`
- **actionType:** `ActionType.BASIC_COMPLETE`
- **linkedDocumentId:** the document ID

**Important:** If determining the manager ID requires too many repository lookups and would create tight coupling across domains, this notification can be deferred. The key priority is the tenant-facing notifications (SIGN_LEASE, LEASE_RENEWAL, UPLOAD_DOCUMENT) which are more impactful.

### Acceptance Criteria

- [ ] Creating a lease sends SIGN_LEASE notification to the tenant
- [ ] Creating a lease renewal sends LEASE_RENEWAL notification to the tenant
- [ ] Creating a document request sends UPLOAD_DOCUMENT notification to the tenant
- [ ] Confirming a document upload sends BASIC_COMPLETE notification to the manager (or deferred with documented reason)
- [ ] All existing use case tests still pass (use `@Optional()` for new dependencies)
- [ ] New test cases verify notification creation for each trigger
- [ ] `tsc --noEmit` passes

### Test Cases

**CreateLease notification:**
| Test | Setup | Expected |
|------|-------|----------|
| should notify tenant on lease creation | Create lease with valid data | `CreateNotificationUseCase.execute` called with tenantId, SIGN_LEASE |
| should still create lease if notification fails | Notification use case throws | Lease created successfully (notification failure is non-blocking) |

**RenewLease notification:**
| Test | Setup | Expected |
|------|-------|----------|
| should notify tenant on renewal | Create renewal | Notification sent with LEASE_RENEWAL to tenant |

**CreateDocumentRequest notification:**
| Test | Setup | Expected |
|------|-------|----------|
| should notify tenant on document request | Create request for tenant | Notification sent with UPLOAD_DOCUMENT to tenant |

**ConfirmUploadDocument notification:**
| Test | Setup | Expected |
|------|-------|----------|
| should notify manager on upload | Tenant confirms upload | Notification sent with BASIC_COMPLETE to manager |

---

## Task 3: Lease Repository — Expiry Query (Backend Agent)

### Objective

Add a method to `LeasesRepository` to find active leases expiring within a date range. This is needed by the lease expiry notification scheduler.

### Dependencies

- None (extends existing code)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/lease-management/application/repositories/leases-repository.ts` | Modify | Add `findActiveExpiringBetween` method |
| `apps/api/src/infra/database/prisma/repositories/prisma-leases-repository.ts` | Modify | Implement the method |
| `test/repositories/prisma/in-memory-leases-repository.ts` | Modify | Implement for testing |

### Requirements

Add to the abstract `LeasesRepository`:

```typescript
abstract findActiveExpiringBetween(
  startDate: Date,
  endDate: Date,
): Promise<Lease[]>
```

This returns all leases where `status = 'ACTIVE'` and `endDate` falls between `startDate` and `endDate` (inclusive).

**Prisma implementation:**
```typescript
async findActiveExpiringBetween(startDate: Date, endDate: Date): Promise<Lease[]> {
  const leases = await this.prisma.lease.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  })
  return leases.map(PrismaLeaseMapper.toDomain)
}
```

Also add a method to find all active leases (for bulk payment generation):

```typescript
abstract findAllActive(): Promise<Lease[]>
```

**Prisma implementation:**
```typescript
async findAllActive(): Promise<Lease[]> {
  const leases = await this.prisma.lease.findMany({
    where: { status: 'ACTIVE' },
  })
  return leases.map(PrismaLeaseMapper.toDomain)
}
```

### Acceptance Criteria

- [ ] `findActiveExpiringBetween(start, end)` returns active leases with endDate in range
- [ ] `findAllActive()` returns all active leases
- [ ] Both methods are implemented in Prisma and in-memory repositories
- [ ] Existing lease tests still pass
- [ ] `tsc --noEmit` passes

### Test Cases

| Test | Setup | Expected |
|------|-------|----------|
| should find leases expiring in range | Active lease ending in 30 days | Returned by query with 0–60 day range |
| should not return expired leases | Expired lease ending in 30 days | Not returned (status filter) |
| should not return leases outside range | Active lease ending in 90 days | Not returned by 0–60 day range query |
| should return all active leases | 3 active, 2 expired | `findAllActive` returns 3 |

---

## Task 4: Scheduled Task Use Cases (Backend Agent)

### Objective

Create new use cases that orchestrate the scheduled operations: generate payments for all active leases, send lease expiry notifications, and send rent due reminders. These use cases are called by the scheduler (Task 5) but are also independently testable.

### Dependencies

- Task 1 (notification dedup method)
- Task 3 (lease expiry query)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/domain/payment/application/use-cases/generate-all-lease-payments.ts` | Generate payments for ALL active leases |
| `apps/api/src/domain/payment/application/use-cases/send-rent-due-reminders.ts` | Send reminders for payments due within 3 days |
| `apps/api/src/domain/lease-management/application/use-cases/send-lease-expiry-notifications.ts` | Send notifications for leases expiring at 60/30/7 day intervals |
| Test files for each use case | Unit tests |

### Requirements

#### GenerateAllLeasePaymentsUseCase

Iterates all active leases and generates payment records for each.

Input: none
Output: `Either<never, { totalGenerated: number }>`

Logic:
1. Call `leasesRepository.findAllActive()` to get all active leases.
2. For each lease, call `generateLeasePaymentsUseCase.execute({ leaseId })`.
3. Sum up newly created payments across all leases.
4. Return total count.

This is a thin orchestration use case. The actual payment generation logic (dedup, date calculation) is in the existing `GenerateLeasePaymentsUseCase`.

#### SendRentDueRemindersUseCase

Sends push notifications to tenants with payments due within 3 days.

Input: none
Output: `Either<never, { remindersSent: number }>`

Logic:
1. Find PENDING payments where `dueDate` is between now and now + 3 days. Add a new repository method `findPendingDueWithin(days: number)` to `PaymentsRepository`, or query with date range.
2. For each payment, check dedup: has a `RENT_REMINDER` notification already been sent for this payment today? Use `notificationRepository.existsByActionTypeAndLinkedId({ actionType: 'RENT_REMINDER', linkedPaymentId: payment.id, personId: tenantId, createdAfter: startOfToday })`.
3. If not already sent, create notification:
   - **personId:** payment's `tenantId`
   - **text:** "Your rent payment of ${amount} is due on {dueDate formatted}."
   - **notificationType:** `NotificationType.ACTION`
   - **actionType:** `ActionType.RENT_REMINDER`
   - **linkedPaymentId:** payment ID

Add to `PaymentsRepository`:
```typescript
abstract findPendingDueWithin(days: number): Promise<Payment[]>
```

Prisma implementation: `where: { status: 'PENDING', dueDate: { gte: now, lte: addDays(now, days) } }`.

#### SendLeaseExpiryNotificationsUseCase

Sends notifications at 60, 30, and 7 day intervals before lease end date.

Input: none
Output: `Either<never, { notificationsSent: number }>`

Logic:
1. For each interval in `LEASE_EXPIRY_NOTIFICATION_DAYS` ([60, 30, 7]) from `@leaselink/shared`:
   a. Calculate the target date: `today + interval days`.
   b. Find active leases expiring on that date (use a 1-day window: `findActiveExpiringBetween(targetDate, targetDate + 1 day)`).
   c. For each lease found:
      - Check dedup: has a LEASE_EXPIRY notification for this lease + person been sent within the last 7 days? This prevents re-sending if the job runs multiple times.
      - Send notification to **both tenant and manager**:
        - Tenant notification: "Your lease expires in {interval} days. Contact your property manager about renewal."
        - Manager notification: "Lease for {property address} expires in {interval} days." (Need to look up property address via `PropertiesRepository`.)
        - **actionType:** `ActionType.LEASE_EXPIRY`
        - **linkedTransactionId:** lease ID (reusing this field for lease linking)

2. Return total notifications sent.

**Note on property address lookup:** The use case needs to inject `PropertiesRepository` to get the property address for the manager notification text. This cross-domain dependency is acceptable for notification composition.

### Acceptance Criteria

- [ ] `GenerateAllLeasePaymentsUseCase` iterates all active leases and generates payments
- [ ] `SendRentDueRemindersUseCase` sends reminders for payments due within 3 days
- [ ] Rent reminders are deduplicated (same payment, same day = no duplicate)
- [ ] `SendLeaseExpiryNotificationsUseCase` sends notifications at 60/30/7 day intervals
- [ ] Lease expiry notifications sent to BOTH tenant and manager
- [ ] Lease expiry notifications are deduplicated (no repeat within 7 days for same lease + person)
- [ ] All use cases return success counts
- [ ] All use cases handle empty datasets gracefully (0 leases/payments = 0 notifications, not error)
- [ ] `tsc --noEmit` passes

### Test Cases

**GenerateAllLeasePayments:**
| Test | Setup | Expected |
|------|-------|----------|
| should generate for all active leases | 3 active leases | totalGenerated > 0 |
| should handle no active leases | 0 active leases | totalGenerated = 0 |
| should not fail if one lease fails | 2 valid, 1 edge case | Still processes all, returns count |

**SendRentDueReminders:**
| Test | Setup | Expected |
|------|-------|----------|
| should send reminder for payment due tomorrow | PENDING payment due in 1 day | 1 reminder sent |
| should not send for payment due in 5 days | PENDING payment due in 5 days | 0 reminders |
| should not send for PAID payment | PAID payment due tomorrow | 0 reminders |
| should not duplicate | Already sent today for this payment | 0 reminders |
| should send for OVERDUE too | OVERDUE payment | Depends on design — OVERDUE is handled by separate overdue notification, so skip here |

**SendLeaseExpiryNotifications:**
| Test | Setup | Expected |
|------|-------|----------|
| should send 60-day warning | Active lease ending in 60 days | 2 notifications (tenant + manager) |
| should send 30-day warning | Active lease ending in 30 days | 2 notifications |
| should send 7-day warning | Active lease ending in 7 days | 2 notifications |
| should not send for 45-day lease | Lease ending in 45 days | 0 notifications (not a trigger interval) |
| should not duplicate within 7 days | Already sent LEASE_EXPIRY this week | 0 notifications |
| should handle no expiring leases | No leases near expiry | 0 notifications |

---

## Task 5: NestJS Scheduler Module (Backend Agent)

### Objective

Install `@nestjs/schedule`, create the scheduler module with cron jobs that call the use cases from Task 4, add environment-based enable/disable, and register everything in the app module.

### Dependencies

- Task 4 (scheduled use cases must exist)
- Task 2 (notification triggers for existing actions — should be done first to avoid conflicts)

### Setup Commands

```bash
cd apps/api && npm install @nestjs/schedule
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/scheduler/scheduler.module.ts` | Create | NestJS module for scheduled tasks |
| `apps/api/src/infra/scheduler/payment-scheduler.service.ts` | Create | Payment generation + overdue detection cron jobs |
| `apps/api/src/infra/scheduler/lease-scheduler.service.ts` | Create | Lease expiry notification cron job |
| `apps/api/src/infra/scheduler/rent-reminder-scheduler.service.ts` | Create | Rent due reminder cron job |
| `apps/api/src/infra/env/env.ts` | Modify | Add `SCHEDULER_ENABLED` env var |
| `apps/api/src/infra/app.module.ts` | Modify | Import `ScheduleModule` and `SchedulerModule` |

### Requirements

#### Scheduler Module

**`apps/api/src/infra/scheduler/scheduler.module.ts`**

A NestJS module that:
1. Imports `ScheduleModule.forRoot()` from `@nestjs/schedule`
2. Imports `DatabaseModule` (for repositories) and `HttpModule` or relevant domain modules (for use cases)
3. Provides the 3 scheduler services
4. Conditionally enables scheduling based on `SCHEDULER_ENABLED` env var

```typescript
@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    // ... other modules needed for use case injection
  ],
  providers: [
    PaymentSchedulerService,
    LeaseSchedulerService,
    RentReminderSchedulerService,
  ],
})
export class SchedulerModule {}
```

**Important:** The scheduler services need access to use cases which are currently registered in `HttpModule`. Either:
- Move use case providers to a shared `DomainModule` that both `HttpModule` and `SchedulerModule` import
- Or register the needed use cases directly in `SchedulerModule`'s providers

Read the existing `http.module.ts` to understand how use cases are registered and determine the best approach. The simplest path is to register the specific use cases needed by each scheduler service directly in `SchedulerModule`.

#### PaymentSchedulerService

**`apps/api/src/infra/scheduler/payment-scheduler.service.ts`**

```typescript
@Injectable()
export class PaymentSchedulerService {
  private readonly logger = new Logger(PaymentSchedulerService.name)

  constructor(
    private generateAllLeasePayments: GenerateAllLeasePaymentsUseCase,
    private markOverduePayments: MarkOverduePaymentsUseCase,
    private envService: EnvService,
  ) {}

  @Cron('5 0 * * *')  // Daily at 00:05 UTC
  async handlePaymentGeneration() {
    if (!this.envService.get('SCHEDULER_ENABLED')) return

    this.logger.log('Running scheduled payment generation...')
    const result = await this.generateAllLeasePayments.execute()

    if (result.isRight()) {
      this.logger.log(`Payment generation complete: ${result.value.totalGenerated} payments created`)
    }
  }

  @Cron('30 0 * * *')  // Daily at 00:30 UTC
  async handleOverdueDetection() {
    if (!this.envService.get('SCHEDULER_ENABLED')) return

    this.logger.log('Running overdue payment detection...')
    const result = await this.markOverduePayments.execute()

    if (result.isRight()) {
      this.logger.log(`Overdue detection complete: ${result.value.overdueCount} payments marked overdue`)
    }
  }
}
```

#### LeaseSchedulerService

**`apps/api/src/infra/scheduler/lease-scheduler.service.ts`**

```typescript
@Cron('0 6 * * *')  // Daily at 06:00 UTC
async handleLeaseExpiryNotifications() {
  if (!this.envService.get('SCHEDULER_ENABLED')) return

  this.logger.log('Running lease expiry notification check...')
  const result = await this.sendLeaseExpiryNotifications.execute()

  if (result.isRight()) {
    this.logger.log(`Lease expiry check complete: ${result.value.notificationsSent} notifications sent`)
  }
}
```

#### RentReminderSchedulerService

**`apps/api/src/infra/scheduler/rent-reminder-scheduler.service.ts`**

```typescript
@Cron('0 8 * * *')  // Daily at 08:00 UTC
async handleRentDueReminders() {
  if (!this.envService.get('SCHEDULER_ENABLED')) return

  this.logger.log('Running rent due reminders...')
  const result = await this.sendRentDueReminders.execute()

  if (result.isRight()) {
    this.logger.log(`Rent reminders complete: ${result.value.remindersSent} reminders sent`)
  }
}
```

#### Environment Variable

Add to `apps/api/src/infra/env/env.ts`:

```typescript
SCHEDULER_ENABLED: z.coerce.boolean().default(true)
```

Ensure the `.env.example` and any `.env.local` templates include `SCHEDULER_ENABLED=true`.

#### Error Handling

Each cron job must:
1. Wrap the execution in a try/catch
2. Log errors but never throw (a thrown error in a cron job crashes the process)
3. Use the NestJS `Logger` for consistent logging

```typescript
try {
  // ... call use case
} catch (error) {
  this.logger.error('Payment generation failed', error instanceof Error ? error.stack : error)
}
```

#### App Module Registration

Import `SchedulerModule` in the root `AppModule` (or wherever the main application module is). Check the existing module structure at `apps/api/src/infra/app.module.ts` (or `apps/api/src/app.module.ts`).

### Acceptance Criteria

- [ ] `@nestjs/schedule` is installed and `ScheduleModule.forRoot()` is imported
- [ ] 3 scheduler services exist with correct cron expressions
- [ ] All cron jobs check `SCHEDULER_ENABLED` before executing
- [ ] All cron jobs have try/catch error handling with logging
- [ ] `SCHEDULER_ENABLED` env var added with `true` default
- [ ] Scheduler module is registered in the app module
- [ ] Use cases are injectable into scheduler services (module wiring is correct)
- [ ] API starts without errors with scheduling enabled
- [ ] API starts without errors with `SCHEDULER_ENABLED=false`
- [ ] Cron jobs log their execution and results
- [ ] `tsc --noEmit` passes

### Test Cases

No unit tests for the scheduler services themselves (they're thin wrappers). Verify via:

1. **Startup test:** `npm run start:dev` starts without module resolution errors
2. **Log verification:** Check logs at the scheduled times (or temporarily set cron to `*/1 * * * *` for testing) — should see "Running scheduled payment generation..." messages
3. **Disable test:** Set `SCHEDULER_ENABLED=false` → no cron log messages appear
4. **Use case tests:** The underlying use cases (Task 4) have their own unit tests

---

## Task 6: Scheduler Status Endpoint & Web Integration (Backend + Web Agent)

### Objective

Add a simple API endpoint that returns the scheduler configuration and last-run status, and display it on the web dashboard. Also remove the manual "Generate Payments" and "Mark Overdue" buttons' prominence now that these operations are automated (keep them as secondary actions).

### Dependencies

- Task 5 (scheduler must exist)

### Files to Create/Modify — Backend

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/http/controllers/get-scheduler-status/get-scheduler-status.controller.ts` | Create | GET /scheduler/status |
| `apps/api/src/infra/http/http.module.ts` | Modify | Register controller |

### Files to Create/Modify — Web

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/hooks/use-scheduler.ts` | Create | Hook for scheduler status |
| `apps/web/src/components/dashboard/scheduler-status.tsx` | Create | Scheduler status indicator |
| `apps/web/src/app/(dashboard)/page.tsx` | Modify | Add scheduler status to dashboard |

### Requirements

#### GET /scheduler/status

- `@ApiTags('Scheduler')`
- `@UseGuards(EmployeeOnlyGuard)` — manager only
- Returns a simple status object:

```typescript
{
  enabled: boolean
  tasks: [
    { name: 'Payment Generation', schedule: 'Daily at 00:05 UTC', description: 'Generates monthly payment records for active leases' },
    { name: 'Overdue Detection', schedule: 'Daily at 00:30 UTC', description: 'Marks payments as overdue after 5-day grace period' },
    { name: 'Lease Expiry Warnings', schedule: 'Daily at 06:00 UTC', description: 'Sends notifications for leases expiring at 60/30/7 days' },
    { name: 'Rent Due Reminders', schedule: 'Daily at 08:00 UTC', description: 'Sends reminders for payments due within 3 days' },
  ]
}
```

This is a static response (no runtime tracking of last execution times in Sprint 8 — that's a future enhancement). The value is showing managers that automation is configured and active.

#### Web — Scheduler Status Component

A small card on the dashboard showing:
- "Automated Tasks" header
- Green dot + "Active" label (or red + "Disabled" if `enabled: false`)
- Collapsible list of task names + schedules

Place this below the recent activity section on the dashboard.

#### Web — Payment Page Update

The "Generate Payments" and "Mark Overdue" buttons on the payments page should be moved to a secondary position (e.g., inside a "Manual Actions" dropdown or a less prominent section) since these now run automatically. Add a note: "These actions run automatically. Use manual triggers only if needed."

### Acceptance Criteria

- [ ] `GET /scheduler/status` returns scheduler configuration
- [ ] Dashboard shows scheduler status indicator
- [ ] Green/active indicator when scheduler is enabled
- [ ] Payment page indicates automation with manual fallback
- [ ] `next build` passes
- [ ] API `tsc --noEmit` passes

---

## Task 7: Mobile Notification Display Improvements (Mobile Agent)

### Objective

Now that push notifications include meaningful body text and new notification types exist (SIGN_LEASE, LEASE_EXPIRY, LEASE_RENEWAL, RENT_REMINDER), update the mobile notification list to display type-specific icons and improved formatting. Also ensure push notifications display correctly on the device.

### Dependencies

- Task 1 (push body fix)
- Task 2 (new notification triggers)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/mobile/app/(main)/notifications/index.tsx` | Modify | Update notification item rendering for new action types |
| Notification item component (find the exact file) | Modify | Add type-specific icons/colors |

### Requirements

#### Notification Item Enhancement

The mobile notification list currently renders all notifications with the same style. Update to show type-specific visual treatments:

| ActionType | Icon | Color Accent |
|------------|------|-------------|
| `MAINTENANCE_UPDATE` | Wrench/tool icon | Amber |
| `PAYMENT_RECEIVED` | Check/credit-card icon | Green |
| `PAYMENT_OVERDUE` | Alert icon | Red |
| `RENT_REMINDER` | Clock/calendar icon | Blue |
| `UPLOAD_DOCUMENT` | Upload icon | Default |
| `SIGN_LEASE` | FileText icon | Blue |
| `LEASE_EXPIRY` | Calendar/alert icon | Amber/red |
| `LEASE_RENEWAL` | Refresh icon | Blue |
| Default / `INFO` | Bell icon | Gray |

Use icons from the existing icon registry at `apps/mobile/src/constants/icons.ts` or lucide icons if the app uses them. Check what icon system the mobile app uses and follow that pattern.

#### Notification Tap Navigation

When a notification is tapped, navigate to the relevant screen based on linked IDs:
- `linkedPaymentId` → `/payments/{id}`
- `linkedMaintenanceRequestId` (mapped from `linkedTransactionId`) → `/maintenance/{id}`
- `linkedDocumentId` → `/documents/{id}`
- For `LEASE_EXPIRY` / `SIGN_LEASE` / `LEASE_RENEWAL` → `/home/lease-detail` (the lease detail screen)

Check how the existing notification tap handler works and extend it for the new types.

#### Push Notification Display

Verify that push notifications now show the body text on the device notification shade. The fix in Task 1 sends `body: text` instead of `body: ''`. No mobile code change should be needed for this — Expo Push handles it. But verify by testing.

### Acceptance Criteria

- [ ] Notification items show type-specific icons
- [ ] Different notification types have distinct visual styles
- [ ] Tapping a notification navigates to the correct screen
- [ ] LEASE_EXPIRY notifications navigate to lease detail
- [ ] RENT_REMINDER notifications navigate to payment
- [ ] Push notifications show body text on device
- [ ] No regressions in existing notification functionality
- [ ] App runs without errors

### Test Cases

Manual verification:

1. **Notification types:** Trigger different notification types → see type-specific icons in list
2. **Tap navigation:** Tap a MAINTENANCE_UPDATE notification → navigate to maintenance detail
3. **Tap payment notification:** Tap RENT_REMINDER → navigate to payments
4. **Tap lease notification:** Tap LEASE_EXPIRY → navigate to lease detail
5. **Push body:** Receive push → device notification shows message text (not blank)

---

## Implementation Order

```
Task 1 ──> Task 2 ──────────────────────────────────────┐
(Notif      (Notification triggers                       │
 domain)     for existing actions)                       │
    │                                                    │
    └──> Task 3 ──> Task 4 ──> Task 5 ──> Task 6       │
         (Lease     (Scheduled   (NestJS    (Status     │
          repo)      use cases)   scheduler) endpoint   │
                                             + web)     │
                                                        │
Task 7 ─────────────────────────────────────────────────┘
(Mobile notification display — can start after Task 1,
 benefits from Task 2 being done for testing)
```

**Parallel work:**
- **Task 1** is the foundation — start immediately
- **Task 2** depends on Task 1 (new ActionType values)
- **Task 3** is independent — can run in parallel with Task 2
- **Task 4** depends on Tasks 1 and 3
- **Task 5** depends on Task 4
- **Task 6** depends on Task 5 (backend) and is partly web work
- **Task 7** (Mobile) depends on Task 1, can run in parallel with Tasks 3–6

**Recommended execution:**
1. Start **Task 1** (Backend) and **Task 3** (Backend) in parallel
2. When Task 1 completes, start **Task 2** (Backend) and **Task 7** (Mobile)
3. When Tasks 3 and 1 complete, start **Task 4** (Backend)
4. When Task 4 completes, start **Task 5** (Backend)
5. When Task 5 completes, start **Task 6** (Backend + Web)

---

## Definition of Done

Sprint 8 is complete when:

1. `cd apps/api && npx tsc --noEmit` passes
2. `cd apps/api && npm run test` passes (all existing + new use case tests)
3. `cd apps/api && npm run start:dev` starts without errors, scheduler logs appear
4. `@nestjs/schedule` is installed and cron jobs are registered
5. `cd apps/web && npx next build` passes with no errors
6. `cd apps/mobile && npx expo start` runs without errors
7. Automated tasks work:
   - Payment generation runs on schedule (or manual trigger) for all active leases
   - Overdue detection runs and transitions PENDING → OVERDUE after grace period
   - Lease expiry notifications sent at 60/30/7 day intervals (no duplicates)
   - Rent due reminders sent for payments due within 3 days (no duplicates)
8. Notification completeness:
   - Creating a lease notifies the tenant (SIGN_LEASE)
   - Creating a lease renewal notifies the tenant (LEASE_RENEWAL)
   - Creating a document request notifies the tenant (UPLOAD_DOCUMENT)
   - Uploading a document notifies the manager (BASIC_COMPLETE)
9. Push notifications show meaningful body text (not empty)
10. Mobile notification list shows type-specific icons and navigation
11. Dashboard shows scheduler status
12. `SCHEDULER_ENABLED` env var controls cron execution
13. No regressions in existing functionality (properties, tenants, leases, maintenance, payments, documents, dashboard, notifications)
