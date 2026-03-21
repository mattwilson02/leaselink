/**
 * Design System Theme
 *
 * Colors derived from apps/web/src/app/globals.css oklch values.
 * oklch(L C H) where C=0 means neutral gray => hex = round(L * 255)
 *
 * Light mode:
 *   --background:        oklch(1 0 0)       => #ffffff
 *   --foreground:        oklch(0.145 0 0)   => #252525  (≈ #1a1a1a)
 *   --card:              oklch(1 0 0)       => #ffffff
 *   --card-foreground:   oklch(0.145 0 0)   => #252525
 *   --primary:           oklch(0.205 0 0)   => #353535  (≈ #1c1917)
 *   --primary-foreground:oklch(0.985 0 0)   => #fafafa
 *   --secondary:         oklch(0.97 0 0)    => #f7f7f7
 *   --secondary-foreground: oklch(0.205 0 0) => #353535
 *   --muted:             oklch(0.97 0 0)    => #f7f7f7
 *   --muted-foreground:  oklch(0.556 0 0)   => #8e8e8e
 *   --accent:            oklch(0.97 0 0)    => #f7f7f7
 *   --accent-foreground: oklch(0.205 0 0)   => #353535
 *   --destructive:       oklch(0.577 0.245 27.325) => #e5534b (red)
 *   --border:            oklch(0.922 0 0)   => #ebebeb
 *   --input:             oklch(0.922 0 0)   => #ebebeb
 *   --ring:              oklch(0.708 0 0)   => #b5b5b5
 *   --sidebar:           oklch(0.985 0 0)   => #fafafa
 *
 * Dark mode:
 *   --background:        oklch(0.145 0 0)   => #252525
 *   --foreground:        oklch(0.985 0 0)   => #fafafa
 *   --card:              oklch(0.205 0 0)   => #353535
 *   --primary:           oklch(0.922 0 0)   => #ebebeb
 *   --primary-foreground:oklch(0.205 0 0)   => #353535
 *   --secondary:         oklch(0.269 0 0)   => #454545
 *   --muted:             oklch(0.269 0 0)   => #454545
 *   --muted-foreground:  oklch(0.708 0 0)   => #b5b5b5
 *   --destructive:       oklch(0.704 0.191 22.216) => #f87171 (red)
 *   --border:            oklch(1 0 0 / 10%) => rgba(255,255,255,0.1)
 *   --input:             oklch(1 0 0 / 15%) => rgba(255,255,255,0.15)
 */

export const colors = {
	// Semantic tokens matching shadcn/web dashboard
	background: '#ffffff',
	foreground: '#0a0a0a',
	card: '#ffffff',
	cardForeground: '#0a0a0a',
	primary: '#18181b',
	primaryForeground: '#fafafa',
	secondary: '#f4f4f5',
	secondaryForeground: '#18181b',
	muted: '#f4f4f5',
	mutedForeground: '#71717a',
	accent: '#f4f4f5',
	accentForeground: '#18181b',
	destructive: '#ef4444',
	destructiveForeground: '#fafafa',
	border: '#e4e4e7',
	input: '#e4e4e7',
	ring: '#a1a1aa',

	// Sidebar
	sidebar: '#fafafa',
	sidebarForeground: '#0a0a0a',
	sidebarPrimary: '#18181b',
	sidebarPrimaryForeground: '#fafafa',
	sidebarAccent: '#f4f4f5',
	sidebarAccentForeground: '#18181b',
	sidebarBorder: '#e4e4e7',

	// Semantic status colors (not in the web tokens but needed for mobile)
	success: {
		50: '#f0fdf4',
		100: '#dcfce7',
		500: '#22c55e',
		600: '#16a34a',
		700: '#15803d',
	},
	warning: {
		50: '#fffbeb',
		100: '#fef3c7',
		500: '#f59e0b',
		600: '#d97706',
		700: '#b45309',
	},
	error: {
		50: '#fef2f2',
		100: '#fee2e2',
		500: '#ef4444',
		600: '#dc2626',
		700: '#b91c1c',
	},
	info: {
		50: '#eff6ff',
		100: '#dbeafe',
		500: '#3b82f6',
		600: '#2563eb',
		700: '#1d4ed8',
	},

	// Neutral scale (zinc-based, matching shadcn defaults)
	// Both numeric and string access work: colors.neutral[10] or colors.neutral['10']
	neutral: {
		'10': '#fafafa',
		'20': '#f4f4f5',
		'30': '#e4e4e7',
		'40': '#d4d4d8',
		'50': '#a1a1aa',
		'60': '#c4c4c8',
		'80': '#a1a1aa',
		'100': '#f4f4f5',
		'200': '#e4e4e7',
		'300': '#a1a1aa',
		'400': '#71717a',
		'500': '#52525b',
		'600': '#3f3f46',
		'700': '#27272a',
		'800': '#18181b',
		'900': '#09090b',
	},

	// White/Black
	white: '#ffffff',
	black: '#000000',
	transparent: 'transparent',
}

export const typography = {
	fontFamily: {
		regular: 'Inter_400Regular',
		medium: 'Inter_500Medium',
		semiBold: 'Inter_600SemiBold',
		bold: 'Inter_700Bold',
	},
	fontSize: {
		xs: 12,
		sm: 14,
		base: 16,
		lg: 18,
		xl: 20,
		'2xl': 24,
		'3xl': 30,
		'4xl': 36,
	},
	lineHeight: {
		xs: 16,
		sm: 20,
		base: 24,
		lg: 28,
		xl: 28,
		'2xl': 32,
		'3xl': 36,
		'4xl': 40,
	},
	fontWeight: {
		regular: '400' as const,
		medium: '500' as const,
		semiBold: '600' as const,
		bold: '700' as const,
	},
}

export const spacing = {
	1: 4,
	2: 8,
	3: 12,
	4: 16,
	5: 20,
	6: 24,
	8: 32,
	10: 40,
	12: 48,
}

export const borderRadius = {
	sm: 4,
	md: 8,
	lg: 10,
	xl: 16,
	full: 9999,
}

export const shadows = {
	sm: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	md: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	lg: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 8,
		elevation: 4,
	},
}

const theme = { colors, typography, spacing, borderRadius, shadows }
export default theme
