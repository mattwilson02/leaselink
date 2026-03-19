import { render } from '@testing-library/react-native'
import { ErrorText } from './index'

describe('ErrorText component', () => {
	it('renders error text when hasError is true', () => {
		const { getByText } = render(
			<ErrorText hasError={true}>Error message</ErrorText>,
		)

		const errorText = getByText('Error message')
		expect(errorText).toBeTruthy()
	})
})
