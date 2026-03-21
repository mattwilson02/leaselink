import { ErrorModal } from '@/components/ErrorModal'
import { Form } from '@/components/Form'
import { Icon } from '@/components/Icon'
import { ErrorCodes } from '@/constants/better-auth-error-codes'
import { useAuthControllerHandle } from '@/gen/index'
import { useLocalCredentials } from '@/hooks/useLocalCredentials'
import { authClient } from '@/services/auth'
import { extractErrorMessages } from '@/utils/form-errors'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { TextInputCompound as TextInput } from '@/design-system/components/TextInputCompound'
import { colors } from '@/design-system/theme'
import { useForm } from '@tanstack/react-form'
import * as LocalAuthentication from 'expo-local-authentication'
import { useRouter } from 'expo-router'
import { Check, ChevronLeft } from 'lucide-react-native'
import { memo, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Pressable,
	ScrollView,
	StyleSheet,
	View,
	type TextInput as RNTextInput,
} from 'react-native'
import { z } from 'zod'

const changePasswordSchema = z.object({
	currentPassword: z
		.string({ message: 'password_required' })
		.min(1, { message: 'password_required' }),
	newPassword: z
		.string({ message: 'password_required' })
		.min(1, { message: 'password_required' })
		.min(8, { message: 'password_min_length' }),
	confirmNewPassword: z
		.string({ message: 'confirm_password_required' })
		.min(1, { message: 'confirm_password_required' }),
})

const PASSWORD_MISMATCH_ERROR = 'password_mismatch'

type PasswordRequirement = {
	key: string
	label: string
	test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
	{ key: 'min_length', label: 'req_min_length', test: (p) => p.length >= 8 },
	{ key: 'uppercase', label: 'req_uppercase', test: (p) => /[A-Z]/.test(p) },
	{ key: 'lowercase', label: 'req_lowercase', test: (p) => /[a-z]/.test(p) },
	{ key: 'number', label: 'req_number', test: (p) => /[0-9]/.test(p) },
	{
		key: 'special',
		label: 'req_special',
		test: (p) => /[!@#$%^&*\-~_.+]/.test(p),
	},
]

type PasswordRequirementItemProps = {
	met: boolean
	label: string
}

const PasswordRequirementItem = memo<PasswordRequirementItemProps>(
	({ met, label }) => (
		<View style={styles.requirementRow}>
			<View
				style={[
					styles.requirementCheckbox,
					met && styles.requirementCheckboxMet,
				]}
			>
				{met && <Check size={10} color='white' />}
			</View>
			<Text
				size='xs'
				style={{ color: met ? colors.neutral['600'] : colors.neutral['300'] }}
			>
				{label}
			</Text>
		</View>
	),
)

PasswordRequirementItem.displayName = 'PasswordRequirementItem'

const ChangePassword = () => {
	const { t } = useTranslation('change_password')
	const { t: errorT } = useTranslation('error')
	const router = useRouter()

	const { data: user } = useAuthControllerHandle()
	const session = authClient.useSession()
	const { hasCredentials, setCredentials } = useLocalCredentials()

	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [newPasswordValue, setNewPasswordValue] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const currentPasswordRef = useRef<RNTextInput>(null)
	const newPasswordRef = useRef<RNTextInput>(null)
	const confirmPasswordRef = useRef<RNTextInput>(null)

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	const { handleSubmit, Field } = useForm({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		},
		validators: {
			onSubmit: changePasswordSchema,
		},
		onSubmit: async (values) => {
			const formData = values.value

			if (formData.newPassword !== formData.confirmNewPassword) {
				setShowModal(true)
				setErrorMessage(errorT('password_mismatch'))
				return
			}

			const allRequirementsMet = passwordRequirements.every((req) =>
				req.test(formData.newPassword),
			)
			if (!allRequirementsMet) {
				setShowModal(true)
				setErrorMessage(errorT('password_requirements_not_met'))
				return
			}

			setIsSubmitting(true)

			try {
				if (!hasCredentials) {
					const biometricResult = await LocalAuthentication.authenticateAsync({
						promptMessage: t('biometric_prompt'),
						cancelLabel: errorT('close'),
						disableDeviceFallback: false,
						biometricsSecurityLevel: 'strong',
					})

					if (!biometricResult.success) {
						setIsSubmitting(false)
						return
					}
				}

				const { error } = await authClient.changePassword({
					currentPassword: formData.currentPassword,
					newPassword: formData.newPassword,
					revokeOtherSessions: false,
				})

				if (error) {
					setShowModal(true)
					if (error.code === ErrorCodes.INVALID_PASSWORD) {
						setErrorMessage(errorT('password_incorrect'))
					} else {
						setErrorMessage(error?.message || errorT('error'))
					}
					setIsSubmitting(false)
					return
				}

				if (hasCredentials) {
					const identifier = session?.data?.user?.email || user?.email || ''
					await setCredentials({
						identifier,
						password: formData.newPassword,
					})
				}

				router.back()
			} catch (err) {
				setShowModal(true)
				setErrorMessage(err instanceof Error ? err.message : String(err))
			} finally {
				setIsSubmitting(false)
			}
		},
	})

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
				keyboardShouldPersistTaps='handled'
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

				<View style={{ gap: 20 }}>
					{/* Current Password */}
					<View style={styles.inputContainer}>
						<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
							{t('current_password')}
						</Text>
						<Field
							name='currentPassword'
							children={(field) => {
								const hasErrors =
									(field.state.meta.isTouched ||
										field.state.meta.errors.length > 0) &&
									field.state.meta.errors.length > 0
								return (
									<Form.GroupInput>
										<TextInput.Root id={field.name}>
											<TextInput.Control
												ref={currentPasswordRef}
												testID='current-password-input'
												autoCapitalize='none'
												keyboardType='default'
												secureTextEntry={!showCurrentPassword}
												placeholder='********'
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={(text) => field.handleChange(text)}
												returnKeyType='next'
												onSubmitEditing={() => newPasswordRef.current?.focus()}
											/>
											<Pressable
												style={{ padding: 4 }}
												onPress={() =>
													setShowCurrentPassword(!showCurrentPassword)
												}
											>
												<Icon.Icon
													name={showCurrentPassword ? 'eye-off' : 'eye'}
													size={16}
												/>
											</Pressable>
										</TextInput.Root>
										<Form.ErrorText hasError={hasErrors}>
											{errorT(extractErrorMessages(field.state.meta.errors))}
										</Form.ErrorText>
									</Form.GroupInput>
								)
							}}
						/>
					</View>

					{/* New Password */}
					<View style={styles.inputContainer}>
						<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
							{t('new_password')}
						</Text>
						<Field
							name='newPassword'
							children={(field) => {
								const hasErrors =
									(field.state.meta.isTouched ||
										field.state.meta.errors.length > 0) &&
									field.state.meta.errors.length > 0
								return (
									<Form.GroupInput>
										<TextInput.Root id={field.name}>
											<TextInput.Control
												ref={newPasswordRef}
												testID='new-password-input'
												autoCapitalize='none'
												keyboardType='default'
												secureTextEntry={!showNewPassword}
												placeholder='********'
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={(text) => {
													field.handleChange(text)
													setNewPasswordValue(text)
												}}
												returnKeyType='next'
												onSubmitEditing={() =>
													confirmPasswordRef.current?.focus()
												}
											/>
											<Pressable
												style={{ padding: 4 }}
												onPress={() => setShowNewPassword(!showNewPassword)}
											>
												<Icon.Icon
													name={showNewPassword ? 'eye-off' : 'eye'}
													size={16}
												/>
											</Pressable>
										</TextInput.Root>
										<Form.ErrorText hasError={hasErrors}>
											{errorT(extractErrorMessages(field.state.meta.errors))}
										</Form.ErrorText>
									</Form.GroupInput>
								)
							}}
						/>
					</View>

					{/* Password Requirements */}
					<View style={styles.requirementsContainer}>
						<Text size='xs' style={{ color: colors.neutral['500'] }}>
							{t('password_must_contain')}
						</Text>
						{passwordRequirements.map((req) => (
							<PasswordRequirementItem
								key={req.key}
								met={req.test(newPasswordValue)}
								label={t(req.label)}
							/>
						))}
					</View>

					{/* Confirm New Password */}
					<View style={styles.inputContainer}>
						<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
							{t('confirm_new_password')}
						</Text>
						<Field
							name='confirmNewPassword'
							validators={{
								onSubmit: ({ value, fieldApi }) => {
									const newPwd = fieldApi.form.getFieldValue(
										'newPassword',
									) as string
									const confirmValue = value as string
									if (confirmValue && newPwd && confirmValue !== newPwd) {
										return PASSWORD_MISMATCH_ERROR
									}
								},
							}}
							children={(field) => {
								const hasErrors =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0
								return (
									<Form.GroupInput>
										<TextInput.Root id={field.name}>
											<TextInput.Control
												ref={confirmPasswordRef}
												testID='confirm-password-input'
												autoCapitalize='none'
												keyboardType='default'
												secureTextEntry={!showConfirmPassword}
												placeholder='********'
												value={field.state.value}
												onBlur={field.handleBlur}
												onChangeText={(text) => field.handleChange(text)}
												returnKeyType='done'
												onSubmitEditing={() => handleSubmit()}
											/>
											<Pressable
												style={{ padding: 4 }}
												onPress={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
											>
												<Icon.Icon
													name={showConfirmPassword ? 'eye-off' : 'eye'}
													size={16}
												/>
											</Pressable>
										</TextInput.Root>
										<Form.ErrorText hasError={hasErrors}>
											{errorT(extractErrorMessages(field.state.meta.errors))}
										</Form.ErrorText>
									</Form.GroupInput>
								)
							}}
						/>
					</View>
				</View>

				{/* Action Buttons */}
				<View style={styles.buttonContainer}>
					<Button.Root
						variant='secondary'
						size='lg'
						style={{ flex: 1 }}
						onPress={handleBack}
						testID='cancel-button'
					>
						<Button.Text>{t('cancel')}</Button.Text>
					</Button.Root>
					<Button.Root
						size='lg'
						style={{ flex: 1 }}
						onPress={handleSubmit}
						disabled={isSubmitting}
						testID='save-button'
					>
						<Button.Text>{t('save')}</Button.Text>
					</Button.Root>
				</View>
			</ScrollView>

			<ErrorModal
				showModal={showModal}
				setShowModal={setShowModal}
				errorMessage={errorMessage}
			/>
		</View>
	)
}

export default ChangePassword

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
		paddingBottom: 32,
		paddingHorizontal: 16,
	},
	inputContainer: {
		gap: 6,
	},
	requirementsContainer: {
		gap: 8,
		paddingLeft: 4,
	},
	requirementRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	requirementCheckbox: {
		width: 16,
		height: 16,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: colors.neutral['100'],
		alignItems: 'center',
		justifyContent: 'center',
	},
	requirementCheckboxMet: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 12,
		paddingTop: 12,
	},
})
