# Sprint 6: Dashboard & Notifications

## Overview

This sprint brings the web dashboard to life and wires up the manager notification system. The web dashboard home page is currently a placeholder with hardcoded "—" values, and the notification bell in the top nav does nothing. Meanwhile, all the data exists — properties, tenants, leases, maintenance requests, and payments are all fully operational from Sprints 2–5. This sprint surfaces that data into a meaningful manager dashboard and connects the notification infrastructure that already exists on the API side.

**Goal:** The web dashboard home page shows real portfolio metrics (property counts, revenue summary, upcoming lease expirations, open maintenance, pending actions). The notification bell in the top nav shows unread count, opens a dropdown with recent notifications, and supports mark-as-read. The mobile home screen is enhanced with a lease/property summary card. The settings profile page gets a basic working implementation.

**Why this sprint:** All core CRUD features are complete. The dashboard and notifications are the glue that makes the app feel like a real product — managers need an at-a-glance view of their portfolio, and both surfaces need working notification delivery. This is also low-risk: no new domain entities, no complex business rules — just aggregation, presentation, and wiring up existing API endpoints.

---

## What Exists (from Sprints 1–5)

| Layer | What's Done |
|-------|-------------|
| **API — Properties** | Full CRUD, `GET /properties` returns paginated list with status filter. No summary/count endpoint. |
| **API — Tenants** | `GET /tenants` with status filter. No summary/count endpoint. |
| **API — Leases** | `GET /leases` with status filter. No expiry-based query. |
| **API — Maintenance** | `GET /maintenance-requests` with status/priority filter. No count-by-priority endpoint. |
| **API — Payments** | `GET /payments` with status filter. No revenue aggregation endpoint. |
| **API — Notifications** | `GET /notifications` (paginated), `GET /notifications/unread` (boolean check), `PATCH /notifications/:id` (update), `PATCH /notifications/read-all` (mark all read), `POST /notifications` (create). Full push notification support via Expo. |
| **API — Auth** | `GET /me` returns current user info. |
| **Web — Dashboard Home** | Placeholder: 4 stat cards with "--" values, no data fetching. |
| **Web — Top Nav** | Bell icon present but does nothing (no dropdown, no unread count, no API calls). User menu works (sign out). |
| **Web — Settings** | Placeholder "Coming later" page. |
| **Web — Hooks** | `use-properties`, `use-tenants`, `use-leases`, `use-maintenance-requests`, `use-payments` — all with list/filter hooks. No notification hooks. |
| **Mobile — Home** | Shows next payment card and quick links (Documents, Maintenance). No lease/property summary. |
| **Mobile — Notifications** | Full notification list with push support, mark-as-read, unread indicator in header. |

---

## Architectural Decisions

1. **New dashboard summary endpoint.** Create a single `GET /dashboard/summary` endpoint that returns all aggregated metrics in one response. This avoids the web client making 5+ parallel API calls on page load. The endpoint queries each repository for counts/sums and returns a flat summary object. This lives in the API's `infra/http/controllers/` layer (not a domain use case — it's a read-only aggregation across domains).

2. **Notification hooks follow the existing TanStack Query pattern.** Create `apps/web/src/hooks/use-notifications.ts` following the `use-payments.ts` pattern. The API endpoints already exist — the web just needs hooks and UI.

3. **Notification dropdown uses shadcn Popover** (not a separate page). The bell icon in the top nav opens a Popover/Dropdown showing the 10 most recent notifications with mark-as-read actions. A "View all" link could navigate to a dedicated page, but for Sprint 6, the dropdown is sufficient.

4. **Dashboard summary is not cached aggressively.** Set `staleTime: 30_000` (30 seconds) for the summary query — managers expect near-real-time data on the dashboard.

5. **Mobile home enhancement is additive.** Add a lease/property card above the existing payment card. Don't restructure the existing home screen — just add the missing information. Use the existing `GET /leases/tenant` endpoint (already used by the payments flow) to get lease details, then fetch property info.

6. **Settings profile page uses the existing `GET /me` endpoint** for loading current user data. For updating, check if `PATCH /me` or similar exists — if not, use the existing password change endpoints. Sprint 6 settings is intentionally minimal: view profile info and change password. 2FA setup is a stretch goal.

7. **No new Prisma models or migrations.** This sprint is purely API aggregation endpoints + frontend work.

---

## Task 1: Dashboard Summary Endpoint (Backend Agent)

### Objective

Create a single API endpoint that returns all the metrics the web dashboard home page needs: property counts by status, tenant count, lease counts (active, expiring soon), maintenance request counts by status/priority, and payment revenue summary for the current month.

### Dependencies

- None (reads from existing repositories)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/http/controllers/get-dashboard-summary/get-dashboard-summary.controller.ts` | Create | GET /dashboard/summary |
| `apps/api/src/infra/http/DTOs/dashboard/dashboard-summary-response-dto.ts` | Create | Swagger response DTO |
| `apps/api/src/infra/http/http.module.ts` | Modify | Register controller |

### Requirements

#### GET /dashboard/summary

- `@ApiTags('Dashboard')`
- `@UseGuards(EmployeeOnlyGuard)` — manager only
- Returns aggregated portfolio data for the authenticated manager

This controller directly queries the existing repositories (inject `PrismaService` directly — this is a read-only aggregation, not a domain use case). Alternatively, inject the abstract repositories if the pattern requires it — but since this crosses multiple domains, direct Prisma queries are simpler and more efficient (can do aggregations in SQL).

#### Response Shape

```typescript
interface DashboardSummaryResponse {
  properties: {
    total: number
    vacant: number
    listed: number
    occupied: number
    maintenance: number
  }
  tenants: {
    total: number
    active: number
    invited: number
  }
  leases: {
    active: number
    pending: number
    expiringWithin30Days: number
    expiringWithin60Days: number
  }
  maintenance: {
    open: number
    inProgress: number
    resolved: number
    emergencyOpen: number
  }
  payments: {
    expectedThisMonth: number    // sum of amounts for current month (all statuses)
    collectedThisMonth: number   // sum of PAID amounts for current month
    overdueTotal: number         // sum of OVERDUE amounts (all time, still outstanding)
    overdueCount: number         // count of OVERDUE payments
    pendingCount: number         // count of PENDING payments
  }
  upcomingLeaseExpirations: Array<{
    id: string
    propertyAddress: string
    tenantName: string
    endDate: string
    daysUntilExpiry: number
  }>  // leases expiring within 60 days, max 10, ordered by endDate asc
  recentActivity: Array<{
    id: string
    type: 'MAINTENANCE_REQUEST' | 'PAYMENT' | 'LEASE_ACTIVATION' | 'DOCUMENT_UPLOAD'
    title: string
    timestamp: string
  }>  // last 10 events, ordered by timestamp desc
}
```

#### Query Strategy

All queries are scoped to the manager's properties (via `property.managerId = currentUser.id`):

- **Properties:** `prisma.property.groupBy({ by: ['status'], _count: true, where: { managerId } })`
- **Tenants:** Count clients that have leases on the manager's properties. Use: `prisma.client.count({ where: { leases: { some: { property: { managerId } } } } })` with status filter variants.
- **Leases:** `prisma.lease.count({ where: { property: { managerId }, status: 'ACTIVE' } })` and similar. For expiring leases: `where: { status: 'ACTIVE', endDate: { lte: addDays(now, 60) } }`.
- **Maintenance:** `prisma.maintenanceRequest.groupBy({ by: ['status'], _count: true, where: { property: { managerId } } })`. Emergency count: `where: { status: 'OPEN', priority: 'EMERGENCY', property: { managerId } }`.
- **Payments:** `prisma.payment.aggregate({ _sum: { amount: true }, where: { lease: { property: { managerId } }, dueDate: { gte: startOfMonth, lte: endOfMonth } } })` with status variants.
- **Upcoming expirations:** `prisma.lease.findMany({ where: { status: 'ACTIVE', endDate: { lte: addDays(now, 60), gte: now }, property: { managerId } }, include: { property: true, tenant: true }, orderBy: { endDate: 'asc' }, take: 10 })`
- **Recent activity:** Query notifications for the manager, or query recent maintenance requests + payments across properties. Simplest approach: use `prisma.notification.findMany({ where: { personId: managerId }, orderBy: { createdAt: 'desc' }, take: 10 })` and map to the activity format.

#### Performance Note

This makes ~10 queries in a single endpoint call. For Sprint 6, this is acceptable. Wrap them in `Promise.all` for parallelism. If performance becomes an issue later, consider materialized views or caching.

### Acceptance Criteria

- [ ] `GET /dashboard/summary` returns all fields in the response shape
- [ ] All counts are scoped to the authenticated manager's properties
- [ ] Property counts by status are accurate
- [ ] Tenant counts reflect tenants linked to the manager's properties
- [ ] Lease expiration list returns leases expiring within 60 days, ordered by nearest first
- [ ] Payment revenue sums are for the current calendar month
- [ ] Overdue counts reflect all currently-overdue payments (not just this month)
- [ ] Emergency maintenance count only includes OPEN + EMERGENCY requests
- [ ] Recent activity returns the 10 most recent events
- [ ] Endpoint requires `EmployeeOnlyGuard`
- [ ] Swagger DTO documents the response shape
- [ ] API starts without errors

### Test Cases

Verified via manual API testing and Swagger:

1. **Empty portfolio:** Manager with no properties → all counts are 0, empty arrays
2. **Property counts:** Create 2 VACANT and 1 OCCUPIED property → total: 3, vacant: 2, occupied: 1
3. **Lease expiration:** Active lease ending in 15 days → appears in `upcomingLeaseExpirations` with correct `daysUntilExpiry`
4. **Payment sums:** 2 payments this month ($2000 PAID, $1500 PENDING) → expectedThisMonth: 3500, collectedThisMonth: 2000
5. **Manager scoping:** Manager A's dashboard does not include Manager B's properties/data

---

## Task 2: Web Dashboard Home Page (Web Agent)

### Objective

Replace the placeholder dashboard home page with a data-driven layout showing portfolio metrics, upcoming lease expirations, open maintenance alerts, and recent activity.

### Dependencies

- Task 1 (dashboard summary endpoint)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/hooks/use-dashboard.ts` | Create | TanStack Query hook for dashboard summary |
| `apps/web/src/app/(dashboard)/page.tsx` | Rewrite | Data-driven dashboard home |
| `apps/web/src/components/dashboard/stat-card.tsx` | Create | Reusable stat card component |
| `apps/web/src/components/dashboard/revenue-summary.tsx` | Create | Payment revenue cards |
| `apps/web/src/components/dashboard/upcoming-expirations.tsx` | Create | Lease expiration table |
| `apps/web/src/components/dashboard/open-maintenance.tsx` | Create | Maintenance summary card |
| `apps/web/src/components/dashboard/recent-activity.tsx` | Create | Recent activity timeline |

### Requirements

#### Dashboard Hook — `use-dashboard.ts`

Follow the `use-payments.ts` pattern:

```typescript
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.get<DashboardSummaryResponse>('/dashboard/summary'),
    staleTime: 30_000,  // 30 seconds — dashboard should feel near-real-time
  })
}
```

Define the `DashboardSummaryResponse` type to match the API response. Import shared types where possible.

#### Dashboard Layout

The page should have these sections, matching the product spec Section 7.2:

**Row 1: Key Metrics (4 stat cards in a grid)**

| Card | Value | Subtitle | Icon |
|------|-------|----------|------|
| Total Properties | `properties.total` | `{occupied} occupied, {vacant} vacant` | `Building2` |
| Active Tenants | `tenants.active` | `{invited} pending invites` | `Users` |
| Active Leases | `leases.active` | `{pending} pending activation` | `FileText` |
| Open Requests | `maintenance.open + maintenance.inProgress` | `{emergencyOpen} emergency` (red text if > 0) | `Wrench` |

Each card should be clickable — navigates to the relevant list page (e.g., clicking Properties goes to `/properties`).

**Row 2: Revenue Overview (3 cards)**

| Card | Value | Subtitle |
|------|-------|----------|
| Expected This Month | `$X,XXX` (formatted currency) | Total rent due this month |
| Collected This Month | `$X,XXX` | Payments received |
| Overdue | `$X,XXX` (red text) | `{overdueCount} payments overdue` |

Use `DollarSign` or `CreditCard` icon. If overdue count > 0, the Overdue card should have a subtle red tint or destructive styling.

**Row 3: Two-column layout**

Left column (wider):
- **Upcoming Lease Expirations** — table showing leases expiring within 60 days. Columns: Property, Tenant, End Date, Days Left. Color-code Days Left: red if < 30 days, yellow/amber if < 60. Link property and tenant names to their detail pages. Show "No leases expiring soon" if empty. Max 10 rows.

Right column (narrower):
- **Open Maintenance** — summary card showing count by priority (Low, Medium, High, Emergency) with color-coded badges. Emergency count should be visually prominent (red). "View all" link to `/maintenance?status=OPEN`.

**Row 4: Recent Activity**

Timeline-style list of the 10 most recent events across the portfolio. Each entry shows: icon (based on type), title, relative timestamp ("2 hours ago"). Clicking an entry navigates to the relevant detail page.

#### Loading State

While the summary is loading, show Skeleton placeholders for each card (using shadcn's `Skeleton` component). Follow the existing skeleton patterns used in property/lease list pages.

#### Error State

If the summary fetch fails, show an error banner at the top with a retry button. The rest of the page can show empty/zero states.

### Acceptance Criteria

- [ ] Dashboard displays real data from `GET /dashboard/summary`
- [ ] 4 key metric cards show correct counts
- [ ] Revenue cards show formatted currency values
- [ ] Overdue card has red styling when overdue count > 0
- [ ] Upcoming expirations table shows leases expiring within 60 days
- [ ] Days-left column is color-coded (red < 30, yellow < 60)
- [ ] Open maintenance card shows counts by priority
- [ ] Emergency count is visually prominent
- [ ] Recent activity shows timestamped events
- [ ] Clicking stat cards navigates to relevant list pages
- [ ] Clicking lease/property/tenant names navigates to detail pages
- [ ] Loading skeletons display while data fetches
- [ ] Error state with retry button works
- [ ] `next build` passes

---

## Task 3: Web Notification System (Web Agent)

### Objective

Wire up the notification bell in the top nav bar: show unread count badge, open a dropdown with recent notifications, support mark-as-read, and provide a link to view all notifications.

### Dependencies

- None (API endpoints already exist)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/hooks/use-notifications.ts` | Create | TanStack Query hooks for notification API |
| `apps/web/src/components/layout/notification-dropdown.tsx` | Create | Notification bell + dropdown |
| `apps/web/src/components/layout/top-nav.tsx` | Modify | Replace static bell with NotificationDropdown |
| `apps/web/src/app/(dashboard)/notifications/page.tsx` | Create | Full notifications list page (optional, stretch) |

### Requirements

#### Notification Hooks — `use-notifications.ts`

Follow the `use-payments.ts` pattern:

- `useNotifications(params)` — `GET /notifications` with pagination. Query key: `['notifications', params]`
- `useHasUnreadNotifications()` — `GET /notifications/unread`. Returns boolean. Query key: `['notifications', 'unread']`. Set `refetchInterval: 30_000` (poll every 30 seconds for real-time feel).
- `useMarkNotificationRead(id)` — `PATCH /notifications/:id` with `{ isRead: true }`. Invalidate `['notifications']` on success.
- `useMarkAllNotificationsRead()` — `PATCH /notifications/read-all`. Invalidate `['notifications']` on success.

#### NotificationDropdown Component

Replace the static `<Button variant="ghost" size="icon">` bell in `top-nav.tsx` with a `NotificationDropdown` component.

The component:
1. **Bell icon with badge:** Shows a small red dot (or count badge) when `useHasUnreadNotifications()` returns true. Use a `relative` positioned div with an `absolute` positioned badge dot.
2. **Popover trigger:** Clicking the bell opens a shadcn `Popover` (not `DropdownMenu` — Popover allows richer content).
3. **Dropdown content:**
   - Header: "Notifications" title + "Mark all as read" button (text button, muted style)
   - List: 10 most recent notifications, each showing:
     - Unread indicator (small blue dot on the left for unread items)
     - Title (bold if unread)
     - Body text (truncated to 1 line)
     - Relative timestamp ("2h ago", "3d ago")
     - Click handler: marks as read + navigates to linked resource (if `linkedMaintenanceRequestId` → `/maintenance/:id`, if `linkedPaymentId` → `/payments/:id`, if `linkedDocumentId` → `/documents/:id`)
   - Empty state: "No notifications yet"
   - Footer: "View all notifications" link (navigates to `/notifications` if that page exists, otherwise omit)
4. **Auto-close:** Popover closes when clicking outside or navigating away.

#### Notification Item Rendering

Use `ACTION_TYPE_LABELS` from `@leaselink/shared` for context. Display different icons based on `actionType`:

| ActionType | Icon | Color |
|------------|------|-------|
| `MAINTENANCE_UPDATE` | `Wrench` | amber |
| `PAYMENT_RECEIVED` | `CreditCard` | green |
| `PAYMENT_OVERDUE` | `AlertTriangle` | red |
| `RENT_REMINDER` | `Clock` | blue |
| `UPLOAD_DOCUMENT` | `FileUp` | default |
| `LEASE_EXPIRY` | `Calendar` | amber |
| `LEASE_RENEWAL` | `RefreshCw` | blue |
| Other / `INFO` | `Bell` | default |

#### Top Nav Update

Replace the static bell button in `apps/web/src/components/layout/top-nav.tsx` (lines 31-33) with:
```tsx
<NotificationDropdown />
```

### Acceptance Criteria

- [ ] Bell icon shows red dot when unread notifications exist
- [ ] Clicking bell opens Popover with notification list
- [ ] Unread notifications have visual indicator (blue dot + bold title)
- [ ] Clicking a notification marks it as read and navigates to linked resource
- [ ] "Mark all as read" button works
- [ ] Notification list shows relative timestamps
- [ ] Different action types show different icons
- [ ] Empty state shown when no notifications
- [ ] Popover closes on outside click
- [ ] Unread status polls every 30 seconds
- [ ] `next build` passes

---

## Task 4: Settings Profile Page (Web Agent)

### Objective

Replace the placeholder settings page with a working profile view and password change form.

### Dependencies

- None (uses existing API endpoints)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/hooks/use-auth.ts` | Create | Hook for current user data |
| `apps/web/src/app/(dashboard)/settings/profile/page.tsx` | Rewrite | Working profile page |

### Requirements

#### Auth Hook — `use-auth.ts`

```typescript
export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get<{ user: { id: string; email: string; name: string; role: string } }>('/me'),
  })
}
```

Check the actual `GET /me` response shape by reading the controller at `apps/api/src/infra/http/controllers/me/auth.controller.ts`.

#### Profile Page

Two sections:

**1. Profile Information (read-only for Sprint 6)**
- Card showing: Name, Email, Role (Admin/Agent)
- These come from `GET /me`
- No edit functionality in Sprint 6 (would require new API endpoints)

**2. Change Password**
- Form with: Current Password, New Password, Confirm New Password
- Validate: new password minimum 8 characters, confirm matches new
- Submit to the existing password change endpoint (check what exists — likely `PATCH /tenants/password` or a similar endpoint for employees)
- Success: toast "Password changed successfully"
- Error: show error message (e.g., "Current password is incorrect")

If no employee password change endpoint exists, just show the profile information section and note "Password change coming soon" in the card. Do not create new API endpoints in this task.

### Acceptance Criteria

- [ ] Profile page shows current user's name, email, and role
- [ ] Data loads from `GET /me`
- [ ] Password change form validates inputs
- [ ] Successful password change shows toast
- [ ] Invalid current password shows error
- [ ] Loading states for both sections
- [ ] `next build` passes

---

## Task 5: Mobile Home Screen Enhancement (Mobile Agent)

### Objective

Add a lease/property summary card to the mobile home screen so tenants see their property address, lease dates, and lease status — not just payment information.

### Dependencies

- None (uses existing API endpoints)

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/mobile/app/(main)/home/index.tsx` | Modify | Add lease/property summary card |
| `apps/mobile/src/hooks/useLeases/index.tsx` | Create or modify | Hook for tenant's active lease |

### Requirements

#### Lease/Property Hook

The mobile app needs to fetch the tenant's active lease and its associated property. Check if a hook already exists for `GET /leases/tenant` — it may have been created during Sprint 5 for the payments flow.

If it doesn't exist, create `useMyActiveLease()` that calls `GET /leases/tenant` and returns the first ACTIVE lease. The lease response includes `propertyId` — use a second query to fetch property details if needed, or check if the lease response already includes property info.

**Important:** Check how the payments flow gets lease/property data on the mobile side. Follow the same pattern rather than inventing a new one. The home screen's existing `useNextPaymentDue()` hook may already fetch lease data internally.

#### Home Screen Changes

Add a **Lease & Property card** between the greeting section and the next payment card:

```
[Greeting]
[Lease & Property Card]  ← NEW
[Next Payment Card]      ← existing
[Quick Links]            ← existing
```

**Lease & Property Card content:**
- Property address (prominent, larger text)
- Property type badge (e.g., "Apartment")
- Lease status badge (using existing `LeaseStatusBadge` pattern from web — create a mobile version or use a simple colored text)
- Lease dates: "1 Mar 2026 — 1 Mar 2027" (formatted)
- Monthly rent: "£2,500/month"

**No active lease state:**
- Show "No active lease" with a muted message: "Contact your property manager for lease information"

Follow the existing card styling in the home screen (`styles.card` pattern with white background, rounded corners, border).

#### Kubb Regeneration

If new hooks are needed for lease/property data, check if the Kubb-generated hooks already cover the required endpoints. If not, run `npx kubb generate` first.

### Acceptance Criteria

- [ ] Home screen shows lease/property summary card
- [ ] Property address is prominently displayed
- [ ] Lease dates and monthly rent are shown
- [ ] Lease status is indicated (badge or colored text)
- [ ] "No active lease" state displays when tenant has no lease
- [ ] Card follows existing home screen styling patterns
- [ ] Existing payment card and quick links still work
- [ ] No regressions in home screen functionality
- [ ] App runs without errors

### Test Cases

Manual verification:

1. **Tenant with active lease:** Home screen shows property address, lease dates, rent, status
2. **Tenant without lease:** Home screen shows "No active lease" message
3. **Data accuracy:** Lease dates and rent match what's shown on manager's web dashboard
4. **Loading state:** Skeleton or loading indicator while data fetches
5. **Existing features:** Payment card and quick links still functional

---

## Implementation Order

```
Task 1 ──────────> Task 2
(Dashboard API)    (Dashboard Web)
[Backend]          [Web Agent]

Task 3 ────────────────────
(Notifications Web)
[Web Agent]

Task 4 ────────────────────
(Settings Web)
[Web Agent]

Task 5 ────────────────────
(Mobile Home)
[Mobile Agent]
```

**Parallel work:**
- **Task 1** must complete before **Task 2** (Task 2 needs the summary endpoint)
- **Task 3**, **Task 4**, and **Task 5** have no dependencies on other tasks — they can run in parallel with each other and with Tasks 1/2
- **Task 3** and **Task 4** are both web agent tasks but are independent — they can be done sequentially by the same agent or in parallel if multiple agents are available

**Recommended execution:**
1. Start **Task 1** (Backend), **Task 3** (Web), **Task 4** (Web), and **Task 5** (Mobile) in parallel
2. When Task 1 completes, start **Task 2** (Web)
3. Tasks 3, 4, 5 can complete independently

---

## Definition of Done

Sprint 6 is complete when:

1. `cd apps/api && npx tsc --noEmit` passes
2. `cd apps/api && npm run test` passes (existing tests still work)
3. `cd apps/api && npm run start:dev` starts without errors
4. Swagger UI shows `GET /dashboard/summary` endpoint
5. `cd apps/web && npx next build` passes with no errors
6. `cd apps/web && npm run dev` starts without errors
7. `cd apps/mobile && npx expo start` runs without errors
8. Dashboard home page shows real portfolio metrics:
   - Property counts by status
   - Active tenant and lease counts
   - Revenue summary (expected, collected, overdue)
   - Upcoming lease expirations
   - Open maintenance summary
   - Recent activity
9. Notification bell works:
   - Shows unread indicator when notifications exist
   - Opens dropdown with recent notifications
   - Clicking a notification marks it as read and navigates to linked resource
   - "Mark all as read" works
10. Settings profile page shows current user info
11. Mobile home screen shows lease/property summary
12. No regressions in existing functionality (properties, tenants, leases, maintenance, payments)
