import { formatDate } from './format-date'

describe('formatDate', () => {
	beforeEach(() => {
		// Mock the current time to ensure consistent test results
		jest.useFakeTimers()
		jest.setSystemTime(new Date('2025-12-12T14:30:00'))
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('when date is within the last 5 minutes', () => {
		it('should return "just_now" alias for current time', () => {
			const now = new Date('2025-12-12T14:30:00').toISOString()
			expect(formatDate(now)).toEqual({ type: 'alias', value: 'just_now' })
		})

		it('should return "just_now" alias for 1 minute ago', () => {
			const oneMinuteAgo = new Date('2025-12-12T14:29:00').toISOString()
			expect(formatDate(oneMinuteAgo)).toEqual({
				type: 'alias',
				value: 'just_now',
			})
		})

		it('should return "just_now" alias for 4 minutes ago', () => {
			const fourMinutesAgo = new Date('2025-12-12T14:26:00').toISOString()
			expect(formatDate(fourMinutesAgo)).toEqual({
				type: 'alias',
				value: 'just_now',
			})
		})

		it('should return time format for exactly 5 minutes ago', () => {
			const fiveMinutesAgo = new Date('2025-12-12T14:25:00').toISOString()
			expect(formatDate(fiveMinutesAgo)).toEqual({
				type: 'date',
				value: '14:25',
			})
		})

		it('should NOT return "just_now" for 6 minutes ago', () => {
			const sixMinutesAgo = new Date('2025-12-12T14:24:00').toISOString()
			expect(formatDate(sixMinutesAgo)).toEqual({
				type: 'date',
				value: '14:24',
			})
		})
	})

	describe('when date is today but more than 5 minutes ago', () => {
		it('should return time in HH:mm format for 10 minutes ago', () => {
			const tenMinutesAgo = new Date('2025-12-12T14:20:00').toISOString()
			expect(formatDate(tenMinutesAgo)).toEqual({
				type: 'date',
				value: '14:20',
			})
		})

		it('should return time in HH:mm format for 1 hour ago', () => {
			const oneHourAgo = new Date('2025-12-12T13:30:00').toISOString()
			expect(formatDate(oneHourAgo)).toEqual({ type: 'date', value: '13:30' })
		})

		it('should return time in HH:mm format for start of today', () => {
			const startOfToday = new Date('2025-12-12T00:00:00').toISOString()
			expect(formatDate(startOfToday)).toEqual({ type: 'date', value: '00:00' })
		})

		it('should return time in HH:mm format for future time today', () => {
			const laterToday = new Date('2025-12-12T18:45:00').toISOString()
			expect(formatDate(laterToday)).toEqual({ type: 'date', value: '18:45' })
		})

		it('should return time in HH:mm format for end of day today', () => {
			const endOfDay = new Date('2025-12-12T23:59:00').toISOString()
			expect(formatDate(endOfDay)).toEqual({ type: 'date', value: '23:59' })
		})
	})

	describe('when date is yesterday', () => {
		it('should return "yesterday" alias for yesterday at same time', () => {
			const yesterday = new Date('2025-12-11T14:30:00').toISOString()
			expect(formatDate(yesterday)).toEqual({
				type: 'alias',
				value: 'yesterday',
			})
		})

		it('should return "yesterday" alias for yesterday morning', () => {
			const yesterdayMorning = new Date('2025-12-11T09:00:00').toISOString()
			expect(formatDate(yesterdayMorning)).toEqual({
				type: 'alias',
				value: 'yesterday',
			})
		})

		it('should return "yesterday" alias for yesterday evening', () => {
			const yesterdayEvening = new Date('2025-12-11T22:00:00').toISOString()
			expect(formatDate(yesterdayEvening)).toEqual({
				type: 'alias',
				value: 'yesterday',
			})
		})

		it('should return "yesterday" alias for start of yesterday', () => {
			const startOfYesterday = new Date('2025-12-11T00:00:00').toISOString()
			expect(formatDate(startOfYesterday)).toEqual({
				type: 'alias',
				value: 'yesterday',
			})
		})

		it('should return "yesterday" alias for end of yesterday', () => {
			const endOfYesterday = new Date('2025-12-11T23:59:59').toISOString()
			expect(formatDate(endOfYesterday)).toEqual({
				type: 'alias',
				value: 'yesterday',
			})
		})
	})

	describe('when date is not today or yesterday', () => {
		it('should return date in DD MMM YYYY format for 2 days ago', () => {
			const twoDaysAgo = new Date('2025-12-10T14:30:00').toISOString()
			expect(formatDate(twoDaysAgo)).toEqual({
				type: 'date',
				value: '10 Dec 2025',
			})
		})

		it('should return date in DD MMM YYYY format for last week', () => {
			const lastWeek = new Date('2025-12-05T10:00:00').toISOString()
			expect(formatDate(lastWeek)).toEqual({
				type: 'date',
				value: '05 Dec 2025',
			})
		})

		it('should return date in DD MMM YYYY format for last month', () => {
			const lastMonth = new Date('2025-11-15T12:00:00').toISOString()
			expect(formatDate(lastMonth)).toEqual({
				type: 'date',
				value: '15 Nov 2025',
			})
		})

		it('should return date in DD MMM YYYY format for last year', () => {
			const lastYear = new Date('2024-12-12T14:30:00').toISOString()
			expect(formatDate(lastYear)).toEqual({
				type: 'date',
				value: '12 Dec 2024',
			})
		})

		it('should return date in DD MMM YYYY format for tomorrow', () => {
			const tomorrow = new Date('2025-12-13T14:30:00').toISOString()
			expect(formatDate(tomorrow)).toEqual({
				type: 'date',
				value: '13 Dec 2025',
			})
		})

		it('should return date in DD MMM YYYY format for next month', () => {
			const nextMonth = new Date('2026-01-15T10:00:00').toISOString()
			expect(formatDate(nextMonth)).toEqual({
				type: 'date',
				value: '15 Jan 2026',
			})
		})

		it('should return date in DD MMM YYYY format for next year', () => {
			const nextYear = new Date('2026-12-12T14:30:00').toISOString()
			expect(formatDate(nextYear)).toEqual({
				type: 'date',
				value: '12 Dec 2026',
			})
		})
	})

	describe('edge cases', () => {
		it('should handle leap year dates', () => {
			const leapYearDate = new Date('2024-02-29T12:00:00').toISOString()
			expect(formatDate(leapYearDate)).toEqual({
				type: 'date',
				value: '29 Feb 2024',
			})
		})

		it('should handle dates at midnight', () => {
			const midnight = new Date('2025-12-10T00:00:00').toISOString()
			expect(formatDate(midnight)).toEqual({
				type: 'date',
				value: '10 Dec 2025',
			})
		})

		it('should handle dates at end of day', () => {
			const endOfDay = new Date('2025-12-10T23:59:59').toISOString()
			expect(formatDate(endOfDay)).toEqual({
				type: 'date',
				value: '10 Dec 2025',
			})
		})
	})
})
