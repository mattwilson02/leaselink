# iOS App Build Types: Development, Preview, Standalone & Production

This document outlines the different build types available for our mobile app using Expo Application Services (EAS) and their specific use cases in the development and deployment workflow.

## Build Type Overview

Our app supports four distinct build configurations, each serving different purposes in the development lifecycle:

### 1. Development Build (Development Client)

**Purpose**: Interactive development and debugging with live reload capabilities

**Key Characteristics**:
- Includes the Expo development client for connecting to Metro bundler
- Enables live reload and hot module replacement during development
- Supports debugging tools and developer menu
- Uses internal distribution (no app store submission)
- Allows loading different JavaScript bundles without rebuilding the native app

**When to Use**:
- Active development and feature building
- Testing code changes in real-time on physical devices
- Debugging native modules and integrations
- Team members need to test latest development features

**Build steps:**

1. Run the development build `eas build --profile development --platform ios`

2. **Installation**: Install via direct download link or internal distribution platforms

3. Run `npx expo start --dev-client` and scan the QR code from the app

4. - Run local backend steps in [README.md](README.md)
   - **NOTE** Make sure to replace `localhost` with your computer's **IP Address**, if pointing at the local backend

---

### 2. Preview Build

**Purpose**: Quick testing and demonstration of app functionality without development overhead

**Key Characteristics**:
- Self-contained app bundle with embedded JavaScript
- No development client or debugging capabilities
- Faster to generate than standalone builds
- Internal distribution only
- Represents a snapshot of the app at build time

**When to Use**:
- Quick feature demonstrations to stakeholders
- Testing specific app versions without development setup
- Sharing builds with non-technical team members
- Validating app behavior before more formal testing phases

**Build steps:**

1. Run the preview build `eas build --profile preview --platform ios`

2. **Installation**: Install via direct download (APK for Android, ad-hoc for iOS)

---

### 3. Standalone Build (Internal Distribution)

**Purpose**: Production-like builds for comprehensive internal testing

**Key Characteristics**:
- Full production build pipeline without app store submission
- Identical to production builds in functionality and performance
- Internal distribution for controlled testing
- Supports advanced testing scenarios and user acceptance testing
- Can be distributed through enterprise/internal app distribution platforms

**When to Use**:
- User acceptance testing (UAT)
- Performance testing under production conditions
- Final validation before app store submission
- Beta testing with select user groups
- Quality assurance testing


**Build steps:**

1. Run the preview build `eas build --profile preview --platform ios`

2. **Installation**: Enterprise distribution, internal app stores, or direct installation

---

### 4. Production Build & TestFlight Submission

**Purpose**: Official app store distribution and external beta testing

**Key Characteristics**:
- Optimized production builds ready for app store submission
- Automatic version increment (`autoIncrement: true`)
- Configured for App Store Connect and TestFlight distribution
- Full app store compliance and optimization
- Supports both internal and external TestFlight testing

**When to Use**:
- Submitting to Apple App Store for review
- TestFlight beta testing with external users
- Release candidate preparation
- Final production releases

**Distribution**: App Store Connect → TestFlight → App Store

**Build steps:**

1. Run the preview build `eas build --profile production --platform ios --auto-submit`

2. **Installation**: Testflight/ App Store once production is deployed

---

## Workflow Recommendations

1. **Development Phase**: Use development builds for day-to-day feature development
2. **Feature Testing**: Use preview builds for quick stakeholder demos
3. **Pre-Release Testing**: Use standalone builds for comprehensive QA testing
4. **Release Preparation**: Use production builds for TestFlight and App Store submission

## Key Differences Summary

| Aspect | Development | Preview | Standalone | Production |
|--------|-------------|---------|------------|------------|
| **Purpose** | Active development | Quick demos | Internal testing | App store release |
| **JavaScript** | Live reload | Embedded bundle | Embedded bundle | Embedded bundle |
| **Distribution** | Internal only | Internal only | Internal only | App Store/TestFlight |
| **Performance** | Debug mode | Release mode | Release mode | Release mode |
| **Installation** | Direct install | Direct install | Enterprise/Direct | TestFlight/App Store |
| **Version Management** | Manual | Manual | Manual | Auto-increment |
| **Debugging** | Full debugging | Limited | Limited | None |

This build strategy ensures efficient development workflow while maintaining clear separation between development, testing, and production environments.