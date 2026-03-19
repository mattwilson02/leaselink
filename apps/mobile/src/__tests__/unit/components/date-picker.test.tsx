import { fireEvent, waitFor } from '@testing-library/react-native'
import { render } from '@/utils/test-utils'
import { DatePicker } from '@/components/DatePicker'
import { Text } from 'react-native'

jest.mock('@sf-digital-ui/tokens', () => ({
	colors: {
		neutral: {
			'40': '#f0f0f0',
			'400': '#888888',
			'500': '#666666',
			'600': '#444444',
			'700': '#222222',
		},
		'primary-green': {
			'50': '#e6f7f0',
			'600': '#00875a',
			'700': '#006644',
		},
	},
}))

describe('DatePicker', () => {
	beforeEach(() => {
		jest.useFakeTimers()
		jest.setSystemTime(new Date(2024, 5, 15)) // June 15, 2024
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('DatePicker.Root', () => {
		it('should render children', () => {
			const { getByText } = render(
				<DatePicker.Root>
					<Text>Test Child</Text>
				</DatePicker.Root>,
			)

			expect(getByText('Test Child')).toBeTruthy()
		})

		it('should accept mode prop', () => {
			const { getByText } = render(
				<DatePicker.Root mode='month-year'>
					<DatePicker.Trigger>
						<Text>Open</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal>
						<Text>Modal Content</Text>
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			expect(getByText('Open')).toBeTruthy()
		})
	})

	describe('DatePicker.Trigger', () => {
		it('should render children and open modal on press', async () => {
			const { getByText, queryByText } = render(
				<DatePicker.Root>
					<DatePicker.Trigger>
						<Text>Open Picker</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal>
						<Text>Modal Content</Text>
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			expect(getByText('Open Picker')).toBeTruthy()
			expect(queryByText('Modal Content')).toBeFalsy()

			fireEvent.press(getByText('Open Picker'))

			await waitFor(() => {
				expect(getByText('Modal Content')).toBeTruthy()
			})
		})

		it('should support render prop pattern', () => {
			const { getByText } = render(
				<DatePicker.Root value={{ day: 10, month: 3, year: 2024 }}>
					<DatePicker.Trigger>
						{({ value }) => (
							<Text>{`Day: ${value.day}, Month: ${value.month}`}</Text>
						)}
					</DatePicker.Trigger>
				</DatePicker.Root>,
			)

			expect(getByText('Day: 10, Month: 3')).toBeTruthy()
		})
	})

	describe('DatePicker.Modal', () => {
		it('should render with default title based on mode', async () => {
			const { getByText } = render(
				<DatePicker.Root mode='date'>
					<DatePicker.Trigger>
						<Text>Open</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal>
						<Text>Content</Text>
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('select_date_range')).toBeTruthy()
			})
		})

		it('should render with custom title', async () => {
			const { getByText } = render(
				<DatePicker.Root>
					<DatePicker.Trigger>
						<Text>Open</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal title='Custom Title'>
						<Text>Content</Text>
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Custom Title')).toBeTruthy()
			})
		})

		it('should render custom cancel and confirm text', async () => {
			const { getByText } = render(
				<DatePicker.Root>
					<DatePicker.Trigger>
						<Text>Open</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal cancelText='Dismiss' confirmText='Apply'>
						<Text>Content</Text>
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Dismiss')).toBeTruthy()
				expect(getByText('Apply')).toBeTruthy()
			})
		})

		it('should close modal on cancel press', async () => {
			const { getByText, queryByText } = render(
				<DatePicker.Root>
					<DatePicker.Trigger>
						<Text>Open</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal>
						<Text>Content</Text>
					</DatePicker.Modal>
				</DatePicker.Root>,
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

		it('should call onChange and close modal on confirm press', async () => {
			const onChange = jest.fn()
			const { getByText, queryByText } = render(
				<DatePicker.Root onChange={onChange}>
					<DatePicker.Trigger>
						<Text>Open</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal>
						<Text>Content</Text>
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Content')).toBeTruthy()
			})

			fireEvent.press(getByText('done'))

			await waitFor(() => {
				expect(onChange).toHaveBeenCalled()
				expect(queryByText('Content')).toBeFalsy()
			})
		})
	})

	describe('DatePicker.WheelPicker', () => {
		it('should render wheel pickers based on type', async () => {
			const { getByText } = render(
				<DatePicker.Root mode='date' value={{ day: 15, month: 6, year: 2024 }}>
					<DatePicker.Trigger>
						<Text>Open</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal>
						<DatePicker.WheelPicker type='day' label='Day' />
						<DatePicker.WheelPicker type='month' label='Month' />
						<DatePicker.WheelPicker type='year' label='Year' />
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('Day')).toBeTruthy()
				expect(getByText('Month')).toBeTruthy()
				expect(getByText('Year')).toBeTruthy()
			})
		})

		it('should render month picker with month names', async () => {
			const { getByText } = render(
				<DatePicker.Root
					mode='month-year'
					value={{ day: 1, month: 1, year: 2024 }}
				>
					<DatePicker.Trigger>
						<Text>Open</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal>
						<DatePicker.WheelPicker type='month' />
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			fireEvent.press(getByText('Open'))

			await waitFor(() => {
				expect(getByText('January')).toBeTruthy()
			})
		})
	})

	describe('full integration', () => {
		it('should update value on confirm', async () => {
			const onChange = jest.fn()
			const { getByText, queryByText } = render(
				<DatePicker.Root
					mode='year'
					value={{ day: 1, month: 1, year: 2024 }}
					onChange={onChange}
				>
					<DatePicker.Trigger>
						<Text>Open Year Picker</Text>
					</DatePicker.Trigger>
					<DatePicker.Modal>
						<DatePicker.WheelPicker type='year' />
					</DatePicker.Modal>
				</DatePicker.Root>,
			)

			expect(getByText('Open Year Picker')).toBeTruthy()

			fireEvent.press(getByText('Open Year Picker'))

			await waitFor(() => {
				expect(getByText('select_year')).toBeTruthy()
			})

			fireEvent.press(getByText('done'))

			await waitFor(() => {
				expect(onChange).toHaveBeenCalledWith(
					expect.objectContaining({ year: 2024 }),
				)
				expect(queryByText('select_year')).toBeFalsy()
			})
		})
	})
})
