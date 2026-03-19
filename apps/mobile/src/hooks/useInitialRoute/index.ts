import { useRouter } from 'expo-router'
import { useEffect, useCallback, useState } from 'react'
import {
	unifiedUserDTOOnboardingStatusEnum,
	unifiedUserDTOStatusEnum,
	useAuthControllerHandle,
} from '@/gen/index'
import * as SecureStore from 'expo-secure-store'
import { authClient } from '@/services/auth'
import { useLocalCredentials } from '../useLocalCredentials'

export const useInitialRoute = () => {
	const [deviceId, setDeviceId] = useState<string | null>(null)
	const router = useRouter()
	const session = authClient.useSession()
	const { hasCredentials, authenticate } = useLocalCredentials()

	const isSignedIn = !!session.data?.session?.token

	const { refetch: getUser } = useAuthControllerHandle({
		'Device-Id': deviceId ?? '',
	})

	const handleBiometrics = useCallback(async () => {
		try {
			const authenticationResult = await authenticate()

			if (authenticationResult) {
				await authClient.signIn.email({
					email: authenticationResult.identifier,
					password: authenticationResult.password,
				})
			}

			const user = await getUser()

			if (!user?.data?.isDeviceRecognized) {
				await authClient.signOut()
				router.replace('/sign-in')
				return
			}

			router.replace('/(main)/documents')
		} catch (error) {
			console.error('Error during biometric authentication:', error)
		}
	}, [authenticate, router, getUser])

	useEffect(() => {
		const getDeviceId = async () => {
			const deviceId = await SecureStore.getItemAsync('deviceId', {
				requireAuthentication: false,
			})
			if (deviceId) {
				setDeviceId(deviceId)
			}
		}

		getDeviceId()
	}, [])

	const handleInitialRoute = useCallback(async () => {
		if (!isSignedIn) {
			if (hasCredentials) {
				handleBiometrics()
				return
			}

			router.replace('/sign-in')
			return
		}

		if (isSignedIn) {
			const user = await getUser()

			const isOnboarding =
				user?.data?.status === unifiedUserDTOStatusEnum.INVITED

			if (isOnboarding) {
				const isPhoneNumberVerified =
					user?.data?.onboardingStatus ===
					unifiedUserDTOOnboardingStatusEnum.PHONE_VERIFIED

				router.replace(
					isPhoneNumberVerified
						? '/(onboarding)/set-password'
						: '/(onboarding)/confirm-mobile-number',
				)

				return
			}

			if (!user?.data?.isDeviceRecognized) {
				await authClient.signOut()
				router.replace('/sign-in')
				return
			}

			router.replace('/(main)/documents')
			return
		}
	}, [router, isSignedIn, getUser, hasCredentials, handleBiometrics])

	return {
		handleInitialRoute,
	}
}
