# Sprint 9 — E2E Test Coverage

## Overview

This sprint adds E2E tests for all 32 controllers that currently lack them. No features — pure test coverage. This hardens the API before enterprise features are added in subsequent sprints.

## What Exists

- 56 unit test files covering all use cases (274 tests, all passing)
- E2E test infrastructure: `JwtFactory`, `createTestAppModule()`, `PrismaService`, pre-seeded test users
- Existing E2E tests in `get-document-requests/`, `upload-document/`, `confirm-upload-document/`, `download-document/`, `get-document-by-id/`, plus several others serve as templates
- Test user IDs in `test/utils/auth-user-id-e2e.ts`: `authUserEmployerIdE2E` (EMPLOYEE) and `authUserClientIdE2E` (CLIENT)

## Architectural Decisions

- Follow the EXACT pattern from existing E2E tests (see `get-document-requests.e2e-spec.ts` for the canonical template)
- Use `PrismaService` for test data setup/teardown — create records directly via Prisma, not through use cases
- Use `JwtFactory.makeJwt(isClient)` for auth tokens — `true` for CLIENT, `false` for EMPLOYEE
- Clean up test data in `afterEach()` to avoid cross-test contamination
- Each E2E test file lives alongside its controller: `controllers/<name>/<name>.e2e-spec.ts`
- For endpoints that need related data (e.g., payments need a lease which needs a property and tenant), create the full chain in `beforeAll()` or `beforeEach()`

## Tasks — Backend Agent

### Controllers Requiring E2E Tests (32 total)

Each controller needs a `.e2e-spec.ts` file with at minimum: one success case and one error/edge case.

#### Lease Management (6 controllers)
1. **create-lease** (`POST /leases`) — Test: create with valid data → 201, missing property → 404, property not available → 400, tenant has active lease → 400
2. **get-lease-by-id** (`GET /leases/:id`) — Test: found → 200 with `{ data }`, not found → 404
3. **get-lease-by-property** (`GET /properties/:propertyId/active-lease`) — Test: has active lease → 200, no lease → 200 with null
4. **get-leases** (`GET /leases`) — Test: returns paginated `{ data, meta }`, filter by status works
5. **get-leases-by-tenant** (`GET /leases/tenant`) — Test: CLIENT token returns own leases with `{ data, meta }`, EMPLOYEE rejected
6. **update-lease-status** (`PATCH /leases/:id/status`) — Test: PENDING→ACTIVE works, invalid transition → 400, future start date → 400
7. **renew-lease** (`POST /leases/:id/renew`) — Test: valid renewal → 201, lease not ACTIVE/EXPIRED → 400

#### Property Management (3 controllers)
8. **create-property** (`POST /properties`) — Test: valid data → 201, missing required fields → 400
9. **get-properties** (`GET /properties`) — Test: returns `{ data, meta }`, EMPLOYEE only
10. **get-property-by-id** (`GET /properties/:id`) — Test: found → 200 with `{ property }`, not found → 404
11. **delete-property** (`DELETE /properties/:id`) — Test: deleted → 200, has active lease → 400

#### Maintenance (6 controllers)
12. **create-maintenance-request** (`POST /maintenance-requests`) — Test: CLIENT creates → 201, no active lease → 403
13. **get-maintenance-request-by-id** (`GET /maintenance-requests/:id`) — Test: found → 200 with `{ maintenanceRequest }`
14. **get-maintenance-requests** (`GET /maintenance-requests`) — Test: EMPLOYEE returns `{ maintenanceRequests, totalCount }`
15. **get-maintenance-requests-by-property** (`GET /properties/:propertyId/maintenance-requests`) — Test: returns filtered list
16. **get-maintenance-requests-by-tenant** (`GET /maintenance-requests/tenant`) — Test: CLIENT returns own requests
17. **update-maintenance-request-status** (`PATCH /maintenance-requests/:id/status`) — Test: valid transition → 200, invalid → 400
18. **upload-maintenance-photos** (`POST /maintenance-requests/:id/photos`) — Test: returns upload URLs
19. **confirm-maintenance-photos** (`POST /maintenance-requests/:id/photos/confirm`) — Test: confirms blob keys

#### Payment (6 controllers)
20. **get-payments** (`GET /payments`) — Test: EMPLOYEE returns `{ payments, totalCount }`
21. **get-payments-by-tenant** (`GET /payments/tenant`) — Test: CLIENT returns own payments
22. **get-payment-by-id** (`GET /payments/:id`) — Test: found → 200 with `{ payment }`
23. **generate-payments** (`POST /payments/generate`) — Test: generates payments for lease, EMPLOYEE only
24. **mark-overdue-payments** (`POST /payments/mark-overdue`) — Test: marks past-due payments overdue
25. **checkout-redirect** (`POST /payments/:id/checkout`) — Test: creates Stripe session (may need mock)
26. **stripe-webhook** (`POST /payments/webhook`) — Test: skip or mock (requires Stripe signature)

#### Client/Tenant Management (4 controllers)
27. **get-client-by-id** (`GET /tenants/:id`) — Test: found → 200 with `{ data }`, not found → 404
28. **get-clients** (`GET /tenants`) — Test: EMPLOYEE returns `{ data, meta }`
29. **get-client-profile-photo** (`GET /tenants/:id/profile-photo`) — Test: CLIENT can only access own photo
30. **upload-client-profile-photo** (`POST /tenants/:id/profile-photo`) — Test: CLIENT can only upload own photo
31. **send-client-phone-otp** (`POST /tenants/phone-otp/send`) — Test: sends OTP (uses test email bypass)

#### Dashboard (1 controller)
32. **get-dashboard-summary** (`GET /dashboard/summary`) — Test: EMPLOYEE returns summary object with property/lease/payment/maintenance counts

### Test Data Setup Patterns

**For lease-related tests**, create the chain:
```
1. Find test employee ID via authUserEmployerIdE2E
2. Create a Property via prisma.property.create({ managerId: employeeId, ... })
3. Find test client ID via authUserClientIdE2E
4. Create a Lease via prisma.lease.create({ propertyId, tenantId: clientId, ... })
```

**For payment-related tests**, extend the lease chain:
```
5. Create Payment via prisma.payment.create({ leaseId, tenantId: clientId, ... })
```

**For maintenance-related tests**:
```
1. Create Property + Lease (same as above, with status ACTIVE)
2. Create MaintenanceRequest via prisma.maintenanceRequest.create({ propertyId, tenantId, ... })
```

### Stripe-dependent controllers
- `checkout-redirect` and `stripe-webhook` depend on Stripe. If the Stripe service can be mocked via module override, test them. If not, create minimal tests that verify auth/validation without hitting Stripe, and add a comment noting the limitation.

## Test Requirements

- Every controller gets an E2E test file
- Minimum: 1 success case + 1 error case per controller
- Response shape assertions must match the ACTUAL controller return (verify by reading the controller)
- Use correct auth: `makeJwt(true)` for CLIENT endpoints, `makeJwt(false)` for EMPLOYEE endpoints
- Clean up all created test data in `afterEach()`

## Implementation Order

1. Start with simpler GET-by-ID controllers (lease, property, payment, maintenance, client)
2. Then list/filter controllers (get-leases, get-payments, get-properties, etc.)
3. Then mutation controllers (create-lease, create-maintenance-request, etc.)
4. Finally Stripe-dependent controllers (best effort)

## Definition of Done

- All 32 E2E test files created
- `npm run test:e2e` passes (requires running DB + Azurite)
- `npm run type-check` passes
- `npm run format` passes
- No existing tests broken

## Web Agent / Mobile Agent

No frontend work in this sprint.
