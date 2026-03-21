import type { GetNotificationsDTO } from '@/gen/index'
import api from '@/services/api'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import NotificationItem from '../NotificationItem'
import { useTranslation } from 'react-i18next'
import { colors } from '@/design-system/theme'
import { FlashList } from '@shopify/flash-list'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import NotificationsListSkeleton from '../NotificationsListSkeleton'
import CloudWithHourGlass from '@/assets/icons/cloud-with-hourglass.svg'
import { Text } from '@/design-system/components/Typography'

const limit = 10

type Props = {
	tab: 'ACTION' | 'INFO' | 'ARCHIVED' | undefined
}

const NotificationsList = ({ tab }: Props) => {
	const { t } = useTranslation('notifications')

	const {
		data: notificationsData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = useInfiniteQuery({
		queryKey: ['notifications', tab],
		initialPageParam: 0,
		queryFn: async ({ pageParam = 0 }) => {
			const offset = pageParam * limit

			const response = await api.get('/notifications', {
				params: {
					limit,
					offset,
					notificationType: tab !== 'ARCHIVED' ? tab : undefined,
					isArchived: tab === 'ARCHIVED',
				},
			})

			return response.data
		},
		getNextPageParam: (lastPage, allPages) => {
			if (!lastPage?.notifications) return undefined
			if (lastPage?.notifications?.length < limit) return undefined
			return allPages.length
		},
	})

	const notifications = useMemo(
		() =>
			notificationsData?.pages.flatMap((page) => page.notifications || []) ||
			[],
		[notificationsData?.pages],
	)

	const handleLoadMore = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage()
		}
	}, [fetchNextPage, hasNextPage, isFetchingNextPage])

	// biome-ignore lint/correctness/useExhaustiveDependencies: One dependency changes on every render
	const renderNotificationItem = useCallback(
		({ item }: { item: GetNotificationsDTO }) => (
			<NotificationItem notification={item} />
		),
		[t, tab],
	)

	const renderFooter = useCallback(() => {
		if (!isFetchingNextPage) return null

		return (
			<View style={styles.footerLoader} testID='footer-loader'>
				<ActivityIndicator size='small' color={colors.neutral['400']} />
			</View>
		)
	}, [isFetchingNextPage])

	const renderSeparator = useCallback(
		() => <View style={styles.separator} />,
		[],
	)

	return (
		<>
			{isLoading ? (
				<NotificationsListSkeleton />
			) : !notifications.length ? (
				<View
					style={{
						justifyContent: 'flex-start',
						marginTop: 100,
						alignItems: 'center',
						gap: 16,
					}}
				>
					<CloudWithHourGlass />

					<Text
						size='lg'
						style={{ color: colors.neutral['500'] }}
						fontWeight='bold'
						testID='no-notifications-heading'
					>
						{t('no_notifications')}
					</Text>
					<Text
						style={{ color: colors.neutral['500'] }}
						testID='no-notifications-description'
					>
						{t('no_notifications_description')}
					</Text>
				</View>
			) : (
				<View style={{ flex: 1 }}>
					<FlashList
						testID='notifications-flatlist'
						data={notifications}
						showsVerticalScrollIndicator={false}
						keyExtractor={(item, index) => `notification-${item.id || index}`}
						renderItem={renderNotificationItem}
						onEndReached={handleLoadMore}
						onEndReachedThreshold={0.5}
						ListFooterComponent={renderFooter}
						ItemSeparatorComponent={renderSeparator}
						estimatedItemSize={100}
					/>
				</View>
			)}
		</>
	)
}

export default NotificationsList

const styles = StyleSheet.create({
	separator: {
		height: 16,
	},
	footerLoader: {
		paddingVertical: 16,
		alignItems: 'center',
	},
})
