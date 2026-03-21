import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { PaymentStatus } from '@leaselink/shared'
import PaymentList from '@/components/Payments/PaymentList'

const ALL_FILTER = 'ALL'

const statusFilters = [
	{ key: ALL_FILTER, label: 'All' },
	{ key: PaymentStatus.UPCOMING, label: 'Upcoming' },
	{ key: PaymentStatus.PENDING, label: 'Pending' },
	{ key: PaymentStatus.PAID, label: 'Paid' },
	{ key: PaymentStatus.OVERDUE, label: 'Overdue' },
]

const Payments = () => {
	const [statusFilter, setStatusFilter] = useState(ALL_FILTER)

	return (
		<ScrollView
			nestedScrollEnabled
			style={{ backgroundColor: colors.neutral['10'] }}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{
				backgroundColor: colors.neutral['10'],
				gap: 20,
				flexGrow: 1,
			}}
		>
			<View style={{ gap: 8 }}>
				<Heading
					size='h6'
					fontWeight='bold'
					style={{ color: colors.neutral['600'] }}
				>
					Payments
				</Heading>
				<Text style={{ color: colors.neutral['700'] }}>
					View and manage your rent payments
				</Text>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filtersContainer}
			>
				{statusFilters.map((filter) => {
					const isSelected = statusFilter === filter.key
					return (
						<Pressable
							key={filter.key}
							testID={`filter-${filter.key.toLowerCase()}`}
							style={[styles.chip, isSelected && styles.chipSelected]}
							onPress={() => setStatusFilter(filter.key)}
						>
							<Text
								size='sm'
								style={[styles.chipText, isSelected && styles.chipTextSelected]}
								fontWeight={isSelected ? 'bold' : 'regular'}
							>
								{filter.label}
							</Text>
						</Pressable>
					)
				})}
			</ScrollView>

			<View style={{ flex: 1, minHeight: 400 }}>
				<PaymentList statusFilter={statusFilter} scrollEnabled={false} />
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	filtersContainer: {
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
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	chipText: {
		color: colors.neutral['600'],
	},
	chipTextSelected: {
		color: 'white',
	},
})

export default Payments
