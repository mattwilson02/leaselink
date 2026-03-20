# Sprint 10 — Mobile UI Refactor

## Overview

Replace `@sf-digital-ui/react-native` with a custom design system that matches the web dashboard's visual style. The web uses shadcn/ui + Tailwind (neutral grays, clean borders, rounded cards). The mobile app should feel like the same product — consistent colors, typography, spacing, and component patterns.

## What Exists

- Mobile app uses `@sf-digital-ui/react-native` throughout for buttons, inputs, cards, tabs, etc.
- Web dashboard uses shadcn/ui with Tailwind CSS — neutral color palette, clean minimal design
- Mobile already has a `constants/Colors.ts` with color definitions
- Mobile uses React Native StyleSheet API for styling (not NativeWind/Tailwind)
- Mobile components are in `src/components/` organized by feature

## Architectural Decisions

- **DO NOT add NativeWind or Tailwind to mobile** — keep using React Native StyleSheet API
- **Create a design system directory** at `src/design-system/` with reusable primitives
- **Match web dashboard colors**: read the actual tokens from `apps/web/src/app/globals.css` (oklch values) — don't hardcode hex guesses
- **Typography: Inter font** — same as the web dashboard. Install via `@expo-google-fonts/inter`, load in root layout, use as default across the app
- **Full restyle** — don't just swap imports. Restyle every component, icon, badge, card, header to match the web dashboard's look and feel
- After migration, remove both `@sf-digital-ui/react-native` AND `@sf-digital-ui/tokens` from dependencies

## Tasks — Mobile Agent

### 1. Create Design System Foundations

Create `src/design-system/` with:

#### `src/design-system/theme.ts`
- **Colors: extract directly from `apps/web/src/app/globals.css`** — read the CSS custom properties (oklch values) for both light and dark themes and convert them to hex/rgba for React Native. The web defines: `--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--sidebar-*`, `--chart-*`. Export these as a clean `colors` object using the web's semantic naming (not the old sf-digital-ui names).
- **Typography: use Inter font** — same as web dashboard (`Inter` via `expo-google-fonts` or `@expo-google-fonts/inter`). Install the package, load the font in the root layout, and use it as the default font family across the app. Define a type scale (fontSize, fontWeight, lineHeight) matching the web's Tailwind defaults.
- Spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48)
- Border radius scale (sm: 4, md: 8, lg: 12, xl: 16)
- Shadow definitions

**CRITICAL — `@sf-digital-ui/tokens` full replacement:**
There are 85 usages of `import { colors } from '@sf-digital-ui/tokens'` across 83 files. Do NOT try to match the old color property names — instead:
1. Read `apps/web/src/app/globals.css` to extract the web's design tokens (colors, semantic names)
2. Define a clean new `colors` object in the theme using the web's color system (background, foreground, card, primary, muted, accent, destructive, border, etc.)
3. Go through every file that imports from `@sf-digital-ui/tokens` and **restyle it** to use the new theme colors. Don't just swap import paths — actually update the color references, component styles, and icon colors to match the web dashboard's look and feel.
4. Restyle status badges, icons, cards, list items, headers, etc. to feel like the same product as the web dashboard
5. Remove both `@sf-digital-ui/react-native` AND `@sf-digital-ui/tokens` from dependencies when done

#### `src/design-system/components/Button.tsx`
- Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`
- Sizes: `sm`, `md`, `lg`
- Loading state with ActivityIndicator
- Match shadcn Button visual style

#### `src/design-system/components/Input.tsx`
- Text input with label, error state, helper text
- Match shadcn Input visual style (border, rounded, focus ring)

#### `src/design-system/components/Card.tsx`
- Card with optional header, content, footer sections
- Match shadcn Card visual style (border, rounded-lg, shadow-sm)

#### `src/design-system/components/Badge.tsx`
- Status badges matching the web's color-coded badges
- Variants for each status type (lease, payment, maintenance, property)

#### `src/design-system/components/Select.tsx`
- Dropdown select component (can use React Native Picker or custom bottom sheet)

#### `src/design-system/components/Skeleton.tsx`
- Loading skeleton matching web's skeleton component

#### `src/design-system/components/Separator.tsx`
- Horizontal/vertical separator line

#### `src/design-system/index.ts`
- Re-export all components for clean imports

### 2. Migrate Screens (replace sf-digital-ui imports)

For each screen, replace `@sf-digital-ui/react-native` imports with design system imports. Update styles to use theme constants.

**Priority order (most visible first):**

1. **Home/Dashboard** — `app/(main)/(tabs)/index.tsx` or similar
2. **Sign In** — `app/sign-in.tsx`
3. **Payments** — payment list and detail screens
4. **Maintenance** — request list, detail, and create screens
5. **Documents** — document list and folder screens
6. **Notifications** — notification list
7. **Profile/Settings** — profile and settings screens
8. **Onboarding** — multi-step onboarding flow

### 3. Update Layout Components

- **Tab bar** — custom styled to match web sidebar colors
- **Navigation headers** — consistent with web top nav style
- **Bottom sheets** — if used, style to match card component

### 4. Remove sf-digital-ui

After all screens are migrated:
1. Remove `@sf-digital-ui/react-native` and `@sf-digital-ui/tokens` from `package.json`
2. Delete any remaining imports of either package
3. Run `npx tsc --noEmit` to verify nothing references the old packages
4. Run `npm install` to clean up

### 5. Update Colors.ts

Update `src/constants/Colors.ts` to use the new theme colors so any remaining references pick up the new palette.

## Web Agent

No web work in this sprint.

## Backend Agent

No backend work in this sprint.

## Validation Checklist

1. `npx tsc --noEmit` passes
2. `npx expo start` launches without errors
3. No remaining imports from `@sf-digital-ui/react-native` or `@sf-digital-ui/tokens`
4. Inter font loads and renders correctly
5. Visual consistency with web dashboard color palette

## Definition of Done

- Design system primitives created in `src/design-system/`
- All screens restyled to match web dashboard theme
- Both `@sf-digital-ui/react-native` and `@sf-digital-ui/tokens` removed from dependencies
- Inter font installed and used as default
- TypeScript compiles cleanly
- App launches and renders all screens correctly
