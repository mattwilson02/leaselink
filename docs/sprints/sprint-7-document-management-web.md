# Sprint 7: Document Management (Web Dashboard) & Tenant Lease Access

## Overview

This sprint delivers the **web dashboard document management pages** (the last remaining placeholder) and closes critical **API gaps for the tenant mobile experience** — specifically, tenants cannot currently view their own lease details via the API. It also updates the document request types to include the new values added in Sprint 1's schema migration (`SIGNED_LEASE`, `MOVE_IN_CHECKLIST`).

**Goal:** Property managers can view, search, and manage documents and document requests from the web dashboard. The document request flow supports all 4 request types from the product spec. Tenants can access their lease details from the mobile app via a new API endpoint. The web documents page replaces the last "Coming in Sprint 4" placeholder, completing the web dashboard feature set.

**Why this sprint:** Every other web dashboard page is fully functional — documents is the sole remaining placeholder. The API document endpoints already exist and work (the mobile app uses them), so the web work is purely frontend. The tenant lease endpoint gap was discovered during Sprint 6 integration — tenants need `GET /leases/tenant` to power the home screen lease card and payment context. This is a focused, low-risk sprint: no new domain entities, one small API addition, and one web page buildout using established patterns.

---

## What Exists (from Sprints 1–6)

| Layer | What's Done |
|-------|-------------|
| **API — Documents** | `GET /documents` (list by current user, supports folder/search/date filters), `GET /documents/:id`, `GET /documents/:id/download`, `POST /documents/upload` (SAS URL generation), `POST /documents/:id/confirm-upload`, `GET /documents/folder-summary`. All use `@CurrentUser()` — accessible to both managers and tenants. |
| **API — Document Requests** | `POST /document-requests` (create, manager-only), `GET /document-requests` (list for current user), `GET /document-requests/:id`. Request types in Prisma: `PROOF_OF_ADDRESS`, `PROOF_OF_IDENTITY`, `SIGNED_LEASE`, `MOVE_IN_CHECKLIST`. But the `GET /document-requests` controller only validates `PROOF_OF_ADDRESS` and `PROOF_OF_IDENTITY` in its Zod schema — the two new types are missing from the controller validation. |
| **API — Leases** | `GET /leases` (manager-only, `EmployeeOnlyGuard`), `GET /leases/:id` (manager-only), `GET /properties/:propertyId/active-lease`, `POST /leases`, `PATCH /leases/:id/status`, `POST /leases/:id/renew`. **No tenant-accessible lease endpoint exists.** |
| **Shared package** | `DocumentFolder`, `DocumentRequestType`, `DocumentRequestStatus` enums. `DOCUMENT_FOLDER_LABELS`, `DOCUMENT_REQUEST_TYPE_LABELS`, `DOCUMENT_REQUEST_STATUS_LABELS` display labels. `documentFilterSchema`, `createDocumentRequestSchema` Zod schemas. |
| **Web — Documents page** | Placeholder: "Coming in Sprint 4" card. No components, no hooks. |
| **Web — All other pages** | Fully implemented: dashboard, properties, tenants, leases, maintenance, payments, settings, notifications. |
| **Mobile — Documents** | Full document experience: folder browser, document list with search/filters, document detail with preview/download, document requests list, upload flow. Accessible via Home screen quick link. |

---

## Architectural Decisions

1. **Web document pages follow the existing web patterns.** Use `apiClient` for API calls, TanStack Query hooks, shadcn Table for lists, shadcn Dialog for actions. Follow the maintenance list page pattern most closely — it has similar filtering (status, category) and detail views.

2. **Document API responses use the existing shape.** The `GET /documents` endpoint returns `{ documents: [...] }` (not the paginated `{ data: [...], meta: {...} }` pattern used by properties/leases). The web hooks must handle this shape. The `GET /document-requests` endpoint returns `{ documentRequests: [...] }`. These are pre-existing patterns — do not change the API response shapes.

3. **Folder summary endpoint powers the documents landing page.** `GET /documents/folder-summary` returns document counts per folder — use this to render a folder overview card on the documents page.

4. **Document preview/download uses the existing `GET /documents/:id/download` endpoint** which returns a signed download URL. The web can either redirect to this URL or open it in a new tab.

5. **Tenant lease endpoint follows the existing `GET /maintenance-requests/tenant` and `GET /payments/tenant` pattern.** Create `GET /leases/tenant` that returns the authenticated tenant's leases (filtered by their `tenantId`). Reuse the existing `GetLeasesUseCase` — it already accepts `tenantId` as a filter parameter.

6. **Document request creation on the web uses the existing `POST /document-requests` endpoint.** The controller already has `EmployeeOnlyGuard` — managers create requests, tenants fulfill them. The web form needs a tenant selector and request type selector.

7. **Fix the document request type validation gap.** The `GET /document-requests` controller's Zod schema only allows `PROOF_OF_ADDRESS` and `PROOF_OF_IDENTITY`. Update it to include `SIGNED_LEASE` and `MOVE_IN_CHECKLIST` from the shared `DocumentRequestType` enum. Similarly, verify the `POST /document-requests` controller validates all 4 types.

---

## Task 1: Tenant Lease Endpoint & Document Request Fix (Backend Agent)

### Objective

Add a `GET /leases/tenant` endpoint so tenants can view their own leases from the mobile app. Fix the document request controller's Zod schema to accept all 4 request types. These are small, targeted changes.

### Dependencies

- None (extends existing code)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/http/controllers/get-leases-by-tenant/get-leases-by-tenant.controller.ts` | Create | GET /leases/tenant — tenant's own leases |
| `apps/api/src/infra/http/controllers/get-document-requests/get-document-requests.controller.ts` | Modify | Fix Zod schema to include SIGNED_LEASE and MOVE_IN_CHECKLIST |
| `apps/api/src/infra/http/http.module.ts` | Modify | Register new controller |

### Requirements

#### GET /leases/tenant — GetLeasesByTenantController

Follow the exact pattern of `GET /payments/tenant` and `GET /maintenance-requests/tenant`:

- `@ApiTags('Leases')`
- `@Controller('/leases')`
- No `EmployeeOnlyGuard` — this is a tenant endpoint
- Uses `@CurrentUser()` to get the authenticated tenant's ID
- Calls the existing `GetLeasesUseCase` with `tenantId: user.id`
- Accepts optional `status` query param for filtering (e.g., only ACTIVE leases)
- Returns paginated response: `{ data: [...], meta: { page, pageSize, totalCount, totalPages } }`

**Route ordering:** Register this controller BEFORE `GetLeaseByIdController` in `http.module.ts` to avoid `/leases/tenant` being matched as `/leases/:id` where `id = "tenant"`. Follow the same ordering strategy used for `/payments/tenant` and `/maintenance-requests/tenant`.

**Zod validation:** Use `leaseFilterSchema` from `@leaselink/shared` for query params, but override to remove `propertyId` and `tenantId` params (tenant can only see their own, and property filtering isn't needed for the tenant view). Or simply use the full schema and ignore the extra params — the use case will filter by `tenantId` from the auth context regardless.

#### Document Request Controller Fix

The existing `GET /document-requests` controller at `apps/api/src/infra/http/controllers/get-document-requests/get-document-requests.controller.ts` has:

```typescript
requestType: z.enum(['PROOF_OF_ADDRESS', 'PROOF_OF_IDENTITY']).optional(),
```

Update to include all 4 request types:

```typescript
requestType: z.enum(['PROOF_OF_ADDRESS', 'PROOF_OF_IDENTITY', 'SIGNED_LEASE', 'MOVE_IN_CHECKLIST']).optional(),
```

Or better, use `z.nativeEnum(DocumentRequestType)` from `@leaselink/shared` for consistency with other controllers.

Also verify the `POST /document-requests` controller (create document request) — check if its Zod schema also restricts to only 2 types and fix if needed.

### Acceptance Criteria

- [ ] `GET /leases/tenant` returns the authenticated tenant's leases
- [ ] `GET /leases/tenant?status=ACTIVE` filters by status
- [ ] `GET /leases/tenant` returns 401 for unauthenticated requests
- [ ] `GET /leases/tenant` does NOT require `EmployeeOnlyGuard`
- [ ] Route `/leases/tenant` does not conflict with `/leases/:id`
- [ ] `GET /document-requests?requestType=SIGNED_LEASE` works (no validation error)
- [ ] `GET /document-requests?requestType=MOVE_IN_CHECKLIST` works
- [ ] `POST /document-requests` accepts `SIGNED_LEASE` and `MOVE_IN_CHECKLIST` request types
- [ ] Swagger UI shows the new endpoint under "Leases" tag
- [ ] API starts without errors
- [ ] Existing tests still pass

### Test Cases

**GetLeasesByTenant (manual API test via Swagger):**

| Test | Input | Expected |
|------|-------|----------|
| Tenant with active lease | Authenticated as tenant with ACTIVE lease | Returns lease in `data` array |
| Tenant with no leases | Authenticated as tenant with no leases | Returns empty `data` array, totalCount: 0 |
| Filter by ACTIVE | `?status=ACTIVE` | Only ACTIVE leases returned |
| Manager cannot use endpoint | Authenticated as manager (employee) | Should still work (no guard restricts it — use case filters by tenantId from auth) OR returns empty if manager has no tenant record |

**Document request type fix:**

| Test | Input | Expected |
|------|-------|----------|
| Create SIGNED_LEASE request | `POST /document-requests { tenantId, requestType: "SIGNED_LEASE" }` | 201 Created |
| Filter by SIGNED_LEASE | `GET /document-requests?requestType=SIGNED_LEASE` | Returns matching requests |
| Filter by MOVE_IN_CHECKLIST | `GET /document-requests?requestType=MOVE_IN_CHECKLIST` | Returns matching requests |

---

## Task 2: Web Document Hooks & Utilities (Web Agent)

### Objective

Create TanStack Query hooks for all document and document request API endpoints. These hooks will be used by the document pages in Task 3.

### Dependencies

- None (API endpoints already exist)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-documents.ts` | TanStack Query hooks for document API calls |
| `apps/web/src/hooks/use-document-requests.ts` | TanStack Query hooks for document request API calls |

### Requirements

#### Document Hooks — `use-documents.ts`

Follow the `use-payments.ts` pattern. Note: the document API uses `offset`/`limit` pagination (not `page`/`pageSize`) and returns `{ documents: [...] }` (not `{ data: [...], meta: {...} }`).

- `useDocuments(params)` — `GET /documents` with query params: `offset`, `limit`, `search`, `folders` (array), `createdAtFrom`, `createdAtTo`. Query key: `['documents', params]`.
- `useDocument(id)` — `GET /documents/:id`. Query key: `['documents', id]`.
- `useFolderSummary()` — `GET /documents/folder-summary`. Query key: `['documents', 'folder-summary']`. Returns folder counts.
- `useDocumentDownloadUrl(id)` — `GET /documents/:id/download`. Returns a signed URL. This should NOT be a persistent query — call it on demand (use `useMutation` or `queryClient.fetchQuery` when the user clicks download).
- `useUploadDocument()` — Mutation: `POST /documents/upload` to get signed URL, then upload to blob storage, then `POST /documents/:id/confirm-upload`. Multi-step mutation following the existing mobile upload pattern.

Check the exact response shapes by reading the API controllers and presenters:
- `apps/api/src/infra/http/presenters/http-documents-presenter.ts`
- `apps/api/src/infra/http/controllers/get-document-folder-summary/get-document-folder-summary.controller.ts`
- `apps/api/src/infra/http/controllers/download-document/download-document.controller.ts`

#### Document Request Hooks — `use-document-requests.ts`

- `useDocumentRequests(params)` — `GET /document-requests` with `offset`, `limit`, `requestType` query params. Query key: `['document-requests', params]`.
- `useDocumentRequest(id)` — `GET /document-requests/:id`. Query key: `['document-requests', id]`.
- `useCreateDocumentRequest()` — Mutation: `POST /document-requests`. Body: `{ tenantId, requestType }`. Invalidates `['document-requests']` on success.

Check the response shape from `apps/api/src/infra/http/presenters/http-document-requests-presenter.ts`.

### Acceptance Criteria

- [ ] All document hooks export correctly typed functions
- [ ] `useDocuments` handles the `offset`/`limit` pagination pattern
- [ ] `useFolderSummary` returns folder-level document counts
- [ ] `useCreateDocumentRequest` mutation invalidates document request queries
- [ ] All hooks follow the established patterns in `use-payments.ts` / `use-leases.ts`
- [ ] `tsc --noEmit` passes on the web app

---

## Task 3: Web Document Pages (Web Agent)

### Objective

Build the document management pages for the web dashboard: documents landing page with folder overview, document list with filtering, document detail with download, document requests list, and create document request form. Replace the "Coming in Sprint 4" placeholder.

### Dependencies

- Task 2 (document hooks must exist)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/documents/page.tsx` | Rewrite | Documents landing page (replace placeholder) |
| `apps/web/src/app/(dashboard)/documents/[id]/page.tsx` | Create | Document detail page |
| `apps/web/src/app/(dashboard)/documents/requests/page.tsx` | Create | Document requests list |
| `apps/web/src/app/(dashboard)/documents/requests/new/page.tsx` | Create | Create document request form |
| `apps/web/src/components/documents/folder-overview.tsx` | Create | Folder grid with counts |
| `apps/web/src/components/documents/document-table.tsx` | Create | Document list table component |
| `apps/web/src/components/documents/document-folder-badge.tsx` | Create | Folder badge component |
| `apps/web/src/components/documents/document-request-status-badge.tsx` | Create | Request status badge |
| `apps/web/src/components/documents/create-document-request-dialog.tsx` | Create | Dialog form for creating requests |

### Requirements

#### Documents Landing Page

Replace the placeholder at `apps/web/src/app/(dashboard)/documents/page.tsx`.

The page has two sections:

**Section 1: Folder Overview**

A grid of folder cards showing each document folder with its document count and icon. Uses `useFolderSummary()` hook.

| Folder | Icon |
|--------|------|
| IDENTIFICATION | `BadgeCheck` |
| LEASE_AGREEMENTS | `FileText` |
| SIGNED_DOCUMENTS | `FilePen` |
| INSPECTION_REPORTS | `ClipboardCheck` |
| INSURANCE | `Shield` |
| OTHER | `Folder` |

Each card shows: folder icon, folder label (from `DOCUMENT_FOLDER_LABELS`), document count. Clicking a folder card filters the document table below to that folder.

**Section 2: All Documents Table**

Below the folder grid, a full document table:

- Page header: "Documents" title + "Create Request" button (navigates to `/documents/requests/new` or opens a dialog)
- Tab navigation: "All Documents" | "Document Requests"
- Filter bar: folder dropdown (from `DOCUMENT_FOLDER_LABELS`), search input, date range (optional stretch)
- Table columns: Name, Folder, Size, Upload Date, Actions
  - Name: document name, clickable to detail page
  - Folder: `DocumentFolderBadge` component
  - Size: formatted file size (e.g., "2.4 MB")
  - Upload Date: formatted date
  - Actions: View, Download
- Pagination (using offset/limit)
- Empty state: "No documents found."
- Loading skeletons

Use `DOCUMENT_FOLDER_LABELS` from `@leaselink/shared`.

**Note on pagination:** The document API uses `offset`/`limit`, not `page`/`pageSize`. The table's pagination controls should convert between page numbers and offsets: `offset = (page - 1) * limit`.

**Note on document ownership:** The `GET /documents` endpoint returns documents for the authenticated user. For managers, this may return their own documents — check if the endpoint supports filtering by `tenantId` or `propertyId`. Looking at the controller code, it uses `clientId = user.id` which means it returns documents belonging to the current user. For the web dashboard, managers need to see documents across all tenants.

**Important consideration:** The existing `GET /documents` controller filters by `clientId = user.id`, which works for tenants but not for managers viewing all tenant documents. Check if there's a separate manager-facing documents endpoint, or if the `user.id` for a manager resolves differently. If the current endpoint only returns the manager's own documents (likely empty), the web page needs a different approach:
- Option A: Add a `tenantId` query param to `GET /documents` so managers can view a specific tenant's documents (requires API change)
- Option B: The documents page shows document requests (which managers create) rather than the documents themselves, and document viewing happens through the tenant detail page
- Option C: Create a new `GET /documents/all` manager endpoint that returns documents across all tenants linked to the manager's properties

For Sprint 7, use **Option B** as the primary approach: the documents landing page focuses on **document requests** (which the manager creates and tracks) plus a folder overview. Individual tenant documents are accessed from the tenant detail page. If the `GET /documents` endpoint can be queried with a `tenantId` param by managers, surface that as a secondary feature.

#### Document Requests Tab/Page

**`apps/web/src/app/(dashboard)/documents/requests/page.tsx`**

Shows all document requests created by the manager:

- Table columns: Tenant Name, Request Type, Status, Created Date, Actions
  - Tenant Name: resolved from `tenantId` (same client-side join pattern as leases/payments)
  - Request Type: label from `DOCUMENT_REQUEST_TYPE_LABELS`
  - Status: `DocumentRequestStatusBadge` (PENDING, UPLOADED, CANCELED)
  - Actions: View uploaded document (if status is UPLOADED)
- Filter bar: request type dropdown, status dropdown
- Pagination
- Empty state: "No document requests. Create one to request documents from a tenant."

#### Create Document Request

**`apps/web/src/app/(dashboard)/documents/requests/new/page.tsx`** or a dialog component.

Form fields:
- Tenant selector: dropdown/combobox of tenants (use `useTenants()` hook). Show name + email.
- Request type: select dropdown with all 4 types from `DOCUMENT_REQUEST_TYPE_LABELS`:
  - Proof of Address
  - Proof of Identity
  - Signed Lease
  - Move-in Checklist
- Submit button

Uses `createDocumentRequestSchema` from `@leaselink/shared` with `zodResolver`.

On success: toast "Document request sent to [tenant name]", redirect to requests list.

#### Document Detail Page

**`apps/web/src/app/(dashboard)/documents/[id]/page.tsx`**

- Header: document name, folder badge
- Info card: folder, file size (formatted), content type, upload date, last viewed date
- Download button: calls the download URL endpoint and opens in new tab or triggers download
- Preview: for PDFs and images, show an in-browser preview. Use an `<iframe>` for PDFs or `<img>` for images, loaded from the download URL. For other file types, show a download prompt.
- Back button to documents list

#### DocumentFolderBadge

A badge/label showing the folder name with an icon. Use `DOCUMENT_FOLDER_LABELS` and color coding:

| Folder | Color |
|--------|-------|
| IDENTIFICATION | `secondary` (blue) |
| LEASE_AGREEMENTS | green |
| SIGNED_DOCUMENTS | amber |
| INSPECTION_REPORTS | purple |
| INSURANCE | teal |
| OTHER | `outline` (gray) |

#### DocumentRequestStatusBadge

| Status | Color |
|--------|-------|
| PENDING | `secondary` (blue) |
| UPLOADED | green |
| CANCELED | `outline` (gray) |

#### File Size Formatting

Create a utility function (or add to `apps/web/src/lib/utils.ts`):

```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

### Acceptance Criteria

- [ ] Documents page replaces the "Coming in Sprint 4" placeholder
- [ ] Folder overview grid shows folder icons, labels, and document counts
- [ ] Clicking a folder filters the document table
- [ ] Document table shows documents with folder, size, and date columns
- [ ] Search input filters documents by name
- [ ] Folder dropdown filters documents by folder
- [ ] Pagination works with offset/limit conversion
- [ ] Document detail page shows metadata and download button
- [ ] PDF and image preview works in-browser
- [ ] Document requests tab shows all requests with status
- [ ] "Create Request" form has tenant and type selectors
- [ ] All 4 request types (PROOF_OF_ADDRESS, PROOF_OF_IDENTITY, SIGNED_LEASE, MOVE_IN_CHECKLIST) are available
- [ ] Document request creation calls API and shows success toast
- [ ] Status badges render with correct colors
- [ ] Loading skeletons and empty states render correctly
- [ ] `next build` passes

### Test Cases

Manual verification:

1. **Landing page:** Navigate to `/documents` → see folder overview grid
2. **Folder counts:** Folders show correct document counts
3. **Filter by folder:** Click "Lease Agreements" folder → table shows only documents in that folder
4. **Search:** Type in search box → table filters by document name
5. **Document detail:** Click a document → see detail page with metadata
6. **Download:** Click download button → file downloads or opens in new tab
7. **PDF preview:** Open a PDF document detail → see preview in iframe
8. **Requests list:** Click "Document Requests" tab → see request table
9. **Create request:** Click "Create Request" → select tenant + type → submit → see new request in list
10. **Request types:** All 4 request types appear in the dropdown
11. **Empty states:** No documents / no requests → appropriate empty messages

---

## Task 4: Tenant Detail Page — Documents Section (Web Agent)

### Objective

Add a documents section to the tenant detail page so managers can view a specific tenant's documents and create document requests directly from the tenant context.

### Dependencies

- Task 2 (document hooks)
- Task 3 (document components — folder badge, status badge)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/tenants/[id]/page.tsx` | Modify | Add Documents tab/section |

### Requirements

The tenant detail page currently has placeholder sections. Add a "Documents" section (as a tab or card section below existing content):

**Documents Section:**
- Show document requests created for this tenant (use `useDocumentRequests({ tenantId })` — verify the API supports filtering by tenantId, or filter client-side)
- Table: Request Type, Status, Created Date
- "Create Request" button that pre-selects this tenant in the request form (navigate to `/documents/requests/new?tenantId=<id>` or open a dialog with tenant pre-filled)
- If the `GET /documents` endpoint can be filtered by `tenantId` for managers, also show the tenant's uploaded documents in a separate sub-section

**Note:** If the document API doesn't support manager-querying-by-tenantId, this section only shows document requests (which the manager created for this tenant) and their status (PENDING/UPLOADED/CANCELED). The actual documents are accessible when the request status is UPLOADED — link to the uploaded document.

### Acceptance Criteria

- [ ] Tenant detail page has a "Documents" section
- [ ] Section shows document requests for the tenant
- [ ] "Create Request" button pre-selects the tenant
- [ ] Request status badges render correctly
- [ ] Uploaded documents are accessible via links
- [ ] No regressions in existing tenant detail functionality
- [ ] `next build` passes

---

## Task 5: Mobile Lease Detail Screen (Mobile Agent)

### Objective

Now that `GET /leases/tenant` exists (Task 1), ensure the mobile home screen's lease/property card works reliably and add a lease detail screen accessible by tapping the lease card.

### Dependencies

- Task 1 (tenant lease endpoint must exist)
- Kubb codegen must be run after Task 1

### Pre-requisite Step

After Task 1 is complete:
```bash
cd apps/mobile && npx kubb generate
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/mobile/app/(main)/home/lease-detail.tsx` | Create | Lease detail screen |
| `apps/mobile/src/hooks/useLeases/index.tsx` | Create | Custom hook wrapping generated lease hooks |
| `apps/mobile/app/(main)/home/index.tsx` | Modify | Make lease card tappable, link to lease detail |

### Requirements

#### Lease Hook — `useLeases`

Create `apps/mobile/src/hooks/useLeases/index.tsx`:

- `useMyActiveLease()` — calls `GET /leases/tenant?status=ACTIVE`, returns the first (and only, per business rules) active lease. Query key: `['leases', 'tenant', 'active']`.
- `useMyLeases()` — calls `GET /leases/tenant`, returns all tenant leases. Query key: `['leases', 'tenant']`.

Check if the home screen currently fetches lease data through a different mechanism (e.g., the payments hook or a hardcoded approach). If so, migrate to use the new hook for consistency.

#### Lease Detail Screen

**`apps/mobile/app/(main)/home/lease-detail.tsx`**

Accessible by tapping the lease/property card on the home screen.

Content:
- Header with back button: "Lease Details"
- Property section: address, property type, city/state
- Lease section: start date, end date, monthly rent, security deposit, status badge
- Renewal info: if `renewedFromLeaseId` exists, show "Renewed from previous lease"
- Document section: placeholder or link to documents — "View your lease documents" → navigates to documents screen filtered by LEASE_AGREEMENTS folder

Follow the existing maintenance detail screen (`apps/mobile/app/(main)/maintenance/[id].tsx`) pattern for layout and styling.

#### Home Screen Update

Make the "Your Property" card on the home screen tappable. When tapped, navigate to the lease detail screen. Use `router.push('/home/lease-detail')` or similar Expo Router navigation.

Pass the lease data via route params or rely on the hook fetching it independently on the detail screen.

### Acceptance Criteria

- [ ] `useMyActiveLease()` hook fetches tenant's active lease via `GET /leases/tenant?status=ACTIVE`
- [ ] Home screen lease/property card is tappable
- [ ] Tapping navigates to lease detail screen
- [ ] Lease detail shows all lease info (dates, rent, deposit, status)
- [ ] Property info (address, type) is displayed
- [ ] Back button returns to home screen
- [ ] No regressions in existing home screen functionality
- [ ] App runs without errors

### Test Cases

Manual verification:

1. **Lease card tap:** Tap the property/lease card on home → navigate to lease detail
2. **Lease info displayed:** See start date, end date, monthly rent, security deposit
3. **Property info:** See property address and type
4. **Status badge:** Active lease shows green "Active" badge
5. **Back navigation:** Tap back → return to home screen
6. **No lease state:** Tenant without lease → card shows "No active lease" (existing behavior), tapping does nothing or shows empty detail

---

## Implementation Order

```
Task 1 ──────────────────────────> Task 5
(API: tenant lease + doc fix)      (Mobile: lease detail)
[Backend]                          [Mobile Agent]
                                   (after Kubb regen)

Task 2 ──> Task 3 ──> Task 4
(Hooks)    (Pages)    (Tenant detail)
[Web]      [Web]      [Web]
```

**Parallel work:**
- **Task 1** (Backend) is independent — start immediately
- **Task 2** (Web) is independent of Task 1 — start in parallel (existing API endpoints)
- **Task 3** depends on Task 2 (needs hooks)
- **Task 4** depends on Task 3 (needs document components)
- **Task 5** depends on Task 1 (needs tenant lease endpoint) and Kubb regen

**Recommended execution:**
1. Start **Task 1** (Backend) and **Task 2** (Web) in parallel
2. When Task 2 completes, start **Task 3** (Web)
3. When Task 1 completes, run Kubb codegen, then start **Task 5** (Mobile)
4. When Task 3 completes, start **Task 4** (Web)

---

## Definition of Done

Sprint 7 is complete when:

1. `cd apps/api && npx tsc --noEmit` passes
2. `cd apps/api && npm run test` passes (existing tests still work)
3. `cd apps/api && npm run start:dev` starts without errors
4. Swagger UI shows `GET /leases/tenant` endpoint
5. `GET /document-requests?requestType=SIGNED_LEASE` returns 200 (not validation error)
6. `cd apps/web && npx next build` passes with no errors
7. `cd apps/web && npm run dev` starts without errors
8. `cd apps/mobile && npx expo start` runs without errors
9. Web document management works end-to-end:
   - Documents page shows folder overview with counts
   - Document table has working search and folder filters
   - Document detail page shows metadata and download
   - PDF/image preview works in-browser
   - Document requests tab lists all requests with status
   - "Create Request" form works with all 4 request types
10. Tenant detail page shows documents section with requests
11. Mobile lease detail screen accessible from home screen
12. No remaining placeholder pages on the web dashboard (all "Coming in Sprint X" pages replaced)
13. No regressions in existing functionality (properties, tenants, leases, maintenance, payments, dashboard, notifications)
