import { render, fireEvent, act, waitFor } from '@/utils/test-utils'
import SetPassword from '@/app/(onboarding)/set-password'

describe('SetPassword Component', () => {
	const mockRouter = {
		back: jest.fn(),
		replace: jest.fn(),
		push: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
	})

	it('renders correctly with all required elements', () => {
		const { getByText, getByTestId } = render(<SetPassword />)

		expect(getByText('setup_password')).toBeTruthy()
		expect(getByText('create_secure_password')).toBeTruthy()
		expect(getByText('setup_password_description')).toBeTruthy()

		expect(getByText('password')).toBeTruthy()
		expect(getByText('retype_password')).toBeTruthy()
		expect(getByTestId('password-input')).toBeTruthy()
		expect(getByTestId('retypepassword-input')).toBeTruthy()

		expect(getByText('setup_your_password')).toBeTruthy()
	})

	it('shows error when password is too short', async () => {
		const { getAllByPlaceholderText, getByText } = render(<SetPassword />)

		const passwordInputs = getAllByPlaceholderText('********')
		const submitButton = getByText('setup_your_password')

		await act(async () => {
			fireEvent.changeText(passwordInputs[0], 'short')
			fireEvent.press(submitButton)
		})

		expect(getByText('password_min_length')).toBeTruthy()
	})

	it('shows error when passwords do not match', async () => {
		const { getAllByPlaceholderText, getByText } = render(<SetPassword />)

		const passwordInputs = getAllByPlaceholderText('********')

		await act(async () => {
			fireEvent.changeText(passwordInputs[0], 'Password123!')
			fireEvent.changeText(passwordInputs[1], 'DifferentPassword123!')
		})

		fireEvent.press(getByText('setup_your_password'))

		await waitFor(() => {
			expect(getByText('password_mismatch')).toBeTruthy()
		})
	})
})
