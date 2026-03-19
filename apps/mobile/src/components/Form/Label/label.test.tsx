import { render } from '@testing-library/react-native'
import { Label } from './index'

describe('Label component', () => {
	it('renders label text with default props', () => {
		const { getByText } = render(<Label>Test Label</Label>)

		const label = getByText('Test Label')
		expect(label).toBeTruthy()
	})

	it('passes additional props to Text component', () => {
		const testID = 'test-label'
		const { getByTestId } = render(<Label testID={testID}>Prop Test</Label>)

		expect(getByTestId(testID)).toBeTruthy()
	})
})
