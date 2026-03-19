import { TouchableOpacity } from 'react-native'
import { useDatePickerContext } from '../context'
import type { DatePickerTriggerProps } from '../types'

const Trigger = ({ children }: DatePickerTriggerProps) => {
	const { value, open } = useDatePickerContext()

	if (typeof children === 'function') {
		return <>{children({ value, open })}</>
	}

	return <TouchableOpacity onPress={open}>{children}</TouchableOpacity>
}

export default Trigger
