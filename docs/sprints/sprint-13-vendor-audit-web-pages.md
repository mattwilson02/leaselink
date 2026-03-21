# Sprint 13: Vendor Management & Audit Log Viewer — Web Dashboard Pages

## Overview

This sprint builds the vendor management pages and audit log viewer on the web dashboard. The backend for vendors and audit logs was completed in Sprint 11. This sprint is **frontend-only** (web dashboard).

**Goal:** Property managers can manage a vendor/contractor directory, assign vendors to maintenance requests, and view an immutable audit trail of all significant actions.

**Scope:** Web dashboard only. No mobile work. No backend changes.

---

## What Exists (from Sprint 11)

| Layer | Status |
|-------|--------|
| **Prisma** | Vendor model, AuditLog model, MaintenanceRequest has optional vendorId |
| **API — Vendors** | `POST /vendors`, `GET /vendors`, `GET /vendors/:id`, `PUT /vendors/:id`, `DELETE /vendors/:id` |
| **API — Audit** | `GET /audit-logs`, `GET /audit-logs/resource/:resourceType/:resourceId` |
| **API — Maintenance** | `PATCH /maintenance-requests/:id/status` accepts optional `vendorId` |
| **Shared** | `MaintenanceCategory` enum (used as vendor specialty), `AuditAction`, `AuditResourceType` enums, `AUDIT_ACTION_LABELS`, `AUDIT_RESOURCE_TYPE_LABELS`, `MAINTENANCE_CATEGORY_LABELS`, Zod schemas |

---

## Task 1: TanStack Query Hooks (Web Agent)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-vendors.ts` | Vendor CRUD hooks |
| `apps/web/src/hooks/use-audit-logs.ts` | Audit log query hooks |

### Requirements

**use-vendors.ts** — follow `use-payments.ts` pattern:
```typescript
useVendors(filters?)      // GET /vendors with specialty filter
useVendor(id)             // GET /vendors/:id
useCreateVendor()         // POST /vendors — invalidates ['vendors']
useUpdateVendor(id)       // PUT /vendors/:id — invalidates ['vendors']
useDeleteVendor()         // DELETE /vendors/:id — invalidates ['vendors']
```

**use-audit-logs.ts:**
```typescript
useAuditLogs(filters?)           // GET /audit-logs with resourceType, action, actorId, dateFrom, dateTo, page, pageSize
useAuditLogsByResource(type, id) // GET /audit-logs/resource/:resourceType/:resourceId
```

---

## Task 2: Vendor Pages (Web Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/vendors/page.tsx` | Create | Vendor list |
| `apps/web/src/app/(dashboard)/vendors/new/page.tsx` | Create | Create vendor |
| `apps/web/src/app/(dashboard)/vendors/[id]/page.tsx` | Create | Vendor detail |
| `apps/web/src/app/(dashboard)/vendors/[id]/edit/page.tsx` | Create | Edit vendor |
| `apps/web/src/components/vendors/vendor-form.tsx` | Create | Shared form |
| `apps/web/src/components/vendors/vendor-specialty-badge.tsx` | Create | Specialty badge |
| `apps/web/src/components/layout/app-sidebar.tsx` | Modify | Add "Vendors" nav item |

### Requirements

#### Sidebar Update

Add "Vendors" to `mainNavItems` after "Documents":
```typescript
{ title: "Vendors", href: "/vendors", icon: HardHat },  // or Users2 from lucide
```

#### Vendor List Page

- Page header: "Vendors" title + "Add Vendor" button
- Filter: specialty dropdown (from `MAINTENANCE_CATEGORY_LABELS`), search input
- Table: Name, Specialty, Phone, Email, Actions
- Specialty column: badge using `MAINTENANCE_CATEGORY_LABELS` with color coding

#### Vendor Form

- Name (text, required)
- Specialty (select from `MaintenanceCategory` enum, required)
- Phone (text, optional)
- Email (text, optional, validated)
- Notes (textarea, optional)
- Validates with shared Zod schemas

#### Vendor Detail Page

- Info card: name, specialty badge, phone, email, notes
- Assigned maintenance requests section: list of open/in-progress requests assigned to this vendor

#### Delete

Show warning if vendor has open requests (API returns 409 — display the error message).

---

## Task 3: Maintenance Detail — Vendor Integration (Web Agent)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/maintenance/[id]/page.tsx` | Modify | Show vendor info + vendor selector |

### Requirements

- If `vendorId` is set on the maintenance request, show vendor info card (name, specialty, phone, email)
- Add "Assign Vendor" dropdown/dialog allowing manager to select a vendor (filtered by matching specialty to request category) or clear the assignment
- On assignment: call `PATCH /maintenance-requests/:id/status` with `{ vendorId }`

---

## Task 4: Audit Log Viewer (Web Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/settings/audit-log/page.tsx` | Create | Audit log viewer page |
| `apps/web/src/components/audit/audit-log-table.tsx` | Create | Audit log table |
| `apps/web/src/components/audit/audit-action-badge.tsx` | Create | Action badge (CREATE=green, UPDATE=blue, DELETE=red, STATUS_CHANGE=amber) |
| `apps/web/src/components/audit/audit-resource-badge.tsx` | Create | Resource type badge |
| `apps/web/src/components/layout/app-sidebar.tsx` | Modify | Add "Audit Log" to bottom nav |

### Requirements

#### Sidebar Update

Add "Audit Log" to `bottomNavItems`:
```typescript
{ title: "Audit Log", href: "/settings/audit-log", icon: ScrollText },
```

#### Audit Log Page

- Page header: "Audit Log"
- Filter bar: resource type dropdown (`AUDIT_RESOURCE_TYPE_LABELS`), action dropdown (`AUDIT_ACTION_LABELS`), date range picker
- Table columns: Timestamp, Actor, Action, Resource Type, Resource ID, Details
  - Timestamp: formatted date/time
  - Actor: actor ID (future: resolve to name)
  - Action: `AuditActionBadge` color-coded
  - Resource Type: `AuditResourceBadge`
  - Resource ID: clickable link to resource detail page (construct URL from resourceType + resourceId)
  - Details: expandable row showing metadata JSON
- Pagination
- Empty state: "No audit logs yet."

#### "View Audit Trail" Links

Add a small "Audit Trail" text link to these existing detail pages:
- `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` → `/settings/audit-log?resourceType=PROPERTY&resourceId=<id>`
- `apps/web/src/app/(dashboard)/leases/[id]/page.tsx` → `/settings/audit-log?resourceType=LEASE&resourceId=<id>`
- `apps/web/src/app/(dashboard)/maintenance/[id]/page.tsx` → `/settings/audit-log?resourceType=MAINTENANCE_REQUEST&resourceId=<id>`

---

## Implementation Order

```
Task 1 → Task 2 → Task 3 → Task 4
(Hooks)   (Vendors) (Maint)  (Audit)
```

---

## Human Action Items

**NONE** — pure frontend work. No env vars, no migrations, no infrastructure changes.

---

## Definition of Done

1. `cd apps/web && npx next build` passes
2. "Vendors" appears in sidebar
3. Vendor CRUD works end-to-end
4. Vendor assignment works from maintenance detail page
5. "Audit Log" appears in sidebar bottom nav
6. Audit log viewer shows filterable, paginated entries with badges
7. "View Audit Trail" links work on property/lease/maintenance detail pages
