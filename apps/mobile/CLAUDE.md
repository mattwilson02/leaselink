# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeaseLink Mobile is a React Native application built with Expo Router. The app provides financial management features for clients, including document management, notifications, and client valuations. It uses a custom backend API with PostgreSQL and Azure Blob Storage, along with Better Auth for authentication.

## Key Technologies

- **Framework**: Expo SDK 53 with React Native 0.79
- **Routing**: Expo Router (file-based routing)
- **State Management**: Jotai for global state, TanStack Query for server state
- **Authentication**: Better Auth with Expo integration
- **Styling**: React Native StyleSheet API
- **UI Components**: Custom component library from `@sf-digital-ui/react-native`
- **Internationalization**: i18next and react-i18next
- **Testing**: Jest with React Native Testing Library (unit), Maestro (E2E)
- **Linting/Formatting**: Biome with Lefthook pre-commit hooks
- **Code Generation**: Kubb for API client generation from OpenAPI/Swagger

## Development Commands

### Starting the App

```bash
# Start frontend (with cache clear)
npm run dev

# Start on specific platform
npm run ios
npm run android

# Prebuild native projects (required after dependency changes)
npx expo prebuild --clean
```

### Backend Setup

```bash
# Start local backend (Docker-based)
npm run backend:start

# Stop backend
npm run backend:stop

# Restart backend
npm run backend:restart

# Tear down backend completely
npm run backend:down
```

**Note**: The backend runs on `localhost:3333` with API docs at `http://localhost:3333/api/docs`. For Android, you must run `adb reverse tcp:3333 tcp:3333` to map the port.

### Testing

```bash
# Run unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test

# Check test coverage
npm run test:coverage

# Run E2E tests (requires app running)
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

Biome runs automatically on pre-commit via Lefthook. Configuration is in `biome.json`.

### API Client Generation

```bash
# Regenerate API client from Swagger (requires backend running)
npm run codegen
```

This generates TypeScript types and TanStack Query hooks in `src/gen/api/` from the backend's OpenAPI spec at `http://localhost:3333/swagger-json`.

### Rebuilding

```bash
# Rebuild with clean prebuild
npm run rebuild

# Rebuild for specific platform
npm run rebuild:ios
npm run rebuild:android

# Full rebuild including node_modules
npm run rebuild:fresh
npm run rebuild:fresh:ios
npm run rebuild:fresh:android
```

## Architecture

### File Structure

- `app/` - Expo Router file-based routing (screens and navigation)
  - `(main)` - Main authenticated app (tabs and protected routes)
  - `(onboarding)` - Onboarding flow screens
  - `(new-device)` - New device verification flow
  - `(forgot-password)` - Password reset flow
  - `_layout.tsx` - Root layout with providers
  - `index.tsx` - Custom splash screen with animations
  - `sign-in.tsx` - Sign-in screen
- `src/` - Application logic and shared code
  - `components/` - Reusable UI components (organized by feature)
  - `hooks/` - Custom React hooks
  - `services/` - API client and authentication setup
  - `context/` - React context providers (push notifications)
  - `gen/` - Auto-generated API client code (do not edit manually)
  - `utils/` - Utility functions
  - `constants/` - Application constants
  - `i18n/` - Internationalization setup and translations
  - `__tests__/` - Test files (unit and E2E)
- `assets/` - Images, fonts, and static assets
- `scripts/` - Build and development scripts

### Path Aliases

The project uses TypeScript path aliases (configured in `tsconfig.json`):

- `@/components/*` → `./src/components/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/constants/*` → `./src/constants/*`
- `@/utils/*` → `./src/utils/*`
- `@/services/*` → `./src/services/*`
- `@/gen/*` → `./src/gen/*`
- `@/context/*` → `./src/context/*`
- `@/app/*` → `./app/*`
- `@/assets/*` → `./assets/*`

### Routing Structure

Expo Router uses file-based routing with grouping:

- **Root Stack**: Defined in `app/_layout.tsx`
- **Groups**: Directories with parentheses like `(main)` create route groups without affecting URL structure
- **Nested Stacks**: Each group can have its own `_layout.tsx` for nested navigation
- **Dynamic Routes**: Use `[param].tsx` syntax for dynamic segments

### State Management

- **Global State**: Jotai atoms for client-side global state
- **Server State**: TanStack Query for API data fetching, caching, and synchronization
- **Auth State**: Better Auth manages authentication state with Expo Secure Store

### Authentication

Better Auth is configured in `src/services/auth.ts` with:
- Phone number authentication
- Email OTP authentication
- Expo-specific storage adapter using SecureStore
- Base URL: `http://localhost:3333`

API requests automatically include the auth token via an Axios interceptor in `src/services/api.ts`.

### API Client Generation

The API client is auto-generated using Kubb from the backend's Swagger/OpenAPI spec:
1. Backend must be running on `localhost:3333`
2. Run `npm run codegen` to fetch spec and generate code
3. Generated files appear in `src/gen/api/`:
   - TypeScript types for all API models
   - TanStack Query hooks for all endpoints
4. **Never edit files in `src/gen/` manually** - they will be overwritten

Use the generated hooks in components:
```typescript
import { useGetClientsControllerFindAll } from '@/gen/api/react-query'

const { data, isLoading, error } = useGetClientsControllerFindAll()
```

### Component Organization

Components follow this structure:
1. Imports
2. Types/Interfaces
3. Custom hooks
4. Component logic
5. Return JSX
6. StyleSheet (at bottom)

Files are organized by feature with kebab-case naming (enforced by Biome).

### Backend Services

The local backend runs in Docker Compose with:
- **Backend API**: Port 3333 (NestJS application)
- **PostgreSQL**: Port 5432 (database)
- **Azurite**: Ports 10000-10002 (Azure Blob Storage emulator)
- **JSON Server**: Port 3000 (mock data for client valuations)

Database credentials (local):
- Host: `localhost`
- Port: `5432`
- Database: `backend-pg`
- User: `postgres`
- Password: `postgres`

## Code Style

### Biome Configuration

- **Formatting**: Tabs for indentation, single quotes, semicolons as needed
- **Naming Conventions**:
  - Components/Types/Interfaces: PascalCase
  - Functions/Variables: camelCase
  - Constants: CONSTANT_CASE or PascalCase (global scope)
  - Files: kebab-case
- **Rules**: No console.log (warning), no explicit any (error), no empty interfaces (error)
- **Ignored Directories**: `node_modules`, `.expo`, `ios`, `android`, `src/gen`

### Pre-commit Hooks

Lefthook runs Biome checks on staged files before commit. Configuration in `lefthook.yml`.

## Testing

### Unit Tests

- Located in `src/__tests__/unit/`
- Use React Native Testing Library
- Run with Jest
- Coverage reports available with `npm run test:coverage`

### E2E Tests

- Located in `src/__tests__/e2e/`
- Use Maestro framework
- YAML-based test definitions
- Tests: `login.yaml`, `onboarding.yaml`

## Environment Variables

Two env files are required:
- `.env` - Frontend environment variables
- `.env.backend` - Backend service configuration (Docker Compose)

See `.env.example` and `.env.backend.example` for templates.

Refer to the [SF-Mobile Environment Variables Wiki](https://dev.azure.com/StonehageFleming/SF-Digital/_wiki/wikis/SF-InHouseDev.wiki/162/SF-Mobile) for setup instructions.

## Development Workflow

1. Ensure Docker is running
2. Start backend: `npm run backend:start`
3. In new terminal, start frontend: `npm run dev`
4. Select platform (press `i` for iOS or `a` for Android)
5. For Android: Run `adb reverse tcp:3333 tcp:3333` first
6. Make code changes - Expo will hot reload
7. Run tests before committing
8. Biome checks run automatically on commit

## Common Tasks

### Adding a New Screen

1. Create file in appropriate `app/` group directory
2. Use Expo Router conventions (`_layout.tsx` for layouts)
3. Screen automatically registers with router based on file location

### Adding a New API Endpoint

1. Add endpoint to backend
2. Run `npm run codegen` to regenerate client
3. Import and use generated TanStack Query hooks

### Modifying Translations

1. Edit files in `src/i18n/translations/`
2. Use `t('key')` function from `useTranslation()` hook in components

### Working with Native Modules

After adding/removing native dependencies:
```bash
npx expo prebuild --clean
```

This rebuilds `ios/` and `android/` directories.

## iOS Deployment

See `DEPLOY-IOS.md` for detailed iOS build and deployment instructions.

## Branch Strategy

- **Main branch**: `dev`
- Development work happens on feature branches
- Use pull requests for merging (template available)
