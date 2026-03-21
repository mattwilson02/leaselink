import { useCallback, useMemo } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { FlashList } from '@shopify/flash-list'
import { useMyPayments, type PaymentDTO } from '@/hooks/usePayments'
import PaymentItem from '../PaymentItem'

type Props = {
	statusFilter?: string
	scrollEnabled?: boolean
}

const PaymentList = ({ statusFilter, scrollEnabled = true }: Props) => {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
		useMyPayments({
			status: statusFilter === 'ALL' ? undefined : statusFilter,
		})

	const payments = useMemo(
		() => data?.pages.flatMap((page) => page.payments || []) || [],
		[data?.pages],
	)

	const handleLoadMore = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage()
		}
	}, [fetchNextPage, hasNextPage, isFetchingNextPage])

	const renderItem = useCallback(
		({ item }: { item: PaymentDTO }) => <PaymentItem payment={item} />,
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

	const renderSeparator = useCallback(() => <View style={styles.separator} />, [])

	const renderEmpty = useCallback(() => {
		if (isLoading) return null
		return (
			<View style={styles.emptyContainer}>
				<Text
					size='lg'
					style={{ color: colors.neutral['500'] }}
					fontWeight='bold'
					testID='no-payments-heading'
				>
					No payments yet.
				</Text>
			</View>
		)
	}, [isLoading])

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
			testID='payments-list'
			data={payments}
			scrollEnabled={scrollEnabled}
			keyExtractor={(item, index) => `payment-${item.id || index}`}
			renderItem={renderItem}
			onEndReached={handleLoadMore}
			showsVerticalScrollIndicator={false}
			onEndReachedThreshold={0.5}
			ListFooterComponent={renderFooter}
			ListEmptyComponent={renderEmpty}
			ItemSeparatorComponent={renderSeparator}
			estimatedItemSize={100}
			onRefresh={refetch}
			refreshing={false}
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
		height: 90,
		borderRadius: 8,
		backgroundColor: colors.neutral['40'],
	},
})

export default PaymentList
