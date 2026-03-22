# Sprint 18: API Contract Standardization

## Overview

With Sprint 17 resolving all CRITICAL security and HIGH business logic issues from the codebase audit, the remaining friction is in API response contracts. List endpoints use three different patterns, single-resource endpoints wrap responses under inconsistent keys, and two endpoints use `offset/limit` while the rest use `page/pageSize`. Mobile hooks paper over these inconsistencies with per-endpoint parsing — a source of bugs when new endpoints are added.

**Goal:** Every API endpoint follows the same response contract. List endpoints return `{ data: [], meta: { page, pageSize, totalCount, totalPages } }`. Single-resource endpoints return `{ data: Resource }`. Mobile and web clients consume a single, predictable shape.

**Scope:** `apps/api` (controllers + presenters), `apps/mobile` (hooks), `apps/web` (API consumers). No schema changes, no new endpoints, no new dependencies.

---

## What Exists

| Pattern | Endpoints | Response Shape |
|---------|-----------|----------------|
| **A — Standard** | `get-properties`, `get-leases`, `get-expenses`, `get-vendors`, `get-clients`, `get-audit-logs`, `get-audit-logs-by-resource` | `{ data: [...], meta: { page, pageSize, totalCount, totalPages } }` |
| **B — Bare list + totalCount** | `get-payments`, `get-payments-by-tenant`, `get-maintenance-requests`, `get-maintenance-requests-by-tenant`, `get-maintenance-requests-by-property` | `{ payments: [...], totalCount }` or `{ maintenanceRequests: [...], totalCount }` — no `meta`, no `totalPages` |
| **C — Bare list, no metadata** | `get-documents`, `get-notifications` | `{ documents: [...] }` or `{ notifications: [...] }` — uses `offset/limit` params, returns no pagination metadata at all |
| **D — Single resource (mixed keys)** | `get-property-by-id` → `{ property }`, `get-payment-by-id` → `{ payment }`, `get-expense-by-id` → `{ expense }`, `get-document-by-id` → `{ document }`, `get-maintenance-request-by-id` → `{ maintenanceRequest }`, `get-vendor-by-id` → `{ vendor }` | Domain-specific key wrapping |
| **D — Single resource (standard)** | `get-lease-by-id` → `{ data }`, `get-client-by-id` → `{ data }` | Already use `{ data: Resource }` |

**Mobile hooks affected:**
- `usePayments` — expects `{ payments, totalCount }`, uses `totalCount` for infinite scroll
- `useMaintenanceRequests` — expects `{ maintenanceRequests, totalCount }`, same pattern
- `useLeases` — already expects `{ data, meta }` (Pattern A)

**E2E test coverage:** 65 of 87 controllers have E2E tests. The 5 Pattern B controllers all have existing E2E tests that assert the current response shape — these tests must be updated alongside the controller changes.

---

## Architectural Decisions

1. **Standardize on Pattern A for all list endpoints** — `{ data: [], meta: { page, pageSize, totalCount, totalPages } }` is already the majority pattern (7 of 14 list endpoints). Migrate the remaining 7 to match. This eliminates per-endpoint parsing in clients.

2. **Standardize on `{ data: Resource }` for all single-resource endpoints** — 6 endpoints use domain-specific keys (`property`, `payment`, etc.), 2 already use `data`. Converge on `data` so clients don't need to know the key name per resource type.

3. **Replace `offset/limit` with `page/pageSize`** — Only `get-documents` and `get-notifications` use offset/limit. Convert them to page/pageSize to match every other paginated endpoint. The repository layer can convert `page/pageSize` to `skip/take` internally (Prisma's native pagination).

4. **Update clients in the same sprint** — Breaking the API contract without updating consumers creates runtime failures. Mobile hooks and web components must be updated atomically with the API changes.

5. **Shared pagination types in `@leaselink/shared`** — Add a generic `PaginatedResponse<T>` type and `PaginationMeta` type to the shared package. Both API presenters and client hooks import from the same source of truth.

---

## Task 1: Shared Pagination Types

### Why
Every list controller independently constructs its `meta` object. A shared type ensures all endpoints and clients agree on the exact shape.

### Files to Create

| File | Purpose |
|------|---------|
| `packages/shared/src/types/pagination.ts` | `PaginationMeta` and `PaginatedResponse<T>` types |

### Files to Modify

| File | Purpose |
|------|---------|
| `packages/shared/src/index.ts` | Export new pagination types |

### Requirements

Add to `@leaselink/shared`:

```
PaginationMeta = { page: number; pageSize: number; totalCount: number; totalPages: number }
PaginatedResponse<T> = { data: T[]; meta: PaginationMeta }
```

These are type-only exports — no runtime code needed.

### Acceptance Criteria

- `PaginationMeta` and `PaginatedResponse<T>` are importable from `@leaselink/shared`
- Types match the shape already used by Pattern A controllers

---

## Task 2: Standardize List Endpoint Responses

### Audit Issues Resolved
- **CON-3**: Response wrapping inconsistency
- **CON-4**: Pagination uses mixed styles

### Files to Modify

**Pattern B → Pattern A (5 controllers):**

| File | Current Shape | Target Shape |
|------|--------------|--------------|
| `apps/api/src/infra/http/controllers/get-payments/get-payments.controller.ts` | `{ payments, totalCount }` | `{ data, meta }` |
| `apps/api/src/infra/http/controllers/get-payments-by-tenant/get-payments-by-tenant.controller.ts` | `{ payments, totalCount }` | `{ data, meta }` |
| `apps/api/src/infra/http/controllers/get-maintenance-requests/get-maintenance-requests.controller.ts` | `{ maintenanceRequests, totalCount }` | `{ data, meta }` |
| `apps/api/src/infra/http/controllers/get-maintenance-requests-by-tenant/get-maintenance-requests-by-tenant.controller.ts` | `{ maintenanceRequests, totalCount }` | `{ data, meta }` |
| `apps/api/src/infra/http/controllers/get-maintenance-requests-by-property/get-maintenance-requests-by-property.controller.ts` | `{ maintenanceRequests, totalCount }` | `{ data, meta }` |

**Pattern C → Pattern A (2 controllers + repositories):**

| File | Current Shape | Target Shape |
|------|--------------|--------------|
| `apps/api/src/infra/http/controllers/get-documents/get-documents.controller.ts` | `{ documents }` with `offset/limit` | `{ data, meta }` with `page/pageSize` |
| `apps/api/src/infra/http/controllers/get-notifications/get-notifications.controller.ts` | `{ notifications }` with `offset/limit` | `{ data, meta }` with `page/pageSize` |

For Pattern C controllers, the Zod query schema must change from `offset/limit` to `page/pageSize`, and the repository call must convert `page/pageSize` to Prisma's `skip/take` (same conversion Pattern A controllers already do).

### Requirements

For each controller:
1. Replace the domain-specific list key (e.g., `payments`, `maintenanceRequests`, `documents`) with `data`
2. Wrap pagination metadata in a `meta` object: `{ page, pageSize, totalCount, totalPages }` where `totalPages = Math.ceil(totalCount / pageSize)`
3. For Pattern C: change query schema from `offset: z.coerce.number(), limit: z.coerce.number()` to `page: z.coerce.number().default(1), pageSize: z.coerce.number().default(10)`
4. Update any corresponding E2E tests to assert the new response shape

### Patterns to Follow

- Existing Pattern A controllers (e.g., `get-properties`, `get-leases`) — copy the exact `meta` construction and response shape
- The `page/pageSize → skip/take` conversion is already implemented in Pattern A controllers — reuse that logic

### Acceptance Criteria

- All 14 list endpoints return `{ data: [...], meta: { page, pageSize, totalCount, totalPages } }`
- No endpoint uses `offset/limit` query params
- No endpoint returns a domain-specific list key (e.g., `payments`, `maintenanceRequests`)
- All existing E2E tests for modified controllers pass with updated assertions

### Test Cases

1. `GET /payments?page=1&pageSize=10` returns `{ data: [...], meta: { page: 1, pageSize: 10, totalCount: N, totalPages: M } }`
2. `GET /maintenance-requests?page=2&pageSize=5` returns same structure with correct page offset
3. `GET /documents?page=1&pageSize=20` returns paginated documents (previously used offset/limit)
4. `GET /notifications?page=1&pageSize=10` returns paginated notifications (previously used offset/limit)

---

## Task 3: Standardize Single-Resource Responses

### Audit Issues Resolved
- **CON-3**: Response wrapping inconsistency (single-resource variant)

### Files to Modify

| File | Current Key | Target Key |
|------|------------|------------|
| `apps/api/src/infra/http/controllers/get-property-by-id/get-property-by-id.controller.ts` | `property` | `data` |
| `apps/api/src/infra/http/controllers/get-payment-by-id/get-payment-by-id.controller.ts` | `payment` | `data` |
| `apps/api/src/infra/http/controllers/get-expense-by-id/get-expense-by-id.controller.ts` | `expense` | `data` |
| `apps/api/src/infra/http/controllers/get-document-by-id/get-document-by-id.controller.ts` | `document` | `data` |
| `apps/api/src/infra/http/controllers/get-maintenance-request-by-id/get-maintenance-request-by-id.controller.ts` | `maintenanceRequest` | `data` |
| `apps/api/src/infra/http/controllers/get-vendor-by-id/get-vendor-by-id.controller.ts` | `vendor` | `data` |

### Requirements

For each controller:
1. Change the response object key from the domain-specific name to `data`
2. Update any corresponding E2E test to assert `response.body.data` instead of `response.body.property` (etc.)

### Patterns to Follow

- `get-lease-by-id` and `get-client-by-id` already return `{ data: Resource }` — match their pattern exactly

### Acceptance Criteria

- All single-resource GET endpoints return `{ data: Resource }`
- No endpoint uses a domain-specific key for single-resource responses
- All existing E2E tests for modified controllers pass with updated assertions

### Test Cases

1. `GET /properties/:id` returns `{ data: { id, address, ... } }` (not `{ property: ... }`)
2. `GET /payments/:id` returns `{ data: { id, amount, ... } }` (not `{ payment: ... }`)
3. `GET /maintenance-requests/:id` returns `{ data: { id, title, ... } }` (not `{ maintenanceRequest: ... }`)

---

## Task 4: Update Mobile App for Standardized Contracts

### Audit Issues Resolved
- **CON-1**: Mobile payment response uses `total` vs API's `totalCount`
- **CON-2**: Mobile maintenance response uses `total` vs API's `totalCount`

### Files to Modify

| File | Change |
|------|--------|
| `apps/mobile/src/hooks/usePayments/index.tsx` | Update `PaymentsResponse` interface: `payments` → `data`, add `meta` parsing, replace `totalCount` checks with `meta.totalCount` |
| `apps/mobile/src/hooks/useMaintenanceRequests/index.tsx` | Update response interface: `maintenanceRequests` → `data`, add `meta` parsing |
| Any other mobile files that destructure `payments`, `maintenanceRequests`, `property`, `payment`, `document`, `maintenanceRequest`, `vendor`, or `expense` from API responses | Update to destructure `data` instead |

### Requirements

1. Update all API response type interfaces in mobile hooks to match the new standardized shapes
2. For list hooks: parse `response.data` (array) and `response.meta` instead of domain-specific keys
3. For single-resource hooks: parse `response.data` instead of `response.property`, `response.payment`, etc.
4. Update infinite scroll `getNextPageParam` logic to use `meta.page`, `meta.totalPages` instead of raw `totalCount` comparisons
5. Import `PaginatedResponse` and `PaginationMeta` from `@leaselink/shared` where appropriate

### Patterns to Follow

- `useLeases` hook already expects `{ data, meta }` — all other list hooks should match this pattern
- Follow existing React Query infinite query patterns in the codebase

### Acceptance Criteria

- All mobile hooks correctly parse the standardized API response shapes
- Infinite scroll pagination works correctly with `meta.page` / `meta.totalPages`
- No mobile hook references domain-specific response keys (`payments`, `maintenanceRequests`, etc.)

---

## Task 5: Update Web Dashboard for Standardized Contracts

### Files to Modify

Any web components or hooks that consume the modified API endpoints and destructure responses using the old keys. Likely locations:

| Location Pattern | Change |
|-----------------|--------|
| `apps/web/src/**/use*.ts` or `apps/web/src/**/use*.tsx` hooks that call list endpoints | Update response parsing from domain-specific keys to `data` + `meta` |
| `apps/web/src/**/*.tsx` components that directly destructure API responses | Update from `response.property`, `response.payments`, etc. to `response.data` |

### Requirements

1. Search all web app files for references to the old response keys: `payments`, `maintenanceRequests`, `documents`, `notifications`, `property`, `payment`, `expense`, `document`, `maintenanceRequest`, `vendor` as API response destructuring targets
2. Update each to use `data` (for both single-resource and list responses)
3. Update pagination logic to use `meta` object where applicable
4. Import shared pagination types from `@leaselink/shared` where appropriate

### Patterns to Follow

- Existing web hooks/components that consume `get-leases` or `get-properties` (Pattern A endpoints) — these already parse `{ data, meta }` correctly and are the reference implementation

### Acceptance Criteria

- All web API consumers correctly parse standardized response shapes
- No web component references old domain-specific response keys for modified endpoints
- Dashboard pagination continues to work correctly

---

## API Response Contracts

### List Endpoints (all 14)

**Before (mixed):**
```
{ payments: [...], totalCount: N }
{ maintenanceRequests: [...], totalCount: N }
{ documents: [...] }
{ notifications: [...] }
```

**After (standardized):**
```
{
  data: ResourceDTO[],
  meta: {
    page: number,
    pageSize: number,
    totalCount: number,
    totalPages: number
  }
}
```

### Single-Resource Endpoints (all)

**Before (mixed):**
```
{ property: {...} }
{ payment: {...} }
{ expense: {...} }
```

**After (standardized):**
```
{ data: ResourceDTO }
```

### Query Parameters (paginated endpoints)

**Before (mixed):**
```
?page=1&pageSize=10    (most endpoints)
?offset=0&limit=10     (documents, notifications)
```

**After (standardized):**
```
?page=1&pageSize=10    (all endpoints)
```

---

## Implementation Order

```
Task 1 (Shared Types — no dependencies, enables type imports for all other tasks)
  ↓
Task 2 (List Endpoints — API-side contract changes)
  ↓  ↘
Task 3 (Single-Resource Endpoints — API-side, independent of Task 2)
  ↓    ↓
Task 4 (Mobile — depends on Tasks 2+3 for new API shapes)
Task 5 (Web — depends on Tasks 2+3 for new API shapes)
```

Tasks 2 and 3 can run in parallel after Task 1. Tasks 4 and 5 can run in parallel after Tasks 2+3.

---

## Definition of Done

1. `cd apps/api && npx nest build` passes
2. `cd apps/web && npx next build` passes
3. All 14 list endpoints return `{ data: [], meta: { page, pageSize, totalCount, totalPages } }`
4. All single-resource GET endpoints return `{ data: Resource }`
5. No endpoint uses `offset/limit` query parameters
6. No endpoint returns domain-specific wrapper keys (`payments`, `property`, etc.)
7. All existing E2E tests pass with updated response assertions
8. Mobile infinite scroll pagination works with `meta`-based logic
9. Web dashboard pagination works with `meta`-based logic
10. `PaginationMeta` and `PaginatedResponse<T>` are exported from `@leaselink/shared`
