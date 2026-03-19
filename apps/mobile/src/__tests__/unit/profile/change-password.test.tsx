import { fireEvent, render, waitFor } from '@/utils/test-utils'
import { useRouter } from 'expo-router'
import * as LocalAuthentication from 'expo-local-authentication'
import { useLocalCredentials } from '@/hooks/useLocalCredentials'
import { useAuthControllerHandle } from '@/gen/index'
import { authClient } from '@/services/auth'
import ChangePassword from '../../../../app/(profile)/change-password'

jest.mock('@/hooks/useLocalCredentials', () => ({
	useLocalCredentials: jest.fn(),
}))

jest.mock('@/gen/index', () => ({
	useAuthControllerHandle: jest.fn(),
}))

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
}))

const mockLocalAuth = LocalAuthentication as jest.Mocked<
	typeof LocalAuthentication
>

const mockRouter = {
	back: jest.fn(),
	push: jest.fn(),
	replace: jest.fn(),
}

const mockSetCredentials = jest.fn()

describe('Change Password Page', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(useRouter as jest.Mock).mockReturnValue(mockRouter)
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: { email: 'test@example.com' },
		})
		;(authClient.useSession as jest.Mock).mockReturnValue({
			data: { user: { email: 'test@example.com' } },
		})
		;(useLocalCredentials as jest.Mock).mockReturnValue({
			hasCredentials: false,
			setCredentials: mockSetCredentials,
		})
		mockLocalAuth.authenticateAsync.mockResolvedValue({
			success: true,
		} as LocalAuthentication.LocalAuthenticationResult)
		;(authClient.changePassword as jest.Mock).mockResolvedValue({
			data: { status: true },
			error: null,
		})
	})

	it('should render the change password page with title and description', () => {
		const { getByText } = render(<ChangePassword />)

		expect(getByText('title')).toBeTruthy()
		expect(getByText('description')).toBeTruthy()
	})

	it('should render all three password input fields', () => {
		const { getByTestId } = render(<ChangePassword />)

		expect(getByTestId('current-password-input')).toBeTruthy()
		expect(getByTestId('new-password-input')).toBeTruthy()
		expect(getByTestId('confirm-password-input')).toBeTruthy()
	})

	it('should render password requirements', () => {
		const { getByText } = render(<ChangePassword />)

		expect(getByText('password_must_contain')).toBeTruthy()
		expect(getByText('req_min_length')).toBeTruthy()
		expect(getByText('req_uppercase')).toBeTruthy()
		expect(getByText('req_lowercase')).toBeTruthy()
		expect(getByText('req_number')).toBeTruthy()
		expect(getByText('req_special')).toBeTruthy()
	})

	it('should render cancel and save buttons', () => {
		const { getByTestId } = render(<ChangePassword />)

		expect(getByTestId('cancel-button')).toBeTruthy()
		expect(getByTestId('save-button')).toBeTruthy()
	})

	it('should navigate back when back button is pressed', () => {
		const { getByTestId } = render(<ChangePassword />)

		fireEvent.press(getByTestId('back-button'))
		expect(mockRouter.back).toHaveBeenCalledTimes(1)
	})

	it('should navigate back when cancel button is pressed', () => {
		const { getByTestId } = render(<ChangePassword />)

		fireEvent.press(getByTestId('cancel-button'))
		expect(mockRouter.back).toHaveBeenCalledTimes(1)
	})

	it('should call changePassword on successful submission without credentials', async () => {
		const { getByTestId } = render(<ChangePassword />)

		fireEvent.changeText(getByTestId('current-password-input'), 'OldPass1!')
		fireEvent.changeText(getByTestId('new-password-input'), 'NewPass1!')
		fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass1!')

		fireEvent.press(getByTestId('save-button'))

		await waitFor(() => {
			expect(mockLocalAuth.authenticateAsync).toHaveBeenCalled()
		})

		await waitFor(() => {
			expect(authClient.changePassword).toHaveBeenCalledWith({
				currentPassword: 'OldPass1!',
				newPassword: 'NewPass1!',
				revokeOtherSessions: false,
			})
		})
	})

	it('should skip biometric prompt when credentials exist', async () => {
		;(useLocalCredentials as jest.Mock).mockReturnValue({
			hasCredentials: true,
			setCredentials: mockSetCredentials,
		})

		const { getByTestId } = render(<ChangePassword />)

		fireEvent.changeText(getByTestId('current-password-input'), 'OldPass1!')
		fireEvent.changeText(getByTestId('new-password-input'), 'NewPass1!')
		fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass1!')

		fireEvent.press(getByTestId('save-button'))

		await waitFor(() => {
			expect(authClient.changePassword).toHaveBeenCalled()
		})

		expect(mockLocalAuth.authenticateAsync).not.toHaveBeenCalled()
	})

	it('should update stored credentials when hasCredentials is true', async () => {
		mockSetCredentials.mockResolvedValue(undefined)
		;(useLocalCredentials as jest.Mock).mockReturnValue({
			hasCredentials: true,
			setCredentials: mockSetCredentials,
		})

		const { getByTestId } = render(<ChangePassword />)

		fireEvent.changeText(getByTestId('current-password-input'), 'OldPass1!')
		fireEvent.changeText(getByTestId('new-password-input'), 'NewPass1!')
		fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass1!')

		fireEvent.press(getByTestId('save-button'))

		await waitFor(() => {
			expect(mockSetCredentials).toHaveBeenCalledWith({
				identifier: 'test@example.com',
				password: 'NewPass1!',
			})
		})
	})

	it('should not call changePassword when biometric auth fails', async () => {
		mockLocalAuth.authenticateAsync.mockResolvedValue({
			success: false,
			error: 'user_cancel',
		} as LocalAuthentication.LocalAuthenticationResult)

		const { getByTestId } = render(<ChangePassword />)

		fireEvent.changeText(getByTestId('current-password-input'), 'OldPass1!')
		fireEvent.changeText(getByTestId('new-password-input'), 'NewPass1!')
		fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass1!')

		fireEvent.press(getByTestId('save-button'))

		await waitFor(() => {
			expect(mockLocalAuth.authenticateAsync).toHaveBeenCalled()
		})

		expect(authClient.changePassword).not.toHaveBeenCalled()
	})

	it('should navigate back on successful password change', async () => {
		const { getByTestId } = render(<ChangePassword />)

		fireEvent.changeText(getByTestId('current-password-input'), 'OldPass1!')
		fireEvent.changeText(getByTestId('new-password-input'), 'NewPass1!')
		fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass1!')

		fireEvent.press(getByTestId('save-button'))

		await waitFor(() => {
			expect(mockRouter.back).toHaveBeenCalled()
		})
	})
})
