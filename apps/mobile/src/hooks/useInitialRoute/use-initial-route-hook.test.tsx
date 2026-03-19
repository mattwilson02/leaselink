import { renderHook, act, waitFor } from '@/utils/test-utils'
import { useInitialRoute } from '.'
import { useAuthControllerHandle } from '@/gen/index'
import { authClient } from '@/services/auth'
import { useLocalCredentials } from '../useLocalCredentials'

jest.mock('@/hooks/useLocalCredentials', () => ({
	useLocalCredentials: jest.fn(),
}))

describe('useInitialRoute', () => {
	const mockRouter = {
		back: jest.fn(),
		replace: jest.fn(),
		push: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: null,
			refetch: jest.fn(),
		})
		;(useLocalCredentials as jest.Mock).mockReturnValue({
			hasCredentials: false,
			authenticate: jest.fn(),
		})
	})

	it('should return sign-in route when user is not signed in and has no credentials', async () => {
		;(authClient.useSession as jest.Mock).mockReturnValueOnce({
			data: {
				session: null,
			},
		})

		const { result } = renderHook(() => useInitialRoute())
		act(() => {
			result.current.handleInitialRoute()
		})

		await waitFor(() => {
			expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in')
		})
	})

	it('should return main when user is not signed in and has credentials and device id then matches', async () => {
		const mockRefetch = jest.fn().mockReturnValue({
			data: {
				status: 'ACTIVE',
				onboardingStatus: 'ONBOARDED',
				phoneVerified: true,
				isDeviceRecognized: true,
			},
		})
		const mockAuthenticate = jest.fn().mockResolvedValue({
			identifier: 'example@user.com',
			password: 'securePassword123',
		})
		;(useLocalCredentials as jest.Mock).mockReturnValueOnce({
			hasCredentials: true,
			authenticate: mockAuthenticate,
		})
		;(authClient.useSession as jest.Mock).mockReturnValueOnce({
			data: {
				session: null,
			},
		})
		;(useAuthControllerHandle as jest.Mock).mockReturnValueOnce({
			refetch: mockRefetch,
		})

		const { result } = renderHook(() => useInitialRoute())
		act(() => {
			result.current.handleInitialRoute()
		})

		await waitFor(() => {
			expect(mockAuthenticate).toHaveBeenCalled()

			expect(mockRefetch).toHaveBeenCalled()
			expect(mockRouter.replace).toHaveBeenCalledWith('/(main)/documents')
		})
	})

	it('should return main when user is not signed in and has credentials and device id doesnt matches', async () => {
		const mockRefetch = jest.fn().mockReturnValue({
			data: {
				status: 'ACTIVE',
				onboardingStatus: 'ONBOARDED',
				phoneVerified: true,
				isDeviceRecognized: false,
			},
		})
		const mockAuthenticate = jest.fn().mockResolvedValue({
			identifier: 'example@user.com',
			password: 'securePassword123',
		})
		;(useLocalCredentials as jest.Mock).mockReturnValueOnce({
			hasCredentials: true,
			authenticate: mockAuthenticate,
		})
		;(authClient.useSession as jest.Mock).mockReturnValueOnce({
			data: {
				session: null,
			},
		})
		;(useAuthControllerHandle as jest.Mock).mockReturnValueOnce({
			refetch: mockRefetch,
		})

		const { result } = renderHook(() => useInitialRoute())
		act(() => {
			result.current.handleInitialRoute()
		})

		await waitFor(() => {
			expect(mockAuthenticate).toHaveBeenCalled()

			expect(mockRefetch).toHaveBeenCalled()
			expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in')
		})
	})

	it('should redirect to onboarding/confirm-mobile-number when user is invited and phone not verified', async () => {
		;(authClient.useSession as jest.Mock).mockReturnValueOnce({
			data: {
				session: {
					token: 'fake-token',
				},
			},
		})
		;(useAuthControllerHandle as jest.Mock).mockReturnValueOnce({
			refetch: jest.fn().mockReturnValueOnce({
				data: {
					status: 'INVITED',
					onboardingStatus: 'EMAIL_VERIFIED',
					phoneVerified: false,
				},
			}),
		})

		const { result } = renderHook(() => useInitialRoute())
		act(() => {
			result.current.handleInitialRoute()
		})

		await waitFor(() => {
			expect(mockRouter.replace).toHaveBeenCalledWith(
				'/(onboarding)/confirm-mobile-number',
			)
		})
	})

	it('should redirect to onboarding/set-password when user is invited and phone is verified', async () => {
		;(authClient.useSession as jest.Mock).mockReturnValueOnce({
			data: {
				session: {
					token: 'fake-token',
				},
			},
		})
		;(useAuthControllerHandle as jest.Mock).mockReturnValueOnce({
			refetch: jest.fn().mockReturnValueOnce({
				data: {
					status: 'INVITED',
					onboardingStatus: 'PHONE_VERIFIED',
					phoneVerified: true,
				},
			}),
		})

		const { result } = renderHook(() => useInitialRoute())
		act(() => {
			result.current.handleInitialRoute()
		})

		await waitFor(() => {
			expect(mockRouter.replace).toHaveBeenCalledWith(
				'/(onboarding)/set-password',
			)
		})
	})

	it('should redirect to main route when user is active', async () => {
		;(authClient.useSession as jest.Mock).mockReturnValueOnce({
			data: {
				session: {
					token: 'fake-token',
				},
			},
		})
		;(useAuthControllerHandle as jest.Mock).mockReturnValueOnce({
			refetch: jest.fn().mockReturnValueOnce({
				data: {
					status: 'ACTIVE',
					onboardingStatus: 'ONBOARDED',
					phoneVerified: true,
					isDeviceRecognized: true,
				},
			}),
		})

		const { result } = renderHook(() => useInitialRoute())
		act(() => {
			result.current.handleInitialRoute()
		})

		await waitFor(() => {
			expect(mockRouter.replace).toHaveBeenCalledWith('/(main)/documents')
		})
	})

	it('should redirect to sign-in route when user is active but device not recognized', async () => {
		;(authClient.useSession as jest.Mock).mockReturnValueOnce({
			data: {
				session: {
					token: 'fake-token',
				},
			},
		})
		;(useAuthControllerHandle as jest.Mock).mockReturnValueOnce({
			refetch: jest.fn().mockReturnValueOnce({
				data: {
					status: 'ACTIVE',
					onboardingStatus: 'ONBOARDED',
					phoneVerified: true,
					isDeviceRecognized: false,
				},
			}),
		})

		const { result } = renderHook(() => useInitialRoute())
		act(() => {
			result.current.handleInitialRoute()
		})

		await waitFor(() => {
			expect(authClient.signOut).toHaveBeenCalled()
			expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in')
		})
	})

	it('should handle API errors gracefully', async () => {
		;(authClient.useSession as jest.Mock).mockReturnValueOnce({
			data: {
				session: {
					token: 'fake-token',
				},
			},
		})
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: null,
			refetch: jest.fn(),
			error: new Error('API Error'),
		})

		const { result } = renderHook(() => useInitialRoute())
		act(() => {
			result.current.handleInitialRoute()
		})

		await waitFor(() => {
			expect(authClient.signOut).toHaveBeenCalled()
			expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in')
		})
	})
})
