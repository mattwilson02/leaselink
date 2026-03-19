import { fireEvent, waitFor } from '@testing-library/react-native'
import { render } from '@/utils/test-utils'
import { DateRangePicker } from '@/components/DatePicker'
import { Text } from 'react-native'

jest.mock('@sf-digital-ui/tokens', () => ({
	colors: {
		neutral: {
			'40': '#f0f0f0',
			'300': '#cccccc',
			'400': '#888888',
			'500': '#666666',
			'600': '#444444',
			'700': '#222222',
		},
		'primary-green': {
			'50': '#e6f7f0',
			'200': '#80d9b5',
			'300': '#4dcc99',
			'600': '#00875a',
			'700': '#006644',
		},
	},
}))

jest.mock('@sf-digital-ui/react-native', () => {
	const { Text, TouchableOpacity } = require('react-native')
	return {
		Text: ({ children, ...props }: { children: React.ReactNode }) => (
			<Text {...props}>{children}</Text>
		),
		Button: {
			Root: ({
				children,
				onPress,
				disabled,
				style,
			}: {
				children: React.ReactNode
				onPress?: () => void
				disabled?: boolean
				style?: object
			}) => (
				<TouchableOpacity onPress={onPress} disabled={disabled} style={style}>
					{children}
				</TouchableOpacity>
			),
			Text: ({ children }: { children: React.ReactNode }) => (
				<Text>{children}</Text>
			),
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
