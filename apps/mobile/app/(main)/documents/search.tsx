import { View } from 'react-native'
import DocumentsList from '@/components/Documents/DocumentsList'
import { ArrowLeft, Search } from 'lucide-react-native'
import { colors } from '@/design-system/theme'
import { Text } from '@/design-system/components/Typography'
import { TextInputCompound as TextInput } from '@/design-system/components/TextInputCompound'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { KeyboardAvoidingView } from '@/components/Layout/KeyboardAvoidingView'
import { useTranslation } from 'react-i18next'

const DocumentSearch = () => {
	const params = useLocalSearchParams()
	const router = useRouter()
	const { t } = useTranslation('documents')
	const { t: generalT } = useTranslation('general')

	const search = (params.search as string) || ''

	return (
		<KeyboardAvoidingView>
			<View
				testID='document-search-content'
				style={{
					height: '100%',
					gap: 24,
					backgroundColor: 'white',
				}}
			>
				<View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
					<ArrowLeft
						onPress={() => {
							router.back()
						}}
						size={24}
						color={colors.neutral['500']}
						testID='close-search'
					/>
					<TextInput.Root style={{ maxWidth: '90%' }}>
						<Search size={20} color={colors.neutral['500']} />
						<TextInput.Control
							autoCapitalize='none'
							keyboardType='email-address'
							placeholder={generalT('search')}
							testID='search-input'
							value={search}
							autoFocus
							onChangeText={(text) => {
								router.setParams({
									search: text,
								})
							}}
						/>
					</TextInput.Root>
				</View>
				<View
					style={{
						gap: 16,
						flex: 1,
					}}
				>
					<Text style={{ color: colors.neutral['700'] }} fontWeight='bold'>
						{!search ? t('recent_searches') : `${t('matching_search_results')}`}
					</Text>
					<DocumentsList withSearch={true} />
				</View>
			</View>
		</KeyboardAvoidingView>
	)
}

export default DocumentSearch
