import { Layout } from '@/components/Layout'
import { Icon } from '@/components/Icon'
import { Button, Heading, Text, TextInput } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useForm } from '@tanstack/react-form'
import { useRouter } from 'expo-router'
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View, type ScrollView } from 'react-native'
import { z } from 'zod'
import { Form } from '@/components/Form'
import { ErrorModal } from '@/components/ErrorModal'
import { extractErrorMessages } from '@/utils/form-errors'
import { authClient } from '@/services/auth'
import { RESET_PASSWORD_DEEP_LINK } from '@/constants/deep-linking'

const enterEmailSchema = z.object({
	email: z
		.string({ message: 'email_required' })
		.min(1, { message: 'email_required' })
		.email({ message: 'email_invalid' }),
})

const ForgotPasswordEnterEmail = () => {
	const router = useRouter()
	const [showModal, setShowModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const scrollViewRef = useRef<ScrollView>(null)

	const { t } = useTranslation('confirm_email')
	const { t: errorT } = useTranslation('error')

	const requestPasswordReset = async (email: string) => {
		try {
			const { data, error } = await authClient.requestPasswordReset({
				email,
				redirectTo: RESET_PASSWORD_DEEP_LINK,
			})

			if (error) {
				throw new Error(error.message)
			}

			if (data?.status) {
				router.push({
					pathname: '/(forgot-password)/check-email',
					params: { email },
				})
			}
		} catch (error) {
			if (error instanceof Error) {
				setErrorMessage(error?.message)
				setShowModal(true)
			}
		}
	}

	const { handleSubmit, Field } = useForm({
		validators: {
			onSubmit: enterEmailSchema,
		},
		onSubmit: async (values) => {
			const { email } = values.value as z.infer<typeof enterEmailSchema>
			await requestPasswordReset(email)
		},
	})

	return (
		<Layout.SafeAreaView testID='enter-email-screen'>
			<Layout.KeyboardAvoidingView
				style={[styles.container, { paddingBottom: 32 }]}
			>
				<Layout.ScrollView
					bounces={false}
					scrollToOverflowEnabled={true}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
					contentContainerStyle={{
						flexGrow: 1,
					}}
				>
					<Layout.KeyboardDismiss
						style={{ flex: 1, gap: 0 }}
						testID='keyboard-dismiss'
					>
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

						<View style={{ alignItems: 'center', gap: 12 }}>
							<Heading
								testID='enter-email-heading'
								size='h3'
								fontWeight='bold'
								style={{ color: colors.neutral['700'] }}
							>
								{t('forgot_password')}
							</Heading>
							<Text
								size='lg'
								style={{
									color: colors.neutral['700'],
									textAlign: 'center',
								}}
							>
								{t('enter_email_description')}
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
													<TextInput.Root id={field.name}>
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
							</View>
							<View style={{ gap: 8 }}>
								<Button.Root
									testID='send-link-button'
									size='lg'
									onPress={handleSubmit}
								>
									<Button.Text>{t('send_link')}</Button.Text>
								</Button.Root>

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
		</Layout.SafeAreaView>
	)
}

export default ForgotPasswordEnterEmail

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
