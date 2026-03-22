# LeaseLink Business Logic Audit — 2026-03-20

Full codebase audit from the perspective of a business analyst. Issues are prioritized by severity and grouped by domain.

**Last updated:** 2026-03-22 (post-sprint 19 manual testing)

---

## CRITICAL — Security

### SEC-1: Unguarded Cross-User Data Access on Edit Client
**File:** `apps/api/src/infra/http/controllers/edit-client-status/edit-client.controller.ts`
**Issue:** No ownership validation. Any authenticated CLIENT can modify any other CLIENT's status, onboarding status, deviceId, and pushToken by passing an arbitrary `clientId` in the URL.
**Impact:** Data tampering, account takeover potential.
**Fix:** Verify `user.id === clientId` OR require `EmployeeOnlyGuard`.
**Status:** OPEN

### SEC-2: Unguarded Document Download — No Ownership Check
**Files:**
- `apps/api/src/domain/document/application/use-cases/download-document.ts`
- `apps/api/src/infra/http/controllers/download-document/download-document.controller.ts`
**Issue:** Use case only takes `documentId`, no user context. Any authenticated user can download any document by ID.
**Impact:** Tenants can access other tenants' confidential documents (lease agreements, inspection reports, insurance).
**Fix:** Add `requestingUserId` to use case, verify `document.clientId === requestingUserId` OR user is EMPLOYEE.
**Status:** OPEN

### SEC-3: Unguarded Document Retrieval by ID
**Files:**
- `apps/api/src/domain/document/application/use-cases/get-document-by-id.ts`
- `apps/api/src/infra/http/controllers/get-document-by-id/get-document-by-id.controller.ts`
**Issue:** Same as SEC-2 — no ownership verification on GET.
**Impact:** Metadata + thumbnail URL leakage for any tenant's documents.
**Status:** OPEN

### SEC-4: Document Upload Accepts Arbitrary Client ID
**File:** `apps/api/src/infra/http/controllers/confirm-upload-document/confirm-upload-document.controller.ts`
**Issue:** Body accepts `clientId` with no verification against authenticated user. A CLIENT can upload documents impersonating another CLIENT.
**Fix:** Remove `clientId` from body, use `@CurrentUser()` and always derive from auth context.
**Status:** OPEN

### SEC-5: Unguarded Profile Photo Access
**Files:**
- `apps/api/src/infra/http/controllers/get-client-profile-photo/get-client-profile-photo.controller.ts`
- `apps/api/src/infra/http/controllers/upload-client-profile-photo/upload-client-profile-photo.controller.ts`
**Issue:** Both endpoints accept arbitrary `clientId` from URL with no ownership verification.
**Impact:** Any CLIENT can read/write any other CLIENT's profile photo.
**Status:** OPEN

---

## CRITICAL — Data Integrity

### DAT-1: Notification Presenter Maps Wrong Field
**File:** `apps/api/src/infra/http/presenters/http-notifications-presenter.ts`
**Issue:** `linkedMaintenanceRequestId` is being set to `linkedTransactionId` instead of actual maintenance request ID. This is a copy-paste bug from the old naming.
**Impact:** Notification deep links to maintenance requests are broken — clicking a maintenance notification navigates nowhere or to the wrong item.
**Fix:** Map `linkedMaintenanceRequestId` to `notification.linkedMaintenanceRequestId`.
**Status:** OPEN — verify if still applicable after sprint 17-19 changes

---

## HIGH — Business Logic

### BIZ-1: UpdateProperty PUT Bypasses Status Transition Validation
**File:** `apps/api/src/domain/property-management/application/use-cases/update-property.ts`
**Issue:** The PUT `/properties/:id` endpoint accepts a `status` field. This allows bypassing the dedicated PATCH `/properties/:id/status` endpoint which validates transitions and checks for active leases.
**Impact:** Manager can set OCCUPIED → VACANT directly, bypassing the "has active lease" check. Data inconsistency.
**Fix:** Remove `status` from `updatePropertySchema` and `UpdatePropertyUseCase`. Force use of the dedicated status endpoint.
**Status:** OPEN

### BIZ-2: No Auto-Activation Scheduler for PENDING Leases
**Issue:** When a PENDING lease's `startDate` arrives, nothing automatically activates it.
**Impact:** Leases remain PENDING past their start date. Property shows wrong status. No payments generated.
**Fix:** Add `ActivatePendingLeasesUseCase` + scheduler cron at midnight.
**Status:** FIXED in sprint 17 — `lease-scheduler.service.ts` added

### BIZ-3: Missing Rent Reminder in Scheduler
**File:** `apps/api/src/infra/scheduler/payment-scheduler.service.ts`
**Issue:** Scheduler runs activation, generation, and overdue detection but NOT `SendRentDueRemindersUseCase`.
**Impact:** Tenants never get automatic reminders before rent is due (spec says 3 days before).
**Fix:** Add `@Cron('0 8 * * *')` for `SendRentDueRemindersUseCase`.
**Status:** FIXED in sprint 17 — `rent-reminder-scheduler.service.ts` added

### BIZ-4: Timezone-Naive Date Comparisons
**Files:**
- `apps/api/src/domain/lease-management/application/use-cases/create-lease.ts` (line 91)
- `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts` (line 85)
- `apps/api/src/domain/lease-management/application/use-cases/update-lease-status.ts` (line 58)
- `apps/api/src/domain/payment/application/use-cases/activate-upcoming-payments.ts`
- `apps/api/src/domain/payment/application/use-cases/mark-overdue-payments.ts`
**Issue:** All use `new Date()` with `setHours(0,0,0,0)` (local timezone). Server timezone affects which day "today" is.
**Impact:** Off-by-one day errors depending on server timezone.
**Fix:** Use `setUTCHours(0,0,0,0)` consistently.
**Status:** OPEN — low risk in practice (servers typically UTC)

### BIZ-5: Payment Generation Can Be Called Twice on Renewal
**Issue:** If renewal auto-activates (start ≤ today), payments are generated in `renew-lease.ts`. If someone then calls PATCH to set ACTIVE again, `update-lease-status.ts` generates payments again.
**Impact:** Duplicate payment records (mitigated by dedup check in generate-lease-payments, but fragile).
**Fix:** In `update-lease-status`, only generate payments if the lease was transitioning FROM PENDING.
**Status:** OPEN — mitigated by existing dedup check

### BIZ-6: Stripe Webhook Silently Swallows Errors
**File:** `apps/api/src/infra/http/controllers/stripe-webhook/stripe-webhook.controller.ts`
**Issue:** Catch block logs `console.error()` and returns `{ received: true }`. Failed payment processing is invisible.
**Impact:** Payments marked complete in Stripe may fail to update in database.
**Fix:** Add structured error logging. Consider a failed-webhook tracking table for retry.
**Status:** OPEN

---

## MEDIUM — Business Logic

### BIZ-7: Renewal Doesn't Check Tenant for Active Lease on Different Property
**File:** `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts`
**Issue:** `create-lease.ts` checks for existing active lease per tenant, but `renew-lease.ts` skips this check.
**Impact:** Low probability (renewal reuses same tenant/property), but violates the "one active lease per tenant" rule.
**Status:** OPEN

### BIZ-8: Payment Status Transitions Not Validated at Entity Level
**File:** `apps/api/src/domain/payment/enterprise/entities/payment.ts`
**Issue:** The `status` setter accepts any string. Transition validation only happens in use cases, not the entity.
**Status:** FIXED in sprint 17 — entity-level validation added

### BIZ-9: Property Status Not Validated at Entity Level
**File:** `apps/api/src/domain/property-management/enterprise/entities/property.ts`
**Issue:** Same as BIZ-8 — `status` setter allows any `PropertyStatusType` without transition check.
**Status:** FIXED in sprint 17 — entity-level validation added

---

## MEDIUM — Contract Mismatches

### CON-1 to CON-4: API Response Format Inconsistencies
**Issue:** Mixed response formats, pagination styles, and field names across endpoints.
**Status:** MOSTLY FIXED in sprints 18-19
- List endpoints standardized to `{ data: [], meta: { page, pageSize, totalCount, totalPages } }`
- Single resource endpoints standardized to `{ data: Resource }`
- Mobile infinite scroll fixed to use `page`/`pageSize` with `meta`-based pagination
- **Remaining:** Some mutation endpoints (POST/PUT) still return `{ property: ... }` instead of `{ data: ... }`. Non-breaking since mutation responses are not consumed by field name.

---

## RESOLVED — Manual Testing (2026-03-22)

Issues found and fixed during E2E manual testing:

| Issue | Description | Fix |
|-------|-------------|-----|
| Mobile lists empty | PaymentList, MaintenanceRequestList, DocumentsList, NotificationsList read old field names (`page.payments`, etc.) | Changed to `page.data` |
| Document detail broken | `data?.document` → `data?.data` across detail, preview, and sign screens | Fixed all references |
| Download button squashed | Constraining wrapper View on document detail | Removed wrapper |
| E-signature failed | React Native can't create Blob from Uint8Array | Used data URI fetch pattern |
| Maintenance status labels | Notification text showed `IN_PROGRESS` instead of `In Progress` | Used `MAINTENANCE_STATUS_LABELS` |
| SIGN_DOCUMENT navigation | Notification routed to upload flow instead of document | Fixed routing condition |
| Payment notification missing | Tenant not notified on payment received | Added tenant notification |
| Maintenance notifications non-archivable | Status updates marked as ACTION instead of INFO | Changed to INFO |
| Infinite scroll broken | Notifications/documents sent `offset`/`limit` but API expects `page`/`pageSize` | Fixed to page-based pagination |
| Expense detail broken (web) | `data?.expense` → `data?.data` | Fixed hook and pages |
| Receipt display broken (web) | Used blob key as img src instead of signed URL | Added URL generation in controller |
| Lease form validation flash | Property/tenant select showed validation error on submit despite valid selection | Added `.min(1)` and `mode: "onBlur"` |
| Maintenance vendor update error | "Invalid status transition OPEN → OPEN" when only assigning vendor | Skip transition check when status unchanged |
| Green branding remnants | Stonehage green `#006237` in onboarding SVG | Changed to `#18181b` |

---

## LOW — Improvements

### IMP-1: No Lease Duration Validation
**Issue:** Schema validates `endDate > startDate` but allows 1-day or 50-year leases.
**Status:** OPEN

### IMP-2: Hardcoded Status Strings in Frontend
**Issue:** Web components use `"LISTED"`, `"VACANT"` instead of importing enums from shared.
**Status:** OPEN

### IMP-3: Stripe Session ID Exposed in Payment API Response
**File:** `apps/api/src/infra/http/presenters/http-payment-presenter.ts`
**Issue:** `stripeCheckoutSessionId` returned to frontend clients who don't need it.
**Status:** OPEN

### IMP-4: No Early Termination Fee Logic
**Issue:** Lease terminates without financial impact. No termination fee field or enforcement.
**Status:** OPEN

### IMP-5: Photo Upload Limit Uses Generic Error
**File:** `apps/api/src/domain/property-management/application/use-cases/upload-property-photos.ts`
**Issue:** Throws generic `Error` instead of domain-specific error class.
**Status:** OPEN
