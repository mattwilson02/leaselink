/**
 * TextInput compound to replace @sf-digital-ui/react-native TextInput.Root / TextInput.Control
 */
import { forwardRef } from 'react'
import {
	StyleSheet,
	TextInput,
	View,
	type StyleProp,
	type TextInputProps,
	type TextStyle,
	type ViewStyle,
} from 'react-native'
import { colors, typography, borderRadius } from '../theme'

export interface TextInputRootProps {
	id?: string
	style?: StyleProp<ViewStyle>
	children?: React.ReactNode
	disabled?: boolean
	testID?: string
}

export interface TextInputControlProps extends TextInputProps {
	style?: StyleProp<TextStyle>
}

const TextInputRoot = ({
	style,
	children,
	disabled,
	testID,
}: TextInputRootProps) => {
	return (
		<View
			style={[styles.root, style, disabled && styles.disabled]}
			testID={testID}
		>
			{children}
		</View>
	)
}

const TextInputControl = forwardRef<TextInput, TextInputControlProps>(
	({ style, ...props }, ref) => {
		return (
			<TextInput
				ref={ref}
				style={[styles.control, style as StyleProp<TextStyle>]}
				placeholderTextColor={colors.mutedForeground}
				{...props}
			/>
		)
	},
)

TextInputControl.displayName = 'TextInputControl'

const styles = StyleSheet.create({
	disabled: {
		opacity: 0.5,
	},
	root: {
		borderWidth: 1,
		borderColor: colors.input,
		borderRadius: borderRadius.md,
		paddingHorizontal: 12,
		paddingVertical: 0,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.background,
		minHeight: 44,
	},
	control: {
		flex: 1,
		fontSize: typography.fontSize.sm,
		fontFamily: typography.fontFamily.regular,
		color: colors.foreground,
		paddingVertical: 10,
	},
})

export const TextInputCompound = {
	Root: TextInputRoot,
	Control: TextInputControl,
}

export default TextInputCompound
