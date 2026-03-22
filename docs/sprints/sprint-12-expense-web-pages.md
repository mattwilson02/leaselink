# Sprint 12: Expense Management — Web Dashboard Pages

## Overview

This sprint builds the expense management UI on the web dashboard. The backend for expenses was completed in Sprint 11 — all API endpoints, Prisma models, use cases, and controllers are already in place and tested. This sprint is **frontend-only** (web dashboard).

**Goal:** Property managers can view, create, edit, and delete expenses, upload receipts, and see monthly expense summaries — all from the web dashboard.

**Scope:** Web dashboard only. No mobile work. No backend changes.

---

## What Exists (from Sprint 11)

| Layer | Status |
|-------|--------|
| **Prisma** | Expense model with relations to Property, Employee, MaintenanceRequest |
| **API Endpoints** | `POST /expenses`, `GET /expenses`, `GET /expenses/:id`, `PUT /expenses/:id`, `DELETE /expenses/:id`, `GET /expenses/summary`, `POST /expenses/:id/receipt`, `POST /expenses/:id/receipt/confirm` |
| **Shared** | `ExpenseCategory` enum, `createExpenseSchema`, `updateExpenseSchema`, `EXPENSE_CATEGORY_LABELS`, `ExpenseDto` |
| **Web** | No expense pages exist yet |

---

## Task 1: TanStack Query Hooks (Web Agent)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-expenses.ts` | All expense-related TanStack Query hooks |

### Requirements

Follow the pattern in `apps/web/src/hooks/use-payments.ts`:

```typescript
useExpenses(filters)      // GET /expenses with propertyId, category, dateFrom, dateTo, page, pageSize
useExpense(id)            // GET /expenses/:id
useExpenseSummary(startDate?, endDate?) // GET /expenses/summary
useCreateExpense()        // POST /expenses — invalidates ['expenses'] on success
useUpdateExpense(id)      // PUT /expenses/:id — invalidates ['expenses'] on success
useDeleteExpense()        // DELETE /expenses/:id — invalidates ['expenses'] on success
```

---

## Task 2: Expense List Page (Web Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/expenses/page.tsx` | Create | Expense list page |
| `apps/web/src/components/expenses/expense-category-badge.tsx` | Create | Category badge component |
| `apps/web/src/components/expenses/expense-summary-cards.tsx` | Create | Monthly summary cards |
| `apps/web/src/components/layout/app-sidebar.tsx` | Modify | Add "Expenses" nav item |

### Requirements

#### Sidebar Update

Add to `mainNavItems` in `apps/web/src/components/layout/app-sidebar.tsx`:
```typescript
{ title: "Expenses", href: "/expenses", icon: Receipt },  // lucide-react Receipt icon
```
Place after "Payments" and before "Documents".

#### Expense List Page

- Page header: "Expenses" title + "Add Expense" button
- **Summary cards at top:** total expenses this month, by-property breakdown (from `useExpenseSummary`). Show total amount formatted as currency and count.
- Filter bar: property dropdown, category dropdown (from `EXPENSE_CATEGORY_LABELS`), date range picker
- Table columns: Date, Property, Category, Amount, Description, Receipt (icon), Actions (View/Edit/Delete)
- Pagination
- Empty state: "No expenses recorded yet."

#### ExpenseCategoryBadge

| Category | Color |
|----------|-------|
| MAINTENANCE | amber |
| INSURANCE | blue |
| TAX | purple |
| UTILITY | teal |
| MANAGEMENT_FEE | outline |
| REPAIR | red |
| IMPROVEMENT | green |
| OTHER | outline (gray) |

---

## Task 3: Create/Edit Expense Pages (Web Agent)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/app/(dashboard)/expenses/new/page.tsx` | Create expense page |
| `apps/web/src/app/(dashboard)/expenses/[id]/edit/page.tsx` | Edit expense page |
| `apps/web/src/components/expenses/expense-form.tsx` | Shared form component |

### Requirements

Shared `ExpenseForm` component used by both create and edit pages:
- Property selector: dropdown of manager's properties (use existing `useProperties` hook)
- Category: select from `EXPENSE_CATEGORY_LABELS`
- Amount: number input with $ prefix
- Description: textarea
- Expense Date: date picker
- Maintenance Request (optional): dropdown of maintenance requests for selected property (appears after property is selected)
- Validates with `createExpenseSchema` / `updateExpenseSchema` from `@leaselink/shared`
- Uses `react-hook-form` + `zodResolver` (same pattern as other forms in the codebase)

---

## Task 4: Expense Detail Page + Receipt Upload (Web Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/expenses/[id]/page.tsx` | Create | Expense detail page |
| `apps/web/src/components/expenses/receipt-upload.tsx` | Create | Receipt upload component |
| `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` | Modify | Add expenses section |

### Requirements

#### Expense Detail Page

- Header: description, category badge, amount (large)
- Info card: property (link), date, category, amount, description
- Maintenance request link (if linked)
- Receipt section: if receipt exists, show image/PDF preview with download. If none, show "Upload Receipt" button.

#### Receipt Upload Component

Follow the existing blob upload pattern (same as document/maintenance photo uploads):
1. File picker (accept `image/*,application/pdf`)
2. `POST /expenses/:id/receipt` to get upload URL
3. Upload to blob storage
4. `POST /expenses/:id/receipt/confirm`
5. Refetch expense data

#### Property Detail — Expenses Section

Add an "Expenses" section to `apps/web/src/app/(dashboard)/properties/[id]/page.tsx`:
- Show 5 most recent expenses for this property
- Each: date, category badge, amount, description (truncated)
- "View all" link to `/expenses?propertyId=<id>`

---

## Implementation Order

```
Task 1 → Task 2 → Task 3 → Task 4
(Hooks)   (List)   (Forms)  (Detail)
```

All tasks are sequential — each builds on the previous.

---

## Human Action Items

**NONE** — pure frontend work. No env vars, no migrations, no new dependencies beyond what's already installed.

---

## Definition of Done

1. `cd apps/web && npx next build` passes
2. "Expenses" appears in sidebar
3. Full CRUD works: list → create → view → edit → delete
4. Receipt upload works end-to-end
5. Property detail page shows recent expenses
6. Summary cards show monthly totals
