import { Heading, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { Plus } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useRouter } from 'expo-router'
import MaintenanceRequestList from '@/components/Maintenance/MaintenanceRequestList'
import MaintenanceFilters from '@/components/Maintenance/MaintenanceFilters'

const Maintenance = () => {
	const [statusFilter, setStatusFilter] = useState('ALL')
	const router = useRouter()
	const { t } = useTranslation('maintenance')

	return (
		<>
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
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
					}}
				>
					<View style={{ gap: 8, flex: 1 }}>
						<Heading
							size='h6'
							fontWeight='bold'
							style={{ color: colors.neutral['600'] }}
						>
							{t('maintenance')}
						</Heading>
						<Text style={{ color: colors.neutral['700'] }}>
							{t('maintenance_description')}
						</Text>
					</View>

					<Pressable
						testID='create-request-button'
						onPress={() => router.push('/maintenance/create')}
						style={{
							backgroundColor: colors['primary-green']['500'],
							borderRadius: 8,
							padding: 10,
							marginLeft: 12,
						}}
					>
						<Plus size={20} color='white' />
					</Pressable>
				</View>

				<MaintenanceFilters
					selectedStatus={statusFilter}
					onSelectStatus={setStatusFilter}
				/>

				<View style={{ flex: 1, minHeight: 400 }}>
					<MaintenanceRequestList
						statusFilter={statusFilter}
						scrollEnabled={false}
					/>
				</View>
			</ScrollView>
		</>
	)
}

export default Maintenance
