import { memo } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useTranslation } from 'react-i18next'
import { MaintenanceStatus, MAINTENANCE_STATUS_LABELS } from '@leaselink/shared'

type Props = {
	selectedStatus: string
	onSelectStatus: (status: string) => void
}

const ALL_FILTER = 'ALL'

const statusFilters = [
	ALL_FILTER,
	MaintenanceStatus.OPEN,
	MaintenanceStatus.IN_PROGRESS,
	MaintenanceStatus.RESOLVED,
	MaintenanceStatus.CLOSED,
]

const MaintenanceFilters = ({ selectedStatus, onSelectStatus }: Props) => {
	const { t } = useTranslation('maintenance')

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
		>
			{statusFilters.map((status) => {
				const isSelected = selectedStatus === status
				const label =
					status === ALL_FILTER
						? t('all')
						: MAINTENANCE_STATUS_LABELS[status as MaintenanceStatus]

				return (
					<Pressable
						key={status}
						testID={`filter-${status.toLowerCase()}`}
						style={[styles.chip, isSelected && styles.chipSelected]}
						onPress={() => onSelectStatus(status)}
					>
						<Text
							size='sm'
							style={[styles.chipText, isSelected && styles.chipTextSelected]}
							fontWeight={isSelected ? 'bold' : 'regular'}
						>
							{label}
						</Text>
					</Pressable>
				)
			})}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: 8,
		paddingVertical: 4,
	},
	chip: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: colors.neutral['30'],
		backgroundColor: 'white',
	},
	chipSelected: {
		backgroundColor: colors['primary-green']['500'],
		borderColor: colors['primary-green']['500'],
	},
	chipText: {
		color: colors.neutral['600'],
	},
	chipTextSelected: {
		color: 'white',
	},
})

export default memo(MaintenanceFilters)
