import { render } from '@testing-library/react-native'
import { GroupInput } from './index'

describe('GroupInput component', () => {
	it('passes additional props to View', () => {
		const testID = 'test-group-input'
		const { getByTestId } = render(<GroupInput testID={testID} />)

		expect(getByTestId(testID)).toBeTruthy()
	})
})
