import { Icon } from '@/components/Icon'
import { useAuthControllerHandle } from '@/gen/index'
import { useVerifyPasswordControllerHandle } from '@/gen/api/react-query/useVerifyPasswordControllerHandle'
import { useLocalCredentials } from '@/hooks/useLocalCredentials'
import { authClient } from '@/services/auth'
import {
	Button,
	Heading,
	Modal,
	Switch,
	Text,
	TextInput,
} from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import * as LocalAuthentication from 'expo-local-authentication'
import { useRouter } from 'expo-router'
import {
	ChevronLeft,
	ChevronRight,
	Info,
	KeyRound,
	Smartphone,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native'

const Security = () => {
	const { t } = useTranslation('security_access')
	const { t: errorT } = useTranslation('error')
	const router = useRouter()
	const { hasCredentials, setCredentials, clearCredentials } =
		useLocalCredentials()
	const { data: user } = useAuthControllerHandle()
	const session = authClient.useSession()
	const { mutateAsync: verifyPassword } = useVerifyPasswordControllerHandle()

	const [isBiometricSupported, setIsBiometricSupported] = useState(false)
	const [isBiometricEnabled, setIsBiometricEnabled] = useState(false)
	const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
	const [passwordInput, setPasswordInput] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [passwordError, setPasswordError] = useState<string | null>(null)
	const [isVerifying, setIsVerifying] = useState(false)

	useEffect(() => {
		const checkCompatibility = async () => {
			const compatible = await LocalAuthentication.hasHardwareAsync()
			const enrolled = await LocalAuthentication.isEnrolledAsync()
			setIsBiometricSupported(compatible && enrolled)
		}
		checkCompatibility()
	}, [])

	useEffect(() => {
		setIsBiometricEnabled(hasCredentials)
	}, [hasCredentials])

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	const handleToggleBiometrics = async (value: boolean) => {
		if (!value) {
			await clearCredentials()
			setIsBiometricEnabled(false)
			return
		}

		setShowPasswordPrompt(true)
	}

	const isPasswordValid =
		passwordInput.length >= 8 &&
		/[A-Z]/.test(passwordInput) &&
		/[a-z]/.test(passwordInput) &&
		/[0-9]/.test(passwordInput) &&
		/[!@#$%^&*\-~_.+]/.test(passwordInput)

	const handleConfirmPassword = async () => {
		Keyboard.dismiss()
		setIsVerifying(true)
		try {
			const { success } = await verifyPassword({
				data: { password: passwordInput },
			})

			if (!success) {
				setPasswordInput('')
				setPasswordError(errorT('password_incorrect'))
				return
			}

			const identifier = session?.data?.user?.email || user?.email || ''
			await setCredentials({
				identifier,
				password: passwordInput,
			})
			setIsBiometricEnabled(true)
			setShowPasswordPrompt(false)
			setPasswordInput('')
			setPasswordError(null)
		} catch {
			setPasswordInput('')
			setPasswordError(errorT('password_incorrect'))
		} finally {
			setIsVerifying(false)
		}
	}

	const handleCancelPasswordPrompt = () => {
		setShowPasswordPrompt(false)
		setPasswordInput('')
		setPasswordError(null)
		setShowPassword(false)
	}

	return (
		<View style={{ flex: 1, backgroundColor: 'white', gap: 32 }}>
			<Pressable
				style={styles.backButton}
				onPress={handleBack}
				testID='back-button'
			>
				<ChevronLeft size={24} color={colors.neutral['700']} />
			</Pressable>

			<ScrollView
				style={styles.container}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.contentContainer}
			>
				<View style={{ gap: 4 }}>
					<Heading
						size='h3'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						{t('title')}
					</Heading>
					<Text size='sm' style={{ color: colors.neutral['500'] }}>
						{t('description')}
					</Text>
				</View>

				<View style={{ height: 1, backgroundColor: colors.neutral['30'] }} />

				{/* Quick Access Section */}
				<View style={{ gap: 16 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						<Icon.Icon
							name='face-id'
							size={20}
							stroke={colors.neutral['500']}
							strokeWidth={2}
						/>
						<Text
							size='sm'
							fontWeight='bold'
							style={{ color: colors.neutral['600'] }}
						>
							{t('quick_access')}
						</Text>
					</View>

					<Text size='sm' style={{ color: colors.neutral['500'] }}>
						{t('quick_access_description')}
					</Text>

					<View style={styles.biometricToggleRow}>
						<View style={{ gap: 2, flex: 1 }}>
							<Text
								size='sm'
								fontWeight='bold'
								style={{ color: colors.neutral['600'] }}
							>
								{t('enable_biometric_login')}
							</Text>
							<Text size='xs' style={{ color: colors.neutral['300'] }}>
								{t('enable_biometric_login_description')}
							</Text>
						</View>
						<Switch
							size='sm'
							value={isBiometricEnabled}
							onValueChange={handleToggleBiometrics}
							disabled={!isBiometricSupported}
							testID='switch-biometric'
						/>
					</View>

					<View style={styles.infoRow}>
						<Info size={16} color={colors.neutral['300']} />
						<Text size='xs' style={{ color: colors.neutral['300'], flex: 1 }}>
							{t('device_only_info')}
						</Text>
					</View>
				</View>

				<View style={{ height: 1, backgroundColor: colors.neutral['30'] }} />

				{/* Additional Security Section */}
				<View style={{ gap: 16 }}>
					<Text
						size='sm'
						fontWeight='bold'
						style={{ color: colors.neutral['600'] }}
					>
						{t('additional_security')}
					</Text>

					<Pressable
						style={styles.securityRow}
						onPress={() => router.push('/(profile)/change-password')}
						testID='change-password-row'
					>
						<View
							style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
						>
							<KeyRound size={20} color={colors.neutral['500']} />
							<Text
								size='sm'
								fontWeight='bold'
								style={{ color: colors.neutral['500'] }}
							>
								{t('change_password')}
							</Text>
						</View>
						<ChevronRight size={20} color={colors.neutral['300']} />
					</Pressable>

					{/* TODO: Add onPress to navigate to active sessions screen */}
					<Pressable style={styles.securityRow} testID='active-sessions-row'>
						<View
							style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
						>
							<Smartphone size={20} color={colors.neutral['500']} />
							<Text
								size='sm'
								fontWeight='bold'
								style={{ color: colors.neutral['500'] }}
							>
								{t('active_sessions')}
							</Text>
						</View>
						<ChevronRight size={20} color={colors.neutral['300']} />
					</Pressable>
				</View>
			</ScrollView>

			<Modal.Root
				open={showPasswordPrompt}
				onOpenChange={(open) => {
					if (!open && !isVerifying) handleCancelPasswordPrompt()
				}}
			>
				<View onStartShouldSetResponder={() => true}>
					<Modal.Header
						style={{ backgroundColor: colors.neutral['50'] }}
						icon={
							<Icon.Icon
								name='face-id'
								size={24}
								stroke={colors.neutral['500']}
								strokeWidth={2}
							/>
						}
						circularBackgroundColor={colors.neutral['30']}
					/>
					<Modal.Body>
						<Modal.Title>{t('enter_password_title')}</Modal.Title>
						<Modal.Description>
							{t('enter_password_description')}
						</Modal.Description>
						<View style={{ gap: 4, paddingTop: 8 }}>
							<TextInput.Root>
								<TextInput.Control
									testID='biometric-password-input'
									autoCapitalize='none'
									secureTextEntry={!showPassword}
									placeholder='********'
									value={passwordInput}
									onChangeText={(text) => {
										setPasswordInput(text)
										if (passwordError) setPasswordError(null)
									}}
									returnKeyType='done'
									onSubmitEditing={handleConfirmPassword}
								/>
								<Pressable
									style={{ padding: 4 }}
									onPress={() => setShowPassword(!showPassword)}
								>
									<Icon.Icon
										name={showPassword ? 'eye-off' : 'eye'}
										size={16}
									/>
								</Pressable>
							</TextInput.Root>
							{passwordError && (
								<Text size='xs' style={{ color: colors.error['500'] }}>
									{passwordError}
								</Text>
							)}
						</View>
					</Modal.Body>
					<View style={{ gap: 8, paddingVertical: 16 }}>
						<Button.Root
							variant='secondary'
							onPress={handleCancelPasswordPrompt}
							testID='cancel-password-prompt'
						>
							<Button.Text>{t('cancel')}</Button.Text>
						</Button.Root>
						<Button.Root
							onPress={handleConfirmPassword}
							disabled={!isPasswordValid}
							testID='confirm-password-prompt'
						>
							<Button.Text>{t('confirm')}</Button.Text>
						</Button.Root>
					</View>
				</View>
			</Modal.Root>
		</View>
	)
}

export default Security

const styles = StyleSheet.create({
	backButton: {
		alignSelf: 'flex-start',
		padding: 8,
	},
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	contentContainer: {
		gap: 20,
		paddingBottom: 12,
		paddingHorizontal: 16,
	},
	biometricToggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
	},
	securityRow: {
		padding: 12,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderRadius: 8,
		borderColor: colors.neutral['30'],
		borderWidth: 1,
	},
})
