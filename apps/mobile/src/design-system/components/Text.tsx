import {
	Text as RNText,
	type TextProps as RNTextProps,
	StyleSheet,
} from 'react-native'
import { colors, typography } from '../theme'

type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
type FontWeight = 'regular' | 'medium' | 'semiBold' | 'bold'

interface TextProps extends RNTextProps {
	size?: TextSize
	weight?: FontWeight
	muted?: boolean
}

export const DSText = ({
	size = 'base',
	weight = 'regular',
	muted,
	style,
	...props
}: TextProps) => {
	return (
		<RNText
			style={[
				styles.base,
				sizeStyles[size],
				weightStyles[weight],
				muted && styles.muted,
				style,
			]}
			{...props}
		/>
	)
}

const styles = StyleSheet.create({
	base: {
		color: colors.foreground,
		fontFamily: typography.fontFamily.regular,
	},
	muted: {
		color: colors.mutedForeground,
	},
})

const sizeStyles = StyleSheet.create({
	xs: {
		fontSize: typography.fontSize.xs,
		lineHeight: typography.lineHeight.xs,
	},
	sm: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.lineHeight.sm,
	},
	base: {
		fontSize: typography.fontSize.base,
		lineHeight: typography.lineHeight.base,
	},
	lg: {
		fontSize: typography.fontSize.lg,
		lineHeight: typography.lineHeight.lg,
	},
	xl: {
		fontSize: typography.fontSize.xl,
		lineHeight: typography.lineHeight.xl,
	},
	'2xl': {
		fontSize: typography.fontSize['2xl'],
		lineHeight: typography.lineHeight['2xl'],
	},
	'3xl': {
		fontSize: typography.fontSize['3xl'],
		lineHeight: typography.lineHeight['3xl'],
	},
	'4xl': {
		fontSize: typography.fontSize['4xl'],
		lineHeight: typography.lineHeight['4xl'],
	},
})

const weightStyles = StyleSheet.create({
	regular: {
		fontFamily: typography.fontFamily.regular,
		fontWeight: typography.fontWeight.regular,
	},
	medium: {
		fontFamily: typography.fontFamily.medium,
		fontWeight: typography.fontWeight.medium,
	},
	semiBold: {
		fontFamily: typography.fontFamily.semiBold,
		fontWeight: typography.fontWeight.semiBold,
	},
	bold: {
		fontFamily: typography.fontFamily.bold,
		fontWeight: typography.fontWeight.bold,
	},
})

export default DSText
