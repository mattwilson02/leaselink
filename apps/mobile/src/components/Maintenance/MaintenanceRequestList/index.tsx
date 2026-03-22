import { useCallback, useMemo } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { FlashList } from '@shopify/flash-list'
import { useTranslation } from 'react-i18next'
import CloudWithHourGlass from '@/assets/icons/cloud-with-hourglass.svg'
import {
	useMyMaintenanceRequests,
	type MaintenanceRequestDTO,
} from '@/hooks/useMaintenanceRequests'
import MaintenanceRequestItem from '../MaintenanceRequestItem'

type Props = {
	statusFilter?: string
	scrollEnabled?: boolean
}

const MaintenanceRequestList = ({
	statusFilter,
	scrollEnabled = true,
}: Props) => {
	const { t } = useTranslation('maintenance')

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useMyMaintenanceRequests({
			status: statusFilter === 'ALL' ? undefined : statusFilter,
		})

	const requests = useMemo(
		() => data?.pages.flatMap((page) => page.maintenanceRequests || []) || [],
		[data?.pages],
	)

	const handleLoadMore = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage()
		}
	}, [fetchNextPage, hasNextPage, isFetchingNextPage])

	const renderItem = useCallback(
		({ item }: { item: MaintenanceRequestDTO }) => (
			<MaintenanceRequestItem request={item} />
		),
		[],
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

	const renderEmpty = useCallback(() => {
		if (isLoading) return null
		return (
			<View style={styles.emptyContainer}>
				<CloudWithHourGlass />
				<Text
					size='lg'
					style={{ color: colors.neutral['500'] }}
					fontWeight='bold'
					testID='no-requests-heading'
				>
					{t('no_requests')}
				</Text>
				<Text
					style={{ color: colors.neutral['500'] }}
					testID='no-requests-description'
				>
					{t('no_requests_description')}
				</Text>
			</View>
		)
	}, [isLoading, t])

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				{Array.from({ length: 4 }).map((_, i) => (
					<View key={i} style={styles.skeleton} />
				))}
			</View>
		)
	}

	return (
		<FlashList
			testID='maintenance-requests-list'
			data={requests}
			scrollEnabled={scrollEnabled}
			keyExtractor={(item, index) => `request-${item.id || index}`}
			renderItem={renderItem}
			onEndReached={handleLoadMore}
			showsVerticalScrollIndicator={false}
			onEndReachedThreshold={0.5}
			ListFooterComponent={renderFooter}
			ListEmptyComponent={renderEmpty}
			ItemSeparatorComponent={renderSeparator}
			estimatedItemSize={120}
		/>
	)
}

const styles = StyleSheet.create({
	footerLoader: {
		paddingVertical: 16,
		alignItems: 'center',
	},
	separator: {
		height: 10,
	},
	emptyContainer: {
		justifyContent: 'flex-start',
		marginVertical: 20,
		alignItems: 'center',
		flex: 1,
		gap: 16,
	},
	loadingContainer: {
		gap: 10,
	},
	skeleton: {
		height: 100,
		borderRadius: 8,
		backgroundColor: colors.neutral['40'],
	},
})

export default MaintenanceRequestList
