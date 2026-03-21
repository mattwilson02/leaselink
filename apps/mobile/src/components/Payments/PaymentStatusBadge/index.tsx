import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
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
		background: colors.info[100],
		text: colors.info[700],
	},
	[PaymentStatus.PAID]: {
		background: colors.success[100],
		text: colors.success[700],
	},
	[PaymentStatus.OVERDUE]: {
		background: colors.error[100],
		text: colors.error[700],
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
			<Text
				size='xs'
				style={[styles.text, { color: colorScheme.text }]}
				fontWeight='bold'
			>
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
