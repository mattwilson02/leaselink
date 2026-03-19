import { render } from '@testing-library/react-native'
import { Platform, Text } from 'react-native'
import { KeyboardAvoidingView } from '.'

describe('KeyboardAvoidingView', () => {
	const originalOS = Platform.OS

	afterEach(() => {
		Platform.OS = originalOS
	})

	it('renders with correct props for iOS', () => {
		Platform.OS = 'ios'

		const { getByText } = render(
			<KeyboardAvoidingView>
				<Text>Test Content</Text>
			</KeyboardAvoidingView>,
		)

		expect(getByText('Test Content')).toBeVisible()
	})

	it('renders with correct props for Android', () => {
		Platform.OS = 'android'

		const { getByText } = render(
			<KeyboardAvoidingView>
				<Text>Test Content</Text>
			</KeyboardAvoidingView>,
		)

		expect(getByText('Test Content')).toBeVisible()
	})

	it('passes through additional props', () => {
		const { getByTestId } = render(
			<KeyboardAvoidingView
				style={{ backgroundColor: 'red' }}
				testID='keyboard-view'
			>
				<Text>Test Content</Text>
			</KeyboardAvoidingView>,
		)

		const view = getByTestId('keyboard-view')
		expect(view.props.style).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ backgroundColor: 'red' }),
			]),
		)
	})

	it('renders children correctly', () => {
		const { getByText } = render(
			<KeyboardAvoidingView>
				<Text>Test Content</Text>
			</KeyboardAvoidingView>,
		)

		expect(getByText('Test Content')).toBeTruthy()
	})
})
