import { useEffect } from 'react'
import { DateRangePickerContext } from '../../context'
import { useDateRangePicker } from '../../hooks/use-date-range-picker'
import type { DateRangePickerRootProps } from '../../types'

const Root = ({
	children,
	value,
	onChange,
	minDate,
	maxDate,
	minYear,
	maxYear,
}: DateRangePickerRootProps) => {
	const dateRangePicker = useDateRangePicker({
		initialValue: value,
		onChange,
		minDate,
		maxDate,
		minYear,
		maxYear,
	})

	// Sync external value changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally tracking only date timestamps to avoid infinite loops
	useEffect(() => {
		if (value) {
			dateRangePicker.updateValue(value)
		}
	}, [value?.startDate?.getTime(), value?.endDate?.getTime()])

	return (
		<DateRangePickerContext.Provider value={dateRangePicker}>
			{children}
		</DateRangePickerContext.Provider>
	)
}

export default Root
