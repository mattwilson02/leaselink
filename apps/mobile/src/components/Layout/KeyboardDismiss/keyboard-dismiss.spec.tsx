import { render, fireEvent } from '@testing-library/react-native'
import { Keyboard, Text } from 'react-native'
import { KeyboardDismiss } from '.'
import { baseLayoutStyles as styles } from '../styles'

describe('KeyboardDismiss', () => {
	const mockDismiss = jest.fn()
	Keyboard.dismiss = mockDismiss

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('calls Keyboard.dismiss when pressed', () => {
		const { getByTestId } = render(
			<KeyboardDismiss testID='dismiss-press'>
				<Text>Test Content</Text>
			</KeyboardDismiss>,
		)

		fireEvent.press(getByTestId('dismiss-press'))
		expect(mockDismiss).toHaveBeenCalled()
	})

	it('applies styles correctly', () => {
		const customStyle = { backgroundColor: 'red' }
		const { getByTestId } = render(
			<KeyboardDismiss testID='dismiss-press' style={customStyle}>
				<Text>Test Content</Text>
			</KeyboardDismiss>,
		)

		const pressable = getByTestId('dismiss-press')
		expect(pressable.props.style).toEqual([
			styles.componentWrapper,
			customStyle,
		])
	})

	it('handles non-object style prop', () => {
		const { getByTestId } = render(
			<KeyboardDismiss testID='dismiss-press' style={[]}>
				<Text>Test Content</Text>
			</KeyboardDismiss>,
		)

		const pressable = getByTestId('dismiss-press')
		expect(pressable.props.style).toEqual([styles.componentWrapper, []])
	})

	it('is not accessible', () => {
		const { getByTestId } = render(
			<KeyboardDismiss testID='dismiss-press'>
				<Text>Test Content</Text>
			</KeyboardDismiss>,
		)

		const pressable = getByTestId('dismiss-press')
		expect(pressable.props.accessible).toBe(false)
	})

	it('renders children correctly', () => {
		const { getByText } = render(
			<KeyboardDismiss>
				<Text>Test Content</Text>
			</KeyboardDismiss>,
		)

		expect(getByText('Test Content')).toBeTruthy()
	})
})
