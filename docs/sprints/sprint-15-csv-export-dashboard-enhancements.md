# Sprint 15: CSV Export & Dashboard Enhancements

## Overview

This sprint adds CSV export capability for property managers and upgrades the property/tenant detail pages to use a tabbed layout. It also fixes the last remaining data integrity bug from the codebase audit (DAT-1).

**Goal:** Managers can export payment history, expense reports, and tenant lists as CSV files. Detail pages surface more information through a tabbed interface. The notification presenter bug is resolved.

**Scope:** Backend (export endpoints), Web dashboard (export buttons, tabbed detail pages, presenter fix). No mobile work.

---

## What Exists

| Layer | Status |
|-------|--------|
| **API — Payments** | `GET /payments` returns paginated payments with filters (status, tenantId, leaseId, propertyId) |
| **API — Expenses** | `GET /expenses` returns paginated expenses with filters (propertyId, category, dateFrom, dateTo) |
| **API — Tenants** | `GET /clients` returns paginated tenants with filters (status, search) |
| **Web — Payments** | List page with status filter, summary cards, table. No export. |
| **Web — Expenses** | List page with property/category/date filters, summary cards, table. No export. |
| **Web — Tenants** | List page with search/status filter, table. No export. |
| **Web — Property Detail** | Card layout with property info, photos, status, tenant, lease, maintenance (5), expenses (5). No tabs. |
| **Web — Tenant Detail** | Card layout with profile, notification prefs, status, lease, documents. No tabs. |
| **Web — Tabs Component** | `apps/web/src/components/ui/tabs.tsx` exists — uses `@base-ui/react/tabs`, exports `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| **Web — Hooks** | `use-payments.ts`, `use-expenses.ts`, `use-tenants.ts`, `use-maintenance-requests.ts`, `use-documents.ts`, `use-leases.ts` all exist |
| **API — Notification Presenter** | `http-notifications-presenter.ts` has DAT-1 bug — maps `linkedTransactionId` to `linkedMaintenanceRequestId` |

---

## Architectural Decisions

1. **CSV generation on the backend** — Export endpoints return `text/csv` with `Content-Disposition: attachment` headers. The backend streams CSV data directly — no JSON intermediate. This keeps the web client simple (just trigger a download) and handles large datasets without frontend memory issues.

2. **Export endpoints reuse existing query logic** — Each export use case delegates to the existing repository `findMany` methods with the same filters as the list endpoints, but without pagination (fetch all matching records). No new repository methods needed.

3. **One export endpoint per resource** — `GET /payments/export`, `GET /expenses/export`, `GET /tenants/export`. Each returns CSV with columns matching the table columns on the corresponding web list page. All require `EmployeeOnlyGuard`.

4. **Detail pages use existing Tabs component** — Refactor the property and tenant detail pages to organize content into tabs using the existing `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` components. The "Overview" tab contains the current card layout. Additional tabs surface related data that was previously truncated or hidden.

5. **DAT-1 is a one-line fix** — The notification presenter maps the wrong entity field. Fix it in-place.

---

## Task 1: CSV Export Endpoints (Backend Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/http/controllers/export-payments-csv/export-payments-csv.controller.ts` | Create | CSV export endpoint for payments |
| `apps/api/src/infra/http/controllers/export-expenses-csv/export-expenses-csv.controller.ts` | Create | CSV export endpoint for expenses |
| `apps/api/src/infra/http/controllers/export-tenants-csv/export-tenants-csv.controller.ts` | Create | CSV export endpoint for tenants |
| `apps/api/src/infra/http/presenters/http-notifications-presenter.ts` | Modify | Fix DAT-1 bug |

### Requirements

#### Export Endpoints

All three endpoints follow the same pattern:

- Route: `GET /<resource>/export`
- Guard: `EmployeeOnlyGuard` (managers only)
- Accept the same query parameters as the corresponding list endpoint (for filtering), but ignore `page`/`pageSize`
- Set response headers: `Content-Type: text/csv` and `Content-Disposition: attachment; filename="<resource>-export-<YYYY-MM-DD>.csv"`
- Return CSV string with header row + data rows

#### Payment CSV Columns

| Column | Source |
|--------|--------|
| Tenant Name | Resolve from tenantId |
| Property Address | Resolve from lease → property |
| Amount | `payment.amount` |
| Due Date | `payment.dueDate` formatted as YYYY-MM-DD |
| Status | `payment.status` |
| Paid At | `payment.paidAt` formatted as YYYY-MM-DD or empty |

Query params: `status`, `propertyId`, `tenantId` (all optional)

#### Expense CSV Columns

| Column | Source |
|--------|--------|
| Date | `expense.date` formatted as YYYY-MM-DD |
| Property Address | Resolve from propertyId |
| Category | `expense.category` label from shared `EXPENSE_CATEGORY_LABELS` |
| Amount | `expense.amount` |
| Description | `expense.description` |
| Vendor | Resolve vendor name from vendorId, or empty |

Query params: `propertyId`, `category`, `dateFrom`, `dateTo` (all optional)

#### Tenant CSV Columns

| Column | Source |
|--------|--------|
| Name | `client.name` |
| Email | `client.email` |
| Phone | `client.phoneNumber` or empty |
| Status | `client.status` |
| Onboarding Status | `client.onboardingStatus` |
| Created At | `client.createdAt` formatted as YYYY-MM-DD |

Query params: `status`, `search` (all optional)

#### DAT-1 Fix

In `http-notifications-presenter.ts`, change the `linkedMaintenanceRequestId` mapping to use `notification.linkedMaintenanceRequestId` instead of `notification.linkedTransactionId`.

### API Response Contract

These endpoints return raw CSV text, not JSON:

```
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="payments-export-2026-03-21.csv"

Tenant Name,Property Address,Amount,Due Date,Status,Paid At
John Doe,123 Main St,1500.00,2026-03-01,PAID,2026-03-01
Jane Smith,456 Oak Ave,2000.00,2026-03-01,OVERDUE,
```

---

## Task 2: Export Buttons on Web List Pages (Web Agent)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/payments/page.tsx` | Modify | Add export button |
| `apps/web/src/app/(dashboard)/expenses/page.tsx` | Modify | Add export button |
| `apps/web/src/app/(dashboard)/tenants/page.tsx` | Modify | Add export button |

### Requirements

- Add a "Download CSV" button (with `Download` icon from lucide-react) next to existing action buttons in the page header of each list page
- The button triggers a direct download by navigating to the export endpoint URL with the current active filters as query params
- Use `window.open()` or an anchor tag with the full API URL — no need for TanStack Query since it's a file download, not JSON
- The button should be disabled with a loading state while the download is in progress (optional — simple implementation is fine)
- Include the auth token in the request (use the same auth header pattern as existing API calls)

#### Button Placement

- **Payments page**: Next to the existing "Generate Payments" and "Mark Overdue" buttons
- **Expenses page**: Next to the existing "Add Expense" button
- **Tenants page**: Next to the existing "Invite Tenant" button

---

## Task 3: Property Detail Page — Tabbed Layout (Web Agent)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` | Modify | Refactor to tabbed layout |

### Requirements

Refactor the property detail page to use the existing `Tabs` component. Keep the header (back button, address, status actions, edit, delete, audit trail link) above the tabs.

#### Tab Structure

| Tab | Content |
|-----|---------|
| **Overview** | Property details card + photo gallery + status card (the current main content, reorganized) |
| **Tenant & Lease** | Current tenant card + active lease card. If no active tenant/lease, show empty state. |
| **Maintenance** | Full paginated table of maintenance requests for this property (not limited to 5). Use `useMaintenanceRequests` hook with `propertyId` filter. Columns: Title, Category, Status, Created, Priority. |
| **Expenses** | Full paginated table of expenses for this property (not limited to 5). Use `useExpenses` hook with `propertyId` filter. Columns: Date, Category, Amount, Description. |
| **Documents** | List of documents associated with tenants of this property. Use `useDocuments` hook. Columns: Name, Folder, Uploaded, Actions (view/download). |

#### Business Rules

- Default to "Overview" tab
- Tab state should be preserved in URL search params (e.g., `?tab=maintenance`) so links can deep-link to a specific tab
- The truncated "View all maintenance" / "View all expenses" links from the current layout are no longer needed — the tabs replace them

---

## Task 4: Tenant Detail Page — Tabbed Layout (Web Agent)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/tenants/[id]/page.tsx` | Modify | Refactor to tabbed layout |

### Requirements

Refactor the tenant detail page to use the existing `Tabs` component. Keep the header (back button, tenant name, status badge) above the tabs.

#### Tab Structure

| Tab | Content |
|-----|---------|
| **Overview** | Profile info card + notification preferences card + status card (current main content) |
| **Lease** | Active lease card (current). If no active lease, show empty state with message. |
| **Payments** | Paginated table of all payments for this tenant. Use `usePayments` hook with `tenantId` filter. Columns: Amount, Due Date, Status, Paid At. |
| **Documents** | Document request table (current) + list of uploaded documents. Use existing `useDocumentRequests` and `useDocuments` hooks. |
| **Maintenance** | Paginated table of maintenance requests by this tenant. Use `useMaintenanceRequests` hook with `tenantId` filter. Columns: Title, Property, Category, Status, Created. |

#### Business Rules

- Default to "Overview" tab
- Tab state preserved in URL search params (e.g., `?tab=payments`)

---

## Business Rules

1. CSV export is manager-only — all export endpoints require `EmployeeOnlyGuard`
2. CSV exports respect the same filters as list pages — managers export what they see
3. CSV filenames include the current date for easy identification
4. CSV values containing commas or quotes must be properly escaped (wrap in double quotes, escape internal quotes)
5. Empty/null fields render as empty string in CSV, not "null" or "undefined"
6. Detail page tabs default to "Overview" — the experience is unchanged for managers who don't use tabs

---

## Test Requirements

1. **Backend**: Each export controller should have a test verifying:
   - Returns `text/csv` content type
   - Returns correct CSV headers (column names)
   - Respects filters (e.g., status filter only includes matching payments)
   - Requires `EmployeeOnlyGuard` (returns 403 for CLIENT users)
2. **Web**: `npx next build` passes with no errors
3. **DAT-1**: Verify notification presenter maps `linkedMaintenanceRequestId` correctly

---

## Implementation Order

```
Task 1 (Backend: CSV endpoints + DAT-1 fix)
  ↓
Task 2 (Web: Export buttons — depends on Task 1 endpoints)
  ↓
Task 3 (Web: Property detail tabs — independent, can parallel with Task 2)
  ↓
Task 4 (Web: Tenant detail tabs — independent, can parallel with Task 3)
```

Tasks 3 and 4 are independent of Tasks 1 and 2. They can be worked in parallel.

---

## Human Action Items

**NONE** — no env vars, no migrations, no infrastructure changes. CSV export uses existing data and existing auth. Detail page tabs use existing components and hooks.

---

## Definition of Done

1. `cd apps/api && npx nest build` passes
2. `cd apps/web && npx next build` passes
3. `GET /payments/export` returns valid CSV with correct columns (manager auth required)
4. `GET /expenses/export` returns valid CSV with correct columns (manager auth required)
5. `GET /tenants/export` returns valid CSV with correct columns (manager auth required)
6. Export buttons visible on payments, expenses, and tenants list pages
7. Property detail page uses tabbed layout with Overview, Tenant & Lease, Maintenance, Expenses, Documents tabs
8. Tenant detail page uses tabbed layout with Overview, Lease, Payments, Documents, Maintenance tabs
9. DAT-1 fixed — notification `linkedMaintenanceRequestId` maps correctly
10. All export endpoints return 403 for non-employee users
