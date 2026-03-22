import { ErrorModal } from '@/components/ErrorModal'
import { Icon } from '@/components/Icon'
import { Layout } from '@/components/Layout'
import { RESET_PASSWORD_DEEP_LINK } from '@/constants/deep-linking'
import { authClient } from '@/services/auth'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

const ForgotPasswordCheckEmail = () => {
	const [showModal, setShowModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isResendDisabled, setIsResendDisabled] = useState(false)
	const [resendCountdown, setResendCountdown] = useState(0)

	const { email } = useLocalSearchParams<{ email: string }>()
	const router = useRouter()
	const { t } = useTranslation('check_email')

	const resendButtonText = isResendDisabled
		? `${t('resend')} (${resendCountdown}s)`
		: t('resend')

	const resendEmail = async () => {
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
		<Layout.SafeAreaView
			testID='check-email-screen'
			style={{ paddingBottom: 32 }}
		>
			<View style={styles.container}>
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
							name='send-01'
							size={28}
							stroke={colors.neutral['500']}
							strokeWidth={2}
						/>
					</Icon.IconContainer>
				</Icon.Root>
				<View style={{ gap: 12, alignItems: 'center' }}>
					<View style={{ alignItems: 'center', gap: 12 }}>
						<Heading
							size='h3'
							fontWeight='bold'
							style={{ color: colors.neutral['700'] }}
						>
							{t('check_your_email')}
						</Heading>
						<Text
							size='lg'
							style={{ color: colors.neutral['700'], textAlign: 'center' }}
						>
							{t('we_will_send_link_to')} {email}. {t('click_to_reset')}
						</Text>
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
							onPress={resendEmail}
							testID='resend-email-button'
						>
							{resendButtonText}
						</Text>
					</View>
				</View>
			</View>
			<Button.Root
				variant='secondary'
				testID='back-button'
				onPress={() => router.back()}
			>
				<Button.Text>{t('back')}</Button.Text>
			</Button.Root>
			<ErrorModal
				showModal={showModal}
				setShowModal={setShowModal}
				errorMessage={errorMessage}
			/>
		</Layout.SafeAreaView>
	)
}

export default ForgotPasswordCheckEmail

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'flex-start',
	},
})
