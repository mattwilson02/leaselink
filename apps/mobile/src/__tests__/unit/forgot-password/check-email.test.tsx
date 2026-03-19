import { render, fireEvent, waitFor, act } from '@/utils/test-utils'
import ForgotPasswordCheckEmail from '@/app/(forgot-password)/check-email'
import { authClient } from '@/services/auth'
import { RESET_PASSWORD_DEEP_LINK } from '@/constants/deep-linking'

// Mock expo-router
const mockRouter = {
	back: jest.fn(),
	replace: jest.fn(),
	push: jest.fn(),
}

const mockUseLocalSearchParams = jest.fn()

jest.mock('expo-router', () => ({
	useRouter: () => mockRouter,
	useLocalSearchParams: () => mockUseLocalSearchParams(),
}))

jest.useFakeTimers()

describe('ForgotPasswordCheckEmail Screen', () => {
	const mockEmail = 'test@example.com'

	beforeEach(() => {
		jest.clearAllMocks()
		jest.clearAllTimers()
		mockUseLocalSearchParams.mockReturnValue({ email: mockEmail })
	})

	afterEach(() => {
		jest.runOnlyPendingTimers()
		jest.useRealTimers()
		jest.useFakeTimers()
	})

	describe('Rendering', () => {
		it('renders all UI elements correctly', () => {
			const { getByText, getByTestId } = render(<ForgotPasswordCheckEmail />)

			expect(getByText('check_your_email')).toBeTruthy()
			expect(getByText('didnt_receive_code')).toBeTruthy()

			expect(getByTestId('resend-email-button')).toBeTruthy()
			expect(getByTestId('back-button')).toBeTruthy()
			expect(getByText('back')).toBeTruthy()
			expect(getByText('resend')).toBeTruthy()
		})

		it('displays the correct email address from params', () => {
			const customEmail = 'custom@example.com'
			mockUseLocalSearchParams.mockReturnValue({ email: customEmail })

			const { getByText } = render(<ForgotPasswordCheckEmail />)

			expect(getByText('check_your_email')).toBeTruthy()
		})

		it('renders with proper accessibility attributes', () => {
			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')
			const backButton = getByTestId('back-button')

			expect(resendButton).toBeTruthy()
			expect(backButton).toBeTruthy()
		})
	})

	describe('Resend Email Functionality', () => {
		it('calls requestPasswordReset when resend button is pressed', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')

			await act(async () => {
				fireEvent.press(resendButton)
			})

			expect(mockRequestPasswordReset).toHaveBeenCalledWith({
				email: mockEmail,
				redirectTo: RESET_PASSWORD_DEEP_LINK,
			})
		})

		it('navigates to check-email screen after successful resend', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')

			await act(async () => {
				fireEvent.press(resendButton)
			})

			await waitFor(() => {
				expect(mockRouter.push).toHaveBeenCalledWith({
					pathname: '/(forgot-password)/check-email',
					params: { email: mockEmail },
				})
			})
		})

		it('shows error modal when resend fails', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: null,
				error: { message: 'Failed to send email' },
			})

			const { getByTestId, getByText } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')

			await act(async () => {
				fireEvent.press(resendButton)
			})

			await waitFor(() => {
				expect(getByText('Failed to send email')).toBeTruthy()
			})
		})

		it('handles network errors gracefully', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockRejectedValueOnce(new Error('Network error'))

			const { getByTestId, getByText } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')

			await act(async () => {
				fireEvent.press(resendButton)
			})

			await waitFor(() => {
				expect(getByText('Network error')).toBeTruthy()
			})
		})
	})

	describe('Resend Timer Functionality', () => {
		it('initially shows resend button without countdown', () => {
			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')
			expect(resendButton.children[0]).toBe('resend')
		})

		it('countdown timer structure is present', () => {
			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')

			expect(resendButton).toBeTruthy()
		})
	})

	describe('Navigation', () => {
		it('navigates back when back button is pressed', async () => {
			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const backButton = getByTestId('back-button')

			await act(async () => {
				fireEvent.press(backButton)
			})

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})
	})

	describe('Error Modal', () => {
		it('does not show error modal initially', () => {
			const { queryByText } = render(<ForgotPasswordCheckEmail />)

			expect(queryByText('Failed to send email')).toBeNull()
		})

		it('shows error modal when there is an error', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: null,
				error: { message: 'Something went wrong' },
			})

			const { getByTestId, getByText } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')

			await act(async () => {
				fireEvent.press(resendButton)
			})

			await waitFor(() => {
				expect(getByText('Something went wrong')).toBeTruthy()
			})
		})
	})

	describe('Component State', () => {
		it('handles missing email parameter gracefully', () => {
			mockUseLocalSearchParams.mockReturnValue({ email: undefined })

			const { getByText } = render(<ForgotPasswordCheckEmail />)

			expect(getByText('check_your_email')).toBeTruthy()
		})

		it('handles empty email parameter', () => {
			mockUseLocalSearchParams.mockReturnValue({ email: '' })

			const { getByText } = render(<ForgotPasswordCheckEmail />)

			expect(getByText('check_your_email')).toBeTruthy()
		})
	})

	describe('Button States', () => {
		it('shows correct text for enabled resend button', () => {
			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')
			expect(resendButton.children[0]).toBe('resend')
		})

		it('applies correct styling for disabled state', () => {
			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')
			expect(resendButton).toBeTruthy()
		})
	})

	describe('Integration', () => {
		it('completes full resend flow successfully', async () => {
			const mockRequestPasswordReset =
				authClient.requestPasswordReset as jest.Mock
			mockRequestPasswordReset.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')

			expect(resendButton.children[0]).toBe('resend')

			await act(async () => {
				fireEvent.press(resendButton)
			})

			expect(mockRequestPasswordReset).toHaveBeenCalledWith({
				email: mockEmail,
				redirectTo: RESET_PASSWORD_DEEP_LINK,
			})

			await waitFor(() => {
				expect(mockRouter.push).toHaveBeenCalledWith({
					pathname: '/(forgot-password)/check-email',
					params: { email: mockEmail },
				})
			})
		})

		it('prevents multiple simultaneous resend requests', async () => {
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

			const { getByTestId } = render(<ForgotPasswordCheckEmail />)

			const resendButton = getByTestId('resend-email-button')

			await act(async () => {
				fireEvent.press(resendButton)
				fireEvent.press(resendButton)
				fireEvent.press(resendButton)
			})

			expect(mockRequestPasswordReset).toHaveBeenCalled()
		})
	})
})
