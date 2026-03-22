# Future Improvements & Nice-to-Haves

Parking list for when LeaseLink development resumes. Grouped by priority.

---

## Security (Do First)

- [ ] **SEC-1 to SEC-5** — Fix all unguarded endpoints (see AUDIT_ISSUES.md). These are the highest priority items before any production deployment.
- [ ] Rate limiting on auth endpoints (login, OTP, password reset)
- [ ] CSRF protection for web app
- [ ] Input sanitization audit (XSS vectors in text fields rendered in notifications, maintenance descriptions)

## API Consistency

- [ ] Standardize mutation responses — POST/PUT endpoints still return `{ property: ... }`, `{ vendor: ... }` etc. Should be `{ data: ... }` to match GET endpoints
- [ ] Add OpenAPI response schemas for all endpoints (some have `type: 'object'` placeholders)
- [ ] Pagination: ensure all list endpoints support filtering and sorting consistently

## Mobile App

- [ ] Pull-to-refresh on all list screens
- [ ] Offline support / optimistic updates for maintenance requests
- [ ] Dark mode support (design system already has theme tokens)
- [ ] Tablet layout optimizations
- [ ] Push notification deep linking (currently shows notification but tap doesn't always navigate correctly for all types)
- [ ] Accessibility audit (screen reader labels, contrast ratios)
- [ ] Localize all hardcoded strings ("Sign Document", "Signed on", "Signature captured", etc.)
- [ ] Image picker for maintenance request photos (currently text-only)
- [ ] Payment history filtering by date range

## Web Dashboard

- [ ] Real-time updates (WebSocket or polling for notifications, payment status changes)
- [ ] Bulk operations (select multiple expenses, mark multiple maintenance requests)
- [ ] Dashboard charts (expense trends, payment collection rate, occupancy rate over time)
- [ ] Tenant communication (in-app messaging or email templates)
- [ ] Document template system (auto-generate lease agreements from template)
- [ ] Export to PDF for lease agreements, payment receipts
- [ ] Audit log filtering and export

## Backend / Business Logic

- [ ] **BIZ-4** — UTC date comparisons across all schedulers
- [ ] **BIZ-5** — Prevent double payment generation on renewal edge case
- [ ] **BIZ-6** — Stripe webhook error tracking table for retry
- [ ] Early termination fee logic (IMP-4)
- [ ] Lease duration validation (IMP-1) — configurable min/max
- [ ] Partial payment support
- [ ] Late fee calculation
- [ ] Multi-currency support
- [ ] Recurring expense tracking (monthly utilities, insurance premiums)
- [ ] Property inspection scheduling and reports
- [ ] Maintenance request SLA tracking (time to first response, time to resolution)
- [ ] Email notifications in addition to push (configurable per user)

## Infrastructure

- [ ] Structured logging (replace `console.error` with proper logger)
- [ ] Health check endpoint
- [ ] Database connection pooling configuration
- [ ] Blob storage cleanup (orphaned signature images, expired upload URLs)
- [ ] CI: add web and mobile type-check/lint to pipeline
- [ ] Staging environment with seed data
- [ ] Database backups configuration
- [ ] Monitoring/alerting (error rates, API latency)

## Testing

- [ ] Increase unit test coverage (especially use cases with complex business logic)
- [ ] E2E test suite for mobile (Maestro) — currently only login and onboarding flows
- [ ] E2E test suite for web (Playwright or Cypress)
- [ ] Load testing for API endpoints
- [ ] Contract tests between API and clients

## Developer Experience

- [ ] Root-level CLAUDE.md for monorepo-wide guidance
- [ ] Web app CLAUDE.md (currently missing)
- [ ] Storybook for web component library
- [ ] API changelog (auto-generated from PR descriptions)
- [ ] Seed data improvements — more realistic data covering all domains (leases, payments, maintenance, expenses, documents)
