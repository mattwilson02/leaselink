import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ScrollWheelPicker } from '@/components/ScrollWheelPicker'

jest.mock('@/design-system/theme', () => ({
	colors: {
		neutral: {
			'20': '#f0f0f0',
			'400': '#888888',
			'600': '#444444',
			'700': '#222222',
		},
		primary: '#00875a',
		foreground: '#006644',
		background: '#ffffff',
		border: '#e5e7eb',
	},
}))

const ITEM_HEIGHT = 44

describe('ScrollWheelPicker', () => {
	const defaultItems = [
		{ value: '1', label: '1' },
		{ value: '2', label: '2' },
		{ value: '3', label: '3' },
		{ value: '4', label: '4' },
		{ value: '5', label: '5' },
	]

	describe('rendering', () => {
		it('should render all items', () => {
			const { getByText } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={jest.fn()}
				/>,
			)

			for (const item of defaultItems) {
				expect(getByText(item.label)).toBeTruthy()
			}
		})

		it('should render label when provided', () => {
			const { getByText } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={jest.fn()}
					label='Day'
				/>,
			)

			expect(getByText('Day')).toBeTruthy()
		})

		it('should not render label when not provided', () => {
			const { queryByText } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={jest.fn()}
				/>,
			)

			expect(queryByText('Day')).toBeFalsy()
		})

		it('should highlight the selected item', () => {
			const { getByText } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={jest.fn()}
				/>,
			)

			const selectedItem = getByText('3')
			// Check that the selected item has the selected style applied
			expect(selectedItem.props.style).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ color: '#006644', fontWeight: '600' }),
				]),
			)
		})

		it('should not highlight unselected items', () => {
			const { getByText } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={jest.fn()}
				/>,
			)

			const unselectedItem = getByText('1')
			// Unselected items should have the base style (not the selected style)
			expect(unselectedItem.props.style).toEqual(
				expect.arrayContaining([expect.objectContaining({ color: '#888888' })]),
			)
		})
	})

	describe('item press behavior', () => {
		it('should render items as tappable and respond to press', () => {
			const { getByText } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={jest.fn()}
				/>,
			)

			// Press should not throw - items are tappable
			expect(() => fireEvent.press(getByText('1'))).not.toThrow()
			expect(() => fireEvent.press(getByText('5'))).not.toThrow()
		})
	})

	describe('scroll behavior', () => {
		it('should call onValueChange when scroll ends at a new value', () => {
			const onValueChange = jest.fn()
			const { UNSAFE_getByType } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={onValueChange}
				/>,
			)

			const scrollView = UNSAFE_getByType(require('react-native').ScrollView)

			// Simulate scroll ending at index 1 (value "2")
			fireEvent(scrollView, 'momentumScrollEnd', {
				nativeEvent: {
					contentOffset: { y: 1 * ITEM_HEIGHT },
				},
			})

			expect(onValueChange).toHaveBeenCalledWith('2')
		})

		it('should not call onValueChange when scroll ends at the same value', () => {
			const onValueChange = jest.fn()
			const { UNSAFE_getByType } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={onValueChange}
				/>,
			)

			const scrollView = UNSAFE_getByType(require('react-native').ScrollView)

			// Simulate scroll ending at index 2 (value "3" - same as selected)
			fireEvent(scrollView, 'momentumScrollEnd', {
				nativeEvent: {
					contentOffset: { y: 2 * ITEM_HEIGHT },
				},
			})

			expect(onValueChange).not.toHaveBeenCalled()
		})
	})

	describe('value not in list - snap behavior', () => {
		it('should snap to beginning when selected value is less than first item', async () => {
			const onValueChange = jest.fn()
			const items = [
				{ value: '15', label: '15' },
				{ value: '16', label: '16' },
				{ value: '17', label: '17' },
			]

			render(
				<ScrollWheelPicker
					items={items}
					selectedValue='5' // Less than first item (15)
					onValueChange={onValueChange}
				/>,
			)

			await waitFor(() => {
				expect(onValueChange).toHaveBeenCalledWith('15')
			})
		})

		it('should snap to end when selected value is greater than last item', async () => {
			const onValueChange = jest.fn()
			const items = [
				{ value: '1', label: '1' },
				{ value: '2', label: '2' },
				{ value: '3', label: '3' },
			]

			render(
				<ScrollWheelPicker
					items={items}
					selectedValue='31' // Greater than last item (3)
					onValueChange={onValueChange}
				/>,
			)

			await waitFor(() => {
				expect(onValueChange).toHaveBeenCalledWith('3')
			})
		})

		it('should not call onValueChange when value is in the list', () => {
			const onValueChange = jest.fn()

			render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={onValueChange}
				/>,
			)

			// Should not be called since "3" is in the list
			expect(onValueChange).not.toHaveBeenCalled()
		})

		it('should handle empty items array', () => {
			const onValueChange = jest.fn()

			const { queryByText } = render(
				<ScrollWheelPicker
					items={[]}
					selectedValue='1'
					onValueChange={onValueChange}
				/>,
			)

			// Should not crash and should not call onValueChange
			expect(onValueChange).not.toHaveBeenCalled()
			expect(queryByText('1')).toBeFalsy()
		})
	})

	describe('flex prop', () => {
		it('should apply default flex of 1', () => {
			const { UNSAFE_getByType } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={jest.fn()}
				/>,
			)

			const container = UNSAFE_getByType(require('react-native').View)
			expect(container.props.style).toEqual(
				expect.arrayContaining([expect.objectContaining({ flex: 1 })]),
			)
		})

		it('should apply custom flex value', () => {
			const { UNSAFE_getByType } = render(
				<ScrollWheelPicker
					items={defaultItems}
					selectedValue='3'
					onValueChange={jest.fn()}
					flex={1.5}
				/>,
			)

			const container = UNSAFE_getByType(require('react-native').View)
			expect(container.props.style).toEqual(
				expect.arrayContaining([expect.objectContaining({ flex: 1.5 })]),
			)
		})
	})

	describe('month names (real-world use case)', () => {
		const monthItems = [
			{ value: '1', label: 'January' },
			{ value: '2', label: 'February' },
			{ value: '3', label: 'March' },
			{ value: '4', label: 'April' },
			{ value: '5', label: 'May' },
			{ value: '6', label: 'June' },
		]

		it('should render month names correctly', () => {
			const { getByText } = render(
				<ScrollWheelPicker
					items={monthItems}
					selectedValue='3'
					onValueChange={jest.fn()}
				/>,
			)

			expect(getByText('January')).toBeTruthy()
			expect(getByText('March')).toBeTruthy()
			expect(getByText('June')).toBeTruthy()
		})

		it('should snap to last month when selected month exceeds available months', async () => {
			const onValueChange = jest.fn()
			// Only show Jan-June, but selected is December (12)
			render(
				<ScrollWheelPicker
					items={monthItems}
					selectedValue='12'
					onValueChange={onValueChange}
				/>,
			)

			await waitFor(() => {
				expect(onValueChange).toHaveBeenCalledWith('6') // June
			})
		})
	})
})
