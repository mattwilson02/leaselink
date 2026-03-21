import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { MaintenancePriority, MAINTENANCE_PRIORITY_LABELS } from '@leaselink/shared'

type Props = {
	priority: string
}

const priorityColors: Record<string, { background: string; text: string }> = {
	[MaintenancePriority.LOW]: {
		background: colors.neutral['100'],
		text: colors.neutral['500'],
	},
	[MaintenancePriority.MEDIUM]: {
		background: colors.info[100],
		text: colors.info[700],
	},
	[MaintenancePriority.HIGH]: {
		background: colors.warning[100],
		text: colors.warning[700],
	},
	[MaintenancePriority.EMERGENCY]: {
		background: colors.error[100],
		text: colors.error[700],
	},
}

const MaintenancePriorityBadge = ({ priority }: Props) => {
	const colorScheme = priorityColors[priority] ?? {
		background: colors.neutral['100'],
		text: colors.neutral['500'],
	}

	const label =
		MAINTENANCE_PRIORITY_LABELS[priority as MaintenancePriority] ?? priority

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

export default memo(MaintenancePriorityBadge)
