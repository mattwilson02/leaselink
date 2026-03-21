import { fireEvent, waitFor } from '@testing-library/react-native'
import { render } from '@/utils/test-utils'
import { DateRangePicker } from '@/components/DatePicker'
import { Text } from 'react-native'

jest.mock('@/design-system/theme', () => {
	const actual = jest.requireActual('@/design-system/theme')
	return {
		...actual,
		colors: {
			...actual.colors,
			neutral: {
				'20': '#f0f0f0',
				'300': '#cccccc',
				'400': '#888888',
				'500': '#666666',
				'600': '#444444',
				'700': '#222222',
			},
			primary: '#00875a',
			foreground: '#006644',
			background: '#ffffff',
			border: '#e5e7eb',
			card: '#ffffff',
			muted: '#f3f4f6',
			mutedForeground: '#6b7280',
		},
	}
})

describe('DateRangePicker', () => {
	beforeEach(() => {
		jest.useFakeTimers()
		jest.setSystemTime(new Date(2024, 5, 15)) // June 15, 2024
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('DateRangePicker.Root', () => {
		it('should render children', () => {
			const { getByText } = render(
				<DateRangePicker.Root>
					<Text>Test Child</Text>
				</DateRangePicker.Root>,
			)

			expect(getByText('Test Child')).toBeTruthy()
		})

		it('should accept initial value', () => {
			const startDate = new Date(2024, 0, 1)
			const endDate = new Date(2024, 0, 31)
			const { getByText } = render(
				<DateRangePicker.Root value={{ startDate, endDate }}>
					<DateRangePicker.Trigger>
						{({ value }) => (
							<Text>
								{value.startDate ? 'Has Start' : 'No Start'} -{' '}
								{value.endDate ? 'Has End' : 'No End'}
							</Text>
						)}
					</DateRangePicker.Trigger>
				</DateRangePicker.Root>,
			)

			expect(getByText('Has Start - Has End')).toBeTruthy()
		})
	})

	describe('DateRangePicker.Trigger', () => {
		it('should render children and open modal on press', async () => {
			const { getByText, queryByText } = render(
				<DateRangePicker.Root>
					<DateRangePicker.Trigger>
						<Text>Open Picker</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal>
						<Text>Modal Content</Text>
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			expect(getByText('Open Picker')).toBeTruthy()
			expect(queryByText('Modal Content')).toBeFalsy()

			fireEvent.press(getByText('Open Picker'))

			await waitFor(() => {
				expect(getByText('Modal Content')).toBeTruthy()
			})
		})

		it('should support render prop pattern', () => {
			const startDate = new Date(2024, 0, 10)
			const { getByText } = render(
				<DateRangePicker.Root value={{ startDate, endDate: null }}>
					<DateRangePicker.Trigger>
						{({ value }) => (
							<Text>
								{value.startDate
									? `Start: ${value.startDate.getDate()}`
									: 'No Start'}
							</Text>
						)}
					</DateRangePicker.Trigger>
				</DateRangePicker.Root>,
			)

			expect(getByText('Start: 10')).toBeTruthy()
		})
	})

	describe('DateRangePicker.Modal', () => {
		it('should render with default title', async () => {
			const { getByText } = render(
				<DateRangePicker.Root>
					<DateRangePicker.Trigger>
						<Text>Open</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal>
						<Text>Content</Text>
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('select_date_range')).toBeTruthy()
			})
		})

		it('should render with custom title', async () => {
			const { getByText } = render(
				<DateRangePicker.Root>
					<DateRangePicker.Trigger>
						<Text>Open</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal title='Custom Title'>
						<Text>Content</Text>
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Custom Title')).toBeTruthy()
			})
		})

		it('should render custom cancel and confirm text', async () => {
			const { getByText } = render(
				<DateRangePicker.Root>
					<DateRangePicker.Trigger>
						<Text>Open</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal cancelText='Dismiss' confirmText='Apply'>
						<Text>Content</Text>
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Dismiss')).toBeTruthy()
				expect(getByText('Apply')).toBeTruthy()
			})
		})

		it('should close modal on cancel press', async () => {
			const { getByText, queryByText } = render(
				<DateRangePicker.Root>
					<DateRangePicker.Trigger>
						<Text>Open</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal>
						<Text>Content</Text>
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Content')).toBeTruthy()
			})

			fireEvent.press(getByText('cancel'))

			await waitFor(() => {
				expect(queryByText('Content')).toBeFalsy()
			})
		})

		it('should show start and end date toggle buttons', async () => {
			const startDate = new Date(2024, 0, 10)
			const endDate = new Date(2024, 0, 20)
			const { getByText } = render(
				<DateRangePicker.Root value={{ startDate, endDate }}>
					<DateRangePicker.Trigger>
						<Text>Open</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal>
						<Text>Content</Text>
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('10 Jan, 2024')).toBeTruthy()
				expect(getByText('20 Jan, 2024')).toBeTruthy()
			})
		})

		it('should show Select for null dates', async () => {
			const { getByText, getAllByText } = render(
				<DateRangePicker.Root>
					<DateRangePicker.Trigger>
						<Text>Open</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal>
						<Text>Content</Text>
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				const selectButtons = getAllByText('select')
				expect(selectButtons).toHaveLength(2)
			})
		})
	})

	describe('DateRangePicker.WheelPicker', () => {
		it('should render wheel pickers based on type', async () => {
			const startDate = new Date(2024, 0, 15)
			const { getByText } = render(
				<DateRangePicker.Root value={{ startDate, endDate: null }}>
					<DateRangePicker.Trigger>
						<Text>Open</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal>
						<DateRangePicker.WheelPicker type='day' label='Day' />
						<DateRangePicker.WheelPicker type='month' label='Month' />
						<DateRangePicker.WheelPicker type='year' label='Year' />
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Day')).toBeTruthy()
				expect(getByText('Month')).toBeTruthy()
				expect(getByText('Year')).toBeTruthy()
			})
		})
	})

	describe('full integration', () => {
		it('should call onChange when both dates are selected and confirmed', async () => {
			const onChange = jest.fn()
			const startDate = new Date(2024, 0, 10)
			const endDate = new Date(2024, 0, 20)
			const { getByText, queryByText } = render(
				<DateRangePicker.Root
					value={{ startDate, endDate }}
					onChange={onChange}
				>
					<DateRangePicker.Trigger>
						<Text>Open</Text>
					</DateRangePicker.Trigger>
					<DateRangePicker.Modal>
						<Text>Content</Text>
					</DateRangePicker.Modal>
				</DateRangePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Content')).toBeTruthy()
			})

			fireEvent.press(getByText('done'))

			await waitFor(() => {
				expect(onChange).toHaveBeenCalledWith({
					startDate,
					endDate,
				})
				expect(queryByText('Content')).toBeFalsy()
			})
		})
	})
})
