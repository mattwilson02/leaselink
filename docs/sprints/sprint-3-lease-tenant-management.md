# Sprint 3: Lease & Tenant Management

## Overview

This sprint delivers **Lease Management** (API + Web) and **Tenant Management on the Web Dashboard**. Leases are the core relationship connecting properties to tenants — everything downstream (maintenance requests, payments) depends on them. The property detail page already has placeholder cards for "Current Tenant" and "Active Lease" waiting to be wired up.

**Goal:** A property manager can invite tenants, create leases linking tenants to properties, activate/terminate leases, and initiate lease renewals — all from the web dashboard. Lease creation enforces business rules (one active lease per property, one per tenant, valid property status). The property detail page shows the current tenant and active lease.

**Why this sprint:** Properties (Sprint 2) are the root entity. Leases are the next dependency — maintenance requests require an active lease to submit, and payments are generated from active leases. Without leases, neither feature can be built.

---

## What Exists (from Sprints 1–2)

| Layer | What's Done |
|-------|-------------|
| **Shared package** | All enums, types, DTOs, Zod schemas (`createLeaseSchema`, `renewLeaseSchema`, `leaseFilterSchema`), constants (`LEASE_STATUS_TRANSITIONS`, `LEASE_STATUS_LABELS`), error messages |
| **Prisma schema** | `Lease` model with all fields, relationships to Property/Client, self-referential renewal, Payment relation. `Client` model with all fields. |
| **API — Property** | Full CRUD: 7 endpoints, domain entity, use cases, repository, presenter |
| **API — Client/Tenant** | `CreateClient`, `EditClient`, `DeleteClient` use cases and controllers. `ClientsRepository` with `create`, `findById`, `findByEmail`, `update`, `delete` (no list/search method). `HttpClientPresenter` with basic `toHTTP`. |
| **Web — Dashboard** | Layout (sidebar, top nav), auth (sign-in), property CRUD pages. Tenant/Lease pages are placeholders ("Coming in Sprint 3"). |
| **Web — Patterns** | `use-properties.ts` hooks, `apiClient`, property list/detail/form/dialog component patterns |

## What's New in This Sprint

| Layer | What's Built |
|-------|-------------|
| **API** | Lease domain entity + 6 use cases + repository + mapper + 6 controllers + presenter. Tenant list endpoint (extends existing ClientsRepository). |
| **Web** | Tenant list page, tenant detail page, invite tenant form. Lease list page, lease detail page, create lease form, renew lease form. Property detail page updated with tenant/lease cards. |
| **Mobile** | No mobile work this sprint (lease management is manager-side only). |

---

## Architectural Decisions

These decisions are binding for all agents in this sprint:

1. **Lease lives in a new domain context:** `apps/api/src/domain/lease-management/`. Do NOT put it inside `property-management/` or `financial-management/`. It cross-references both via repository injection.

2. **Tenant list extends existing Client infrastructure.** Add a `findMany` method to `ClientsRepository` (the abstract class) and implement it in `PrismaClientsRepository`. Do NOT create a separate "tenant" domain — the Client entity IS the tenant. Add a new `GetClientsUseCase` and `GetClientsController` in the existing `financial-management` domain.

3. **Follow the Property entity pattern** for the Lease entity — extends `Entity<LeaseProps>`, value objects for `LeaseStatus`, static `create()` factory, getters/setters with `touch()`.

4. **Follow the Property controller pattern** — `ZodValidationPipe` with shared schemas from `@leaselink/shared`, `EmployeeOnlyGuard`, `errorMap` dictionary, `Either` response handling.

5. **Follow the `use-properties.ts` hooks pattern** for `use-leases.ts` and `use-tenants.ts` — TanStack Query with `queryKey` arrays, `apiClient` calls, `invalidateQueries` on mutations.

6. **Follow the property list page pattern** for tenant/lease list pages — status filter dropdown, search input, shadcn Table, pagination, loading skeletons, empty states.

7. **Lease activation side effects:** When a lease status changes to `ACTIVE`, the use case must also update the property status to `OCCUPIED` (if not already). This requires injecting `PropertiesRepository` into the `UpdateLeaseStatus` use case. Similarly, when lease status changes to `EXPIRED`/`TERMINATED` and no other active lease exists on the property, the property stays in its current status (do NOT auto-change to VACANT — the manager controls that).

8. **Lease renewal creates a new Lease entity** with `renewedFromLeaseId` pointing to the original. The original lease is NOT modified until the new lease is activated (at which point the original moves to `EXPIRED`).

---

## Task 1: Tenant List & Detail Endpoints (Backend Agent)

### Objective

Add list/search capability to the existing Client/Tenant infrastructure so the web dashboard can display and search tenants. Also add a GET endpoint for a single tenant by ID (the existing `findById` is internal — there's no HTTP controller for it).

### Dependencies

- None (extends existing code)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/financial-management/application/repositories/clients-repository.ts` | Modify | Add `findMany` method signature |
| `apps/api/src/infra/database/prisma/repositories/prisma-clients-repository.ts` | Modify | Implement `findMany` with filtering, search, pagination |
| `apps/api/src/domain/financial-management/application/use-cases/get-clients.ts` | Create | List clients use case |
| `apps/api/src/domain/financial-management/application/use-cases/get-client-by-id.ts` | Create | Get single client use case |
| `apps/api/src/infra/http/controllers/get-clients/get-clients.controller.ts` | Create | GET /tenants (list) |
| `apps/api/src/infra/http/controllers/get-client-by-id/get-client-by-id.controller.ts` | Create | GET /tenants/:id |
| `apps/api/src/infra/http/presenters/http-client-presenter.ts` | Modify | Add `toHTTPList`, include `createdAt`/`updatedAt` in response |
| `apps/api/src/infra/http/http.module.ts` | Modify | Register new controllers and use cases |
| `apps/api/test/repositories/prisma/in-memory-clients-repository.ts` | Modify | Implement `findMany` for in-memory testing |

### Requirements

#### ClientsRepository.findMany

Add to the abstract class:

```typescript
abstract findMany(params: ClientsFilterParams): Promise<ClientsPaginatedResult>
```

Where:
```typescript
interface ClientsFilterParams {
  status?: string
  onboardingStatus?: string
  search?: string  // searches name and email
  page: number
  pageSize: number
}

interface ClientsPaginatedResult {
  clients: Client[]
  totalCount: number
}
```

Follow the `PropertiesRepository.findManyByManager` pattern for the Prisma implementation. Note: unlike properties, tenants are NOT scoped to a single manager (via the `EmployeeClients` join table). For Sprint 3, return ALL tenants visible to the authenticated manager. The manager scoping through `EmployeeClients` is a future enhancement — for now, all managers see all tenants.

#### GetClientsUseCase

Follow the `GetPropertiesByManagerUseCase` pattern. Accept filter params, return `Either<never, { clients: Client[], totalCount: number }>`.

#### GetClientByIdUseCase

Follow the `GetPropertyByIdUseCase` pattern. Return `Either<ClientNotFoundError, { client: Client }>`. Create `ClientNotFoundError` if it doesn't already exist.

#### GetClientsController — `GET /tenants`

- `@ApiTags('Tenants')`
- `@Controller('/tenants')` — NOTE: the URL uses `/tenants` (product spec naming), but the internal code still uses `Client` class names.
- `@UseGuards(EmployeeOnlyGuard)`
- Validate query params with `tenantFilterSchema` from `@leaselink/shared`
- Return paginated response: `{ data: [...], meta: { page, pageSize, totalCount, totalPages } }`

#### GetClientByIdController — `GET /tenants/:id`

- `@ApiTags('Tenants')`
- `@Controller('/tenants')`
- `@UseGuards(EmployeeOnlyGuard)`
- Return `{ data: TenantHttpResponse }`

#### HttpClientPresenter Update

The existing presenter only returns `id, email, phoneNumber, name, managedBy, status, onboardingStatus`. Add `createdAt`, `updatedAt`, `profilePhoto`, and notification preferences to the response. Add a `toHTTPList` static method.

### Acceptance Criteria

- [ ] `GET /tenants` returns paginated list of tenants with status/search filtering
- [ ] `GET /tenants?status=ACTIVE` filters by status
- [ ] `GET /tenants?search=john` searches by name and email (case-insensitive)
- [ ] `GET /tenants/:id` returns a single tenant
- [ ] `GET /tenants/:id` returns 404 for non-existent tenant
- [ ] Both endpoints require `EmployeeOnlyGuard`
- [ ] Response includes `createdAt`, `updatedAt`, `profilePhoto`
- [ ] Pagination works with `page` and `pageSize` query params
- [ ] Swagger UI shows endpoints under "Tenants" tag
- [ ] Existing client tests still pass

### Test Cases

**GetClientsUseCase:**
| Test | Setup | Expected |
|------|-------|----------|
| should list all clients | Create 3 clients | Returns all 3, totalCount = 3 |
| should filter by status | Create ACTIVE and INVITED clients | Filter by ACTIVE returns only ACTIVE |
| should search by name | Create clients with known names | Search matches correct clients |
| should search by email | Create clients with known emails | Search matches correct clients |
| should paginate | Create 5 clients, page=1, pageSize=2 | Returns 2, totalCount = 5 |

**GetClientByIdUseCase:**
| Test | Setup | Expected |
|------|-------|----------|
| should return client | Create client, fetch by id | `isRight()`, correct client |
| should return error if not found | Fetch non-existent id | `isLeft()`, ClientNotFoundError |

---

## Task 2: Lease Domain Layer (Backend Agent)

### Objective

Create the Lease domain entity, value object, repository interface, error classes, and 6 use cases.

### Dependencies

- Sprint 1 complete (shared package)
- `PropertiesRepository` from Sprint 2 (injected for cross-domain checks)
- `ClientsRepository` from Task 1 (injected for tenant validation)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/domain/lease-management/enterprise/entities/lease.ts` | Lease domain entity |
| `apps/api/src/domain/lease-management/enterprise/entities/value-objects/lease-status.ts` | LeaseStatus value object |
| `apps/api/src/domain/lease-management/application/repositories/leases-repository.ts` | Abstract repository interface |
| `apps/api/src/domain/lease-management/application/use-cases/create-lease.ts` | Create lease |
| `apps/api/src/domain/lease-management/application/use-cases/get-lease-by-id.ts` | Get single lease |
| `apps/api/src/domain/lease-management/application/use-cases/get-leases.ts` | List leases with filtering |
| `apps/api/src/domain/lease-management/application/use-cases/update-lease-status.ts` | Status transition with business rules |
| `apps/api/src/domain/lease-management/application/use-cases/renew-lease.ts` | Create renewal lease |
| `apps/api/src/domain/lease-management/application/use-cases/get-lease-by-property.ts` | Get active lease for a property |
| `apps/api/src/domain/lease-management/application/use-cases/errors/*.ts` | Error classes |
| `test/factories/make-lease.ts` | Test factory |
| `test/repositories/prisma/in-memory-leases-repository.ts` | In-memory repository |

### Requirements

#### Lease Entity

Follow the Property entity pattern. Key differences:
- `LeaseStatus` value object with values: `PENDING`, `ACTIVE`, `EXPIRED`, `TERMINATED`
- `propertyId` and `tenantId` are `UniqueEntityId` references
- `renewedFromLeaseId` is optional `UniqueEntityId | null`
- `startDate` and `endDate` are `Date` types
- `monthlyRent` and `securityDeposit` are `number`
- Default status is `PENDING` on creation

#### LeasesRepository

```typescript
abstract class LeasesRepository {
  abstract create(lease: Lease): Promise<void>
  abstract findById(leaseId: string): Promise<Lease | null>
  abstract findMany(params: LeasesFilterParams): Promise<LeasesPaginatedResult>
  abstract findActiveByProperty(propertyId: string): Promise<Lease | null>
  abstract findActiveByTenant(tenantId: string): Promise<Lease | null>
  abstract findPendingRenewalByLeaseId(leaseId: string): Promise<Lease | null>
  abstract update(lease: Lease): Promise<Lease>
}
```

`LeasesFilterParams` should include: `status?`, `propertyId?`, `tenantId?`, `page`, `pageSize`.

`findActiveByProperty` returns the lease with `status: ACTIVE` for a property (at most one).
`findActiveByTenant` returns the lease with `status: ACTIVE` for a tenant (at most one).
`findPendingRenewalByLeaseId` checks if a `PENDING` lease exists with `renewedFromLeaseId` equal to the given lease ID.

#### Use Case: CreateLease

Business rules to enforce:
1. Property must exist (inject `PropertiesRepository`)
2. Tenant must exist (inject `ClientsRepository`)
3. Property status must be `LISTED` or `OCCUPIED` (error: `LEASE_PROPERTY_NOT_AVAILABLE`)
4. Property must NOT already have an `ACTIVE` lease (error: `LEASE_PROPERTY_HAS_ACTIVE_LEASE`)
5. Tenant must NOT already have an `ACTIVE` lease (error: `LEASE_TENANT_HAS_ACTIVE_LEASE`)
6. `endDate > startDate` (validated by Zod schema, but double-check in use case)

On success: create lease with status `PENDING`.

Error classes needed:
- `LeasePropertyNotAvailableError`
- `LeasePropertyHasActiveLeaseError`
- `LeaseTenantHasActiveLeaseError`
- `LeaseNotFoundError`
- `InvalidLeaseStatusTransitionError`
- `LeaseRenewalInvalidSourceError`
- `LeaseRenewalStartDateInvalidError`
- `LeaseRenewalAlreadyExistsError`

Use error message strings from `@leaselink/shared` constants (`LEASE_PROPERTY_NOT_AVAILABLE`, etc.).

#### Use Case: UpdateLeaseStatus

This is the most complex use case. Business rules:
1. Validate transition against `LEASE_STATUS_TRANSITIONS` from `@leaselink/shared`
2. `TERMINATED` → any: rejected (`LEASE_TERMINATED_CANNOT_REACTIVATE` — note: this is already handled by the transition map having no valid transitions from TERMINATED)
3. **Side effect on PENDING → ACTIVE:** Set the property status to `OCCUPIED` if it isn't already. Inject `PropertiesRepository`, call `findById`, update status, save.
4. **Side effect on ACTIVE → EXPIRED (via renewal):** If this lease was expired because a renewal was activated, this is handled by the `RenewLease` flow, not directly here.

Implementation: inject `PropertiesRepository`. When transitioning to `ACTIVE`:
```
property = propertiesRepository.findById(lease.propertyId)
if property.status !== 'OCCUPIED':
  property.status = 'OCCUPIED'
  propertiesRepository.update(property)
```

#### Use Case: RenewLease

Input: `leaseId` (the original lease), `startDate`, `endDate`, `monthlyRent`, `securityDeposit`, `managerId`.

Business rules:
1. Original lease must exist
2. Original lease status must be `ACTIVE` or `EXPIRED` (error: `LeaseRenewalInvalidSourceError`)
3. New `startDate` must be on or after original `endDate` (error: `LeaseRenewalStartDateInvalidError`)
4. No existing `PENDING` renewal for this lease (error: `LeaseRenewalAlreadyExistsError`)
5. Verify manager owns the property (check via `PropertiesRepository.findById`)

On success: create a new Lease with `status: PENDING` and `renewedFromLeaseId` pointing to the original.

**Important:** The original lease is NOT modified here. When the renewal lease is activated (via `UpdateLeaseStatus`), the `UpdateLeaseStatus` use case should check if the lease being activated has a `renewedFromLeaseId` — if so, expire the original lease.

Update `UpdateLeaseStatus` to handle this:
```
if newStatus === 'ACTIVE' and lease.renewedFromLeaseId:
  originalLease = leasesRepository.findById(lease.renewedFromLeaseId)
  if originalLease and originalLease.status === 'ACTIVE':
    originalLease.status = 'EXPIRED'
    leasesRepository.update(originalLease)
```

#### Use Case: GetLeaseByProperty

Simple helper: given a `propertyId`, return the active lease (if any) with the tenant info. This powers the property detail page's "Current Tenant" and "Active Lease" cards.

Return: `Either<never, { lease: Lease | null }>`

### Acceptance Criteria

- [ ] `Lease` entity follows Property entity pattern with `LeaseStatus` value object
- [ ] `LeasesRepository` has 7 methods including `findActiveByProperty`, `findActiveByTenant`, `findPendingRenewalByLeaseId`
- [ ] `CreateLease` validates property exists, tenant exists, property status is LISTED/OCCUPIED, no active lease on property, no active lease for tenant
- [ ] `UpdateLeaseStatus` validates transitions via `LEASE_STATUS_TRANSITIONS`
- [ ] `UpdateLeaseStatus` sets property to OCCUPIED when lease becomes ACTIVE
- [ ] `UpdateLeaseStatus` expires original lease when a renewal lease becomes ACTIVE
- [ ] `RenewLease` validates source lease status is ACTIVE/EXPIRED, start date >= original end date, no pending renewal exists
- [ ] All 7 error classes exist with descriptive messages
- [ ] All files pass `tsc --noEmit`

### Test Cases

#### CreateLease Tests

| Test | Setup | Expected |
|------|-------|----------|
| should create a lease | Valid property (LISTED), valid tenant, no conflicts | `isRight()`, lease with PENDING status |
| should reject if property not found | Non-existent propertyId | `isLeft()`, PropertyNotFoundError |
| should reject if tenant not found | Non-existent tenantId | `isLeft()`, error |
| should reject if property status is VACANT | Property with VACANT status | `isLeft()`, LeasePropertyNotAvailableError |
| should reject if property status is MAINTENANCE | Property with MAINTENANCE status | `isLeft()`, LeasePropertyNotAvailableError |
| should reject if property has active lease | Property already has ACTIVE lease | `isLeft()`, LeasePropertyHasActiveLeaseError |
| should reject if tenant has active lease | Tenant already has ACTIVE lease | `isLeft()`, LeaseTenantHasActiveLeaseError |

#### UpdateLeaseStatus Tests

| Test | Setup | Expected |
|------|-------|----------|
| should activate a pending lease | Lease PENDING | `isRight()`, status ACTIVE |
| should set property to OCCUPIED on activation | Property was LISTED, lease activated | Property status is OCCUPIED |
| should not change property if already OCCUPIED | Property OCCUPIED, lease activated | Property still OCCUPIED, no error |
| should reject PENDING → EXPIRED | Lease PENDING | `isLeft()`, InvalidLeaseStatusTransitionError |
| should expire an active lease | Lease ACTIVE | `isRight()`, status EXPIRED |
| should terminate an active lease | Lease ACTIVE | `isRight()`, status TERMINATED |
| should reject TERMINATED → ACTIVE | Lease TERMINATED | `isLeft()`, InvalidLeaseStatusTransitionError |
| should expire original on renewal activation | Renewal lease (with renewedFromLeaseId) activated | Original lease status is EXPIRED |

#### RenewLease Tests

| Test | Setup | Expected |
|------|-------|----------|
| should create renewal from ACTIVE lease | Original lease ACTIVE | `isRight()`, new lease with renewedFromLeaseId |
| should create renewal from EXPIRED lease | Original lease EXPIRED | `isRight()` |
| should reject renewal from PENDING lease | Original lease PENDING | `isLeft()`, LeaseRenewalInvalidSourceError |
| should reject renewal from TERMINATED lease | Original lease TERMINATED | `isLeft()`, LeaseRenewalInvalidSourceError |
| should reject if start date before original end date | Renewal start < original end | `isLeft()`, LeaseRenewalStartDateInvalidError |
| should reject if pending renewal already exists | Existing PENDING renewal for this lease | `isLeft()`, LeaseRenewalAlreadyExistsError |

---

## Task 3: Lease Infrastructure Layer (Backend Agent)

### Objective

Create the Prisma repository implementation, mapper, HTTP controllers, presenter, Swagger DTOs, and register everything in NestJS modules.

### Dependencies

- Task 2 (domain layer must exist)

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `apps/api/src/infra/database/prisma/mappers/prisma-lease-mapper.ts` | Map between Prisma Lease and domain Lease |
| `apps/api/src/infra/database/prisma/repositories/prisma-leases-repository.ts` | Prisma implementation of LeasesRepository |
| `apps/api/src/infra/http/controllers/create-lease/create-lease.controller.ts` | POST /leases |
| `apps/api/src/infra/http/controllers/get-leases/get-leases.controller.ts` | GET /leases |
| `apps/api/src/infra/http/controllers/get-lease-by-id/get-lease-by-id.controller.ts` | GET /leases/:id |
| `apps/api/src/infra/http/controllers/update-lease-status/update-lease-status.controller.ts` | PATCH /leases/:id/status |
| `apps/api/src/infra/http/controllers/renew-lease/renew-lease.controller.ts` | POST /leases/:id/renew |
| `apps/api/src/infra/http/controllers/get-lease-by-property/get-lease-by-property.controller.ts` | GET /leases/property/:propertyId |
| `apps/api/src/infra/http/presenters/http-lease-presenter.ts` | Lease → JSON response |
| `apps/api/src/infra/http/DTOs/lease/*.ts` | Swagger DTOs |
| `apps/api/src/infra/database/database.module.ts` | Modify — register LeasesRepository |
| `apps/api/src/infra/http/http.module.ts` | Modify — register controllers and use cases |

### Requirements

#### Prisma Mapper

Follow the `PrismaPropertyMapper` pattern. Map `Lease` ↔ Prisma `Lease`. `propertyId` and `tenantId` map to `UniqueEntityId`. `renewedFromLeaseId` is nullable. Dates map between `Date` (Prisma) and `Date` (domain).

#### Prisma Repository

Implement all 7 methods from `LeasesRepository`:

- `create` — standard insert
- `findById` — standard lookup
- `findMany` — with status, propertyId, tenantId filtering + pagination. Order by `createdAt desc`.
- `findActiveByProperty` — `where: { propertyId, status: 'ACTIVE' }`, return first or null
- `findActiveByTenant` — `where: { tenantId, status: 'ACTIVE' }`, return first or null
- `findPendingRenewalByLeaseId` — `where: { renewedFromLeaseId: leaseId, status: 'PENDING' }`
- `update` — standard update

#### HTTP Presenter

Include related entity names in the response for display purposes. The presenter should accept an optional `include` parameter or the controller should make separate queries. For simplicity in Sprint 3, the lease response includes `propertyId` and `tenantId` as UUIDs — the web frontend will fetch property/tenant details separately or via future endpoint enrichment.

Response shape:
```typescript
{
  id: string
  propertyId: string
  tenantId: string
  startDate: string  // ISO 8601
  endDate: string
  monthlyRent: number
  securityDeposit: number
  status: string
  renewedFromLeaseId: string | null
  createdAt: string
  updatedAt: string | null
}
```

#### Controllers

All controllers:
- `@ApiTags('Leases')`
- `@UseGuards(EmployeeOnlyGuard)` — lease management is manager-only in Sprint 3
- Follow the Property controller patterns

**POST /leases** — CreateLeaseController
- Body validated with `createLeaseSchema` from `@leaselink/shared`
- Error map: PropertyNotFoundError → 404, LeasePropertyNotAvailableError → 400, LeasePropertyHasActiveLeaseError → 409, LeaseTenantHasActiveLeaseError → 409

**GET /leases** — GetLeasesController
- Query params validated with `leaseFilterSchema` from `@leaselink/shared`
- Returns paginated response

**GET /leases/:id** — GetLeaseByIdController
- Returns single lease

**GET /leases/property/:propertyId** — GetLeaseByPropertyController
- Returns the active lease for a property (or `{ data: null }` if none)
- This endpoint is used by the property detail page

**PATCH /leases/:id/status** — UpdateLeaseStatusController
- Body validated with `updateLeaseStatusSchema` from `@leaselink/shared`
- Error map: LeaseNotFoundError → 404, InvalidLeaseStatusTransitionError → 400

**POST /leases/:id/renew** — RenewLeaseController
- Body validated with `renewLeaseSchema` from `@leaselink/shared`
- Error map: LeaseNotFoundError → 404, LeaseRenewalInvalidSourceError → 400, LeaseRenewalStartDateInvalidError → 400, LeaseRenewalAlreadyExistsError → 409

#### Route ordering note

NestJS matches routes in registration order. `GET /leases/property/:propertyId` must be registered BEFORE `GET /leases/:id` to avoid `:id` matching "property" as a UUID. Register `GetLeaseByPropertyController` before `GetLeaseByIdController` in `http.module.ts`, or use a more specific path like `/properties/:propertyId/active-lease`.

**Recommended approach:** Use `GET /properties/:propertyId/active-lease` instead of `GET /leases/property/:propertyId`. This avoids route conflicts and is more RESTful. The controller still lives in the lease controllers directory but uses `@Controller('/properties')`.

### Acceptance Criteria

- [ ] All 6 controllers registered and functional
- [ ] Swagger UI shows all lease endpoints
- [ ] `POST /leases` creates a lease and returns 201
- [ ] `GET /leases` returns paginated list with filters
- [ ] `GET /leases/:id` returns single lease or 404
- [ ] `GET /properties/:propertyId/active-lease` returns active lease or null
- [ ] `PATCH /leases/:id/status` transitions status with validation
- [ ] `POST /leases/:id/renew` creates renewal lease
- [ ] Error responses use correct HTTP status codes
- [ ] API starts without errors
- [ ] Existing tests still pass

---

## Task 4: Tenant Pages — Web Dashboard (Web Agent)

### Objective

Build the tenant management UI: list page with filtering/search, detail page, and invite tenant form.

### Dependencies

- Task 1 (tenant list API endpoints)
- Sprint 2 Task 3 (dashboard layout exists)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-tenants.ts` | TanStack Query hooks for tenant API calls |
| `apps/web/src/app/(dashboard)/tenants/page.tsx` | Tenant list page (replace placeholder) |
| `apps/web/src/app/(dashboard)/tenants/invite/page.tsx` | Invite tenant form |
| `apps/web/src/app/(dashboard)/tenants/[id]/page.tsx` | Tenant detail page |
| `apps/web/src/components/tenants/tenant-status-badge.tsx` | Status badge component |
| `apps/web/src/components/tenants/onboarding-progress.tsx` | Onboarding step indicator |
| `apps/web/src/components/tenants/invite-tenant-form.tsx` | Invite form component |

### Requirements

#### TanStack Query Hooks — `use-tenants.ts`

Follow the `use-properties.ts` pattern:

- `useTenants(filters)` — `GET /tenants` with status, search, page, pageSize query params
- `useTenant(id)` — `GET /tenants/:id`
- `useCreateTenant()` — `POST /clients` (NOTE: the create endpoint is still at `/clients`, not `/tenants` — this is the existing `CreateClientController`)
- `useDeleteTenant()` — `DELETE /clients/:id`

Query keys: `['tenants', filters]` for list, `['tenants', id]` for detail.

#### Tenant List Page

Replace the "Coming in Sprint 3" placeholder at `apps/web/src/app/(dashboard)/tenants/page.tsx`.

Features:
- Page header: "Tenants" title + "Invite Tenant" button
- Filter bar: status dropdown (All, Invited, Active, Inactive) + search input
- Table columns: Name, Email, Phone Number, Status, Onboarding, Actions
- Status column: `TenantStatusBadge` component (similar to `PropertyStatusBadge`)
- Onboarding column: `OnboardingProgress` component showing current step
- Actions: View, Delete
- Pagination controls
- Empty state: "No tenants yet. Invite your first tenant."
- Loading skeletons

Use `TENANT_STATUS_LABELS` and `ONBOARDING_STATUS_LABELS` from `@leaselink/shared`.

#### Tenant Detail Page

Features:
- Header: tenant name, status badge
- Info card: email, phone, status, onboarding status
- Tabs or sections:
  - **Overview** — profile info, notification preferences
  - **Lease** — current active lease summary (placeholder, wired up in Task 6). Show "No active lease" if none.
  - **Documents** — placeholder for Sprint 4
- Back button to tenant list

#### Invite Tenant Form

- Form fields: Name (required), Email (required, validated), Phone Number (required)
- Uses `createTenantSchema` from `@leaselink/shared` with `zodResolver`
- On success: toast "Tenant invited successfully", redirect to tenant list
- On error (409 conflict = already exists): show error message

#### TenantStatusBadge

Follow the `PropertyStatusBadge` pattern:

| Status | Color |
|--------|-------|
| INVITED | `secondary` (blue) |
| ACTIVE | `default` variant with green styling |
| INACTIVE | `outline` (gray) |

#### OnboardingProgress

A simple horizontal stepper or badge showing the current onboarding step. Use `ONBOARDING_STATUS_LABELS` for display. Visual indicator of progress: NEW → EMAIL_VERIFIED → PHONE_VERIFIED → PASSWORD_SET → ONBOARDED.

### Acceptance Criteria

- [ ] Tenant list page shows all tenants with status filter and search
- [ ] Pagination works
- [ ] "Invite Tenant" navigates to form
- [ ] Invite form validates and creates tenant via API
- [ ] Duplicate email shows 409 error
- [ ] Tenant detail page shows all profile info
- [ ] Status badges render with correct colors
- [ ] Onboarding progress displays current step
- [ ] Loading skeletons and empty states render correctly
- [ ] `next build` passes

---

## Task 5: Lease Pages — Web Dashboard (Web Agent)

### Objective

Build the lease management UI: list page, detail page, create lease form, and renew lease form.

### Dependencies

- Task 3 (lease API endpoints)
- Task 4 (tenant pages — for tenant selection in lease creation)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-leases.ts` | TanStack Query hooks for lease API calls |
| `apps/web/src/app/(dashboard)/leases/page.tsx` | Lease list page (replace placeholder) |
| `apps/web/src/app/(dashboard)/leases/new/page.tsx` | Create lease page |
| `apps/web/src/app/(dashboard)/leases/[id]/page.tsx` | Lease detail page |
| `apps/web/src/app/(dashboard)/leases/[id]/renew/page.tsx` | Renew lease page |
| `apps/web/src/components/leases/lease-status-badge.tsx` | Status badge component |
| `apps/web/src/components/leases/lease-form.tsx` | Shared create form component |
| `apps/web/src/components/leases/renew-lease-form.tsx` | Renewal form component |
| `apps/web/src/components/leases/activate-lease-dialog.tsx` | Confirmation dialog for activation |
| `apps/web/src/components/leases/terminate-lease-dialog.tsx` | Confirmation dialog for termination |

### Requirements

#### TanStack Query Hooks — `use-leases.ts`

Follow `use-properties.ts` pattern:

- `useLeases(filters)` — `GET /leases` with status, propertyId, tenantId, page, pageSize
- `useLease(id)` — `GET /leases/:id`
- `useActiveLeaseByProperty(propertyId)` — `GET /properties/:propertyId/active-lease`
- `useCreateLease()` — `POST /leases`
- `useUpdateLeaseStatus(id)` — `PATCH /leases/:id/status`
- `useRenewLease(id)` — `POST /leases/:id/renew`

Query keys: `['leases', filters]` for list, `['leases', id]` for detail, `['leases', 'property', propertyId]` for active-by-property.

Invalidation: mutations should invalidate `['leases']` AND `['properties']` (since lease activation changes property status).

#### Lease List Page

Replace the "Coming in Sprint 3" placeholder.

Features:
- Page header: "Leases" title + "Create Lease" button
- Filter bar: status dropdown (All, Pending, Active, Expired, Terminated) + property filter (optional) + tenant filter (optional)
- Table columns: Property Address, Tenant Name, Start Date, End Date, Monthly Rent, Status, Actions
- **Problem:** The lease API returns `propertyId` and `tenantId` as UUIDs, not names. The frontend needs to display human-readable property addresses and tenant names.
  - **Solution:** The list page should fetch properties and tenants in parallel (using `useProperties` and `useTenants`), then join client-side. Alternatively, create a lookup map. For Sprint 3, this client-side join is acceptable. A future optimization would be to add `include` support to the lease API.
- Status column: `LeaseStatusBadge` with expiry warning colors
  - Red badge if active lease expires within 30 days
  - Yellow badge if active lease expires within 60 days
- Actions: View, Activate (if PENDING), Terminate (if ACTIVE), Renew (if ACTIVE or EXPIRED)
- Pagination
- Empty state

#### Create Lease Page

- Uses the `LeaseForm` component
- Must select a property and tenant
- Property selector: dropdown/combobox of properties with status LISTED or OCCUPIED. Use `useProperties({ status: 'LISTED' })` and `useProperties({ status: 'OCCUPIED' })` or just fetch all and filter. Show property address + status in dropdown options.
- Tenant selector: dropdown/combobox of tenants with status ACTIVE. Use `useTenants({ status: 'ACTIVE' })`. Show tenant name + email in dropdown options.
- Date pickers for start/end dates
- Number inputs for monthly rent and security deposit
- Monthly rent could pre-fill from the selected property's `rentAmount`
- Validates with `createLeaseSchema` from `@leaselink/shared`
- On success: redirect to lease detail page

**Error handling for 409 conflicts:**
- "Property already has an active lease" → show inline error near property selector
- "Tenant already has an active lease" → show inline error near tenant selector

#### Lease Detail Page

Features:
- Header: "Lease — [Property Address]", status badge, action buttons
- Info card: property (link to property detail), tenant (link to tenant detail), dates, rent, deposit
- Date display: formatted as "Mar 1, 2026 — Mar 1, 2027"
- Action buttons (context-dependent):
  - PENDING: "Activate Lease" button → opens `ActivateLeaseDialog`
  - ACTIVE: "Terminate Lease" button → opens `TerminateLeaseDialog`, "Renew Lease" button → navigates to `/leases/:id/renew`
  - EXPIRED: "Renew Lease" button
  - TERMINATED: no actions
- Renewal chain: if `renewedFromLeaseId` is set, show a link to the original lease. If the lease has renewals (future: query for leases with `renewedFromLeaseId === thisLease.id`), show links to them.
- Placeholder sections for "Payment History" (Sprint 4)

#### Renew Lease Page

- Pre-fills tenant and property from the original lease (read-only display)
- Start date: defaults to original lease's end date
- End date: defaults to one year after start date
- Monthly rent: defaults to original lease's monthly rent
- Security deposit: defaults to original lease's security deposit
- Validates with `renewLeaseSchema` from `@leaselink/shared`
- Shows validation error if start date < original end date
- On success: redirect to the NEW lease's detail page

#### ActivateLeaseDialog

Confirmation dialog showing:
- "This will activate the lease and set the property status to Occupied."
- "Activate" button (primary) + "Cancel" button
- Loading state during mutation

#### TerminateLeaseDialog

Confirmation dialog:
- "This will permanently terminate the lease. This action cannot be undone."
- "Terminate" button (destructive) + "Cancel" button
- Loading state during mutation

#### LeaseStatusBadge

Follow `PropertyStatusBadge` pattern:

| Status | Color |
|--------|-------|
| PENDING | `secondary` (blue) |
| ACTIVE | green |
| EXPIRED | `outline` (gray) |
| TERMINATED | `destructive` (red) |

Add expiry warning logic: if status is ACTIVE and endDate is within 30 days, use red. If within 60 days, use yellow/amber.

### Acceptance Criteria

- [ ] Lease list page shows all leases with status filter
- [ ] Table displays property address and tenant name (resolved from IDs)
- [ ] Active leases expiring soon show warning colors
- [ ] "Create Lease" form has property and tenant selectors
- [ ] Property selector only shows LISTED/OCCUPIED properties
- [ ] Tenant selector only shows ACTIVE tenants
- [ ] Monthly rent pre-fills from selected property
- [ ] Create form validates and handles 409 conflicts gracefully
- [ ] Lease detail page shows all lease info with links to property/tenant
- [ ] Activate and Terminate dialogs work with confirmation
- [ ] Renew form pre-fills from original lease
- [ ] Renew validates start date >= original end date
- [ ] Status badges render with correct colors and expiry warnings
- [ ] `next build` passes

---

## Task 6: Property Detail — Tenant & Lease Integration (Web Agent)

### Objective

Update the property detail page to show the current tenant and active lease instead of the placeholder "No active tenant" / "No active lease" cards.

### Dependencies

- Task 3 (active lease by property endpoint)
- Task 4 (tenant hooks)
- Task 5 (lease hooks, status badge)

### Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` | Wire up tenant and lease cards |

### Requirements

Use the `useActiveLeaseByProperty(propertyId)` hook to fetch the active lease for the property. If a lease exists, also fetch the tenant using `useTenant(lease.tenantId)`.

**Current Tenant card updates:**
- If active lease exists: show tenant name, email, phone, status badge, link to tenant detail page
- If no active lease: keep the "No active tenant assigned." message

**Active Lease card updates:**
- If active lease exists: show lease dates (formatted), monthly rent, security deposit, status badge, link to lease detail page
- Show expiry warning if lease ends within 60 days
- If no active lease: keep the "No active lease for this property." message
- Add a "Create Lease" button that navigates to `/leases/new?propertyId=<id>` (pre-selects this property)

### Acceptance Criteria

- [ ] Property detail shows current tenant when an active lease exists
- [ ] Property detail shows active lease info when one exists
- [ ] Tenant card links to tenant detail page
- [ ] Lease card links to lease detail page
- [ ] "Create Lease" button appears when no active lease
- [ ] Expiry warning shown for leases ending within 60 days
- [ ] Cards still show placeholder text when no active lease exists
- [ ] No regressions in existing property detail functionality

---

## Implementation Order

```
Task 1 ──────────> Task 2 ──────────> Task 3
(Tenant API)       (Lease Domain)     (Lease Infra)
[Backend]          [Backend]          [Backend]
                                          │
                                          ▼
Task 4 ────────────────────────────> Task 5 ──> Task 6
(Tenant Pages)                       (Lease     (Property
[Web]                                 Pages)     Detail)
                                     [Web]      [Web]
```

**Parallel work:**
- **Task 1** (Backend) and **Task 4** (Web — can start layout/components while API is being built) can mostly run in parallel. Task 4 depends on Task 1's API being available for hook integration.
- **Task 2** depends on Task 1 (needs `ClientsRepository` for tenant validation in CreateLease)
- **Task 3** depends on Task 2
- **Task 5** depends on Task 3 (needs lease API) and Task 4 (needs tenant hooks/data for lease create form)
- **Task 6** depends on Tasks 3, 4, and 5 (needs all hooks and components)

**Recommended execution:**
1. Start **Task 1** (Backend) and begin **Task 4** (Web — components and page layouts)
2. When Task 1 completes, start **Task 2** (Backend) and finish **Task 4** (Web — wire up API)
3. When Task 2 completes, start **Task 3** (Backend)
4. When Task 3 completes, start **Task 5** (Web)
5. When Task 5 completes, do **Task 6** (Web)

---

## Definition of Done

Sprint 3 is complete when:

1. `cd apps/api && npx tsc --noEmit` passes
2. `cd apps/api && npm run test` passes (all existing + new lease/tenant tests)
3. `cd apps/api && npm run start:dev` starts without errors
4. Swagger UI shows all tenant list/detail endpoints and all 6 lease endpoints
5. `cd apps/web && npx next build` passes with no errors
6. `cd apps/web && npm run dev` starts without errors
7. Tenant management works end-to-end via the web dashboard:
   - View tenant list with filtering and search
   - Invite a new tenant
   - View tenant detail page
8. Lease management works end-to-end via the web dashboard:
   - Create a lease (select property + tenant)
   - View lease in the list
   - Activate a pending lease (property becomes Occupied)
   - View lease detail
   - Renew an active lease
   - Activate the renewal (original expires)
   - Terminate a lease
9. Property detail page shows current tenant and active lease
10. No regressions in existing property CRUD functionality
11. No regressions in existing mobile app functionality
