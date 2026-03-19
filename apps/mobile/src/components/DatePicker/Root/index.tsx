import { useEffect } from 'react'
import { DatePickerContext } from '../context'
import { useDatePicker } from '../hooks/use-date-picker'
import type { DatePickerRootProps } from '../types'

const Root = ({
	children,
	mode = 'date',
	value,
	onChange,
	minDate,
	maxDate,
	minYear,
	maxYear,
}: DatePickerRootProps) => {
	const datePicker = useDatePicker({
		mode,
		initialValue: value,
		onChange,
		minDate,
		maxDate,
		minYear,
		maxYear,
	})

	// Sync external value changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally tracking individual date fields to avoid infinite loops
	useEffect(() => {
		if (value) {
			datePicker.updateValue(value)
		}
	}, [value?.day, value?.month, value?.year])

	return (
		<DatePickerContext.Provider value={datePicker}>
			{children}
		</DatePickerContext.Provider>
	)
}

export default Root
