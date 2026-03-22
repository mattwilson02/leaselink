import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { colors, typography, borderRadius } from '../theme'

export type BadgeVariant =
	| 'default'
	| 'secondary'
	| 'outline'
	| 'destructive'
	| 'success'
	| 'warning'
	| 'info'
	| 'muted'

interface BadgeProps {
	children: React.ReactNode
	variant?: BadgeVariant
	style?: ViewStyle
}

const variantStyles: Record<
	BadgeVariant,
	{ container: ViewStyle; text: { color: string } }
> = {
	default: {
		container: { backgroundColor: colors.primary },
		text: { color: colors.primaryForeground },
	},
	secondary: {
		container: { backgroundColor: colors.secondary },
		text: { color: colors.secondaryForeground },
	},
	outline: {
		container: {
			backgroundColor: 'transparent',
			borderWidth: 1,
			borderColor: colors.border,
		},
		text: { color: colors.foreground },
	},
	destructive: {
		container: { backgroundColor: colors.error[100] },
		text: { color: colors.error[700] },
	},
	success: {
		container: { backgroundColor: colors.success[100] },
		text: { color: colors.success[700] },
	},
	warning: {
		container: { backgroundColor: colors.warning[100] },
		text: { color: colors.warning[700] },
	},
	info: {
		container: { backgroundColor: colors.info[100] },
		text: { color: colors.info[700] },
	},
	muted: {
		container: { backgroundColor: colors.muted },
		text: { color: colors.mutedForeground },
	},
}

export const Badge = ({ children, variant = 'default', style }: BadgeProps) => {
	const vStyle = variantStyles[variant]
	return (
		<View style={[styles.badge, vStyle.container, style]}>
			<Text style={[styles.text, { color: vStyle.text.color }]}>
				{children}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: borderRadius.full,
		alignSelf: 'flex-start',
	},
	text: {
		fontSize: typography.fontSize.xs,
		fontFamily: typography.fontFamily.medium,
		fontWeight: typography.fontWeight.medium,
		textTransform: 'capitalize',
	},
})

export default Badge
