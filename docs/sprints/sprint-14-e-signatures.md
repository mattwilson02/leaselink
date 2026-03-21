# Sprint 14: E-Signatures — Digital Document Signing

## Overview

This sprint adds e-signature capability so tenants can sign lease agreements and other documents directly from their mobile device, and property managers can verify signatures from the web dashboard. This was explicitly deferred from Sprint 11 as it requires a different UI paradigm (embedded signature canvas, signature image storage).

**Goal:** Tenants can digitally sign documents. Managers can request signatures, view signature images, and verify signing metadata. All signature events are audit-logged.

**Scope:** Backend (new Signature domain), Mobile (signature capture screen), Web (signature viewer on document detail). Shared types/DTOs.

---

## What Exists

| Layer | Status |
|-------|--------|
| **Prisma** | `Document` model with `folder` (LEASE_AGREEMENTS, SIGNED_DOCUMENTS eligible for signing), no Signature model yet |
| **Shared Enums** | `AuditAction.SIGN` exists, `ActionType.SIGN_DOCUMENT` and `ActionType.SIGN_LEASE` exist, `AuditResourceType.DOCUMENT` exists |
| **API — Documents** | Full CRUD: upload, confirm-upload, get-by-id, download, view, folder-summary |
| **API — Notifications** | `CreateNotificationUseCase` accepts `linkedDocumentId`, ActionType includes SIGN_DOCUMENT/SIGN_LEASE |
| **API — Audit** | `CreateAuditLogUseCase` with SIGN action ready |
| **API — Blob Storage** | `StorageRepository` with `generateUploadUrl`, `blobExists`, `generateDownloadUrl` |
| **Mobile** | Document detail screen at `app/(main)/documents/[id].tsx`, upload flow with blob storage pattern |
| **Web** | Document detail page at `apps/web/src/app/(dashboard)/documents/[id]/page.tsx` with preview + download |

---

## Architectural Decisions

1. **Signature as its own domain** — Create `domain/signature/` following the same DDD structure as `domain/document/`. Signatures are a distinct bounded context (signing ≠ document storage), with their own entity, repository, use cases, and errors.

2. **Signature image stored in blob storage** — The signature canvas produces a PNG. Store it using the existing blob storage pattern (generate upload URL → client uploads → confirm). The blob key is saved on the Signature record.

3. **One signature per document** — A document can only be signed once. Re-signing requires a new document version (upload a new version, then sign that). This keeps the model simple and the audit trail immutable.

4. **Signature request via DocumentRequest** — No new request model. Managers create a `DocumentRequest` with `requestType: SIGNED_LEASE` to request a tenant's signature. The existing document request flow already handles this — the tenant sees the pending request and navigates to sign.

5. **Signing metadata captured for legal compliance** — IP address, user agent, and timestamp are recorded on the Signature record for audit/legal purposes. The controller extracts these from the request context.

---

## Task 1: Shared Types & Prisma Schema (Backend Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/prisma/schema.prisma` | Modify | Add Signature model |
| `packages/shared/src/types/signature.ts` | Create | Signature type definition |
| `packages/shared/src/types/index.ts` | Modify | Export signature types |
| `packages/shared/src/dto/signature.dto.ts` | Create | Signature DTO + Zod schemas |
| `packages/shared/src/dto/index.ts` | Modify | Export signature DTO |

### Requirements

#### Prisma Signature Model

Add after the `AuditLog` model:

```
model Signature {
  id               String   @id @default(uuid())
  documentId       String   @unique @map("document_id")
  signedBy         String   @map("signed_by")
  signatureImageKey String  @map("signature_image_key")
  ipAddress        String?  @map("ip_address")
  userAgent        String?  @map("user_agent")
  signedAt         DateTime @default(now()) @map("signed_at")

  document Document @relation(fields: [documentId], references: [id])
  signer   Client   @relation(fields: [signedBy], references: [id])

  @@index([documentId])
  @@index([signedBy])
  @@map("signatures")
}
```

Also add to `Document` model: `signature Signature?`
Also add to `Client` model: `signatures Signature[]`

#### Shared Types

`Signature` type — follow the `Expense` type pattern:
- id, documentId, signedBy, signatureImageKey, ipAddress, userAgent, signedAt

#### Shared DTO

`SignatureDTO` — follow the `ExpenseDTO` pattern. Include Zod schemas:
- `createSignatureSchema`: `{ documentId: string }` (signature image is uploaded via blob, not base64)
- `signatureResponseSchema`: full signature fields

---

## Task 2: Signature Domain & API Endpoints (Backend Agent)

### Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/domain/signature/enterprise/entities/signature.ts` | Create | Signature entity |
| `apps/api/src/domain/signature/application/repositories/signature-repository.ts` | Create | Abstract repository |
| `apps/api/src/domain/signature/application/use-cases/sign-document.ts` | Create | Core signing use case (includes error classes) |
| `apps/api/src/domain/signature/application/use-cases/get-signature-by-document-id.ts` | Create | Fetch signature for a document |
| `apps/api/src/infra/database/prisma/repositories/prisma-signature-repository.ts` | Create | Prisma implementation |
| `apps/api/src/infra/database/prisma/mappers/prisma-signature-mapper.ts` | Create | Prisma ↔ Domain mapper |
| `apps/api/src/infra/http/controllers/sign-document/sign-document.controller.ts` | Create | POST /documents/:id/sign + POST /documents/:id/sign/upload |
| `apps/api/src/infra/http/controllers/get-signature/get-signature.controller.ts` | Create | GET /documents/:id/signature |
| `apps/api/src/infra/http/presenters/http-signature-presenter.ts` | Create | Signature → DTO |

### Requirements

#### Signature Entity

Follow the `Document` entity pattern. Properties:
- `id`, `documentId`, `signedBy`, `signatureImageKey`, `ipAddress`, `userAgent`, `signedAt`
- Factory method: `Signature.create(props, id?)`

#### SignatureRepository (Abstract)

```
abstract getByDocumentId(documentId: string): Promise<Signature | null>
abstract create(signature: Signature): Promise<Either<Error, Signature>>
```

#### SignDocumentUseCase

Request: `{ documentId, signedBy, signatureImageKey, ipAddress?, userAgent? }`

Steps:
1. Fetch document by ID → fail if not found (`DocumentNotFoundError`)
2. Validate document folder is `LEASE_AGREEMENTS` or `SIGNED_DOCUMENTS` → fail if not (`DocumentNotSignableError`)
3. Check no existing signature for this document → fail if exists (`DocumentAlreadySignedError`)
4. Verify signature image blob exists via `StorageRepository.blobExists()` → fail if not (`SignatureImageNotFoundError`)
5. Create Signature entity
6. Save via SignatureRepository
7. Create audit log: action=SIGN, resourceType=DOCUMENT, resourceId=documentId, metadata includes signedBy and ipAddress
8. Create notification for the document's manager: actionType=SIGN_DOCUMENT, linkedDocumentId=documentId
9. Return the Signature

#### GetSignatureByDocumentIdUseCase

Request: `{ documentId }`
Returns the signature if it exists, or a `SignatureNotFoundError`.

#### API Endpoints

**POST `/documents/:id/sign`**
- Auth: `EnhancedAuthGuard` (tenant must be the document's client)
- Body: `{ signatureImageKey: string }` (blob key from prior upload)
- Controller extracts `ipAddress` from `request.ip` and `userAgent` from `request.headers['user-agent']`
- Response: `201` with `{ signature: SignatureDTO }`
- Error map: 404 DocumentNotFound, 400 DocumentNotSignable, 409 DocumentAlreadySigned, 404 SignatureImageNotFound

**GET `/documents/:id/signature`**
- Auth: `EnhancedAuthGuard`
- Response: `200` with `{ signature: SignatureDTO }` or `404`
- Managers can view any signature; tenants can only view their own

#### Generate Signature Upload URL

Reuse the existing `POST /documents/upload` pattern. Before signing, the mobile client calls a new endpoint to get an upload URL for the signature image:

**POST `/documents/:id/sign/upload`**
- Auth: `EnhancedAuthGuard`
- Response: `201` with `{ uploadUrl: string, blobName: string }`
- Generates a SAS URL via `StorageRepository.generateUploadUrl()` with a descriptive blob name like `signatures/{documentId}/{uuid}.png`

Combine the upload endpoint into the `sign-document.controller.ts` file as a second route handler (same controller class, two methods).

---

## Task 3: Mobile Signature Capture (Mobile Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/mobile/app/(main)/documents/sign/[id].tsx` | Create | Signature capture screen |
| `apps/mobile/src/components/Documents/SignatureCanvas/index.tsx` | Create | Signature pad component |
| `apps/mobile/src/hooks/use-sign-document.ts` | Create | Signing mutation hook |
| `apps/mobile/app/(main)/documents/[id].tsx` | Modify | Add "Sign Document" button |

### Requirements

#### Signature Canvas Component

Use `react-native-signature-canvas` (already compatible with Expo):
- White canvas area with black ink
- "Clear" button to reset
- "Done" button to capture the signature as base64 PNG
- Landscape-friendly layout
- Minimum stroke validation — reject empty/trivial signatures (e.g., fewer than 10 points)

#### Sign Document Screen (`/documents/sign/[id]`)

Flow:
1. Show document name and signing disclaimer text: "By signing below, you acknowledge that you have read and agree to the terms of this document."
2. Render `SignatureCanvas`
3. On "Done":
   a. Convert canvas to PNG blob
   b. Call `POST /documents/:id/sign/upload` to get upload URL + blob name
   c. Upload PNG to blob storage using the URL
   d. Call `POST /documents/:id/sign` with `{ signatureImageKey: blobName }`
   e. Show success state and navigate back to document detail
4. Loading/error states throughout

#### Document Detail Screen Modification

- If document folder is `LEASE_AGREEMENTS` or `SIGNED_DOCUMENTS`:
  - If NOT signed: show "Sign Document" button → navigates to `/documents/sign/[id]`
  - If signed: show "Signed on {date}" badge with checkmark icon, no sign button
- Use `GET /documents/:id/signature` to check signature status (404 = unsigned)

#### Signing Hook

`useSignDocument(documentId)` — follow existing mutation hook patterns:
- `useUploadSignatureImage(documentId)` → POST `/documents/:id/sign/upload`
- `useSignDocument(documentId)` → POST `/documents/:id/sign`
- Invalidates `['documents', id]` and `['signature', documentId]` on success

---

## Task 4: Web Signature Viewer (Web Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/hooks/use-signature.ts` | Create | Signature query hook |
| `apps/web/src/app/(dashboard)/documents/[id]/page.tsx` | Modify | Show signature section |

### Requirements

#### Signature Hook

`useSignature(documentId)` — follow `useDocument` pattern:
- `GET /documents/:id/signature`
- Returns signature data or null (treat 404 as no signature)
- Query key: `['signature', documentId]`

#### Document Detail Page — Signature Section

Add below the existing document details card:

- **If signed:** Show a "Signature" card containing:
  - Signature image (loaded via `POST /documents/download` using the `signatureImageKey` as the blob name, or add a dedicated download endpoint — reuse the existing download pattern)
  - Signer info: "Signed by {tenant name}" (resolve from signedBy ID)
  - Signed at: formatted date/time
  - Metadata: IP address, user agent (collapsible/expandable)
  - Small "Verified" badge with checkmark

- **If not signed and folder is LEASE_AGREEMENTS or SIGNED_DOCUMENTS:** Show "Awaiting Signature" status badge

- **If not signable folder:** Show nothing (no signature section)

---

## API Response Contracts

### POST /documents/:id/sign/upload
```json
{
  "uploadUrl": "https://storage.blob.core.windows.net/signatures/...",
  "blobName": "signatures/{documentId}/{uuid}.png"
}
```

### POST /documents/:id/sign
```json
{
  "signature": {
    "id": "uuid",
    "documentId": "uuid",
    "signedBy": "uuid",
    "signatureImageKey": "signatures/{documentId}/{uuid}.png",
    "ipAddress": "192.168.1.1",
    "userAgent": "Expo/...",
    "signedAt": "2026-03-21T12:00:00.000Z"
  }
}
```

### GET /documents/:id/signature
```json
{
  "signature": {
    "id": "uuid",
    "documentId": "uuid",
    "signedBy": "uuid",
    "signatureImageKey": "signatures/{documentId}/{uuid}.png",
    "ipAddress": "192.168.1.1",
    "userAgent": "Expo/...",
    "signedAt": "2026-03-21T12:00:00.000Z"
  }
}
```

**404** when no signature exists for the document.

---

## Business Rules

1. **Signable folders only** — Only documents in `LEASE_AGREEMENTS` or `SIGNED_DOCUMENTS` folders can be signed. All other folders return 400.
2. **One signature per document** — A document can be signed exactly once. Attempting to sign an already-signed document returns 409.
3. **Signer must be the document's client** — The `signedBy` must match the document's `clientId`. Managers cannot sign on behalf of tenants.
4. **Signature image must exist in blob storage** — The use case verifies the blob exists before creating the record, preventing phantom signatures.
5. **Signing metadata is immutable** — Once created, a Signature record is never updated or deleted. IP address and user agent are captured at signing time for legal compliance.
6. **Audit trail** — Every signing event creates an audit log entry with action=SIGN, resourceType=DOCUMENT.
7. **Notification** — Signing triggers a notification to the document's property manager with actionType=SIGN_DOCUMENT.

---

## Test Requirements

- **SignDocumentUseCase**: Test happy path, document not found, wrong folder, already signed, blob not found
- **GetSignatureByDocumentIdUseCase**: Test found and not found cases
- **Controllers**: Test auth, validation, error mapping, response shape
- Follow existing test patterns in `apps/api/src/domain/document/application/use-cases/__tests__/`

---

## Implementation Order

```
Task 1 → Task 2 → Task 3 + Task 4 (parallel)
(Schema)  (API)    (Mobile)  (Web)
```

Task 1 must come first (schema + shared types). Task 2 depends on Task 1 (domain references schema). Tasks 3 and 4 are independent of each other and can run in parallel once the API exists.

---

## Human Action Items

1. **Run Prisma migration** after Task 1: `cd apps/api && npx prisma migrate dev --name add-signature-model`
2. **Install `react-native-signature-canvas`** in mobile app: `cd apps/mobile && npx expo install react-native-signature-canvas`

---

## Definition of Done

1. `npx prisma migrate dev` succeeds with new Signature table
2. `cd apps/api && npm run build` passes
3. `cd apps/web && npx next build` passes
4. `cd apps/mobile && npx expo export` passes
5. Tenant can sign a lease agreement document from mobile and see "Signed" status
6. Manager can view the signature image, signer info, and signing metadata on the web document detail page
7. Signing creates an audit log entry
8. Attempting to sign a non-signable document or re-sign returns the correct error
