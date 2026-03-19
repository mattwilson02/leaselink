import { TouchableOpacity } from 'react-native'
import { useDateRangePickerContext } from '../../context'
import type { DateRangeTriggerProps } from '../../types'

const Trigger = ({ children }: DateRangeTriggerProps) => {
	const { value, open } = useDateRangePickerContext()

	if (typeof children === 'function') {
		return <>{children({ value, open })}</>
	}

	return <TouchableOpacity onPress={open}>{children}</TouchableOpacity>
}

export default Trigger
