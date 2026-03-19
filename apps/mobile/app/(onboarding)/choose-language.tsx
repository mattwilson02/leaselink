import { Button, Select, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useTranslation } from 'react-i18next'
import SfLogoVertical from '@/assets/images/sf-logo-vertical.svg'
import { StyleSheet, View } from 'react-native'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { changeLanguage, languageOptions, Languages } from '../../src/i18n'
import CountryFlag from 'react-native-country-flag'
import { useRouter } from 'expo-router'
import { Icon } from '@/components/Icon'
import { Form } from '@/components/Form'
import { LanguageOptionsList } from '@/components/LanguageOptionsList'
import { extractErrorMessages } from '@/utils/form-errors'

const chooseLanguageSchema = z.object({
	language: z.enum([Languages.GB, Languages.ES, Languages.FR, Languages.DE], {
		message: 'language_required',
	}),
})

const ChooseLanguage = () => {
	const router = useRouter()
	const { push } = router

	const { t } = useTranslation('choose_language')
	const { t: errorT } = useTranslation('error')

	const { handleSubmit, Field } = useForm({
		validators: {
			onChange: chooseLanguageSchema,
		},
		onSubmit: () => {
			push('/(onboarding)/confirm-email')
		},
	})

	return (
		<View style={styles.container}>
			<View style={styles.logoContainer}>
				<SfLogoVertical width={190} height={90} />
			</View>
			<View style={styles.formContainer}>
				<Field
					name='language'
					children={(field) => {
						const activeLanguage = languageOptions.find(
							(option) => option.value === field.state.value,
						)
						const hasErrors =
							field.state.meta.isTouched && field.state.meta.errors.length > 0
						return (
							<Form.GroupInput>
								<Form.Label testID='choose-language-text'>
									{t('choose_language')}
								</Form.Label>
								<Select.Root
									onValueChange={(value) => {
										field.handleChange(value as Languages)
										changeLanguage(value as Languages)
									}}
									value={field.state.value as string | null}
								>
									<Select.Trigger
										testID='select-language'
										style={{
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<View style={{ flexDirection: 'row', gap: 8 }}>
											{!!activeLanguage && (
												<CountryFlag
													isoCode={field.state.value as string}
													size={20}
												/>
											)}
											<Text size='sm' style={{ color: colors.neutral['500'] }}>
												{activeLanguage
													? t(activeLanguage?.label)
													: t('select_language')}
											</Text>
										</View>
										<Icon.Icon
											name='chevron-down'
											size={20}
											strokeWidth={2}
											stroke={colors.neutral['500']}
										/>
									</Select.Trigger>

									<Select.Content>
										<Select.Viewport testID='language-options-list'>
											<LanguageOptionsList languageOptions={languageOptions} />
										</Select.Viewport>
									</Select.Content>
								</Select.Root>
								<Form.ErrorText hasError={hasErrors}>
									{errorT(extractErrorMessages(field.state.meta.errors))}
								</Form.ErrorText>
							</Form.GroupInput>
						)
					}}
				/>
				<View style={{ gap: 8 }}>
					<Button.Root size='lg' testID='next-button' onPress={handleSubmit}>
						<Button.Text>{t('next')}</Button.Text>
					</Button.Root>
					<Button.Root
						testID='back-button'
						variant='tertiary'
						onPress={() => router.replace('/sign-in')}
					>
						<Button.Text>{t('back')}</Button.Text>
					</Button.Root>
				</View>
			</View>
		</View>
	)
}

export default ChooseLanguage

const styles = StyleSheet.create({
	container: {
		gap: 76,
		alignItems: 'center',
		height: '100%',
		justifyContent: 'center',
		backgroundColor: 'white',
		paddingBottom: 32,
	},
	formContainer: {
		flex: 1,
		justifyContent: 'space-between',
		width: '100%',
	},
	logoContainer: {
		flex: 1,
		justifyContent: 'flex-end',
	},
})
