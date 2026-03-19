import { Layout } from '@/components/Layout'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Heading, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import CloudWithHourGlass from '@/assets/icons/cloud-with-hourglass.svg'
import BackgroundWithSquares from '@/assets/icons/square-background.svg'
import LeftArrow from '@/assets/icons/arrow-left.svg'
import { useTranslation } from 'react-i18next'

const NotFound = () => {
	const router = useRouter()
	const { t } = useTranslation('not_found')

	const handleGoHome = () => {
		router.replace('/')
	}

	const handleGoBack = () => {
		router.back()
	}

	return (
		<Layout.SafeAreaView style={styles.mainContainer}>
			<View style={styles.bodyContainer}>
				<View style={styles.svgContainer}>
					<BackgroundWithSquares stroke={colors.neutral['60']} />
					<CloudWithHourGlass style={styles.cloud} />
				</View>
				<View style={styles.textContainer}>
					<Text testID='error-text' style={styles.subTitle}>
						{t('error')}
					</Text>
					<Heading testID='heading-text' size='h3' style={styles.title}>
						{t('heading')}
					</Heading>
					<Text testID='message-text' style={styles.description}>
						{t('message')}
					</Text>
				</View>
			</View>
			<View style={styles.buttonContainer}>
				<Button.Root
					testID='home-button'
					variant='primary'
					size='lg'
					onPress={handleGoHome}
				>
					<Button.Text>{t('home_button')}</Button.Text>
				</Button.Root>

				<Button.Root
					testID='back-button'
					style={styles.backButtonContainer}
					variant='secondary'
					size='lg'
					onPress={handleGoBack}
				>
					<View style={styles.backButtonAndArrowContainer}>
						<LeftArrow stroke={colors.neutral['500']} />
						<Text style={styles.backButtonText}>{t('back_button')}</Text>
					</View>
				</Button.Root>
			</View>
		</Layout.SafeAreaView>
	)
}

const styles = StyleSheet.create({
	mainContainer: { paddingBottom: 80 },
	bodyContainer: { flex: 1 },
	svgContainer: { justifyContent: 'center', alignItems: 'center' },
	cloud: { position: 'absolute' },
	textContainer: { marginTop: -120, gap: 12 },
	subTitle: { color: colors['primary-green']['500'], fontWeight: 'bold' },
	title: { color: colors.neutral['600'], fontWeight: 'bold', marginBottom: 4 },
	description: { color: colors.neutral['600'] },
	buttonContainer: { gap: 12 },
	backButtonContainer: { borderColor: colors.neutral['500'] },
	backButtonText: {
		marginLeft: 6,
		fontWeight: 'bold',
		color: colors.neutral['500'],
	},
	backButtonAndArrowContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
	},
})

export default NotFound
