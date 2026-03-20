# LeaseLink Business Logic Audit — 2026-03-20

Full codebase audit from the perspective of a business analyst. Issues are prioritized by severity and grouped by domain.

---

## CRITICAL — Security

### SEC-1: Unguarded Cross-User Data Access on Edit Client
**File:** `apps/api/src/infra/http/controllers/edit-client-status/edit-client.controller.ts`
**Issue:** No ownership validation. Any authenticated CLIENT can modify any other CLIENT's status, onboarding status, deviceId, and pushToken by passing an arbitrary `clientId` in the URL.
**Impact:** Data tampering, account takeover potential.
**Fix:** Verify `user.id === clientId` OR require `EmployeeOnlyGuard`.

### SEC-2: Unguarded Document Download — No Ownership Check
**Files:**
- `apps/api/src/domain/document/application/use-cases/download-document.ts`
- `apps/api/src/infra/http/controllers/download-document/download-document.controller.ts`
**Issue:** Use case only takes `documentId`, no user context. Any authenticated user can download any document by ID.
**Impact:** Tenants can access other tenants' confidential documents (lease agreements, inspection reports, insurance).
**Fix:** Add `requestingUserId` to use case, verify `document.clientId === requestingUserId` OR user is EMPLOYEE.

### SEC-3: Unguarded Document Retrieval by ID
**Files:**
- `apps/api/src/domain/document/application/use-cases/get-document-by-id.ts`
- `apps/api/src/infra/http/controllers/get-document-by-id/get-document-by-id.controller.ts`
**Issue:** Same as SEC-2 — no ownership verification on GET.
**Impact:** Metadata + thumbnail URL leakage for any tenant's documents.

### SEC-4: Document Upload Accepts Arbitrary Client ID
**File:** `apps/api/src/infra/http/controllers/confirm-upload-document/confirm-upload-document.controller.ts`
**Issue:** Body accepts `clientId` with no verification against authenticated user. A CLIENT can upload documents impersonating another CLIENT.
**Fix:** Remove `clientId` from body, use `@CurrentUser()` and always derive from auth context.

### SEC-5: Unguarded Profile Photo Access
**Files:**
- `apps/api/src/infra/http/controllers/get-client-profile-photo/get-client-profile-photo.controller.ts`
- `apps/api/src/infra/http/controllers/upload-client-profile-photo/upload-client-profile-photo.controller.ts`
**Issue:** Both endpoints accept arbitrary `clientId` from URL with no ownership verification.
**Impact:** Any CLIENT can read/write any other CLIENT's profile photo.

---

## CRITICAL — Data Integrity

### DAT-1: Notification Presenter Maps Wrong Field
**File:** `apps/api/src/infra/http/presenters/http-notifications-presenter.ts`
**Issue:** `linkedMaintenanceRequestId` is being set to `linkedTransactionId` instead of actual maintenance request ID. This is a copy-paste bug from the old naming.
**Impact:** Notification deep links to maintenance requests are broken — clicking a maintenance notification navigates nowhere or to the wrong item.
**Fix:** Map `linkedMaintenanceRequestId` to `notification.linkedMaintenanceRequestId`.

---

## HIGH — Business Logic

### BIZ-1: UpdateProperty PUT Bypasses Status Transition Validation
**File:** `apps/api/src/domain/property-management/application/use-cases/update-property.ts`
**Issue:** The PUT `/properties/:id` endpoint accepts a `status` field. This allows bypassing the dedicated PATCH `/properties/:id/status` endpoint which validates transitions and checks for active leases.
**Impact:** Manager can set OCCUPIED → VACANT directly, bypassing the "has active lease" check. Data inconsistency.
**Fix:** Remove `status` from `updatePropertySchema` and `UpdatePropertyUseCase`. Force use of the dedicated status endpoint.

### BIZ-2: No Auto-Activation Scheduler for PENDING Leases
**Issue:** When a PENDING lease's `startDate` arrives, nothing automatically activates it. The use case prevents manual activation before the start date (good), but there's no cron job to auto-activate when the date arrives.
**Impact:** Leases remain PENDING past their start date. Property shows wrong status. No payments generated.
**Fix:** Add `ActivatePendingLeasesUseCase` + scheduler cron at midnight.

### BIZ-3: Missing Rent Reminder in Scheduler
**File:** `apps/api/src/infra/scheduler/payment-scheduler.service.ts`
**Issue:** Scheduler runs activation, generation, and overdue detection but NOT `SendRentDueRemindersUseCase`. The reminder is never triggered automatically.
**Impact:** Tenants never get automatic reminders before rent is due (spec says 3 days before).
**Fix:** Add `@Cron('0 8 * * *')` for `SendRentDueRemindersUseCase`.

### BIZ-4: Timezone-Naive Date Comparisons
**Files:**
- `apps/api/src/domain/lease-management/application/use-cases/create-lease.ts` (line 91)
- `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts` (line 85)
- `apps/api/src/domain/lease-management/application/use-cases/update-lease-status.ts` (line 58)
- `apps/api/src/domain/payment/application/use-cases/activate-upcoming-payments.ts`
- `apps/api/src/domain/payment/application/use-cases/mark-overdue-payments.ts`
**Issue:** All use `new Date()` with `setHours(0,0,0,0)` (local timezone). Server timezone affects which day "today" is.
**Impact:** Off-by-one day errors depending on server timezone. Lease activates a day early/late. Payment marked overdue at wrong time.
**Fix:** Use `setUTCHours(0,0,0,0)` consistently.

### BIZ-5: Payment Generation Can Be Called Twice on Renewal
**Files:**
- `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts` (line 109)
- `apps/api/src/domain/lease-management/application/use-cases/update-lease-status.ts` (line 105)
**Issue:** If renewal auto-activates (start ≤ today), payments are generated in `renew-lease.ts`. If someone then calls PATCH to set ACTIVE again, `update-lease-status.ts` generates payments again.
**Impact:** Duplicate payment records (mitigated by dedup check in generate-lease-payments, but fragile).
**Fix:** In `update-lease-status`, only generate payments if the lease was transitioning FROM PENDING (check previous status).

### BIZ-6: Stripe Webhook Silently Swallows Errors
**File:** `apps/api/src/infra/http/controllers/stripe-webhook/stripe-webhook.controller.ts`
**Issue:** Catch block logs `console.error()` and returns `{ received: true }`. Failed payment processing is invisible.
**Impact:** Payments marked complete in Stripe may fail to update in database. Tenant appears unpaid despite paying.
**Fix:** Add structured error logging. Consider a failed-webhook tracking table for retry.

---

## MEDIUM — Business Logic

### BIZ-7: Renewal Doesn't Check Tenant for Active Lease on Different Property
**File:** `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts`
**Issue:** `create-lease.ts` checks for existing active lease per tenant, but `renew-lease.ts` skips this check. If a tenant somehow has an active lease on property A and a renewal is created from property B, it could result in multiple active leases.
**Impact:** Low probability (renewal reuses same tenant/property), but violates the "one active lease per tenant" rule.
**Fix:** Add active lease check, excluding the original lease being renewed.

### BIZ-8: Payment Status Transitions Not Validated at Entity Level
**File:** `apps/api/src/domain/payment/enterprise/entities/payment.ts`
**Issue:** The `status` setter accepts any string. Transition validation only happens in use cases, not the entity.
**Impact:** Invalid transitions possible if entity is used outside intended use cases (e.g., PAID → PENDING).

### BIZ-9: Property Status Not Validated at Entity Level
**File:** `apps/api/src/domain/property-management/enterprise/entities/property.ts`
**Issue:** Same as BIZ-8 — `status` setter allows any `PropertyStatusType` without transition check.

---

## MEDIUM — Contract Mismatches

### CON-1: Mobile Payment Response Uses `total` vs API's `totalCount`
**Files:** Mobile hook expects `total`, API returns `totalCount`.
**Fix:** Align mobile to use `totalCount`.

### CON-2: Mobile Maintenance Response Uses `total` vs API's `totalCount`
**Same pattern as CON-1.**

### CON-3: Single Resource Response Wrapping Inconsistent
**Issue:** Some endpoints return `{ data: Resource }`, others return `{ property: Resource }`, `{ payments: [...] }`, etc.
**Fix:** Standardize all single-resource responses to `{ data: Resource }`.

### CON-4: Pagination Uses Mixed Styles
**Issue:** Lease/property/payment endpoints use `page/pageSize` with `meta` wrapper. Document/notification endpoints use `offset/limit` with no `meta`.
**Fix:** Standardize to `page/pageSize` with `{ data: [], meta: { page, pageSize, totalCount, totalPages } }`.

---

## LOW — Improvements

### IMP-1: No Lease Duration Validation
**Issue:** Schema validates `endDate > startDate` but allows 1-day or 50-year leases.

### IMP-2: Hardcoded Status Strings in Frontend
**Issue:** Web components use `"LISTED"`, `"VACANT"` instead of importing enums from shared.

### IMP-3: Stripe Session ID Exposed in Payment API Response
**File:** `apps/api/src/infra/http/presenters/http-payment-presenter.ts`
**Issue:** `stripeCheckoutSessionId` returned to frontend clients who don't need it.

### IMP-4: No Early Termination Fee Logic
**Issue:** Lease terminates without financial impact. No termination fee field or enforcement.

### IMP-5: Photo Upload Limit Uses Generic Error
**File:** `apps/api/src/domain/property-management/application/use-cases/upload-property-photos.ts`
**Issue:** Throws generic `Error` instead of domain-specific error class.
