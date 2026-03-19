import { Heading, Text, Button } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { CreditCard, Wrench, ChevronRight } from 'lucide-react-native'
import dayjs from 'dayjs'
import { PaymentStatus } from '@leaselink/shared'
import { useNextPaymentDue } from '@/hooks/usePayments'
import PaymentStatusBadge from '@/components/Payments/PaymentStatusBadge'
import { authClient } from '@/services/auth'

const Home = () => {
	const router = useRouter()
	const user = authClient.useSession().data?.user
	const { nextPayment, isLoading } = useNextPaymentDue()

	const formattedAmount = nextPayment
		? new Intl.NumberFormat('en-GB', {
				style: 'currency',
				currency: 'GBP',
			}).format(nextPayment.amount / 100)
		: ''

	const isPendingOrOverdue =
		nextPayment?.status === PaymentStatus.PENDING ||
		nextPayment?.status === PaymentStatus.OVERDUE

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

			{/* Next Payment Card */}
			<View style={styles.card}>
				<Text fontWeight='bold' style={styles.cardTitle}>
					Next Payment
				</Text>

				{isLoading ? (
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
							<CreditCard size={20} color={colors['primary-green']['500']} />
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
							<Wrench size={20} color={colors['primary-green']['500']} />
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
	paymentCardContent: {
		gap: 8,
	},
	paymentRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	paymentAmount: {
		fontSize: 28,
		color: colors.neutral['700'],
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
		backgroundColor: colors['primary-green']['50'],
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
