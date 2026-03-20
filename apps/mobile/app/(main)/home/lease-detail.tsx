import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useRouter } from 'expo-router'
import { ArrowLeft, MapPin, FileText, ChevronRight } from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import dayjs from 'dayjs'
import {
	LeaseStatus,
	LEASE_STATUS_LABELS,
	PROPERTY_TYPE_LABELS,
	DocumentFolder,
} from '@leaselink/shared'
import { useMyActiveLease } from '@/hooks/useLeases'

const leaseStatusColor: Record<string, string> = {
	[LeaseStatus.ACTIVE]: colors.success['600'],
	[LeaseStatus.PENDING]: colors.warning['600'],
	[LeaseStatus.EXPIRED]: colors.neutral['500'],
	[LeaseStatus.TERMINATED]: colors.error['600'],
}

const leaseStatusBackground: Record<string, string> = {
	[LeaseStatus.ACTIVE]: colors.success['50'],
	[LeaseStatus.PENDING]: colors.warning['50'],
	[LeaseStatus.EXPIRED]: colors.neutral['30'],
	[LeaseStatus.TERMINATED]: colors.error['50'],
}

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(amount)

const LeaseDetail = () => {
	const router = useRouter()
	const { activeLease, isLoading } = useMyActiveLease()

	if (isLoading) {
		return (
			<View style={{ flex: 1, backgroundColor: 'white' }}>
				<View style={styles.header}>
					<Pressable
						testID='back-button'
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<ArrowLeft size={24} color={colors.neutral['700']} />
					</Pressable>
					<Text size='lg' fontWeight='bold' style={styles.headerTitle}>
						Lease Details
					</Text>
					<View style={styles.headerSpacer} />
				</View>
				<View style={styles.loadingContainer}>
					{Array.from({ length: 6 }).map((_, i) => (
						<View key={i} style={styles.skeleton} />
					))}
				</View>
			</View>
		)
	}

	if (!activeLease) {
		return (
			<View style={{ flex: 1, backgroundColor: 'white' }}>
				<View style={styles.header}>
					<Pressable
						testID='back-button'
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<ArrowLeft size={24} color={colors.neutral['700']} />
					</Pressable>
					<Text size='lg' fontWeight='bold' style={styles.headerTitle}>
						Lease Details
					</Text>
					<View style={styles.headerSpacer} />
				</View>
				<View style={styles.emptyContainer}>
					<Text size='lg' style={{ color: colors.neutral['500'] }}>
						No active lease found
					</Text>
				</View>
			</View>
		)
	}

	const statusColor = leaseStatusColor[activeLease.status] ?? colors.neutral['500']
	const statusBg = leaseStatusBackground[activeLease.status] ?? colors.neutral['30']
	const statusLabel =
		LEASE_STATUS_LABELS[activeLease.status as LeaseStatus] ?? activeLease.status

	const propertyTypeLabel = activeLease.property?.propertyType
		? PROPERTY_TYPE_LABELS[activeLease.property.propertyType]
		: null

	const leaseAgreementsFolder = encodeURIComponent(DocumentFolder.LEASE_AGREEMENTS)

	return (
		<View style={{ flex: 1, backgroundColor: 'white' }}>
			<View style={styles.header}>
				<Pressable
					testID='back-button'
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<ArrowLeft size={24} color={colors.neutral['700']} />
				</Pressable>
				<Text size='lg' fontWeight='bold' style={styles.headerTitle}>
					Lease Details
				</Text>
				<View style={styles.headerSpacer} />
			</View>

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Status badge */}
				<View style={styles.statusRow}>
					<View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor }]}>
						<Text size='sm' fontWeight='bold' style={{ color: statusColor }}>
							{statusLabel}
						</Text>
					</View>
				</View>

				{/* Property Section */}
				<View style={styles.section}>
					<Text fontWeight='bold' style={styles.sectionTitle}>
						Property
					</Text>

					<View style={styles.addressRow}>
						<MapPin size={16} color={colors['primary-green']['500']} style={{ marginTop: 2 }} />
						<Text fontWeight='bold' style={styles.addressText}>
							{activeLease.property?.address ?? 'Address unavailable'}
						</Text>
					</View>

					{(activeLease.property?.city || activeLease.property?.state) && (
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Location</Text>
							<Text style={styles.infoValue}>
								{[activeLease.property.city, activeLease.property.state]
									.filter(Boolean)
									.join(', ')}
							</Text>
						</View>
					)}

					{propertyTypeLabel && (
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Property type</Text>
							<View style={styles.typeBadge}>
								<Text size='sm' style={styles.typeBadgeText}>
									{propertyTypeLabel}
								</Text>
							</View>
						</View>
					)}
				</View>

				<View style={styles.divider} />

				{/* Lease Section */}
				<View style={styles.section}>
					<Text fontWeight='bold' style={styles.sectionTitle}>
						Lease Terms
					</Text>

					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Start date</Text>
						<Text style={styles.infoValue}>
							{dayjs(activeLease.startDate).format('D MMM YYYY')}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>End date</Text>
						<Text style={styles.infoValue}>
							{dayjs(activeLease.endDate).format('D MMM YYYY')}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Monthly rent</Text>
						<Text fontWeight='bold' style={[styles.infoValue, { color: colors.neutral['700'] }]}>
							{formatCurrency(activeLease.monthlyRent)}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text style={styles.infoLabel}>Security deposit</Text>
						<Text style={styles.infoValue}>
							{formatCurrency(activeLease.securityDeposit)}
						</Text>
					</View>
				</View>

				<View style={styles.divider} />

				{/* Documents Section */}
				<View style={styles.section}>
					<Text fontWeight='bold' style={styles.sectionTitle}>
						Documents
					</Text>

					<Pressable
						testID='view-lease-documents-button'
						style={styles.documentsLink}
						onPress={() =>
							router.push(`/document-folder/${leaseAgreementsFolder}`)
						}
					>
						<View style={styles.documentsLinkIcon}>
							<FileText size={20} color={colors['primary-green']['500']} />
						</View>
						<Text style={styles.documentsLinkText}>View lease documents</Text>
						<ChevronRight size={16} color={colors.neutral['400']} />
					</Pressable>
				</View>
			</ScrollView>
		</View>
	)
}

export default LeaseDetail

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		color: colors.neutral['700'],
		flex: 1,
		textAlign: 'center',
	},
	headerSpacer: {
		width: 32,
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 32,
		gap: 20,
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
	statusRow: {
		flexDirection: 'row',
	},
	statusBadge: {
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 6,
		borderWidth: 1,
	},
	section: {
		gap: 12,
	},
	sectionTitle: {
		color: colors.neutral['700'],
	},
	addressRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 6,
	},
	addressText: {
		fontSize: 16,
		color: colors.neutral['700'],
		flex: 1,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	infoLabel: {
		color: colors.neutral['500'],
	},
	infoValue: {
		color: colors.neutral['600'],
	},
	typeBadge: {
		backgroundColor: colors['primary-green']['50'],
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	typeBadgeText: {
		color: colors['primary-green']['700'],
	},
	divider: {
		height: 1,
		backgroundColor: colors.neutral['30'],
	},
	documentsLink: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 4,
	},
	documentsLinkIcon: {
		width: 36,
		height: 36,
		borderRadius: 8,
		backgroundColor: colors['primary-green']['50'],
		justifyContent: 'center',
		alignItems: 'center',
	},
	documentsLinkText: {
		color: colors.neutral['600'],
		flex: 1,
	},
})
