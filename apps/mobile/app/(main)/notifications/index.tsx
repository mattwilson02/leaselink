import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { TabsCompound as Tabs } from '@/design-system/components/TabsCompound'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { CheckCircleIcon, X } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import NotificationsList from '@/components/Notifications/NotificationsList'
import { queryClient } from '@/app/_layout'
import {
	useMarkAllNotificationsAsReadControllerMarkAllAsRead,
	useUpdateNotificationControllerUpdate,
} from '@/gen/index'
import { Snackbar } from '@/components/Snackbar'
import { useAtom } from 'jotai'
import { notificationSnackbarAtom } from '@/atoms/notification-snackbar-atom'

const Notifications = () => {
	const [atom, setAtom] = useAtom(notificationSnackbarAtom)
	const { t } = useTranslation('notifications')
	const router = useRouter()
	const [tab, setTab] = useState<'ACTION' | 'INFO' | 'ARCHIVED' | undefined>(
		undefined,
	)

	const { mutateAsync: markAllAsRead, isPending: isMarkingAll } =
		useMarkAllNotificationsAsReadControllerMarkAllAsRead({
			mutation: {
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: ['notifications'] })
				},
			},
		})

	const { mutateAsync: updateNotification } =
		useUpdateNotificationControllerUpdate({
			mutation: {
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: ['notifications'],
					})
				},
			},
		})

	const handleUndo = async () => {
		if (atom.notificationId && atom.wasArchived !== undefined) {
			setAtom({ ...atom, isVisible: false })

			await updateNotification({
				id: atom.notificationId,
				data: {
					isArchived: atom.wasArchived,
				},
			})
		}
	}

	return (
		<>
			<View
				testID='notifications-safe-area'
				style={{ backgroundColor: 'white', flex: 1, gap: 32 }}
			>
				<View style={styles.header}>
					<Heading size='h6' testID='notifications-heading'>
						{tab === 'ACTION'
							? t('action_required')
							: tab === 'INFO'
								? t('notifications')
								: tab === 'ARCHIVED'
									? t('archived')
									: t('all')}
					</Heading>
					<Pressable
						style={{
							padding: 16,
							alignItems: 'center',
						}}
						testID='back-button'
						onPress={() => router.back()}
					>
						<X size={20} color={colors.neutral['300']} />
					</Pressable>
				</View>

				<Tabs.Root
					variant='panel'
					testID='tabs-root'
					color='neutral'
					defaultValue='ALL'
					style={styles.tabs}
					onValueChange={(value) => {
						setTab(
							value === 'ALL'
								? undefined
								: (value as 'ACTION' | 'INFO' | 'ARCHIVED'),
						)
					}}
				>
					<Tabs.List>
						<Tabs.Trigger testID='tab-trigger-ALL' value='ALL'>
							<Tabs.TriggerText>{t('all')}</Tabs.TriggerText>
						</Tabs.Trigger>
						<Tabs.Trigger value='INFO' testID='tab-trigger-INFO'>
							<Tabs.TriggerText>{t('notifications')}</Tabs.TriggerText>
						</Tabs.Trigger>
						<Tabs.Trigger value='ACTION' testID='tab-trigger-ACTION'>
							<Tabs.TriggerText>{t('action')}</Tabs.TriggerText>
						</Tabs.Trigger>
						<Tabs.Trigger value='ARCHIVED' testID='tab-trigger-ARCHIVED'>
							<Tabs.TriggerText>{t('archived')}</Tabs.TriggerText>
						</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<View style={{ gap: 16, flex: 1 }}>
					<Button.Root
						size='sm'
						variant='link'
						style={{ alignSelf: 'flex-end' }}
						onPress={() => markAllAsRead()}
						disabled={isMarkingAll}
						testID='mark-all-as-read-button'
					>
						<Button.Text
							style={{ color: colors.neutral['700'], fontWeight: 'bold' }}
						>
							{t('mark_all_as_read')}
						</Button.Text>
					</Button.Root>

					<NotificationsList tab={tab} />
				</View>
			</View>
			<Snackbar
				visible={atom.isVisible}
				onHide={() => setAtom({ ...atom, isVisible: false, type: null })}
			>
				<View style={{ gap: 16, flexDirection: 'row', alignItems: 'center' }}>
					{(atom.type === 'archived' || atom.type === 'unarchived') && (
						<CheckCircleIcon size={20} color='white' />
					)}
					<Text style={{ color: 'white', flex: 1 }}>{atom.message}</Text>
					{(atom.type === 'archived' || atom.type === 'unarchived') && (
						<Button.Root
							size='sm'
							variant='link'
							testID='undo_button'
							onPress={handleUndo}
							style={{ paddingHorizontal: 8, paddingVertical: 4 }}
						>
							<Button.Text style={{ color: 'white', fontWeight: 'bold' }}>
								{t('undo')}
							</Button.Text>
						</Button.Root>
					)}
				</View>
			</Snackbar>
		</>
	)
}

export default Notifications

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		justifyContent: 'space-between',
	},
	tabs: {
		flexWrap: 'wrap',
		minHeight: 40,
		maxHeight: 40,
	},
	icon: {
		width: 48,
		height: 48,
		borderRadius: 48,
		justifyContent: 'center',
		alignItems: 'center',
	},
	notificationContainer: {
		padding: 10,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
})
