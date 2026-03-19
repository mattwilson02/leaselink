# Sprint 1: Foundation & Shared Package

## Overview

This sprint establishes the foundational layer that all future feature work depends on. No feature code is written — only shared types, database schema, validation schemas, and constants.

**Goal:** Every app (`@leaselink/api`, `@leaselink/web`, `@leaselink/mobile`) can import a consistent, validated set of types, enums, constants, and Zod schemas from `@leaselink/shared`. The database schema is extended to support all new entities (Property, Lease, MaintenanceRequest, Payment). An engineer starting Sprint 2 (feature work) should have zero ambiguity about data shapes, validation rules, or status transitions.

---

## Codebase Discrepancies (Existing vs Product Spec)

These discrepancies MUST be understood before implementation. Sprint 1 does NOT rename database tables or columns — it adds new models and aligns the shared package with the product spec naming. The rename of existing models (Employee/Client to PropertyManager/Tenant) is a future migration concern.

| Area | Existing Code | Product Spec | Action in Sprint 1 |
|------|--------------|--------------|---------------------|
| Manager model name | `Employee` (Prisma), `Person` base class | `PropertyManager` | Shared types use `PropertyManager`. Prisma keeps `Employee` table for now. Document the mapping. |
| Tenant model name | `Client` (Prisma), `Client` entity class | `Tenant` | Shared types use `Tenant`. Prisma keeps `clients` table for now. Document the mapping. |
| Manager role enum | `ROLE { ADMIN, SUPPORT }` in Prisma | `ROLE { ADMIN, AGENT }` in spec | Prisma migration to rename `SUPPORT` to `AGENT`. Shared enum already has `ManagerRole { ADMIN, AGENT }`. |
| Document folders | Prisma: `IDENTIFICATION, INVESTMENT_STATEMENTS, SIGNED_DOCUMENTS, CORRESPONDENTS, TAX_DOCUMENTS, OTHER` | Spec: `IDENTIFICATION, LEASE_AGREEMENTS, SIGNED_DOCUMENTS, INSPECTION_REPORTS, INSURANCE, OTHER` | Prisma migration to update enum values. Shared enum already matches spec. |
| Document request types | Prisma: `PROOF_OF_ADDRESS, PROOF_OF_IDENTITY` | Spec adds: `SIGNED_LEASE, MOVE_IN_CHECKLIST` | Prisma migration to add new enum values. Shared enum already matches spec. |
| Notification ActionType | Prisma: `SIGN_DOCUMENT, UPLOAD_DOCUMENT, BASIC_COMPLETE` | Spec adds: `MAINTENANCE_UPDATE, LEASE_EXPIRY, RENT_REMINDER, PAYMENT_RECEIVED, PAYMENT_OVERDUE, INSPECTION_SCHEDULED, LEASE_RENEWAL, SIGN_LEASE` | Prisma migration to add new enum values. |
| Notification model | Has `text` field, `linkedTransactionId` | Spec has `title` + `body`, `linkedMaintenanceRequestId` + `linkedPaymentId` | Prisma migration to rename/add columns. |
| Tenant notification prefs | `receivesNotificationsForPortfolio` | Spec: `receivesNotificationsForMaintenance` | Prisma migration to rename column. |
| Document model | No `propertyId` field, uses `contentKey`/`blobName` | Spec adds optional `propertyId` FK | Prisma migration to add column. |
| Employee-Client relationship | Many-to-many via `EmployeeClients` join table | Spec: Property has `managerId` (one manager per property) | Keep existing join table. New Property model has direct `managerId` FK. |

---

## Task 1: Shared Package — Types & Interfaces

### Objective

Define TypeScript interfaces for ALL entities in the product spec, plus API request/response DTOs. These become the single source of truth for data shapes across the entire monorepo. The API's domain entities and Prisma mappers will map to/from these interfaces. The web and mobile apps will use these interfaces for API responses and form data.

### Dependencies

- None (this is the starting point)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared/src/types/property-manager.ts` | Create | PropertyManager entity interface |
| `packages/shared/src/types/tenant.ts` | Create | Tenant entity interface |
| `packages/shared/src/types/property.ts` | Create | Property entity interface |
| `packages/shared/src/types/lease.ts` | Create | Lease entity interface |
| `packages/shared/src/types/maintenance-request.ts` | Create | MaintenanceRequest entity interface |
| `packages/shared/src/types/document.ts` | Create | Document entity interface |
| `packages/shared/src/types/notification.ts` | Create | Notification entity interface |
| `packages/shared/src/types/payment.ts` | Create | Payment entity interface |
| `packages/shared/src/types/pagination.ts` | Create | Shared pagination types |
| `packages/shared/src/types/api-responses.ts` | Create | Generic API response wrappers |
| `packages/shared/src/types/index.ts` | Create | Barrel export |
| `packages/shared/src/dto/property.dto.ts` | Create | Property CRUD DTOs |
| `packages/shared/src/dto/lease.dto.ts` | Create | Lease CRUD DTOs |
| `packages/shared/src/dto/maintenance-request.dto.ts` | Create | MaintenanceRequest CRUD DTOs |
| `packages/shared/src/dto/payment.dto.ts` | Create | Payment DTOs |
| `packages/shared/src/dto/tenant.dto.ts` | Create | Tenant DTOs (aligns with existing create-client) |
| `packages/shared/src/dto/document.dto.ts` | Create | Document DTOs |
| `packages/shared/src/dto/notification.dto.ts` | Create | Notification DTOs |
| `packages/shared/src/dto/index.ts` | Create | Barrel export |
| `packages/shared/src/index.ts` | Modify | Add exports for types, dto directories |
| `packages/shared/package.json` | Modify | Add `zod` dependency |
| `packages/shared/tsconfig.json` | Modify | No changes expected, verify `strict: true` |

### Detailed Requirements

#### Entity Interfaces

Each interface corresponds to the entity model in Section 4 of the product spec. All fields use TypeScript-native types (not Prisma types). Dates are `string` (ISO 8601) since these are API/serialization interfaces, not domain entities.

**`packages/shared/src/types/property-manager.ts`**
```typescript
import { ManagerRole } from "../enums";

export interface PropertyManager {
  id: string;
  email: string;
  name: string;
  role: ManagerRole;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string | null;
}
```

**`packages/shared/src/types/tenant.ts`**
```typescript
import { TenantStatus, OnboardingStatus } from "../enums";

export interface Tenant {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  status: TenantStatus;
  onboardingStatus: OnboardingStatus;
  profilePhoto: string | null;
  pushToken: string | null;
  deviceId: string | null;
  onboardingToken: string | null;
  receivesEmailNotifications: boolean;
  receivesPushNotifications: boolean;
  receivesNotificationsForMaintenance: boolean;
  receivesNotificationsForDocuments: boolean;
  createdAt: string;
  updatedAt: string | null;
}
```

**`packages/shared/src/types/property.ts`**
```typescript
import { PropertyType, PropertyStatus } from "../enums";

export interface Property {
  id: string;
  managerId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  rentAmount: number;
  status: PropertyStatus;
  description: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string | null;
}
```

**`packages/shared/src/types/lease.ts`**
```typescript
import { LeaseStatus } from "../enums";

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: LeaseStatus;
  renewedFromLeaseId: string | null;
  createdAt: string;
  updatedAt: string | null;
}
```

**`packages/shared/src/types/maintenance-request.ts`**
```typescript
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
} from "../enums";

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  category: MaintenanceCategory;
  photos: string[];
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
```

**`packages/shared/src/types/document.ts`**
```typescript
import { DocumentFolder } from "../enums";

export interface Document {
  id: string;
  tenantId: string;
  propertyId: string | null;
  name: string;
  folder: DocumentFolder;
  blobStorageKey: string;
  contentType: string;
  size: number;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
```

Note: The existing Document Prisma model uses `contentKey`, `blobName`, and `fileSize`. The shared interface uses spec naming (`blobStorageKey`, `size`). The Prisma mapper in the API will handle the translation.

**`packages/shared/src/types/notification.ts`**
```typescript
import { NotificationType, ActionType } from "../enums";

export interface Notification {
  id: string;
  personId: string;
  title: string;
  body: string;
  type: NotificationType;
  actionType: ActionType | null;
  isRead: boolean;
  linkedDocumentId: string | null;
  linkedMaintenanceRequestId: string | null;
  linkedPaymentId: string | null;
  createdAt: string;
}
```

Note: The existing Notification Prisma model uses `text` (single field) and `linkedTransactionId`. The spec splits into `title`/`body` and renames the linked field. The Prisma migration (Task 2) handles the DB-side change.

**`packages/shared/src/types/payment.ts`**
```typescript
import { PaymentStatus } from "../enums";

export interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
```

**`packages/shared/src/types/pagination.ts`**
```typescript
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
```

Note: The existing API has a simple `PaginationParams` interface with only `page` at `apps/api/src/core/repositories/pagination-params.ts`. The shared version adds `pageSize` for consistency. The API can continue to use its own internally or migrate to this one.

**`packages/shared/src/types/api-responses.ts`**
```typescript
export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
```

#### DTO Interfaces

DTOs define the shape of request bodies and response payloads for each entity's CRUD operations. They are plain interfaces (not classes with decorators — the API will create its own Swagger-decorated DTO classes that implement these interfaces).

**`packages/shared/src/dto/property.dto.ts`**
```typescript
import { PropertyType, PropertyStatus } from "../enums";

export interface CreatePropertyDto {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  rentAmount: number;
  description?: string;
}

export interface UpdatePropertyDto {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number | null;
  rentAmount?: number;
  description?: string | null;
  status?: PropertyStatus;
}

export interface PropertyFilterDto {
  status?: PropertyStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
```

**`packages/shared/src/dto/lease.dto.ts`**
```typescript
import { LeaseStatus } from "../enums";

export interface CreateLeaseDto {
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
}

export interface UpdateLeaseStatusDto {
  status: LeaseStatus;
}

export interface RenewLeaseDto {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
}

export interface LeaseFilterDto {
  status?: LeaseStatus;
  propertyId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}
```

**`packages/shared/src/dto/maintenance-request.dto.ts`**
```typescript
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
} from "../enums";

export interface CreateMaintenanceRequestDto {
  propertyId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority?: MaintenancePriority;
}

export interface UpdateMaintenanceRequestDto {
  status?: MaintenanceStatus;
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
}

export interface MaintenanceRequestFilterDto {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
  propertyId?: string;
  page?: number;
  pageSize?: number;
}
```

**`packages/shared/src/dto/payment.dto.ts`**
```typescript
import { PaymentStatus } from "../enums";

export interface CreateCheckoutSessionDto {
  paymentId: string;
}

export interface PaymentFilterDto {
  status?: PaymentStatus;
  leaseId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}
```

**`packages/shared/src/dto/tenant.dto.ts`**
```typescript
import { TenantStatus, OnboardingStatus } from "../enums";

export interface CreateTenantDto {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface UpdateTenantStatusDto {
  status: TenantStatus;
}

export interface SetNotificationPreferencesDto {
  receivesEmailNotifications?: boolean;
  receivesPushNotifications?: boolean;
  receivesNotificationsForMaintenance?: boolean;
  receivesNotificationsForDocuments?: boolean;
}

export interface TenantFilterDto {
  status?: TenantStatus;
  onboardingStatus?: OnboardingStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
```

**`packages/shared/src/dto/document.dto.ts`**
```typescript
import { DocumentFolder, DocumentRequestType } from "../enums";

export interface UploadDocumentDto {
  name: string;
  folder: DocumentFolder;
  contentType: string;
  size: number;
  tenantId: string;
  propertyId?: string;
}

export interface CreateDocumentRequestDto {
  tenantId: string;
  requestType: DocumentRequestType;
}

export interface DocumentFilterDto {
  folder?: DocumentFolder;
  tenantId?: string;
  propertyId?: string;
  page?: number;
  pageSize?: number;
}
```

**`packages/shared/src/dto/notification.dto.ts`**
```typescript
import { NotificationType, ActionType } from "../enums";

export interface CreateNotificationDto {
  personId: string;
  title: string;
  body: string;
  type: NotificationType;
  actionType?: ActionType;
  linkedDocumentId?: string;
  linkedMaintenanceRequestId?: string;
  linkedPaymentId?: string;
}

export interface UpdateNotificationDto {
  isRead?: boolean;
}
```

### Enums — Verify & Update

The existing `packages/shared/src/enums.ts` already defines most enums. The following enums need to be ADDED to the file:

```typescript
// Already exists and matches spec:
// PropertyType, PropertyStatus, LeaseStatus, PaymentStatus,
// MaintenancePriority, MaintenanceStatus, MaintenanceCategory,
// DocumentFolder, DocumentRequestType, TenantStatus, OnboardingStatus, ManagerRole

// ADD these — they exist in Prisma but not in shared:
export enum NotificationType {
  INFO = "INFO",
  ACTION = "ACTION",
}

export enum ActionType {
  SIGN_DOCUMENT = "SIGN_DOCUMENT",
  SIGN_LEASE = "SIGN_LEASE",
  UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT",
  BASIC_COMPLETE = "BASIC_COMPLETE",
  MAINTENANCE_UPDATE = "MAINTENANCE_UPDATE",
  LEASE_EXPIRY = "LEASE_EXPIRY",
  RENT_REMINDER = "RENT_REMINDER",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_OVERDUE = "PAYMENT_OVERDUE",
  INSPECTION_SCHEDULED = "INSPECTION_SCHEDULED",
  LEASE_RENEWAL = "LEASE_RENEWAL",
}

export enum DocumentRequestStatus {
  PENDING = "PENDING",
  UPLOADED = "UPLOADED",
  CANCELED = "CANCELED",
}
```

### Acceptance Criteria

- [ ] All 8 entity interfaces exist and match Section 4 of PRODUCT_SPEC.md field-for-field
- [ ] All date fields are typed as `string` (ISO 8601 serialization format)
- [ ] All enum fields reference enums from `packages/shared/src/enums.ts`
- [ ] DTO interfaces exist for Create, Update (where applicable), and Filter for each entity
- [ ] `NotificationType`, `ActionType`, and `DocumentRequestStatus` enums are added to `packages/shared/src/enums.ts`
- [ ] `ActionType` includes all 11 values from the notification triggers table in Section 3.8
- [ ] Pagination types (`PaginationParams`, `PaginatedResponse<T>`) are exported
- [ ] API response wrappers (`ApiSuccessResponse<T>`, `ApiErrorResponse`) are exported
- [ ] `packages/shared/src/index.ts` re-exports everything from `types`, `dto`, and `enums`
- [ ] `packages/shared/package.json` includes `zod` as a dependency (needed for Task 3)
- [ ] `tsc --noEmit` passes on the shared package with no errors
- [ ] The web app (`apps/web`) can import and use a shared type without errors

### Test Cases

No runtime tests for interfaces (they are compile-time only). Verification is via:

1. **Type-check test:** `cd packages/shared && npx tsc --noEmit` exits 0
2. **Import test:** Create a temporary file in `apps/web/src` that imports `{ Property, CreatePropertyDto, PropertyStatus }` from `@leaselink/shared` and uses them in a typed variable — verify no TS errors
3. **Completeness check:** Manually verify each interface has every field from Section 4 of the product spec

---

## Task 2: Database Schema — New Models

### Objective

Extend the Prisma schema to add the four new entity tables (Property, Lease, MaintenanceRequest, Payment) with all relationships, and update existing models to align with the product spec where necessary. Generate and verify the migration.

### Dependencies

- None (can be done in parallel with Task 1, but the Prisma enum values should align with `packages/shared/src/enums.ts`)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/prisma/schema.prisma` | Modify | Add new models, update existing enums and models |
| `apps/api/prisma/migrations/<timestamp>_sprint1_foundation/migration.sql` | Auto-generated | Migration file created by `npx prisma migrate dev` |

### Detailed Requirements

#### Prisma Enum Changes

**Update `ROLE` enum:**
```prisma
enum ROLE {
  ADMIN
  AGENT   // was SUPPORT
}
```
This requires a migration that renames the enum value. Since there may be existing data, the migration SQL should use `ALTER TYPE` to rename.

**Update `DOCUMENT_FOLDER` enum:**
```prisma
enum DOCUMENT_FOLDER {
  IDENTIFICATION
  LEASE_AGREEMENTS       // was INVESTMENT_STATEMENTS
  SIGNED_DOCUMENTS
  INSPECTION_REPORTS     // was CORRESPONDENTS
  INSURANCE              // was TAX_DOCUMENTS
  OTHER
}
```

**Update `REQUEST_TYPE` enum:**
```prisma
enum REQUEST_TYPE {
  PROOF_OF_ADDRESS
  PROOF_OF_IDENTITY
  SIGNED_LEASE          // new
  MOVE_IN_CHECKLIST     // new
}
```

**Update `ActionType` enum:**
```prisma
enum ActionType {
  SIGN_DOCUMENT
  SIGN_LEASE             // new
  UPLOAD_DOCUMENT
  BASIC_COMPLETE
  MAINTENANCE_UPDATE     // new
  LEASE_EXPIRY           // new
  RENT_REMINDER          // new
  PAYMENT_RECEIVED       // new
  PAYMENT_OVERDUE        // new
  INSPECTION_SCHEDULED   // new
  LEASE_RENEWAL          // new
}
```

**Add new enums:**
```prisma
enum PROPERTY_TYPE {
  APARTMENT
  HOUSE
  CONDO
  TOWNHOUSE
  STUDIO
}

enum PROPERTY_STATUS {
  VACANT
  LISTED
  OCCUPIED
  MAINTENANCE
}

enum LEASE_STATUS {
  PENDING
  ACTIVE
  EXPIRED
  TERMINATED
}

enum MAINTENANCE_PRIORITY {
  LOW
  MEDIUM
  HIGH
  EMERGENCY
}

enum MAINTENANCE_STATUS {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum MAINTENANCE_CATEGORY {
  PLUMBING
  ELECTRICAL
  HVAC
  APPLIANCE
  STRUCTURAL
  PEST_CONTROL
  OTHER
}

enum PAYMENT_STATUS {
  UPCOMING
  PENDING
  PAID
  OVERDUE
}
```

#### New Prisma Models

**Property:**
```prisma
model Property {
  id           String          @id @default(uuid())
  managerId    String          @map("manager_id")
  address      String
  city         String
  state        String
  zipCode      String          @map("zip_code")
  propertyType PROPERTY_TYPE   @map("property_type")
  bedrooms     Int
  bathrooms    Float
  sqft         Int?
  rentAmount   Float           @map("rent_amount")
  status       PROPERTY_STATUS @default(VACANT)
  description  String?
  photos       String[]        @default([])
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime?       @updatedAt @map("updated_at")

  manager              Employee              @relation(fields: [managerId], references: [id])
  leases               Lease[]
  maintenanceRequests   MaintenanceRequest[]
  documents            Document[]

  @@index([managerId])
  @@index([status])
  @@map("properties")
}
```

**Lease:**
```prisma
model Lease {
  id                  String       @id @default(uuid())
  propertyId          String       @map("property_id")
  tenantId            String       @map("tenant_id")
  startDate           DateTime     @map("start_date")
  endDate             DateTime     @map("end_date")
  monthlyRent         Float        @map("monthly_rent")
  securityDeposit     Float        @map("security_deposit")
  status              LEASE_STATUS @default(PENDING)
  renewedFromLeaseId  String?      @map("renewed_from_lease_id")
  createdAt           DateTime     @default(now()) @map("created_at")
  updatedAt           DateTime?    @updatedAt @map("updated_at")

  property    Property  @relation(fields: [propertyId], references: [id])
  tenant      Client    @relation(fields: [tenantId], references: [id])
  renewedFrom Lease?    @relation("LeaseRenewal", fields: [renewedFromLeaseId], references: [id])
  renewals    Lease[]   @relation("LeaseRenewal")
  payments    Payment[]

  @@index([propertyId])
  @@index([tenantId])
  @@index([status])
  @@index([renewedFromLeaseId])
  @@map("leases")
}
```

**MaintenanceRequest:**
```prisma
model MaintenanceRequest {
  id          String                @id @default(uuid())
  propertyId  String                @map("property_id")
  tenantId    String                @map("tenant_id")
  title       String
  description String
  priority    MAINTENANCE_PRIORITY  @default(MEDIUM)
  status      MAINTENANCE_STATUS    @default(OPEN)
  category    MAINTENANCE_CATEGORY
  photos      String[]              @default([])
  resolvedAt  DateTime?             @map("resolved_at")
  createdAt   DateTime              @default(now()) @map("created_at")
  updatedAt   DateTime?             @updatedAt @map("updated_at")

  property Property @relation(fields: [propertyId], references: [id])
  tenant   Client   @relation(fields: [tenantId], references: [id])

  @@index([propertyId])
  @@index([tenantId])
  @@index([status])
  @@index([priority])
  @@map("maintenance_requests")
}
```

**Payment:**
```prisma
model Payment {
  id                       String         @id @default(uuid())
  leaseId                  String         @map("lease_id")
  tenantId                 String         @map("tenant_id")
  amount                   Float
  dueDate                  DateTime       @map("due_date")
  status                   PAYMENT_STATUS @default(UPCOMING)
  stripeCheckoutSessionId  String?        @map("stripe_checkout_session_id")
  stripePaymentIntentId    String?        @map("stripe_payment_intent_id")
  paidAt                   DateTime?      @map("paid_at")
  createdAt                DateTime       @default(now()) @map("created_at")
  updatedAt                DateTime?      @updatedAt @map("updated_at")

  lease  Lease  @relation(fields: [leaseId], references: [id])
  tenant Client @relation(fields: [tenantId], references: [id])

  @@index([leaseId])
  @@index([tenantId])
  @@index([status])
  @@index([dueDate])
  @@map("payments")
}
```

#### Updates to Existing Models

**Employee model — add Property relation:**
```prisma
model Employee {
  // ... existing fields ...
  properties Property[]
  // ... existing relations ...
}
```

**Client model — add new relations and rename notification pref:**
```prisma
model Client {
  // ... existing fields ...

  // Rename: receivesNotificationsForPortfolio -> receivesNotificationsForMaintenance
  receivesNotificationsForMaintenance Boolean @default(false) @map("receives_notifications_for_maintenance")

  // Add new relations
  leases              Lease[]
  maintenanceRequests MaintenanceRequest[]
  payments            Payment[]

  // ... existing relations ...
}
```

**Document model — add optional propertyId:**
```prisma
model Document {
  // ... existing fields ...
  propertyId String? @map("property_id")

  property Property? @relation(fields: [propertyId], references: [id])
  // ... existing relations ...
}
```

**Notification model — update fields:**
```prisma
model Notification {
  // ... existing fields ...

  // Rename text -> title, add body
  title               String
  body                String

  // Rename linkedTransactionId -> linkedMaintenanceRequestId, add linkedPaymentId
  linkedMaintenanceRequestId String? @map("linked_maintenance_request_id")
  linkedPaymentId            String? @map("linked_payment_id")

  // ... keep other existing fields ...
}
```

#### Index Strategy

Indexes are added for:
- **Foreign keys:** All FK columns get an index (Prisma creates these by default for `@relation` fields in PostgreSQL, but explicit `@@index` ensures it)
- **Status fields:** Frequently filtered by status in list queries
- **Priority field:** MaintenanceRequest priority for emergency filtering
- **Due date:** Payment due date for overdue detection queries
- **Composite queries:** No composite indexes in Sprint 1 — add in later sprints when query patterns are clearer

#### Migration Plan

1. Run `npx prisma migrate dev --name sprint1_foundation` from `apps/api/`
2. The migration will be complex due to enum renames. Review the generated SQL carefully.
3. For enum value renames (e.g., `SUPPORT` -> `AGENT`), Prisma may generate a destructive migration (drop and recreate). If so, manually edit the migration SQL to use:
   ```sql
   ALTER TYPE "ROLE" RENAME VALUE 'SUPPORT' TO 'AGENT';
   ALTER TYPE "DOCUMENT_FOLDER" RENAME VALUE 'INVESTMENT_STATEMENTS' TO 'LEASE_AGREEMENTS';
   ALTER TYPE "DOCUMENT_FOLDER" RENAME VALUE 'CORRESPONDENTS' TO 'INSPECTION_REPORTS';
   ALTER TYPE "DOCUMENT_FOLDER" RENAME VALUE 'TAX_DOCUMENTS' TO 'INSURANCE';
   ```
4. For the Notification `text` -> `title`/`body` split: manually write SQL to rename `text` to `title` and add a `body` column with a default empty string, then backfill `body` from `title` if needed.
5. For the Client notification pref rename: `ALTER TABLE clients RENAME COLUMN receives_notifications_for_portfolio TO receives_notifications_for_maintenance;`
6. For the Notification linked field rename: `ALTER TABLE notifications RENAME COLUMN linked_transaction_id TO linked_maintenance_request_id;` and add `linked_payment_id` column.
7. Run `npx prisma generate` to regenerate the Prisma client
8. Verify existing tests still pass: `cd apps/api && npm run test`

### Acceptance Criteria

- [ ] `npx prisma validate` passes with no errors
- [ ] `npx prisma migrate dev` generates a migration without errors
- [ ] All 4 new models (Property, Lease, MaintenanceRequest, Payment) exist in the schema
- [ ] All relationships are correctly defined (FKs, relations, self-referential Lease renewal)
- [ ] Existing models (Employee, Client, Document, Notification) are updated with new relations and field changes
- [ ] Enum values in Prisma match the shared package enums exactly
- [ ] `ROLE.SUPPORT` is renamed to `ROLE.AGENT`
- [ ] `DOCUMENT_FOLDER` values match the product spec (LEASE_AGREEMENTS, INSPECTION_REPORTS, INSURANCE)
- [ ] `REQUEST_TYPE` includes SIGNED_LEASE and MOVE_IN_CHECKLIST
- [ ] `ActionType` includes all 11 notification action types
- [ ] Client model has `receivesNotificationsForMaintenance` (not `receivesNotificationsForPortfolio`)
- [ ] Notification model has `title` + `body` (not `text`), `linkedMaintenanceRequestId` (not `linkedTransactionId`), and `linkedPaymentId`
- [ ] Document model has optional `propertyId` with FK to Property
- [ ] Indexes exist on all FK columns, status columns, priority, and dueDate
- [ ] Migration SQL handles enum renames non-destructively (no data loss)
- [ ] `npx prisma generate` succeeds and the Prisma client types are correct
- [ ] Existing unit tests pass after migration (`cd apps/api && npm run test`)

### Test Cases

1. **Schema validation:** `npx prisma validate` exits 0
2. **Migration generation:** `npx prisma migrate dev --create-only --name sprint1_foundation` succeeds
3. **Migration execution:** Run migration against a fresh database (use `docker-compose.postgres.yaml` to create a new container), verify tables are created
4. **Relationship integrity:** Insert test data via `prisma studio` or seed script:
   - Create an Employee, then a Property referencing it — verify FK constraint
   - Create a Client, Property, then Lease referencing both — verify FK constraints
   - Create a Lease, then a Payment referencing it — verify FK constraint
   - Create a Lease with `renewedFromLeaseId` pointing to another Lease — verify self-referential FK
5. **Enum constraint:** Attempt to insert a Property with an invalid `property_type` value — verify it fails
6. **Existing test suite:** `cd apps/api && npm run test` — all existing tests pass

---

## Task 3: Shared Validation Schemas (Zod)

### Objective

Create Zod schemas for all entity create/update operations that can be imported by the API (for request validation), web app (for form validation), and mobile app (for client-side validation). These schemas encode business rules from the product spec (required fields, value constraints, status transitions).

### Dependencies

- Task 1 (enums and DTO interfaces must exist — schemas validate against them)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared/src/validation/property.schema.ts` | Create | Property Zod schemas |
| `packages/shared/src/validation/lease.schema.ts` | Create | Lease Zod schemas |
| `packages/shared/src/validation/maintenance-request.schema.ts` | Create | MaintenanceRequest Zod schemas |
| `packages/shared/src/validation/payment.schema.ts` | Create | Payment Zod schemas |
| `packages/shared/src/validation/tenant.schema.ts` | Create | Tenant Zod schemas |
| `packages/shared/src/validation/document.schema.ts` | Create | Document Zod schemas |
| `packages/shared/src/validation/notification.schema.ts` | Create | Notification Zod schemas |
| `packages/shared/src/validation/index.ts` | Create | Barrel export |
| `packages/shared/src/index.ts` | Modify | Add validation export |
| `packages/shared/package.json` | Modify | Add `zod` dependency (if not done in Task 1) |

### Detailed Requirements

Each validation file exports Zod schemas for create and update operations. Schemas use `z.nativeEnum()` for enum validation, ensuring alignment with the shared enums.

**`packages/shared/src/validation/property.schema.ts`**
```typescript
import { z } from "zod";
import { PropertyType, PropertyStatus } from "../enums";

export const createPropertySchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  propertyType: z.nativeEnum(PropertyType),
  bedrooms: z.number().int().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.number().min(0, "Bathrooms must be 0 or more"),
  sqft: z.number().int().positive().optional(),
  rentAmount: z.number().positive("Rent amount must be greater than 0"),
  description: z.string().optional(),
});

export const updatePropertySchema = z.object({
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  zipCode: z.string().min(1).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  sqft: z.number().int().positive().nullable().optional(),
  rentAmount: z.number().positive().optional(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
});

export const propertyFilterSchema = z.object({
  status: z.nativeEnum(PropertyStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyFilterInput = z.infer<typeof propertyFilterSchema>;
```

**`packages/shared/src/validation/lease.schema.ts`**
```typescript
import { z } from "zod";
import { LeaseStatus } from "../enums";

export const createLeaseSchema = z
  .object({
    propertyId: z.string().uuid("Invalid property ID"),
    tenantId: z.string().uuid("Invalid tenant ID"),
    startDate: z.string().datetime({ message: "Invalid start date" }),
    endDate: z.string().datetime({ message: "Invalid end date" }),
    monthlyRent: z.number().positive("Monthly rent must be greater than 0"),
    securityDeposit: z
      .number()
      .min(0, "Security deposit must be 0 or more"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const updateLeaseStatusSchema = z.object({
  status: z.nativeEnum(LeaseStatus),
});

export const renewLeaseSchema = z
  .object({
    startDate: z.string().datetime({ message: "Invalid start date" }),
    endDate: z.string().datetime({ message: "Invalid end date" }),
    monthlyRent: z.number().positive("Monthly rent must be greater than 0"),
    securityDeposit: z
      .number()
      .min(0, "Security deposit must be 0 or more"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const leaseFilterSchema = z.object({
  status: z.nativeEnum(LeaseStatus).optional(),
  propertyId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseStatusInput = z.infer<typeof updateLeaseStatusSchema>;
export type RenewLeaseInput = z.infer<typeof renewLeaseSchema>;
export type LeaseFilterInput = z.infer<typeof leaseFilterSchema>;
```

**`packages/shared/src/validation/maintenance-request.schema.ts`**
```typescript
import { z } from "zod";
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
} from "../enums";

export const createMaintenanceRequestSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or less"),
  category: z.nativeEnum(MaintenanceCategory),
  priority: z.nativeEnum(MaintenancePriority).default(MaintenancePriority.MEDIUM),
});

export const updateMaintenanceRequestSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  priority: z.nativeEnum(MaintenancePriority).optional(),
});

export const maintenanceRequestFilterSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus).optional(),
  priority: z.nativeEnum(MaintenancePriority).optional(),
  category: z.nativeEnum(MaintenanceCategory).optional(),
  propertyId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateMaintenanceRequestInput = z.infer<
  typeof createMaintenanceRequestSchema
>;
export type UpdateMaintenanceRequestInput = z.infer<
  typeof updateMaintenanceRequestSchema
>;
export type MaintenanceRequestFilterInput = z.infer<
  typeof maintenanceRequestFilterSchema
>;
```

**`packages/shared/src/validation/payment.schema.ts`**
```typescript
import { z } from "zod";
import { PaymentStatus } from "../enums";

export const createCheckoutSessionSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
});

export const paymentFilterSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  leaseId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;
```

**`packages/shared/src/validation/tenant.schema.ts`**
```typescript
import { z } from "zod";
import { TenantStatus, OnboardingStatus } from "../enums";

export const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const updateTenantStatusSchema = z.object({
  status: z.nativeEnum(TenantStatus),
});

export const setNotificationPreferencesSchema = z.object({
  receivesEmailNotifications: z.boolean().optional(),
  receivesPushNotifications: z.boolean().optional(),
  receivesNotificationsForMaintenance: z.boolean().optional(),
  receivesNotificationsForDocuments: z.boolean().optional(),
});

export const tenantFilterSchema = z.object({
  status: z.nativeEnum(TenantStatus).optional(),
  onboardingStatus: z.nativeEnum(OnboardingStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantStatusInput = z.infer<typeof updateTenantStatusSchema>;
export type SetNotificationPreferencesInput = z.infer<
  typeof setNotificationPreferencesSchema
>;
export type TenantFilterInput = z.infer<typeof tenantFilterSchema>;
```

**`packages/shared/src/validation/document.schema.ts`**
```typescript
import { z } from "zod";
import { DocumentFolder, DocumentRequestType } from "../enums";

export const uploadDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  folder: z.nativeEnum(DocumentFolder),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().int().positive("File size must be greater than 0"),
  tenantId: z.string().uuid("Invalid tenant ID"),
  propertyId: z.string().uuid("Invalid property ID").optional(),
});

export const createDocumentRequestSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  requestType: z.nativeEnum(DocumentRequestType),
});

export const documentFilterSchema = z.object({
  folder: z.nativeEnum(DocumentFolder).optional(),
  tenantId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type CreateDocumentRequestInput = z.infer<
  typeof createDocumentRequestSchema
>;
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;
```

**`packages/shared/src/validation/notification.schema.ts`**
```typescript
import { z } from "zod";
import { NotificationType, ActionType } from "../enums";

export const createNotificationSchema = z.object({
  personId: z.string().uuid("Invalid person ID"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  type: z.nativeEnum(NotificationType),
  actionType: z.nativeEnum(ActionType).optional(),
  linkedDocumentId: z.string().uuid().optional(),
  linkedMaintenanceRequestId: z.string().uuid().optional(),
  linkedPaymentId: z.string().uuid().optional(),
});

export const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
});

export type CreateNotificationInput = z.infer<
  typeof createNotificationSchema
>;
export type UpdateNotificationInput = z.infer<
  typeof updateNotificationSchema
>;
```

### Note on Existing Zod Usage

The API already uses Zod schemas inline in controllers (see `apps/api/src/infra/http/controllers/create-client/create-client.controller.ts` where `createClientBodySchema` is defined locally). The API also has a `ZodValidationPipe` at `apps/api/src/infra/http/pipes/zod-validation-pipe.ts` and uses `nestjs-zod`. After Sprint 1, controllers can import shared schemas instead of defining them inline. This migration of existing controllers is NOT part of Sprint 1 — it will happen incrementally in later sprints.

### Acceptance Criteria

- [ ] Zod schemas exist for create and update operations for all 7 entity types
- [ ] Filter schemas exist for all list endpoints
- [ ] All schemas use `z.nativeEnum()` referencing shared enums (not string literals)
- [ ] `createLeaseSchema` validates that `endDate > startDate`
- [ ] `createPropertySchema` validates that `rentAmount > 0`
- [ ] `createMaintenanceRequestSchema` defaults priority to `MEDIUM`
- [ ] All filter schemas have `page` (default 1) and `pageSize` (default 20, max 100)
- [ ] UUID fields are validated with `z.string().uuid()`
- [ ] All schemas export inferred TypeScript types (e.g., `CreatePropertyInput`)
- [ ] Schemas are importable from `@leaselink/shared` in all three apps
- [ ] `tsc --noEmit` passes on the shared package

### Test Cases

Create a test file at `packages/shared/src/validation/__tests__/schemas.test.ts` (add `vitest` as a dev dependency to the shared package).

**Property schema tests:**
| Test | Input | Expected |
|------|-------|----------|
| Valid create | `{ address: "123 Main St", city: "NYC", state: "NY", zipCode: "10001", propertyType: "APARTMENT", bedrooms: 2, bathrooms: 1.5, rentAmount: 2500 }` | Passes |
| Missing address | `{ city: "NYC", ... }` | Fails with "Address is required" |
| Negative rent | `{ ..., rentAmount: -100 }` | Fails with "Rent amount must be greater than 0" |
| Zero rent | `{ ..., rentAmount: 0 }` | Fails |
| Invalid property type | `{ ..., propertyType: "MANSION" }` | Fails |
| Valid with optional sqft | `{ ..., sqft: 1200 }` | Passes |

**Lease schema tests:**
| Test | Input | Expected |
|------|-------|----------|
| Valid create | `{ propertyId: uuid, tenantId: uuid, startDate: "2026-04-01T00:00:00.000Z", endDate: "2027-04-01T00:00:00.000Z", monthlyRent: 2000, securityDeposit: 4000 }` | Passes |
| End before start | `{ ..., startDate: "2027-01-01...", endDate: "2026-01-01..." }` | Fails with "End date must be after start date" |
| Zero rent | `{ ..., monthlyRent: 0 }` | Fails |
| Missing property | `{ tenantId: uuid, ... }` | Fails |
| Invalid UUID | `{ propertyId: "not-a-uuid", ... }` | Fails |

**MaintenanceRequest schema tests:**
| Test | Input | Expected |
|------|-------|----------|
| Valid with default priority | `{ propertyId: uuid, title: "Leaky faucet", description: "Kitchen sink drips", category: "PLUMBING" }` | Passes, priority defaults to MEDIUM |
| Empty title | `{ ..., title: "" }` | Fails |
| Title too long | `{ ..., title: "x".repeat(201) }` | Fails |
| Invalid category | `{ ..., category: "MAGIC" }` | Fails |

**Filter schema tests:**
| Test | Input | Expected |
|------|-------|----------|
| Empty filter | `{}` | Passes with defaults page=1, pageSize=20 |
| Page as string | `{ page: "3" }` | Passes (coerced to 3) |
| PageSize over max | `{ pageSize: 200 }` | Fails |

---

## Task 4: Shared Constants

### Objective

Define shared constants that encode business rules, status transitions, default values, and display labels. These are used by the API for business logic enforcement, by the web dashboard for UI rendering, and by the mobile app for client-side logic.

### Dependencies

- Task 1 (enums must exist)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared/src/constants/status-transitions.ts` | Create | Valid status transitions for all stateful entities |
| `packages/shared/src/constants/defaults.ts` | Create | Default values and business rule constants |
| `packages/shared/src/constants/error-messages.ts` | Create | Shared error message strings |
| `packages/shared/src/constants/display-labels.ts` | Create | Human-readable labels for enum values |
| `packages/shared/src/constants/index.ts` | Create | Barrel export |
| `packages/shared/src/index.ts` | Modify | Add constants export |

### Detailed Requirements

**`packages/shared/src/constants/status-transitions.ts`**

This file defines the allowed status transitions as a `Record<Status, Status[]>` for each stateful entity. The API uses these to validate transitions. The web/mobile apps use these to determine which status options to show in dropdowns.

```typescript
import {
  PropertyStatus,
  LeaseStatus,
  MaintenanceStatus,
  PaymentStatus,
} from "../enums";

/**
 * Property status transitions (Section 3.2 of PRODUCT_SPEC.md):
 * - VACANT -> LISTED or OCCUPIED
 * - LISTED -> OCCUPIED or VACANT
 * - OCCUPIED -> MAINTENANCE or VACANT (only when no active lease)
 * - MAINTENANCE -> OCCUPIED or VACANT
 */
export const PROPERTY_STATUS_TRANSITIONS: Record<
  PropertyStatus,
  PropertyStatus[]
> = {
  [PropertyStatus.VACANT]: [PropertyStatus.LISTED, PropertyStatus.OCCUPIED],
  [PropertyStatus.LISTED]: [PropertyStatus.OCCUPIED, PropertyStatus.VACANT],
  [PropertyStatus.OCCUPIED]: [
    PropertyStatus.MAINTENANCE,
    PropertyStatus.VACANT,
  ],
  [PropertyStatus.MAINTENANCE]: [
    PropertyStatus.OCCUPIED,
    PropertyStatus.VACANT,
  ],
};

/**
 * Lease status transitions (Section 3.3 of PRODUCT_SPEC.md):
 * - PENDING -> ACTIVE
 * - ACTIVE -> EXPIRED or TERMINATED
 * - EXPIRED -> (no transitions, terminal state — but can create renewal)
 * - TERMINATED -> (no transitions, terminal state)
 */
export const LEASE_STATUS_TRANSITIONS: Record<LeaseStatus, LeaseStatus[]> = {
  [LeaseStatus.PENDING]: [LeaseStatus.ACTIVE],
  [LeaseStatus.ACTIVE]: [LeaseStatus.EXPIRED, LeaseStatus.TERMINATED],
  [LeaseStatus.EXPIRED]: [],
  [LeaseStatus.TERMINATED]: [],
};

/**
 * Maintenance request status transitions (Section 3.4 of PRODUCT_SPEC.md):
 * - OPEN -> IN_PROGRESS
 * - IN_PROGRESS -> RESOLVED
 * - RESOLVED -> CLOSED
 *
 * Role constraints (enforced in API, not here):
 * - Only manager can move to IN_PROGRESS or RESOLVED
 * - Either party can move RESOLVED -> CLOSED
 */
export const MAINTENANCE_STATUS_TRANSITIONS: Record<
  MaintenanceStatus,
  MaintenanceStatus[]
> = {
  [MaintenanceStatus.OPEN]: [MaintenanceStatus.IN_PROGRESS],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.RESOLVED],
  [MaintenanceStatus.RESOLVED]: [MaintenanceStatus.CLOSED],
  [MaintenanceStatus.CLOSED]: [],
};

/**
 * Payment status transitions (Section 3.5 of PRODUCT_SPEC.md):
 * - UPCOMING -> PENDING (on due date)
 * - PENDING -> PAID or OVERDUE
 * - OVERDUE -> PAID
 * - PAID -> (no transitions, terminal state)
 */
export const PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  PaymentStatus[]
> = {
  [PaymentStatus.UPCOMING]: [PaymentStatus.PENDING],
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.OVERDUE],
  [PaymentStatus.OVERDUE]: [PaymentStatus.PAID],
  [PaymentStatus.PAID]: [],
};

/**
 * Generic helper: checks if a status transition is valid.
 * Use: `isValidTransition(PROPERTY_STATUS_TRANSITIONS, currentStatus, newStatus)`
 */
export function isValidTransition<T extends string>(
  transitionMap: Record<T, T[]>,
  from: T,
  to: T
): boolean {
  return transitionMap[from]?.includes(to) ?? false;
}
```

**`packages/shared/src/constants/defaults.ts`**
```typescript
/**
 * Payment grace period in days before marking OVERDUE.
 * Section 3.5: "Grace period: 5 days after due date before marking OVERDUE"
 */
export const PAYMENT_GRACE_PERIOD_DAYS = 5;

/**
 * Lease expiry notification intervals in days before end date.
 * Section 3.3: "Lease expiry notifications are sent 60 days, 30 days, and 7 days before end date"
 */
export const LEASE_EXPIRY_NOTIFICATION_DAYS = [60, 30, 7] as const;

/**
 * Default pagination values.
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Default maintenance request priority.
 * Section 3.4: "Priority levels: LOW, MEDIUM (default), HIGH, EMERGENCY"
 */
export const DEFAULT_MAINTENANCE_PRIORITY = "MEDIUM" as const;

/**
 * Maximum file upload sizes (in bytes).
 */
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PROPERTY_PHOTOS = 20;
export const MAX_MAINTENANCE_PHOTOS = 10;

/**
 * String length limits.
 */
export const MAX_MAINTENANCE_TITLE_LENGTH = 200;
export const MAX_MAINTENANCE_DESCRIPTION_LENGTH = 5000;
```

**`packages/shared/src/constants/error-messages.ts`**
```typescript
// Property errors
export const PROPERTY_NOT_FOUND = "Property not found";
export const PROPERTY_HAS_ACTIVE_LEASE =
  "Property cannot be deleted while it has an active lease";
export const PROPERTY_INVALID_STATUS_TRANSITION =
  "Invalid property status transition";
export const PROPERTY_OCCUPIED_CANNOT_GO_VACANT_WITH_LEASE =
  "Property cannot be set to VACANT while it has an active lease";

// Lease errors
export const LEASE_NOT_FOUND = "Lease not found";
export const LEASE_INVALID_STATUS_TRANSITION =
  "Invalid lease status transition";
export const LEASE_PROPERTY_NOT_AVAILABLE =
  "Property is not in a valid status for a new lease (must be LISTED or OCCUPIED)";
export const LEASE_PROPERTY_HAS_ACTIVE_LEASE =
  "Property already has an active lease";
export const LEASE_TENANT_HAS_ACTIVE_LEASE =
  "Tenant already has an active lease";
export const LEASE_TERMINATED_CANNOT_REACTIVATE =
  "A terminated lease cannot be reactivated";
export const LEASE_END_BEFORE_START = "Lease end date must be after start date";
export const LEASE_RENEWAL_INVALID_SOURCE =
  "Renewal can only be created from an ACTIVE or EXPIRED lease";
export const LEASE_RENEWAL_START_DATE_INVALID =
  "Renewal start date must be on or after the original lease end date";
export const LEASE_RENEWAL_ALREADY_EXISTS =
  "A pending renewal already exists for this lease";

// Maintenance errors
export const MAINTENANCE_NOT_FOUND = "Maintenance request not found";
export const MAINTENANCE_INVALID_STATUS_TRANSITION =
  "Invalid maintenance request status transition";
export const MAINTENANCE_NO_ACTIVE_LEASE =
  "Tenant can only submit maintenance requests for properties with an active lease";
export const MAINTENANCE_ONLY_MANAGER_CAN_UPDATE_STATUS =
  "Only the property manager can update request status to IN_PROGRESS or RESOLVED";

// Payment errors
export const PAYMENT_NOT_FOUND = "Payment not found";
export const PAYMENT_INVALID_STATUS_TRANSITION =
  "Invalid payment status transition";
export const PAYMENT_NO_ACTIVE_LEASE =
  "Tenant can only pay rent for an active lease";
export const PAYMENT_ALREADY_PAID = "This payment has already been paid";

// Generic errors
export const UNAUTHORIZED = "Unauthorized";
export const FORBIDDEN = "You do not have permission to perform this action";
export const VALIDATION_FAILED = "Validation failed";
```

**`packages/shared/src/constants/display-labels.ts`**
```typescript
import {
  PropertyType,
  PropertyStatus,
  LeaseStatus,
  PaymentStatus,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
  DocumentFolder,
  DocumentRequestType,
  TenantStatus,
  OnboardingStatus,
  ManagerRole,
  NotificationType,
  ActionType,
  DocumentRequestStatus,
} from "../enums";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "Apartment",
  [PropertyType.HOUSE]: "House",
  [PropertyType.CONDO]: "Condo",
  [PropertyType.TOWNHOUSE]: "Townhouse",
  [PropertyType.STUDIO]: "Studio",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  [PropertyStatus.VACANT]: "Vacant",
  [PropertyStatus.LISTED]: "Listed",
  [PropertyStatus.OCCUPIED]: "Occupied",
  [PropertyStatus.MAINTENANCE]: "Under Maintenance",
};

export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
  [LeaseStatus.PENDING]: "Pending",
  [LeaseStatus.ACTIVE]: "Active",
  [LeaseStatus.EXPIRED]: "Expired",
  [LeaseStatus.TERMINATED]: "Terminated",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UPCOMING]: "Upcoming",
  [PaymentStatus.PENDING]: "Pending",
  [PaymentStatus.PAID]: "Paid",
  [PaymentStatus.OVERDUE]: "Overdue",
};

export const MAINTENANCE_PRIORITY_LABELS: Record<
  MaintenancePriority,
  string
> = {
  [MaintenancePriority.LOW]: "Low",
  [MaintenancePriority.MEDIUM]: "Medium",
  [MaintenancePriority.HIGH]: "High",
  [MaintenancePriority.EMERGENCY]: "Emergency",
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.OPEN]: "Open",
  [MaintenanceStatus.IN_PROGRESS]: "In Progress",
  [MaintenanceStatus.RESOLVED]: "Resolved",
  [MaintenanceStatus.CLOSED]: "Closed",
};

export const MAINTENANCE_CATEGORY_LABELS: Record<
  MaintenanceCategory,
  string
> = {
  [MaintenanceCategory.PLUMBING]: "Plumbing",
  [MaintenanceCategory.ELECTRICAL]: "Electrical",
  [MaintenanceCategory.HVAC]: "HVAC",
  [MaintenanceCategory.APPLIANCE]: "Appliance",
  [MaintenanceCategory.STRUCTURAL]: "Structural",
  [MaintenanceCategory.PEST_CONTROL]: "Pest Control",
  [MaintenanceCategory.OTHER]: "Other",
};

export const DOCUMENT_FOLDER_LABELS: Record<DocumentFolder, string> = {
  [DocumentFolder.IDENTIFICATION]: "Identification",
  [DocumentFolder.LEASE_AGREEMENTS]: "Lease Agreements",
  [DocumentFolder.SIGNED_DOCUMENTS]: "Signed Documents",
  [DocumentFolder.INSPECTION_REPORTS]: "Inspection Reports",
  [DocumentFolder.INSURANCE]: "Insurance",
  [DocumentFolder.OTHER]: "Other",
};

export const DOCUMENT_REQUEST_TYPE_LABELS: Record<
  DocumentRequestType,
  string
> = {
  [DocumentRequestType.PROOF_OF_ADDRESS]: "Proof of Address",
  [DocumentRequestType.PROOF_OF_IDENTITY]: "Proof of Identity",
  [DocumentRequestType.SIGNED_LEASE]: "Signed Lease",
  [DocumentRequestType.MOVE_IN_CHECKLIST]: "Move-in Checklist",
};

export const DOCUMENT_REQUEST_STATUS_LABELS: Record<
  DocumentRequestStatus,
  string
> = {
  [DocumentRequestStatus.PENDING]: "Pending",
  [DocumentRequestStatus.UPLOADED]: "Uploaded",
  [DocumentRequestStatus.CANCELED]: "Canceled",
};

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  [TenantStatus.INVITED]: "Invited",
  [TenantStatus.ACTIVE]: "Active",
  [TenantStatus.INACTIVE]: "Inactive",
};

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  [OnboardingStatus.NEW]: "New",
  [OnboardingStatus.EMAIL_VERIFIED]: "Email Verified",
  [OnboardingStatus.PHONE_VERIFIED]: "Phone Verified",
  [OnboardingStatus.PASSWORD_SET]: "Password Set",
  [OnboardingStatus.ONBOARDED]: "Onboarded",
};

export const MANAGER_ROLE_LABELS: Record<ManagerRole, string> = {
  [ManagerRole.ADMIN]: "Admin",
  [ManagerRole.AGENT]: "Agent",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.INFO]: "Info",
  [NotificationType.ACTION]: "Action Required",
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  [ActionType.SIGN_DOCUMENT]: "Sign Document",
  [ActionType.SIGN_LEASE]: "Sign Lease",
  [ActionType.UPLOAD_DOCUMENT]: "Upload Document",
  [ActionType.BASIC_COMPLETE]: "Complete",
  [ActionType.MAINTENANCE_UPDATE]: "Maintenance Update",
  [ActionType.LEASE_EXPIRY]: "Lease Expiry",
  [ActionType.RENT_REMINDER]: "Rent Reminder",
  [ActionType.PAYMENT_RECEIVED]: "Payment Received",
  [ActionType.PAYMENT_OVERDUE]: "Payment Overdue",
  [ActionType.INSPECTION_SCHEDULED]: "Inspection Scheduled",
  [ActionType.LEASE_RENEWAL]: "Lease Renewal",
};
```

### Acceptance Criteria

- [ ] Status transition maps exist for Property, Lease, MaintenanceRequest, and Payment
- [ ] All transition maps match the business rules in Sections 3.2-3.5 of PRODUCT_SPEC.md exactly
- [ ] `isValidTransition` helper function works correctly for all entity types
- [ ] `PAYMENT_GRACE_PERIOD_DAYS` is set to 5
- [ ] `LEASE_EXPIRY_NOTIFICATION_DAYS` is `[60, 30, 7]`
- [ ] Default pagination is page=1, pageSize=20, max=100
- [ ] Error message constants exist for all entity-specific errors documented in the product spec
- [ ] Display label maps exist for ALL enums (14 enums total)
- [ ] Every enum value has a corresponding display label
- [ ] All constants are importable from `@leaselink/shared`
- [ ] `tsc --noEmit` passes on the shared package

### Test Cases

Create a test file at `packages/shared/src/constants/__tests__/status-transitions.test.ts`.

**Status transition tests:**
| Test | Input | Expected |
|------|-------|----------|
| Property: VACANT -> LISTED | `isValidTransition(PROPERTY_STATUS_TRANSITIONS, "VACANT", "LISTED")` | `true` |
| Property: VACANT -> OCCUPIED | `isValidTransition(PROPERTY_STATUS_TRANSITIONS, "VACANT", "OCCUPIED")` | `true` |
| Property: VACANT -> MAINTENANCE | `isValidTransition(PROPERTY_STATUS_TRANSITIONS, "VACANT", "MAINTENANCE")` | `false` |
| Property: LISTED -> VACANT | `isValidTransition(PROPERTY_STATUS_TRANSITIONS, "LISTED", "VACANT")` | `true` |
| Lease: PENDING -> ACTIVE | `isValidTransition(LEASE_STATUS_TRANSITIONS, "PENDING", "ACTIVE")` | `true` |
| Lease: PENDING -> EXPIRED | `isValidTransition(LEASE_STATUS_TRANSITIONS, "PENDING", "EXPIRED")` | `false` |
| Lease: TERMINATED -> ACTIVE | `isValidTransition(LEASE_STATUS_TRANSITIONS, "TERMINATED", "ACTIVE")` | `false` |
| Lease: EXPIRED has no transitions | `LEASE_STATUS_TRANSITIONS["EXPIRED"].length` | `0` |
| Maintenance: OPEN -> IN_PROGRESS | `isValidTransition(MAINTENANCE_STATUS_TRANSITIONS, "OPEN", "IN_PROGRESS")` | `true` |
| Maintenance: OPEN -> RESOLVED | `isValidTransition(MAINTENANCE_STATUS_TRANSITIONS, "OPEN", "RESOLVED")` | `false` (must go through IN_PROGRESS) |
| Maintenance: RESOLVED -> CLOSED | `isValidTransition(MAINTENANCE_STATUS_TRANSITIONS, "RESOLVED", "CLOSED")` | `true` |
| Payment: UPCOMING -> PENDING | `isValidTransition(PAYMENT_STATUS_TRANSITIONS, "UPCOMING", "PENDING")` | `true` |
| Payment: OVERDUE -> PAID | `isValidTransition(PAYMENT_STATUS_TRANSITIONS, "OVERDUE", "PAID")` | `true` |
| Payment: PAID has no transitions | `PAYMENT_STATUS_TRANSITIONS["PAID"].length` | `0` |

**Display label tests:**
| Test | Input | Expected |
|------|-------|----------|
| All PropertyType values have labels | `Object.values(PropertyType).every(v => PROPERTY_TYPE_LABELS[v])` | `true` |
| All MaintenanceCategory values have labels | `Object.values(MaintenanceCategory).every(v => MAINTENANCE_CATEGORY_LABELS[v])` | `true` |
| Verify a specific label | `MAINTENANCE_PRIORITY_LABELS[MaintenancePriority.EMERGENCY]` | `"Emergency"` |

---

## Updated `packages/shared/src/index.ts`

After all tasks are complete, the barrel export should look like:

```typescript
/**
 * @leaselink/shared
 *
 * Shared types, enums, constants, and validation schemas
 * used across the API, web dashboard, and mobile app.
 */

export * from "./enums";
export * from "./types";
export * from "./dto";
export * from "./validation";
export * from "./constants";
```

## Updated `packages/shared/package.json`

```json
{
  "name": "@leaselink/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^3.1.1"
  }
}
```

---

## Implementation Order

```
Task 1 ──────────────┐
(Types & Interfaces)  │
                      ├──> Task 3 (Zod Schemas)
Task 4 ──────────────┘    (depends on enums from Task 1)
(Constants — depends
 on enums from Task 1)

Task 2 (Database Schema — independent, can run in parallel with Task 1)
```

Recommended sequence:
1. **Task 1** first (enums are needed by everything)
2. **Task 2** and **Task 4** in parallel (both only depend on enums)
3. **Task 3** last (depends on enums and should reference DTO shapes from Task 1)

---

## Definition of Done

Sprint 1 is complete when:

1. `cd packages/shared && npx tsc --noEmit` passes
2. `cd packages/shared && npm run test` passes (validation and constants tests)
3. `cd apps/api && npx prisma validate` passes
4. `cd apps/api && npx prisma migrate dev` runs without errors
5. `cd apps/api && npm run test` passes (existing tests still work)
6. All imports from `@leaselink/shared` work in `apps/web` and `apps/api`
7. No circular dependencies in the shared package
