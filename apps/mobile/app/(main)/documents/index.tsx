import { Heading, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { Filter, Search } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import DocumentsList from '@/components/Documents/DocumentsList'
import DocumentsFilters from '@/components/Documents/DocumentsFilters'
import FolderList from '@/components/Documents/FolderList'
import DocumentRequestsList from '@/components/Documents/DocumentRequestsList'
import { useRouter } from 'expo-router'
import { ScrollView } from 'react-native-gesture-handler'

const Documents = () => {
	const [openFilters, setOpenFilters] = useState(false)
	const router = useRouter()

	const { t } = useTranslation('documents')

	return (
		<>
			<ScrollView
				nestedScrollEnabled
				style={{ backgroundColor: colors.neutral['10'] }}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					backgroundColor: colors.neutral['10'],
					gap: 20,
				}}
			>
				<View style={{ gap: 8 }}>
					<Heading
						size='h6'
						fontWeight='bold'
						style={{ color: colors.neutral['600'] }}
					>
						{t('documents')}
					</Heading>
					<Text style={{ color: colors.neutral['700'] }}>
						{t('documents_description')}
					</Text>
				</View>

				<View style={{ height: 'auto', gap: 12, flexShrink: 1 }}>
					<Text
						style={{
							color: colors.neutral['700'],
						}}
						fontWeight='bold'
					>
						{t('folders')}
					</Text>
					<FolderList />
				</View>

				<DocumentRequestsList showPreview={true} />
				<View style={{ gap: 16, flex: 1 }}>
					<View
						style={{
							flexDirection: 'row',
							flexWrap: 'wrap',
							justifyContent: 'space-between',
						}}
					>
						<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
							{t('all_files')}
						</Text>

						<View
							style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
						>
							<Pressable
								style={{ padding: 8 }}
								onPress={() => router.push('/documents/search')}
							>
								<Search size={20} color={colors.neutral['700']} />
							</Pressable>
							<Pressable
								testID='open-filters-button'
								style={{ padding: 8 }}
								onPress={() => setOpenFilters(true)}
							>
								<Filter size={20} color={colors.neutral['700']} />
							</Pressable>
						</View>
					</View>
					<DocumentsList scrollEnabled={false} />
				</View>
			</ScrollView>
			<DocumentsFilters isVisible={openFilters} setIsVisible={setOpenFilters} />
		</>
	)
}

export default Documents
