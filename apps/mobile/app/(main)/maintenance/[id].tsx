import { Button, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { X, CheckCircle } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
	Alert,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
} from 'react-native'
import { Image } from 'expo-image'
import dayjs from 'dayjs'
import {
	MAINTENANCE_CATEGORY_LABELS,
	MAINTENANCE_STATUS_LABELS,
	MaintenanceCategory,
	MaintenancePriority,
	MaintenanceStatus,
} from '@leaselink/shared'
import {
	useMaintenanceRequest,
	useCloseMaintenanceRequest,
} from '@/hooks/useMaintenanceRequests'
import MaintenanceStatusBadge from '@/components/Maintenance/MaintenanceStatusBadge'
import MaintenancePriorityBadge from '@/components/Maintenance/MaintenancePriorityBadge'
import { ErrorModal } from '@/components/ErrorModal'
import { useState } from 'react'

const statusSteps = [
	MaintenanceStatus.OPEN,
	MaintenanceStatus.IN_PROGRESS,
	MaintenanceStatus.RESOLVED,
	MaintenanceStatus.CLOSED,
]

const MaintenanceDetail = () => {
	const { id } = useLocalSearchParams<{ id: string }>()
	const router = useRouter()
	const { t } = useTranslation('maintenance')
	const { t: generalT } = useTranslation('general')
	const { t: dateT } = useTranslation('format_date')

	const [showCloseConfirm, setShowCloseConfirm] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const { data: request, isLoading } = useMaintenanceRequest(id)
	const { mutateAsync: closeRequest, isPending: isClosing } =
		useCloseMaintenanceRequest()

	const handleCloseRequest = async () => {
		try {
			await closeRequest(id)
			setShowCloseConfirm(false)
			setShowSuccessModal(true)
		} catch (error) {
			setShowCloseConfirm(false)
			const msg = error instanceof Error ? error.message : 'Failed to close request'
			setErrorMessage(msg)
			setShowErrorModal(true)
		}
	}

	const currentStepIndex = request
		? statusSteps.indexOf(request.status as MaintenanceStatus)
		: 0

	if (isLoading) {
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
				<View style={styles.loadingContainer}>
					{Array.from({ length: 5 }).map((_, i) => (
						<View key={i} style={styles.skeleton} />
					))}
				</View>
			</View>
		)
	}

	if (!request) {
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
				<View style={styles.emptyContainer}>
					<Text size='lg' style={{ color: colors.neutral['500'] }}>
						Request not found
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
						style={{ color: colors.neutral['700'], flex: 1 }}
						numberOfLines={1}
						ellipsizeMode='tail'
					>
						{request.title}
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
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					{/* Badges */}
					<View style={styles.badgeRow}>
						<MaintenanceStatusBadge status={request.status} />
						<MaintenancePriorityBadge priority={request.priority} />
					</View>

					{/* Category */}
					<View style={styles.infoRow}>
						<Text fontWeight='bold' style={styles.infoLabel}>
							{t('category')}
						</Text>
						<Text style={styles.infoValue}>
							{MAINTENANCE_CATEGORY_LABELS[
								request.category as MaintenanceCategory
							] ?? request.category}
						</Text>
					</View>

					{/* Description */}
					<View style={styles.section}>
						<Text fontWeight='bold' style={styles.sectionTitle}>
							{t('description')}
						</Text>
						<Text style={styles.description}>{request.description}</Text>
					</View>

					{/* Status Timeline */}
					<View style={styles.section}>
						<Text fontWeight='bold' style={styles.sectionTitle}>
							{t('status')}
						</Text>
						<View style={styles.timeline}>
							{statusSteps.map((step, index) => {
								const isCompleted = index <= currentStepIndex
								const isActive = index === currentStepIndex

								return (
									<View key={step} style={styles.timelineItem}>
										<View style={styles.timelineLeft}>
											<View
												style={[
													styles.timelineDot,
													isCompleted && styles.timelineDotCompleted,
													isActive && styles.timelineDotActive,
												]}
											/>
											{index < statusSteps.length - 1 && (
												<View
													style={[
														styles.timelineLine,
														index < currentStepIndex && styles.timelineLineCompleted,
													]}
												/>
											)}
										</View>
										<Text
											size='sm'
											style={[
												styles.timelineLabel,
												isCompleted && styles.timelineLabelCompleted,
											]}
											fontWeight={isActive ? 'bold' : 'regular'}
										>
											{MAINTENANCE_STATUS_LABELS[step]}
										</Text>
									</View>
								)
							})}
						</View>
					</View>

					{/* Photos */}
					{request.photoUrls && request.photoUrls.length > 0 && (
						<View style={styles.section}>
							<Text fontWeight='bold' style={styles.sectionTitle}>
								{t('photos')}
							</Text>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.photosRow}
							>
								{request.photoUrls.map((url, index) => (
									<Image
										key={`${url}-${index}`}
										source={{ uri: url }}
										style={styles.photo}
										contentFit='cover'
									/>
								))}
							</ScrollView>
						</View>
					)}

					{/* Dates */}
					<View style={styles.section}>
						<View style={styles.infoRow}>
							<Text fontWeight='bold' style={styles.infoLabel}>
								{t('created_at')}
							</Text>
							<Text style={styles.infoValue}>
								{dayjs(request.createdAt).format('DD MMM YYYY')}
							</Text>
						</View>

						{request.resolvedAt && (
							<View style={styles.infoRow}>
								<Text fontWeight='bold' style={styles.infoLabel}>
									{t('resolved_at')}
								</Text>
								<Text style={styles.infoValue}>
									{dayjs(request.resolvedAt).format('DD MMM YYYY')}
								</Text>
							</View>
						)}
					</View>

					{/* Action */}
					{request.status === MaintenanceStatus.RESOLVED && (
						<Button.Root
							testID='close-request-button'
							variant='secondary'
							color='neutral'
							onPress={() => setShowCloseConfirm(true)}
							disabled={isClosing}
							style={{ marginTop: 8 }}
						>
							<Button.Text>{t('close_request')}</Button.Text>
						</Button.Root>
					)}

					{request.status !== MaintenanceStatus.RESOLVED &&
						request.status !== MaintenanceStatus.CLOSED && (
							<View style={styles.statusInfo}>
								<Text size='sm' style={{ color: colors.neutral['500'], textAlign: 'center' }}>
									{MAINTENANCE_STATUS_LABELS[request.status as MaintenanceStatus]}
								</Text>
							</View>
						)}
				</ScrollView>
			</View>

			{/* Close Confirmation */}
			<Modal
				visible={showCloseConfirm}
				transparent
				animationType='fade'
				onRequestClose={() => setShowCloseConfirm(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text
							size='lg'
							fontWeight='bold'
							style={{ color: colors.neutral['700'], textAlign: 'center' }}
						>
							{t('close_request')}
						</Text>
						<Text style={{ color: colors.neutral['500'], textAlign: 'center' }}>
							Are you sure you want to close this request?
						</Text>
						<View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
							<Button.Root
								testID='cancel-close-button'
								variant='secondary'
								color='neutral'
								onPress={() => setShowCloseConfirm(false)}
								style={{ flex: 1 }}
							>
								<Button.Text>{generalT('cancel')}</Button.Text>
							</Button.Root>
							<Button.Root
								testID='confirm-close-button'
								onPress={handleCloseRequest}
								disabled={isClosing}
								style={{ flex: 1 }}
							>
								<Button.Text>{generalT('confirm')}</Button.Text>
							</Button.Root>
						</View>
					</View>
				</View>
			</Modal>

			{/* Success Modal */}
			<Modal
				visible={showSuccessModal}
				transparent
				animationType='fade'
				onRequestClose={() => setShowSuccessModal(false)}
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
							{t('request_closed')}
						</Text>
						<Text style={{ color: colors.neutral['500'], textAlign: 'center' }}>
							{t('request_closed_description')}
						</Text>
						<Button.Root
							testID='success-done-button'
							onPress={() => setShowSuccessModal(false)}
							style={{ width: '100%' }}
						>
							<Button.Text>{generalT('done')}</Button.Text>
						</Button.Root>
					</View>
				</View>
			</Modal>

			<ErrorModal
				showModal={showErrorModal}
				setShowModal={setShowErrorModal}
				errorMessage={errorMessage}
			/>
		</>
	)
}

export default MaintenanceDetail

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 32,
		gap: 20,
	},
	badgeRow: {
		flexDirection: 'row',
		gap: 8,
		flexWrap: 'wrap',
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	infoLabel: {
		color: colors.neutral['600'],
	},
	infoValue: {
		color: colors.neutral['500'],
	},
	section: {
		gap: 12,
	},
	sectionTitle: {
		color: colors.neutral['700'],
	},
	description: {
		color: colors.neutral['600'],
		lineHeight: 22,
	},
	timeline: {
		gap: 0,
	},
	timelineItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		minHeight: 40,
	},
	timelineLeft: {
		alignItems: 'center',
		width: 16,
	},
	timelineDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: colors.neutral['30'],
		borderWidth: 2,
		borderColor: colors.neutral['200'] ?? colors.neutral['30'],
		marginTop: 4,
	},
	timelineDotCompleted: {
		backgroundColor: colors['primary-green']['500'],
		borderColor: colors['primary-green']['500'],
	},
	timelineDotActive: {
		backgroundColor: 'white',
		borderColor: colors['primary-green']['500'],
		borderWidth: 3,
	},
	timelineLine: {
		width: 2,
		flex: 1,
		backgroundColor: colors.neutral['30'],
		marginTop: 2,
		minHeight: 24,
	},
	timelineLineCompleted: {
		backgroundColor: colors['primary-green']['500'],
	},
	timelineLabel: {
		color: colors.neutral['400'],
		paddingTop: 2,
		flex: 1,
	},
	timelineLabelCompleted: {
		color: colors.neutral['600'],
	},
	photosRow: {
		flexDirection: 'row',
		gap: 8,
	},
	photo: {
		width: 120,
		height: 120,
		borderRadius: 8,
	},
	loadingContainer: {
		paddingHorizontal: 16,
		gap: 12,
	},
	skeleton: {
		height: 40,
		borderRadius: 8,
		backgroundColor: colors.neutral['40'],
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	statusInfo: {
		padding: 16,
		backgroundColor: colors.neutral['10'],
		borderRadius: 8,
		alignItems: 'center',
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
})
