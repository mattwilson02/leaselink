import { Icon } from '@/components/Icon'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

const MobileVerified = () => {
	const router = useRouter()
	const { t } = useTranslation('confirm_mobile_number')
	return (
		<View testID='mobile-verified-container' style={styles.outerContainer}>
			<View
				style={{
					justifyContent: 'space-between',
					flex: 1,
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
							{t('mobile_verified')}
						</Heading>
						<Text
							size='lg'
							style={{ color: colors.neutral['700'], textAlign: 'center' }}
						>
							{t('mobile_confirmation_successful')}
						</Text>
					</View>
				</View>
				<Button.Root
					testID='continue-button'
					onPress={() => router.replace('/(onboarding)/set-password')}
				>
					<Button.Text>{t('continue')}</Button.Text>
				</Button.Root>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	outerContainer: {
		flex: 1,
		backgroundColor: 'white',
		paddingBottom: 32,
	},
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'flex-start',
	},
})

export default MobileVerified
