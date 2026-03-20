import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { PaymentStatus } from '@leaselink/shared'

type Props = {
	status: string
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
	[PaymentStatus.UPCOMING]: 'Upcoming',
	[PaymentStatus.PENDING]: 'Pending',
	[PaymentStatus.PAID]: 'Paid',
	[PaymentStatus.OVERDUE]: 'Overdue',
}

const statusColors: Record<string, { background: string; text: string }> = {
	[PaymentStatus.UPCOMING]: {
		background: colors.neutral['600'],
		text: '#FFFFFF',
	},
	[PaymentStatus.PENDING]: {
		background: '#DBEAFE',
		text: '#1D4ED8',
	},
	[PaymentStatus.PAID]: {
		background: colors.success['100'],
		text: colors.success['700'],
	},
	[PaymentStatus.OVERDUE]: {
		background: '#FEE2E2',
		text: '#DC2626',
	},
}

const PaymentStatusBadge = ({ status }: Props) => {
	const colorScheme = statusColors[status] ?? {
		background: colors.neutral['100'],
		text: colors.neutral['500'],
	}

	const label = PAYMENT_STATUS_LABELS[status] ?? status

	return (
		<View style={[styles.badge, { backgroundColor: colorScheme.background }]}>
			<Text size='xs' style={[styles.text, { color: colorScheme.text }]} fontWeight='bold'>
				{label}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		alignSelf: 'flex-start',
	},
	text: {
		textTransform: 'capitalize',
	},
})

export default memo(PaymentStatusBadge)
