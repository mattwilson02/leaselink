import { render, fireEvent, waitFor } from '@/utils/test-utils'
import SignIn from '@/app/sign-in'
import { useAuthControllerHandle } from '@/gen/index'
import { authClient } from '@/services/auth'

describe('SignIn Component', () => {
	const mockRouter = {
		back: jest.fn(),
		replace: jest.fn(),
		push: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			refetch: jest.fn().mockResolvedValue({
				data: {
					isDeviceRecognized: true,
				},
			}),
		})
	})

	it('renders all form elements correctly', () => {
		const { getByText, getByTestId, getByPlaceholderText } = render(<SignIn />)

		expect(getByText('login_title')).toBeTruthy()

		expect(getByTestId('email-input')).toBeTruthy()
		expect(getByTestId('password-input')).toBeTruthy()
		expect(getByTestId('sign-in-button')).toBeTruthy()
		expect(getByPlaceholderText('enter_email')).toBeTruthy()
		expect(getByPlaceholderText('*********')).toBeTruthy()
	})

	it('handles form submission correctly', async () => {
		const { getByTestId } = render(<SignIn />)
		;(authClient.signIn.email as jest.Mock).mockResolvedValueOnce({
			data: {
				token: 'test-token',
			},
		})

		const emailInput = getByTestId('email-input')
		const passwordInput = getByTestId('password-input')
		const submitButton = getByTestId('sign-in-button')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.changeText(passwordInput, 'password123')

		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(authClient.signIn.email).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password123',
			})
			expect(mockRouter.replace).toHaveBeenCalledWith('/(main)/documents')
		})
	})

	it('handles form correctly, navigates to new device flow', async () => {
		;(useAuthControllerHandle as jest.Mock).mockReturnValueOnce({
			refetch: jest.fn().mockResolvedValue({
				data: {
					isDeviceRecognized: false,
				},
			}),
		})
		;(authClient.signIn.email as jest.Mock).mockResolvedValueOnce({
			data: {
				token: 'test-token',
			},
		})
		;(authClient.signOut as jest.Mock).mockResolvedValueOnce({})
		;(
			authClient.emailOtp.sendVerificationOtp as jest.Mock
		).mockResolvedValueOnce({
			data: {
				success: true,
			},
		})

		const { getByTestId } = render(<SignIn />)

		const emailInput = getByTestId('email-input')
		const passwordInput = getByTestId('password-input')
		const submitButton = getByTestId('sign-in-button')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.changeText(passwordInput, 'password123')

		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(authClient.signIn.email).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password123',
			})

			expect(authClient.signOut).toHaveBeenCalled()
			expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
				email: 'test@example.com',
				type: 'sign-in',
			})

			expect(mockRouter.push).toHaveBeenCalledWith({
				pathname: '/(new-device)/confirm-email',
				params: {
					email: 'test@example.com',
					password: 'password123',
				},
			})
		})
	})

	it('shows form errors when submitted without completion', async () => {
		const { getByTestId, getByText } = render(<SignIn />)

		const submitButton = getByTestId('sign-in-button')

		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(getByText('email_required')).toBeTruthy()
		})
	})

	it('handles invalid password error from Better Auth correctly', async () => {
		const { getByTestId, getByText } = render(<SignIn />)
		;(authClient.signIn.email as jest.Mock).mockResolvedValueOnce({
			data: null,
			error: {
				code: 'INVALID_EMAIL_OR_PASSWORD',
				message: 'The email or password you entered is incorrect.',
			},
		})

		const emailInput = getByTestId('email-input')
		const passwordInput = getByTestId('password-input')
		const submitButton = getByTestId('sign-in-button')

		fireEvent.changeText(emailInput, 'test@example.com')
		fireEvent.changeText(passwordInput, 'wrongpassword')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(getByText('password_incorrect')).toBeTruthy()
		})
	})
})
