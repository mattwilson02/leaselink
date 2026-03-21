import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { CreditCard, Wrench, ChevronRight, MapPin } from 'lucide-react-native'
import dayjs from 'dayjs'
import { PaymentStatus, PROPERTY_TYPE_LABELS, LEASE_STATUS_LABELS, LeaseStatus } from '@leaselink/shared'
import { useNextPaymentDue } from '@/hooks/usePayments'
import { useMyActiveLease } from '@/hooks/useLeases'
import PaymentStatusBadge from '@/components/Payments/PaymentStatusBadge'
import { authClient } from '@/services/auth'

const leaseStatusColor: Record<string, string> = {
	[LeaseStatus.ACTIVE]: colors.success['600'],
	[LeaseStatus.PENDING]: colors.warning['600'],
	[LeaseStatus.EXPIRED]: colors.neutral['500'],
	[LeaseStatus.TERMINATED]: colors.error['600'],
}

const Home = () => {
	const router = useRouter()
	const user = authClient.useSession().data?.user
	const { nextPayment, isLoading: isPaymentsLoading } = useNextPaymentDue()
	const { activeLease, isLoading: isLeaseLoading } = useMyActiveLease()

	const formattedAmount = nextPayment
		? new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(nextPayment.amount)
		: ''

	const isPendingOrOverdue =
		nextPayment?.status === PaymentStatus.PENDING ||
		nextPayment?.status === PaymentStatus.OVERDUE

	const formattedMonthlyRent = activeLease
		? new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(activeLease.monthlyRent)
		: ''

	const formattedLeaseDates = activeLease
		? `${dayjs(activeLease.startDate).format('D MMM YYYY')} — ${dayjs(activeLease.endDate).format('D MMM YYYY')}`
		: ''

	const propertyTypeLabel =
		activeLease?.property?.propertyType
			? PROPERTY_TYPE_LABELS[activeLease.property.propertyType]
			: null

	const leaseStatusLabel = activeLease
		? LEASE_STATUS_LABELS[activeLease.status as LeaseStatus] ?? activeLease.status
		: null

	const leaseStatusTextColor =
		activeLease ? (leaseStatusColor[activeLease.status] ?? colors.neutral['500']) : colors.neutral['500']

	return (
		<ScrollView
			style={{ backgroundColor: colors.neutral['10'] }}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={styles.container}
		>
			{/* Greeting */}
			<View style={styles.greetingSection}>
				<Heading size='h5' fontWeight='bold' style={styles.heading}>
					Hello, {user?.name?.split(' ')[0] ?? 'there'}
				</Heading>
				<Text style={{ color: colors.neutral['600'] }}>
					Here is your rental overview
				</Text>
			</View>

			{/* Lease & Property Card */}
			<Pressable
				testID='lease-card'
				style={styles.card}
				onPress={() => activeLease && router.push('/home/lease-detail')}
			>
				<Text fontWeight='bold' style={styles.cardTitle}>
					Your Property
				</Text>

				{isLeaseLoading ? (
					<View style={styles.skeleton} />
				) : activeLease ? (
					<View style={styles.leaseCardContent}>
						{/* Address row */}
						<View style={styles.addressRow}>
							<MapPin size={16} color={colors.primary} style={styles.addressIcon} />
							<Text fontWeight='bold' style={styles.addressText}>
								{activeLease.property?.address ?? 'Address unavailable'}
								{activeLease.property?.city ? `, ${activeLease.property.city}` : ''}
							</Text>
						</View>

						{/* Badges row */}
						<View style={styles.badgesRow}>
							{propertyTypeLabel && (
								<View style={styles.typeBadge}>
									<Text size='sm' style={styles.typeBadgeText}>
										{propertyTypeLabel}
									</Text>
								</View>
							)}
							{leaseStatusLabel && (
								<View style={[styles.statusBadge, { borderColor: leaseStatusTextColor }]}>
									<Text size='sm' style={[styles.statusBadgeText, { color: leaseStatusTextColor }]}>
										{leaseStatusLabel}
									</Text>
								</View>
							)}
						</View>

						{/* Lease dates */}
						<Text size='sm' style={styles.leaseDates}>
							{formattedLeaseDates}
						</Text>

						{/* Monthly rent */}
						<Text size='sm' style={styles.monthlyRent}>
							{formattedMonthlyRent}/month
						</Text>

						{/* Tap hint */}
						<View style={styles.tapHintRow}>
							<Text size='sm' style={styles.tapHintText}>View lease details</Text>
							<ChevronRight size={14} color={colors.primary} />
						</View>
					</View>
				) : (
					<View style={styles.noLeaseContainer}>
						<Text fontWeight='bold' style={{ color: colors.neutral['500'] }}>
							No active lease
						</Text>
						<Text size='sm' style={{ color: colors.neutral['400'] }}>
							Contact your property manager for lease information
						</Text>
					</View>
				)}
			</Pressable>

			{/* Next Payment Card */}
			<View style={styles.card}>
				<Text fontWeight='bold' style={styles.cardTitle}>
					Next Payment
				</Text>

				{isPaymentsLoading ? (
					<View style={styles.skeleton} />
				) : nextPayment ? (
					<View style={styles.paymentCardContent}>
						<View style={styles.paymentRow}>
							<Text fontWeight='bold' style={styles.paymentAmount}>
								{formattedAmount}
							</Text>
							<PaymentStatusBadge status={nextPayment.status} />
						</View>
						<Text size='sm' style={{ color: colors.neutral['500'] }}>
							Due: {dayjs(nextPayment.dueDate).format('DD MMM YYYY')}
						</Text>
						{isPendingOrOverdue && (
							<Button.Root
								testID='pay-now-button'
								onPress={() => router.push(`/payments/${nextPayment.id}`)}
								style={{ marginTop: 8 }}
							>
								<Button.Text>Pay Now</Button.Text>
							</Button.Root>
						)}
					</View>
				) : (
					<View style={styles.caughtUpContainer}>
						<Text style={{ color: colors.success['600'] }} fontWeight='bold'>
							All caught up!
						</Text>
						<Text size='sm' style={{ color: colors.neutral['500'] }}>
							No outstanding payments
						</Text>
					</View>
				)}
			</View>

			{/* Quick Links */}
			<View style={styles.card}>
				<Text fontWeight='bold' style={styles.cardTitle}>
					Quick Links
				</Text>
				<View style={styles.quickLinksContainer}>
					<Pressable
						testID='quick-link-documents'
						style={styles.quickLink}
						onPress={() => router.push('/documents')}
					>
						<View style={styles.quickLinkIcon}>
							<CreditCard size={20} color={colors.primary} />
						</View>
						<Text style={styles.quickLinkText}>Documents</Text>
						<ChevronRight size={16} color={colors.neutral['400']} />
					</Pressable>

					<View style={styles.divider} />

					<Pressable
						testID='quick-link-maintenance'
						style={styles.quickLink}
						onPress={() => router.push('/maintenance')}
					>
						<View style={styles.quickLinkIcon}>
							<Wrench size={20} color={colors.primary} />
						</View>
						<Text style={styles.quickLinkText}>Maintenance</Text>
						<ChevronRight size={16} color={colors.neutral['400']} />
					</Pressable>
				</View>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.neutral['10'],
		gap: 16,
		flexGrow: 1,
		paddingBottom: 24,
	},
	greetingSection: {
		gap: 4,
	},
	heading: {
		color: colors.neutral['700'],
	},
	card: {
		backgroundColor: 'white',
		borderRadius: 12,
		padding: 16,
		gap: 12,
		borderWidth: 1,
		borderColor: colors.neutral['30'],
	},
	cardTitle: {
		color: colors.neutral['700'],
	},
	skeleton: {
		height: 60,
		borderRadius: 8,
		backgroundColor: colors.neutral['40'],
	},
	leaseCardContent: {
		gap: 8,
	},
	addressRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 6,
	},
	addressIcon: {
		marginTop: 2,
	},
	addressText: {
		fontSize: 16,
		color: colors.neutral['700'],
		flex: 1,
	},
	badgesRow: {
		flexDirection: 'row',
		gap: 8,
		flexWrap: 'wrap',
	},
	typeBadge: {
		backgroundColor: colors.neutral['20'],
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	typeBadgeText: {
		color: colors.foreground,
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
		borderWidth: 1,
	},
	statusBadgeText: {
		fontWeight: '500',
	},
	leaseDates: {
		color: colors.neutral['500'],
	},
	monthlyRent: {
		color: colors.neutral['700'],
		fontWeight: '600',
	},
	tapHintRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginTop: 4,
	},
	tapHintText: {
		color: colors.primary,
	},
	noLeaseContainer: {
		alignItems: 'center',
		paddingVertical: 12,
		gap: 4,
	},
	paymentCardContent: {
		gap: 8,
	},
	paymentRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	paymentAmount: {
		fontSize: 22,
		lineHeight: 32,
		color: colors.neutral['700'],
		flexShrink: 1,
	},
	caughtUpContainer: {
		alignItems: 'center',
		paddingVertical: 12,
		gap: 4,
	},
	quickLinksContainer: {
		gap: 0,
	},
	quickLink: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		gap: 12,
	},
	quickLinkIcon: {
		width: 36,
		height: 36,
		borderRadius: 8,
		backgroundColor: colors.neutral['20'],
		justifyContent: 'center',
		alignItems: 'center',
	},
	quickLinkText: {
		color: colors.neutral['600'],
		flex: 1,
	},
	divider: {
		height: 1,
		backgroundColor: colors.neutral['30'],
	},
})

export default Home
