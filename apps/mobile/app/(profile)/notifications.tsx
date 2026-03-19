import {
	useAuthControllerHandle,
	useSetNotificationPreferencesControllerHandle,
} from '@/gen/index'
import { Heading, Switch, Text, Tooltip } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useRouter } from 'expo-router'
import { ChevronLeft, HelpCircleIcon } from 'lucide-react-native'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { queryClient } from '../_layout'

type NotificationSwitchProps = {
	label: string
	description?: string
	defaultValue: boolean
	onChange: (value: boolean) => Promise<void>
	testID: string
	disabled?: boolean
	tooltip?: string
}

const NotificationSwitch = ({
	label,
	description,
	defaultValue,
	onChange,
	testID,
	disabled,
	tooltip,
}: NotificationSwitchProps) => (
	<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
		<Switch
			defaultValue={defaultValue}
			value={disabled ? true : undefined}
			onValueChange={onChange}
			size='sm'
			testID={testID}
			disabled={disabled}
		/>
		{description ? (
			<View style={{ gap: 4 }}>
				<Text
					size='sm'
					fontWeight='bold'
					style={{ color: colors.neutral['500'] }}
				>
					{label}
				</Text>
				<Text size='sm' style={{ color: colors.neutral['200'] }}>
					{description}
				</Text>
			</View>
		) : (
			<Text
				size='sm'
				fontWeight='bold'
				style={{ color: colors.neutral['500'] }}
			>
				{label}
			</Text>
		)}
		{tooltip && (
			<Tooltip.Root>
				<Tooltip.Trigger>
					<HelpCircleIcon size={16} color={colors.neutral['500']} />
				</Tooltip.Trigger>
				<Tooltip.Content side='top' theme='light'>
					<Tooltip.Text>{tooltip}</Tooltip.Text>
				</Tooltip.Content>
			</Tooltip.Root>
		)}
	</View>
)

const Notifications = () => {
	const { t } = useTranslation('notification_settings')
	const router = useRouter()

	const { mutateAsync: setPreferences } =
		useSetNotificationPreferencesControllerHandle({
			mutation: {
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: ['user'],
					})
				},
			},
		})

	const { data: user } = useAuthControllerHandle(
		{},
		{
			query: {
				queryKey: ['user'],
			},
		},
	)

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	if (!user) {
		return null
	}

	return (
		<View style={{ flex: 1, backgroundColor: 'white', gap: 32 }}>
			<Pressable
				style={styles.backButton}
				onPress={handleBack}
				testID='back-button'
			>
				<ChevronLeft size={24} color={colors.neutral['700']} />
			</Pressable>

			<ScrollView
				style={styles.container}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.contentContainer}
			>
				<View style={{ gap: 4 }}>
					<Heading
						size='h3'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						{t('title')}
					</Heading>
					<Text size='sm' style={{ color: colors.neutral['500'] }}>
						{t('description')}
					</Text>
				</View>
				<View style={{ height: 1, backgroundColor: colors.neutral['30'] }} />
				<View style={{ gap: 20 }}>
					<View style={{ gap: 4 }}>
						<Text
							size='sm'
							fontWeight='bold'
							style={{ color: colors.neutral['600'] }}
						>
							{t('notification_channels')}
						</Text>
						<Text size='sm' style={{ color: colors.neutral['500'] }}>
							{t('notification_channels_description')}
						</Text>
					</View>
					<View style={{ gap: 16 }}>
						<NotificationSwitch
							label={t('push')}
							defaultValue={user?.receivesPushNotifications ?? false}
							onChange={async (value) => {
								await setPreferences({
									data: { receivesPushNotifications: value },
								})
							}}
							testID='switch-push'
						/>
						<NotificationSwitch
							label={t('email')}
							description={t('email_description')}
							defaultValue={user?.receivesEmailNotifications ?? false}
							onChange={async (value) => {
								await setPreferences({
									data: { receivesEmailNotifications: value },
								})
							}}
							testID='switch-email'
						/>
					</View>
					<View style={{ height: 1, backgroundColor: colors.neutral['30'] }} />
					<View style={{ gap: 20 }}>
						<View style={{ gap: 4 }}>
							<Text
								size='sm'
								fontWeight='bold'
								style={{ color: colors.neutral['600'] }}
							>
								{t('notification_categories')}
							</Text>
							<Text size='sm' style={{ color: colors.neutral['500'] }}>
								{t('notification_categories_description')}
							</Text>
						</View>
						<View style={{ gap: 16 }}>
							<NotificationSwitch
								label={t('portfolio_updates')}
								defaultValue={user?.receivesNotificationsForPortfolio ?? false}
								onChange={async (value) => {
									await setPreferences({
										data: { receivesNotificationsForPortfolio: value },
									})
								}}
								testID='switch-portfolio'
							/>
							<NotificationSwitch
								label={t('documents_signatures')}
								defaultValue={user?.receivesNotificationsForDocuments ?? false}
								onChange={async (value) => {
									await setPreferences({
										data: { receivesNotificationsForDocuments: value },
									})
								}}
								testID='switch-documents'
							/>
							<NotificationSwitch
								label={t('account_security_alerts')}
								defaultValue={true}
								onChange={async () => {}}
								testID='switch-security'
								disabled
								tooltip={t('account_security_alerts_tooltip')}
							/>
						</View>
					</View>
					<View style={{ height: 1, backgroundColor: colors.neutral['30'] }} />
				</View>
			</ScrollView>
		</View>
	)
}

export default Notifications

const styles = StyleSheet.create({
	backButton: {
		alignSelf: 'flex-start',
		padding: 8,
	},
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	contentContainer: {
		gap: 20,
		paddingBottom: 12,
		paddingHorizontal: 16,
	},
})
