# Sprint 5: Rent Payments (Stripe Checkout)

## Overview

This sprint delivers **Rent Payments** across all three surfaces: API, web dashboard, and mobile app. Payments are auto-generated monthly from active leases, tenants pay via Stripe Checkout (test mode), and both parties receive notifications on payment events. This is the final core feature in the property management workflow: Properties → Leases → Maintenance → **Payments**.

**Goal:** The system generates monthly payment records for active leases. Tenants see upcoming/pending payments in the mobile app and pay via Stripe Checkout (test mode, card `4242 4242 4242 4242`). Stripe webhooks confirm payment. Managers see payment status across their portfolio on the web dashboard. Overdue payments are flagged after a 5-day grace period.

**Why this sprint:** All payment dependencies are complete — properties (Sprint 2), leases (Sprint 3), and notifications (Sprint 4 extended ActionType). Payments complete the revenue tracking loop and are the last core product spec feature before polish/iteration sprints.

---

## What Exists (from Sprints 1–4)

| Layer | What's Done |
|-------|-------------|
| **Shared package** | `PaymentStatus` enum, `Payment` type, `CreateCheckoutSessionDto`, `PaymentFilterDto`, Zod schemas (`createCheckoutSessionSchema`, `paymentFilterSchema`), `PAYMENT_STATUS_TRANSITIONS`, `PAYMENT_STATUS_LABELS`, `PAYMENT_GRACE_PERIOD_DAYS` (5), error messages (`PAYMENT_NOT_FOUND`, `PAYMENT_ALREADY_PAID`, etc.) |
| **Prisma schema** | `Payment` model with all fields (`stripeCheckoutSessionId`, `stripePaymentIntentId`, `paidAt`), indexes on `leaseId`, `tenantId`, `status`, `dueDate`. `Notification` model has `linkedPaymentId` column. |
| **API — Lease** | `LeasesRepository` with `findActiveByTenant()`, `findActiveByProperty()`, `findMany()`. Lease entity with `monthlyRent`, `startDate`, `endDate`. |
| **API — Notification** | `CreateNotificationUseCase` with push notification support. Domain `ActionType` enum has 4 values — needs `RENT_REMINDER`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE` added. Notification mapper writes `linkedTransactionId` → `linkedMaintenanceRequestId` in Prisma (NOT `linkedPaymentId` — this needs a separate field). |
| **Web** | Dashboard layout, property/tenant/lease/maintenance pages. Payments page is a placeholder ("Coming in Sprint 4"). |
| **Mobile** | 3-tab navigation (Documents, Maintenance, Notifications). No payments tab or screens. Kubb-generated API hooks from Swagger. |
| **Environment** | No Stripe env vars — need to add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`. |

---

## Architectural Decisions

1. **Payment lives in a new domain context:** `apps/api/src/domain/payment/`. Follows the same DDD structure as `maintenance/`, `lease-management/`, `property-management/`.

2. **Stripe Checkout flow — server creates the session, client opens the URL.** The API creates a Stripe Checkout Session and returns the `url`. The mobile app opens it in an in-app browser (`expo-web-browser`). The web dashboard links to it (for viewing in Stripe Dashboard — managers don't pay). We never touch card data.

3. **Stripe webhook confirms payment.** The `POST /payments/webhook` endpoint receives `checkout.session.completed` events, validates the signature, and updates the payment status to `PAID`. This endpoint must skip the global auth guard and accept raw body for signature verification.

4. **Payment generation is a use case, not a cron job (for Sprint 5).** Payments are generated via a `GenerateMonthlyPayments` use case that can be called manually or via a simple API endpoint. A future sprint can add a scheduled trigger (cron/task queue). For Sprint 5, the manager triggers payment generation from the web dashboard or it runs on lease activation.

5. **Payment generation on lease activation.** When a lease is activated (status → ACTIVE), generate the first payment record with `dueDate` = lease start date (or 1st of the next month if start date has passed). This is a side effect in the `UpdateLeaseStatus` use case — call the payment generation use case after activation.

6. **Overdue detection is a use case, not a background job.** A `MarkOverduePayments` use case finds PENDING payments past their due date + grace period and transitions them to OVERDUE. For Sprint 5, this runs when payments are listed (lazy check) or can be triggered via API. A future sprint can add a scheduled trigger.

7. **Notification entity needs updates for payments.** The domain `ActionType` enum needs `RENT_REMINDER`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`. The notification entity needs a `linkedPaymentId` property (separate from `linkedTransactionId` which maps to maintenance requests). The mapper needs to write `linkedPaymentId` to the Prisma `linked_payment_id` column.

8. **Mobile app gets a new "Payments" tab** replacing the current 3-tab layout with 4 tabs: Home, Maintenance, Payments, Notifications. The existing Documents tab moves to be accessible from the Home/Profile screen (it's less frequently accessed than payments). The Home tab shows a dashboard with lease summary and next payment due.

9. **Stripe runs in test mode only.** Use `STRIPE_SECRET_KEY` starting with `sk_test_`. The Checkout Session uses `mode: 'payment'` with the payment amount. No recurring subscriptions — each month is a one-time payment.

10. **Web payment page is read-only for managers.** Managers view payment status, filter by status/tenant/property, and see revenue summaries. They do NOT initiate payments — only tenants pay from the mobile app.

---

## Task 1: Notification Entity Updates (Backend Agent)

### Objective

Extend the Notification domain entity and mapper to support payment-related notifications with `linkedPaymentId` and new action types.

### Dependencies

- None (modifies existing code)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/notification/enterprise/entities/notification.ts` | Modify | Add `linkedPaymentId` property, add `RENT_REMINDER`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE` to `ActionType` enum |
| `apps/api/src/domain/notification/application/use-cases/create-notification.ts` | Modify | Add `linkedPaymentId` to request interface |
| `apps/api/src/infra/database/prisma/mappers/prisma-notification-mapper.ts` | Modify | Map `linkedPaymentId` ↔ Prisma `linkedPaymentId` |

### Requirements

#### Notification Entity Changes

Add to `ActionType` enum:
```
RENT_REMINDER
PAYMENT_RECEIVED
PAYMENT_OVERDUE
```

Add to `NotificationProps`:
```
linkedPaymentId?: UniqueEntityId
```

Add getter/setter for `linkedPaymentId` following the `linkedTransactionId` pattern.

#### CreateNotificationUseCase Changes

Add `linkedPaymentId?: string` to `CreateNotificationUseCaseRequest`. Pass it through to the entity as `new UniqueEntityId(linkedPaymentId)` when present.

#### Mapper Changes

In `toDomain`: read `raw.linkedPaymentId` and map to `linkedPaymentId: new UniqueEntityId(raw.linkedPaymentId)`.
In `toPrisma`: write `linkedPaymentId: notification.linkedPaymentId?.toString()`.
In `toPrismaPartial`: same.

### Acceptance Criteria

- [ ] `ActionType` enum includes `RENT_REMINDER`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`
- [ ] `NotificationProps` includes `linkedPaymentId`
- [ ] `CreateNotificationUseCaseRequest` accepts `linkedPaymentId`
- [ ] Mapper correctly reads/writes `linkedPaymentId` from/to Prisma
- [ ] Existing notification tests still pass
- [ ] `tsc --noEmit` passes

---

## Task 2: Payment Domain Layer (Backend Agent)

### Objective

Create the Payment domain entity, value object, repository interface, error classes, and all use cases.

### Dependencies

- Task 1 (notification updates for payment notifications)
- `LeasesRepository` from Sprint 3
- `PropertiesRepository` from Sprint 2

### Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/domain/payment/enterprise/entities/payment.ts` | Payment domain entity |
| `apps/api/src/domain/payment/enterprise/entities/value-objects/payment-status.ts` | PaymentStatus value object |
| `apps/api/src/domain/payment/application/repositories/payments-repository.ts` | Abstract repository interface |
| `apps/api/src/domain/payment/application/use-cases/generate-lease-payments.ts` | Generate payment records for an active lease |
| `apps/api/src/domain/payment/application/use-cases/get-payments.ts` | List payments with filtering (manager) |
| `apps/api/src/domain/payment/application/use-cases/get-payments-by-tenant.ts` | List tenant's own payments (mobile) |
| `apps/api/src/domain/payment/application/use-cases/get-payment-by-id.ts` | Get single payment |
| `apps/api/src/domain/payment/application/use-cases/create-checkout-session.ts` | Create Stripe Checkout Session |
| `apps/api/src/domain/payment/application/use-cases/handle-checkout-completed.ts` | Process Stripe webhook |
| `apps/api/src/domain/payment/application/use-cases/mark-overdue-payments.ts` | Transition PENDING → OVERDUE after grace period |
| `apps/api/src/domain/payment/application/use-cases/errors/*.ts` | Error classes |
| `test/factories/make-payment.ts` | Test factory |
| `test/repositories/prisma/in-memory-payments-repository.ts` | In-memory repository |

### Requirements

#### Payment Entity

Follow the Lease entity pattern — extends `Entity<PaymentProps>`, `PaymentStatus` value object, static `create()` factory.

Props:
- `leaseId: UniqueEntityId`
- `tenantId: UniqueEntityId`
- `amount: number`
- `dueDate: Date`
- `status: PaymentStatus` (default UPCOMING)
- `stripeCheckoutSessionId: string | null`
- `stripePaymentIntentId: string | null`
- `paidAt: Date | null`
- `createdAt: Date`
- `updatedAt: Date | null`

#### PaymentStatus Value Object

Follow `LeaseStatus` pattern. Values: `UPCOMING`, `PENDING`, `PAID`, `OVERDUE`.

#### Repository Interface

```typescript
abstract class PaymentsRepository {
  abstract create(payment: Payment): Promise<void>
  abstract createMany(payments: Payment[]): Promise<void>
  abstract findById(paymentId: string): Promise<Payment | null>
  abstract findMany(params: PaymentsFilterParams): Promise<PaymentsPaginatedResult>
  abstract findManyByTenant(params: PaymentsByTenantParams): Promise<PaymentsPaginatedResult>
  abstract findByStripeSessionId(sessionId: string): Promise<Payment | null>
  abstract findPendingOverdue(gracePeriodDays: number): Promise<Payment[]>
  abstract findExistingForLease(leaseId: string, dueDate: Date): Promise<Payment | null>
  abstract update(payment: Payment): Promise<Payment>
}
```

`PaymentsFilterParams`: `status?`, `leaseId?`, `tenantId?`, `propertyId?` (join through lease), `page`, `pageSize`.
`PaymentsByTenantParams`: `tenantId`, `status?`, `page`, `pageSize`.
`findPendingOverdue`: returns PENDING payments where `dueDate + gracePeriodDays < now()`.
`findExistingForLease`: checks if a payment already exists for a lease + due date (prevents duplicates).

#### Error Classes

| Error | When |
|-------|------|
| `PaymentNotFoundError` | Payment doesn't exist |
| `PaymentAlreadyPaidError` | Attempting to pay an already-paid payment |
| `PaymentNoActiveLeaseError` | Tenant's lease is not active |
| `InvalidPaymentStatusTransitionError` | Invalid status transition |

Use error message strings from `@leaselink/shared` constants.

#### Use Case: GenerateLeasePayments

Input: `leaseId: string`

This generates payment records for an active lease. Called when a lease is activated and can be called again to generate future months.

Business rules:
1. Find the lease by ID. Must be ACTIVE.
2. Determine which monthly payments to generate:
   - First payment: due on lease `startDate` (or 1st of the month of start date)
   - Subsequent payments: 1st of each month through lease `endDate`
   - Only generate payments for the current month and one month ahead (not the entire lease term at once — this avoids creating years of UPCOMING records)
3. For each month, check `findExistingForLease(leaseId, dueDate)` to avoid duplicates.
4. Create payments with `status: UPCOMING` and `amount: lease.monthlyRent`.
5. If the due date is today or in the past, set status to `PENDING` instead of `UPCOMING`.

Return: `Either<Error, { payments: Payment[] }>` (newly created payments).

#### Use Case: CreateCheckoutSession

Input: `paymentId: string`, `tenantId: string` (from auth)

Business rules:
1. Find the payment. Verify `tenantId` matches.
2. Payment status must be `PENDING` or `OVERDUE` (can't pay UPCOMING or already PAID). Error: `PaymentAlreadyPaidError` if PAID, custom error if UPCOMING.
3. Find the lease to get property context for the Checkout Session description.
4. Create a Stripe Checkout Session:
   - `mode: 'payment'`
   - `line_items`: one item with `price_data` for the rent amount
   - `metadata`: `{ paymentId, leaseId, tenantId }`
   - `success_url` and `cancel_url` from env vars
5. Store the `stripeCheckoutSessionId` on the payment.
6. Return the Checkout Session `url`.

**Stripe integration:** Create an abstract `StripeService` interface in the domain layer with a `createCheckoutSession` method. The infrastructure layer implements it using the `stripe` npm package. This keeps the domain layer clean and testable.

```typescript
// Domain layer interface
export abstract class StripeService {
  abstract createCheckoutSession(params: {
    amount: number  // in cents
    currency: string
    description: string
    metadata: Record<string, string>
    successUrl: string
    cancelUrl: string
  }): Promise<{ sessionId: string; url: string }>
}
```

#### Use Case: HandleCheckoutCompleted

Input: `stripeSessionId: string`, `stripePaymentIntentId: string`

Called by the webhook controller after validating the Stripe signature.

Business rules:
1. Find payment by `stripeCheckoutSessionId`. Error if not found.
2. If already PAID, return success (idempotent — webhook can fire multiple times).
3. Set `status: PAID`, `paidAt: new Date()`, `stripePaymentIntentId`.
4. Save.
5. **Send PAYMENT_RECEIVED notification to the property manager:**
   - Look up lease → property → managerId
   - Notification text: "Payment of $X received for [property address]"
   - `actionType: PAYMENT_RECEIVED`
   - `linkedPaymentId`: the payment ID

#### Use Case: MarkOverduePayments

Input: none (operates on all eligible payments)

Business rules:
1. Call `findPendingOverdue(PAYMENT_GRACE_PERIOD_DAYS)` — gets PENDING payments where `dueDate + 5 days < now()`.
2. For each, transition status to `OVERDUE`.
3. **Send PAYMENT_OVERDUE notification to the tenant:**
   - Notification text: "Your rent payment of $X is overdue"
   - `actionType: PAYMENT_OVERDUE`
   - `linkedPaymentId`: the payment ID

Return: `Either<never, { overdueCount: number }>`.

#### Use Case: GetPayments (Manager)

Input: filters (status, leaseId, tenantId, propertyId, page, pageSize)

For managers — returns payments across their properties. The repository filters by `propertyId` via the lease→property join, or by manager ownership (property.managerId).

#### Use Case: GetPaymentsByTenant

Input: `tenantId` (from auth), filters (status, page, pageSize)

Returns only the authenticated tenant's payments.

#### Use Case: GetPaymentById

Input: `paymentId`, `userId`, `userRole`

Access check: managers can view any payment for their properties, tenants can only view their own.

### Integration: Lease Activation Side Effect

Modify the existing `UpdateLeaseStatus` use case (in `apps/api/src/domain/lease-management/application/use-cases/update-lease-status.ts`) to call `GenerateLeasePayments` when a lease transitions to ACTIVE. Inject `GenerateLeasePaymentsUseCase` and call it after the status update succeeds.

### Acceptance Criteria

- [ ] `Payment` entity follows Lease entity pattern with `PaymentStatus` value object
- [ ] Repository has 9 methods including `findByStripeSessionId`, `findPendingOverdue`, `findExistingForLease`, `createMany`
- [ ] `GenerateLeasePayments` creates monthly payment records for active leases without duplicates
- [ ] `GenerateLeasePayments` sets status to PENDING for current/past due dates, UPCOMING for future
- [ ] `CreateCheckoutSession` validates payment status (only PENDING or OVERDUE), returns Stripe session URL
- [ ] `CreateCheckoutSession` uses abstract `StripeService` — domain layer has no Stripe SDK dependency
- [ ] `HandleCheckoutCompleted` is idempotent (safe to call multiple times)
- [ ] `HandleCheckoutCompleted` sends PAYMENT_RECEIVED notification to manager
- [ ] `MarkOverduePayments` transitions PENDING → OVERDUE after grace period and notifies tenants
- [ ] Lease activation triggers payment generation
- [ ] All error classes exist with shared error message strings
- [ ] All files pass `tsc --noEmit`

### Test Cases

#### GenerateLeasePayments Tests

| Test | Setup | Expected |
|------|-------|----------|
| should generate first payment on activation | Lease starting this month | One payment created with PENDING status |
| should generate current + next month | Lease active, current month | Two payments: PENDING (current), UPCOMING (next) |
| should not create duplicates | Payment already exists for this month | No new payment for that month |
| should reject if lease not active | Lease in PENDING status | Error |
| should set correct amount from lease | Lease with monthlyRent 2500 | Payment amount is 2500 |

#### CreateCheckoutSession Tests

| Test | Setup | Expected |
|------|-------|----------|
| should create session for PENDING payment | PENDING payment, correct tenant | `isRight()`, returns session URL |
| should create session for OVERDUE payment | OVERDUE payment | `isRight()`, returns session URL |
| should reject if already PAID | PAID payment | `isLeft()`, PaymentAlreadyPaidError |
| should reject if UPCOMING | UPCOMING payment | `isLeft()`, error |
| should reject if tenant doesn't own payment | Different tenantId | `isLeft()`, PaymentNotFoundError |
| should store stripeCheckoutSessionId | After creation | Payment has sessionId saved |

#### HandleCheckoutCompleted Tests

| Test | Setup | Expected |
|------|-------|----------|
| should mark payment as PAID | Valid session ID | Payment status PAID, paidAt set |
| should be idempotent | Call twice with same session | Second call succeeds, no error |
| should store stripePaymentIntentId | Valid webhook data | PaymentIntentId saved |
| should send notification to manager | Payment confirmed | CreateNotificationUseCase called with managerId |
| should handle unknown session ID | Non-existent session | Error (logged, not thrown — webhook returns 200) |

#### MarkOverduePayments Tests

| Test | Setup | Expected |
|------|-------|----------|
| should mark overdue payments | PENDING payment due 6 days ago | Status changes to OVERDUE |
| should not mark within grace period | PENDING payment due 3 days ago | Status stays PENDING |
| should send notification to tenant | Payment marked overdue | CreateNotificationUseCase called with tenantId |
| should handle no overdue payments | No eligible payments | Returns overdueCount: 0 |

---

## Task 3: Payment Infrastructure Layer (Backend Agent)

### Objective

Create the Prisma repository, mapper, Stripe service implementation, HTTP controllers (including webhook), presenter, and register everything in NestJS modules.

### Dependencies

- Task 2 (domain layer must exist)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/database/prisma/mappers/prisma-payment-mapper.ts` | Create | Prisma ↔ domain mapper |
| `apps/api/src/infra/database/prisma/repositories/prisma-payments-repository.ts` | Create | Prisma repository implementation |
| `apps/api/src/infra/stripe/stripe.service.ts` | Create | Stripe SDK wrapper implementing `StripeService` |
| `apps/api/src/infra/stripe/stripe.module.ts` | Create | NestJS module for Stripe |
| `apps/api/src/infra/http/controllers/get-payments/get-payments.controller.ts` | Create | GET /payments (manager) |
| `apps/api/src/infra/http/controllers/get-payments-by-tenant/get-payments-by-tenant.controller.ts` | Create | GET /payments/tenant (mobile) |
| `apps/api/src/infra/http/controllers/get-payment-by-id/get-payment-by-id.controller.ts` | Create | GET /payments/:id |
| `apps/api/src/infra/http/controllers/create-checkout-session/create-checkout-session.controller.ts` | Create | POST /payments/:id/checkout |
| `apps/api/src/infra/http/controllers/stripe-webhook/stripe-webhook.controller.ts` | Create | POST /payments/webhook |
| `apps/api/src/infra/http/controllers/generate-payments/generate-payments.controller.ts` | Create | POST /payments/generate (manager trigger) |
| `apps/api/src/infra/http/controllers/mark-overdue-payments/mark-overdue-payments.controller.ts` | Create | POST /payments/mark-overdue (manager trigger) |
| `apps/api/src/infra/http/presenters/http-payment-presenter.ts` | Create | Payment → JSON |
| `apps/api/src/infra/http/DTOs/payment/*.ts` | Create | Swagger DTOs |
| `apps/api/src/infra/env/env.ts` | Modify | Add Stripe env vars |
| `apps/api/src/infra/database/database.module.ts` | Modify | Register PaymentsRepository |
| `apps/api/src/infra/http/http.module.ts` | Modify | Register controllers and use cases |

### Requirements

#### Environment Variables

Add to `apps/api/src/infra/env/env.ts`:
```
STRIPE_SECRET_KEY: z.string().startsWith('sk_test_')  // enforce test mode
STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_')
STRIPE_SUCCESS_URL: z.string().url()  // e.g., "leaselink://payment-success"
STRIPE_CANCEL_URL: z.string().url()   // e.g., "leaselink://payment-cancel"
```

The `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` are deep links for the mobile app. The mobile app handles these via Expo's linking system.

#### Stripe Service Implementation

**`apps/api/src/infra/stripe/stripe.service.ts`**

Implements the abstract `StripeService` from the domain layer. Uses the `stripe` npm package.

- Constructor: initialize Stripe with `STRIPE_SECRET_KEY` from env
- `createCheckoutSession`: calls `stripe.checkout.sessions.create()` with the provided params
- Add a `constructWebhookEvent` method for the webhook controller to use:
  ```typescript
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event
  ```
  This calls `stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)`.

**`apps/api/src/infra/stripe/stripe.module.ts`**

NestJS module that provides `StripeService` (the abstract class bound to the implementation). Export it so other modules can inject it.

Install the Stripe SDK: `npm install stripe` in `apps/api/`.

#### Prisma Mapper

Follow `PrismaLeaseMapper` pattern. Map all fields including `stripeCheckoutSessionId`, `stripePaymentIntentId`, `paidAt`. Enum values map through `PaymentStatus` value object.

#### Prisma Repository

Implement all 9 methods:

- `create` / `createMany` — standard inserts
- `findById` — standard lookup
- `findMany` (manager): supports `status`, `leaseId`, `tenantId`, `propertyId` filters. When `propertyId` is provided, join through lease: `where: { lease: { propertyId } }`. For manager scoping, accept optional `managerId` and filter: `where: { lease: { property: { managerId } } }`. Pagination, order by `dueDate desc`.
- `findManyByTenant`: `where: { tenantId }` with optional status filter
- `findByStripeSessionId`: `where: { stripeCheckoutSessionId: sessionId }`
- `findPendingOverdue`: `where: { status: 'PENDING', dueDate: { lt: new Date(now - gracePeriodDays) } }`
- `findExistingForLease`: `where: { leaseId, dueDate }` — match by lease and exact due date
- `update` — standard update

#### Controllers

**POST /payments/:id/checkout — CreateCheckoutSessionController**
- Tenant auth (not EmployeeOnlyGuard — tenants pay, not managers)
- Body validated with `createCheckoutSessionSchema` from `@leaselink/shared` (or just use the `:id` param since the DTO only has `paymentId`)
- Returns `{ url: string }` — the Stripe Checkout URL
- Error map: PaymentNotFoundError → 404, PaymentAlreadyPaidError → 409

**POST /payments/webhook — StripeWebhookController**
- **No auth guard** — this endpoint is called by Stripe, not an authenticated user. Must bypass `EnhancedAuthGuard`.
- Must receive **raw body** for signature verification. Use `@RawBody()` decorator or configure the route to skip body parsing. In NestJS, this typically requires a raw body middleware or `rawBody: true` in the NestJS app bootstrap.
- Validate the Stripe signature using `StripeService.constructWebhookEvent()`.
- Handle `checkout.session.completed` event → call `HandleCheckoutCompletedUseCase`.
- Always return 200 (even on errors — log them but don't return error status to Stripe).
- **Important:** Register this controller's route BEFORE the `/:id` route to avoid route conflicts.

**GET /payments — GetPaymentsController**
- Manager only (`EmployeeOnlyGuard`)
- Query params validated with `paymentFilterSchema` from `@leaselink/shared`
- Returns paginated response

**GET /payments/tenant — GetPaymentsByTenantController**
- Tenant only
- Returns the authenticated tenant's payments
- **Register BEFORE `GET /payments/:id`** to avoid route conflicts

**GET /payments/:id — GetPaymentByIdController**
- Both manager and tenant (access check in use case)

**POST /payments/generate — GeneratePaymentsController**
- Manager only (`EmployeeOnlyGuard`)
- Body: `{ leaseId: string }` — generates payments for a specific lease
- Alternative: no body — generates payments for ALL active leases owned by the manager (iterate through properties → leases)
- For Sprint 5, accept `leaseId` in body. Generating for all leases is a stretch goal.

**POST /payments/mark-overdue — MarkOverduePaymentsController**
- Manager only (`EmployeeOnlyGuard`)
- No body — runs the overdue check across all payments
- Returns `{ overdueCount: number }`

#### Route Ordering

Register controllers in this order to avoid conflicts:
1. `POST /payments/webhook` (before `:id` routes)
2. `POST /payments/generate`
3. `POST /payments/mark-overdue`
4. `GET /payments/tenant`
5. `GET /payments` (list)
6. `GET /payments/:id`
7. `POST /payments/:id/checkout`

#### Raw Body for Webhook

The Stripe webhook requires the raw request body for signature verification. In NestJS with Express, enable raw body parsing in `main.ts`:

```typescript
const app = await NestFactory.create(AppModule, {
  rawBody: true,  // ADD THIS
})
```

Then in the webhook controller, use `@Req() req` and access `req.rawBody`.

Check the existing `apps/api/src/main.ts` to see how the app is bootstrapped and add `rawBody: true` to the create options.

#### HTTP Presenter

Response shape:
```typescript
{
  id: string
  leaseId: string
  tenantId: string
  amount: number
  dueDate: string       // ISO 8601
  status: string
  stripeCheckoutSessionId: string | null
  paidAt: string | null  // ISO 8601
  createdAt: string
  updatedAt: string | null
}
```

Do NOT expose `stripePaymentIntentId` in the API response — it's internal. Only `stripeCheckoutSessionId` is useful for client reference.

### Acceptance Criteria

- [ ] Stripe SDK installed and `StripeService` implemented
- [ ] Stripe env vars added and validated (`sk_test_` prefix enforced)
- [ ] All 7 controllers registered and functional
- [ ] Webhook endpoint bypasses auth guard and validates Stripe signature
- [ ] Webhook handles raw body correctly for signature verification
- [ ] `POST /payments/:id/checkout` returns Stripe Checkout URL
- [ ] `POST /payments/webhook` processes `checkout.session.completed`
- [ ] `POST /payments/generate` creates payment records for a lease
- [ ] `POST /payments/mark-overdue` marks eligible payments as overdue
- [ ] `GET /payments` returns paginated list with filters (manager)
- [ ] `GET /payments/tenant` returns tenant's own payments
- [ ] Swagger UI shows all payment endpoints
- [ ] API starts without errors
- [ ] Existing tests still pass

---

## Task 4: Payment Pages — Web Dashboard (Web Agent)

### Objective

Build the payment management UI for property managers: payments overview page with filtering, payment detail page, generate/overdue action buttons, and integration with the lease detail page.

### Dependencies

- Task 3 (API endpoints must exist)
- Sprint 2–4 web foundation (dashboard layout, component patterns)

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-payments.ts` | TanStack Query hooks |
| `apps/web/src/app/(dashboard)/payments/page.tsx` | Replace placeholder — payments overview page |
| `apps/web/src/app/(dashboard)/payments/[id]/page.tsx` | Payment detail page |
| `apps/web/src/components/payments/payment-status-badge.tsx` | Status badge |
| `apps/web/src/components/payments/payment-summary-cards.tsx` | Revenue summary cards (top of page) |
| `apps/web/src/components/payments/generate-payments-dialog.tsx` | Dialog for triggering payment generation |
| `apps/web/src/app/(dashboard)/leases/[id]/page.tsx` | Modify — add payment history section |

### Requirements

#### TanStack Query Hooks — `use-payments.ts`

Follow `use-leases.ts` pattern:

- `usePayments(filters)` — `GET /payments` with status, leaseId, tenantId, propertyId, page, pageSize
- `usePayment(id)` — `GET /payments/:id`
- `useGeneratePayments()` — `POST /payments/generate`
- `useMarkOverduePayments()` — `POST /payments/mark-overdue`

Mutations should invalidate `['payments']` on success.

#### Payments Overview Page

Replace the placeholder at `apps/web/src/app/(dashboard)/payments/page.tsx`.

Features:
- **Summary cards** at the top (4 cards in a grid):
  - "Expected This Month" — sum of all PENDING + UPCOMING payments for current month
  - "Collected This Month" — sum of all PAID payments for current month
  - "Overdue" — count and sum of OVERDUE payments
  - "Upcoming" — count of UPCOMING payments for next month
  - Note: These summaries require client-side calculation from the payment data, or a future dedicated summary endpoint. For Sprint 5, calculate from the paginated data (fetch with large pageSize) or add a `GET /payments/summary` endpoint as a stretch goal.
- **Action buttons:**
  - "Mark Overdue" button — calls `POST /payments/mark-overdue`, shows result toast ("X payments marked overdue")
  - "Generate Payments" button → opens `GeneratePaymentsDialog` (select a lease → trigger generation)
- **Filter bar:** status dropdown (All, Upcoming, Pending, Paid, Overdue) + property filter + tenant filter + month picker (optional)
- **Table columns:** Property, Tenant, Amount, Due Date, Status, Paid At, Actions
  - Property and Tenant: resolve from IDs via lease lookup (same client-side join as lease list page)
  - Amount: formatted as currency ($2,500.00)
  - Due Date: formatted date
  - Status: `PaymentStatusBadge`
  - Paid At: formatted date or "—"
  - Actions: View
- OVERDUE rows should be visually highlighted (subtle red tint or left border)
- Pagination
- Empty state

Use `PAYMENT_STATUS_LABELS` from `@leaselink/shared`.

#### Payment Detail Page

Features:
- Header: "Payment — $X" with status badge
- Info card: lease (link), property (link), tenant (link), amount, due date, status, paid at
- Stripe info: Checkout Session ID (if exists) — for cross-referencing in Stripe Dashboard
- Back button to payments list

#### PaymentStatusBadge

| Status | Color |
|--------|-------|
| UPCOMING | `outline` (gray) |
| PENDING | `secondary` (blue) |
| PAID | green |
| OVERDUE | `destructive` (red) |

#### GeneratePaymentsDialog

A `Dialog` that:
- Has a lease selector (dropdown/combobox of ACTIVE leases). Show property address + tenant name.
- "Generate" button calls `POST /payments/generate` with the selected lease ID
- Success toast showing how many payments were generated
- Loading state during mutation

#### Lease Detail Page — Payment History Section

Modify `apps/web/src/app/(dashboard)/leases/[id]/page.tsx` to add a "Payments" section.

Features:
- Section header: "Payment History" with link to filtered payments page (`/payments?leaseId=<id>`)
- Table showing all payments for this lease (use `usePayments({ leaseId })`)
- Columns: Due Date, Amount, Status, Paid At
- "Generate Payments" button if lease is ACTIVE
- If no payments: "No payments generated yet."

### Acceptance Criteria

- [ ] Payments overview page shows all payments with status filter
- [ ] Summary cards display revenue totals (calculated from data)
- [ ] OVERDUE payments are visually highlighted
- [ ] "Mark Overdue" button works and shows result
- [ ] "Generate Payments" dialog allows lease selection and triggers generation
- [ ] Payment detail page shows all payment info
- [ ] Lease detail page shows payment history section
- [ ] Status badges render with correct colors
- [ ] `next build` passes

---

## Task 5: Payment Screens — Mobile App (Mobile Agent)

### Objective

Add payment functionality to the mobile app: new tab navigation layout, payments list screen, payment detail screen, and Stripe Checkout integration via in-app browser.

### Dependencies

- Task 3 (API endpoints must exist and Swagger spec must be up to date)
- Kubb codegen must be run after Task 3

### Pre-requisite Step

After Task 3 is complete:
```bash
cd apps/mobile && npx kubb generate
```

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `apps/mobile/app/(main)/_layout.tsx` | Modify — restructure to 4 tabs: Home, Maintenance, Payments, Notifications |
| `apps/mobile/app/(main)/index.tsx` | Modify — redirect to home instead of documents |
| `apps/mobile/app/(main)/home/index.tsx` | Create — tenant dashboard/home screen |
| `apps/mobile/app/(main)/payments/index.tsx` | Create — payments list screen |
| `apps/mobile/app/(main)/payments/[id].tsx` | Create — payment detail screen |
| `apps/mobile/src/components/Payments/PaymentList/index.tsx` | Create — list component with FlashList |
| `apps/mobile/src/components/Payments/PaymentItem/index.tsx` | Create — individual payment row |
| `apps/mobile/src/components/Payments/PaymentStatusBadge/index.tsx` | Create — status badge |
| `apps/mobile/src/hooks/usePayments/index.tsx` | Create — custom hook wrapping generated hooks |
| `apps/mobile/src/i18n/locales/en/payments.json` | Create — English translations |

### Requirements

#### Navigation Restructure

The current 3-tab layout (Documents, Maintenance, Notifications) changes to 4 tabs:

```typescript
const pagesWithFooter = [
  { path: '/home', label: 'home', icon: 'home-line' },
  { path: '/maintenance', label: 'maintenance', icon: 'tool-02' },
  { path: '/payments', label: 'payments', icon: 'credit-card-02' },  // or appropriate icon
  { path: '/notifications', label: 'notifications', icon: 'bell-01' },
]
```

Documents are now accessible from the Home screen (as a card/link) rather than a dedicated tab. This matches the product spec's 5-tab layout (Home, Maintenance, Payments, Documents, Notifications) but with 4 tabs to avoid overcrowding — Documents moves under Home.

Update `apps/mobile/app/(main)/index.tsx` to redirect to `/home` instead of `/documents`.

#### Home Screen

**`apps/mobile/app/(main)/home/index.tsx`**

A dashboard screen showing:
- **Lease summary card:** property address, lease dates, monthly rent. If no active lease, show "No active lease" state.
- **Next payment due card:** amount, due date, status badge, "Pay Now" button (if PENDING or OVERDUE). If no pending payment, show "All caught up" or next upcoming date.
- **Quick links:** "Documents" (navigates to `/documents`), "Maintenance" (navigates to `/maintenance`)

Uses:
- `GET /leases/tenant` (existing) to get active lease
- `GET /payments/tenant` to get payments, sorted by due date

#### Payments List Screen

**`apps/mobile/app/(main)/payments/index.tsx`**

Follow the maintenance list screen pattern:

- Header: "Payments" title
- Filter buttons: status filter (All, Upcoming, Pending, Paid, Overdue)
- Payment list with FlashList, 10 items per page
- Each item shows: amount (large), due date, status badge, paid date (if paid)
- Empty state: "No payments yet."
- Loading skeleton

Uses `GET /payments/tenant` via generated hook.

#### Payment Detail Screen

**`apps/mobile/app/(main)/payments/[id].tsx`**

- Header with back button
- Amount (large, prominent)
- Status badge
- Due date
- Paid date (if applicable)
- **"Pay Now" button** — visible when status is PENDING or OVERDUE
  - Calls `POST /payments/:id/checkout` to get the Stripe Checkout URL
  - Opens the URL in an in-app browser using `expo-web-browser` (`WebBrowser.openBrowserAsync(url)`)
  - After the browser closes, refetch the payment to check if it was paid (the webhook may have already processed)
- If PAID, show a "Paid" confirmation state
- If UPCOMING, show "Payment not yet due" informational text

#### Stripe Checkout In-App Browser

Install if not already present: `npx expo install expo-web-browser`

Flow:
1. Tenant taps "Pay Now"
2. Loading state while creating checkout session
3. Call `POST /payments/:id/checkout` → get `{ url }`
4. Call `WebBrowser.openBrowserAsync(url)`
5. Stripe Checkout page loads in the in-app browser
6. Tenant enters test card `4242 4242 4242 4242`, any future expiry, any CVC
7. Stripe redirects to `success_url` (deep link back to app) or `cancel_url`
8. App refetches payment status
9. Show success/cancel feedback

**Deep link handling:** The `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` should be configured as deep links that the app handles. For Expo, use `exp://` or a custom scheme. The success URL should include the payment ID so the app knows which payment to refetch: `leaselink://payment-success?paymentId=<id>`.

Check the existing Expo linking configuration (`apps/mobile/app.json` or `app.config.ts`) for the app's URL scheme. If no custom scheme exists, add one (e.g., `leaselink`).

#### Custom Hook — `usePayments`

Wraps generated Kubb hooks:

- `useMyPayments(filters)` — calls the tenant payments hook
- `usePayRent(paymentId)` — mutation that creates checkout session and opens browser
- `useNextPaymentDue()` — derived query that returns the next PENDING or OVERDUE payment

### Acceptance Criteria

- [ ] 4-tab footer navigation: Home, Maintenance, Payments, Notifications
- [ ] Home screen shows lease summary and next payment due
- [ ] "Pay Now" on home screen navigates to payment or opens Stripe directly
- [ ] Payments list shows tenant's payments with status filters
- [ ] Payment detail shows amount, due date, status
- [ ] "Pay Now" creates checkout session and opens Stripe in-app browser
- [ ] Stripe Checkout loads with test card entry
- [ ] After payment, app reflects PAID status (after refetch)
- [ ] Documents accessible from Home screen
- [ ] No regressions in existing maintenance/notification screens
- [ ] App runs without errors: `npx expo start`

### Test Cases

Manual verification:

1. **Navigation:** See 4 tabs, Home is default
2. **Home screen:** Shows lease info and next payment due
3. **No lease state:** Tenant without lease sees appropriate empty state
4. **Payments list:** Tap Payments tab → see payment list
5. **Filter:** Filter by PENDING → only pending shown
6. **Pay rent:** Tap "Pay Now" → Stripe Checkout opens → enter `4242 4242 4242 4242` → complete → return to app → payment shows PAID
7. **Cancel payment:** Open Stripe Checkout → tap back/cancel → return to app → payment still PENDING
8. **Overdue display:** Overdue payment shows red status badge
9. **Empty state:** No payments → see "No payments yet" message
10. **Documents access:** Navigate to Documents from Home screen

---

## Implementation Order

```
Task 1 ──> Task 2 ──> Task 3 ──> Task 4 (Web)
(Notif)    (Domain)   (Infra)    [Web Agent]
                          │
                          ├────> Task 5 (Mobile)
                          │      [Mobile Agent]
                          └── (run Kubb)
```

**Parallel work:**
- **Task 1** is small and must complete before Task 2 (notification entity updates)
- **Task 2** depends on Task 1
- **Task 3** depends on Task 2
- **Task 4** (Web) and **Task 5** (Mobile) can run in parallel once Task 3 is complete and Kubb has been regenerated

**Recommended execution:**
1. **Task 1** (Backend — small, quick)
2. **Task 2** (Backend — domain layer)
3. **Task 3** (Backend — infrastructure layer). After this, install Stripe SDK and run Kubb codegen.
4. **Task 4** (Web) and **Task 5** (Mobile) in parallel

---

## Definition of Done

Sprint 5 is complete when:

1. `cd apps/api && npx tsc --noEmit` passes
2. `cd apps/api && npm run test` passes (all existing + new payment use case tests)
3. `cd apps/api && npm run start:dev` starts without errors
4. Swagger UI shows all 7 payment endpoints
5. `cd apps/web && npx next build` passes with no errors
6. `cd apps/web && npm run dev` starts without errors
7. `cd apps/mobile && npx expo start` runs without errors
8. Payment workflow works end-to-end:
   - Manager activates a lease → payment records generated
   - Tenant sees pending payment in mobile app
   - Tenant taps "Pay Now" → Stripe Checkout opens
   - Tenant completes payment with test card `4242 4242 4242 4242`
   - Stripe webhook fires → payment marked PAID
   - Manager sees PAID status on web dashboard
   - Manager receives PAYMENT_RECEIVED notification
9. Overdue flow works:
   - Payment passes grace period (5 days)
   - Manager triggers "Mark Overdue" → payment becomes OVERDUE
   - Tenant receives PAYMENT_OVERDUE notification
   - Tenant can still pay an overdue payment
10. Web payments page has working filters, summary cards, and pagination
11. Lease detail page shows payment history
12. Mobile app has 4-tab navigation with Home screen
13. No regressions in existing functionality (properties, tenants, leases, maintenance, documents, notifications)
