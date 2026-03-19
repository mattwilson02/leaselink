import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import ConfirmEmail from '@/app/(new-device)/confirm-email'
import { authClient } from '@/services/auth'

describe('NewDeviceConfirmEmail Component', () => {
	const mockRouter = {
		back: jest.fn(),
		replace: jest.fn(),
		push: jest.fn(),
	}

	beforeEach(() => {
		jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({
			password: 'test-password',
			email: 'test@example.com',
		})

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('renders screen correctly', () => {
		;(authClient.useSession as jest.Mock).mockReturnValue({
			data: {
				user: {
					phoneNumber: 'phone-id',
				},
			},
		})

		render(<ConfirmEmail />)

		expect(screen.getByText('check_email')).toBeTruthy()
		expect(screen.getByText('we_sent_code_to')).toBeTruthy()
		expect(screen.getByText('back')).toBeTruthy()
		expect(screen.getByText('test@example.com')).toBeTruthy()
		expect(screen.getByText('resend_code')).toBeTruthy()
	})

	it('handles verify code button press', async () => {
		;(authClient.useSession as jest.Mock).mockReturnValue({
			data: {
				user: {
					phoneNumber: 'phone-id',
				},
			},
		})
		;(authClient.signIn.emailOtp as jest.Mock).mockResolvedValueOnce({
			data: {
				token: 'email-token',
			},
		})

		render(<ConfirmEmail />)

		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		const verifyButton = screen.getByText('verify_email')
		fireEvent.press(verifyButton)

		await waitFor(() => {
			expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
				email: 'test@example.com',
				otp: '123456',
			})

			expect(mockRouter.push).toHaveBeenCalledWith({
				params: { password: 'test-password' },
				pathname: '/(new-device)/email-verified',
			})
		})
	})

	it('handles resend code button press', async () => {
		;(authClient.useSession as jest.Mock).mockReturnValue({
			data: null,
		})
		;(
			authClient.emailOtp.sendVerificationOtp as jest.Mock
		).mockResolvedValueOnce({
			data: {
				success: true,
			},
			error: null,
		})

		render(<ConfirmEmail />)
		const resendButton = screen.getByText('resend_code')

		fireEvent.press(resendButton)

		await waitFor(() => {
			expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
				email: 'test@example.com',
				type: 'sign-in',
			})
		})
	})

	it('handles back button press', () => {
		const mockRouter = {
			back: jest.fn(),
			replace: jest.fn(),
		}
		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmEmail />)

		const backButton = screen.getByTestId('back-button')
		fireEvent.press(backButton)

		expect(mockRouter.back).toHaveBeenCalled()
	})

	it('handles API errors gracefully', async () => {
		const mockError = new Error('API error')
		;(
			authClient.emailOtp.sendVerificationOtp as jest.Mock
		).mockRejectedValueOnce(mockError)

		render(<ConfirmEmail />)

		const resendButton = screen.getByText('resend_code')

		fireEvent.press(resendButton)

		await waitFor(() => {
			expect(screen.getByText('API error')).toBeTruthy()
		})
	})

	it('automatically verifies code when 6th digit is entered', async () => {
		;(authClient.signIn.emailOtp as jest.Mock).mockResolvedValueOnce({
			data: {
				token: 'email-token',
			},
		})

		render(<ConfirmEmail />)

		// Simulate completing the PIN input
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		// Should automatically verify without pressing the button
		await waitFor(() => {
			expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
				email: 'test@example.com',
				otp: '123456',
			})

			expect(mockRouter.push).toHaveBeenCalledWith({
				params: { password: 'test-password' },
				pathname: '/(new-device)/email-verified',
			})
		})
	})

	it('shows error modal when auto-verification fails', async () => {
		;(authClient.signIn.emailOtp as jest.Mock).mockRejectedValueOnce(
			new Error('Invalid verification code'),
		)

		render(<ConfirmEmail />)

		// Complete the PIN to trigger auto-verification
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '654321')

		// Should show error modal with the error message
		await waitFor(() => {
			expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
				email: 'test@example.com',
				otp: '654321',
			})
			expect(screen.getByText('Invalid verification code')).toBeTruthy()
		})
	})

	it('does not redirect when auto-verification returns error in response', async () => {
		;(authClient.signIn.emailOtp as jest.Mock).mockResolvedValueOnce({
			data: null,
			error: { message: 'Code expired' },
		})

		render(<ConfirmEmail />)

		// Complete the PIN to trigger auto-verification
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		await waitFor(() => {
			expect(screen.getByText('Code expired')).toBeTruthy()
		})

		// Should not redirect
		expect(mockRouter.push).not.toHaveBeenCalled()
	})
})
