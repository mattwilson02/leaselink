import { Layout } from '@/components/Layout'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { Icon } from '@/components/Icon'
import { ErrorModal } from '@/components/ErrorModal'
import { PinInputCompound as PinInput } from '@/design-system/components/PinInputCompound'
import {
	useAuthControllerHandle,
	useSendClientPhoneOtpControllerHandle,
	useVerifyPhoneNumberOtpControllerHandle,
} from '@/gen/index'

const NewDeviceConfirmMobileNumber = () => {
	const { t } = useTranslation('confirm_mobile_number')
	const { t: errorT } = useTranslation('error')
	const router = useRouter()
	const { password } = useLocalSearchParams()

	const [showModal, setShowModal] = useState(false)
	const [isVerifying, setIsVerifying] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [verificationCode, setVerificationCode] = useState('')
	const [isResendDisabled, setIsResendDisabled] = useState(false)
	const [resendCountdown, setResendCountdown] = useState(0)

	const { mutateAsync: sendClientPhoneOtp } =
		useSendClientPhoneOtpControllerHandle()
	const { mutateAsync: verifyClientPhoneOtp } =
		useVerifyPhoneNumberOtpControllerHandle()

	const { data: user } = useAuthControllerHandle()

	const verifyCode = async (code: string) => {
		try {
			setIsVerifying(true)
			const result = await verifyClientPhoneOtp({
				data: {
					otp: code,
				},
			})

			setIsVerifying(false)

			if (result?.success) {
				router.push({
					pathname: '/(new-device)/mobile-verified',
					params: { password },
				})
			}
		} catch (error) {
			if (error instanceof Error) {
				setIsVerifying(false)
				setErrorMessage(error?.message || errorT('error'))
				setShowModal(true)
			}
		}
	}

	const resendCode = async () => {
		if (isResendDisabled) return

		try {
			setIsResendDisabled(true)
			setResendCountdown(10)
			await sendClientPhoneOtp({
				data: {},
			})
		} catch (error) {
			if (error instanceof Error) {
				setErrorMessage(error?.message || errorT('error'))
				setShowModal(true)
			}
		}
	}

	const sendCode = async () => {
		try {
			await sendClientPhoneOtp({
				data: {},
			})
		} catch (error) {
			if (error instanceof Error) {
				setErrorMessage(error?.message)
				setShowModal(true)
			}
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: call on initial render only
	useEffect(() => {
		sendCode()
	}, [])

	const resendButtonText = isResendDisabled
		? `${t('resend_code')} (${resendCountdown}s)`
		: t('resend_code')

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

	return (
		<Layout.SafeAreaView testID='new-device-confirm-mobile-number-screen'>
			<Layout.KeyboardAvoidingView
				testID='keyboard-dismiss'
				style={styles.container}
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
						<View style={{ alignItems: 'center' }}>
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
										name='passcode'
										size={28}
										stroke={colors.neutral['500']}
										strokeWidth={2}
									/>
								</Icon.IconContainer>
							</Icon.Root>
							<View style={{ alignItems: 'center', gap: 12 }}>
								<Heading
									testID='confirm-email-heading'
									size='h3'
									fontWeight='bold'
									style={{
										color: colors.neutral['700'],
										textAlign: 'center',
									}}
								>
									{t('confirm_mobile_number')}
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
										{user?.phoneNumber || ''}
									</Text>
								</View>
								<Text
									style={{ color: colors.neutral['700'], textAlign: 'center' }}
								>
									{t('enter_to_verify')}
								</Text>
							</View>
						</View>

						<View style={styles.formContainer}>
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
															<PinInput.Field index={index} key={index} />
														</View>
													)
												}
												return <PinInput.Field index={index} key={index} />
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
							<Button.Root
								testID='verify-your-number-button'
								disabled={isVerifying}
								size='lg'
								onPress={async () => {
									await verifyCode(verificationCode)
								}}
							>
								<Button.Text>{t('verify_your_number')}</Button.Text>
							</Button.Root>
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

export default NewDeviceConfirmMobileNumber

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
	selectItemContainer: {
		flexDirection: 'row',
		gap: 12,
		alignItems: 'center',
	},
})
