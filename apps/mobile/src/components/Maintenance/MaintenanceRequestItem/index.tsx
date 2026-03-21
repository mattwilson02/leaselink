import { memo } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { MAINTENANCE_CATEGORY_LABELS, MaintenanceCategory } from '@leaselink/shared'
import { formatDate } from '@/utils/format-date'
import MaintenanceStatusBadge from '../MaintenanceStatusBadge'
import MaintenancePriorityBadge from '../MaintenancePriorityBadge'
import type { MaintenanceRequestDTO } from '@/hooks/useMaintenanceRequests'

type Props = {
	request: MaintenanceRequestDTO
}

const MaintenanceRequestItem = ({ request }: Props) => {
	const router = useRouter()
	const { t: dateT } = useTranslation('format_date')

	const categoryLabel =
		MAINTENANCE_CATEGORY_LABELS[request.category as MaintenanceCategory] ??
		request.category

	const formattedDate = formatDate(request.createdAt)

	return (
		<Pressable
			testID='maintenance-request-item'
			style={styles.container}
			onPress={() => router.push(`/maintenance/${request.id}`)}
		>
			<View style={styles.topRow}>
				<Text style={styles.title} fontWeight='bold' numberOfLines={1} ellipsizeMode='tail'>
					{request.title}
				</Text>
			</View>

			<Text size='sm' style={styles.category}>
				{categoryLabel}
			</Text>

			<View style={styles.badgeRow}>
				<MaintenancePriorityBadge priority={request.priority} />
				<MaintenanceStatusBadge status={request.status} />
			</View>

			<Text size='xs' style={styles.date}>
				{formattedDate.type === 'alias'
					? dateT(formattedDate.value)
					: formattedDate.value}
			</Text>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.card,
		gap: 8,
	},
	topRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	title: {
		color: colors.neutral['700'],
		flex: 1,
	},
	category: {
		color: colors.mutedForeground,
	},
	badgeRow: {
		flexDirection: 'row',
		gap: 8,
		flexWrap: 'wrap',
	},
	date: {
		color: colors.neutral['300'],
	},
})

export default memo(MaintenanceRequestItem)
