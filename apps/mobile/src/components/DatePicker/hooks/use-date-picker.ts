import { useState, useMemo, useCallback } from 'react'
import dayjs from 'dayjs'
import type { DatePickerValue, DatePickerMode } from '../types'

interface UseDatePickerOptions {
	mode: DatePickerMode
	initialValue?: DatePickerValue
	onChange?: (value: DatePickerValue) => void
	minDate?: Date
	maxDate?: Date
	minYear?: number
	maxYear?: number
}

export const useDatePicker = ({
	mode,
	initialValue,
	onChange,
	minDate,
	maxDate,
	minYear = 2000,
	maxYear,
}: UseDatePickerOptions) => {
	const now = dayjs()
	const effectiveMaxYear = maxYear ?? now.year()

	const defaultValue: DatePickerValue = initialValue ?? {
		day: now.date(),
		month: now.month() + 1,
		year: now.year(),
	}

	const [value, setValue] = useState<DatePickerValue>(defaultValue)
	const [tempValue, setTempValue] = useState<DatePickerValue>(defaultValue)
	const [isOpen, setIsOpen] = useState(false)

	const open = useCallback(() => {
		setTempValue(value)
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

	const setTempDay = useCallback((day: number) => {
		setTempValue((prev) => ({ ...prev, day }))
	}, [])

	const setTempMonth = useCallback(
		(month: number) => {
			setTempValue((prev) => {
				const newValue = { ...prev, month }
				// Validate day for new month
				const daysInMonth = dayjs()
					.year(prev.year)
					.month(month - 1)
					.daysInMonth()
				if (prev.day > daysInMonth) {
					newValue.day = daysInMonth
				}
				// If current year and month exceeds max date month, reset
				if (maxDate) {
					const maxDayjs = dayjs(maxDate)
					if (prev.year === maxDayjs.year() && month > maxDayjs.month() + 1) {
						newValue.month = maxDayjs.month() + 1
					}
				}
				return newValue
			})
		},
		[maxDate],
	)

	const setTempYear = useCallback(
		(year: number) => {
			setTempValue((prev) => {
				const newValue = { ...prev, year }
				// Validate month and day for new year
				if (maxDate) {
					const maxDayjs = dayjs(maxDate)
					if (year === maxDayjs.year()) {
						if (prev.month > maxDayjs.month() + 1) {
							newValue.month = maxDayjs.month() + 1
						}
						if (
							newValue.month === maxDayjs.month() + 1 &&
							prev.day > maxDayjs.date()
						) {
							newValue.day = maxDayjs.date()
						}
					}
				}
				// Validate day for new year's month
				const daysInMonth = dayjs()
					.year(year)
					.month(newValue.month - 1)
					.daysInMonth()
				if (newValue.day > daysInMonth) {
					newValue.day = daysInMonth
				}
				return newValue
			})
		},
		[maxDate],
	)

	// Generate day options
	const dayOptions = useMemo(() => {
		const daysInMonth = dayjs()
			.year(tempValue.year)
			.month(tempValue.month - 1)
			.daysInMonth()

		let maxDay = daysInMonth
		let minDay = 1

		// Apply maxDate constraint
		if (maxDate) {
			const maxDayjs = dayjs(maxDate)
			if (
				tempValue.year === maxDayjs.year() &&
				tempValue.month === maxDayjs.month() + 1
			) {
				maxDay = Math.min(maxDay, maxDayjs.date())
			}
		}

		// Apply minDate constraint
		if (minDate) {
			const minDayjs = dayjs(minDate)
			if (
				tempValue.year === minDayjs.year() &&
				tempValue.month === minDayjs.month() + 1
			) {
				minDay = Math.max(minDay, minDayjs.date())
			}
		}

		// biome-ignore lint/style/useNamingConvention: _ is idiomatic for unused parameters
		return Array.from({ length: maxDay - minDay + 1 }, (_, idx) => ({
			value: String(minDay + idx),
			label: String(minDay + idx),
		}))
	}, [tempValue.year, tempValue.month, maxDate, minDate])

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
			if (tempValue.year === maxDayjs.year()) {
				months = months.filter((m) => Number(m.value) <= maxDayjs.month() + 1)
			}
		}

		// Apply minDate constraint
		if (minDate) {
			const minDayjs = dayjs(minDate)
			if (tempValue.year === minDayjs.year()) {
				months = months.filter((m) => Number(m.value) >= minDayjs.month() + 1)
			}
		}

		return months
	}, [tempValue.year, maxDate, minDate])

	// Generate year options
	const yearOptions = useMemo(() => {
		let min = minYear
		let max = effectiveMaxYear

		if (minDate) {
			min = Math.max(min, dayjs(minDate).year())
		}
		if (maxDate) {
			max = Math.min(max, dayjs(maxDate).year())
		}

		// biome-ignore lint/style/useNamingConvention: _ is idiomatic for unused parameters
		return Array.from({ length: max - min + 1 }, (_, idx) => ({
			value: String(max - idx),
			label: String(max - idx),
		}))
	}, [minYear, effectiveMaxYear, minDate, maxDate])

	// Update value externally
	const updateValue = useCallback((newValue: DatePickerValue) => {
		setValue(newValue)
		setTempValue(newValue)
	}, [])

	return {
		mode,
		value,
		tempValue,
		isOpen,
		minDate,
		maxDate,
		open,
		close,
		confirm,
		cancel,
		setTempDay,
		setTempMonth,
		setTempYear,
		dayOptions,
		monthOptions,
		yearOptions,
		updateValue,
	}
}
