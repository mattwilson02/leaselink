import { memo, useRef } from 'react'
import { Dimensions, Pressable, StyleSheet, View } from 'react-native'
import Swipeable, {
	type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
	interpolate,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated'
import {
	ArrowLeftRight,
	Bell,
	Calendar,
	CheckCircle,
	Clock,
	CreditCard,
	FileText,
	Info,
	RefreshCw,
	TriangleAlert,
	Upload,
	Wrench,
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useSetAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { Text } from '@/design-system/components/Typography'
import { CompoundButton } from '@/design-system/components/CompoundButton'
import { colors } from '@/design-system/theme'
import { notificationSnackbarAtom } from '@/atoms/notification-snackbar-atom'
import { queryClient } from '@/app/_layout'
import { Icon } from '@/components/Icon'
import {
	useUpdateNotificationControllerUpdate,
	type GetNotificationsDTO,
} from '@/gen/index'
import { formatDate } from '@/utils/format-date'

type Props = {
	notification: GetNotificationsDTO
	isArchived?: boolean
}

const getNotificationIconInfo = (notification: GetNotificationsDTO) => {
	switch (notification.actionType) {
		case 'MAINTENANCE_UPDATE':
			return {
				backgroundColor: colors.warning[50],
				icon: <Wrench size={24} color={colors.warning[600]} />,
			}

		case 'PAYMENT_RECEIVED':
			return {
				backgroundColor: colors.success[50],
				icon: <CheckCircle size={24} color={colors.success[600]} />,
			}

		case 'PAYMENT_OVERDUE':
			return {
				backgroundColor: colors.error[50],
				icon: <TriangleAlert size={24} color={colors.error[600]} />,
			}

		case 'RENT_REMINDER':
			return {
				backgroundColor: colors.info[50],
				icon: <Clock size={24} color={colors.info[600]} />,
			}

		case 'UPLOAD_DOCUMENT':
			return {
				backgroundColor: colors.neutral['20'],
				icon: <Upload size={24} color={colors.neutral['500']} />,
			}

		case 'SIGN_LEASE':
			return {
				backgroundColor: colors.info[50],
				icon: <FileText size={24} color={colors.info[600]} />,
			}

		case 'LEASE_EXPIRY':
			return {
				backgroundColor: colors.warning[50],
				icon: <Calendar size={24} color={colors.warning[600]} />,
			}

		case 'LEASE_RENEWAL':
			return {
				backgroundColor: colors.info[50],
				icon: <RefreshCw size={24} color={colors.info[600]} />,
			}

		case 'SIGN_DOCUMENT':
			return {
				backgroundColor: colors.warning[50],
				icon: (
					<Icon.Icon
						name='edit-04'
						stroke={colors.warning[600]}
						strokeWidth={2}
						size={24}
					/>
				),
			}

		case 'BASIC_COMPLETE':
			return {
				backgroundColor: colors.warning[50],
				icon: (
					<Info testID='icon-info' size={24} color={colors.warning[600]} />
				),
			}

		case 'INSPECTION_SCHEDULED':
			return {
				backgroundColor: colors.info[50],
				icon: <Calendar size={24} color={colors.info[600]} />,
			}

		default:
			break
	}

	// Fallback: use linked entity context for INFO notifications without a specific actionType
	if (notification.linkedPaymentId) {
		return {
			backgroundColor: colors.success[50],
			icon: (
				<CreditCard size={24} color={colors.success[600]} />
			),
		}
	}
	if (notification.linkedTransactionId) {
		return {
			backgroundColor: colors.success[50],
			icon: (
				<ArrowLeftRight
					testID='arrow-left-right-icon'
					size={24}
					color={colors.success[600]}
				/>
			),
		}
	}
	if (notification.linkedDocumentId) {
		return {
			backgroundColor: colors.success[50],
			icon: (
				<Icon.Icon
					name='folder'
					size={24}
					strokeWidth={2}
					stroke={colors.success[600]}
				/>
			),
		}
	}

	return {
		backgroundColor: colors.neutral['20'],
		icon: <Bell testID='icon-bell' size={24} color={colors.neutral['300']} />,
	}
}

const NotificationItem = ({ notification }: Props) => {
	const setAtom = useSetAtom(notificationSnackbarAtom)
	const isArchived = notification.archivedAt !== null
	const swipeProgress = useSharedValue(0)
	const swipeableRef = useRef<SwipeableMethods>(null)
	const { t } = useTranslation('notifications')
	const { t: dateT } = useTranslation('format_date')
	const router = useRouter()

	const screenWidth = Dimensions.get('window').width

	const { mutateAsync: updateNotification } =
		useUpdateNotificationControllerUpdate({
			mutation: {
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: ['notifications'],
					})
				},
				onError: (error) => {
					if (error.status === 422) {
						setAtom({
							isVisible: true,
							message: t('required_actions_must_be_solved'),
							type: 'error',
						})
					}
				},
			},
		})

	const onRead = async () => {
		if (!notification.isRead) {
			await updateNotification({
				id: notification.id,
				data: {
					isRead: true,
				},
			})
		}

		if (notification.linkedPaymentId) {
			router.push(`/payments/${notification.linkedPaymentId}`)
		} else if (notification.linkedTransactionId) {
			router.push(`/maintenance/${notification.linkedTransactionId}`)
		} else if (notification.linkedDocumentId) {
			if (notification.actionType === 'UPLOAD_DOCUMENT' || notification.actionType === 'SIGN_DOCUMENT') {
				router.push(`/upload-document?requestId=${notification.linkedDocumentId}`)
			} else {
				router.push(`/documents/${notification.linkedDocumentId}`)
			}
		} else if (
			notification.actionType === 'LEASE_EXPIRY' ||
			notification.actionType === 'SIGN_LEASE' ||
			notification.actionType === 'LEASE_RENEWAL'
		) {
			router.push('/home/lease-detail')
		}
	}
	const onArchive = async () => {
		const wasArchived = isArchived

		try {
			await updateNotification({
				id: notification.id,
				data: {
					isArchived: !isArchived,
				},
			})

			setAtom({
				isVisible: true,
				message: isArchived
					? t('notification_unarchived')
					: t('notification_archived'),
				type: isArchived ? 'unarchived' : 'archived',
				notificationId: notification.id,
				wasArchived: wasArchived,
			})
		} catch {
			swipeableRef.current?.close()
		}
	}

	const renderRightActions = (progress: SharedValue<number>) => {
		const canArchive = notification.notificationType !== 'ACTION'

		const iconAnimatedStyle = useAnimatedStyle(() => {
			swipeProgress.value = progress.value

			if (!canArchive) {
				return {}
			}

			const translateX = interpolate(
				progress.value,
				[0, 1],
				[0, -(screenWidth / 2 - 37 - 24)],
				'clamp',
			)

			return {
				transform: [{ translateX }],
			}
		})

		const maxWidth =
			notification.notificationType === 'ACTION'
				? screenWidth * 0.25
				: undefined

		const backgroundColor =
			notification.notificationType === 'ACTION'
				? colors.neutral['30']
				: isArchived
					? colors.info[500]
					: colors.success[500]

		return (
			<View
				style={{
					justifyContent: 'center',
					alignItems: 'flex-end',
					backgroundColor,
					borderTopLeftRadius: !canArchive ? 0 : 8,
					borderBottomLeftRadius: !canArchive ? 0 : 8,
					borderTopRightRadius: 8,
					borderBottomRightRadius: 8,
					flex: 1,
					maxWidth,
				}}
			>
				<Animated.View style={[{ marginRight: 37 }, iconAnimatedStyle]}>
					<Icon.Icon
						name={isArchived ? 'inbox-01' : 'archive'}
						stroke='white'
						strokeWidth={2}
						size={24}
						fill={backgroundColor}
					/>
				</Animated.View>
			</View>
		)
	}

	const notificationAnimatedStyle = useAnimatedStyle(() => {
		const canArchive = notification.notificationType !== 'ACTION'

		const borderTopRightRadius = interpolate(
			swipeProgress.value,
			[0, 0.1],
			[8, 0],
			'clamp',
		)

		const borderBottomRightRadius = interpolate(
			swipeProgress.value,
			[0, 0.1],
			[8, 0],
			'clamp',
		)

		const borderTopLeftRadius = !canArchive
			? interpolate(swipeProgress.value, [0, 0.9, 1], [8, 8, 0], 'clamp')
			: 8

		const borderBottomLeftRadius = !canArchive
			? interpolate(swipeProgress.value, [0, 0.9, 1], [8, 8, 0], 'clamp')
			: 8

		return {
			borderTopRightRadius,
			borderBottomRightRadius,
			borderTopLeftRadius,
			borderBottomLeftRadius,
		}
	})

	const notificationContent = (
		<Animated.View
			testID='notification-animated-container'
			style={[
				styles.notificationContainer,
				{
					backgroundColor: notification.isRead ? colors.card : colors.neutral['10'],
				},
				notificationAnimatedStyle,
			]}
		>
			<Pressable
				testID={`notification-${notification.id}`}
				accessibilityLabel={(notification as unknown as { title: string }).title ?? notification.text}
				onPress={onRead}
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					flex: 1,
				}}
			>
				<View
					style={{
						flexDirection: 'row',
						gap: 16,
						alignItems: 'center',
						flex: 1,
					}}
				>
					<View
						testID='notification-icon-container'
						style={[
							styles.icon,
							{
								backgroundColor:
									getNotificationIconInfo(notification)?.backgroundColor,
							},
						]}
					>
						{getNotificationIconInfo(notification)?.icon}
					</View>
					<View
						style={{
							gap: 6,
						}}
					>
						<Text
							size='lg'
							fontWeight='bold'
							testID={`notification-text-${notification.id}`}
							style={{
								color: colors.neutral['700'],
								flexWrap: 'wrap',
							}}
						>
							{(notification as unknown as { title: string }).title ?? notification.text}
						</Text>
						{(notification as unknown as { body?: string }).body ? (
							<Text
								size='sm'
								style={{
									color: colors.mutedForeground,
								}}
							>
								{(notification as unknown as { body: string }).body}
							</Text>
						) : null}
						<Text
							size='sm'
							style={{
								color: colors.neutral['400'],
							}}
						>
							{formatDate(notification.createdAt).type === 'alias'
								? dateT(formatDate(notification.createdAt).value)
								: formatDate(notification.createdAt).value}
						</Text>
					</View>
				</View>
				<View
					style={{
						justifyContent: 'space-between',
						alignItems: 'flex-end',
						flex: 1,
					}}
				>
					<View
						testID='unread-indicator'
						style={{
							width: 10,
							height: 10,
							borderRadius: 10,
							backgroundColor: !notification.isRead
								? colors.success[600]
								: 'transparent',
						}}
					/>

					{(notification.linkedPaymentId ||
						notification.linkedTransactionId ||
						notification.linkedDocumentId ||
						notification.actionType === 'LEASE_EXPIRY' ||
						notification.actionType === 'SIGN_LEASE' ||
						notification.actionType === 'LEASE_RENEWAL') && (
						<CompoundButton.Root
							testID='linked-item-button'
							size='sm'
							variant='link'
							color='neutral'
						>
							<CompoundButton.Text>{t('go_to_page')}</CompoundButton.Text>
						</CompoundButton.Root>
					)}
				</View>
			</Pressable>
		</Animated.View>
	)

	return (
		<Swipeable
			ref={swipeableRef}
			testID={`swipeable-${notification.id}`}
			renderRightActions={renderRightActions}
			onSwipeableOpen={onArchive}
			rightThreshold={80}
			overshootRight={false}
			friction={0.5}
			enableTrackpadTwoFingerGesture
		>
			{notificationContent}
		</Swipeable>
	)
}

export default memo(NotificationItem)

const styles = StyleSheet.create({
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
