import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import ConfirmEmail from '@/app/(onboarding)/confirm-email'
import { FAILED_ATTEMPTS_KEY } from '@/hooks/useFailedAttempts'
import { authClient } from '@/services/auth'

describe('ConfirmEmail Component', () => {
	const mockAsyncStorage = require('@react-native-async-storage/async-storage')

	beforeEach(() => {
		mockAsyncStorage.getItem.mockReset()
		mockAsyncStorage.setItem.mockReset()
		mockAsyncStorage.removeItem.mockReset()

		mockAsyncStorage.getItem.mockResolvedValue(null)
		mockAsyncStorage.setItem.mockResolvedValue(undefined)
		mockAsyncStorage.removeItem.mockResolvedValue(undefined)

		const mockRouter = {
			back: jest.fn(),
			replace: jest.fn(),
			push: jest.fn(),
		}
		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('renders initial email input screen correctly', () => {
		render(<ConfirmEmail />)

		expect(screen.getByTestId('confirm-email-heading')).toHaveTextContent(
			'welcome',
		)
		expect(screen.getByText('we_are_glad')).toBeTruthy()
		expect(screen.getByText('confirm_email')).toBeTruthy()

		expect(screen.getByTestId('email-input')).toBeTruthy()
		expect(screen.getByTestId('enter-email')).toHaveTextContent('continue')
		expect(screen.getByText('back')).toBeTruthy()

		expect(screen.queryByText('secure_code')).toBeFalsy()
	})

	it('validates email input correctly', async () => {
		render(<ConfirmEmail />)

		const emailInput = screen.getByTestId('email-input')
		const submitButton = screen.getByTestId('enter-email')

		fireEvent.changeText(emailInput, 'invalid-email')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(screen.getByText('email_invalid')).toBeTruthy()
		})

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(screen.queryByText('email_invalid')).toBeFalsy()
		})
	})

	it('calls better auth api with correct parameters when submitting email', async () => {
		;(authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
			data: { success: true },
			error: null,
		})

		render(<ConfirmEmail />)

		const emailInput = screen.getByTestId('email-input')
		const submitButton = screen.getByTestId('enter-email')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
				email: 'test@example.com',
				type: 'sign-in',
			})
		})
	})

	it('transitions to verification code view after email submission', async () => {
		;(authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
			data: { success: true },
			error: null,
		})

		render(<ConfirmEmail />)

		const emailInput = screen.getByTestId('email-input')
		const submitButton = screen.getByTestId('enter-email')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(screen.getByText('check_email')).toBeTruthy()
			expect(screen.getByText('we_sent_code')).toBeTruthy()
			expect(screen.getByText('enter_code_verify')).toBeTruthy()
			expect(screen.getByText('secure_code')).toBeTruthy()
			expect(screen.getByText('verify_email')).toBeTruthy()
		})
	})

	it('verifies code and redirects after successful verification', async () => {
		;(authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
			data: { success: true },
			error: null,
		})
		;(authClient.signIn.emailOtp as jest.Mock).mockResolvedValue({
			data: { token: 'session-123' },
			error: null,
		})
		const mockRouter = {
			back: jest.fn(),
			replace: jest.fn(),
			push: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmEmail />)

		const emailInput = screen.getByTestId('email-input')
		const submitButton = screen.getByTestId('enter-email')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(screen.getByText('secure_code')).toBeTruthy()
		})

		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		const verifyButton = screen.getByText('verify_email')
		fireEvent.press(verifyButton)

		await waitFor(() => {
			expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
				email: 'test@example.com',
				otp: '123456',
			})

			expect(mockRouter.push).toHaveBeenCalledWith(
				'/(onboarding)/email-verified',
			)

			expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
				FAILED_ATTEMPTS_KEY,
			)
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

	it('handles API errors gracefully and increments failed attempts', async () => {
		mockAsyncStorage.getItem.mockResolvedValue('0')
		;(authClient.emailOtp.sendVerificationOtp as jest.Mock).mockRejectedValue(
			new Error('API error'),
		)
		const mockRouter = {
			back: jest.fn(),
			replace: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmEmail />)

		const emailInput = screen.getByTestId('email-input')
		const submitButton = screen.getByTestId('enter-email')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(screen.getByText('API error')).toBeTruthy() // Check if the error message is displayed in the ErrorModal
			expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
				FAILED_ATTEMPTS_KEY,
				'1',
			)
		})
	})

	it('redirects to too-many-attempts page when max attempts reached', async () => {
		mockAsyncStorage.getItem.mockResolvedValue('3')

		const mockRouter = {
			back: jest.fn(),
			replace: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmEmail />)

		// Wait for the component to load and redirect
		await waitFor(() => {
			expect(mockRouter.replace).toHaveBeenCalledWith(
				'/(onboarding)/too-many-attempts',
			)
		})
	})

	it('automatically verifies code when 6th digit is entered', async () => {
		;(authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
			data: { success: true },
			error: null,
		})
		;(authClient.signIn.emailOtp as jest.Mock).mockResolvedValue({
			data: { token: 'session-123' },
			error: null,
		})
		const mockRouter = {
			back: jest.fn(),
			replace: jest.fn(),
			push: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmEmail />)

		const emailInput = screen.getByTestId('email-input')
		const submitButton = screen.getByTestId('enter-email')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(screen.getByText('secure_code')).toBeTruthy()
		})

		// Simulate completing the PIN input
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		// Should automatically verify without pressing the button
		await waitFor(() => {
			expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
				email: 'test@example.com',
				otp: '123456',
			})

			expect(mockRouter.push).toHaveBeenCalledWith(
				'/(onboarding)/email-verified',
			)
		})
	})

	it('shows error modal when auto-verification fails', async () => {
		;(authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
			data: { success: true },
			error: null,
		})
		;(authClient.signIn.emailOtp as jest.Mock).mockRejectedValue(
			new Error('Invalid verification code'),
		)

		render(<ConfirmEmail />)

		const emailInput = screen.getByTestId('email-input')
		const submitButton = screen.getByTestId('enter-email')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(screen.getByText('secure_code')).toBeTruthy()
		})

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
		;(authClient.emailOtp.sendVerificationOtp as jest.Mock).mockResolvedValue({
			data: { success: true },
			error: null,
		})
		;(authClient.signIn.emailOtp as jest.Mock).mockResolvedValue({
			data: null,
			error: { message: 'Code expired' },
		})
		const mockRouter = {
			back: jest.fn(),
			replace: jest.fn(),
			push: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmEmail />)

		const emailInput = screen.getByTestId('email-input')
		const submitButton = screen.getByTestId('enter-email')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(screen.getByText('secure_code')).toBeTruthy()
		})

		// Complete the PIN to trigger auto-verification
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		await waitFor(() => {
			expect(screen.getByText('Code expired')).toBeTruthy()
		})

		// Should not redirect
		expect(mockRouter.push).not.toHaveBeenCalled()
	})
})
