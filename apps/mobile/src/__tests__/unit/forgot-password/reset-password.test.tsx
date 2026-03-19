import { render, fireEvent, waitFor, act } from '@/utils/test-utils'
import SetPassword from '@/app/(forgot-password)/reset-password'
import { authClient } from '@/services/auth'
import { Alert } from 'react-native'

const mockRouter = {
	back: jest.fn(),
	replace: jest.fn(),
	push: jest.fn(),
}

const mockUseLocalSearchParams = jest.fn()
const mockClearCredentials = jest.fn()

jest.mock('expo-router', () => ({
	useRouter: () => mockRouter,
	useLocalSearchParams: () => mockUseLocalSearchParams(),
}))

jest.mock('@/hooks/useLocalCredentials', () => ({
	useLocalCredentials: () => ({
		clearCredentials: mockClearCredentials,
	}),
}))

describe('SetPassword Component', () => {
	const mockToken = 'valid-reset-token'
	const mockAlertSpy = jest.spyOn(Alert, 'alert')

	beforeEach(() => {
		jest.clearAllMocks()
		mockUseLocalSearchParams.mockReturnValue({ token: mockToken })
	})

	describe('Rendering', () => {
		it('renders all UI elements correctly', () => {
			const { getByText, getByTestId, getAllByPlaceholderText } = render(
				<SetPassword />,
			)

			expect(getByText('setup_password')).toBeTruthy()
			expect(getByText('create_secure_password')).toBeTruthy()

			expect(getByText('password')).toBeTruthy()
			expect(getByText('retype_password')).toBeTruthy()

			expect(getByTestId('password-input')).toBeTruthy()
			expect(getByTestId('retypepassword-input')).toBeTruthy()
			expect(getAllByPlaceholderText('********')).toHaveLength(2)

			expect(getByText('save_new_password')).toBeTruthy()
		})

		it('renders with proper accessibility attributes', () => {
			const { getByTestId } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')

			expect(passwordInput).toBeTruthy()
			expect(retypePasswordInput).toBeTruthy()
		})

		it('sets correct input properties', () => {
			const { getByTestId } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')

			expect(passwordInput.props.autoCapitalize).toBe('none')
			expect(passwordInput.props.keyboardType).toBe('default')
			expect(passwordInput.props.secureTextEntry).toBe(true)

			expect(retypePasswordInput.props.autoCapitalize).toBe('none')
			expect(retypePasswordInput.props.keyboardType).toBe('default')
			expect(retypePasswordInput.props.secureTextEntry).toBe(true)
		})
	})

	describe('Token Validation', () => {
		it('handles missing token by showing alert and redirecting', () => {
			mockUseLocalSearchParams.mockReturnValue({ token: undefined })

			render(<SetPassword />)

			expect(mockAlertSpy).toHaveBeenCalledWith('error', 'reset_link_invalid')
			expect(mockRouter.replace).toHaveBeenCalledWith(
				'/(forgot-password)/enter-email',
			)
		})

		it('handles invalid token error by showing alert and redirecting', () => {
			mockUseLocalSearchParams.mockReturnValue({
				token: mockToken,
				error: 'INVALID_TOKEN',
			})

			render(<SetPassword />)

			expect(mockAlertSpy).toHaveBeenCalledWith('error', 'reset_link_invalid')
			expect(mockRouter.replace).toHaveBeenCalledWith(
				'/(forgot-password)/enter-email',
			)
		})

		it('does not redirect when token is valid', () => {
			mockUseLocalSearchParams.mockReturnValue({ token: mockToken })

			render(<SetPassword />)

			expect(mockAlertSpy).not.toHaveBeenCalled()
			expect(mockRouter.replace).not.toHaveBeenCalled()
		})
	})

	describe('Password Visibility Toggle', () => {
		it('toggles password visibility for main password field', async () => {
			const { getByTestId } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')

			expect(passwordInput.props.secureTextEntry).toBe(true)

			expect(passwordInput).toBeTruthy()
		})

		it('toggles password visibility for retype password field', async () => {
			const { getByTestId } = render(<SetPassword />)

			const retypePasswordInput = getByTestId('retypepassword-input')

			expect(retypePasswordInput.props.secureTextEntry).toBe(true)
			expect(retypePasswordInput).toBeTruthy()
		})
	})

	describe('Form Validation', () => {
		it('shows error when password is empty and form is submitted', async () => {
			const { getByText } = render(<SetPassword />)

			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(getByText('password_required')).toBeTruthy()
			})
		})

		it('shows error when password is too short', async () => {
			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, '1234567')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(getByText('setup_password_description')).toBeTruthy()
			})
		})

		it('shows error when retype password is empty', async () => {
			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'validpassword123')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(getByText('confirm_password_required')).toBeTruthy()
			})
		})

		it('shows error when passwords do not match', async () => {
			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'password123')
				fireEvent.changeText(retypePasswordInput, 'different123')
				fireEvent(retypePasswordInput, 'blur')
				fireEvent.press(getByText('save_new_password'))
			})

			await waitFor(() => {
				expect(getByText('password_mismatch')).toBeTruthy()
			})
		})

		it('does not show error when passwords match and are valid', async () => {
			const { getByTestId, queryByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'validpassword123')
				fireEvent.changeText(retypePasswordInput, 'validpassword123')
				fireEvent(retypePasswordInput, 'blur')
			})

			await waitFor(() => {
				expect(queryByText('password_mismatch')).toBeNull()
				expect(queryByText('password_min_length')).toBeNull()
			})
		})
	})

	describe('Form Submission', () => {
		it('calls resetPassword with correct parameters on successful submission', async () => {
			const mockResetPassword = jest.mocked(authClient.resetPassword)
			mockResetPassword.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'newpassword123')
				fireEvent.changeText(retypePasswordInput, 'newpassword123')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(mockResetPassword).toHaveBeenCalledWith({
					newPassword: 'newpassword123',
					token: mockToken,
				})
			})
		})

		it('navigates to success screen after successful password reset', async () => {
			const mockResetPassword = jest.mocked(authClient.resetPassword)
			mockResetPassword.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'newpassword123')
				fireEvent.changeText(retypePasswordInput, 'newpassword123')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(mockRouter.push).toHaveBeenCalledWith(
					'/(forgot-password)/reset-success',
				)
			})
		})

		it('calls clearCredentials on successful password reset', async () => {
			const mockResetPassword = jest.mocked(authClient.resetPassword)
			mockResetPassword.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'newpassword123')
				fireEvent.changeText(retypePasswordInput, 'newpassword123')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(mockClearCredentials).toHaveBeenCalled()
			})
		})

		it('calls clearCredentials before navigation', async () => {
			const mockResetPassword = jest.mocked(authClient.resetPassword)
			mockResetPassword.mockResolvedValueOnce({
				data: { status: 'success' },
				error: null,
			})

			const callOrder: string[] = []
			mockClearCredentials.mockImplementation(() => {
				callOrder.push('clearCredentials')
			})
			mockRouter.push.mockImplementation(() => {
				callOrder.push('router.push')
			})

			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'newpassword123')
				fireEvent.changeText(retypePasswordInput, 'newpassword123')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(callOrder).toEqual(['clearCredentials', 'router.push'])
			})
		})

		it('shows alert when password reset fails', async () => {
			const mockResetPassword = jest.mocked(authClient.resetPassword)
			mockResetPassword.mockResolvedValueOnce({
				data: null,
				error: { message: 'Token expired' },
			})

			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'newpassword123')
				fireEvent.changeText(retypePasswordInput, 'newpassword123')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(mockAlertSpy).toHaveBeenCalledWith('error', 'Token expired')
			})
		})

		it('does not call clearCredentials when password reset fails', async () => {
			const mockResetPassword = jest.mocked(authClient.resetPassword)
			mockResetPassword.mockResolvedValueOnce({
				data: null,
				error: { message: 'Reset failed' },
			})

			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'newpassword123')
				fireEvent.changeText(retypePasswordInput, 'newpassword123')
				fireEvent.press(submitButton)
			})

			await waitFor(() => {
				expect(mockResetPassword).toHaveBeenCalled()
			})

			expect(mockClearCredentials).not.toHaveBeenCalled()
		})

		it('handles network errors gracefully', async () => {
			const mockResetPassword = jest.mocked(authClient.resetPassword)
			mockResetPassword.mockResolvedValueOnce({
				data: null,
				error: { message: 'Network error' },
			})

			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'newpassword123')
				fireEvent.changeText(retypePasswordInput, 'newpassword123')
				fireEvent.press(submitButton)
			})

			expect(mockResetPassword).toHaveBeenCalled()
		})

		it('does not submit when passwords do not match', async () => {
			const mockResetPassword = jest.mocked(authClient.resetPassword)

			const { getByTestId, getByText } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			const retypePasswordInput = getByTestId('retypepassword-input')
			const submitButton = getByText('save_new_password')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'password123')
				fireEvent.changeText(retypePasswordInput, 'different123')
				fireEvent.press(submitButton)
			})

			expect(mockResetPassword).not.toHaveBeenCalled()
		})
	})

	describe('User Interactions', () => {
		it('updates password input value when user types', async () => {
			const { getByTestId } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')

			await act(async () => {
				fireEvent.changeText(passwordInput, 'mypassword')
			})

			expect(passwordInput.props.value).toBe('mypassword')
		})

		it('updates retype password input value when user types', async () => {
			const { getByTestId } = render(<SetPassword />)

			const retypePasswordInput = getByTestId('retypepassword-input')

			await act(async () => {
				fireEvent.changeText(retypePasswordInput, 'mypassword')
			})

			expect(retypePasswordInput.props.value).toBe('mypassword')
		})

		it('focuses password input on component mount', () => {
			const { getByTestId } = render(<SetPassword />)

			const passwordInput = getByTestId('password-input')
			expect(passwordInput.props.autoFocus).toBe(true)
		})
	})

	describe('Real-time Password Matching', () => {
		describe('Edge Cases', () => {
			it('handles empty token parameter', () => {
				mockUseLocalSearchParams.mockReturnValue({ token: '' })

				render(<SetPassword />)

				expect(mockAlertSpy).toHaveBeenCalledWith('error', 'reset_link_invalid')
			})

			it('handles malformed URL parameters', () => {
				mockUseLocalSearchParams.mockReturnValue({
					token: null,
					error: undefined,
				})

				render(<SetPassword />)

				expect(mockAlertSpy).toHaveBeenCalled()
			})

			it('prevents form submission with invalid data', async () => {
				const mockResetPassword = jest.mocked(authClient.resetPassword)

				const { getByText } = render(<SetPassword />)

				const submitButton = getByText('save_new_password')

				await act(async () => {
					fireEvent.press(submitButton)
				})

				expect(mockResetPassword).not.toHaveBeenCalled()
			})
		})

		describe('Integration', () => {
			it('completes full password reset flow successfully', async () => {
				const mockResetPassword = jest.mocked(authClient.resetPassword)
				mockResetPassword.mockResolvedValueOnce({
					data: { status: 'success' },
					error: null,
				})

				const { getByTestId, getByText } = render(<SetPassword />)

				const passwordInput = getByTestId('password-input')
				const retypePasswordInput = getByTestId('retypepassword-input')
				const submitButton = getByText('save_new_password')

				await act(async () => {
					fireEvent.changeText(passwordInput, 'securepassword123')
					fireEvent.changeText(retypePasswordInput, 'securepassword123')
					fireEvent.press(submitButton)
				})

				expect(mockResetPassword).toHaveBeenCalledWith({
					newPassword: 'securepassword123',
					token: mockToken,
				})

				await waitFor(() => {
					expect(mockClearCredentials).toHaveBeenCalled()
					expect(mockRouter.push).toHaveBeenCalledWith(
						'/(forgot-password)/reset-success',
					)
				})
			})
		})
	})
})
