# Sprint 4: Maintenance Requests

## Overview

This sprint delivers **Maintenance Requests** across all three surfaces: API, web dashboard, and mobile app. Maintenance requests are the primary tenant-facing interaction — tenants submit requests for property issues, managers review and resolve them. This is also the first sprint that adds new mobile app functionality beyond the existing document/notification screens.

**Goal:** A tenant can submit a maintenance request from the mobile app (with photos), track its status, and receive push notifications on updates. A property manager can view all requests on the web dashboard (table + Kanban board), update statuses, and see requests on the property detail page.

**Why this sprint:** Maintenance requests depend on properties and leases (both done). Tenants must have an active lease to submit a request — that validation is now possible. This feature is a prerequisite for the payments sprint, since it completes the core property management workflow loop. It's also the first feature that exercises both manager (web) and tenant (mobile) sides simultaneously.

---

## What Exists (from Sprints 1–3)

| Layer | What's Done |
|-------|-------------|
| **Shared package** | All maintenance enums (`MaintenancePriority`, `MaintenanceStatus`, `MaintenanceCategory`), types (`MaintenanceRequest`), DTOs, Zod schemas (`createMaintenanceRequestSchema`, `updateMaintenanceRequestSchema`, `maintenanceRequestFilterSchema`), constants (`MAINTENANCE_STATUS_TRANSITIONS`, error messages, display labels) |
| **Prisma schema** | `MaintenanceRequest` model with all fields, indexes, relations to Property and Client |
| **API — Property** | Full CRUD (7 endpoints), domain entity, repository, use cases |
| **API — Lease** | Full CRUD (6 endpoints), `LeasesRepository.findActiveByProperty()` and `findActiveByTenant()` |
| **API — Notification** | `CreateNotificationUseCase` with push notification support. Domain entity uses legacy field names (`text` → maps to Prisma `title`, `linkedTransactionId` → maps to `linkedMaintenanceRequestId`). `ActionType` enum in domain has only 3 values but Prisma has all 11 — mapper casts between them at runtime. |
| **API — Blob Storage** | `BlobStorageRepository` with `generateUploadUrl()`, `generateDownloadUrl()`, `deleteBlob()` — used by document upload flow |
| **Web** | Dashboard layout, property CRUD pages, tenant list/detail, lease CRUD pages. Maintenance page is a placeholder. Property detail page has NO maintenance section yet. |
| **Mobile** | 2-tab navigation (Documents, Notifications). Document upload flow with `expo-image-picker` + `expo-document-picker`. Kubb-generated API hooks from Swagger. No maintenance screens. |

---

## Architectural Decisions

1. **Maintenance lives in a new domain context:** `apps/api/src/domain/maintenance/`. Follows the same DDD structure as `property-management/` and `lease-management/`.

2. **Photo uploads use the blob storage SAS URL pattern** — same as document uploads. The API generates a signed upload URL, the client uploads directly to Azure Blob Storage, then confirms. Do NOT use multer/multipart upload like `UploadPropertyPhotos` — follow the document upload pattern instead (`generateUploadUrl` → client uploads → confirm). Store blob keys in the `MaintenanceRequest.photos` string array.

3. **Notification integration uses the existing `CreateNotificationUseCase`** — pass maintenance request ID as `linkedTransactionId` (which the mapper writes to `linkedMaintenanceRequestId` in Prisma). Use `ActionType.MAINTENANCE_UPDATE` — cast it through the existing domain enum. The Notification domain entity's `ActionType` enum needs to be extended with `MAINTENANCE_UPDATE` to avoid relying on runtime casting.

4. **Role-based status transitions are enforced in use cases, not shared constants.** The `MAINTENANCE_STATUS_TRANSITIONS` map defines which transitions are valid. The use cases additionally check WHO can perform each transition:
   - Only managers can move OPEN → IN_PROGRESS and IN_PROGRESS → RESOLVED
   - Either party (manager or tenant) can move RESOLVED → CLOSED

5. **Mobile app gets a new "Maintenance" tab** added to the footer navigation. The tab structure changes from 2 tabs to 3: Documents, Maintenance, Notifications.

6. **Mobile API hooks are auto-generated via Kubb** from the Swagger spec. After the API endpoints are built, run `npx kubb generate` in `apps/mobile/` to generate the hooks. Custom wrapper hooks in `apps/mobile/src/hooks/` add business logic on top.

7. **Web Kanban board is a stretch goal.** The primary view is a table (like leases/properties). A Kanban toggle (columns: Open → In Progress → Resolved → Closed) is nice-to-have but not blocking. If built, use a simple CSS grid/flex layout — do NOT add a drag-and-drop library.

8. **Tenant submits requests via mobile only.** The web dashboard is read-only for request content (managers update status, view details). The mobile app has the create form. There is no web-side "create maintenance request" form.

---

## Task 1: Maintenance Domain Layer (Backend Agent)

### Objective

Create the MaintenanceRequest domain entity, value objects, repository interface, error classes, and all use cases.

### Dependencies

- Sprint 1 complete (shared package)
- `LeasesRepository` from Sprint 3 (for active lease validation)
- `PropertiesRepository` from Sprint 2 (for property ownership checks)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/domain/maintenance/enterprise/entities/maintenance-request.ts` | MaintenanceRequest domain entity |
| `apps/api/src/domain/maintenance/enterprise/entities/value-objects/maintenance-status.ts` | MaintenanceStatus value object |
| `apps/api/src/domain/maintenance/enterprise/entities/value-objects/maintenance-priority.ts` | MaintenancePriority value object |
| `apps/api/src/domain/maintenance/enterprise/entities/value-objects/maintenance-category.ts` | MaintenanceCategory value object |
| `apps/api/src/domain/maintenance/application/repositories/maintenance-requests-repository.ts` | Abstract repository interface |
| `apps/api/src/domain/maintenance/application/use-cases/create-maintenance-request.ts` | Tenant submits a request |
| `apps/api/src/domain/maintenance/application/use-cases/get-maintenance-request-by-id.ts` | Get single request |
| `apps/api/src/domain/maintenance/application/use-cases/get-maintenance-requests.ts` | List with filtering/pagination |
| `apps/api/src/domain/maintenance/application/use-cases/get-maintenance-requests-by-property.ts` | List by property (for property detail page) |
| `apps/api/src/domain/maintenance/application/use-cases/get-maintenance-requests-by-tenant.ts` | List for current tenant (mobile) |
| `apps/api/src/domain/maintenance/application/use-cases/update-maintenance-request-status.ts` | Status transition with role checks |
| `apps/api/src/domain/maintenance/application/use-cases/upload-maintenance-photos.ts` | Generate upload URLs for photos |
| `apps/api/src/domain/maintenance/application/use-cases/confirm-maintenance-photos.ts` | Confirm photo uploads and store keys |
| `apps/api/src/domain/maintenance/application/use-cases/errors/*.ts` | Error classes |
| `test/factories/make-maintenance-request.ts` | Test factory |
| `test/repositories/prisma/in-memory-maintenance-requests-repository.ts` | In-memory repository |

### Requirements

#### MaintenanceRequest Entity

Follow the Property entity pattern — extends `Entity<MaintenanceRequestProps>`, value objects for `MaintenanceStatus`, `MaintenancePriority`, `MaintenanceCategory`, static `create()` factory, getters/setters with `touch()`.

Key differences from Property:
- `propertyId` and `tenantId` are `UniqueEntityId` references (like Lease)
- `photos` is `string[]` (blob storage keys)
- `resolvedAt` is `Date | null` — set automatically when status transitions to RESOLVED
- Default status is `OPEN`, default priority is `MEDIUM`

#### Value Objects

Create `MaintenanceStatus`, `MaintenancePriority`, and `MaintenanceCategory` value objects following the `PropertyStatus` pattern. Each validates against allowed values and exposes a `value` getter and static `create(value: string)` factory.

#### Repository Interface

```typescript
abstract class MaintenanceRequestsRepository {
  abstract create(request: MaintenanceRequest): Promise<void>
  abstract findById(requestId: string): Promise<MaintenanceRequest | null>
  abstract findMany(params: MaintenanceRequestsFilterParams): Promise<MaintenanceRequestsPaginatedResult>
  abstract findManyByProperty(params: MaintenanceRequestsByPropertyParams): Promise<MaintenanceRequestsPaginatedResult>
  abstract findManyByTenant(params: MaintenanceRequestsByTenantParams): Promise<MaintenanceRequestsPaginatedResult>
  abstract update(request: MaintenanceRequest): Promise<MaintenanceRequest>
}
```

Filter params should include: `status?`, `priority?`, `category?`, `propertyId?`, `page`, `pageSize`.
ByProperty params: `propertyId`, `status?`, `page`, `pageSize`.
ByTenant params: `tenantId`, `status?`, `page`, `pageSize`.

#### Error Classes

| Error | Message | When |
|-------|---------|------|
| `MaintenanceRequestNotFoundError` | "Maintenance request not found" | Request doesn't exist |
| `MaintenanceNoActiveLeaseError` | Use `MAINTENANCE_NO_ACTIVE_LEASE` from shared | Tenant has no active lease on the property |
| `InvalidMaintenanceStatusTransitionError` | "Invalid maintenance request status transition from X to Y" | Invalid transition per `MAINTENANCE_STATUS_TRANSITIONS` |
| `MaintenanceOnlyManagerCanUpdateStatusError` | Use `MAINTENANCE_ONLY_MANAGER_CAN_UPDATE_STATUS` from shared | Tenant tries to move to IN_PROGRESS or RESOLVED |
| `MaintenancePhotoLimitExceededError` | "Cannot exceed N photos per request" | Photo count exceeds `MAX_MAINTENANCE_PHOTOS` |

#### Use Case: CreateMaintenanceRequest

This is a **tenant-side** use case (not manager).

Input: `tenantId` (from auth), `propertyId`, `title`, `description`, `category`, `priority?`

Business rules:
1. Verify tenant has an active lease on the specified property — inject `LeasesRepository`, call `findActiveByTenant(tenantId)`, check that the returned lease's `propertyId` matches the request's `propertyId`. Error: `MaintenanceNoActiveLeaseError`.
2. Create the request with status `OPEN`, priority defaults to `MEDIUM`.
3. **Send notification to the property manager:**
   - Look up the property via `PropertiesRepository.findById(propertyId)` to get `managerId`
   - Call `CreateNotificationUseCase.execute()` with:
     - `personId`: the manager's ID
     - `text`: "New maintenance request: {title}"
     - `notificationType`: `NotificationType.ACTION`
     - `actionType`: `ActionType.MAINTENANCE_UPDATE` (extend the domain enum — see Notification Update section)
     - `linkedTransactionId`: the new maintenance request's ID
4. **If priority is EMERGENCY**, the push notification title should indicate urgency: "EMERGENCY: {title}". The standard `CreateNotificationUseCase` handles push delivery — the urgency is conveyed through the notification text.

#### Use Case: UpdateMaintenanceRequestStatus

Input: `requestId`, `userId` (from auth), `userRole` ("manager" | "tenant"), `status`

Business rules:
1. Find the request by ID. Error: `MaintenanceRequestNotFoundError`.
2. Validate transition against `MAINTENANCE_STATUS_TRANSITIONS` from `@leaselink/shared`. Error: `InvalidMaintenanceStatusTransitionError`.
3. **Role check:**
   - OPEN → IN_PROGRESS: only manager. Error: `MaintenanceOnlyManagerCanUpdateStatusError`.
   - IN_PROGRESS → RESOLVED: only manager. Error: `MaintenanceOnlyManagerCanUpdateStatusError`.
   - RESOLVED → CLOSED: either manager or tenant (no role check).
4. If transitioning to RESOLVED, set `resolvedAt = new Date()`.
5. **Send notification to the OTHER party:**
   - If manager updated: notify the tenant (`request.tenantId`)
   - If tenant closed: notify the manager (look up via property)
   - Notification text: "Maintenance request '{title}' status changed to {newStatus}"
   - `actionType`: `ActionType.MAINTENANCE_UPDATE`
   - `linkedTransactionId`: the request's ID

#### Use Case: UploadMaintenancePhotos

Generates signed upload URLs for maintenance request photos. The client then uploads directly to blob storage.

Input: `requestId`, `tenantId` (from auth), `files: Array<{ fileName: string, contentType: string }>`

Business rules:
1. Find the request. Verify `tenantId` matches the request's tenant.
2. Check `currentPhotos.length + files.length <= MAX_MAINTENANCE_PHOTOS` (10). Error: `MaintenancePhotoLimitExceededError`.
3. For each file, call `BlobStorageRepository.generateUploadUrl()` with key pattern: `maintenance-requests/{requestId}/photos/{uuid}-{fileName}`
4. Return the upload URLs and blob keys.

#### Use Case: ConfirmMaintenancePhotos

Called after the client successfully uploads to blob storage.

Input: `requestId`, `tenantId`, `blobKeys: string[]`

Business rules:
1. Find the request. Verify `tenantId` matches.
2. Append `blobKeys` to `request.photos`.
3. Save.

#### Use Cases: GetMaintenanceRequestById, GetMaintenanceRequests, GetMaintenanceRequestsByProperty, GetMaintenanceRequestsByTenant

Follow the patterns of `GetPropertyById`, `GetPropertiesByManager`, etc. Standard CRUD reads with filtering and pagination.

`GetMaintenanceRequestById` should verify access: the requesting user must be either the tenant who created it or a manager who owns the property.

`GetMaintenanceRequestsByTenant` filters by `tenantId` from the auth context — tenant only sees their own requests.

`GetMaintenanceRequests` is for managers — shows all requests across all their properties. Inject `PropertiesRepository` to get the manager's property IDs, then filter requests by those property IDs.

### Notification Entity Update

The Notification domain entity at `apps/api/src/domain/notification/enterprise/entities/notification.ts` needs its `ActionType` enum updated to include `MAINTENANCE_UPDATE`. Add it to the enum:

```typescript
export enum ActionType {
  SIGN_DOCUMENT = 'SIGN_DOCUMENT',
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  BASIC_COMPLETE = 'BASIC_COMPLETE',
  MAINTENANCE_UPDATE = 'MAINTENANCE_UPDATE',  // ADD THIS
}
```

This eliminates the runtime casting gap between the domain and Prisma enums for this action type. Only add `MAINTENANCE_UPDATE` — the remaining new action types (`LEASE_EXPIRY`, `RENT_REMINDER`, etc.) will be added in their respective sprints.

### Acceptance Criteria

- [ ] `MaintenanceRequest` entity follows the Property entity pattern with 3 value objects
- [ ] Repository has 6 methods including filtered list queries
- [ ] `CreateMaintenanceRequest` validates active lease exists for tenant + property
- [ ] `CreateMaintenanceRequest` sends notification to property manager
- [ ] EMERGENCY requests indicate urgency in notification text
- [ ] `UpdateMaintenanceRequestStatus` validates transitions via `MAINTENANCE_STATUS_TRANSITIONS`
- [ ] `UpdateMaintenanceRequestStatus` enforces role-based access (only manager → IN_PROGRESS/RESOLVED)
- [ ] `UpdateMaintenanceRequestStatus` sets `resolvedAt` when transitioning to RESOLVED
- [ ] `UpdateMaintenanceRequestStatus` sends notification to the other party
- [ ] `UploadMaintenancePhotos` generates SAS URLs and enforces `MAX_MAINTENANCE_PHOTOS` limit
- [ ] `ConfirmMaintenancePhotos` appends blob keys to photos array
- [ ] `GetMaintenanceRequests` (manager) only returns requests for properties the manager owns
- [ ] `GetMaintenanceRequestsByTenant` only returns the tenant's own requests
- [ ] Notification `ActionType` enum includes `MAINTENANCE_UPDATE`
- [ ] All error classes exist with shared error message strings
- [ ] All files pass `tsc --noEmit`

### Test Cases

#### CreateMaintenanceRequest Tests

| Test | Setup | Expected |
|------|-------|----------|
| should create a request | Tenant with active lease on property | `isRight()`, request with OPEN status, MEDIUM priority |
| should use specified priority | priority: EMERGENCY | Request priority is EMERGENCY |
| should reject if no active lease | Tenant has no active lease | `isLeft()`, MaintenanceNoActiveLeaseError |
| should reject if lease is on different property | Active lease on property A, request for property B | `isLeft()`, MaintenanceNoActiveLeaseError |
| should send notification to manager | Valid request created | CreateNotificationUseCase called with managerId |
| should indicate EMERGENCY in notification | priority: EMERGENCY | Notification text contains "EMERGENCY" |

#### UpdateMaintenanceRequestStatus Tests

| Test | Setup | Expected |
|------|-------|----------|
| should transition OPEN → IN_PROGRESS (manager) | Manager user, OPEN request | `isRight()`, status IN_PROGRESS |
| should reject OPEN → IN_PROGRESS (tenant) | Tenant user, OPEN request | `isLeft()`, MaintenanceOnlyManagerCanUpdateStatusError |
| should transition IN_PROGRESS → RESOLVED (manager) | Manager user | `isRight()`, status RESOLVED, resolvedAt set |
| should reject IN_PROGRESS → RESOLVED (tenant) | Tenant user | `isLeft()`, MaintenanceOnlyManagerCanUpdateStatusError |
| should transition RESOLVED → CLOSED (manager) | Manager user | `isRight()`, status CLOSED |
| should transition RESOLVED → CLOSED (tenant) | Tenant user | `isRight()`, status CLOSED |
| should reject OPEN → RESOLVED (skip) | Manager user | `isLeft()`, InvalidMaintenanceStatusTransitionError |
| should reject CLOSED → any | CLOSED request | `isLeft()`, InvalidMaintenanceStatusTransitionError |
| should send notification to tenant on manager update | Manager moves to IN_PROGRESS | CreateNotificationUseCase called with tenantId |
| should send notification to manager on tenant close | Tenant moves to CLOSED | CreateNotificationUseCase called with managerId |

#### UploadMaintenancePhotos Tests

| Test | Setup | Expected |
|------|-------|----------|
| should generate upload URLs | Request with 0 photos, 3 files | `isRight()`, 3 upload URLs returned |
| should reject if exceeds limit | Request with 8 photos, 3 files | `isLeft()`, MaintenancePhotoLimitExceededError |
| should reject if tenant doesn't own request | Different tenantId | `isLeft()`, MaintenanceRequestNotFoundError |

---

## Task 2: Maintenance Infrastructure Layer (Backend Agent)

### Objective

Create the Prisma repository, mapper, HTTP controllers, presenter, Swagger DTOs, and register everything in NestJS modules.

### Dependencies

- Task 1 (domain layer must exist)

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `apps/api/src/infra/database/prisma/mappers/prisma-maintenance-request-mapper.ts` | Prisma ↔ domain mapper |
| `apps/api/src/infra/database/prisma/repositories/prisma-maintenance-requests-repository.ts` | Prisma repository implementation |
| `apps/api/src/infra/http/controllers/create-maintenance-request/create-maintenance-request.controller.ts` | POST /maintenance-requests (tenant) |
| `apps/api/src/infra/http/controllers/get-maintenance-requests/get-maintenance-requests.controller.ts` | GET /maintenance-requests (manager) |
| `apps/api/src/infra/http/controllers/get-maintenance-request-by-id/get-maintenance-request-by-id.controller.ts` | GET /maintenance-requests/:id |
| `apps/api/src/infra/http/controllers/get-maintenance-requests-by-property/get-maintenance-requests-by-property.controller.ts` | GET /properties/:propertyId/maintenance-requests |
| `apps/api/src/infra/http/controllers/get-maintenance-requests-by-tenant/get-maintenance-requests-by-tenant.controller.ts` | GET /maintenance-requests/tenant (current tenant's requests) |
| `apps/api/src/infra/http/controllers/update-maintenance-request-status/update-maintenance-request-status.controller.ts` | PATCH /maintenance-requests/:id/status |
| `apps/api/src/infra/http/controllers/upload-maintenance-photos/upload-maintenance-photos.controller.ts` | POST /maintenance-requests/:id/photos |
| `apps/api/src/infra/http/controllers/confirm-maintenance-photos/confirm-maintenance-photos.controller.ts` | POST /maintenance-requests/:id/photos/confirm |
| `apps/api/src/infra/http/presenters/http-maintenance-request-presenter.ts` | MaintenanceRequest → JSON |
| `apps/api/src/infra/http/DTOs/maintenance-request/*.ts` | Swagger DTOs |
| `apps/api/src/infra/database/database.module.ts` | Modify — register repository |
| `apps/api/src/infra/http/http.module.ts` | Modify — register controllers and use cases |

### Requirements

#### Prisma Mapper

Follow `PrismaPropertyMapper` pattern. Map all fields including `photos` (string array), `resolvedAt` (nullable DateTime), and enum value objects.

#### Prisma Repository

Implement all 6 methods. Key details:

- `findMany` (manager): accepts an optional `managerId` — if provided, filter to properties owned by that manager by joining through the Property relation: `where: { property: { managerId } }`. Also supports `status`, `priority`, `category`, `propertyId` filters.
- `findManyByProperty`: `where: { propertyId }` with optional `status` filter. Order by `createdAt desc`.
- `findManyByTenant`: `where: { tenantId }` with optional `status` filter. Order by `createdAt desc`.
- All list queries return `{ requests, totalCount }` with pagination.

#### Controllers — Auth Guards

Maintenance requests have mixed access patterns:

| Endpoint | Who Can Access | Guard |
|----------|---------------|-------|
| POST /maintenance-requests | Tenant only | Custom check — `@CurrentUser()` must be a client (not employee). Use the existing auth system to determine user type. |
| GET /maintenance-requests | Manager only | `EmployeeOnlyGuard` |
| GET /maintenance-requests/:id | Both (with ownership check in use case) | No specific guard — the use case validates access |
| GET /properties/:propertyId/maintenance-requests | Manager only | `EmployeeOnlyGuard` |
| GET /maintenance-requests/tenant | Tenant only | Check user is a client |
| PATCH /maintenance-requests/:id/status | Both (role check in use case) | No specific guard — use case handles role logic |
| POST /maintenance-requests/:id/photos | Tenant only | Check user is a client |
| POST /maintenance-requests/:id/photos/confirm | Tenant only | Check user is a client |

**Auth pattern for tenant endpoints:** The existing `@CurrentUser()` decorator returns the authenticated user. Check the existing auth infrastructure to determine how to distinguish between employee (manager) and client (tenant) users. The `EnhancedAuthGuard` is global — you need to determine user type from the auth session. Look at how the existing mobile endpoints (profile photo upload, notification preferences) handle tenant auth.

**Important:** The `UpdateMaintenanceRequestStatus` controller needs to pass `userRole` to the use case. Determine the role from the auth context:
- If the user is an employee → `userRole: "manager"`
- If the user is a client → `userRole: "tenant"`

#### Route Ordering

Register `GET /maintenance-requests/tenant` BEFORE `GET /maintenance-requests/:id` in `http.module.ts` to avoid `:id` matching "tenant".

Similarly, `GET /properties/:propertyId/maintenance-requests` uses the `/properties` prefix — register this controller alongside property controllers, or place it in the maintenance controllers directory with `@Controller('/properties')`.

#### Swagger

All controllers should have `@ApiTags('Maintenance Requests')` (except the property-scoped one which could use `@ApiTags('Properties')` or `@ApiTags('Maintenance Requests')`).

### Acceptance Criteria

- [ ] All 8 controllers registered and functional
- [ ] Swagger UI shows all maintenance request endpoints
- [ ] `POST /maintenance-requests` creates a request (tenant auth)
- [ ] `GET /maintenance-requests` returns paginated list for manager's properties
- [ ] `GET /maintenance-requests/:id` returns single request with access check
- [ ] `GET /properties/:propertyId/maintenance-requests` returns requests for a property
- [ ] `GET /maintenance-requests/tenant` returns current tenant's requests
- [ ] `PATCH /maintenance-requests/:id/status` transitions status with role enforcement
- [ ] `POST /maintenance-requests/:id/photos` returns signed upload URLs
- [ ] `POST /maintenance-requests/:id/photos/confirm` stores blob keys
- [ ] Error responses use correct HTTP status codes (400, 403, 404, 409)
- [ ] API starts without errors
- [ ] Existing tests still pass
- [ ] Kubb can generate mobile hooks from the updated Swagger spec

### Test Cases

Verified via:
1. **Compilation:** `cd apps/api && npx tsc --noEmit` exits 0
2. **Server startup:** `npm run start:dev` starts without errors
3. **Swagger:** All 8 endpoints visible under "Maintenance Requests" tag
4. **Existing tests:** `cd apps/api && npm run test` passes

---

## Task 3: Maintenance Pages — Web Dashboard (Web Agent)

### Objective

Build the maintenance request management UI for property managers: list page with filtering, detail page with status updates, and integration with the property detail page.

### Dependencies

- Task 2 (API endpoints must exist)
- Sprint 2–3 web foundation (dashboard layout, component patterns)

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-maintenance-requests.ts` | TanStack Query hooks |
| `apps/web/src/app/(dashboard)/maintenance/page.tsx` | Replace placeholder — maintenance list page |
| `apps/web/src/app/(dashboard)/maintenance/[id]/page.tsx` | Maintenance detail page |
| `apps/web/src/components/maintenance/maintenance-status-badge.tsx` | Status badge |
| `apps/web/src/components/maintenance/maintenance-priority-badge.tsx` | Priority badge |
| `apps/web/src/components/maintenance/maintenance-category-badge.tsx` | Category label |
| `apps/web/src/components/maintenance/update-status-dialog.tsx` | Status change dialog |
| `apps/web/src/components/maintenance/maintenance-photo-viewer.tsx` | Photo gallery viewer |
| `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` | Modify — add maintenance requests section |

### Requirements

#### TanStack Query Hooks — `use-maintenance-requests.ts`

Follow `use-leases.ts` pattern:

- `useMaintenanceRequests(filters)` — `GET /maintenance-requests` with status, priority, category, propertyId, page, pageSize
- `useMaintenanceRequest(id)` — `GET /maintenance-requests/:id`
- `useMaintenanceRequestsByProperty(propertyId, filters)` — `GET /properties/:propertyId/maintenance-requests`
- `useUpdateMaintenanceRequestStatus(id)` — `PATCH /maintenance-requests/:id/status`

Query keys: `['maintenance-requests', filters]` for list, `['maintenance-requests', id]` for detail, `['maintenance-requests', 'property', propertyId]` for by-property.

Mutations should invalidate `['maintenance-requests']` on success.

#### Maintenance List Page

Replace the placeholder at `apps/web/src/app/(dashboard)/maintenance/page.tsx`.

Features:
- Page header: "Maintenance Requests" title (no "Create" button — tenants create from mobile)
- Filter bar: status dropdown (All, Open, In Progress, Resolved, Closed) + priority dropdown (All, Low, Medium, High, Emergency) + category dropdown + property filter (optional)
- Table columns: Title, Property, Tenant, Category, Priority, Status, Created, Actions
  - Property and Tenant display: resolve from IDs client-side (same join pattern as lease list page — fetch properties and tenants in parallel)
  - Priority column: `MaintenancePriorityBadge` — EMERGENCY should be visually prominent (red/destructive)
  - Status column: `MaintenanceStatusBadge`
  - Created column: relative time ("2 hours ago", "3 days ago") — use a date formatting utility or `Intl.RelativeTimeFormat`
- Actions: View, Change Status (dropdown with valid transitions)
- Pagination
- Empty state: "No maintenance requests."
- EMERGENCY requests should be visually distinguished — consider a subtle red left border or background tint on the table row

Use `MAINTENANCE_STATUS_LABELS`, `MAINTENANCE_PRIORITY_LABELS`, `MAINTENANCE_CATEGORY_LABELS` from `@leaselink/shared`.

#### Maintenance Detail Page

Features:
- Header: request title, status badge, priority badge, category label
- Info card: property (link to property detail), tenant (link to tenant detail), created date, resolved date (if applicable)
- Description section: full request description text
- Photo gallery: grid of tenant-uploaded photos (use `MaintenancePhotoViewer` component). Photos are blob storage keys — the API needs a way to generate download URLs. Use the existing blob storage download URL pattern (or display via a `/maintenance-requests/:id/photos/:index` endpoint — TBD based on how property photos are rendered on the web).
- Status timeline: visual indicator of the request's journey through statuses (OPEN → IN_PROGRESS → RESOLVED → CLOSED) with timestamps for each transition. For Sprint 4, a simple step indicator showing which steps are complete is sufficient — exact timestamps per step would require tracking status change history, which is out of scope.
- Action button: "Update Status" opens `UpdateStatusDialog` with valid transitions
- Back button to maintenance list

**Photo display approach:** Property photos are stored as blob keys in `photos[]`. Check how the property detail page's `PropertyPhotoGallery` component renders photos — it likely generates download URLs or uses a proxy endpoint. Follow the same pattern for maintenance photos.

#### UpdateStatusDialog

A `Dialog` that:
- Shows the current status
- Shows only valid target statuses from `MAINTENANCE_STATUS_TRANSITIONS`
- Shows a confirmation message explaining the transition
- Loading state during mutation
- On success: toast notification, dialog closes, data refetches

#### MaintenanceStatusBadge

| Status | Color |
|--------|-------|
| OPEN | `secondary` (blue) |
| IN_PROGRESS | `default` with amber/yellow styling |
| RESOLVED | green |
| CLOSED | `outline` (gray) |

#### MaintenancePriorityBadge

| Priority | Color |
|----------|-------|
| LOW | `outline` (gray) |
| MEDIUM | `default` |
| HIGH | `secondary` with orange styling |
| EMERGENCY | `destructive` (red) |

#### Property Detail Page — Maintenance Section

Modify `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` to add a "Maintenance Requests" section below the existing Active Lease card.

Features:
- Section header: "Maintenance Requests" with a link to the filtered maintenance list page (`/maintenance?propertyId=<id>`)
- Show the 5 most recent requests for this property using `useMaintenanceRequestsByProperty(propertyId, { pageSize: 5 })`
- Each request shows: title, priority badge, status badge, created date
- Clickable rows navigate to `/maintenance/:id`
- If no requests: "No maintenance requests for this property."
- "View all" link at the bottom if there are more than 5

### Acceptance Criteria

- [ ] Maintenance list page shows all requests with status/priority/category filters
- [ ] Table displays property and tenant names (resolved from IDs)
- [ ] EMERGENCY requests are visually prominent
- [ ] Pagination works
- [ ] Maintenance detail page shows all request info
- [ ] Photo gallery renders uploaded photos
- [ ] Status update dialog shows only valid transitions
- [ ] Status update sends PATCH and refetches data
- [ ] Property detail page shows recent maintenance requests
- [ ] Status/priority/category badges render with correct colors
- [ ] `next build` passes

---

## Task 4: Maintenance Screens — Mobile App (Mobile Agent)

### Objective

Add maintenance request functionality to the mobile app: new tab in navigation, request list screen, request detail screen, create request form with photo attachment, and status updates.

### Dependencies

- Task 2 (API endpoints must exist and Swagger spec must be up to date)
- Kubb codegen must be run after Task 2 to generate hooks

### Pre-requisite Step

Before implementing screens, regenerate the Kubb API hooks:
```bash
cd apps/mobile && npx kubb generate
```
This will generate hooks for all new maintenance endpoints from the Swagger spec.

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `apps/mobile/app/(main)/_layout.tsx` | Modify — add Maintenance tab to footer |
| `apps/mobile/app/(main)/maintenance/index.tsx` | Maintenance request list screen |
| `apps/mobile/app/(main)/maintenance/[id].tsx` | Maintenance request detail screen |
| `apps/mobile/app/(main)/maintenance/create.tsx` | Create maintenance request form |
| `apps/mobile/src/components/Maintenance/MaintenanceRequestList/index.tsx` | List component with FlashList |
| `apps/mobile/src/components/Maintenance/MaintenanceRequestItem/index.tsx` | Individual request row |
| `apps/mobile/src/components/Maintenance/MaintenanceStatusBadge/index.tsx` | Status badge |
| `apps/mobile/src/components/Maintenance/MaintenancePriorityBadge/index.tsx` | Priority badge |
| `apps/mobile/src/components/Maintenance/MaintenanceFilters/index.tsx` | Filter modal |
| `apps/mobile/src/hooks/useMaintenanceRequests/index.tsx` | Custom hook wrapping generated hooks |
| `apps/mobile/src/i18n/locales/en/maintenance.json` | English translations |

### Requirements

#### Navigation Update

Modify `apps/mobile/app/(main)/_layout.tsx`:

1. Add maintenance to `pagesWithFooter`:
```typescript
const pagesWithFooter = [
  { path: '/documents', label: 'documents', icon: 'file-06' },
  { path: '/maintenance', label: 'maintenance', icon: 'tool-02' },  // or appropriate icon from the icon registry
  { path: '/notifications', label: 'notifications', icon: 'bell-01' },
]
```

2. Add `/maintenance` to `pagesWithHeader`.

3. Check the icon registry at `apps/mobile/src/constants/icons.ts` for an appropriate wrench/tool icon. If none exists, use a lucide icon or add one. The web dashboard uses `Wrench` from lucide.

4. Add translation key `maintenance` to the `main_footer` i18n namespace.

#### Maintenance List Screen

**`apps/mobile/app/(main)/maintenance/index.tsx`**

Follow the documents list screen pattern (`app/(main)/documents/index.tsx`):

- Header section: "Maintenance Requests" title + description
- Filter buttons: status filter (All, Open, In Progress, Resolved, Closed)
- Create button: FAB (floating action button) or prominent "+" button navigating to `/maintenance/create`
- `MaintenanceRequestList` component with infinite scroll (FlashList, 10 items per page)
- Each item shows: title, category label, priority badge, status badge, created date (relative)
- Empty state: "No maintenance requests yet. Submit one if you have an issue with your property."
- Loading skeleton

Uses `GET /maintenance-requests/tenant` via the generated hook.

#### Maintenance Detail Screen

**`apps/mobile/app/(main)/maintenance/[id].tsx`**

Follow the document detail screen pattern (`app/(main)/documents/[id].tsx`):

- Header with back button and request title
- Status badge and priority badge
- Category label
- Description text (full)
- Photo gallery: horizontal scroll of uploaded photos, tappable for full-screen preview. Follow the document preview pattern — use `expo-image` for rendering.
- Status section: visual step indicator (OPEN → IN_PROGRESS → RESOLVED → CLOSED) showing current step
- Action button: if status is RESOLVED, show "Close Request" button (tenant can close). Otherwise, show current status as informational text.
- Created date and resolved date (if applicable)

Uses `GET /maintenance-requests/:id` via generated hook.

#### Create Maintenance Request Screen

**`apps/mobile/app/(main)/maintenance/create.tsx`**

Form fields:
- Property: the tenant's current property. Since a tenant can only have one active lease, auto-detect the property from the active lease. Use `GET /leases/tenant` (existing hook) to get the active lease, then use the `propertyId`. If no active lease, show an error state: "You must have an active lease to submit a maintenance request."
- Title: text input (required, max 200 chars)
- Description: multiline text input (required, max 5000 chars)
- Category: select/picker with options from `MaintenanceCategory` enum. Use `MAINTENANCE_CATEGORY_LABELS` for display.
- Priority: select/picker with options from `MaintenancePriority` enum. Default to MEDIUM. Use `MAINTENANCE_PRIORITY_LABELS` for display.
- Photos: optional photo attachment section
  - "Add Photos" button
  - Options: Camera or Photo Library (same pattern as document upload — use `expo-image-picker`)
  - Show selected photo thumbnails with remove button
  - Max 10 photos

**Submit flow:**
1. Validate form using `createMaintenanceRequestSchema` from `@leaselink/shared`
2. Call `POST /maintenance-requests` with form data (excluding photos)
3. If photos were selected:
   a. Call `POST /maintenance-requests/:id/photos` with file metadata → get upload URLs
   b. Upload each photo directly to blob storage using the signed URLs
   c. Call `POST /maintenance-requests/:id/photos/confirm` with the blob keys
4. Navigate to the new request's detail screen
5. Show success toast

Use the existing document upload flow as reference for the blob storage upload pattern (generate URL → PUT to blob storage → confirm).

#### Custom Hook — `useMaintenanceRequests`

**`apps/mobile/src/hooks/useMaintenanceRequests/index.tsx`**

Wraps the generated Kubb hooks with business logic:

- `useMyMaintenanceRequests(filters)` — calls the generated tenant list hook with filters
- `useCreateMaintenanceRequest()` — mutation that creates request + handles photo upload flow
- `useCloseMaintenanceRequest()` — mutation that moves status to CLOSED

#### i18n

Add English translations for:
- Screen titles ("Maintenance Requests", "New Request", "Request Details")
- Form labels ("Title", "Description", "Category", "Priority", "Photos")
- Status labels (reuse from shared constants or duplicate for i18n)
- Empty states, error messages, success messages
- Footer tab label ("Maintenance")

### Acceptance Criteria

- [ ] 3-tab footer navigation: Documents, Maintenance, Notifications
- [ ] Maintenance list shows tenant's requests with infinite scroll
- [ ] Status/priority filters work
- [ ] Create form validates all fields
- [ ] Category and priority pickers show all options with labels
- [ ] Photo picker supports camera and photo library
- [ ] Photos upload to blob storage via signed URLs
- [ ] Successful creation navigates to detail screen
- [ ] Detail screen shows all request info including photos
- [ ] "Close Request" button appears when status is RESOLVED
- [ ] Push notifications received for status changes
- [ ] No regressions in existing document/notification screens
- [ ] App builds without errors: `npx expo build` (or `npx expo start` runs without errors)

### Test Cases

Manual verification:

1. **Navigation:** Tap Maintenance tab → see list screen
2. **Empty state:** New tenant with no requests → see empty state message
3. **Create request:** Tap "+" → fill form → submit → see new request in list
4. **Validation:** Submit with empty title → see error
5. **No active lease:** Tenant without a lease tries to create → see error
6. **Photo attachment:** Attach 2 photos from library → submit → photos visible in detail
7. **Camera photo:** Take a photo with camera → submit → photo visible
8. **Photo limit:** Try to attach 11 photos → see limit error
9. **Detail view:** Tap a request → see full details with status timeline
10. **Close request:** Manager resolves request → tenant sees "Close Request" button → tap → status changes to CLOSED
11. **Push notification:** Manager updates status → tenant receives push notification
12. **Filters:** Filter by OPEN status → only OPEN requests shown

---

## Implementation Order

```
Task 1 ──────────> Task 2 ──────────> Task 3 (Web)
(Domain Layer)     (Infrastructure)
[Backend]          [Backend]           [Web Agent]
                       │
                       ├──────────────> Task 4 (Mobile)
                       │                [Mobile Agent]
                       └── (run Kubb)
```

**Parallel work:**
- **Task 1** and early **Task 3** prep (component shells, hooks file stubs) can overlap slightly, but Task 3 needs Task 2's API to wire up.
- **Task 3** (Web) and **Task 4** (Mobile) can run in parallel once Task 2 is complete and Kubb has been regenerated.

**Recommended execution:**
1. **Task 1** (Backend — domain layer)
2. **Task 2** (Backend — infrastructure layer). After this, run Kubb codegen.
3. **Task 3** (Web) and **Task 4** (Mobile) in parallel

---

## Definition of Done

Sprint 4 is complete when:

1. `cd apps/api && npx tsc --noEmit` passes
2. `cd apps/api && npm run test` passes (all existing + new maintenance use case tests)
3. `cd apps/api && npm run start:dev` starts without errors
4. Swagger UI shows all 8 maintenance request endpoints
5. `cd apps/web && npx next build` passes with no errors
6. `cd apps/web && npm run dev` starts without errors
7. `cd apps/mobile && npx expo start` runs without errors
8. Maintenance request workflow works end-to-end:
   - Tenant creates a request from mobile app (with photos)
   - Manager sees the request on the web dashboard
   - Manager updates status OPEN → IN_PROGRESS → RESOLVED
   - Tenant receives push notifications for each status change
   - Tenant closes the resolved request from mobile
   - Manager sees the closed request
9. Property detail page shows recent maintenance requests
10. Web maintenance list page has working filters and pagination
11. Mobile app has 3-tab navigation (Documents, Maintenance, Notifications)
12. No regressions in existing functionality (properties, tenants, leases, documents, notifications)
