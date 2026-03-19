import type { ReactNode } from 'react'

export type DatePickerMode = 'date' | 'month-year' | 'year'

export interface DatePickerValue {
	day: number
	month: number
	year: number
}

export interface DateRangeValue {
	startDate: Date | null
	endDate: Date | null
}

export interface DatePickerContextValue {
	mode: DatePickerMode
	value: DatePickerValue
	tempValue: DatePickerValue
	isOpen: boolean
	minDate?: Date
	maxDate?: Date
	open: () => void
	close: () => void
	confirm: () => void
	cancel: () => void
	setTempDay: (day: number) => void
	setTempMonth: (month: number) => void
	setTempYear: (year: number) => void
	dayOptions: { value: string; label: string }[]
	monthOptions: { value: string; label: string }[]
	yearOptions: { value: string; label: string }[]
}

export type DateRangePickerMode = 'start' | 'end'

export interface DateRangePickerContextValue {
	value: DateRangeValue
	tempValue: DateRangeValue
	isOpen: boolean
	activeMode: DateRangePickerMode
	maxDate?: Date
	minDate?: Date
	open: () => void
	close: () => void
	confirm: () => void
	cancel: () => void
	setActiveMode: (mode: DateRangePickerMode) => void
	setTempStartDate: (date: Date) => void
	setTempEndDate: (date: Date) => void
	tempDateValue: DatePickerValue
	setTempDay: (day: number) => void
	setTempMonth: (month: number) => void
	setTempYear: (year: number) => void
	dayOptions: { value: string; label: string }[]
	monthOptions: { value: string; label: string }[]
	yearOptions: { value: string; label: string }[]
}

export interface DatePickerRootProps {
	children: ReactNode
	mode?: DatePickerMode
	value?: DatePickerValue
	onChange?: (value: DatePickerValue) => void
	minDate?: Date
	maxDate?: Date
	minYear?: number
	maxYear?: number
}

export interface DatePickerModalProps {
	children?: ReactNode
	title?: string
	cancelText?: string
	confirmText?: string
}

export interface DatePickerTriggerProps {
	children:
		| ReactNode
		| ((props: { value: DatePickerValue; open: () => void }) => ReactNode)
}

export interface WheelPickerProps {
	type: 'day' | 'month' | 'year'
	label?: string
	flex?: number
}

export interface DateRangePickerRootProps {
	children: ReactNode
	value?: DateRangeValue
	onChange?: (value: DateRangeValue) => void
	minDate?: Date
	maxDate?: Date
	minYear?: number
	maxYear?: number
}

export interface DateRangePickerModalProps {
	children?: ReactNode
	title?: string
	cancelText?: string
	confirmText?: string
	startDateLabel?: string
	endDateLabel?: string
	testID?: string
}

export interface DateRangeTriggerProps {
	children:
		| ReactNode
		| ((props: { value: DateRangeValue; open: () => void }) => ReactNode)
}
