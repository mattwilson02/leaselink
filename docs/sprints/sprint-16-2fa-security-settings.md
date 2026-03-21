# Sprint 16: Two-Factor Authentication & Security Settings

## Overview

This sprint adds two-factor authentication (2FA) via TOTP and active session management across the platform. Property managers and tenants can enable 2FA on their accounts, view active sessions with device/IP info, and revoke sessions remotely.

**Goal:** Users can secure their accounts with TOTP-based 2FA and manage their active login sessions from both web and mobile.

**Scope:** Backend (custom session endpoints), Web (security settings page), Mobile (active sessions screen + 2FA toggle). No new Prisma migrations — the `TwoFactor` and `Session` models already exist.

---

## What Exists

| Layer | Status |
|-------|--------|
| **Better Auth — twoFactor plugin** | Already configured in `apps/api/src/infra/auth/better-auth/auth-factory.ts` via `twoFactor()` plugin. Provides built-in endpoints: `POST /api/auth/two-factor/enable`, `POST /api/auth/two-factor/disable`, `POST /api/auth/two-factor/verify-totp`. These return TOTP URI, backup codes, etc. |
| **Prisma — TwoFactor model** | `twoFactor` table exists with `id`, `secret`, `backupCodes`, `userId`. No migration needed. |
| **Prisma — Session model** | `session` table exists with `id`, `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId`. No migration needed. |
| **Prisma — User.twoFactorEnabled** | Boolean field on `user` table, defaults to `false`. Already in schema. |
| **Mobile — security.tsx** | `apps/mobile/app/(profile)/security.tsx` — has biometric toggle, change password row, and active sessions row with TODO at line 228: `/* TODO: Add onPress to navigate to active sessions screen */`. Uses `authClient.useSession()` from Better Auth client. |
| **Mobile — profile layout** | `apps/mobile/app/(profile)/_layout.tsx` — stack navigator for profile screens |
| **Web — settings pages** | `apps/web/src/app/(dashboard)/settings/profile/page.tsx` and `/settings/audit-log/page.tsx` exist. No `/settings/security` page. |
| **Web — sidebar** | Bottom nav includes Settings (→ `/settings/profile`) and Audit Log (→ `/settings/audit-log`). No Security link. |
| **Better Auth client** | Mobile uses `authClient` from `@/services/auth` with `useSession()` hook. Web uses similar auth client setup. |
| **API — Auth module** | `apps/api/src/infra/auth/` contains Better Auth factory, guards (`EnhancedAuthGuard`, `EmployeeOnlyGuard`), and auth controller. Better Auth handles its own `/api/auth/*` routes. |

---

## Architectural Decisions

1. **Use Better Auth's built-in 2FA endpoints directly** — Better Auth's `twoFactor()` plugin already provides enable, disable, and verify-totp endpoints. The web and mobile clients call these directly via the Better Auth client SDK (`authClient.twoFactor.enable()`, etc.). No custom NestJS controllers needed for 2FA itself.

2. **Custom NestJS endpoints for session management** — Better Auth stores sessions in the `session` table but does not expose list/revoke endpoints. Build two custom endpoints: `GET /sessions` (list current user's active sessions) and `DELETE /sessions/:id` (revoke a session). These follow the existing controller pattern.

3. **TOTP-only, no SMS** — Use TOTP (Google Authenticator, Authy, etc.) for 2FA. This avoids SMS delivery complexity and is more secure. The Better Auth twoFactor plugin defaults to TOTP.

4. **Session listing uses Prisma directly** — Since sessions are a Better Auth concern (not a domain entity), the session endpoints query Prisma directly in the controller rather than going through a domain repository. This is consistent with how auth is handled elsewhere in the codebase.

5. **Mobile active sessions is a new screen** — Create `apps/mobile/app/(profile)/active-sessions.tsx` and wire up the existing TODO navigation in `security.tsx`. Follow the existing profile screen pattern (stack screen with back navigation).

6. **Web security page follows settings pattern** — Create `apps/web/src/app/(dashboard)/settings/security/page.tsx` following the existing profile settings page pattern. Add a "Security" link to the sidebar bottom nav.

---

## Task 1: Session Management Endpoints (Backend Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/http/controllers/get-sessions/get-sessions.controller.ts` | Create | List active sessions for current user |
| `apps/api/src/infra/http/controllers/get-sessions/get-sessions.e2e-spec.ts` | Create | E2E test |
| `apps/api/src/infra/http/controllers/revoke-session/revoke-session.controller.ts` | Create | Revoke a specific session |
| `apps/api/src/infra/http/controllers/revoke-session/revoke-session.e2e-spec.ts` | Create | E2E test |

### Requirements

#### GET /sessions

- Guard: `EnhancedAuthGuard` (any authenticated user)
- Query Prisma `session` table for all sessions where `userId` matches the authenticated user and `expiresAt > now()`
- Return array of sessions with `id`, `createdAt`, `ipAddress`, `userAgent`, `isCurrent` (compare session token with the request's auth token)
- Sort by `createdAt` descending (newest first)
- Do NOT return the `token` field — it is sensitive

#### DELETE /sessions/:id

- Guard: `EnhancedAuthGuard`
- Verify the session belongs to the authenticated user (return 404 if not)
- Prevent revoking the current session (return 400 with message "Cannot revoke current session")
- Delete the session row from the database
- Return 204 No Content

### API Response Contract

```
GET /sessions → 200
{
  "sessions": [
    {
      "id": "session-uuid",
      "createdAt": "2026-03-20T10:00:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 ...",
      "isCurrent": true
    }
  ]
}

DELETE /sessions/:id → 204 (no body)
DELETE /sessions/:id → 400 { "message": "Cannot revoke current session" }
DELETE /sessions/:id → 404 { "message": "Session not found" }
```

---

## Task 2: Web Security Settings Page (Web Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/(dashboard)/settings/security/page.tsx` | Create | Security settings page with 2FA and sessions |
| `apps/web/src/hooks/use-sessions.ts` | Create | TanStack Query hook for session endpoints |
| `apps/web/src/components/layout/app-sidebar.tsx` | Modify | Add Security link to bottom nav |

### Requirements

#### Sidebar Update

Add a "Security" item to `bottomNavItems` in the sidebar:
- Title: "Security"
- Href: `/settings/security`
- Icon: `Shield` from lucide-react
- Position: between Settings and Audit Log

#### Security Page Layout

Two sections on the page:

**Section 1: Two-Factor Authentication**

- Show current 2FA status (read `twoFactorEnabled` from the user/session object)
- If disabled: "Enable 2FA" button that calls `authClient.twoFactor.enable()` via Better Auth client
  - On success, display the TOTP URI as a QR code (use a QR code rendering library — `qrcode.react` or similar)
  - Show backup codes returned by the enable call
  - Require user to verify with a TOTP code before activation is complete (`authClient.twoFactor.verifyTotp()`)
- If enabled: "Disable 2FA" button that calls `authClient.twoFactor.disable()` via Better Auth client
  - Require current password confirmation before disabling

**Section 2: Active Sessions**

- Fetch sessions from `GET /sessions` using the new `use-sessions` hook
- Display as a card list or table showing: device/browser (parsed from `userAgent`), IP address, login date, and "Current session" badge
- Each non-current session has a "Revoke" button that calls `DELETE /sessions/:id`
- Show confirmation dialog before revoking
- Invalidate the sessions query after revocation

#### Patterns to Follow

- Follow the existing settings profile page layout and styling patterns
- Use existing Card, Button, Badge components from shadcn/ui
- Use TanStack Query `useQuery`/`useMutation` pattern from existing hooks (e.g., `use-payments.ts`)

---

## Task 3: Mobile Active Sessions Screen (Mobile Agent)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/mobile/app/(profile)/active-sessions.tsx` | Create | Active sessions list screen |
| `apps/mobile/app/(profile)/security.tsx` | Modify | Wire up active sessions navigation + add 2FA toggle |

### Requirements

#### active-sessions.tsx

- Follow the existing profile screen pattern (e.g., `change-password.tsx`)
- Fetch sessions from `GET /sessions` using Kubb-generated query hook (or create a custom hook if Kubb doesn't cover it)
- Display each session as a row showing: device icon, browser/OS (parsed from `userAgent`), IP address, login date
- Mark current session with a badge — no revoke button on current session
- "Revoke" button on other sessions with confirmation alert (`Alert.alert`)
- Pull-to-refresh support
- Use design system components (`Heading`, `Text`, `Button`)

#### security.tsx Modifications

- Wire up the active sessions `Pressable` (line 228-229) to navigate to the new `active-sessions` screen: `router.push('/(profile)/active-sessions')`
- Add a 2FA section below the existing biometric/change-password/active-sessions rows:
  - Show 2FA status toggle using Better Auth client (`authClient.twoFactor.enable()` / `authClient.twoFactor.disable()`)
  - If enabling: open a modal with the TOTP URI (display as text for the user to enter in their authenticator app — QR codes are impractical on mobile since the user is already on their phone)
  - Show backup codes after successful setup
  - Require TOTP verification to complete enablement

---

## Business Rules

1. **Any authenticated user can enable 2FA** — both managers (employees) and tenants (clients) can secure their accounts
2. **2FA is optional** — never forced, always user-initiated
3. **Cannot revoke current session** — users must use "Log out" for the current session
4. **Session belongs to user** — users can only see and revoke their own sessions
5. **Backup codes are shown once** — display them only during 2FA setup, warn the user to save them
6. **TOTP verification required** — 2FA is not active until the user successfully verifies with a code from their authenticator app
7. **Password required to disable 2FA** — prevents unauthorized disabling if a session is compromised
8. **Expired sessions are excluded** — `GET /sessions` only returns sessions where `expiresAt > now()`

---

## Test Requirements

1. **Backend E2E**: `GET /sessions` returns only the authenticated user's sessions, excludes expired sessions, and marks current session with `isCurrent: true`
2. **Backend E2E**: `DELETE /sessions/:id` returns 204 on success, 400 when revoking current session, 404 when session belongs to another user
3. **Web**: `npx next build` passes with no errors
4. **Mobile**: `npx expo export --platform ios` passes with no errors

---

## Implementation Order

```
Task 1 (Backend: Session endpoints)
  ↓
Task 2 (Web: Security settings page — depends on Task 1 for sessions)
Task 3 (Mobile: Active sessions + 2FA — depends on Task 1 for sessions)
```

Tasks 2 and 3 are independent of each other and can run in parallel after Task 1 completes.

---

## Human Action Items

- **Install `qrcode.react`** (or similar) in the web app for QR code rendering: `cd apps/web && npm install qrcode.react`
- No new env vars, no Prisma migrations, no infrastructure changes

---

## Definition of Done

1. `cd apps/api && npx nest build` passes
2. `cd apps/web && npx next build` passes
3. `cd apps/mobile && npx expo export --platform ios` passes
4. `GET /sessions` returns active sessions for the authenticated user
5. `DELETE /sessions/:id` revokes a non-current session
6. Web security page at `/settings/security` shows 2FA toggle and active sessions list
7. Web sidebar includes Security link in bottom nav
8. Mobile security screen navigates to active sessions (TODO resolved)
9. Mobile active sessions screen lists and revokes sessions
10. 2FA can be enabled/disabled from both web and mobile via Better Auth client
