import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { Icon } from '@/components/Icon'
import { colors } from '@/design-system/theme'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { useTranslation } from 'react-i18next'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'

import {
	useAuthControllerHandle,
	useEditClientControllerHandle,
} from '@/gen/index'
import { ErrorModal } from '@/components/ErrorModal'
import { Layout } from '@/components/Layout'
import { usePushNotifications } from '@/context/push-notification-context'
import { useLocalCredentials } from '@/hooks/useLocalCredentials'
import { authClient } from '@/services/auth'

const NewDeviceEnableBiometrics = () => {
	const router = useRouter()
	const [showModal, setShowModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const { t } = useTranslation('enable_biometrics')
	const params = useLocalSearchParams()
	const { password } = params as { password: string }

	const { data: user } = useAuthControllerHandle()
	const { mutateAsync: editClientStatus } = useEditClientControllerHandle()
	const { setCredentials } = useLocalCredentials()
	const session = authClient.useSession()

	const { expoPushToken } = usePushNotifications()

	const [isBiometricSupported, setIsBiometricSupported] = useState(false)
	const [isBiometricActivated, setIsBiometricActivated] = useState(false)

	const checkCompatibility = useCallback(async () => {
		const compatible = await LocalAuthentication.hasHardwareAsync()

		setIsBiometricSupported(compatible)
	}, [])

	const handleContinue = async () => {
		try {
			const deviceId = Crypto.randomUUID()

			if (!user?.id) {
				return router.replace('/sign-in')
			}

			if (isBiometricActivated) {
				await setCredentials({
					password,
					identifier: session.data?.user.email || user.email,
				})
			}

			await editClientStatus({
				id: user.id,
				data: {
					pushToken: expoPushToken ?? undefined,
					deviceId,
				},
			})

			await SecureStore.setItemAsync('deviceId', deviceId, {
				requireAuthentication: false,
			})

			router.push('/(main)/documents')
		} catch (error) {
			if (error instanceof Error) {
				setShowModal(true)
				setErrorMessage(error?.message)
			}
			console.error('Error updating client status:', error)
		}
	}
	const activateBiometrics = async (value: boolean) => {
		setIsBiometricActivated(value)

		if (!value) return

		try {
			const result = await LocalAuthentication.authenticateAsync({
				promptMessage: 'Login with Biometrics',
				cancelLabel: 'Cancel',
				disableDeviceFallback: false,
				biometricsSecurityLevel: 'strong',
			})

			if (!result.success) {
				setIsBiometricActivated(false)
			}
		} catch (error) {
			setIsBiometricActivated(false)
			if (error instanceof Error) {
				setShowModal(true)
				setErrorMessage(error?.message)
			}
			console.error('Error enabling biometrics:', error)
		}
	}

	useEffect(() => {
		checkCompatibility()
	}, [checkCompatibility])

	return (
		<Layout.SafeAreaView
			testID='enable-biometrics-screen'
			style={{ paddingBottom: 32 }}
		>
			<View style={styles.mainContainer}>
				<View>
					<Icon.Root>
						<Icon.Background
							name='background'
							stroke={colors.neutral['40']}
							strokeWidth={1}
							fill='transparent'
							width={340}
							height={190}
						/>

						<Icon.IconContainer hasBackground>
							<Icon.Icon
								name='face-id'
								size={28}
								stroke={colors.neutral['500']}
								strokeWidth={2}
							/>
						</Icon.IconContainer>
					</Icon.Root>
					<View style={{ gap: 24 }}>
						<View style={{ alignItems: 'center', gap: 12 }}>
							<Heading
								size='h3'
								fontWeight='bold'
								style={{ color: colors.neutral['700'] }}
							>
								{isBiometricSupported
									? t('enable_quick_access')
									: t('biometrics_not_supported')}
							</Heading>
							<Text
								size='lg'
								style={{
									color: colors.neutral['700'],
									textAlign: 'center',
								}}
							>
								{isBiometricSupported
									? t('enable_biometrics_description')
									: t('biometrics_not_supported_description')}
							</Text>
						</View>

						{isBiometricSupported && (
							<View style={styles.quickAccessContainer}>
								<View style={styles.quickAccessIconContainer}>
									<Icon.Icon
										name='face-id'
										size={28}
										stroke={colors.neutral['500']}
										strokeWidth={2}
									/>
									<Text size='lg' style={{ color: colors.neutral['700'] }}>
										{t('enable_quick_access')}
									</Text>
								</View>

								<Switch
									value={isBiometricActivated}
									onValueChange={activateBiometrics}
								/>
							</View>
						)}
					</View>
				</View>

				<Button.Root
					size='lg'
					testID='continue-biometrics'
					onPress={handleContinue}
				>
					<Button.Text>{t('continue')}</Button.Text>
				</Button.Root>
				<ErrorModal
					showModal={showModal}
					setShowModal={setShowModal}
					errorMessage={errorMessage}
				/>
			</View>
		</Layout.SafeAreaView>
	)
}

const styles = StyleSheet.create({
	mainContainer: {
		backgroundColor: 'white',
		flex: 1,
		justifyContent: 'space-between',
	},
	quickAccessContainer: {
		paddingHorizontal: 12,
		paddingVertical: 20,
		borderRadius: 12,
		borderColor: colors.neutral['30'],
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	quickAccessIconContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
})

export default NewDeviceEnableBiometrics
