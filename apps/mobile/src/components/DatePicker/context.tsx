import { createContext, useContext } from 'react'
import type {
	DatePickerContextValue,
	DateRangePickerContextValue,
} from './types'

export const DatePickerContext = createContext<DatePickerContextValue | null>(
	null,
)

export const useDatePickerContext = () => {
	const context = useContext(DatePickerContext)
	if (!context) {
		throw new Error('DatePicker components must be used within DatePicker.Root')
	}
	return context
}

export const DateRangePickerContext =
	createContext<DateRangePickerContextValue | null>(null)

export const useDateRangePickerContext = () => {
	const context = useContext(DateRangePickerContext)
	if (!context) {
		throw new Error(
			'DateRangePicker components must be used within DateRangePicker.Root',
		)
	}
	return context
}
