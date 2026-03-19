import { Layout } from '@/components/Layout'
import { Icon } from '@/components/Icon'
import {
	Button,
	Heading,
	PinInput,
	Text,
	TextInput,
} from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useForm } from '@tanstack/react-form'
import { useRouter } from 'expo-router'
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View, type ScrollView } from 'react-native'
import { z } from 'zod'
import { useFailedAttempts } from '@/hooks/useFailedAttempts'
import { Form } from '@/components/Form'
import { ErrorModal } from '@/components/ErrorModal'
import { extractErrorMessages } from '@/utils/form-errors'
import { authClient } from '@/services/auth'

const confirmEmailSchema = z.object({
	email: z
		.string({ message: 'email_required' })
		.min(1, { message: 'email_required' })
		.email({ message: 'email_invalid' }),
})

const ConfirmEmail = () => {
	const router = useRouter()
	const [canEnterCode, setCanEnterCode] = useState(false)
	const [isVerifying, setIsVerifying] = useState(false)
	const [verificationCode, setVerificationCode] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [email, setEmail] = useState('')

	const scrollViewRef = useRef<ScrollView>(null)
	const {
		MAX_ATTEMPTS,
		failedAttempts,
		updateFailedAttempts,
		resetFailedAttempts,
	} = useFailedAttempts()

	const { t } = useTranslation('confirm_email')
	const { t: errorT } = useTranslation('error')

	const startEmailVerification = async (email: string) => {
		try {
			const { data, error } = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: 'sign-in',
			})

			if (error) {
				throw new Error(error.message)
			}

			if (data.success) {
				setCanEnterCode(true)
			}
		} catch (error) {
			if (error instanceof Error) {
				const newAttemptCount = failedAttempts + 1
				await updateFailedAttempts(newAttemptCount)

				if (failedAttempts >= MAX_ATTEMPTS) {
					router.replace('/(onboarding)/too-many-attempts')
				} else {
					setErrorMessage(error?.message)
					setShowModal(true)
				}
			}
		}
	}

	const verifyCode = async (code: string, email: string) => {
		try {
			setIsVerifying(true)

			const { data, error } = await authClient.signIn.emailOtp({
				email,
				otp: code,
			})

			// TODO: if user is already onboarded, throw an error, then redirect to sign-in

			setIsVerifying(false)

			if (error) {
				throw new Error(error.message)
			}

			if (data?.token) {
				await resetFailedAttempts()
				router.push('/(onboarding)/email-verified')
			}
		} catch (error) {
			if (error instanceof Error) {
				setIsVerifying(false)
				setErrorMessage(error?.message)
				setShowModal(true)
			}
		}
	}

	const { handleSubmit, Field } = useForm({
		validators: {
			onSubmit: confirmEmailSchema,
		},
		onSubmit: async (values) => {
			const { email } = values.value as z.infer<typeof confirmEmailSchema>
			setEmail(email)
			await startEmailVerification(email)
		},
	})

	return (
		<View style={{ backgroundColor: 'white', flex: 1 }}>
			<Layout.KeyboardAvoidingView
				style={[styles.container, { paddingBottom: 32 }]}
			>
				<Layout.ScrollView
					ref={scrollViewRef}
					bounces={false}
					scrollToOverflowEnabled={true}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
					contentContainerStyle={{
						flexGrow: 1,
					}}
				>
					<Layout.KeyboardDismiss style={{ flex: 1, gap: 0 }}>
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
									name={canEnterCode ? 'passcode-lock' : 'inbox-01'}
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
								style={{ color: colors.neutral['700'] }}
							>
								{canEnterCode ? t('check_email') : t('welcome')}
							</Heading>
							<Text
								size='lg'
								style={{
									color: colors.neutral['700'],
									textAlign: 'center',
								}}
							>
								{canEnterCode ? t('we_sent_code') : t('we_are_glad')}
							</Text>
							<Text
								style={{
									color: colors.neutral['700'],
									textAlign: 'center',
								}}
							>
								{canEnterCode ? t('enter_code_verify') : t('confirm_email')}
							</Text>
						</View>

						<View style={styles.formContainer}>
							<View style={styles.fieldsContainer}>
								<View style={styles.inputContainer}>
									<Text fontWeight='bold' style={styles.boldText}>
										{t('email_caps')}
									</Text>
									<Field
										name='email'
										children={(field) => {
											const hasErrors =
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											return (
												<Form.GroupInput>
													<TextInput.Root
														id={field.name}
														disabled={canEnterCode}
													>
														<TextInput.Control
															keyboardType='email-address'
															autoCapitalize='none'
															testID='email-input'
															placeholder={t('enter_email')}
															value={field.state.value as string}
															onBlur={field.handleBlur}
															autoFocus
															returnKeyType='send'
															onSubmitEditing={() => handleSubmit()}
															onChangeText={(text) => field.handleChange(text)}
															onFocus={() => {
																setTimeout(() => {
																	scrollViewRef.current?.scrollTo({
																		y: 200,
																		animated: true,
																	})
																}, 100)
															}}
														/>
													</TextInput.Root>
													<Form.ErrorText hasError={hasErrors}>
														{errorT(
															extractErrorMessages(field.state.meta.errors),
														)}
													</Form.ErrorText>
												</Form.GroupInput>
											)
										}}
									/>
								</View>
								{canEnterCode && (
									<View style={styles.inputContainer}>
										<Text fontWeight='bold' style={styles.boldText}>
											{t('secure_code')}
										</Text>

										<View style={{ gap: 4 }}>
											<PinInput.Root
												testID='pin-input-root'
												onComplete={async (pin) => {
													setVerificationCode(pin)
													await verifyCode(pin, email)
												}}
												onFocus={() => {
													setTimeout(() => {
														scrollViewRef.current?.scrollTo({
															y: 300,
															animated: true,
														})
													}, 100)
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
																	<PinInput.Field
																		testID={`pin-input-field-${index}`}
																		index={index}
																	/>
																</View>
															)
														}
														return (
															<PinInput.Field
																index={index}
																testID={`pin-input-field-${index}`}
																key={`field-${index}`}
															/>
														)
													})}
												</PinInput.Fields>
											</PinInput.Root>
										</View>
									</View>
								)}
							</View>
							<View style={{ gap: 8 }}>
								{canEnterCode ? (
									<Button.Root
										size='lg'
										testID='verify-email'
										onPress={() => verifyCode(verificationCode, email)}
										disabled={isVerifying}
									>
										<Button.Text>{t('verify_email')}</Button.Text>
									</Button.Root>
								) : (
									<Button.Root
										testID='enter-email'
										size='lg'
										onPress={handleSubmit}
									>
										<Button.Text>{t('continue')}</Button.Text>
									</Button.Root>
								)}

								<Button.Root
									testID='back-button'
									variant='tertiary'
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
		</View>
	)
}

export default ConfirmEmail

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
	},
	formContainer: {
		flex: 1,
		gap: 24,
		justifyContent: 'space-between',
		width: '100%',
		paddingTop: 24,
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
