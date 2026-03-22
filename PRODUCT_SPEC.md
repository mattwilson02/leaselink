# LeaseLink — Property Management Platform

## Product Spec v0.1 (Draft)

---

## 1. What Is This?

LeaseLink is a property management platform that connects **property managers** with their **tenants**. Managers oversee properties, leases, maintenance, and payments from a web dashboard. Tenants view their lease details, submit maintenance requests, upload documents, pay rent, and receive notifications — all from a mobile app.

This is a full-stack application: a NestJS REST API backend with PostgreSQL, a Next.js web dashboard for property managers, and a React Native (Expo) mobile app for tenants.

---

## 2. Who Is It For?

### Property Manager (Web Dashboard User)
- Small-to-mid scale landlords or property management agents
- Manages a portfolio of rental properties from a web dashboard
- Needs to track tenants, leases, documents, maintenance, and payments across properties
- Invites tenants to the platform and communicates via notifications
- Signs in via the web app with email/password + optional 2FA

### Tenant (Mobile App User)
- Rents a property managed through the platform
- Needs to view lease details, submit maintenance requests, upload/sign documents, pay rent
- Receives push notifications for rent reminders, maintenance updates, lease expiry

---

## 3. Core Workflows

### 3.1 Tenant Onboarding
> Existing flow, minimal changes needed

1. Manager creates a tenant record and sends an invite (email)
2. Tenant receives invite, opens the app, creates account
3. Tenant verifies email (OTP)
4. Tenant verifies phone number (SMS OTP)
5. Tenant sets password
6. Tenant enables biometrics (Face ID / Touch ID)
7. Tenant lands on their dashboard

**Business Rules:**
- A tenant must complete all onboarding steps before accessing the app
- Onboarding status tracks progress: `NEW` → `EMAIL_VERIFIED` → `PHONE_VERIFIED` → `PASSWORD_SET` → `ONBOARDED`
- A tenant can only be associated with one active lease at a time
- If a tenant signs in from a new device, they must re-verify (email + phone OTP)

### 3.2 Property Management
> New feature — manager creates and manages properties

1. Manager adds a property (address, type, bedrooms, bathrooms, rent amount, description, photos)
2. Property appears in their property list with status badge
3. Manager can edit property details or upload property photos (stored in blob storage)
4. Manager can change property status (VACANT → LISTED → OCCUPIED → MAINTENANCE)

**Business Rules:**
- A property must have an address, type, and rent amount at minimum
- Property status transitions:
  - `VACANT` → `LISTED` or `OCCUPIED`
  - `LISTED` → `OCCUPIED` or `VACANT`
  - `OCCUPIED` → `MAINTENANCE` or `VACANT` (only when no active lease)
  - `MAINTENANCE` → `OCCUPIED` or `VACANT`
- A property cannot be deleted if it has an active lease
- Property photos are stored in Azure Blob Storage (same infra as profile photos)

### 3.3 Lease Management
> New feature — links tenants to properties

1. Manager creates a lease: selects a property, assigns a tenant, sets dates and rent terms
2. Tenant receives a notification that a lease is available to review
3. Manager sends a document request for the signed lease
4. Tenant uploads the signed lease document
5. Manager activates the lease
6. When a lease approaches its end date, both parties receive expiry notifications

**Business Rules:**
- A lease requires: property, tenant, start date, end date, monthly rent, security deposit
- Lease status flow: `PENDING` → `ACTIVE` → `EXPIRED` or `TERMINATED`
- Only one `ACTIVE` lease per property at a time
- Only one `ACTIVE` lease per tenant at a time
- A lease cannot be activated if the property is not in `OCCUPIED` or `LISTED` status
- A lease cannot be manually activated if its start date is in the future
- `PENDING` leases are auto-activated by a nightly scheduler when their start date arrives
- When a lease is created with a start date on or before today, it is auto-activated immediately
- When a lease becomes `ACTIVE`, the property status should be set to `OCCUPIED`
- Lease expiry notifications are sent 60 days, 30 days, and 7 days before end date
- A `TERMINATED` lease cannot be reactivated
- All date comparisons use UTC to avoid timezone-related off-by-one errors

### 3.4 Maintenance Requests
> New feature — core tenant interaction

1. Tenant submits a maintenance request: title, description, category, priority, optional photos
2. Manager receives a push notification
3. Manager reviews and updates the status (OPEN → IN_PROGRESS → RESOLVED)
4. Tenant receives a push notification on each status change
5. Manager or tenant can close the resolved request

**Business Rules:**
- A maintenance request requires: title, description, category
- Priority levels: `LOW`, `MEDIUM` (default), `HIGH`, `EMERGENCY`
- Categories: `PLUMBING`, `ELECTRICAL`, `HVAC`, `APPLIANCE`, `STRUCTURAL`, `PEST_CONTROL`, `OTHER`
- Status flow: `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`
- Only the manager can move a request to `IN_PROGRESS` or `RESOLVED`
- Either party can move `RESOLVED` → `CLOSED`
- `EMERGENCY` priority requests trigger an immediate push notification to the manager
- A tenant can only submit maintenance requests for properties they have an active lease on
- Photos are stored in Azure Blob Storage

### 3.5 Rent Payments (Stripe Test Mode)
> New feature — tenant pays rent via Stripe Checkout

1. System generates a rent payment record on the 1st of each month (or lease start date)
2. Tenant receives a push notification that rent is due
3. Tenant opens the app, taps "Pay Rent" on the dashboard or payments screen
4. App creates a Stripe Checkout Session and opens it in an in-app browser
5. Tenant completes payment using Stripe's test card (`4242 4242 4242 4242`)
6. Stripe webhook fires `checkout.session.completed`
7. Backend updates the payment status to `PAID`, records `paidAt` timestamp
8. Manager receives a `PAYMENT_RECEIVED` notification
9. If payment is not received by due date + 5 days, status moves to `OVERDUE`

**Business Rules:**
- Payments are auto-generated monthly based on active leases
- Payment amount comes from the lease's `monthlyRent` field
- Due date is the 1st of each month (or lease start date for the first month)
- Payment status flow: `UPCOMING` → `PENDING` (on due date) → `PAID` or `OVERDUE`
- `UPCOMING` payments transition to `PENDING` automatically via nightly scheduler when their due date arrives
- Rent due reminders are sent automatically 3 days before due date via daily scheduler
- `OVERDUE` payments can still be paid (moves to `PAID`)
- Grace period: 5 days after due date before marking `OVERDUE`
- Stripe runs in **test mode only** — no real money ever processed
- Stripe Checkout handles all card UI, validation, and 3D Secure — we never touch card data
- Payment history is viewable by both tenant and manager
- A tenant can only pay rent for their active lease

### 3.6 Lease Renewal
> New feature — dedicated flow for renewing expiring leases

1. Manager initiates a renewal: selects an expiring/active lease, sets new terms (dates, rent)
2. System creates a new lease in `PENDING` status, linked to the original lease
3. Tenant receives a `LEASE_RENEWAL` notification
4. Manager sends a document request for the signed renewal agreement
5. Tenant uploads the signed renewal document
6. Manager activates the new lease; the old lease moves to `EXPIRED`

**Business Rules:**
- A renewal can only be created from an `ACTIVE` or `EXPIRED` lease
- The new lease's start date must be on or after the original lease's end date
- The renewal inherits the same property and tenant
- Rent amount can change on renewal
- When the new lease is activated, the original lease is automatically `EXPIRED`
- Only one pending renewal can exist per lease at a time
- A renewal cannot be manually activated if its start date is in the future (same rule as regular leases)

### 3.7 Document Management
> Existing feature, updated for property management context

1. Manager sends a document request to a tenant (e.g., proof of identity, signed lease)
2. Tenant receives a notification with the request
3. Tenant uploads the document through the app
4. Manager can view/download uploaded documents
5. Documents are organized into folders

**Document Folders:**
| Folder | Purpose |
|--------|---------|
| `IDENTIFICATION` | Proof of identity, photo ID |
| `LEASE_AGREEMENTS` | Signed leases, lease amendments |
| `SIGNED_DOCUMENTS` | Any other signed documents |
| `INSPECTION_REPORTS` | Move-in/move-out inspection reports |
| `INSURANCE` | Renter's insurance, property insurance |
| `OTHER` | Miscellaneous documents |

**Document Request Types:**
| Type | Purpose |
|------|---------|
| `PROOF_OF_ADDRESS` | Verify tenant's previous address |
| `PROOF_OF_IDENTITY` | Verify tenant's identity |
| `SIGNED_LEASE` | Request signed lease document |
| `MOVE_IN_CHECKLIST` | Move-in condition checklist |

**Business Rules:**
- Documents belong to a tenant, optionally linked to a property
- A document request has status: `PENDING` → `UPLOADED` or `CANCELED`
- Only managers can create document requests
- Only the assigned tenant can upload against a document request
- Documents are stored in Azure Blob Storage with signed URLs for upload/download
- Document metadata includes: name, folder, size, content type, upload date
- Document access is scoped: a tenant can only view/download their own documents; managers can access all

### 3.8 Notifications
> Existing feature, extended with new action types

**Notification Triggers:**
| Event | Recipient | Action Type |
|-------|-----------|-------------|
| Lease available for review | Tenant | `SIGN_LEASE` |
| Document request created | Tenant | `UPLOAD_DOCUMENT` |
| Document uploaded by tenant | Manager | `BASIC_COMPLETE` |
| Maintenance request submitted | Manager | `MAINTENANCE_UPDATE` |
| Maintenance status changed | Tenant | `MAINTENANCE_UPDATE` |
| Lease expiry approaching | Both | `LEASE_EXPIRY` |
| Rent due reminder | Tenant | `RENT_REMINDER` |
| Payment confirmed | Manager | `PAYMENT_RECEIVED` |
| Payment overdue | Tenant | `PAYMENT_OVERDUE` |
| Inspection scheduled | Tenant | `INSPECTION_SCHEDULED` |
| Lease renewal available | Tenant | `LEASE_RENEWAL` |

**Business Rules:**
- Notifications are delivered via push (Expo) and stored in-app
- Tenants can configure notification preferences (email, push, per-category)
- Unread notifications are indicated with a badge count
- Notifications can link to a related document or maintenance request
- Mark-all-as-read is supported

---

## 4. Entity Model

### PropertyManager (renamed from Employee)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | String | Unique |
| name | String | |
| role | ROLE | `ADMIN` or `AGENT` |
| deviceId | String? | For device recognition |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

### Tenant (renamed from Client)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | String | Unique |
| name | String | |
| phoneNumber | String | For SMS verification |
| status | STATUS | `INVITED`, `ACTIVE`, `INACTIVE` |
| onboardingStatus | ONBOARDING_STATUS | Tracks onboarding progress |
| profilePhoto | String? | Blob storage key |
| pushToken | String? | Expo push token |
| deviceId | String? | For device recognition |
| onboardingToken | String? | Invite token |
| receivesEmailNotifications | Boolean | Default false |
| receivesPushNotifications | Boolean | Default false |
| receivesNotificationsForMaintenance | Boolean | Default false |
| receivesNotificationsForDocuments | Boolean | Default false |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

### Property (new)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| managerId | UUID | FK → PropertyManager |
| address | String | Full street address |
| city | String | |
| state | String | |
| zipCode | String | |
| propertyType | PROPERTY_TYPE | `APARTMENT`, `HOUSE`, `CONDO`, `TOWNHOUSE`, `STUDIO` |
| bedrooms | Int | |
| bathrooms | Float | Supports half baths (1.5) |
| sqft | Int? | Optional square footage |
| rentAmount | Float | Monthly rent in dollars |
| status | PROPERTY_STATUS | `VACANT`, `LISTED`, `OCCUPIED`, `MAINTENANCE` |
| description | String? | Free text description |
| photos | String[] | Blob storage keys (gallery, multiple images) |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

### Lease (new)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| propertyId | UUID | FK → Property |
| tenantId | UUID | FK → Tenant |
| startDate | DateTime | Lease start |
| endDate | DateTime | Lease end |
| monthlyRent | Float | May differ from property's listed rent |
| securityDeposit | Float | |
| status | LEASE_STATUS | `PENDING`, `ACTIVE`, `EXPIRED`, `TERMINATED` |
| renewedFromLeaseId | UUID? | FK → Lease (self-ref, for renewals) |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

### MaintenanceRequest (new)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| propertyId | UUID | FK → Property |
| tenantId | UUID | FK → Tenant |
| title | String | Short description |
| description | String | Detailed description |
| priority | MAINTENANCE_PRIORITY | `LOW`, `MEDIUM`, `HIGH`, `EMERGENCY` |
| status | MAINTENANCE_STATUS | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| category | MAINTENANCE_CATEGORY | `PLUMBING`, `ELECTRICAL`, `HVAC`, etc. |
| photos | String[] | Blob storage keys |
| resolvedAt | DateTime? | When marked resolved |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

### Document (existing, updated)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| tenantId | UUID | FK → Tenant (renamed from clientId) |
| propertyId | UUID? | FK → Property (new, optional) |
| name | String | File name |
| folder | DOCUMENT_FOLDER | Updated enum values |
| blobStorageKey | String | Azure Blob Storage path |
| contentType | String | MIME type |
| size | Int | File size in bytes |
| viewedAt | DateTime? | Last viewed |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

### Notification (existing, updated)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| personId | UUID | FK → tenant or manager |
| title | String | |
| body | String | |
| type | NotificationType | `INFO` or `ACTION` |
| actionType | ActionType? | Extended with new types |
| isRead | Boolean | |
| linkedDocumentId | UUID? | FK → Document |
| linkedMaintenanceRequestId | UUID? | Renamed from linkedTransactionId |
| linkedPaymentId | UUID? | FK → Payment |
| createdAt | DateTime | |

### Payment (new)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| leaseId | UUID | FK → Lease |
| tenantId | UUID | FK → Tenant |
| amount | Float | Rent amount for this period |
| dueDate | DateTime | When payment is due |
| status | PAYMENT_STATUS | `UPCOMING`, `PENDING`, `PAID`, `OVERDUE` |
| stripeCheckoutSessionId | String? | Stripe Checkout session ID |
| stripePaymentIntentId | String? | Stripe PaymentIntent ID (from webhook) |
| paidAt | DateTime? | When payment was confirmed |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

---

## 5. API Endpoints

### Existing (renamed)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/sign-in` | Sign in |
| POST | `/auth/sign-up` | Create account |
| POST | `/auth/social/microsoft` | OAuth sign-in |
| POST | `/auth/forgot-password` | Initiate password reset |
| POST | `/auth/reset-password` | Complete password reset |
| POST | `/auth/phone-otp/send` | Send phone OTP |
| POST | `/auth/phone-otp/verify` | Verify phone OTP |
| POST | `/auth/email-otp/send` | Send email OTP |
| POST | `/auth/email-otp/verify` | Verify email OTP |
| POST | `/auth/2fa/enable` | Enable 2FA |
| GET | `/me` | Get current user |
| POST | `/tenants` | Create tenant (was /clients) |
| PATCH | `/tenants/:id/status` | Update tenant status |
| DELETE | `/tenants/:id` | Delete tenant |
| POST | `/tenants/:id/profile-photo` | Upload profile photo |
| GET | `/tenants/:id/profile-photo` | Download profile photo |
| PATCH | `/tenants/password` | Set password |
| PATCH | `/tenants/notification-preferences` | Update notification prefs |
| POST | `/documents/upload` | Get signed upload URL |
| POST | `/documents/:id/confirm-upload` | Confirm upload |
| GET | `/documents/:id` | Get document |
| GET | `/documents` | List documents |
| GET | `/documents/folder-summary` | Folder statistics |
| GET | `/documents/:id/download` | Download document |
| POST | `/document-requests` | Create document request |
| GET | `/document-requests/:id` | Get document request |
| GET | `/document-requests` | List document requests |
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread` | Check unread |
| POST | `/notifications` | Create notification |
| PATCH | `/notifications/:id` | Update notification |
| PATCH | `/notifications/read-all` | Mark all read |

### New Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/properties` | Create property |
| GET | `/properties` | List manager's properties |
| GET | `/properties/:id` | Get property details |
| PUT | `/properties/:id` | Update property |
| DELETE | `/properties/:id` | Delete property |
| POST | `/properties/:id/photos` | Upload property photos |
| POST | `/leases` | Create lease |
| GET | `/leases/property/:propertyId` | Leases by property |
| GET | `/leases/tenant` | Current tenant's leases |
| GET | `/leases/:id` | Get lease details |
| PATCH | `/leases/:id/status` | Update lease status |
| POST | `/maintenance-requests` | Submit maintenance request |
| GET | `/maintenance-requests/property/:propertyId` | Requests by property |
| GET | `/maintenance-requests/tenant` | Current tenant's requests |
| GET | `/maintenance-requests/:id` | Get request details |
| PATCH | `/maintenance-requests/:id` | Update request |
| POST | `/maintenance-requests/:id/photos` | Upload request photos |
| POST | `/leases/:id/renew` | Initiate lease renewal |
| GET | `/payments` | List payments (filtered by lease or tenant) |
| GET | `/payments/:id` | Get payment details |
| POST | `/payments/:id/checkout` | Create Stripe Checkout Session |
| POST | `/payments/webhook` | Stripe webhook handler |

---

## 6. Mobile App Screens

### Tenant Experience (primary)

| Screen | Description |
|--------|-------------|
| **Splash** | Animated splash with LeaseLink branding |
| **Sign In** | Email + password, biometric unlock |
| **Onboarding** (multi-step) | Email verify → Phone verify → Set password → Enable biometrics |
| **Forgot Password** | Email → Check email → Reset → Success |
| **New Device** | Re-verification flow for unrecognized devices |
| **Home / Dashboard** | Property summary card, lease status, next rent due, recent maintenance |
| **Maintenance** | List of maintenance requests with status filters |
| **Maintenance — Submit** | Form: title, description, category, priority, photo picker |
| **Maintenance — Detail** | Full request details, status timeline, photos |
| **Payments** | Payment history list with status filters (upcoming, pending, paid, overdue) |
| **Payments — Pay** | Stripe Checkout flow (in-app browser) |
| **Documents** | Folder-based document browser, pending requests |
| **Documents — Folder** | Documents within a folder |
| **Upload Document** | File/photo picker with folder selection |
| **Notifications** | In-app notification center with unread badge |
| **Profile** | View/edit profile, security settings, notification preferences, support, logout |

### Tab Navigation (bottom bar)
1. **Home** — Dashboard with property + lease summary, next payment due
2. **Maintenance** — Submit and track requests
3. **Payments** — Payment history and pay rent
4. **Documents** — View and upload documents
5. **Notifications** — Notification center

---

## 7. Web Dashboard (Property Manager)

> New application — Next.js + shadcn/ui

The web dashboard is the property manager's primary interface. All manager-side actions happen here.

### 7.1 Authentication

| Page | Description |
|------|-------------|
| **Sign In** | Email + password login |
| **Forgot Password** | Email → reset link → new password |
| **2FA Setup** | Optional TOTP-based two-factor authentication |

**Business Rules:**
- Managers sign in via the web dashboard, not the mobile app
- Session management via HTTP-only cookies (same JWT/auth system as mobile)
- Inactive sessions expire after 24 hours
- 2FA is optional but encouraged

### 7.2 Dashboard (Home)

The landing page after sign-in. At-a-glance overview of the manager's portfolio.

| Widget | Content |
|--------|---------|
| **Portfolio Summary** | Total properties, occupied vs vacant, total tenants |
| **Revenue Overview** | Monthly rent expected, collected, overdue (current month) |
| **Upcoming Lease Expirations** | Leases expiring in the next 60 days |
| **Open Maintenance** | Count by priority, recent emergency requests |
| **Pending Actions** | Document requests awaiting upload, pending lease activations |
| **Recent Activity** | Timeline of recent events across all properties |

### 7.3 Properties

| Page | Description |
|------|-------------|
| **Property List** | Sortable/filterable table of all properties with status badges, search, and bulk actions |
| **Property Detail** | Full property info, photo gallery, current tenant, lease history, maintenance history, documents |
| **Create Property** | Multi-step form: address → details (type, beds, baths, sqft) → rent → photos → review |
| **Edit Property** | Inline edit of property details, photo management (add/remove/reorder) |

**Features:**
- Filter by status (vacant, listed, occupied, maintenance)
- Search by address, city, or tenant name
- Status badge with color coding
- Quick actions: change status, create lease, view tenant
- Photo gallery with drag-and-drop upload, reorder, and delete
- Map view of property address (embedded Google Maps / Mapbox)

### 7.4 Tenants

| Page | Description |
|------|-------------|
| **Tenant List** | Table of all tenants with status, property, lease info, and onboarding progress |
| **Tenant Detail** | Profile info, current lease, payment history, documents, maintenance requests |
| **Invite Tenant** | Form: name, email, phone → sends invite email |

**Features:**
- Filter by status (invited, active, inactive), onboarding status
- Search by name, email, or property
- View onboarding progress (which steps completed)
- Quick actions: resend invite, view documents, view payments
- Tenant detail page aggregates all related data in tabs

### 7.5 Leases

| Page | Description |
|------|-------------|
| **Lease List** | Table of all leases with status, property, tenant, dates, rent amount |
| **Lease Detail** | Full lease info, payment history, linked documents, renewal history |
| **Create Lease** | Form: select property → select/invite tenant → dates → rent terms → security deposit → review |
| **Renew Lease** | Pre-filled form from existing lease: adjust dates, rent → creates linked renewal |

**Features:**
- Filter by status (pending, active, expired, terminated)
- Expiry warnings (color-coded: red < 30 days, yellow < 60 days)
- Activate lease action (with confirmation modal showing business rule checks)
- Terminate lease action (with reason field)
- Renewal chain view: see the history of renewals for a property
- Auto-generate document request for signed lease on creation

### 7.6 Maintenance

| Page | Description |
|------|-------------|
| **Maintenance List** | Table/Kanban board of all requests across properties |
| **Maintenance Detail** | Full request info, tenant details, photos, status timeline, notes |

**Features:**
- Toggle between table view and Kanban board (columns: Open → In Progress → Resolved → Closed)
- Filter by property, priority, category, status
- Emergency requests highlighted with red badge
- Status update with notes (manager adds context on each transition)
- Photo viewer for tenant-submitted photos
- Link to related property and tenant

### 7.7 Payments

| Page | Description |
|------|-------------|
| **Payments Overview** | Monthly summary: expected vs collected vs overdue, list of all payments |
| **Payment Detail** | Individual payment info, Stripe session details, lease reference |

**Features:**
- Filter by status (upcoming, pending, paid, overdue), month, property, tenant
- Monthly/yearly revenue summary
- Overdue payments highlighted with tenant contact info
- Export payment data as CSV
- Link to Stripe Dashboard for payment details (test mode)

### 7.8 Documents

| Page | Description |
|------|-------------|
| **Document List** | All documents across tenants, filterable by folder, tenant, property |
| **Document Requests** | Pending and completed document requests |
| **Create Request** | Form: select tenant → request type → optional message |

**Features:**
- Filter by folder, tenant, property, upload date
- Preview documents in-browser (PDF, images)
- Download individual documents or bulk download as ZIP
- Track request status (pending, uploaded, canceled)
- View upload date, file size, content type

### 7.9 Notifications

Not a dedicated page — notifications appear as:
- **Bell icon** in the top navigation bar with unread count badge
- **Dropdown panel** showing recent notifications with mark-as-read
- **Toast notifications** for real-time events (new maintenance request, payment received)

Notification events relevant to managers:
- New maintenance request submitted (especially emergency)
- Document uploaded by tenant
- Payment received
- Payment overdue
- Lease expiring soon

### 7.10 Settings

| Page | Description |
|------|-------------|
| **Profile** | Edit name, email, password |
| **Security** | Enable/disable 2FA, view active sessions |
| **Team** (future) | Placeholder for managing multiple agents under one account |

---

## 8. Web Dashboard Technical Details

### Tech Stack
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14+ (App Router) | SSR/SSG, file-based routing, React Server Components |
| UI Library | shadcn/ui + Tailwind CSS | Polished, accessible components, fast to build, looks professional |
| State | TanStack Query | Consistent with mobile, handles server state caching |
| Forms | React Hook Form + Zod | Type-safe validation, good DX |
| Tables | TanStack Table | Feature-rich (sorting, filtering, pagination), headless |
| Charts | Recharts | Simple, composable, works well with shadcn |
| Auth | Same JWT system as mobile | Shared backend, HTTP-only cookies for web |
| API Client | Generated from OpenAPI spec (orval or similar) | Type-safe API calls, stays in sync with backend |

### Layout Structure
```
├── (auth)/
│   ├── sign-in/
│   ├── forgot-password/
│   └── reset-password/
├── (dashboard)/
│   ├── layout.tsx          ← Sidebar + top nav + notification bell
│   ├── page.tsx            ← Dashboard home
│   ├── properties/
│   │   ├── page.tsx        ← Property list
│   │   ├── new/
│   │   └── [id]/
│   │       ├── page.tsx    ← Property detail
│   │       └── edit/
│   ├── tenants/
│   │   ├── page.tsx        ← Tenant list
│   │   ├── invite/
│   │   └── [id]/
│   ├── leases/
│   │   ├── page.tsx        ← Lease list
│   │   ├── new/
│   │   ├── [id]/
│   │   └── [id]/renew/
│   ├── maintenance/
│   │   └── page.tsx        ← Kanban + table view
│   │   └── [id]/
│   ├── payments/
│   │   └── page.tsx        ← Payment overview
│   │   └── [id]/
│   ├── documents/
│   │   ├── page.tsx        ← Document list
│   │   └── requests/
│   └── settings/
│       ├── profile/
│       └── security/
```

### Responsive Design
- **Desktop-first** — primary use case is managers on laptops/desktops
- Sidebar collapses to icon-only on medium screens
- Tables switch to card layout on small screens
- Minimum supported width: 768px (tablet)
- No mobile-specific optimizations (tenants use the native app)

---

## 8.5 Authorization & Data Isolation

**Global Rules (apply to ALL endpoints):**
- All endpoints require authentication via `EnhancedAuthGuard` (global) unless explicitly `@Public()`
- Manager-only endpoints use `EmployeeOnlyGuard`
- **Tenant data isolation**: A tenant (CLIENT) can only access their own data — profile, documents, payments, notifications, maintenance requests. Any endpoint accepting a resource ID must verify the resource belongs to the requesting tenant.
- **Manager access**: Managers (EMPLOYEE) can access all tenant data for management purposes
- Endpoints that accept a `clientId` or `tenantId` in the body/URL must verify it matches the authenticated user (for CLIENT type) or allow through (for EMPLOYEE type)
- Document upload/download, profile photo, and notification endpoints must enforce ownership

---

## 9. Enterprise Features (v1.1)

### 9.1 E-Signatures
> Digital lease signing via embedded signature pad

1. Manager sends lease document for e-signature
2. Tenant opens document in-app, signs via touch/draw pad
3. System embeds signature into document, marks as signed
4. Both parties receive signed copy

**Business Rules:**
- E-signature uses an embedded canvas (no third-party service like DocuSign for v1)
- Signed documents are stored as a new version in blob storage
- Signature metadata (IP, timestamp, device) is stored for audit trail
- Only documents with `LEASE_AGREEMENTS` or `SIGNED_DOCUMENTS` folder types can be signed
- A document can only be signed once — re-signing creates a new document version

**Entity: Signature**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| documentId | UUID | FK → Document |
| signedBy | UUID | FK → Tenant or Manager |
| signatureImageKey | String | Blob storage key for signature image |
| ipAddress | String | Signer's IP address |
| userAgent | String | Signer's browser/device |
| signedAt | DateTime | Timestamp |

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/documents/:id/sign` | Submit signature for a document |
| GET | `/documents/:id/signature` | Get signature details for a document |

### 9.2 Expense Tracking
> Track property-related expenses beyond rent

1. Manager logs an expense: property, category, amount, date, description, receipt photo
2. Expenses appear on property detail and in expense reports
3. Monthly expense summary on dashboard

**Business Rules:**
- Expense categories: `MAINTENANCE`, `INSURANCE`, `TAX`, `UTILITY`, `MANAGEMENT_FEE`, `REPAIR`, `IMPROVEMENT`, `OTHER`
- Expenses are linked to a property (required) and optionally to a maintenance request
- Receipt photos stored in blob storage
- Expenses are manager-only — tenants cannot see them

**Entity: Expense**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| propertyId | UUID | FK → Property |
| managerId | UUID | FK → PropertyManager |
| maintenanceRequestId | UUID? | FK → MaintenanceRequest (optional link) |
| category | EXPENSE_CATEGORY | Enum |
| amount | Float | Dollar amount |
| description | String | What was the expense for |
| receiptBlobKey | String? | Blob storage key for receipt photo |
| expenseDate | DateTime | When the expense occurred |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/expenses` | Create expense (manager only) |
| GET | `/expenses` | List expenses (filterable by property, category, date range) |
| GET | `/expenses/:id` | Get expense details |
| PUT | `/expenses/:id` | Update expense |
| DELETE | `/expenses/:id` | Delete expense |
| POST | `/expenses/:id/receipt` | Upload receipt photo |
| GET | `/expenses/summary` | Monthly expense summary by property |

### 9.3 Vendor Management
> Track maintenance vendors/contractors

1. Manager adds a vendor: name, trade/specialty, phone, email, notes
2. When updating a maintenance request, manager can assign a vendor
3. Vendor contact info visible on maintenance request detail

**Business Rules:**
- Vendors are managed per-manager (each manager has their own vendor list)
- Vendor specialties map to maintenance categories (PLUMBING, ELECTRICAL, etc.)
- A vendor can be assigned to multiple maintenance requests
- Vendors have no app login — they're a contact reference only

**Entity: Vendor**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| managerId | UUID | FK → PropertyManager |
| name | String | Company or individual name |
| specialty | MAINTENANCE_CATEGORY | Primary trade |
| phone | String? | Contact phone |
| email | String? | Contact email |
| notes | String? | Free text notes |
| createdAt | DateTime | |
| updatedAt | DateTime? | |

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/vendors` | Create vendor (manager only) |
| GET | `/vendors` | List vendors (filterable by specialty) |
| GET | `/vendors/:id` | Get vendor details |
| PUT | `/vendors/:id` | Update vendor |
| DELETE | `/vendors/:id` | Delete vendor |

**MaintenanceRequest update:** Add optional `vendorId` field (FK → Vendor) to assign a vendor to a request.

### 9.4 Audit Logs
> Track all significant actions for accountability

1. System automatically logs: who did what, when, to which resource
2. Manager can view audit log in settings
3. Log is append-only — cannot be edited or deleted

**Business Rules:**
- Audit events are immutable — no updates or deletes
- Events track: actor (user ID + type), action, resource type, resource ID, timestamp, metadata (JSON)
- Action types: `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `LOGIN`, `UPLOAD`, `DOWNLOAD`, `SIGN`
- Resource types: `PROPERTY`, `LEASE`, `TENANT`, `PAYMENT`, `MAINTENANCE_REQUEST`, `DOCUMENT`, `EXPENSE`, `VENDOR`
- Audit logs are manager-only — tenants cannot access the audit trail

**Entity: AuditLog**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| actorId | UUID | Who performed the action |
| actorType | String | `EMPLOYEE` or `CLIENT` |
| action | AUDIT_ACTION | Enum |
| resourceType | AUDIT_RESOURCE_TYPE | Enum |
| resourceId | UUID | Which resource was affected |
| metadata | JSON? | Additional context (old/new values, etc.) |
| createdAt | DateTime | Immutable timestamp |

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/audit-logs` | List audit logs (filterable by resource type, action, actor, date range) |
| GET | `/audit-logs/:resourceType/:resourceId` | Get audit trail for a specific resource |

### 9.5 Nice-to-Haves (v1.1)

- **CSV Export** — Export payment history, expense reports, tenant lists as CSV from the web dashboard
- **2FA Settings** — Full TOTP-based two-factor authentication setup in web dashboard settings
- **Lease Expiry Notifications** — Scheduled notifications at 60, 30, and 7 days before lease end date
- **Payment Overdue Notifications** — Automatic PAYMENT_OVERDUE notifications when grace period expires
- **Property Detail Page** — Tabbed view with current tenant, lease history, maintenance history, documents, expenses
- **Tenant Detail Page** — Tabbed view with current lease, payment history, documents, maintenance requests

---

## 10. Out of Scope (v1)

The following are explicitly excluded from the initial build:

- **Manager-facing mobile app** — Managers use the web dashboard only. No native mobile app for managers.
- **Multi-property tenants** — A tenant can only have one active lease at a time.
- **Chat/messaging** — No direct messaging between manager and tenant. Communication happens through notifications and document requests.
- **Lease document generation** — Leases are uploaded as documents, not generated by the system.
- **Property listing/marketplace** — No public-facing property search. Properties are managed internally.
- **Advanced analytics** — Dashboard has summary widgets but no deep reporting, custom date ranges, or exportable reports beyond CSV payment export.
- **Real payment processing** — Stripe runs in test mode only. No real money flows.

---

## 11. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payments | Stripe Checkout (test mode) | Industry standard, no card data touches our server, great portfolio signal |
| Auth | Keep Better Auth + JWT + MFA | Already built and tested |
| File storage | Keep Azure Blob Storage | Already integrated for documents and photos |
| Push notifications | Keep Expo push | Already integrated for mobile |
| SMS | Keep Twilio | Already integrated for OTP |
| Email | Keep Nodemailer | Already integrated |
| API style | REST with OpenAPI/Swagger | Existing pattern, enables codegen for mobile and web |
| Database | PostgreSQL + Prisma | Existing stack |
| Web framework | Next.js 14+ (App Router) | SSR, file-based routing, React Server Components |
| Web UI | shadcn/ui + Tailwind CSS | Polished, accessible, fast to build |
| Web tables | TanStack Table | Headless table with sorting, filtering, pagination |
| Web forms | React Hook Form + Zod | Type-safe validation |
| Web charts | Recharts | Dashboard visualizations |
| Web API client | Generated from OpenAPI (orval) | Type-safe, stays in sync with backend |
| Mobile state | TanStack Query + Jotai | Existing pattern |
| Mobile navigation | Expo Router (file-based) | Existing pattern |
| Testing | Vitest (backend) + Playwright (web) + Jest (mobile) + Maestro (E2E mobile) | Full coverage across all apps |

---

## 12. Repository Structure

Turborepo monorepo with npm workspaces.

```
leaselink/
├── apps/
│   ├── api/              ← NestJS REST API (@leaselink/api)
│   ├── web/              ← Next.js manager dashboard (@leaselink/web)
│   └── mobile/           ← Expo React Native tenant app (@leaselink/mobile)
├── packages/
│   └── shared/           ← Shared types, enums, constants (@leaselink/shared)
├── turbo.json
├── package.json
└── PRODUCT_SPEC.md
```

### Shared Package (`@leaselink/shared`)
Contains code shared across all three apps:
- **Enums** — PropertyType, LeaseStatus, PaymentStatus, MaintenanceCategory, etc.
- **Constants** — grace periods, pagination defaults, status transition maps
- **Validation schemas** — Zod schemas for shared data structures (future)

All apps import from `@leaselink/shared` to ensure type consistency across the stack.

### Dev Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in parallel |
| `npm run dev:api` | Start API only |
| `npm run dev:web` | Start web dashboard only |
| `npm run dev:mobile` | Start mobile app only |
| `npm run build` | Build all apps |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all apps |

---

## 13. Resolved Decisions

- [x] **Property photos** — Gallery (multiple images), stored as `String[]` blob storage keys
- [x] **Maintenance request photos** — Stored as Documents in the document system (reuses existing blob storage + document infrastructure)
- [x] **Lease renewal** — Dedicated flow with `renewedFromLeaseId` linking new lease to original
- [x] **Payments** — Stripe Checkout in test mode. Full payment flow with auto-generated monthly records, webhook confirmation, and payment history
