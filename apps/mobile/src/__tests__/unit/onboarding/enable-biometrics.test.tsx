import { render, fireEvent, waitFor } from '@/utils/test-utils'
import EnableBiometrics from '@/app/(onboarding)/enable-biometrics'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'

jest.mock('@/context/push-notification-context', () => ({
	usePushNotifications: jest.fn(() => ({
		expoPushToken: 'mock-push-token',
	})),
}))

describe('EnableBiometrics Component', () => {
	const mockRouter = {
		back: jest.fn(),
		replace: jest.fn(),
		push: jest.fn(),
	}

	const mockEditClientStatus = jest.fn().mockResolvedValue({})
	const mockUser = { id: 'test-user-id' }
	const mockSetItemAsync = jest
		.spyOn(SecureStore, 'setItemAsync')
		.mockResolvedValue()
	const mockSetOnboardingPassword = jest
		.fn()
		.mockResolvedValue({ success: true })

	const mockRandomUUID = jest.fn().mockReturnValue('test-device-id')

	beforeEach(() => {
		jest.clearAllMocks()

		require('expo-router').useRouter = jest.fn().mockReturnValue(mockRouter)
		require('expo-router').useLocalSearchParams = jest.fn().mockReturnValue({
			password: 'test-password',
		})
		require('@/gen/index').useAuthControllerHandle = jest.fn().mockReturnValue({
			data: mockUser,
		})
		require('@/gen/index').useOnboardingSetPasswordControllerHandle = jest
			.fn()
			.mockReturnValue({
				mutateAsync: mockSetOnboardingPassword,
			})
		require('@/gen/index').useEditClientControllerHandle = jest
			.fn()
			.mockReturnValue({
				mutateAsync: mockEditClientStatus,
			})
		;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true)

		jest.spyOn(Crypto, 'randomUUID').mockImplementation(mockRandomUUID)
	})

	it('renders correctly when biometrics are supported', async () => {
		const { getByText, getAllByText } = render(<EnableBiometrics />)

		// Wait for the async useEffect to complete
		await waitFor(() => {
			expect(getAllByText('enable_quick_access')).toHaveLength(2)
			expect(getByText('enable_biometrics_description')).toBeTruthy()
			expect(getByText('continue')).toBeTruthy()
		})
	})

	it('renders correctly when biometrics are not supported', async () => {
		// Override default mock to return false for this test
		;(LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(
			false,
		)

		const { getByText } = render(<EnableBiometrics />)

		await waitFor(() => {
			expect(getByText('biometrics_not_supported')).toBeTruthy()
			expect(getByText('biometrics_not_supported_description')).toBeTruthy()
			expect(getByText('continue')).toBeTruthy()
		})
	})

	// In your actual component, instead of using UNSAFE_getByType, add a testID
	// or modify this test to select the Switch component differently
	it('handles continue button press and updates client status', async () => {
		const { getByText } = render(<EnableBiometrics />)

		await waitFor(() => {
			expect(getByText('continue')).toBeTruthy()
		})

		const continueButton = getByText('continue')
		fireEvent.press(continueButton)

		await waitFor(() => {
			expect(mockSetOnboardingPassword).toHaveBeenCalledWith({
				data: {
					newPassword: 'test-password',
				},
			})

			expect(mockEditClientStatus).toHaveBeenCalledWith({
				id: 'test-user-id',
				data: {
					status: 'ACTIVE',
					onboardingStatus: 'ONBOARDED',
					deviceId: 'test-device-id',
					pushToken: 'mock-push-token',
				},
			})

			expect(mockSetItemAsync).toHaveBeenCalledWith(
				'deviceId',
				'test-device-id',
				{
					requireAuthentication: false,
				},
			)
			expect(mockRouter.push).toHaveBeenCalledWith('/(main)/documents')
		})
	})

	it('redirects to sign-in when no user ID is available', async () => {
		// Override mock to return a user with no ID
		require('@/gen/index').useAuthControllerHandle = jest.fn().mockReturnValue({
			data: { id: undefined },
		})

		const { getByText } = render(<EnableBiometrics />)

		await waitFor(() => {
			expect(getByText('continue')).toBeTruthy()
		})

		const continueButton = getByText('continue')
		fireEvent.press(continueButton)

		await waitFor(() => {
			expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in')
			expect(mockSetOnboardingPassword).not.toHaveBeenCalled()
			expect(mockEditClientStatus).not.toHaveBeenCalled()
		})
	})

	it('handles error when changing password', async () => {
		mockSetOnboardingPassword.mockResolvedValueOnce({ success: false })

		const { getByText, findByText } = render(<EnableBiometrics />)

		await waitFor(() => {
			expect(getByText('continue')).toBeTruthy()
		})

		const continueButton = getByText('continue')
		fireEvent.press(continueButton)

		const errorMessage = await findByText('Error changing password')
		expect(errorMessage).toBeTruthy()
	})

	it('handles error when updating client status', async () => {
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
		mockEditClientStatus.mockRejectedValueOnce(new Error('API Error'))

		const { getByText } = render(<EnableBiometrics />)

		await waitFor(() => {
			expect(getByText('continue')).toBeTruthy()
		})

		const continueButton = getByText('continue')
		fireEvent.press(continueButton)

		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled()
			expect(consoleErrorSpy.mock.calls[0][0]).toBe(
				'Error updating client status:',
			)
		})

		consoleErrorSpy.mockRestore()
	})
})
