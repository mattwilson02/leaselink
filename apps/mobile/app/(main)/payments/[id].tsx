import { Button, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { X, CheckCircle } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import dayjs from 'dayjs'
import { PaymentStatus } from '@leaselink/shared'
import * as WebBrowser from 'expo-web-browser'
import { usePayment, useCreateCheckoutSession, useVerifyPayment } from '@/hooks/usePayments'
import PaymentStatusBadge from '@/components/Payments/PaymentStatusBadge'
import { ErrorModal } from '@/components/ErrorModal'

const PaymentDetail = () => {
	const { id } = useLocalSearchParams<{ id: string }>()
	const router = useRouter()

	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isOpeningBrowser, setIsOpeningBrowser] = useState(false)

	const { data: payment, isLoading, refetch } = usePayment(id)
	const { mutateAsync: createCheckoutSession } = useCreateCheckoutSession()
	const { mutateAsync: verifyPayment } = useVerifyPayment()

	const handlePayNow = async () => {
		try {
			setIsOpeningBrowser(true)
			const session = await createCheckoutSession(id)
			await WebBrowser.openBrowserAsync(session.url)
			// Verify payment status with Stripe (webhooks may not have fired yet)
			const verification = await verifyPayment(id)
			if (verification.status === 'PAID') {
				setShowSuccessModal(true)
			} else {
				// Refetch in case webhook arrived
				const result = await refetch()
				if (result.data?.status === PaymentStatus.PAID) {
					setShowSuccessModal(true)
				}
			}
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : 'Failed to initiate payment'
			setErrorMessage(msg)
			setShowErrorModal(true)
		} finally {
			setIsOpeningBrowser(false)
		}
	}

	const formattedAmount = payment
		? new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(payment.amount)
		: ''

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

	if (!payment) {
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
						Payment not found
					</Text>
				</View>
			</View>
		)
	}

	const isPendingOrOverdue =
		payment.status === PaymentStatus.PENDING ||
		payment.status === PaymentStatus.OVERDUE

	return (
		<>
			<View style={{ flex: 1, backgroundColor: 'white' }}>
				<View style={styles.header}>
					<Text
						size='lg'
						fontWeight='bold'
						style={{ color: colors.neutral['700'], flex: 1 }}
					>
						Payment Details
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
					{/* Amount */}
					<View style={styles.amountContainer}>
						<Text
							size='sm'
							style={{ color: colors.neutral['500'] }}
						>
							Amount due
						</Text>
						<Text
							fontWeight='bold'
							style={styles.amountText}
						>
							{formattedAmount}
						</Text>
						<PaymentStatusBadge status={payment.status} />
					</View>

					{/* Due Date */}
					<View style={styles.infoRow}>
						<Text fontWeight='bold' style={styles.infoLabel}>
							Due Date
						</Text>
						<Text style={styles.infoValue}>
							{dayjs(payment.dueDate).format('DD MMM YYYY')}
						</Text>
					</View>

					{/* Paid Date */}
					{payment.status === PaymentStatus.PAID && payment.paidAt && (
						<View style={styles.infoRow}>
							<Text fontWeight='bold' style={styles.infoLabel}>
								Paid On
							</Text>
							<Text style={[styles.infoValue, { color: colors.success['600'] }]}>
								{dayjs(payment.paidAt).format('DD MMM YYYY')}
							</Text>
						</View>
					)}

					{/* Upcoming info */}
					{payment.status === PaymentStatus.UPCOMING && (
						<View style={styles.statusInfo}>
							<Text size='sm' style={{ color: colors.neutral['500'], textAlign: 'center' }}>
								Payment not yet due
							</Text>
						</View>
					)}

					{/* Paid state */}
					{payment.status === PaymentStatus.PAID && (
						<View style={[styles.statusInfo, { backgroundColor: colors.success['50'] }]}>
							<CheckCircle size={20} color={colors.success['600']} />
							<Text
								size='sm'
								fontWeight='bold'
								style={{ color: colors.success['700'], textAlign: 'center' }}
							>
								This payment has been received
							</Text>
						</View>
					)}

					{/* Pay Now button */}
					{isPendingOrOverdue && (
						<Button.Root
							testID='pay-now-button'
							onPress={handlePayNow}
							disabled={isOpeningBrowser}
							style={{ marginTop: 8 }}
						>
							<Button.Text>
								{isOpeningBrowser ? 'Opening...' : 'Pay Now'}
							</Button.Text>
						</Button.Root>
					)}
				</ScrollView>
			</View>

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
							Payment Successful
						</Text>
						<Text style={{ color: colors.neutral['500'], textAlign: 'center' }}>
							Your payment has been received successfully.
						</Text>
						<Button.Root
							testID='success-done-button'
							onPress={() => setShowSuccessModal(false)}
							style={{ width: '100%' }}
						>
							<Button.Text>Done</Button.Text>
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

export default PaymentDetail

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
	amountContainer: {
		alignItems: 'center',
		paddingVertical: 24,
		gap: 8,
	},
	amountText: {
		fontSize: 28,
		lineHeight: 40,
		color: colors.neutral['700'],
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
	statusInfo: {
		padding: 16,
		backgroundColor: colors.neutral['10'],
		borderRadius: 8,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
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
