import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	type PressableProps,
	type TextStyle,
	type ViewStyle,
} from 'react-native'
import { colors, typography, borderRadius } from '../theme'

export type ButtonVariant =
	| 'default'
	| 'secondary'
	| 'outline'
	| 'ghost'
	| 'destructive'
	| 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends PressableProps {
	variant?: ButtonVariant
	size?: ButtonSize
	loading?: boolean
	children: React.ReactNode
	textStyle?: TextStyle
	style?: ViewStyle
}

const variantStyles: Record<
	ButtonVariant,
	{ container: ViewStyle; text: TextStyle }
> = {
	default: {
		container: {
			backgroundColor: colors.primary,
			borderWidth: 0,
		},
		text: {
			color: colors.primaryForeground,
		},
	},
	secondary: {
		container: {
			backgroundColor: colors.secondary,
			borderWidth: 0,
		},
		text: {
			color: colors.secondaryForeground,
		},
	},
	outline: {
		container: {
			backgroundColor: colors.background,
			borderWidth: 1,
			borderColor: colors.border,
		},
		text: {
			color: colors.foreground,
		},
	},
	ghost: {
		container: {
			backgroundColor: 'transparent',
			borderWidth: 0,
		},
		text: {
			color: colors.foreground,
		},
	},
	destructive: {
		container: {
			backgroundColor: colors.destructive,
			borderWidth: 0,
		},
		text: {
			color: colors.destructiveForeground,
		},
	},
	link: {
		container: {
			backgroundColor: 'transparent',
			borderWidth: 0,
		},
		text: {
			color: colors.primary,
			textDecorationLine: 'underline',
		},
	},
}

const sizeStyles: Record<
	ButtonSize,
	{ container: ViewStyle; text: TextStyle }
> = {
	sm: {
		container: {
			paddingHorizontal: 12,
			paddingVertical: 8,
			borderRadius: borderRadius.md,
		},
		text: {
			fontSize: typography.fontSize.sm,
			lineHeight: typography.lineHeight.sm,
		},
	},
	md: {
		container: {
			paddingHorizontal: 16,
			paddingVertical: 10,
			borderRadius: borderRadius.md,
		},
		text: {
			fontSize: typography.fontSize.sm,
			lineHeight: typography.lineHeight.sm,
		},
	},
	lg: {
		container: {
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderRadius: borderRadius.md,
		},
		text: {
			fontSize: typography.fontSize.base,
			lineHeight: typography.lineHeight.base,
		},
	},
}

export const Button = ({
	variant = 'default',
	size = 'md',
	loading = false,
	disabled,
	children,
	textStyle,
	style,
	...props
}: ButtonProps) => {
	const vStyle = variantStyles[variant]
	const sStyle = sizeStyles[size]
	const isDisabled = disabled || loading

	return (
		<Pressable
			{...props}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.base,
				sStyle.container,
				vStyle.container,
				isDisabled && styles.disabled,
				pressed && styles.pressed,
				style,
			]}
		>
			{loading && (
				<ActivityIndicator
					size='small'
					color={vStyle.text.color as string}
					style={{ marginRight: 8 }}
				/>
			)}
			{typeof children === 'string' ? (
				<Text style={[styles.text, sStyle.text, vStyle.text, textStyle]}>
					{children}
				</Text>
			) : (
				children
			)}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	base: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		fontFamily: typography.fontFamily.medium,
		fontWeight: typography.fontWeight.medium,
	},
	disabled: {
		opacity: 0.5,
	},
	pressed: {
		opacity: 0.85,
	},
})

export default Button
