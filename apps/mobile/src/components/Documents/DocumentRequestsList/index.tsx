import {
	type DocumentRequestDTO,
	documentRequestDTOStatusEnum,
	useGetDocumentRequestsByClientIdControllerFindAll,
} from '@/gen/index'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { colors } from '@/design-system/theme'
import { Text } from '@/design-system/components/Typography'
import DocumentRequestItem from '../DocumentRequestItem'
import DocumentRequestsListSkeleton from '../DocumentRequestsListSkeleton'
import { useRouter } from 'expo-router'

type Props = {
	showPreview?: boolean
}

const DocumentRequestsList = ({ showPreview = false }: Props) => {
	const { t } = useTranslation('documents')
	const router = useRouter()

	const { data, isLoading } = useGetDocumentRequestsByClientIdControllerFindAll(
		{},
		{
			query: {
				queryKey: ['documentRequests'],
			},
		},
	)

	const filteredDocumentRequests = useMemo(
		() =>
			data?.documentRequests?.filter(
				(request: DocumentRequestDTO) =>
					request.status !== documentRequestDTOStatusEnum.UPLOADED &&
					request.status !== documentRequestDTOStatusEnum.CANCELED,
			),
		[data?.documentRequests],
	)

	const listData = useMemo(
		() =>
			showPreview
				? filteredDocumentRequests?.slice(0, 3) || []
				: filteredDocumentRequests || [],
		[showPreview, filteredDocumentRequests],
	)

	const renderHeaderComponent = () => {
		if (!showPreview || listData.length === 0) {
			return null
		}

		return (
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 12,
				}}
			>
				<Text fontWeight='bold' style={{ color: colors.neutral[700] }}>
					{t('required_documents')}
				</Text>

				<Pressable
					onPress={() => router.push('/document-requests')}
					style={{ padding: 4 }}
				>
					<Text size='sm' fontWeight='bold' style={{ color: colors.mutedForeground }}>
						{t('see_more')}
					</Text>
				</Pressable>
			</View>
		)
	}
	const renderDocumentRequestItem = ({
		item,
		index,
	}: {
		item: NonNullable<typeof data>['documentRequests'][0]
		index: number
	}) => (
		<DocumentRequestItem
			key={index}
			requestId={item.id}
			requestType={item.requestType}
			status={item.status}
		/>
	)

	if (
		(!data && !isLoading) ||
		(data?.documentRequests.length === 0 && !isLoading)
	) {
		return null
	}

	return (
		<View style={{ flex: 1 }}>
			{isLoading ? (
				<DocumentRequestsListSkeleton />
			) : (
				<FlashList
					testID='document-requests-flatlist'
					scrollEnabled={!showPreview}
					data={listData}
					renderItem={renderDocumentRequestItem}
					keyExtractor={(item, index) => `${item.requestType}-${index}`}
					contentContainerStyle={{ padding: 2 }}
					showsVerticalScrollIndicator={false}
					ListHeaderComponent={renderHeaderComponent}
					ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
					estimatedItemSize={80}
				/>
			)}
		</View>
	)
}

export default DocumentRequestsList
