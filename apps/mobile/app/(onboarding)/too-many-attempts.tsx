import { View, StyleSheet } from 'react-native'
import { Button, Heading, Text } from '@sf-digital-ui/react-native'
import { Icon } from '@/components/Icon'
import { colors } from '@sf-digital-ui/tokens'
import { useTranslation } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FAILED_ATTEMPTS_KEY } from '@/hooks/useFailedAttempts'
import { useRouter } from 'expo-router'
import { TriangleAlert } from 'lucide-react-native'

const TooManyAttempts = () => {
	const router = useRouter()
	const { t } = useTranslation('too_many_attempts')

	const resetFailedAttempts = async () => {
		try {
			await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY)
			router.push('/')
		} catch (error) {
			console.error('Error resetting failed attempts:', error)
		}
	}
	return (
		<View style={styles.container}>
			<Icon.Root>
				<Icon.Background
					name='background'
					stroke={colors.warning['100']}
					strokeWidth={-1}
					fill='transparent'
					width={340}
					height={190}
				/>

				<Icon.IconContainer color={colors.warning['100']} hasBackground>
					<TriangleAlert size={24} color={colors.warning['500']} />
				</Icon.IconContainer>
			</Icon.Root>
			<View style={styles.contentContainer}>
				<View style={styles.textContainer}>
					<Heading testID='error-heading' size='h3' style={styles.heading}>
						{t('header')}
					</Heading>
					<Text testID='error-message' style={styles.messageText}>
						{t('error_message')}
					</Text>
					<Text testID='security-lock' style={styles.messageText}>
						{t('security_lock')}
					</Text>
					<Text testID='contact-manager' style={styles.messageText}>
						{t('contact_manager')}
					</Text>
				</View>

				<Button.Root
					testID='reset-button'
					variant='link'
					color='warning'
					onPress={() => resetFailedAttempts()}
				>
					<Button.Text>Reset Attempts (DEV ONLY)</Button.Text>
				</Button.Root>
				<Button.Root
					testID='back-button'
					color='warning'
					onPress={() => {
						resetFailedAttempts()
						router.replace('/sign-in')
					}}
				>
					<Button.Text>{t('back')}</Button.Text>
				</Button.Root>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'white',
		flex: 1,
		paddingTop: 32,
	},
	contentContainer: {
		alignItems: 'center',
		paddingHorizontal: 24,
		flex: 1,
		justifyContent: 'space-between',
	},
	textContainer: {
		gap: 12,
	},
	heading: {
		color: colors.neutral['700'],
		fontWeight: 'bold',
		textAlign: 'center',
	},
	messageText: {
		color: colors.neutral['700'],
		textAlign: 'center',
	},
})

export default TooManyAttempts
