import { Icon } from '@/components/Icon'
import { Layout } from '@/components/Layout'
import { Button, Heading, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

const SwitchDeviceConfirm = () => {
	const { password } = useLocalSearchParams()
	const router = useRouter()
	const { t: generalT } = useTranslation('general')
	const { t } = useTranslation('switch_device')
	return (
		<Layout.SafeAreaView
			testID='switch-device-confirm-container'
			style={{ paddingBottom: 32 }}
		>
			<View style={styles.container}>
				<Icon.Root>
					<Icon.Background
						name='background'
						stroke={colors.warning['100']}
						strokeWidth={1}
						fill='transparent'
						width={340}
						height={190}
					/>

					<Icon.IconContainer
						hasBackground
						style={{ borderColor: colors.warning['100'] }}
					>
						<Icon.Icon
							name='alert-triangle'
							size={28}
							stroke={colors.warning['500']}
							strokeWidth={2}
						/>
					</Icon.IconContainer>
				</Icon.Root>
				<View style={{ alignItems: 'center', gap: 12 }}>
					<Heading
						size='h3'
						fontWeight='bold'
						style={{ color: colors.neutral['700'], textAlign: 'center' }}
					>
						{t('device_switch_confirmation')}
					</Heading>
					<Text style={{ color: colors.neutral['700'], textAlign: 'center' }}>
						{t('switch_device_description')}
					</Text>
				</View>
			</View>
			<View style={{ gap: 10 }}>
				<Button.Root
					testID='continue-button'
					onPress={() =>
						router.replace({
							pathname: '/(new-device)/enable-biometrics',
							params: { password },
						})
					}
				>
					<Button.Text>{generalT('continue')}</Button.Text>
				</Button.Root>
				<Button.Root
					variant='secondary'
					testID='cancel-button'
					onPress={() => router.replace('/sign-in')}
				>
					<Button.Text>{generalT('cancel')}</Button.Text>
				</Button.Root>
			</View>
		</Layout.SafeAreaView>
	)
}

export default SwitchDeviceConfirm

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'flex-start',
	},
})
