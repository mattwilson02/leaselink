import { Layout } from '@/components/Layout'
import { ProgressBar } from '@sf-digital-ui/react-native'
import { Stack, usePathname } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

const progressBarStages = {
	'/confirm-email': 0,
	'/email-verified': 0,
	'/confirm-mobile-number': 1,
	'/mobile-verified': 1,
	'/set-password': 2,
	'/enable-biometrics': 3,
}

const ProgressBarHeader = ({ stage }: { stage: number }) => {
	const { t } = useTranslation('onboarding_header')

	const onboardingStages = [
		{ id: 0, label: t('email') },
		{ id: 1, label: t('mobile') },
		{ id: 2, label: t('password') },
		{ id: 3, label: t('biometrics') },
	]

	return (
		<View
			style={{
				backgroundColor: 'white',
			}}
			testID='progress-bar'
		>
			<ProgressBar stages={onboardingStages} currentStage={stage} />
		</View>
	)
}

const OnboardingLayout = () => {
	const path = usePathname()

	const progressBarCurrentStage = Object.keys(progressBarStages).includes(path)
		? progressBarStages[path as keyof typeof progressBarStages]
		: undefined
	const progressBarShown = progressBarCurrentStage !== undefined

	return (
		<>
			<Layout.SafeAreaView>
				{progressBarShown && (
					<ProgressBarHeader stage={progressBarCurrentStage} />
				)}
				<Stack
					screenOptions={{
						animation: 'slide_from_right',
						headerShown: false,
					}}
				/>
			</Layout.SafeAreaView>
		</>
	)
}

export default OnboardingLayout
