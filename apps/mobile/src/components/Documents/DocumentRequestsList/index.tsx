import {
	type DocumentRequestDTO,
	documentRequestDTOStatusEnum,
	useGetDocumentRequestsByClientIdControllerFindAll,
} from '@/gen/index'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { colors } from '@sf-digital-ui/tokens'
import { Button, Text } from '@sf-digital-ui/react-native'
import DocumentRequestItem from '../DocumentRequestItem'
import DocumentRequestsListSkeleton from '../DocumentRequestsListSkeleton'
import { useRouter } from 'expo-router'

type Props = {
	showPreview?: boolean
}

const DocumentRequestsList = ({ showPreview = false }: Props) => {
	const { t } = useTranslation('documents')

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
		const router = useRouter()

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
				<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
					{t('required_documents')}
				</Text>

				<Button.Root
					onPress={() => router.push('/document-requests')}
					variant='link'
					color='neutral'
					size='sm'
				>
					<Button.Text style={{ fontWeight: 'bold', padding: 4 }}>
						{t('see_more')}
					</Button.Text>
				</Button.Root>
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
