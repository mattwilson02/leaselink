import { useState, useMemo, useCallback } from 'react'
import dayjs from 'dayjs'
import type { DateRangeValue, DateRangePickerMode } from '../types'

interface UseDateRangePickerOptions {
	initialValue?: DateRangeValue
	onChange?: (value: DateRangeValue) => void
	minDate?: Date
	maxDate?: Date
	minYear?: number
	maxYear?: number
}

export const useDateRangePicker = ({
	initialValue,
	onChange,
	minDate,
	maxDate,
	minYear = 2000,
	maxYear,
}: UseDateRangePickerOptions) => {
	const now = dayjs()
	const effectiveMaxYear = maxYear ?? now.year()

	const defaultValue: DateRangeValue = initialValue ?? {
		startDate: null,
		endDate: null,
	}

	const [value, setValue] = useState<DateRangeValue>(defaultValue)
	const [tempValue, setTempValue] = useState<DateRangeValue>(defaultValue)
	const [isOpen, setIsOpen] = useState(false)
	const [activeMode, setActiveMode] = useState<DateRangePickerMode>('start')

	const tempDateValue = useMemo(() => {
		const date =
			activeMode === 'start' ? tempValue.startDate : tempValue.endDate
		const d = date ? dayjs(date) : dayjs()
		return {
			day: d.date(),
			month: d.month() + 1,
			year: d.year(),
		}
	}, [activeMode, tempValue.startDate, tempValue.endDate])

	const open = useCallback(() => {
		setTempValue(value)
		setActiveMode('start')
		setIsOpen(true)
	}, [value])

	const close = useCallback(() => {
		setIsOpen(false)
	}, [])

	const confirm = useCallback(() => {
		setValue(tempValue)
		onChange?.(tempValue)
		setIsOpen(false)
	}, [tempValue, onChange])

	const cancel = useCallback(() => {
		setTempValue(value)
		setIsOpen(false)
	}, [value])

	const setTempStartDate = useCallback((date: Date) => {
		setTempValue((prev) => {
			const newValue = { ...prev, startDate: date }
			// Clear end date if it's before new start date
			if (prev.endDate && date > prev.endDate) {
				newValue.endDate = null
			}
			return newValue
		})
	}, [])

	const setTempEndDate = useCallback((date: Date) => {
		setTempValue((prev) => ({ ...prev, endDate: date }))
	}, [])

	const setTempDay = useCallback(
		(day: number) => {
			const currentDate =
				activeMode === 'start' ? tempValue.startDate : tempValue.endDate
			const d = currentDate ? dayjs(currentDate) : dayjs()
			const newDate = d.date(day).toDate()

			if (activeMode === 'start') {
				setTempStartDate(newDate)
			} else {
				setTempEndDate(newDate)
			}
		},
		[
			activeMode,
			tempValue.startDate,
			tempValue.endDate,
			setTempStartDate,
			setTempEndDate,
		],
	)

	const setTempMonth = useCallback(
		(month: number) => {
			const currentDate =
				activeMode === 'start' ? tempValue.startDate : tempValue.endDate
			const d = currentDate ? dayjs(currentDate) : dayjs()
			let newDate = d.month(month - 1)

			// Validate day for new month
			const daysInMonth = newDate.daysInMonth()
			if (d.date() > daysInMonth) {
				newDate = newDate.date(daysInMonth)
			}

			if (activeMode === 'start') {
				setTempStartDate(newDate.toDate())
			} else {
				setTempEndDate(newDate.toDate())
			}
		},
		[
			activeMode,
			tempValue.startDate,
			tempValue.endDate,
			setTempStartDate,
			setTempEndDate,
		],
	)

	const setTempYear = useCallback(
		(year: number) => {
			const currentDate =
				activeMode === 'start' ? tempValue.startDate : tempValue.endDate
			const d = currentDate ? dayjs(currentDate) : dayjs()
			let newDate = d.year(year)

			// Validate day for new year's month (e.g., Feb 29)
			const daysInMonth = newDate.daysInMonth()
			if (d.date() > daysInMonth) {
				newDate = newDate.date(daysInMonth)
			}

			if (activeMode === 'start') {
				setTempStartDate(newDate.toDate())
			} else {
				setTempEndDate(newDate.toDate())
			}
		},
		[
			activeMode,
			tempValue.startDate,
			tempValue.endDate,
			setTempStartDate,
			setTempEndDate,
		],
	)

	// Calculate effective min date for end date picker
	const effectiveMinDate = useMemo(() => {
		if (activeMode === 'end' && tempValue.startDate) {
			return tempValue.startDate
		}
		return minDate
	}, [activeMode, tempValue.startDate, minDate])

	// Generate day options
	const dayOptions = useMemo(() => {
		const daysInMonth = dayjs()
			.year(tempDateValue.year)
			.month(tempDateValue.month - 1)
			.daysInMonth()

		let maxDay = daysInMonth
		let minDay = 1

		// Apply maxDate constraint
		if (maxDate) {
			const maxDayjs = dayjs(maxDate)
			if (
				tempDateValue.year === maxDayjs.year() &&
				tempDateValue.month === maxDayjs.month() + 1
			) {
				maxDay = Math.min(maxDay, maxDayjs.date())
			}
		}

		// Apply minDate constraint
		if (effectiveMinDate) {
			const minDayjs = dayjs(effectiveMinDate)
			if (
				tempDateValue.year === minDayjs.year() &&
				tempDateValue.month === minDayjs.month() + 1
			) {
				minDay = Math.max(minDay, minDayjs.date())
			}
		}

		// biome-ignore lint/style/useNamingConvention: _ is idiomatic for unused parameters
		return Array.from({ length: maxDay - minDay + 1 }, (_, idx) => ({
			value: String(minDay + idx),
			label: String(minDay + idx),
		}))
	}, [tempDateValue.year, tempDateValue.month, maxDate, effectiveMinDate])

	// Generate month options
	const monthOptions = useMemo(() => {
		// biome-ignore lint/style/useNamingConvention: _ is idiomatic for unused parameters
		let months = Array.from({ length: 12 }, (_, idx) => ({
			value: String(idx + 1),
			label: dayjs().month(idx).format('MMMM'),
		}))

		// Apply maxDate constraint
		if (maxDate) {
			const maxDayjs = dayjs(maxDate)
			if (tempDateValue.year === maxDayjs.year()) {
				months = months.filter((m) => Number(m.value) <= maxDayjs.month() + 1)
			}
		}

		// Apply minDate constraint
		if (effectiveMinDate) {
			const minDayjs = dayjs(effectiveMinDate)
			if (tempDateValue.year === minDayjs.year()) {
				months = months.filter((m) => Number(m.value) >= minDayjs.month() + 1)
			}
		}

		return months
	}, [tempDateValue.year, maxDate, effectiveMinDate])

	// Generate year options
	const yearOptions = useMemo(() => {
		let min = minYear
		let max = effectiveMaxYear

		if (effectiveMinDate) {
			min = Math.max(min, dayjs(effectiveMinDate).year())
		}
		if (maxDate) {
			max = Math.min(max, dayjs(maxDate).year())
		}

		// biome-ignore lint/style/useNamingConvention: _ is idiomatic for unused parameters
		return Array.from({ length: max - min + 1 }, (_, idx) => ({
			value: String(max - idx),
			label: String(max - idx),
		}))
	}, [minYear, effectiveMaxYear, effectiveMinDate, maxDate])

	// Update value externally
	const updateValue = useCallback((newValue: DateRangeValue) => {
		setValue(newValue)
		setTempValue(newValue)
	}, [])

	return {
		value,
		tempValue,
		isOpen,
		activeMode,
		maxDate,
		minDate: effectiveMinDate,
		open,
		close,
		confirm,
		cancel,
		setActiveMode,
		setTempStartDate,
		setTempEndDate,
		tempDateValue,
		setTempDay,
		setTempMonth,
		setTempYear,
		dayOptions,
		monthOptions,
		yearOptions,
		updateValue,
	}
}
