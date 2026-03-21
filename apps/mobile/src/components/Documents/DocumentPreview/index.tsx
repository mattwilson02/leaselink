import { Icon } from '@/components/Icon'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { FileText, Image as ImageIcon, X } from 'lucide-react-native'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'expo-image'
import { ActivityIndicator, View, TouchableOpacity, Modal } from 'react-native'
import Pdf from 'react-native-pdf'
import { useLocalSearchParams } from 'expo-router'
import {
	type DocumentDTO,
	useDownloadDocumentControllerGenerateDownloadUrl,
	useGetDocumentByIdControllerFindById,
} from '@/gen/index'
import { getMimeType } from '@/utils/get-mime-type'

const DocumentPreview = () => {
	const [uri, setUri] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isModalVisible, setIsModalVisible] = useState(false)

	const { id } = useLocalSearchParams<{ id: string }>()

	const { data, isFetching } = useGetDocumentByIdControllerFindById<
		{ document: DocumentDTO },
		{ id: string }
	>(id)
	const { mutateAsync } = useDownloadDocumentControllerGenerateDownloadUrl()

	const { t } = useTranslation('document_details')

	const retrieveUri = useCallback(
		async (documentId: string) => {
			setIsLoading(true)

			try {
				const { downloadUrl } = await mutateAsync({ data: { documentId } })

				if (!downloadUrl) {
					setUri(null)
					setError('Failed to retrieve document preview.')
					return
				}

				const mobileAccessibleUrl = downloadUrl.replace(
					'backend-blob-storage',
					'localhost',
				)

				setUri(mobileAccessibleUrl)
			} catch (error) {
				setUri(null)
				console.error(error)

				setError('Failed to retrieve document preview.')
			} finally {
				setIsLoading(false)
			}
		},
		[mutateAsync],
	)

	const fileExtension =
		data?.document?.name?.split('.').pop()?.toLowerCase() || ''
	const mimeType = getMimeType(fileExtension)

	const isPDF = mimeType === 'application/pdf'
	const isImage = mimeType.startsWith('image/')

	useEffect(() => {
		if (data?.document && !isLoading && !uri && !error) {
			retrieveUri(id)
		}
	}, [id, isLoading, data?.document, retrieveUri, uri, error])

	if (isLoading || isFetching) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					padding: 32,
					gap: 16,
				}}
			>
				<ActivityIndicator
					size='large'
					color={colors.primary}
				/>
				<Text
					style={{
						color: colors.neutral['500'],
						textAlign: 'center',
					}}
				>
					{t('loading_preview')}
				</Text>
			</View>
		)
	}

	if (error) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					padding: 32,
					gap: 16,
				}}
			>
				{isPDF ? (
					<FileText size={48} color={colors.error[500]} />
				) : (
					<ImageIcon size={48} color={colors.error[500]} />
				)}

				<Text style={{ color: colors.error[500] }} fontWeight='bold'>
					{error}
				</Text>
			</View>
		)
	}

	if ((isImage || isPDF) && !!uri) {
		return (
			<>
				<TouchableOpacity
					style={{
						flex: 1,
					}}
					onPress={() => setIsModalVisible(true)}
					activeOpacity={0.8}
				>
					<View style={{ flex: 1, position: 'relative' }}>
						{isImage ? (
							<Image
								source={{ uri: uri || undefined }}
								style={{
									width: '100%',
									flex: 1,
									height: '100%',
									alignSelf: 'center',
								}}
								resizeMode='contain'
							/>
						) : (
							<Pdf
								source={{ uri: uri || undefined }}
								style={{
									flex: 1,
									maxWidth: '100%',
									width: '100%',
									backgroundColor: 'transparent',
								}}
								showsVerticalScrollIndicator={false}
								enablePaging={true}
								horizontal={false}
								spacing={10}
								minScale={0.5}
								maxScale={3.0}
								scale={1.0}
								fitPolicy={0}
							/>
						)}
					</View>
				</TouchableOpacity>

				<Modal
					visible={isModalVisible}
					transparent={false}
					animationType='slide'
					statusBarTranslucent
				>
					<View
						style={{
							backdropFilter: 'blur(16px)',
							backgroundColor: colors.neutral['100'],
							flex: 1,
							justifyContent: 'center',
							paddingHorizontal: 16,
						}}
					>
						<View
							style={{
								backgroundColor: 'white',
								borderRadius: 12,
								maxHeight: '70%',
								paddingHorizontal: 16,
								paddingVertical: 20,
							}}
						>
							<View
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
									alignItems: 'center',
									paddingBottom: 20,
									borderBottomColor: colors.neutral['30'],
									borderBottomWidth: 1,
								}}
							>
								<Text
									size='lg'
									fontWeight='bold'
									style={{ color: colors.neutral['700'] }}
								>
									{data?.document?.name ?? t('document_preview')}
								</Text>
								<X
									size={24}
									color={colors.neutral['400']}
									onPress={() => setIsModalVisible(false)}
								/>
							</View>
							{isImage ? (
								<Image
									source={{ uri }}
									style={{ width: '100%', height: '100%' }}
									resizeMode='contain'
								/>
							) : (
								<Pdf
									source={{ uri }}
									style={{
										backgroundColor: 'transparent',
										maxHeight: 500,
										height: '100%',
										width: '100%',
									}}
									showsVerticalScrollIndicator={false}
									enablePaging={true}
									horizontal={false}
									enableDoubleTapZoom={true}
									spacing={10}
									scale={1.0}
									fitPolicy={0}
								/>
							)}
						</View>
					</View>
				</Modal>
			</>
		)
	}

	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				padding: 32,
				gap: 24,
			}}
		>
			<Icon.Root>
				<Icon.IconContainer color={colors.neutral['100']}>
					<Icon.Icon
						name='file-05'
						size={48}
						stroke={colors.neutral['400']}
						strokeWidth={1.5}
					/>
				</Icon.IconContainer>
			</Icon.Root>
			<View>
				<Text style={{ color: colors.neutral['700'] }}>
					{data?.document?.name}
				</Text>
				<Text style={{ color: colors.neutral['500'] }}>
					{t('download_to_view_file')}
				</Text>
			</View>
		</View>
	)
}

export default DocumentPreview
