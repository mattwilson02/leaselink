import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { CheckCircle, Plus, Trash, X } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Alert,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import {
	MaintenanceCategory,
	MaintenancePriority,
	MAINTENANCE_CATEGORY_LABELS,
	MAINTENANCE_PRIORITY_LABELS,
} from '@leaselink/shared'
import { useCreateMaintenanceRequest } from '@/hooks/useMaintenanceRequests'
import { ErrorModal } from '@/components/ErrorModal'

interface ActiveLease {
	id: string
	propertyId: string
	status: string
}

const MAX_PHOTOS = 10

const categoryOptions = Object.values(MaintenanceCategory)
const priorityOptions = Object.values(MaintenancePriority)

const CreateMaintenanceRequest = () => {
	const router = useRouter()
	const { t } = useTranslation('maintenance')
	const { t: generalT } = useTranslation('general')
	const { t: alertsT } = useTranslation('alerts')

	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [category, setCategory] = useState<MaintenanceCategory | ''>('')
	const [priority, setPriority] = useState<MaintenancePriority>(
		MaintenancePriority.MEDIUM,
	)
	const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([])
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [newRequestId, setNewRequestId] = useState<string | null>(null)

	const { data: activeLease, isLoading: leaseLoading } = useQuery({
		queryKey: ['leases', 'tenant', 'active'],
		queryFn: async () => {
			const response = await api.get<{ data: ActiveLease[] }>(
				'/leases/tenant',
				{
					params: { status: 'ACTIVE' },
				},
			)
			const leases = response.data?.data ?? []
			return leases.find((l) => l.status === 'ACTIVE') ?? null
		},
	})

	const { mutateAsync: createRequest, isPending } =
		useCreateMaintenanceRequest()

	const validate = () => {
		const newErrors: Record<string, string> = {}

		if (!title.trim()) {
			newErrors.title = t('title_required')
		} else if (title.trim().length > 200) {
			newErrors.title = t('title_max_length')
		}

		if (!description.trim()) {
			newErrors.description = t('description_required')
		} else if (description.trim().length > 5000) {
			newErrors.description = t('description_max_length')
		}

		if (!category) {
			newErrors.category = t('category_required')
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

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
				setPhotos((prev) =>
					prev.length < MAX_PHOTOS ? [...prev, asset] : prev,
				)
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Unknown error'
			setErrorMessage(`Failed to take photo: ${msg}`)
			setShowErrorModal(true)
		}
	}

	const pickFromLibrary = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsMultipleSelection: true,
				quality: 0.8,
			})

			if (!result.canceled) {
				const newAssets = result.assets
				setPhotos((prev) => {
					const remaining = MAX_PHOTOS - prev.length
					return [...prev, ...newAssets.slice(0, remaining)]
				})
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Unknown error'
			setErrorMessage(`Failed to pick photos: ${msg}`)
			setShowErrorModal(true)
		}
	}

	const handleAddPhotos = async () => {
		if (photos.length >= MAX_PHOTOS) {
			Alert.alert('', t('max_photos'))
			return
		}

		const hasPermission = await requestPermissions()
		if (!hasPermission) return

		Alert.alert(alertsT('select_source'), alertsT('select_source_photo'), [
			{ text: alertsT('camera'), onPress: pickFromCamera },
			{ text: alertsT('photo_library'), onPress: pickFromLibrary },
			{ text: generalT('cancel'), style: 'cancel' },
		])
	}

	const removePhoto = (index: number) => {
		setPhotos((prev) => prev.filter((, i) => i !== index))
	}

	const handleSubmit = async () => {
		if (!validate()) return
		if (!activeLease) return

		try {
			const request = await createRequest({
				propertyId: activeLease.propertyId,
				title: title.trim(),
				description: description.trim(),
				category: category as MaintenanceCategory,
				priority,
				photos: photos.length > 0 ? photos : undefined,
			})

			setNewRequestId(request.id)
			setShowSuccessModal(true)
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : 'Failed to submit request'
			setErrorMessage(msg)
			setShowErrorModal(true)
		}
	}

	const navigateToDetail = () => {
		setShowSuccessModal(false)
		if (newRequestId) {
			router.replace(`/maintenance/${newRequestId}`)
		} else {
			router.back()
		}
	}

	if (!leaseLoading && !activeLease) {
		return (
			<View style={{ flex: 1, backgroundColor: 'white' }}>
				<View style={styles.header}>
					<Pressable
						testID='back-button'
						onPress={() => router.back()}
						style={{ padding: 16 }}
					>
						<X size={24} color={colors.neutral['300']} />
					</Pressable>
				</View>
				<View style={styles.noLeaseContainer}>
					<Text
						size='lg'
						style={{ color: colors.neutral['500'], textAlign: 'center' }}
					>
						{t('no_active_lease')}
					</Text>
				</View>
			</View>
		)
	}

	return (
		<>
			<View style={{ flex: 1, backgroundColor: 'white' }}>
				<View style={styles.header}>
					<Text
						size='lg'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						{t('new_request')}
					</Text>
					<Pressable
						testID='back-button'
						onPress={() => router.back()}
						style={{ padding: 16 }}
					>
						<X size={24} color={colors.neutral['300']} />
					</Pressable>
				</View>

				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={styles.formContainer}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
				>
					{/* Title */}
					<View style={styles.fieldContainer}>
						<Text fontWeight='bold' style={styles.label}>
							{t('title')} *
						</Text>
						<TextInput
							testID='title-input'
							style={[
								styles.input,
								errors.title ? styles.inputError : undefined,
							]}
							value={title}
							onChangeText={(text) => {
								setTitle(text)
								if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
							}}
							placeholder={t('title')}
							placeholderTextColor={colors.neutral['300']}
							maxLength={200}
						/>
						{!!errors.title && (
							<Text size='xs' style={styles.errorText}>
								{errors.title}
							</Text>
						)}
					</View>

					{/* Description */}
					<View style={styles.fieldContainer}>
						<Text fontWeight='bold' style={styles.label}>
							{t('description')} *
						</Text>
						<TextInput
							testID='description-input'
							style={[
								styles.input,
								styles.textArea,
								errors.description ? styles.inputError : undefined,
							]}
							value={description}
							onChangeText={(text) => {
								setDescription(text)
								if (errors.description)
									setErrors((prev) => ({ ...prev, description: '' }))
							}}
							placeholder={t('description')}
							placeholderTextColor={colors.neutral['300']}
							multiline
							numberOfLines={4}
							textAlignVertical='top'
							maxLength={5000}
						/>
						{!!errors.description && (
							<Text size='xs' style={styles.errorText}>
								{errors.description}
							</Text>
						)}
					</View>

					{/* Category */}
					<View style={styles.fieldContainer}>
						<Text fontWeight='bold' style={styles.label}>
							{t('category')} *
						</Text>
						<View style={styles.optionGrid}>
							{categoryOptions.map((cat) => (
								<Pressable
									key={cat}
									testID={`category-${cat}`}
									style={[
										styles.optionChip,
										category === cat && styles.optionChipSelected,
									]}
									onPress={() => {
										setCategory(cat)
										if (errors.category)
											setErrors((prev) => ({ ...prev, category: '' }))
									}}
								>
									<Text
										size='sm'
										style={[
											styles.optionChipText,
											category === cat && styles.optionChipTextSelected,
										]}
									>
										{MAINTENANCE_CATEGORY_LABELS[cat]}
									</Text>
								</Pressable>
							))}
						</View>
						{!!errors.category && (
							<Text size='xs' style={styles.errorText}>
								{errors.category}
							</Text>
						)}
					</View>

					{/* Priority */}
					<View style={styles.fieldContainer}>
						<Text fontWeight='bold' style={styles.label}>
							{t('priority')}
						</Text>
						<View style={styles.optionGrid}>
							{priorityOptions.map((pri) => (
								<Pressable
									key={pri}
									testID={`priority-${pri}`}
									style={[
										styles.optionChip,
										priority === pri && styles.optionChipSelected,
									]}
									onPress={() => setPriority(pri)}
								>
									<Text
										size='sm'
										style={[
											styles.optionChipText,
											priority === pri && styles.optionChipTextSelected,
										]}
									>
										{MAINTENANCE_PRIORITY_LABELS[pri]}
									</Text>
								</Pressable>
							))}
						</View>
					</View>

					{/* Photos */}
					<View style={styles.fieldContainer}>
						<View style={styles.photoHeader}>
							<Text fontWeight='bold' style={styles.label}>
								{t('photos')}
							</Text>
							<Text size='xs' style={{ color: colors.neutral['400'] }}>
								{photos.length}/{MAX_PHOTOS}
							</Text>
						</View>

						{photos.length > 0 && (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.photoRow}
							>
								{photos.map((photo, index) => (
									<View key={`${photo.uri}-${index}`} style={styles.photoThumb}>
										<Image
											source={{ uri: photo.uri }}
											style={styles.photoImage}
											contentFit='cover'
										/>
										<Pressable
											style={styles.removePhotoButton}
											onPress={() => removePhoto(index)}
											testID={`remove-photo-${index}`}
										>
											<X size={12} color='white' />
										</Pressable>
									</View>
								))}
							</ScrollView>
						)}

						{photos.length < MAX_PHOTOS && (
							<Pressable
								testID='add-photos-button'
								style={styles.addPhotoButton}
								onPress={handleAddPhotos}
							>
								<Plus size={20} color={colors.neutral['400']} />
								<Text size='sm' style={{ color: colors.neutral['400'] }}>
									{t('add_photos')}
								</Text>
							</Pressable>
						)}
					</View>
				</ScrollView>

				<View style={styles.bottomActions}>
					<View style={{ height: 1, backgroundColor: colors.neutral['30'] }} />
					<View style={styles.buttonRow}>
						<Button.Root
							testID='cancel-button'
							variant='secondary'
							color='neutral'
							size='md'
							onPress={() => router.back()}
							disabled={isPending}
							style={{ flex: 1 }}
						>
							<Button.Text>{generalT('cancel')}</Button.Text>
						</Button.Root>
						<Button.Root
							testID='submit-button'
							size='md'
							onPress={handleSubmit}
							disabled={isPending || leaseLoading || !activeLease}
							style={{ flex: 1 }}
						>
							<Button.Text>{isPending ? '...' : t('submit')}</Button.Text>
						</Button.Root>
					</View>
				</View>
			</View>

			<ErrorModal
				showModal={showErrorModal}
				setShowModal={setShowErrorModal}
				errorMessage={errorMessage}
			/>

			<Modal
				visible={showSuccessModal}
				transparent
				animationType='fade'
				onRequestClose={navigateToDetail}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<View style={styles.successIconContainer}>
							<CheckCircle size={40} color={colors.success['500']} />
						</View>
						<Text
							size='lg'
							fontWeight='bold'
							style={{ color: colors.neutral['700'], textAlign: 'center' }}
						>
							{t('request_submitted')}
						</Text>
						<Text style={{ color: colors.neutral['500'], textAlign: 'center' }}>
							{t('request_submitted_description')}
						</Text>
						<Button.Root
							testID='success-continue-button'
							onPress={navigateToDetail}
							style={{ width: '100%' }}
						>
							<Button.Text>{generalT('continue')}</Button.Text>
						</Button.Root>
					</View>
				</View>
			</Modal>
		</>
	)
}

export default CreateMaintenanceRequest

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	formContainer: {
		paddingHorizontal: 16,
		paddingBottom: 24,
		gap: 20,
	},
	fieldContainer: {
		gap: 8,
	},
	label: {
		color: colors.neutral['700'],
	},
	input: {
		borderWidth: 1,
		borderColor: colors.neutral['40'],
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 10,
		color: colors.neutral['700'],
		fontSize: 14,
	},
	inputError: {
		borderColor: colors.error['500'],
	},
	textArea: {
		minHeight: 100,
	},
	errorText: {
		color: colors.error['500'],
	},
	optionGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	optionChip: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: colors.neutral['30'],
		backgroundColor: 'white',
	},
	optionChipSelected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	optionChipText: {
		color: colors.neutral['600'],
	},
	optionChipTextSelected: {
		color: 'white',
	},
	photoHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	photoRow: {
		flexDirection: 'row',
		gap: 8,
		paddingBottom: 4,
	},
	photoThumb: {
		width: 80,
		height: 80,
		borderRadius: 8,
		overflow: 'hidden',
		position: 'relative',
	},
	photoImage: {
		width: '100%',
		height: '100%',
	},
	removePhotoButton: {
		position: 'absolute',
		top: 4,
		right: 4,
		backgroundColor: 'rgba(0,0,0,0.5)',
		borderRadius: 10,
		padding: 2,
	},
	addPhotoButton: {
		borderWidth: 1,
		borderColor: colors.neutral['40'],
		borderRadius: 8,
		paddingVertical: 16,
		alignItems: 'center',
		gap: 8,
		flexDirection: 'row',
		justifyContent: 'center',
	},
	bottomActions: {
		paddingHorizontal: 16,
		paddingBottom: 32,
		gap: 16,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 12,
	},
	noLeaseContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	modalCard: {
		backgroundColor: 'white',
		borderRadius: 16,
		padding: 24,
		width: '100%',
		gap: 16,
		alignItems: 'center',
	},
	successIconContainer: {
		backgroundColor: colors.success['50'],
		padding: 16,
		borderRadius: 50,
	},
	trashIcon: {
		color: colors.error['500'],
	},
})
