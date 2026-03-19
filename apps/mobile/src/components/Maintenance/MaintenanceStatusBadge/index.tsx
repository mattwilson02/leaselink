import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { MaintenanceStatus, MAINTENANCE_STATUS_LABELS } from '@leaselink/shared'

type Props = {
	status: string
}

const statusColors: Record<string, { background: string; text: string }> = {
	[MaintenanceStatus.OPEN]: {
		background: colors['primary-green']['100'],
		text: colors['primary-green']['700'],
	},
	[MaintenanceStatus.IN_PROGRESS]: {
		background: colors.warning['100'],
		text: colors.warning['700'],
	},
	[MaintenanceStatus.RESOLVED]: {
		background: colors.success['100'],
		text: colors.success['700'],
	},
	[MaintenanceStatus.CLOSED]: {
		background: colors.neutral['100'],
		text: colors.neutral['500'],
	},
}

const MaintenanceStatusBadge = ({ status }: Props) => {
	const colorScheme = statusColors[status] ?? {
		background: colors.neutral['100'],
		text: colors.neutral['500'],
	}

	const label =
		MAINTENANCE_STATUS_LABELS[status as MaintenanceStatus] ?? status

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

export default memo(MaintenanceStatusBadge)
