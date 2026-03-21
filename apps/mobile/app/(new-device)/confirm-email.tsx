import { Layout } from '@/components/Layout'
import { Icon } from '@/components/Icon'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { ErrorModal } from '@/components/ErrorModal'
import { PinInputCompound as PinInput } from '@/design-system/components/PinInputCompound'
import { authClient } from '@/services/auth'

const NewDeviceConfirmEmail = () => {
	const router = useRouter()
	const { password, email } = useLocalSearchParams<{
		password: string
		email: string
	}>()
	const [verificationCode, setVerificationCode] = useState('')
	const [isVerifying, setIsVerifying] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isResendDisabled, setIsResendDisabled] = useState(false)
	const [resendCountdown, setResendCountdown] = useState(0)

	const { t } = useTranslation('confirm_email')
	const { t: errorT } = useTranslation('error')

	useEffect(() => {
		let timer: NodeJS.Timeout | null = null

		if (resendCountdown > 0) {
			timer = setTimeout(() => {
				setResendCountdown((prevCount) => prevCount - 1)
			}, 1000)
		} else if (resendCountdown === 0 && isResendDisabled) {
			setIsResendDisabled(false)
		}

		return () => {
			if (timer) clearTimeout(timer)
		}
	}, [resendCountdown, isResendDisabled])

	const verifyCode = useCallback(
		async (code: string) => {
			try {
				setIsVerifying(true)
				if (!email) {
					throw new Error('Email is required')
				}

				const signIn = await authClient.signIn.emailOtp({
					email,
					otp: code,
				})

				if (signIn.error) {
					throw new Error(signIn.error.message || errorT('error'))
				}

				setIsVerifying(false)

				if (signIn.data.token) {
					router.push({
						pathname: '/(new-device)/email-verified',
						params: { password },
					})
				}
			} catch (error) {
				if (error instanceof Error) {
					setIsVerifying(false)
					setErrorMessage(error?.message)
					setShowModal(true)
				}
			}
		},
		[email, password, router, errorT],
	)

	const resendCode = async () => {
		if (!email || isResendDisabled) return

		try {
			setIsResendDisabled(true)
			setResendCountdown(10)

			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: 'sign-in',
			})

			if (error) {
				throw new Error(error.message || errorT('error'))
			}
		} catch (error) {
			if (error instanceof Error) {
				setErrorMessage(error?.message)
				setShowModal(true)
			}
		}
	}

	const resendButtonText = isResendDisabled
		? `${t('resend_code')} (${resendCountdown}s)`
		: t('resend_code')

	return (
		<Layout.SafeAreaView testID='new-device-confirm-email-screen'>
			<Layout.KeyboardAvoidingView
				style={[styles.container]}
				testID='keyboard-dismiss'
			>
				<Layout.ScrollView
					bounces={false}
					scrollToOverflowEnabled={true}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
					contentContainerStyle={{
						flexGrow: 1,
						paddingBottom: 32,
					}}
				>
					<Layout.KeyboardDismiss style={{ flex: 1 }}>
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
										name='passcode-lock'
										size={28}
										stroke={colors.neutral['500']}
										strokeWidth={2}
									/>
								</Icon.IconContainer>
							</Icon.Root>

							<View
								style={{
									alignItems: 'center',
									gap: 12,
								}}
							>
								<Heading
									testID='confirm-email-heading'
									size='h3'
									fontWeight='bold'
									style={{ color: colors.neutral['700'] }}
								>
									{t('check_email')}
								</Heading>
								<View
									style={{
										gap: 4,
										justifyContent: 'center',
										flexDirection: 'row',
										flexWrap: 'wrap',
									}}
								>
									<Text
										size='lg'
										style={{
											color: colors.neutral['700'],
										}}
									>
										{t('we_sent_code_to')}
									</Text>
									<Text
										size='lg'
										style={{
											color: colors.neutral['700'],
										}}
									>
										{email}
									</Text>
								</View>
								<Text
									style={{
										color: colors.neutral['700'],
										textAlign: 'center',
									}}
								>
									{t('enter_code_verify')}
								</Text>
							</View>
						</View>

						<View style={styles.formContainer}>
							<View style={styles.fieldsContainer}>
								<View style={styles.inputContainer}>
									<Text fontWeight='bold' style={styles.boldText}>
										{t('secure_code')}
									</Text>

									<View style={{ gap: 4 }}>
										<PinInput.Root
											testID='pin-input-root'
											onComplete={async (pin) => {
												setVerificationCode(pin)
												await verifyCode(pin)
											}}
											length={6}
											size='md'
										>
											<PinInput.Fields style={{ flexGrow: 1, gap: 6 }}>
												{/** biome-ignore lint/style/useNamingConvention: variable unused */}
												{Array.from({ length: 6 }).map((_, index) => {
													if (index === 3) {
														return (
															<View
																style={{
																	flexDirection: 'row',
																	gap: 8,
																	alignItems: 'center',
																}}
																key={`field-${index}`}
															>
																<PinInput.Divider />
																<PinInput.Field index={index} />
															</View>
														)
													}
													return (
														<PinInput.Field
															index={index}
															key={`field-${index}`}
														/>
													)
												})}
											</PinInput.Fields>
										</PinInput.Root>
									</View>
									<View style={{ flexDirection: 'row', gap: 4 }}>
										<Text
											size='sm'
											style={{
												color: colors.neutral['400'],
											}}
										>
											{t('didnt_receive_code')}
										</Text>
										<Text
											size='sm'
											fontWeight='bold'
											style={{
												color: isResendDisabled
													? colors.neutral['300']
													: colors.primary,
											}}
											onPress={resendCode}
											testID='resend-code-button'
										>
											{resendButtonText}
										</Text>
									</View>
								</View>
							</View>
							<View style={{ gap: 10 }}>
								<Button.Root
									testID='verify-email'
									disabled={isVerifying}
									size='lg'
									onPress={() => verifyCode(verificationCode)}
								>
									<Button.Text>{t('verify_email')}</Button.Text>
								</Button.Root>

								<Button.Root
									testID='back-button'
									variant='tertiary'
									style={{ paddingVertical: 12 }}
									onPress={() => router.back()}
								>
									<Button.Text>{t('back')}</Button.Text>
								</Button.Root>
							</View>
						</View>
					</Layout.KeyboardDismiss>
				</Layout.ScrollView>
			</Layout.KeyboardAvoidingView>
			<ErrorModal
				showModal={showModal}
				setShowModal={setShowModal}
				errorMessage={errorMessage}
			/>
		</Layout.SafeAreaView>
	)
}

export default NewDeviceConfirmEmail

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	formContainer: {
		flex: 1,
		gap: 24,
		justifyContent: 'space-between',
		width: '100%',
		paddingTop: 20,
	},
	inputContainer: {
		gap: 12,
	},
	boldText: {
		color: colors.neutral['700'],
	},
	fieldsContainer: {
		gap: 20,
	},
})
