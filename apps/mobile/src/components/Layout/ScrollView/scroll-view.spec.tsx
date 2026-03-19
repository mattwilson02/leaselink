import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ScrollView } from '.'
import { baseLayoutStyles as styles } from '../styles'

describe('ScrollView', () => {
	it('applies default styles correctly', () => {
		const { getByTestId } = render(
			<ScrollView testID='scroll-view'>
				<Text>Test Content</Text>
			</ScrollView>,
		)

		const view = getByTestId('scroll-view')
		expect(view.props.style).toEqual([styles.componentWrapper, undefined])
	})

	it('applies custom styles correctly', () => {
		const customStyle = { backgroundColor: 'red' }
		const { getByTestId } = render(
			<ScrollView testID='scroll-view' style={customStyle}>
				<Text>Test Content</Text>
			</ScrollView>,
		)

		const view = getByTestId('scroll-view')
		expect(view.props.style).toEqual([styles.componentWrapper, customStyle])
	})

	it('renders children correctly', () => {
		const { getByText } = render(
			<ScrollView>
				<Text>Test Content</Text>
			</ScrollView>,
		)

		expect(getByText('Test Content')).toBeTruthy()
	})

	it('passes through additional props', () => {
		const { getByTestId } = render(
			<ScrollView
				testID='scroll-view'
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				<Text>Test Content</Text>
			</ScrollView>,
		)

		const view = getByTestId('scroll-view')
		expect(view.props.horizontal).toBe(true)
		expect(view.props.showsHorizontalScrollIndicator).toBe(false)
	})
})
