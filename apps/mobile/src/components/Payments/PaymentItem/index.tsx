import { memo } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useRouter } from 'expo-router'
import dayjs from 'dayjs'
import { PaymentStatus } from '@leaselink/shared'
import PaymentStatusBadge from '../PaymentStatusBadge'
import type { PaymentDTO } from '@/hooks/usePayments'

type Props = {
	payment: PaymentDTO
}

const PaymentItem = ({ payment }: Props) => {
	const router = useRouter()

	const formattedAmount = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(payment.amount)

	const formattedDueDate = dayjs(payment.dueDate).format('DD MMM YYYY')
	const formattedPaidDate = payment.paidAt
		? dayjs(payment.paidAt).format('DD MMM YYYY')
		: null

	return (
		<Pressable
			testID='payment-item'
			style={styles.container}
			onPress={() => router.push(`/payments/${payment.id}`)}
		>
			<View style={styles.topRow}>
				<Text fontWeight='bold' size='lg' style={styles.amount}>
					{formattedAmount}
				</Text>
				<PaymentStatusBadge status={payment.status} />
			</View>

			<Text size='sm' style={styles.dateLabel}>
				Due: {formattedDueDate}
			</Text>

			{payment.status === PaymentStatus.PAID && formattedPaidDate && (
				<Text size='sm' style={styles.paidDate}>
					Paid: {formattedPaidDate}
				</Text>
			)}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.neutral['30'],
		backgroundColor: 'white',
		gap: 8,
	},
	topRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	amount: {
		color: colors.neutral['700'],
	},
	dateLabel: {
		color: colors.neutral['500'],
	},
	paidDate: {
		color: colors.success['600'],
	},
})

export default memo(PaymentItem)
