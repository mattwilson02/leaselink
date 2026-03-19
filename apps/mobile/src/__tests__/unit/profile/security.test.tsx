import { fireEvent, render, waitFor } from '@/utils/test-utils'
import { useRouter } from 'expo-router'
import * as LocalAuthentication from 'expo-local-authentication'
import { useLocalCredentials } from '@/hooks/useLocalCredentials'
import { useAuthControllerHandle } from '@/gen/index'
import { useVerifyPasswordControllerHandle } from '@/gen/api/react-query/useVerifyPasswordControllerHandle'
import { authClient } from '@/services/auth'
import Security from '../../../../app/(profile)/security'

jest.mock('@/hooks/useLocalCredentials', () => ({
	useLocalCredentials: jest.fn(),
}))

jest.mock('@/gen/index', () => ({
	useAuthControllerHandle: jest.fn(),
}))

jest.mock('@/gen/api/react-query/useVerifyPasswordControllerHandle', () => ({
	useVerifyPasswordControllerHandle: jest.fn(),
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
const mockClearCredentials = jest.fn()
const mockVerifyPassword = jest.fn()

describe('Security & Access Page', () => {
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
			clearCredentials: mockClearCredentials,
		})
		;(useVerifyPasswordControllerHandle as jest.Mock).mockReturnValue({
			mutateAsync: mockVerifyPassword,
		})
		mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
		mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
	})

	it('should render the security page with title and description', () => {
		const { getByText } = render(<Security />)

		expect(getByText('title')).toBeTruthy()
		expect(getByText('description')).toBeTruthy()
	})

	it('should render quick access and additional security sections', () => {
		const { getByText } = render(<Security />)

		expect(getByText('quick_access')).toBeTruthy()
		expect(getByText('quick_access_description')).toBeTruthy()
		expect(getByText('enable_biometric_login')).toBeTruthy()
		expect(getByText('additional_security')).toBeTruthy()
		expect(getByText('change_password')).toBeTruthy()
		expect(getByText('active_sessions')).toBeTruthy()
	})

	it('should render the biometric toggle', () => {
		const { getByTestId } = render(<Security />)

		expect(getByTestId('switch-biometric')).toBeTruthy()
	})

	it('should render the device only info text', () => {
		const { getByText } = render(<Security />)

		expect(getByText('device_only_info')).toBeTruthy()
	})

	it('should navigate back when back button is pressed', () => {
		const { getByTestId } = render(<Security />)

		fireEvent.press(getByTestId('back-button'))
		expect(mockRouter.back).toHaveBeenCalledTimes(1)
	})

	it('should navigate to change password when row is pressed', () => {
		const { getByTestId } = render(<Security />)

		fireEvent.press(getByTestId('change-password-row'))
		expect(mockRouter.push).toHaveBeenCalledWith('/(profile)/change-password')
	})

	it('should show password prompt when enabling biometrics', async () => {
		const { getByTestId, getByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
			expect(getByText('enter_password_description')).toBeTruthy()
		})
	})

	it('should call clearCredentials when disabling biometrics', async () => {
		;(useLocalCredentials as jest.Mock).mockReturnValue({
			hasCredentials: true,
			setCredentials: mockSetCredentials,
			clearCredentials: mockClearCredentials,
		})

		const { getByTestId } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', false)
		})

		await waitFor(() => {
			expect(mockClearCredentials).toHaveBeenCalledTimes(1)
		})
	})

	it('should verify password and call setCredentials on success', async () => {
		mockVerifyPassword.mockResolvedValue({ success: true })
		mockSetCredentials.mockResolvedValue(undefined)

		const { getByTestId, getByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
		})

		fireEvent.changeText(
			getByTestId('biometric-password-input'),
			'MyPassword1!',
		)
		fireEvent.press(getByTestId('confirm-password-prompt'))

		await waitFor(() => {
			expect(mockVerifyPassword).toHaveBeenCalledWith({
				data: { password: 'MyPassword1!' },
			})
			expect(mockSetCredentials).toHaveBeenCalledWith({
				identifier: 'test@example.com',
				password: 'MyPassword1!',
			})
		})
	})

	it('should show error and clear input when password verification fails', async () => {
		mockVerifyPassword.mockRejectedValue(new Error('Unauthorized'))

		const { getByTestId, getByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
		})

		fireEvent.changeText(getByTestId('biometric-password-input'), 'WrongPass1!')
		fireEvent.press(getByTestId('confirm-password-prompt'))

		await waitFor(() => {
			expect(getByText('password_incorrect')).toBeTruthy()
			expect(mockSetCredentials).not.toHaveBeenCalled()
		})
	})

	it('should show error when verify returns success false', async () => {
		mockVerifyPassword.mockResolvedValue({ success: false })

		const { getByTestId, getByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
		})

		fireEvent.changeText(getByTestId('biometric-password-input'), 'WrongPass1!')
		fireEvent.press(getByTestId('confirm-password-prompt'))

		await waitFor(() => {
			expect(getByText('password_incorrect')).toBeTruthy()
			expect(mockSetCredentials).not.toHaveBeenCalled()
		})
	})

	it('should keep modal open when password verification fails', async () => {
		mockVerifyPassword.mockRejectedValue(new Error('Unauthorized'))

		const { getByTestId, getByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
		})

		fireEvent.changeText(getByTestId('biometric-password-input'), 'WrongPass1!')
		fireEvent.press(getByTestId('confirm-password-prompt'))

		await waitFor(() => {
			expect(getByText('password_incorrect')).toBeTruthy()
			expect(getByText('enter_password_title')).toBeTruthy()
		})
	})

	it('should not store credentials when password does not meet requirements', async () => {
		mockVerifyPassword.mockRejectedValue(new Error('Unauthorized'))

		const { getByTestId, getByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
		})

		// Type a password that doesn't meet requirements
		fireEvent.changeText(getByTestId('biometric-password-input'), 'short')
		fireEvent.press(getByTestId('confirm-password-prompt'))

		await waitFor(() => {
			expect(mockSetCredentials).not.toHaveBeenCalled()
		})
	})

	it('should enable confirm button when password meets all requirements', async () => {
		mockVerifyPassword.mockResolvedValue({ success: true })
		mockSetCredentials.mockResolvedValue(undefined)

		const { getByTestId, getByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
		})

		fireEvent.changeText(getByTestId('biometric-password-input'), 'ValidPass1!')
		fireEvent.press(getByTestId('confirm-password-prompt'))

		await waitFor(() => {
			expect(mockVerifyPassword).toHaveBeenCalledWith({
				data: { password: 'ValidPass1!' },
			})
		})
	})

	it('should dismiss password prompt when cancel is pressed', async () => {
		const { getByTestId, getByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
		})

		fireEvent.press(getByTestId('cancel-password-prompt'))

		expect(mockSetCredentials).not.toHaveBeenCalled()
	})

	it('should clear password error when typing after an error', async () => {
		mockVerifyPassword.mockRejectedValue(new Error('Unauthorized'))

		const { getByTestId, getByText, queryByText } = render(<Security />)

		await waitFor(() => {
			fireEvent(getByTestId('switch-biometric'), 'valueChange', true)
		})

		await waitFor(() => {
			expect(getByText('enter_password_title')).toBeTruthy()
		})

		fireEvent.changeText(getByTestId('biometric-password-input'), 'WrongPass1!')
		fireEvent.press(getByTestId('confirm-password-prompt'))

		await waitFor(() => {
			expect(getByText('password_incorrect')).toBeTruthy()
		})

		fireEvent.changeText(getByTestId('biometric-password-input'), 'N')

		await waitFor(() => {
			expect(queryByText('password_incorrect')).toBeNull()
		})
	})
})
