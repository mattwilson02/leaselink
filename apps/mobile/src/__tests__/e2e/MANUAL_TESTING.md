# Manual End-to-End Testing Guide

> **⚠️ Temporary Solution**  
> This is a temporary manual process until we implement an automated script to handle test data setup in CI. The manual steps below are required to properly test the onboarding and new device flows locally.

## Overview

This guide outlines the manual steps required to test the end-to-end flows on a local device, specifically the onboarding flow and new device flow.

## Prerequisites

- Local backend environment running (use `npm run backend:start`)
- iOS or Android emulator running the app (use `npm run ios` or `npm run android`)
- Swagger UI accessible for API operations
- Local database access (for manual data cleanup)
- Maestro testing framework installed and configured

## Test Structure

The e2e tests are organized by platform:
- **iOS tests:** Located in `src/__tests__/e2e/ios/`
- **Android tests:** Located in `src/__tests__/e2e/android/`

Each platform has separate test files due to platform-specific app launch configurations.

## Test Data

The tests use the following predefined data:

- **Email:** `test+leaselink@example.com`
- **Phone Number:** `+15551234567`

## Manual Testing Steps

### 1. Initial Setup

First, create a client in your local database using Swagger:

1. Open your local Swagger UI
2. Navigate to the client creation endpoint
3. Create a new client with the following details:
   - **Email:** `test+leaselink@example.com`
   - **Phone Number:** `+15551234567`
4. Note the generated client ID for later reference

### 2. Test Onboarding Flow

Run the onboarding end-to-end test for your target platform:

**For iOS:**
```bash
npm run test:e2e:ios:onboarding
```

**For Android:**
```bash
npm run test:e2e:android:onboarding
```

This test will simulate the complete user onboarding process including:
- Language selection
- Email verification
- Phone number verification
- Password setup
- Biometrics configuration
- Sign-in validation

### 3. Prepare for New Device Flow

After the onboarding test completes successfully:

1. Open your local database
2. Navigate to the `clients` table
3. Find the client record you created in step 1 (using the email `test+leaselink@example.com`)
4. Remove/clear the `deviceId` field for this client record
5. Save the changes

### 4. Test New Device Flow

Run the new device end-to-end test for your target platform:

**For iOS:**
```bash
npm run test:e2e:ios:new-device
```

**For Android:**
```bash
npm run test:e2e:android:new-device
```

This test will simulate a user signing in from a new device, which requires additional verification steps.

## Important Notes

- **Platform Selection:** Choose the appropriate platform commands (iOS or Android) based on your emulator
- **Data Cleanup:** The `deviceId` must be manually removed from the database between test runs to simulate a "new device" scenario
- **Test Order:** Always run the onboarding flow before the new device flow
- **Database State:** Ensure your local database is in a clean state before starting the test sequence
- **Backend Dependency:** These tests require the local backend to be running and accessible

## Troubleshooting

### Common Issues

1. **Test fails during client creation**: Verify your local backend is running and Swagger is accessible
2. **New device flow fails**: Ensure the `deviceId` was properly removed from the database
3. **Phone verification issues**: Confirm the phone number format matches exactly: `+15551234567`
4. **Email verification problems**: Ensure the email format is correct: `test+leaselink@example.com`

### Verification Steps

- Check that the client exists in the database before running tests
- Verify the backend logs for any API errors during test execution
- Ensure all required environment variables are set for local development

## Future Improvements

This manual process will be replaced with an automated script that:
- Automatically creates test clients with proper data
- Handles database cleanup between test runs
- Integrates with CI/CD pipeline for automated testing
- Eliminates the need for manual database manipulation]