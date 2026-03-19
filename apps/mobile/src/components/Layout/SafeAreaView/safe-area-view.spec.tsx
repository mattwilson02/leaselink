import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SafeAreaView } from '.'
import { baseLayoutStyles as styles } from '../styles'

const initialMetrics = {
	frame: { x: 0, y: 0, width: 375, height: 812 },
	insets: { top: 44, left: 0, right: 0, bottom: 34 },
}

const renderWithProvider = (component: React.ReactElement) => {
	return render(
		<SafeAreaProvider initialMetrics={initialMetrics}>
			{component}
		</SafeAreaProvider>,
	)
}

describe('SafeAreaView', () => {
	it('applies default styles correctly', () => {
		const { getByTestId } = renderWithProvider(
			<SafeAreaView testID='safe-area'>
				<Text>Test Content</Text>
			</SafeAreaView>,
		)

		const view = getByTestId('safe-area')
		expect(view.props.style).toEqual([
			styles.container,
			styles.padding,
			styles.componentWrapper,
			undefined,
		])
	})

	it('applies custom styles correctly', () => {
		const customStyle = { backgroundColor: 'red' }
		const { getByTestId } = renderWithProvider(
			<SafeAreaView testID='safe-area' style={customStyle}>
				<Text>Test Content</Text>
			</SafeAreaView>,
		)

		const view = getByTestId('safe-area')
		expect(view.props.style).toEqual([
			styles.container,
			styles.padding,
			styles.componentWrapper,
			customStyle,
		])
	})

	it('renders children correctly', () => {
		const { getByText } = renderWithProvider(
			<SafeAreaView>
				<Text>Test Content</Text>
			</SafeAreaView>,
		)

		expect(getByText('Test Content')).toBeTruthy()
	})
})
