/**
 * Compound Button to replace @sf-digital-ui/react-native Button.Root / Button.Text / Button.Prefix
 */
import {
	ActivityIndicator,
	Pressable,
	Text,
	View,
	type PressableProps,
	type StyleProp,
	type TextStyle,
	type ViewStyle,
	StyleSheet,
} from 'react-native'
import { colors, typography, borderRadius } from '../theme'

type Variant =
	| 'primary'
	| 'secondary'
	| 'tertiary'
	| 'outline'
	| 'ghost'
	| 'link'
	| 'destructive'
type Color = 'default' | 'neutral' | 'sf-green' | 'error' | 'success'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonRootProps extends PressableProps {
	variant?: Variant
	color?: Color
	size?: Size
	loading?: boolean
	style?: StyleProp<ViewStyle>
	children?: React.ReactNode
}

const getContainerStyle = (variant: Variant, color: Color): ViewStyle => {
	if (variant === 'link' || variant === 'tertiary' || variant === 'ghost') {
		return { backgroundColor: 'transparent', borderWidth: 0 }
	}
	if (variant === 'secondary') {
		if (color === 'error')
			return { backgroundColor: colors.error[100], borderWidth: 0 }
		if (color === 'sf-green')
			return { backgroundColor: colors.neutral['20'], borderWidth: 0 }
		return { backgroundColor: colors.secondary, borderWidth: 0 }
	}
	if (variant === 'outline') {
		return {
			backgroundColor: 'transparent',
			borderWidth: 1,
			borderColor: colors.border,
		}
	}
	if (variant === 'destructive') {
		return { backgroundColor: colors.destructive, borderWidth: 0 }
	}
	// primary / default
	if (color === 'neutral')
		return { backgroundColor: colors.neutral['700'], borderWidth: 0 }
	if (color === 'sf-green')
		return { backgroundColor: colors.neutral['800'], borderWidth: 0 }
	if (color === 'error')
		return { backgroundColor: colors.error[600], borderWidth: 0 }
	return { backgroundColor: colors.primary, borderWidth: 0 }
}

const getTextColor = (variant: Variant, color: Color): string => {
	if (variant === 'link') {
		if (color === 'sf-green') return colors.neutral['600']
		if (color === 'neutral') return colors.neutral['600']
		return colors.primary
	}
	if (variant === 'tertiary' || variant === 'ghost') return colors.foreground
	if (variant === 'secondary') {
		if (color === 'error') return colors.error[700]
		return colors.secondaryForeground
	}
	if (variant === 'outline') return colors.foreground
	if (variant === 'destructive') return colors.destructiveForeground
	return colors.primaryForeground
}

const sizeContainerStyles: Record<Size, ViewStyle> = {
	xs: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: borderRadius.sm,
	},
	sm: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: borderRadius.md,
	},
	md: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: borderRadius.md,
	},
	lg: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: borderRadius.md,
	},
}

const sizeTextStyles: Record<Size, TextStyle> = {
	xs: { fontSize: 11, lineHeight: 16 },
	sm: { fontSize: 13, lineHeight: 18 },
	md: { fontSize: 14, lineHeight: 20 },
	lg: { fontSize: 16, lineHeight: 24 },
}

// Context to pass text color down to Button.Text children
let _currentTextColor = colors.primaryForeground
let _currentSize: Size = 'md'

const ButtonRoot = ({
	variant = 'primary',
	color = 'default',
	size = 'md',
	loading,
	disabled,
	style,
	children,
	...props
}: ButtonRootProps) => {
	const containerStyle = getContainerStyle(variant, color)
	const textColor = getTextColor(variant, color)
	_currentTextColor = textColor
	_currentSize = size

	const isDisabled = disabled || loading

	return (
		<Pressable
			{...props}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.root,
				sizeContainerStyles[size],
				containerStyle,
				isDisabled && styles.disabled,
				pressed && styles.pressed,
				style,
			]}
		>
			{loading && (
				<ActivityIndicator
					size='small'
					color={textColor}
					style={{ marginRight: 6 }}
				/>
			)}
			{children}
		</Pressable>
	)
}

interface ButtonTextProps {
	style?: TextStyle
	children?: React.ReactNode
}

const ButtonText = ({ style, children }: ButtonTextProps) => {
	const sz = sizeTextStyles[_currentSize]
	return (
		<Text
			style={[
				styles.text,
				{
					color: _currentTextColor,
					fontSize: sz.fontSize,
					lineHeight: sz.lineHeight,
				},
				style,
			]}
		>
			{children}
		</Text>
	)
}

interface ButtonPrefixProps {
	children?: React.ReactNode
}

const ButtonPrefix = ({ children }: ButtonPrefixProps) => {
	return <View style={{ marginRight: 6 }}>{children}</View>
}

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		fontFamily: typography.fontFamily.medium,
		fontWeight: '500',
	},
	disabled: {
		opacity: 0.5,
	},
	pressed: {
		opacity: 0.85,
	},
})

export const CompoundButton = {
	Root: ButtonRoot,
	Text: ButtonText,
	Prefix: ButtonPrefix,
}

export default CompoundButton
