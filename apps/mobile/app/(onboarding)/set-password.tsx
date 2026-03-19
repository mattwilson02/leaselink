import { Form } from '@/components/Form'
import { Icon } from '@/components/Icon'
import { Layout } from '@/components/Layout'
import { extractErrorMessages } from '@/utils/form-errors'

import { Button, Heading, Text, TextInput } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useForm } from '@tanstack/react-form'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Pressable,
	type ScrollView,
	StyleSheet,
	View,
	type TextInput as RNTextInput,
} from 'react-native'
import { z } from 'zod'

const PASSWORD_MISMATCH_ERROR = 'password_mismatch'

const setPasswordSchema = z.object({
	password: z
		.string({ message: 'password_required' })
		.min(1, { message: 'password_required' })
		.min(8, { message: 'password_min_length' }),
	retypePassword: z
		.string({ message: 'confirm_password_required' })
		.min(1, { message: 'confirm_password_required' })
		.min(8, { message: 'password_min_length' }),
})

const SetPassword = () => {
	const [showPassword, setShowPassword] = useState(false)
	const [showRetypePassword, setShowRetypePassword] = useState(false)

	const { t } = useTranslation('set_password')
	const { t: errorT } = useTranslation('error')
	const router = useRouter()

	const scrollViewRef = useRef<ScrollView>(null)
	const passwordInputRef = useRef<RNTextInput>(null)
	const retypePasswordInputRef = useRef<RNTextInput>(null)

	const { handleSubmit, Field } = useForm({
		validators: {
			onSubmit: setPasswordSchema,
		},
		onSubmit: (values) => {
			const formData = values.value as {
				password: string
				retypePassword: string
			}
			if (formData.password !== formData.retypePassword) {
				return
			}
			router.replace({
				pathname: '/enable-biometrics',
				params: { password: formData.password },
			})
		},
	})

	return (
		<View style={{ backgroundColor: 'white', flex: 1 }}>
			<Layout.KeyboardAvoidingView
				style={[styles.container, { paddingBottom: 32 }]}
				keyboardVerticalOffset={100}
			>
				<Layout.ScrollView
					ref={scrollViewRef}
					bounces={false}
					scrollToOverflowEnabled={true}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
					contentContainerStyle={{
						flexGrow: 1,
						gap: 0,
						paddingBottom: 32,
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
								size='h3'
								fontWeight='bold'
								style={{ color: colors.neutral['700'] }}
							>
								{t('setup_password')}
							</Heading>
							<Text
								size='lg'
								style={{
									color: colors.neutral['700'],
									textAlign: 'center',
								}}
							>
								{t('create_secure_password')}
							</Text>
							<Text
								style={{
									color: colors.neutral['700'],
									textAlign: 'center',
								}}
							>
								{t('setup_password_description')}
							</Text>
						</View>

						<View style={styles.formContainer}>
							<View style={styles.fieldsContainer}>
								<View style={styles.inputContainer}>
									<Text
										fontWeight='bold'
										style={{ color: colors.neutral['700'] }}
									>
										{t('password')}
									</Text>

									<Field
										name='password'
										children={(field) => {
											const hasErrors =
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											return (
												<Form.GroupInput>
													<TextInput.Root id={field.name}>
														<TextInput.Control
															ref={passwordInputRef}
															testID='password-input'
															autoCapitalize='none'
															keyboardType='default'
															secureTextEntry={!showPassword}
															placeholder='********'
															value={field.state.value as string}
															onBlur={field.handleBlur}
															autoFocus
															onChangeText={(text) => field.handleChange(text)}
															onFocus={() => {
																setTimeout(() => {
																	scrollViewRef.current?.scrollTo({
																		y: 200,
																		animated: true,
																	})
																}, 100)
															}}
															returnKeyType='next'
															onSubmitEditing={() =>
																retypePasswordInputRef.current?.focus()
															}
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

								<View style={styles.inputContainer}>
									<Text
										fontWeight='bold'
										style={{ color: colors.neutral['700'] }}
									>
										{t('retype_password')}
									</Text>

									<Field
										name='retypePassword'
										validators={{
											onSubmit: ({ value, fieldApi }) => {
												const passwordValue = fieldApi.form.getFieldValue(
													'password',
												) as string
												const retypeValue = value as string
												if (
													retypeValue &&
													passwordValue &&
													retypeValue !== passwordValue
												) {
													return PASSWORD_MISMATCH_ERROR
												}
											},
										}}
										children={(field) => {
											return (
												<View style={{ gap: 4 }}>
													<TextInput.Root id={field.name}>
														<TextInput.Control
															ref={retypePasswordInputRef}
															testID='retypepassword-input'
															autoCapitalize='none'
															keyboardType='default'
															secureTextEntry={!showRetypePassword}
															placeholder='********'
															value={field.state.value as string}
															onBlur={field.handleBlur}
															returnKeyType='done'
															onChangeText={(text) => field.handleChange(text)}
															onSubmitEditing={() => handleSubmit()}
															onFocus={() => {
																setTimeout(() => {
																	scrollViewRef.current?.scrollTo({
																		y: 300,
																		animated: true,
																	})
																}, 100)
															}}
														/>

														<Pressable
															style={{ padding: 4 }}
															onPress={() =>
																setShowRetypePassword(!showRetypePassword)
															}
														>
															<Icon.Icon
																name={showRetypePassword ? 'eye-off' : 'eye'}
																size={16}
															/>
														</Pressable>
													</TextInput.Root>
													{field.state.meta.isTouched &&
													field.state.meta.errors.length ? (
														<Text
															size='xs'
															style={{ color: colors.error['500'] }}
														>
															{errorT(
																extractErrorMessages(field.state.meta.errors),
															)}
														</Text>
													) : (
														<View style={{ height: 5 }} />
													)}
												</View>
											)
										}}
									/>
								</View>
							</View>

							<Button.Root
								testID='submit-password'
								size='lg'
								onPress={handleSubmit}
							>
								<Button.Text>{t('setup_your_password')}</Button.Text>
							</Button.Root>
						</View>
					</Layout.KeyboardDismiss>
				</Layout.ScrollView>
			</Layout.KeyboardAvoidingView>
		</View>
	)
}

export default SetPassword

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
		paddingTop: 20,
	},
	fieldsContainer: {
		gap: 20,
	},
	inputContainer: {
		gap: 12,
	},
})
