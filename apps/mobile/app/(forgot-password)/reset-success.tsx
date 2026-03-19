import { Icon } from '@/components/Icon'
import { Layout } from '@/components/Layout'
import { Button, Heading, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useRouter } from 'expo-router'
import { CheckCircle } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

const ResetSuccess = () => {
	const router = useRouter()
	const { t } = useTranslation('reset_success')
	return (
		<Layout.SafeAreaView testID='layout-safe-area-view'>
			<View style={styles.container}>
				<Icon.Root>
					<Icon.Background
						name='background'
						stroke={colors.success['100']}
						strokeWidth={1}
						fill='transparent'
						width={340}
						height={190}
					/>

					<Icon.IconContainer hasBackground>
						<CheckCircle size={28} color={colors.success['500']} />
					</Icon.IconContainer>
				</Icon.Root>
				<View style={{ alignItems: 'center', gap: 12 }}>
					<Heading
						testID='reset-success-heading'
						size='h3'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						{t('password_reset_successful')}
					</Heading>
					<Text
						size='lg'
						style={{ color: colors.neutral['700'], textAlign: 'center' }}
					>
						{t('password_updated_description')}
					</Text>
				</View>
			</View>
			<Button.Root
				testID='login-button'
				size='lg'
				variant='secondary'
				onPress={() => router.replace('/sign-in')}
			>
				<Button.Text>{t('login')}</Button.Text>
			</Button.Root>
		</Layout.SafeAreaView>
	)
}

export default ResetSuccess

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'flex-start',
	},
})
