import { requestTypeIcon } from '@/components/Documents/DocumentRequestItem'
import { Icon } from '@/components/Icon'
import {
	useAuthControllerHandle,
	useConfirmUploadDocumentControllerHandle,
	useGetDocumentRequestByIdControllerHandle,
	useUploadDocumentControllerHandle,
} from '@/gen/index'
import { Button, Text, Modal } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CheckCircle, Trash, X } from 'lucide-react-native'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Alert,
	Pressable,
	StyleSheet,
	View,
	Animated,
	Easing,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import DocIcon from '@/assets/icons/doc.svg'
import { ErrorModal } from '@/components/ErrorModal'
import { queryClient } from '@/app/_layout'
import { DocumentFolder, DocumentRequestType } from '@leaselink/shared'

const requestTypeToFolder: Record<string, string> = {
	[DocumentRequestType.SIGNED_LEASE]: DocumentFolder.LEASE_AGREEMENTS,
	[DocumentRequestType.MOVE_IN_CHECKLIST]: DocumentFolder.LEASE_AGREEMENTS,
	[DocumentRequestType.PROOF_OF_IDENTITY]: DocumentFolder.IDENTIFICATION,
	[DocumentRequestType.PROOF_OF_ADDRESS]: DocumentFolder.IDENTIFICATION,
}

interface SelectedFile {
	id: number
	uri: string
	name: string
	size?: number
	mimeType?: string
}

const UploadDocument = () => {
	const [selectedImage, setSelectedImage] = useState<SelectedFile | null>(null)

	const [uploading, setUploading] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [showSuccessModal, setShowSuccessModal] = useState(false)

	const shimmerAnimation = useRef(new Animated.Value(0)).current

	const { requestId } = useLocalSearchParams()

	const { data: documentRequest, isLoading } =
		useGetDocumentRequestByIdControllerHandle(requestId as string)

	const { data: user } = useAuthControllerHandle()
	const { mutateAsync: uploadDocument } = useUploadDocumentControllerHandle()
	const { mutateAsync: confirmUploadDocument } =
		useConfirmUploadDocumentControllerHandle()

	const router = useRouter()
	const { t: uploadDocumentT } = useTranslation('upload_document')
	const { t: documentRequestT } = useTranslation('document_requests')
	const { t: generalT } = useTranslation('general')
	const { t: alertsT } = useTranslation('alerts')

	useEffect(() => {
		let animation: Animated.CompositeAnimation | null = null

		if (isLoading) {
			const startShimmerAnimation = () => {
				shimmerAnimation.setValue(0)
				animation = Animated.timing(shimmerAnimation, {
					toValue: 1,
					duration: 1500,
					easing: Easing.linear,
					useNativeDriver: false,
				})
				animation.start(({ finished }) => {
					if (finished) {
						startShimmerAnimation()
					}
				})
			}

			startShimmerAnimation()
		}

		return () => {
			if (animation) {
				animation.stop()
			}
		}
	}, [isLoading, shimmerAnimation])

	const shimmerInterpolation = shimmerAnimation.interpolate({
		inputRange: [0, 1],
		outputRange: ['-100%', '100%'],
	})

	const requestPermissions = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (status !== 'granted') {
			Alert.alert(
				alertsT('permission_required'),
				alertsT('permission_camera_roll'),
			)
			return false
		}
		return true
	}

	const pickImage = async () => {
		const hasPermission = await requestPermissions()
		if (!hasPermission) return

		Alert.alert(alertsT('select_source'), alertsT('select_source_document'), [
			{
				text: alertsT('camera'),
				onPress: () => pickFromCamera(),
			},
			{
				text: alertsT('photo_library'),
				onPress: () => pickFromLibrary(),
			},
			{
				text: alertsT('files'),
				onPress: () => pickFromFiles(),
			},
			{
				text: generalT('cancel'),
				style: 'cancel',
			},
		])
	}

	const returnToDocumentRequests = () => {
		router.push('/document-requests')
		queryClient.invalidateQueries({
			queryKey: ['documentRequests', 'documents'],
		})
	}

	const pickFromCamera = async () => {
		try {
			const { status } = await ImagePicker.requestCameraPermissionsAsync()
			if (status !== 'granted') {
				setErrorMessage('Camera permission is needed!')
				setShowErrorModal(true)
				return
			}

			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			})

			if (!result.canceled) {
				const asset = result.assets[0]
				setSelectedImage({
					id: Date.now(),
					uri: asset.uri,
					name: asset.fileName || `camera_${Date.now()}.jpg`,
					size: asset.fileSize,
					mimeType: asset.mimeType || 'image/jpeg',
				})
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			setShowErrorModal(true)
			setErrorMessage(`Failed to take photo: ${errorMessage}`)
		}
	}

	const pickFromLibrary = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			})

			if (!result.canceled) {
				const asset = result.assets[0]
				setSelectedImage({
					id: Date.now(),
					uri: asset.uri,
					name: asset.fileName || `library_${Date.now()}.jpg`,
					size: asset.fileSize,
					mimeType: asset.mimeType || 'image/jpeg',
				})
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			setShowErrorModal(true)
			setErrorMessage(`Failed to pick from library: ${errorMessage}`)
		}
	}

	const pickFromFiles = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ['image/*', 'application/pdf'],
				copyToCacheDirectory: true,
			})

			if (!result.canceled) {
				const asset = result.assets[0]
				setSelectedImage({
					id: Date.now(),
					uri: asset.uri,
					name: asset.name,
					size: asset.size,
					mimeType: asset.mimeType,
				})
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			setShowErrorModal(true)
			setErrorMessage(`Failed to pick document: ${errorMessage}`)
		}
	}

	const uploadImage = async () => {
		if (!selectedImage) {
			return
		}

		setUploading(true)
		try {
			const uploadUrlResponse = await uploadDocument({
				data: { documentRequestId: documentRequest?.id || '' },
			})

			// TODO: remove this when we have a proper dev blob storage url
			const mobileAccessibleUrl = uploadUrlResponse.uploadUrl.replace(
				'backend-blob-storage',
				'localhost',
			)

			const fileResponse = await fetch(selectedImage.uri)
			const fileBlob = await fileResponse.blob()

			const response = await fetch(mobileAccessibleUrl, {
				method: 'PUT',
				body: fileBlob,
				headers: {
					'Content-Type': selectedImage.mimeType || 'application/octet-stream',
					'x-ms-blob-type': 'BlockBlob',
				},
			})

			if (!response.ok) {
				setShowErrorModal(true)
				setErrorMessage(
					`Upload failed: ${response.statusText || 'Unknown error'}`,
				)
			}

			// TODO: set contentKey and thumbnailBlobName when implemented + update types on backend
			const url = new URL(mobileAccessibleUrl)
			const pathParts = url.pathname.split('/')
			const blobName = pathParts[pathParts.length - 1]

			await confirmUploadDocument({
				data: {
					documentRequestId: documentRequest?.id || '',
					uploadedBy: user?.id || '',
					clientId: user?.id || '',
					// @ts-ignore
					contentKey: undefined,
					// @ts-ignore
					thumbnailBlobName: undefined,
					fileSize: selectedImage?.size
						? Number((selectedImage.size / 1024).toFixed(1))
						: 0,
					folder: requestTypeToFolder[documentRequest?.requestType ?? ''] ?? DocumentFolder.OTHER,
					name: selectedImage.name,
					blobName: blobName,
				},
			})

			setShowSuccessModal(true)
			setSelectedImage(null)
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to upload image'
			setShowErrorModal(true)
			setErrorMessage(errorMessage)
		} finally {
			setUploading(false)
		}
	}

	const removeImage = () => {
		setSelectedImage(null)
	}

	if (!documentRequest && !isLoading) {
		return (
			<View style={{ backgroundColor: 'white', flex: 1 }}>
				<View style={styles.header}>
					<View
						style={{
							flex: 1,
							gap: 16,
						}}
					>
						<View
							style={{
								flexDirection: 'row',
								width: '100%',
								alignItems: 'center',
								justifyContent: 'flex-end',
							}}
						>
							<Pressable
								testID='back-button'
								onPress={() => router.back()}
								style={{ padding: 16 }}
							>
								<X size={24} color={colors.neutral['300']} />
							</Pressable>
						</View>
					</View>
				</View>
				<View
					style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
				>
					<Text size='lg' style={{ color: colors.neutral['500'] }}>
						{uploadDocumentT('document_request_not_found')}
					</Text>
				</View>
			</View>
		)
	}

	return (
		<>
			<View
				testID='layout-view'
				style={{ backgroundColor: 'white', flex: 1, gap: 20 }}
			>
				<View style={styles.header}>
					<View
						style={{
							flex: 1,
							gap: 16,
						}}
					>
						<View
							style={{
								flexDirection: 'row',
								width: '100%',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<Icon.Root>
								<Icon.IconContainer
									color={colors['primary-green']['100']}
									style={{ padding: 12, borderRadius: 12 }}
								>
									{documentRequest ? (
										<Icon.Icon
											stroke={colors['primary-green']['500']}
											strokeWidth={
												requestTypeIcon[documentRequest.requestType].strokeWidth
											}
											name={requestTypeIcon[documentRequest.requestType].name}
											size={24}
										/>
									) : (
										<View style={styles.iconSkeleton}>
											<Animated.View
												style={[
													styles.shimmer,
													{
														transform: [{ translateX: shimmerInterpolation }],
													},
												]}
											/>
										</View>
									)}
								</Icon.IconContainer>
							</Icon.Root>
							<Pressable
								testID='back-button'
								onPress={() => router.back()}
								style={{ padding: 16 }}
							>
								<X size={24} color={colors.neutral['300']} />
							</Pressable>
						</View>

						<View style={{ gap: 4 }}>
							<Text
								size='lg'
								style={{ color: colors.neutral['700'] }}
								fontWeight='bold'
							>
								{documentRequest
									? documentRequestT(documentRequest.requestType)
									: 'Loading...'}
							</Text>
							<Text size='sm' style={{ color: colors.neutral['500'] }}>
								{uploadDocumentT('upload_document_description')}
							</Text>
						</View>
					</View>
				</View>

				<View style={{ flex: 1, gap: 16 }}>
					{!selectedImage && (
						<Pressable
							style={styles.uploadContainer}
							testID='upload-pressable'
							disabled={isLoading}
							onPress={pickImage}
						>
							<Icon.Root>
								<Icon.IconContainer
									color={colors.neutral['40']}
									style={{ padding: 12, borderRadius: 12 }}
								>
									<Icon.Icon
										strokeWidth={1.66}
										name='upload-cloud-02'
										size={20}
									/>
								</Icon.IconContainer>
							</Icon.Root>
							<Button.Root variant='link'>
								<Button.Text style={{ fontWeight: 'bold' }}>
									{uploadDocumentT('click_to_upload')}
								</Button.Text>
							</Button.Root>
							<Text size='xs' style={{ color: colors.neutral['300'] }}>
								{/** TODO: get official format rules */}
								SVG, PNG, JPG or GIF (max. 800x400px)
							</Text>
						</Pressable>
					)}
					{!!selectedImage && (
						<View style={styles.selectedImageContainer}>
							<View
								style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
							>
								<DocIcon />
								<View style={{ gap: 4 }}>
									<Text
										style={{ color: colors.neutral['500'] }}
										fontWeight='bold'
									>
										{selectedImage?.name}
									</Text>
									<Text size='sm' style={{ color: colors.neutral['300'] }}>
										{selectedImage?.size
											? `${(selectedImage.size / 1024).toFixed(0)} KB`
											: ''}
									</Text>
								</View>
							</View>
							<Trash
								size={16}
								color={colors.error['500']}
								onPress={removeImage}
							/>
						</View>
					)}
				</View>
				<View
					style={{
						paddingBottom: 32,
						gap: 24,
					}}
				>
					<View style={{ height: 1, backgroundColor: colors.neutral['30'] }} />
					<View style={{ flexDirection: 'row', gap: 12 }}>
						<Button.Root
							testID='cancel-button'
							variant='secondary'
							color='neutral'
							onPress={() => router.back()}
							disabled={uploading}
							style={{ flex: 1 }}
						>
							<Button.Text>{generalT('cancel')}</Button.Text>
						</Button.Root>
						<Button.Root
							testID='confirm-button'
							onPress={uploadImage}
							disabled={!selectedImage || uploading}
							style={{ flex: 1 }}
						>
							<Button.Text>{generalT('confirm')}</Button.Text>
						</Button.Root>
					</View>
				</View>
			</View>

			<ErrorModal
				showModal={showErrorModal}
				setShowModal={setShowErrorModal}
				errorMessage={errorMessage}
			/>

			<Modal.Root
				open={showSuccessModal}
				onOpenChange={(open) => {
					queryClient.invalidateQueries({
						queryKey: ['documentRequests', 'documents'],
					})

					setShowSuccessModal(open)
					if (!open) {
						router.push('/document-requests')
					}
				}}
			>
				<Modal.Header
					style={{ backgroundColor: colors.success['100'] }}
					icon={<CheckCircle size={24} color={colors.success['500']} />}
					circularBackgroundColor={colors.success['50']}
				/>
				<Modal.Body>
					<Modal.Title>{uploadDocumentT('document_uploaded')}</Modal.Title>
					<Modal.Description>
						{uploadDocumentT('document_uploaded_description')}
					</Modal.Description>
				</Modal.Body>
				<Modal.Footer>
					<Button.Root
						collapsable={false}
						testID='upload-success-continue-button'
						onPress={returnToDocumentRequests}
					>
						<Button.Text>{generalT('continue')}</Button.Text>
					</Button.Root>
				</Modal.Footer>
			</Modal.Root>
		</>
	)
}

export default UploadDocument

const styles = StyleSheet.create({
	selectedImageContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		borderWidth: 1,
		paddingVertical: 16,
		gap: 12,
		borderColor: colors.neutral['40'],
		borderRadius: 12,
	},

	uploadContainer: {
		paddingVertical: 16,
		alignItems: 'center',
		paddingHorizontal: 24,
		borderWidth: 1,
		gap: 12,
		borderColor: colors.neutral['40'],
		borderRadius: 12,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 12,
		justifyContent: 'space-between',
	},
	iconSkeleton: {
		width: 24,
		height: 24,
		borderRadius: 4,
		backgroundColor: colors.neutral['40'],
		overflow: 'hidden',
	},
	shimmer: {
		width: '100%',
		height: '100%',
		backgroundColor: colors.neutral['50'],
		opacity: 0.5,
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
})
