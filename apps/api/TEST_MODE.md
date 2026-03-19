# Test Mode Documentation

## Overview

When running the application in **development mode** (`NODE_ENV=development`), the authentication system provides special test account support that allows developers to bypass real OTP delivery services (Twilio for SMS and SMTP for email).

## Test Constants

### Test OTP Code
All test accounts use a fixed OTP code:
```
123456
```

### Test Password
All seeded test accounts with passwords use:
```
Password123!
```

### Test Password Reset Token
All test accounts use a fixed password reset token for the forgot password flow:
```
test-reset-token-e2e
```

When you call `forget-password` for a test account in test mode:
- No email is sent
- Better Auth generates a random token, but it's immediately replaced with the static token
- The static token is logged to the console: `[TEST MODE] Password reset for test@example.com. Static token: test-reset-token-e2e`

This allows e2e tests to construct predictable reset URLs:
```
http://localhost:3000/reset-password?token=test-reset-token-e2e
```

The reset-password endpoint is **public** and does not require authentication - just pass the token in the request body.

## Test Email Accounts

Test email accounts follow this pattern:

### Pattern
```
test[+anything]@example.com
```

### Valid Examples
- `test@example.com`
- `test+user1@example.com`
- `test+john@example.com`
- `test+client123@example.com`

### How It Works
- **Base email**: Must start with `test` and end with `@example.com`
- **Optional suffix**: You can add `+` followed by any string between `test` and `@example.com`
- **Case insensitive**: `TEST@example.com` and `Test@example.com` also work
- **OTP bypass**: No actual email is sent; the OTP `123456` is automatically stored in the database

### Invalid Examples
- `testuser@example.com` (doesn't follow the pattern)
- `test@gmail.com` (wrong domain)
- `user@example.com` (doesn't start with `test`)

## Test Phone Numbers

Test phone numbers follow this pattern:

### Pattern
```
+1555XXXXXXX
```

Where `XXXXXXX` represents exactly 7 digits (0-9).

### Valid Examples
- `+15551234567`
- `+15550000000`
- `+15559999999`
- `+15551111111`

### How It Works
- **Country code**: Must be `+1` (US)
- **Area code**: Must be `555` (traditionally reserved for fictional use)
- **Subscriber number**: Exactly 7 digits (any combination of 0-9)
- **OTP bypass**: No SMS is sent via Twilio; the OTP `123456` is automatically stored in the database

### Invalid Examples
- `+15541234567` (area code is not 555)
- `+15550123456` (only 6 digits after 555)
- `+1555123456789` (too many digits)
- `15551234567` (missing `+` prefix)
- `+44555123456` (wrong country code)

## Usage in Development

### Sign In/Sign Up Flow

1. Use any of the valid test email or phone patterns
2. Request an OTP code through your normal authentication flow
3. Enter `123456` as the OTP code
4. Successfully authenticate

### Forgot Password Flow

1. Use any of the valid test email patterns (e.g., `test@example.com`)
2. Request a password reset through the forgot password endpoint (`/api/auth/forget-password`)
3. No email will be sent; a verification record is created with the static token `test-reset-token-e2e`
4. Use the static token to complete the password reset via `/api/auth/reset-password`
5. The token is valid for 1 hour

**For E2E UI Tests (navigating to reset URL):**
```typescript
// Step 1: Request password reset (creates static token 'test-reset-token-e2e')
await authService.api.forgetPassword({
  body: {
    email: 'test@example.com',
    redirectTo: '/reset-password',
  },
})

// Step 2: Navigate to the reset password page with the static token
await page.goto('http://localhost:3000/reset-password?token=test-reset-token-e2e')

// Step 3: Fill in the new password form and submit
```

**For E2E API Tests:**
```typescript
// Step 1: Request password reset (creates static token 'test-reset-token-e2e')
await authService.api.forgetPassword({
  body: {
    email: 'test@example.com',
    redirectTo: '/reset-password',
  },
})

// Step 2: Reset password using the static token
// The endpoint is public - no authentication required
await request(app.getHttpServer())
  .post('/api/auth/reset-password')
  .send({
    token: 'test-reset-token-e2e',
    newPassword: 'NewPassword123!',
  })
```

**Important:**
- You MUST call the forget-password endpoint first to create the verification record
- The reset-password endpoint will fail with "Invalid token" if no verification record exists
- The token can only be used once per password reset request

### Benefits

- **No external dependencies**: Don't need valid Twilio or SMTP credentials configured
- **Fast testing**: No waiting for email delivery or SMS
- **Consistent**: Always use the same OTP code and reset token
- **Multiple accounts**: Use the `+suffix` pattern for emails to test multiple users
- **E2E testing**: Predictable tokens enable reliable end-to-end testing

### Important Notes

⚠️ **Security**: This test mode is **ONLY** active when `NODE_ENV=development`. Never use this in production!

⚠️ **Database**: Test OTP codes and reset tokens are written directly to the `verification` table, bypassing external services completely.

⚠️ **Password Reset**: For test accounts, no reset email is sent. The static token is logged to the console and stored in the database.

## Production Behavior

In production (`NODE_ENV=production`), these test patterns are treated as regular accounts, and real OTPs will be sent via:
- **Email**: SMTP (configured via environment variables)
- **Phone**: Twilio SMS (configured via environment variables)

## Seeded Test Users

The database seed (`prisma/seed.ts`) creates three standardized test users for e2e testing and development:

### Test User 1: Invited Client (Ready to Onboard)
- **Email**: `test+invited@example.com`
- **Phone**: `+15551111111`
- **Password**: Random UUID (stored as `onboardingToken`, will be replaced during onboarding)
- **Status**: `INVITED`
- **Onboarding Status**: `NEW`
- **Device ID**: None
- **Onboarding Token**: Stored in `Client.onboardingToken` field
- **Use Case**: Testing the complete onboarding flow from invitation

**Note**: This user has a temporary password set to their `onboardingToken` (a random UUID). During the onboarding flow, they will set a new password using the "Set Password" endpoint, which replaces this temporary password with their chosen one.

### Test User 2: Active Client (New Device)
- **Email**: `test+newdevice@example.com`
- **Phone**: `+15552222222`
- **Password**: `Password123!` (same as other test accounts)
- **Status**: `ACTIVE`
- **Onboarding Status**: `ONBOARDED`
- **Device ID**: None
- **Use Case**: Testing device registration flow for existing users

### Test User 3: Active Client (Any Device Override)
- **Email**: `test@example.com`
- **Phone**: `+15553333333`
- **Password**: `Password123!`
- **Status**: `ACTIVE`
- **Onboarding Status**: `ONBOARDED`
- **Device ID**: `*` (special override - accepts any device in dev mode)
- **Use Case**: Testing authenticated endpoints without device restrictions

All three test users are linked to collection ID `12696` for testing collection-related endpoints.

**Password Reset URLs for E2E Tests:**

For any test account, after calling the forget-password endpoint, you can navigate to:
```
http://localhost:3000/reset-password?token=test-reset-token-e2e
```

Examples:
- `test@example.com` → `http://localhost:3000/reset-password?token=test-reset-token-e2e`
- `test+newdevice@example.com` → `http://localhost:3000/reset-password?token=test-reset-token-e2e`
- `test+invited@example.com` → `http://localhost:3000/reset-password?token=test-reset-token-e2e`

## Code Reference

The test account detection logic and constants are implemented in `auth.ts`:

```typescript
// Test constants
const TEST_OTP = '123456'
const TEST_RESET_TOKEN = 'test-reset-token-e2e'

// Email pattern: /^test(\+.*)?@example\.com$/i
const isTestEmail = (email: string): boolean => {
  return /^test(\+.*)?@example\.com$/i.test(email)
}

// Phone pattern: /^\+1555\d{7}$/
const isTestPhone = (phone: string): boolean => {
  return /^\+1555\d{7}$/.test(phone)
}
```

For password reset in test mode (`auth.ts:144-185`), we replace the generated token with our static token:

```typescript
sendResetPassword: async ({ user, url }) => {
  if (isTestEmail(user.email) && IS_TEST_MODE) {
    // Extract the generated token from the URL
    const tokenMatch = url.match(/\/reset-password\/([^?]+)/)
    const generatedToken = tokenMatch?.[1]

    if (generatedToken) {
      // Schedule async update after Better Auth creates the verification
      setTimeout(async () => {
        // Find the verification with the generated token
        const verification = await prisma.verification.findFirst({
          where: { identifier: `reset-password:${generatedToken}` }
        })

        if (verification) {
          // Update it to use our static token
          await prisma.verification.update({
            where: { id: verification.id },
            data: { identifier: `reset-password:${TEST_RESET_TOKEN}` }
          })
        }
      }, 0)
    }
    return
  }
  // ... send email in production
}
```

This replaces Better Auth's generated token with our static `test-reset-token-e2e` for predictable e2e testing. The reset-password endpoint is public and does not require authentication.

The device ID override logic is implemented in `src/infra/auth/better-auth/guards/enhanced-auth-guard.ts`:

```typescript
// Dev mode override: accept any device if deviceId is set to '*'
if (process.env.NODE_ENV === 'development' && client.deviceId === '*') {
  return true
}
```

The enhanced auth guard (`enhanced-auth-guard.ts`) uses two mechanisms to identify public routes:

1. **@Public() Decorator**: Routes marked with `@Public()` are automatically excluded from authentication
2. **Hardcoded Better Auth Routes**: Better Auth endpoints are hardcoded since they don't use the @Public() decorator

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<RequestWithUser>()

  // Check if route is marked with @Public() decorator
  const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC', [
    context.getHandler(),
    context.getClass(),
  ])

  if (isPublic || this.isBetterAuthPublicRoute(request)) {
    return true
  }
  // ... authentication logic
}

private isBetterAuthPublicRoute(request: RequestWithUser): boolean {
  // Only Better Auth endpoints are hardcoded here
  // Other public routes should use the @Public() decorator
  const betterAuthPublicRoutes = [
    '/api/auth/sign-up/email',
    '/api/auth/sign-in/email',
    '/api/auth/forget-password',
    '/api/auth/reset-password',
    '/api/auth/sign-in/phone-number',
    '/api/auth/verify/phone-number',
    '/api/auth/sign-in/email-otp',
    '/api/auth/verify/email-otp',
  ]

  return betterAuthPublicRoutes.some(
    (route) => request.path === route || request.path?.startsWith(route),
  )
}
```

Test utility endpoints like `/token/generate/employee` and documentation endpoints like `/swagger-json` use the `@Public()` decorator and are automatically excluded from authentication.

Better Auth's built-in password reset flow handles the token validation automatically. The reset-password endpoint is public and uses the verification token to validate the request. No special hooks or authentication required.
