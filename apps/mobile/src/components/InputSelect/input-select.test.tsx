import { render, screen, fireEvent } from '@testing-library/react-native'
import { InputSelect } from '.'

describe('InputSelect', () => {
	const renderComponent = () => {
		return render(
			<InputSelect.Root testID='root'>
				<InputSelect.Select
					value=''
					onValueChange={(value) => {
						return value
					}}
				>
					<InputSelect.Trigger testID='trigger'>
						<InputSelect.SelectedValue
							testID='selected-value'
							placeholder='Select value'
						/>
					</InputSelect.Trigger>
					<InputSelect.ItemList testID='item-list'>
						<InputSelect.Item value='item' testID='item'>
							<InputSelect.ItemText>Text</InputSelect.ItemText>
						</InputSelect.Item>
					</InputSelect.ItemList>
				</InputSelect.Select>
				<InputSelect.TextControl
					testID='text-control'
					onChangeText={(text) => {
						return text
					}}
				/>
			</InputSelect.Root>,
		)
	}

	describe('Basic Rendering', () => {
		it('should render all base components', () => {
			renderComponent()

			expect(screen.getByTestId('root')).toBeTruthy()
			expect(screen.getByTestId('trigger')).toBeTruthy()
			expect(screen.getByTestId('selected-value')).toBeTruthy()
			expect(screen.getByTestId('text-control')).toBeTruthy()
		})

		it('should not show item list by default', () => {
			renderComponent()

			expect(screen.queryByTestId('item-list')).toBeNull()
		})

		it('should show item list when trigger is pressed', () => {
			renderComponent()

			const trigger = screen.getByTestId('trigger')
			fireEvent.press(trigger)

			expect(screen.getByTestId('item-list')).toBeTruthy()
		})
	})

	describe('Trigger Interactions', () => {
		it('should show item list when trigger is pressed', () => {
			renderComponent()

			const trigger = screen.getByTestId('trigger')
			fireEvent.press(trigger)

			expect(screen.getByTestId('item-list')).toBeTruthy()
		})
	})

	describe('Item Selection', () => {
		it('should display selected text when item is chosen', () => {
			renderComponent()

			const trigger = screen.getByTestId('trigger')
			fireEvent.press(trigger)

			const item = screen.getByTestId('item')
			fireEvent.press(item)
		})

		it('should close item list after selection', () => {
			renderComponent()

			const trigger = screen.getByTestId('trigger')
			fireEvent.press(trigger)

			const item = screen.getByTestId('item')
			fireEvent.press(item)
		})
	})

	describe('TextControl', () => {
		it('should accept text input', () => {
			renderComponent()

			const textControl = screen.getByTestId('text-control')
			fireEvent.changeText(textControl, 'test input')
		})
	})
})
