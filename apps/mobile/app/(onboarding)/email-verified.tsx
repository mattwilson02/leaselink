import { Icon } from '@/components/Icon'
import { Button, Heading, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

const EmailVerified = () => {
	const router = useRouter()
	const { t } = useTranslation('confirm_email')
	return (
		<View
			testID='email-verified-container'
			style={{
				flex: 1,
				justifyContent: 'space-between',
				backgroundColor: 'white',
				paddingBottom: 32,
			}}
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
							name='check-verified-01'
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
						{t('email_verified')}
					</Heading>
					<Text
						size='lg'
						style={{ color: colors.neutral['700'], textAlign: 'center' }}
					>
						{t('email_confirmation_successful')}
					</Text>
					<Text style={{ color: colors.neutral['700'], textAlign: 'center' }}>
						{t('confirm_mobile_number')}
					</Text>
				</View>
			</View>
			<Button.Root
				testID='continue-button'
				onPress={() => router.replace('/(onboarding)/confirm-mobile-number')}
			>
				<Button.Text>{t('continue')}</Button.Text>
			</Button.Root>
		</View>
	)
}

export default EmailVerified

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'flex-start',
	},
})
