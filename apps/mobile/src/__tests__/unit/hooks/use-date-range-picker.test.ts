import { renderHook, act } from '@testing-library/react-native'
import { useDateRangePicker } from '@/components/DatePicker/hooks/use-date-range-picker'

describe('useDateRangePicker', () => {
	beforeEach(() => {
		jest.useFakeTimers()
		jest.setSystemTime(new Date(2024, 5, 15)) // June 15, 2024
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('initialization', () => {
		it('should initialize with null dates when no initial value provided', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

			expect(result.current.value).toEqual({
				startDate: null,
				endDate: null,
			})
			expect(result.current.isOpen).toBe(false)
			expect(result.current.activeMode).toBe('start')
		})

		it('should initialize with provided initial value', () => {
			const startDate = new Date(2024, 0, 1)
			const endDate = new Date(2024, 0, 31)
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate },
				}),
			)

			expect(result.current.value.startDate).toEqual(startDate)
			expect(result.current.value.endDate).toEqual(endDate)
		})
	})

	describe('open/close behavior', () => {
		it('should open and reset activeMode to start', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

			act(() => {
				result.current.open()
			})

			expect(result.current.isOpen).toBe(true)
			expect(result.current.activeMode).toBe('start')
		})

		it('should close the picker', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

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
			const { result } = renderHook(() => useDateRangePicker({ onChange }))

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempStartDate(new Date(2024, 0, 1))
			})
			act(() => {
				result.current.setTempEndDate(new Date(2024, 0, 31))
			})
			act(() => {
				result.current.confirm()
			})

			expect(result.current.value.startDate).toEqual(new Date(2024, 0, 1))
			expect(result.current.value.endDate).toEqual(new Date(2024, 0, 31))
			expect(result.current.isOpen).toBe(false)
			expect(onChange).toHaveBeenCalledWith({
				startDate: new Date(2024, 0, 1),
				endDate: new Date(2024, 0, 31),
			})
		})

		it('should cancel and reset tempValue to original value', () => {
			const startDate = new Date(2024, 0, 1)
			const endDate = new Date(2024, 0, 31)
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate },
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempStartDate(new Date(2024, 5, 1))
			})
			act(() => {
				result.current.cancel()
			})

			expect(result.current.tempValue.startDate).toEqual(startDate)
			expect(result.current.isOpen).toBe(false)
		})
	})

	describe('activeMode switching', () => {
		it('should switch between start and end modes', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

			expect(result.current.activeMode).toBe('start')

			act(() => {
				result.current.setActiveMode('end')
			})

			expect(result.current.activeMode).toBe('end')

			act(() => {
				result.current.setActiveMode('start')
			})

			expect(result.current.activeMode).toBe('start')
		})
	})

	describe('tempDateValue', () => {
		it('should return current date values when no date is selected', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

			// Should default to current system time (June 15, 2024)
			expect(result.current.tempDateValue).toEqual({
				day: 15,
				month: 6,
				year: 2024,
			})
		})

		it('should return start date values when activeMode is start', () => {
			const startDate = new Date(2024, 0, 10) // Jan 10, 2024
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate: null },
				}),
			)

			act(() => {
				result.current.open()
			})

			expect(result.current.tempDateValue).toEqual({
				day: 10,
				month: 1,
				year: 2024,
			})
		})

		it('should return end date values when activeMode is end', () => {
			const startDate = new Date(2024, 0, 10) // Jan 10, 2024
			const endDate = new Date(2024, 0, 20) // Jan 20, 2024
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate },
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setActiveMode('end')
			})

			expect(result.current.tempDateValue).toEqual({
				day: 20,
				month: 1,
				year: 2024,
			})
		})
	})

	describe('setTemp functions', () => {
		it('should update start date when activeMode is start', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempDay(25)
			})

			expect(result.current.tempValue.startDate?.getDate()).toBe(25)
		})

		it('should update end date when activeMode is end', () => {
			const startDate = new Date(2024, 0, 10)
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate: null },
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setActiveMode('end')
			})
			act(() => {
				result.current.setTempDay(20)
			})

			expect(result.current.tempValue.endDate?.getDate()).toBe(20)
		})

		it('should adjust day when month changes to a month with fewer days', () => {
			const startDate = new Date(2024, 2, 31) // March 31, 2024
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate: null },
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempMonth(2) // February
			})

			// February 2024 has 29 days
			expect(result.current.tempValue.startDate?.getDate()).toBe(29)
		})

		it('should adjust day for leap year when year changes', () => {
			const startDate = new Date(2024, 1, 29) // Feb 29, 2024 (leap year)
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate: null },
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempYear(2023) // Non-leap year
			})

			expect(result.current.tempValue.startDate?.getDate()).toBe(28)
		})
	})

	describe('start date clears end date when exceeds', () => {
		it('should clear end date when start date is set after it', () => {
			const startDate = new Date(2024, 0, 10)
			const endDate = new Date(2024, 0, 20)
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate },
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setTempStartDate(new Date(2024, 0, 25)) // After end date
			})

			expect(result.current.tempValue.endDate).toBeNull()
		})
	})

	describe('options generation', () => {
		it('should generate correct day options for given month', () => {
			const startDate = new Date(2024, 1, 1) // February 2024
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate: null },
				}),
			)

			act(() => {
				result.current.open()
			})

			// February 2024 has 29 days (leap year)
			expect(result.current.dayOptions).toHaveLength(29)
		})

		it('should generate 12 month options by default', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

			expect(result.current.monthOptions).toHaveLength(12)
		})

		it('should generate year options with default range', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

			// Default: minYear 2000 to current year 2024
			expect(result.current.yearOptions).toHaveLength(25)
			expect(result.current.yearOptions[0].value).toBe('2024')
			expect(result.current.yearOptions[24].value).toBe('2000')
		})
	})

	describe('end date minDate constraint from startDate', () => {
		it('should use start date as min date when selecting end date', () => {
			const startDate = new Date(2024, 5, 15) // June 15, 2024
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate: null },
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setActiveMode('end')
			})

			// Day options should start from 15 when at June 2024
			expect(result.current.dayOptions[0].value).toBe('15')
		})

		it('should limit year options based on start date when selecting end date', () => {
			const startDate = new Date(2024, 5, 15) // June 15, 2024
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate: null },
					maxYear: 2026,
				}),
			)

			act(() => {
				result.current.open()
			})
			act(() => {
				result.current.setActiveMode('end')
			})

			// Years should be 2024-2026
			expect(result.current.yearOptions).toHaveLength(3)
			expect(result.current.yearOptions[0].value).toBe('2026')
			expect(result.current.yearOptions[2].value).toBe('2024')
		})
	})

	describe('maxDate constraint', () => {
		it('should limit month options when at maxDate year', () => {
			const maxDate = new Date(2024, 5, 15) // June 15, 2024
			const startDate = new Date(2024, 0, 1) // Jan 1, 2024
			const { result } = renderHook(() =>
				useDateRangePicker({
					initialValue: { startDate, endDate: null },
					maxDate,
				}),
			)

			act(() => {
				result.current.open()
			})

			// Since we're at year 2024 with maxDate June 15, 2024, months should be limited to 1-6
			expect(result.current.monthOptions).toHaveLength(6)

			// Set month to June in 2024
			act(() => {
				result.current.setTempMonth(6)
			})

			// Day options should be limited to 15
			expect(result.current.dayOptions).toHaveLength(15)
		})

		it('should limit year options to maxDate year', () => {
			const maxDate = new Date(2022, 11, 31) // December 31, 2022
			const { result } = renderHook(() => useDateRangePicker({ maxDate }))

			expect(result.current.yearOptions[0].value).toBe('2022')
		})
	})

	describe('updateValue', () => {
		it('should update both value and tempValue externally', () => {
			const { result } = renderHook(() => useDateRangePicker({}))

			const newValue = {
				startDate: new Date(2023, 0, 1),
				endDate: new Date(2023, 0, 31),
			}
			act(() => {
				result.current.updateValue(newValue)
			})

			expect(result.current.value).toEqual(newValue)
			expect(result.current.tempValue).toEqual(newValue)
		})
	})
})
