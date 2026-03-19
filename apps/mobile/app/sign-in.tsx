import { Button, Heading, Text, TextInput } from '@sf-digital-ui/react-native'
import { useRouter } from 'expo-router'
import { View, StyleSheet, Pressable } from 'react-native'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { colors } from '@sf-digital-ui/tokens'
import LogoVertical from '@/assets/images/sf-logo-vertical.svg'
import { Layout } from '@/components/Layout'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Form } from '@/components/Form'
import { ErrorModal } from '@/components/ErrorModal'
import { useAuthControllerHandle } from '@/gen/index'
import * as SecureStore from 'expo-secure-store'
import { Icon } from '@/components/Icon'
import { extractErrorMessages } from '@/utils/form-errors'
import { authClient } from '@/services/auth'
import { ErrorCodes } from '@/constants/better-auth-error-codes'
import { useLocalCredentials } from '@/hooks/useLocalCredentials'
import { useRef } from 'react'
import type { TextInput as RNTextInput } from 'react-native'

const signInSchema = z.object({
	email: z
		.string({ message: 'email_required' })
		.min(1, { message: 'email_required' })
		.email({ message: 'email_invalid' }),
	password: z
		.string({ message: 'password_required' })
		.min(1, { message: 'password_required' }),
})

type SignInSchema = z.infer<typeof signInSchema>

const SignIn = () => {
	const [deviceId, setDeviceId] = useState<string | null>(null)
	const [showPassword, setShowPassword] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [passwordError, setPasswordError] = useState<string | null>(null)

	const emailInputRef = useRef<RNTextInput>(null)
	const passwordInputRef = useRef<RNTextInput>(null)

	const { refetch: getUser } = useAuthControllerHandle({
		'Device-Id': deviceId ?? '',
	})

	const { clearCredentials } = useLocalCredentials()

	const { t } = useTranslation('sign_in')
	const { t: errorT } = useTranslation('error')

	const router = useRouter()

	const onSignIn = async ({ email, password }: SignInSchema) => {
		try {
			const response = await authClient.signIn.email({
				email,
				password,
			})

			if (
				response.error &&
				// TODO: Replace with enum from library when available: https://www.better-auth.com/docs/concepts/client#error-codes
				response.error.code === ErrorCodes.INVALID_EMAIL_OR_PASSWORD
			) {
				setPasswordError(errorT('password_incorrect'))
				return
			}

			if (response.data?.token) {
				setPasswordError(null)

				const user = await getUser()

				if (user?.data?.isDeviceRecognized) {
					return router.replace('/(main)/documents')
				}

				await authClient.signOut()

				const { data } = await authClient.emailOtp.sendVerificationOtp({
					email,
					type: 'sign-in',
				})

				if (data?.success) {
					router.push({
						pathname: '/(new-device)/confirm-email',
						params: {
							password,
							email,
						},
					})
				}
			}
		} catch (error) {
			setShowModal(true)
			setError(error instanceof Error ? error.message : String(error))
			return
		}
	}

	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
		} as SignInSchema,
		validators: {
			onSubmit: signInSchema,
		},
		onSubmit: async (values) => {
			await onSignIn(values.value)
		},
	})

	const { handleSubmit, Field } = form

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

	return (
		<>
			<Layout.SafeAreaView>
				<Layout.KeyboardAvoidingView>
					<Layout.KeyboardDismiss>
						<View style={styles.headingContainer} testID='sign-in-heading'>
							<LogoVertical width={160} height={80} />
							<View style={styles.headerContainer}>
								<Heading fontWeight='bold' style={styles.boldText} size='h5'>
									{t('login_title')}
								</Heading>
								<Text>
									{t('welcome_back')}! {t('enter_details')}.
								</Text>
							</View>
						</View>
						<View style={styles.formContainer}>
							<View style={styles.inputContainer}>
								<Text fontWeight='bold' style={styles.boldText}>
									{t('email_caps')}
								</Text>
								<Field
									name='email'
									children={(field) => {
										const hasErrors =
											(field.state.meta.isTouched ||
												form.state.submissionAttempts > 0) &&
											field.state.meta.errors.length > 0
										return (
											<Form.GroupInput>
												<TextInput.Root id={field.name}>
													<TextInput.Control
														ref={emailInputRef}
														autoCapitalize='none'
														keyboardType='email-address'
														testID='email-input'
														placeholder={t('enter_email')}
														value={field.state.value}
														onBlur={field.handleBlur}
														autoFocus
														returnKeyType='next'
														onSubmitEditing={() =>
															passwordInputRef.current?.focus()
														}
														onChangeText={(text) => field.handleChange(text)}
													/>
												</TextInput.Root>
												<Form.ErrorText hasError={hasErrors}>
													{errorT(
														extractErrorMessages(field.state.meta.errors, true),
													)}
												</Form.ErrorText>
											</Form.GroupInput>
										)
									}}
								/>
							</View>
							<View style={styles.inputContainer}>
								<Text fontWeight='bold' style={styles.boldText}>
									{t('password_caps')}
								</Text>
								<Field
									name='password'
									children={(field) => {
										const hasErrors =
											(field.state.meta.isTouched ||
												form.state.submissionAttempts > 0) &&
											field.state.meta.errors.length > 0
										const errorText = hasErrors
											? errorT(
													extractErrorMessages(field.state.meta.errors, true),
												)
											: passwordError
										return (
											<Form.GroupInput>
												<TextInput.Root id={field.name}>
													<TextInput.Control
														ref={passwordInputRef}
														autoCapitalize='none'
														keyboardType='default'
														testID='password-input'
														placeholder='*********'
														secureTextEntry={!showPassword}
														value={field.state.value}
														onBlur={field.handleBlur}
														returnKeyType='done'
														onSubmitEditing={() => handleSubmit()}
														onChangeText={(text) => {
															field.handleChange(text)
															if (passwordError) setPasswordError(null)
														}}
													/>

													<Pressable
														onPress={() => setShowPassword(!showPassword)}
														style={{ padding: 4 }}
													>
														<Icon.Icon
															name={showPassword ? 'eye-off' : 'eye'}
															size={16}
														/>
													</Pressable>
												</TextInput.Root>
												<Form.ErrorText hasError={!!errorText}>
													{errorText}
												</Form.ErrorText>
											</Form.GroupInput>
										)
									}}
								/>
							</View>
							<Button.Root
								variant='link'
								size='sm'
								color='sf-green'
								style={{ alignSelf: 'flex-end', padding: 4 }}
								testID='forgot-password-button'
								onPress={() => router.push('/(forgot-password)/enter-email')}
							>
								<Button.Text>{t('forgot_password')}</Button.Text>
							</Button.Root>

							<Button.Root
								size='lg'
								testID='sign-in-button'
								onPress={handleSubmit}
							>
								<Button.Text>{t('sign_in')}</Button.Text>
							</Button.Root>
							{/** TODO: remove this/ only show in DEV mode */}
							<Button.Root
								size='lg'
								testID='clear-credentials-button'
								onPress={clearCredentials}
							>
								<Button.Text>Clear credentials [DEBUG]</Button.Text>
							</Button.Root>

							<View style={styles.divider} />

							<View style={styles.registerContainer}>
								<Text
									size='sm'
									fontWeight='bold'
									style={{
										color: colors.neutral['500'],
									}}
								>
									{t('dont_have_account')}
								</Text>

								<Pressable
									testID='register-now-button'
									onPress={() =>
										router.replace('/(onboarding)/choose-language')
									}
									style={{ padding: 4 }}
								>
									<Text
										size='sm'
										fontWeight='bold'
										style={{
											color: colors['primary-green']['500'],
										}}
									>
										{t('register_now')}
									</Text>
								</Pressable>
							</View>
						</View>
					</Layout.KeyboardDismiss>
				</Layout.KeyboardAvoidingView>
			</Layout.SafeAreaView>

			<ErrorModal
				showModal={showModal}
				setShowModal={setShowModal}
				errorMessage={error}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	divider: {
		height: 1,
		backgroundColor: colors.neutral['30'],
	},
	registerContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
	},
	formContainer: {
		gap: 20,
	},
	inputContainer: {
		gap: 6,
	},
	headingContainer: {
		alignItems: 'center',
		gap: 24,
	},
	headerContainer: {
		alignItems: 'center',
		gap: 8,
	},
	boldText: {
		color: colors.neutral['700'],
	},
})

export default SignIn
