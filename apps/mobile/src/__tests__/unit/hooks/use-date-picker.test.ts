import { renderHook, act } from '@testing-library/react-native'
import { useDatePicker } from '@/components/DatePicker/hooks/use-date-picker'

describe('useDatePicker', () => {
	beforeEach(() => {
		jest.useFakeTimers()
		jest.setSystemTime(new Date(2024, 5, 15)) // June 15, 2024
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('initialization', () => {
		it('should initialize with default values when no initial value provided', () => {
			const { result } = renderHook(() => useDatePicker({ mode: 'date' }))

			expect(result.current.value).toEqual({
				day: 15,
				month: 6,
				year: 2024,
			})
			expect(result.current.isOpen).toBe(false)
		})

		it('should initialize with provided initial value', () => {
			const initialValue = { day: 10, month: 3, year: 2023 }
			const { result } = renderHook(() =>
				useDatePicker({ mode: 'date', initialValue }),
			)

			expect(result.current.value).toEqual(initialValue)
		})

		it('should respect mode prop', () => {
			const { result: dateResult } = renderHook(() =>
				useDatePicker({ mode: 'date' }),
			)
			const { result: monthYearResult } = renderHook(() =>
				useDatePicker({ mode: 'month-year' }),
			)
			const { result: yearResult } = renderHook(() =>
				useDatePicker({ mode: 'year' }),
			)

			expect(dateResult.current.mode).toBe('date')
			expect(monthYearResult.current.mode).toBe('month-year')
			expect(yearResult.current.mode).toBe('year')
		})
	})

	describe('open/close behavior', () => {
		it('should open the picker and set tempValue to current value', () => {
			const { result } = renderHook(() => useDatePicker({ mode: 'date' }))

			act(() => {
				result.current.open()
			})

			expect(result.current.isOpen).toBe(true)
			expect(result.current.tempValue).toEqual(result.current.value)
		})

		it('should close the picker', () => {
			const { result } = renderHook(() => useDatePicker({ mode: 'date' }))

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.close()
			})

			expect(result.current.isOpen).toBe(false)
		})
	})

	describe('confirm/cancel behavior', () => {
		it('should confirm and update value with tempValue', () => {
			const onChange = jest.fn()
			const { result } = renderHook(() =>
				useDatePicker({ mode: 'date', onChange }),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempDay(20)
			})
			act(() => {
				result.current.confirm()
			})

			expect(result.current.value.day).toBe(20)
			expect(result.current.isOpen).toBe(false)
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({ day: 20 }),
			)
		})

		it('should cancel and reset tempValue to original value', () => {
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 15, month: 6, year: 2024 },
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempDay(20)
			})
			act(() => {
				result.current.cancel()
			})

			expect(result.current.tempValue.day).toBe(15)
			expect(result.current.isOpen).toBe(false)
		})
	})

	describe('setTemp functions', () => {
		it('should update tempDay', () => {
			const { result } = renderHook(() => useDatePicker({ mode: 'date' }))

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempDay(25)
			})

			expect(result.current.tempValue.day).toBe(25)
		})

		it('should update tempMonth and adjust day if necessary', () => {
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 31, month: 3, year: 2024 }, // March 31
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempMonth(2) // February
			})

			// February 2024 has 29 days (leap year)
			expect(result.current.tempValue.day).toBe(29)
			expect(result.current.tempValue.month).toBe(2)
		})

		it('should update tempYear and adjust day if necessary', () => {
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 29, month: 2, year: 2024 }, // Feb 29, 2024 (leap year)
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempYear(2023) // Non-leap year
			})

			expect(result.current.tempValue.day).toBe(28)
			expect(result.current.tempValue.year).toBe(2023)
		})
	})

	describe('options generation', () => {
		it('should generate correct day options for given month', () => {
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 1, month: 2, year: 2024 }, // February 2024
				}),
			)

			// February 2024 has 29 days (leap year)
			expect(result.current.dayOptions).toHaveLength(29)
			expect(result.current.dayOptions[0]).toEqual({ value: '1', label: '1' })
			expect(result.current.dayOptions[28]).toEqual({
				value: '29',
				label: '29',
			})
		})

		it('should generate 12 month options', () => {
			const { result } = renderHook(() => useDatePicker({ mode: 'date' }))

			expect(result.current.monthOptions).toHaveLength(12)
			expect(result.current.monthOptions[0].value).toBe('1')
			expect(result.current.monthOptions[11].value).toBe('12')
		})

		it('should generate year options with default range', () => {
			const { result } = renderHook(() => useDatePicker({ mode: 'date' }))

			// Default: minYear 2000 to current year 2024
			expect(result.current.yearOptions).toHaveLength(25)
			expect(result.current.yearOptions[0].value).toBe('2024')
			expect(result.current.yearOptions[24].value).toBe('2000')
		})

		it('should respect custom minYear and maxYear', () => {
			const { result } = renderHook(() =>
				useDatePicker({ mode: 'date', minYear: 2020, maxYear: 2025 }),
			)

			expect(result.current.yearOptions).toHaveLength(6)
			expect(result.current.yearOptions[0].value).toBe('2025')
			expect(result.current.yearOptions[5].value).toBe('2020')
		})
	})

	describe('maxDate constraint', () => {
		it('should limit month options when at maxDate year', () => {
			const maxDate = new Date(2024, 5, 15) // June 15, 2024
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 1, month: 6, year: 2024 },
					maxDate,
				}),
			)

			// Should only show January through June
			expect(result.current.monthOptions).toHaveLength(6)
		})

		it('should limit day options when at maxDate month', () => {
			const maxDate = new Date(2024, 5, 15) // June 15, 2024
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 1, month: 6, year: 2024 },
					maxDate,
				}),
			)

			// Should only show days 1-15
			expect(result.current.dayOptions).toHaveLength(15)
		})

		it('should limit year options to maxDate year', () => {
			const maxDate = new Date(2022, 11, 31) // December 31, 2022
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 1, month: 1, year: 2020 },
					maxDate,
				}),
			)

			expect(result.current.yearOptions[0].value).toBe('2022')
		})

		it('should adjust month when it exceeds maxDate', () => {
			const maxDate = new Date(2024, 5, 15) // June 15, 2024
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 1, month: 6, year: 2024 },
					maxDate,
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempMonth(12) // Try to set December
			})

			// Should be capped to June
			expect(result.current.tempValue.month).toBe(6)
		})
	})

	describe('minDate constraint', () => {
		it('should limit month options when at minDate year', () => {
			const minDate = new Date(2024, 5, 15) // June 15, 2024
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 20, month: 6, year: 2024 },
					minDate,
				}),
			)

			// Should only show June through December
			expect(result.current.monthOptions).toHaveLength(7)
			expect(result.current.monthOptions[0].value).toBe('6')
		})

		it('should limit day options when at minDate month', () => {
			const minDate = new Date(2024, 5, 15) // June 15, 2024
			const { result } = renderHook(() =>
				useDatePicker({
					mode: 'date',
					initialValue: { day: 20, month: 6, year: 2024 },
					minDate,
				}),
			)

			// Should show days 15-30 for June
			expect(result.current.dayOptions).toHaveLength(16)
			expect(result.current.dayOptions[0].value).toBe('15')
		})
	})

	describe('updateValue', () => {
		it('should update both value and tempValue externally', () => {
			const { result } = renderHook(() => useDatePicker({ mode: 'date' }))

			const newValue = { day: 1, month: 1, year: 2023 }
			act(() => {
				result.current.updateValue(newValue)
			})

			expect(result.current.value).toEqual(newValue)
			expect(result.current.tempValue).toEqual(newValue)
		})
	})
})
