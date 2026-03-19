import { InputSelect } from '@/components/InputSelect'
import { Layout } from '@/components/Layout'
import { Button, Heading, PinInput, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useForm } from '@tanstack/react-form'
import { useRouter } from 'expo-router'
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, View, type ScrollView } from 'react-native'
import { z } from 'zod'
import countries from 'world-countries'
import CountryFlag from 'react-native-country-flag'
import { Icon } from '@/components/Icon'
import { Form } from '@/components/Form'
import {
	unifiedUserDTOOnboardingStatusEnum,
	useAuthControllerHandle,
	useEditClientControllerHandle,
	useSendClientPhoneOtpControllerHandle,
	useVerifyPhoneNumberOtpControllerHandle,
} from '@/gen/index'
import { ErrorModal } from '@/components/ErrorModal'
import { extractErrorMessages } from '@/utils/form-errors'

const confirmMobileNumberSchema = z.object({
	countryCode: z
		.string({
			message: 'countrycode_required',
		})
		.min(1, {
			message: 'countrycode_required',
		}),
	mobileNumber: z
		.string({
			message: 'mobile_number_required',
		})
		.min(1, {
			message: 'mobile_number_required',
		}),
})

const ConfirmMobileNumber = () => {
	const { t } = useTranslation('confirm_mobile_number')
	const { t: errorT } = useTranslation('error')
	const router = useRouter()
	const [showModal, setShowModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isVerifying, setIsVerifying] = useState(false)

	const [canEnterCode, setCanEnterCode] = useState(false)
	const [verificationCode, setVerificationCode] = useState('')

	const scrollViewRef = useRef<ScrollView>(null)

	const { data } = useAuthControllerHandle()

	const { mutateAsync: editClientStatus } = useEditClientControllerHandle()
	const { mutateAsync: sendClientPhoneOtp } =
		useSendClientPhoneOtpControllerHandle()
	const { mutateAsync: verifyClientPhoneOtp } =
		useVerifyPhoneNumberOtpControllerHandle()

	const priorityCountries = [
		'US', // North America (United States)
		'CA', // North America (Canada)
		'GB', // United Kingdom
		'JE', // Jersey
		'GG', // Guernsey
		'IM', // Isle of Man
		'CH', // Switzerland
		'LU', // Luxembourg
		'LI', // Liechtenstein
		'MC', // Monaco
		'MT', // Malta
		'ZA', // South Africa
		'MU', // Mauritius
		'IL', // Israel
	]

	const formattedCountries = countries
		.map((country) => {
			if (!country.idd?.root) {
				return
			}

			const itHasSuffixes =
				country.idd.suffixes && country.idd.suffixes.length === 1

			const callingCode = itHasSuffixes
				? `${country.idd.root}${country.idd.suffixes[0]}`
				: country.idd.root

			return {
				name: country.name.common,
				countryCode: country.cca2,
				callingCode: callingCode,
			}
		})
		.filter((country) => !!country)
		.sort((a, b) => {
			const aIndex = priorityCountries.indexOf(a.countryCode)
			const bIndex = priorityCountries.indexOf(b.countryCode)
			if (aIndex !== -1 && bIndex !== -1) {
				return aIndex - bIndex
			}
			if (aIndex !== -1) {
				return -1
			}
			if (bIndex !== -1) {
				return 1
			}
			return a.name.localeCompare(b.name)
		})

	const startMobileVerification = async (mobileNumber: string) => {
		try {
			const { success } = await sendClientPhoneOtp(
				{
					data: {
						phoneNumber: mobileNumber,
					},
				},
				{
					onError: (error) => {
						setErrorMessage(error.message || errorT('error'))
						setShowModal(true)
						return
					},
				},
			)

			if (success) {
				setCanEnterCode(true)
			}
		} catch (error) {
			if (error instanceof Error) {
				setErrorMessage(error?.message)
				setShowModal(true)
			}
			console.error('Verify mobile number failed', error)
		}
	}

	const { handleSubmit, Field } = useForm({
		defaultValues: {
			countryCode: 'US',
			mobileNumber: '',
		},
		validators: {
			onSubmit: confirmMobileNumberSchema,
		},
		onSubmit: async (values) => {
			const formData = values.value as {
				countryCode: string
				mobileNumber: string
			}
			const countryCallingCode = formattedCountries.find(
				(country) => country.countryCode === formData.countryCode,
			)?.callingCode

			const formattedNumberWithCallingCode = `${countryCallingCode}${formData.mobileNumber}`

			await startMobileVerification(formattedNumberWithCallingCode)
		},
	})

	const verifyCode = async (code: string) => {
		try {
			setIsVerifying(true)

			const { success } = await verifyClientPhoneOtp(
				{
					data: {
						otp: code,
					},
				},
				{
					onError: (error) => {
						setIsVerifying(false)
						setErrorMessage(error.message || errorT('error'))
						setShowModal(true)
						return
					},
				},
			)

			if (success) {
				if (!data?.id) {
					router.replace('/sign-in')
					return
				}

				await editClientStatus({
					id: data?.id,
					data: {
						onboardingStatus: unifiedUserDTOOnboardingStatusEnum.PHONE_VERIFIED,
					},
				})

				setIsVerifying(false)
				router.push('/(onboarding)/mobile-verified')
			}
		} catch (error) {
			if (error instanceof Error) {
				setIsVerifying(false)
				setErrorMessage(error?.message)
				setShowModal(true)
			}
			console.error('Verification code failed', error)
		}
	}

	return (
		<View style={{ backgroundColor: 'white', flex: 1 }}>
			<Layout.KeyboardAvoidingView
				testID='keyboard-dismiss'
				style={styles.container}
			>
				<Layout.ScrollView
					ref={scrollViewRef}
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
										name={canEnterCode ? 'passcode' : 'phone-01'}
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
								<Text
									size='lg'
									style={{ color: colors.neutral['700'], textAlign: 'center' }}
								>
									{t('enter_mobile_number')}
								</Text>
								<Text
									style={{ color: colors.neutral['700'], textAlign: 'center' }}
								>
									{t('enter_to_verify')}
								</Text>
							</View>
						</View>

						<View style={styles.formContainer}>
							<View style={styles.fieldsContainer}>
								<View style={styles.inputContainer}>
									<Text fontWeight='bold' style={styles.boldText}>
										{t('mobile_number')}
									</Text>
									<Field
										name='countryCode'
										children={(field) => {
											const selectedCountry = formattedCountries.find(
												(country) => country.countryCode === field.state.value,
											)
											const hasErrors =
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0

											return (
												<Form.GroupInput>
													<InputSelect.Root>
														<InputSelect.Select
															value={selectedCountry?.callingCode || null}
															onValueChange={field.handleChange}
														>
															<InputSelect.Trigger
																onTouchEnd={(e) => {
																	e.stopPropagation()
																	Keyboard.dismiss()
																}}
																testID='select-country-code'
															>
																{selectedCountry && (
																	<CountryFlag
																		isoCode={field.state.value as string}
																		size={20}
																	/>
																)}
																<InputSelect.SelectedValue
																	placeholder={t('select_country_code')}
																/>
																<Icon.Icon
																	name='chevron-down'
																	size={16}
																	strokeWidth={2}
																	stroke={colors.neutral['500']}
																/>
															</InputSelect.Trigger>
															{/** TODO: This select should not be rendered inside the InputRoot, keyboard dismiss issue */}
															<InputSelect.ItemList
																onTouchStart={(e) => {
																	Keyboard.dismiss()
																	e.stopPropagation()
																}}
																onTouchEnd={(e) => {
																	Keyboard.dismiss()
																	e.stopPropagation()
																}}
																testID='country-options-list'
															>
																{formattedCountries.map((country) => (
																	<InputSelect.Item
																		testID={`country-code-${country.countryCode}`}
																		key={`${country.callingCode}-${country.countryCode}`}
																		value={country.countryCode}
																	>
																		<View style={styles.selectItemContainer}>
																			<CountryFlag
																				isoCode={country.countryCode}
																				size={20}
																			/>
																			<InputSelect.ItemText>
																				{country.name} ({country.callingCode})
																			</InputSelect.ItemText>
																		</View>
																	</InputSelect.Item>
																))}
															</InputSelect.ItemList>
														</InputSelect.Select>
														<Field
															name='mobileNumber'
															children={(field) => (
																<InputSelect.TextControl
																	testID='input-select-text-control'
																	value={field.state.value as string}
																	onChangeText={field.handleChange}
																	keyboardType='number-pad'
																	onFocus={() => {
																		setTimeout(() => {
																			scrollViewRef.current?.scrollTo({
																				y: 200,
																				animated: true,
																			})
																		}, 100)
																	}}
																/>
															)}
														/>
													</InputSelect.Root>
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
													await verifyCode(pin)
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
																	<PinInput.Field index={index} key={index} />
																</View>
															)
														}
														return <PinInput.Field index={index} key={index} />
													})}
												</PinInput.Fields>
											</PinInput.Root>
										</View>
									</View>
								)}
							</View>
							{canEnterCode ? (
								<Button.Root
									size='lg'
									disabled={isVerifying}
									testID='verify-your-number-button'
									onPress={async () => {
										await verifyCode(verificationCode)
									}}
								>
									<Button.Text>{t('verify_your_number')}</Button.Text>
								</Button.Root>
							) : (
								<Button.Root
									testID='send-verification-code-button'
									size='lg'
									onPress={handleSubmit}
								>
									<Button.Text>{t('send_verification_code')}</Button.Text>
								</Button.Root>
							)}
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

export default ConfirmMobileNumber

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
