/**
 * PinInput compound to replace @sf-digital-ui/react-native PinInput.*
 */
import { createContext, useContext, useMemo, useRef, useState } from 'react'
import { View, TextInput, StyleSheet, Text, type ViewStyle } from 'react-native'
import { colors, typography, borderRadius } from '../theme'

interface PinInputContextType {
	length: number
	values: string[]
	setValueAt: (index: number, value: string) => void
	inputRefs: React.RefObject<TextInput | null>[]
	onComplete?: (pin: string) => void
}

const PinInputContext = createContext<PinInputContextType>({
	length: 6,
	values: [],
	setValueAt: () => {},
	inputRefs: [],
})

type PinInputSize = 'sm' | 'md' | 'lg'

interface PinInputRootProps {
	length?: number
	onComplete?: (pin: string) => void
	size?: PinInputSize
	children?: React.ReactNode
	testID?: string
}

const MAX_PIN_LENGTH = 8

const PinInputRoot = ({
	length = 6,
	onComplete,
	children,
	testID,
}: PinInputRootProps) => {
	const [values, setValues] = useState<string[]>(Array(length).fill(''))
	const ref0 = useRef<TextInput>(null)
	const ref1 = useRef<TextInput>(null)
	const ref2 = useRef<TextInput>(null)
	const ref3 = useRef<TextInput>(null)
	const ref4 = useRef<TextInput>(null)
	const ref5 = useRef<TextInput>(null)
	const ref6 = useRef<TextInput>(null)
	const ref7 = useRef<TextInput>(null)
	const allRefs = [ref0, ref1, ref2, ref3, ref4, ref5, ref6, ref7]
	const inputRefs = allRefs.slice(0, length)

	const setValueAt = (index: number, value: string) => {
		const newValues = [...values]
		newValues[index] = value
		setValues(newValues)

		if (value && index < length - 1) {
			inputRefs[index + 1]?.current?.focus()
		}

		if (newValues.every((v) => v !== '')) {
			onComplete?.(newValues.join(''))
		}
	}

	return (
		<PinInputContext.Provider
			value={{ length, values, setValueAt, inputRefs, onComplete }}
		>
			<View testID={testID}>{children}</View>
		</PinInputContext.Provider>
	)
}

interface PinInputFieldsProps {
	children?: React.ReactNode
	style?: ViewStyle
}

const PinInputFields = ({ children, style }: PinInputFieldsProps) => {
	return <View style={[styles.fields, style]}>{children}</View>
}

interface PinInputFieldProps {
	index: number
	testID?: string
}

const PinInputField = ({ index, testID }: PinInputFieldProps) => {
	const { values, setValueAt, inputRefs } = useContext(PinInputContext)

	return (
		<TextInput
			ref={inputRefs[index]}
			testID={testID}
			style={styles.field}
			value={values[index]}
			onChangeText={(text) => {
				const char = text.slice(-1)
				setValueAt(index, char)
			}}
			onKeyPress={({ nativeEvent }) => {
				if (nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
					inputRefs[index - 1]?.current?.focus()
				}
			}}
			keyboardType='number-pad'
			maxLength={1}
			textAlign='center'
			selectionColor={colors.primary}
		/>
	)
}

const PinInputDivider = () => {
	return <View style={styles.divider} />
}

const styles = StyleSheet.create({
	fields: {
		flexDirection: 'row',
		gap: 8,
	},
	field: {
		width: 44,
		height: 44,
		borderWidth: 1,
		borderColor: colors.input,
		borderRadius: borderRadius.md,
		fontSize: typography.fontSize.lg,
		fontFamily: typography.fontFamily.bold,
		color: colors.foreground,
		backgroundColor: colors.background,
		textAlign: 'center',
	},
	divider: {
		width: 16,
		height: 2,
		backgroundColor: colors.border,
		alignSelf: 'center',
	},
})

export const PinInputCompound = {
	Root: PinInputRoot,
	Fields: PinInputFields,
	Field: PinInputField,
	Divider: PinInputDivider,
}

export default PinInputCompound
