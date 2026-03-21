import { Icon } from '@/components/Icon'
import { useAuthControllerHandle } from '@/gen/index'
import { useVerifyPasswordControllerHandle } from '@/gen/api/react-query/useVerifyPasswordControllerHandle'
import { useLocalCredentials } from '@/hooks/useLocalCredentials'
import { authClient } from '@/services/auth'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { TextInputCompound as TextInput } from '@/design-system/components/TextInputCompound'
import { ModalCompound as Modal } from '@/design-system/components/ModalCompound'
import { PinInputCompound as PinInput } from '@/design-system/components/PinInputCompound'
import { Switch } from 'react-native'
import { colors } from '@/design-system/theme'
import * as LocalAuthentication from 'expo-local-authentication'
import { useRouter } from 'expo-router'
import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Info,
	KeyRound,
	Shield,
	Smartphone,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Alert,
	Clipboard,
	Keyboard,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
} from 'react-native'

type TwoFactorStep =
	| 'idle'
	| 'password'
	| 'totp_uri'
	| 'verify'
	| 'backup_codes'
	| 'disable_password'

const Security = () => {
	const { t } = useTranslation('security_access')
	const { t: errorT } = useTranslation('error')
	const { t: twoFactorT } = useTranslation('two_factor')
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

	// 2FA state
	const [twoFactorStep, setTwoFactorStep] = useState<TwoFactorStep>('idle')
	const [twoFactorPassword, setTwoFactorPassword] = useState('')
	const [showTwoFactorPassword, setShowTwoFactorPassword] = useState(false)
	const [twoFactorPasswordError, setTwoFactorPasswordError] = useState<
		string | null
	>(null)
	const [totpUri, setTotpUri] = useState<string | null>(null)
	const [backupCodes, setBackupCodes] = useState<string[]>([])
	const [totpCode, setTotpCode] = useState('')
	const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false)
	const [twoFactorError, setTwoFactorError] = useState<string | null>(null)
	const [hasCopiedUri, setHasCopiedUri] = useState(false)

	// Derive twoFactorEnabled from session user
	const twoFactorEnabled =
		(session?.data?.user as { twoFactorEnabled?: boolean } | undefined)
			?.twoFactorEnabled ?? false

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

	// ---- 2FA handlers ----

	const handleToggleTwoFactor = (value: boolean) => {
		if (value) {
			// Enabling: collect password first
			setTwoFactorPassword('')
			setTwoFactorPasswordError(null)
			setShowTwoFactorPassword(false)
			setTwoFactorStep('password')
		} else {
			// Disabling: confirm then collect password
			Alert.alert(twoFactorT('disable_title'), twoFactorT('disable_message'), [
				{ text: twoFactorT('disable_cancel'), style: 'cancel' },
				{
					text: twoFactorT('disable_confirm'),
					style: 'destructive',
					onPress: () => {
						setTwoFactorPassword('')
						setTwoFactorPasswordError(null)
						setShowTwoFactorPassword(false)
						setTwoFactorStep('disable_password')
					},
				},
			])
		}
	}

	const handleTwoFactorEnableSubmitPassword = async () => {
		Keyboard.dismiss()
		setIsTwoFactorLoading(true)
		setTwoFactorError(null)
		try {
			const result = await authClient.twoFactor.enable({
				password: twoFactorPassword,
			})

			if (result.error) {
				setTwoFactorPasswordError(
					result.error.message || twoFactorT('enable_error'),
				)
				return
			}

			if (result.data) {
				setTotpUri(result.data.totpURI)
				setBackupCodes(result.data.backupCodes)
				setTwoFactorPassword('')
				setTwoFactorStep('totp_uri')
			}
		} catch {
			setTwoFactorPasswordError(twoFactorT('enable_error'))
		} finally {
			setIsTwoFactorLoading(false)
		}
	}

	const handleTwoFactorDisableSubmitPassword = async () => {
		Keyboard.dismiss()
		setIsTwoFactorLoading(true)
		setTwoFactorError(null)
		try {
			const result = await authClient.twoFactor.disable({
				password: twoFactorPassword,
			})

			if (result.error) {
				setTwoFactorPasswordError(
					result.error.message || twoFactorT('disable_error'),
				)
				return
			}

			setTwoFactorPassword('')
			setTwoFactorStep('idle')
		} catch {
			setTwoFactorPasswordError(twoFactorT('disable_error'))
		} finally {
			setIsTwoFactorLoading(false)
		}
	}

	const handleTwoFactorVerify = async (code: string) => {
		setIsTwoFactorLoading(true)
		setTwoFactorError(null)
		try {
			const result = await authClient.twoFactor.verifyTotp({
				code,
			})

			if (result.error) {
				setTwoFactorError(result.error.message || twoFactorT('verify_error'))
				setTotpCode('')
				return
			}

			// Verification succeeded — show backup codes
			setTwoFactorStep('backup_codes')
		} catch {
			setTwoFactorError(twoFactorT('verify_error'))
			setTotpCode('')
		} finally {
			setIsTwoFactorLoading(false)
		}
	}

	const handleCopyUri = () => {
		if (!totpUri) return
		Clipboard.setString(totpUri)
		setHasCopiedUri(true)
		setTimeout(() => setHasCopiedUri(false), 2000)
	}

	const handleCloseTwoFactorModal = () => {
		setTwoFactorStep('idle')
		setTwoFactorPassword('')
		setTwoFactorPasswordError(null)
		setShowTwoFactorPassword(false)
		setTotpUri(null)
		setBackupCodes([])
		setTotpCode('')
		setTwoFactorError(null)
		setHasCopiedUri(false)
	}

	const isTwoFactorPasswordModal =
		twoFactorStep === 'password' || twoFactorStep === 'disable_password'
	const isTwoFactorModalOpen =
		twoFactorStep !== 'idle' && twoFactorStep !== 'verify'
	const isVerifyModalOpen = twoFactorStep === 'verify'

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

					<Pressable
						style={styles.securityRow}
						onPress={() => router.push('/(profile)/active-sessions')}
						testID='active-sessions-row'
					>
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

				<View style={{ height: 1, backgroundColor: colors.neutral['30'] }} />

				{/* Two-Factor Authentication Section */}
				<View style={{ gap: 16 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						<Shield size={20} color={colors.neutral['500']} />
						<Text
							size='sm'
							fontWeight='bold'
							style={{ color: colors.neutral['600'] }}
						>
							{t('two_factor_authentication')}
						</Text>
					</View>

					<Text size='sm' style={{ color: colors.neutral['500'] }}>
						{t('two_factor_description')}
					</Text>

					<View style={styles.biometricToggleRow}>
						<View style={{ gap: 2, flex: 1 }}>
							<Text
								size='sm'
								fontWeight='bold'
								style={{ color: colors.neutral['600'] }}
							>
								{twoFactorEnabled
									? t('two_factor_enabled')
									: t('two_factor_disabled')}
							</Text>
						</View>
						<Switch
							value={twoFactorEnabled}
							onValueChange={handleToggleTwoFactor}
							testID='switch-two-factor'
						/>
					</View>
				</View>
			</ScrollView>

			{/* Biometric Password Modal */}
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

			{/* 2FA: Password step (enable) and TOTP URI step and Backup Codes step */}
			<Modal.Root
				open={isTwoFactorModalOpen}
				onOpenChange={(open) => {
					if (!open && !isTwoFactorLoading) handleCloseTwoFactorModal()
				}}
			>
				<View onStartShouldSetResponder={() => true}>
					{isTwoFactorPasswordModal && (
						<>
							<Modal.Header
								style={{ backgroundColor: colors.neutral['50'] }}
								icon={<Shield size={24} color={colors.neutral['500']} />}
								circularBackgroundColor={colors.neutral['30']}
							/>
							<Modal.Body>
								<Modal.Title>
									{twoFactorStep === 'password'
										? twoFactorT('enable_title')
										: twoFactorT('disable_title')}
								</Modal.Title>
								<Modal.Description>
									{t('enter_password_description')}
								</Modal.Description>
								<View style={{ gap: 4, paddingTop: 8 }}>
									<TextInput.Root>
										<TextInput.Control
											testID='two-factor-password-input'
											autoCapitalize='none'
											secureTextEntry={!showTwoFactorPassword}
											placeholder='********'
											value={twoFactorPassword}
											onChangeText={(text) => {
												setTwoFactorPassword(text)
												if (twoFactorPasswordError)
													setTwoFactorPasswordError(null)
											}}
											returnKeyType='done'
											onSubmitEditing={
												twoFactorStep === 'password'
													? handleTwoFactorEnableSubmitPassword
													: handleTwoFactorDisableSubmitPassword
											}
										/>
										<Pressable
											style={{ padding: 4 }}
											onPress={() =>
												setShowTwoFactorPassword(!showTwoFactorPassword)
											}
										>
											<Icon.Icon
												name={showTwoFactorPassword ? 'eye-off' : 'eye'}
												size={16}
											/>
										</Pressable>
									</TextInput.Root>
									{twoFactorPasswordError && (
										<Text size='xs' style={{ color: colors.error['500'] }}>
											{twoFactorPasswordError}
										</Text>
									)}
								</View>
							</Modal.Body>
							<View style={{ gap: 8, paddingVertical: 16 }}>
								<Button.Root
									variant='secondary'
									onPress={handleCloseTwoFactorModal}
									disabled={isTwoFactorLoading}
									testID='cancel-two-factor-password'
								>
									<Button.Text>{twoFactorT('cancel')}</Button.Text>
								</Button.Root>
								<Button.Root
									onPress={
										twoFactorStep === 'password'
											? handleTwoFactorEnableSubmitPassword
											: handleTwoFactorDisableSubmitPassword
									}
									disabled={twoFactorPassword.length < 1 || isTwoFactorLoading}
									loading={isTwoFactorLoading}
									testID='confirm-two-factor-password'
								>
									<Button.Text>{t('confirm')}</Button.Text>
								</Button.Root>
							</View>
						</>
					)}

					{twoFactorStep === 'totp_uri' && totpUri && (
						<>
							<Modal.Header
								style={{ backgroundColor: colors.neutral['50'] }}
								icon={<Shield size={24} color={colors.neutral['500']} />}
								circularBackgroundColor={colors.neutral['30']}
							/>
							<Modal.Body>
								<Modal.Title>{twoFactorT('enable_title')}</Modal.Title>
								<Modal.Description>
									{twoFactorT('enable_description')}
								</Modal.Description>
								<View style={styles.totpUriContainer}>
									<Text
										size='xs'
										style={{
											color: colors.neutral['600'],
											fontFamily: 'monospace',
											flexShrink: 1,
										}}
									>
										{totpUri}
									</Text>
									<Pressable
										onPress={handleCopyUri}
										style={styles.copyButton}
										testID='copy-totp-uri'
									>
										<Copy size={16} color={colors.neutral['500']} />
									</Pressable>
								</View>
								{hasCopiedUri && (
									<Text
										size='xs'
										style={{ color: colors.success[600], textAlign: 'center' }}
									>
										{twoFactorT('copied')}
									</Text>
								)}
							</Modal.Body>
							<View style={{ gap: 8, paddingVertical: 16 }}>
								<Button.Root
									variant='secondary'
									onPress={handleCloseTwoFactorModal}
									testID='cancel-totp-uri'
								>
									<Button.Text>{twoFactorT('cancel')}</Button.Text>
								</Button.Root>
								<Button.Root
									onPress={() => {
										setTotpCode('')
										setTwoFactorError(null)
										setTwoFactorStep('verify')
									}}
									testID='next-totp-uri'
								>
									<Button.Text>{twoFactorT('verify')}</Button.Text>
								</Button.Root>
							</View>
						</>
					)}

					{twoFactorStep === 'backup_codes' && (
						<>
							<Modal.Header
								style={{ backgroundColor: colors.neutral['50'] }}
								icon={<Shield size={24} color={colors.neutral['500']} />}
								circularBackgroundColor={colors.neutral['30']}
							/>
							<Modal.Body>
								<Modal.Title>{twoFactorT('backup_codes_title')}</Modal.Title>
								<Modal.Description>
									{twoFactorT('backup_codes_description')}
								</Modal.Description>
								<View style={styles.backupCodesContainer}>
									{backupCodes.map((code) => (
										<Text
											key={code}
											size='sm'
											style={{
												color: colors.neutral['700'],
												fontFamily: 'monospace',
												textAlign: 'center',
											}}
										>
											{code}
										</Text>
									))}
								</View>
								<View style={styles.warningRow}>
									<Info size={14} color={colors.warning[600]} />
									<Text
										size='xs'
										style={{ color: colors.warning[700], flex: 1 }}
									>
										{twoFactorT('backup_codes_warning')}
									</Text>
								</View>
							</Modal.Body>
							<View style={{ paddingVertical: 16 }}>
								<Button.Root
									onPress={handleCloseTwoFactorModal}
									testID='done-backup-codes'
								>
									<Button.Text>{twoFactorT('done')}</Button.Text>
								</Button.Root>
							</View>
						</>
					)}
				</View>
			</Modal.Root>

			{/* 2FA: TOTP verification modal */}
			<Modal.Root
				open={isVerifyModalOpen}
				onOpenChange={(open) => {
					if (!open && !isTwoFactorLoading) {
						setTwoFactorStep('totp_uri')
					}
				}}
			>
				<View onStartShouldSetResponder={() => true}>
					<Modal.Header
						style={{ backgroundColor: colors.neutral['50'] }}
						icon={<Shield size={24} color={colors.neutral['500']} />}
						circularBackgroundColor={colors.neutral['30']}
					/>
					<Modal.Body>
						<Modal.Title>{twoFactorT('verify_title')}</Modal.Title>
						<Modal.Description>
							{twoFactorT('verify_description')}
						</Modal.Description>
						<View style={{ alignItems: 'center', paddingTop: 12 }}>
							<PinInput.Root
								length={6}
								onComplete={(pin) => {
									setTotpCode(pin)
									handleTwoFactorVerify(pin)
								}}
								testID='totp-pin-input'
							>
								<PinInput.Fields>
									<PinInput.Field index={0} testID='totp-digit-0' />
									<PinInput.Field index={1} testID='totp-digit-1' />
									<PinInput.Field index={2} testID='totp-digit-2' />
									<PinInput.Divider />
									<PinInput.Field index={3} testID='totp-digit-3' />
									<PinInput.Field index={4} testID='totp-digit-4' />
									<PinInput.Field index={5} testID='totp-digit-5' />
								</PinInput.Fields>
							</PinInput.Root>
						</View>
						{twoFactorError && (
							<Text
								size='xs'
								style={{
									color: colors.error['500'],
									textAlign: 'center',
									marginTop: 8,
								}}
							>
								{twoFactorError}
							</Text>
						)}
					</Modal.Body>
					<View style={{ gap: 8, paddingVertical: 16 }}>
						<Button.Root
							variant='secondary'
							onPress={() => setTwoFactorStep('totp_uri')}
							disabled={isTwoFactorLoading}
							testID='back-to-totp-uri'
						>
							<Button.Text>{twoFactorT('cancel')}</Button.Text>
						</Button.Root>
						<Button.Root
							onPress={() => handleTwoFactorVerify(totpCode)}
							disabled={totpCode.length < 6 || isTwoFactorLoading}
							loading={isTwoFactorLoading}
							testID='confirm-totp-verify'
						>
							<Button.Text>{twoFactorT('verify')}</Button.Text>
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
	totpUriContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		backgroundColor: colors.neutral['20'],
		borderRadius: 8,
		padding: 10,
		marginTop: 8,
	},
	copyButton: {
		padding: 4,
	},
	backupCodesContainer: {
		gap: 6,
		backgroundColor: colors.neutral['20'],
		borderRadius: 8,
		padding: 12,
		marginTop: 8,
	},
	warningRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 6,
		marginTop: 8,
	},
})
