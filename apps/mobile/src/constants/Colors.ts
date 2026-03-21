import { colors } from '@/design-system/theme'

export const Colors = {
	light: {
		text: colors.foreground,
		background: colors.background,
		tint: colors.primary,
		icon: colors.mutedForeground,
		tabIconDefault: colors.mutedForeground,
		tabIconSelected: colors.primary,
	},
	dark: {
		text: colors.neutral['10'],
		background: colors.neutral['800'],
		tint: colors.neutral['20'],
		icon: colors.neutral['400'],
		tabIconDefault: colors.neutral['400'],
		tabIconSelected: colors.neutral['10'],
	},
}
