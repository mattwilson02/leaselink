import {
	useGetRecentlyViewedDocumentsControllerGetRecentlyViewed,
	type DocumentDTO,
} from '@/gen/index'
import api from '@/services/api'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DocumentItem from '../DocumentItem'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { colors } from '@/design-system/theme'
import DocumentsListSkeleton from '../DocumentsListSkeleton'
import CloudWithHourGlass from '@/assets/icons/cloud-with-hourglass.svg'
import { Text } from '@/design-system/components/Typography'
import { useLocalSearchParams } from 'expo-router'

const limit = 10

type Props = {
	withSearch?: boolean
	scrollEnabled?: boolean
}

const DocumentsList = ({ withSearch = false, scrollEnabled = true }: Props) => {
	const { t } = useTranslation('documents')
	const params = useLocalSearchParams()

	const search = params.search as string
	const folderName = params.folderName as string

	const folders = folderName ? [folderName] : params.folders || []

	const startDate = params.startDate
		? new Date(params.startDate as string)
		: null
	const endDate = params.endDate ? new Date(params.endDate as string) : null
	const showRecentlyViewedDocuments = withSearch && (!search || search === '')

	const { data: recentlyViewedDocuments } =
		useGetRecentlyViewedDocumentsControllerGetRecentlyViewed<{
			documents: DocumentDTO[]
		}>(
			{
				limit: 25,
				folderName: folderName || undefined,
			},
			{
				query: {
					enabled: withSearch,
				},
			},
		)

	const {
		data: documentsData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = useInfiniteQuery({
		queryKey: ['documents', search, startDate, endDate, folders],
		initialPageParam: 1,
		queryFn: async ({ pageParam = 1 }) => {
			const response = await api.get('/documents', {
				params: {
					page: pageParam,
					pageSize: limit,
					search,
					createdAtFrom: startDate,
					createdAtTo: endDate,
					folders,
					folderName,
				},
				// Folders are sent as a comma-separated string
				paramsSerializer: {
					indexes: null,
				},
			})

			return response.data
		},
		getNextPageParam: (lastPage) => {
			if (!lastPage?.meta) return undefined
			if (lastPage.meta.page >= lastPage.meta.totalPages) return undefined
			return lastPage.meta.page + 1
		},
	})

	const documents = useMemo(
		() => documentsData?.pages.flatMap((page) => page.data || []) || [],
		[documentsData?.pages],
	)

	const handleLoadMore = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage()
		}
	}, [fetchNextPage, hasNextPage, isFetchingNextPage])

	const renderDocumentItem = useCallback(
		({ item }: { item: DocumentDTO }) => (
			<DocumentItem
				size={item.fileSize}
				id={item.id}
				name={item.name}
				createdAt={item.createdAt}
				folder={item.folder}
			/>
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

	const renderEmptyComponent = useCallback(() => {
		return (
			<View
				style={{
					justifyContent: 'flex-start',
					marginVertical: 20,
					alignItems: 'center',
					flex: 1,
					gap: 16,
				}}
			>
				<CloudWithHourGlass />

				<Text
					size='lg'
					style={{ color: colors.neutral['500'] }}
					fontWeight='bold'
					testID='no-documents-heading'
				>
					{showRecentlyViewedDocuments
						? t('no_recent_viewed_documents_found')
						: folderName
							? t('no_documents_found_in_folder', { folder: folderName })
							: t('no_documents_found')}
				</Text>
				<Text
					testID='no-documents-description'
					style={{ color: colors.neutral['500'] }}
				>
					{showRecentlyViewedDocuments
						? t('no_recent_viewed_documents_description')
						: t('no_documents_description')}
				</Text>
			</View>
		)
	}, [t, folderName, showRecentlyViewedDocuments])

	return (
		<>
			{isLoading ? (
				<DocumentsListSkeleton numberOfSkeletons={7} />
			) : (
				<FlashList
					testID='documents-flatlist'
					data={
						showRecentlyViewedDocuments
							? recentlyViewedDocuments?.documents
							: documents
					}
					scrollEnabled={scrollEnabled}
					keyExtractor={(item, index) => `document-${item.id || index}`}
					renderItem={renderDocumentItem}
					onEndReached={handleLoadMore}
					showsVerticalScrollIndicator={false}
					onEndReachedThreshold={0.5}
					ListFooterComponent={renderFooter}
					ListEmptyComponent={renderEmptyComponent}
					ItemSeparatorComponent={renderSeparator}
					estimatedItemSize={100}
				/>
			)}
		</>
	)
}

export default DocumentsList

const styles = StyleSheet.create({
	footerLoader: {
		paddingVertical: 16,
		alignItems: 'center',
	},
	separator: {
		height: 10,
	},
})
