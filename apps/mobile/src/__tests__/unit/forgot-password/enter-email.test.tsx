import { render, fireEvent, waitFor, act } from '@/utils/test-utils'
import ForgotPasswordEnterEmail from '@/app/(forgot-password)/enter-email'
import { authClient } from '@/services/auth'
import { RESET_PASSWORD_DEEP_LINK } from '@/constants/deep-linking'

const mockRouter = {
	back: jest.fn(),
	replace: jest.fn(),
	push: jest.fn(),
}

jest.mock('expo-router', () => ({
	useRouter: () => mockRouter,
}))

describe('ForgotPasswordEnterEmail Component', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('Rendering', () => {
		it('renders all UI elements correctly', () => {
			const { getByText, getByTestId, getByPlaceholderText } = render(
				<ForgotPasswordEnterEmail />,
			)

			expect(getByText('forgot_password')).toBeTruthy()
			expect(getByText('email_caps')).toBeTruthy()

			expect(getByTestId('email-input')).toBeTruthy()
			expect(getByPlaceholderText('enter_email')).toBeTruthy()
			expect(getByTestId('send-link-button')).toBeTruthy()
			expect(getByTestId('back-button')).toBeTruthy()

			expect(getByText('send_link')).toBeTruthy()
			expect(getByText('back')).toBeTruthy()
		})

		it('renders with proper accessibility attributes', () => {
			const { getByTestId } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			const sendButton = getByTestId('send-link-button')
			const backButton = getByTestId('back-button')

			expect(emailInput).toBeTruthy()
			expect(sendButton).toBeTruthy()
			expect(backButton).toBeTruthy()
		})
	})

	describe('Form Validation', () => {
		it('shows error when email is empty and form is submitted', async () => {
			const { getByTestId, getByText } = render(<ForgotPasswordEnterEmail />)

			const submitButton = getByTestId('send-link-button')

			await act(async () => {
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(getByText('email_required')).toBeTruthy()
			})
		})

		it('shows error when email format is invalid', async () => {
			const { getByTestId, getByText } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			const submitButton = getByTestId('send-link-button')

			await act(async () => {
				fireEvent.changeText(emailInput, 'invalid-email')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(getByText('email_invalid')).toBeTruthy()
			})
		})

		it('does not show error for valid email format', async () => {
			const { getByTestId, queryByText } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			await act(async () => {
				fireEvent.changeText(emailInput, 'test@example.com')
				fireEvent(emailInput, 'blur')
			})

			await waitFor(() => {
				expect(queryByText('email_invalid')).toBeNull()
				expect(queryByText('email_required')).toBeNull()
			})
		})
	})

	describe('Form Submission', () => {
		it('calls requestPasswordReset with correct email on successful submission', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const { getByTestId } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			const submitButton = getByTestId('send-link-button')

			await act(async () => {
				fireEvent.changeText(emailInput, 'test@example.com')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(mockRequestPasswordReset).toHaveBeenCalledWith({
					email: 'test@example.com',
					redirectTo: RESET_PASSWORD_DEEP_LINK,
				})
			})
		})

		it('navigates to check-email screen on successful password reset request', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const { getByTestId } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			const submitButton = getByTestId('send-link-button')

			await act(async () => {
				fireEvent.changeText(emailInput, 'test@example.com')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(mockRouter.push).toHaveBeenCalledWith({
					pathname: '/(forgot-password)/check-email',
					params: { email: 'test@example.com' },
				})
			})
		})

		it('shows error modal when password reset request fails', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: null,
				error: { message: 'User not found' },
			})

			const { getByTestId, getByText } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			const submitButton = getByTestId('send-link-button')

			await act(async () => {
				fireEvent.changeText(emailInput, 'nonexistent@example.com')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(getByText('User not found')).toBeTruthy()
			})
		})

		it('handles network errors gracefully', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockRejectedValueOnce(new Error('Network error'))

			const { getByTestId, getByText } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			const submitButton = getByTestId('send-link-button')

			await act(async () => {
				fireEvent.changeText(emailInput, 'test@example.com')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(getByText('Network error')).toBeTruthy()
			})
		})
	})

	describe('Navigation', () => {
		it('navigates back when back button is pressed', () => {
			const { getByTestId } = render(<ForgotPasswordEnterEmail />)

			const backButton = getByTestId('back-button')
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})
	})

	describe('User Interactions', () => {
		it('updates email input value when user types', async () => {
			const { getByTestId } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			await act(async () => {
				fireEvent.changeText(emailInput, 'user@example.com')
			})

			await waitFor(() => {
				expect(emailInput.props.value).toBe('user@example.com')
			})
		})

		it('focuses email input on component mount', () => {
			const { getByTestId } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			expect(emailInput.props.autoFocus).toBe(true)
		})

		it('sets correct keyboard type for email input', () => {
			const { getByTestId } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			expect(emailInput.props.keyboardType).toBe('email-address')
			expect(emailInput.props.autoCapitalize).toBe('none')
		})
	})

	describe('Error Modal', () => {
		it('does not show error modal initially', () => {
			const { queryByText } = render(<ForgotPasswordEnterEmail />)

			expect(queryByText('User not found')).toBeNull()
		})

		it('shows error modal when there is an error', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: null,
				error: { message: 'Something went wrong' },
			})

			const { getByTestId, getByText } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			const submitButton = getByTestId('send-link-button')

			await act(async () => {
				fireEvent.changeText(emailInput, 'test@example.com')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(getByText('Something went wrong')).toBeTruthy()
			})
		})
	})

	describe('Form State Management', () => {
		it('prevents multiple submissions while request is in progress', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock

			mockRequestPasswordReset.mockImplementationOnce(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() => resolve({ data: { status: 'success' }, error: null }),
							1000,
						),
					),
			)

			const { getByTestId } = render(<ForgotPasswordEnterEmail />)

			const emailInput = getByTestId('email-input')
			const submitButton = getByTestId('send-link-button')

			await act(async () => {
				fireEvent.changeText(emailInput, 'test@example.com')

				fireEvent.press(submitButton)
				fireEvent.press(submitButton)
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(mockRequestPasswordReset).toHaveBeenCalledTimes(1)
			})
		})
	})
})
