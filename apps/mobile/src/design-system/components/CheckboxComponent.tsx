/**
 * Checkbox to replace @sf-digital-ui/react-native Checkbox
 */
import { Pressable, StyleSheet, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { colors, borderRadius } from '../theme'

interface CheckboxProps {
	value?: boolean
	onValueChange?: (value: boolean) => void
	size?: 'sm' | 'md' | 'lg'
	disabled?: boolean
	testID?: string
}

export const Checkbox = ({
	value = false,
	onValueChange,
	size = 'md',
	disabled,
	testID,
}: CheckboxProps) => {
	const boxSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20
	const iconSize = boxSize - 6

	return (
		<Pressable
			testID={testID}
			disabled={disabled}
			onPress={() => onValueChange?.(!value)}
			style={[
				styles.checkbox,
				{ width: boxSize, height: boxSize, borderRadius: borderRadius.sm },
				value && styles.checked,
				disabled && styles.disabled,
			]}
		>
			{value && (
				<Check
					size={iconSize}
					color={colors.primaryForeground}
					strokeWidth={3}
				/>
			)}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	checkbox: {
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
	checked: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	disabled: {
		opacity: 0.5,
	},
})

export default Checkbox
