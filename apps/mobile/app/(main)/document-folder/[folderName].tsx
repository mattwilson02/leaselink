import { Pressable, View } from 'react-native'
import { X, FolderClosed, Search } from 'lucide-react-native'
import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter, useLocalSearchParams } from 'expo-router'
import DocumentsList from '@/components/Documents/DocumentsList'
import { useTranslation } from 'react-i18next'

const DocumentFolder = () => {
	const router = useRouter()
	const params = useLocalSearchParams()
	const folderName =
		typeof params.folderName === 'string' ? params.folderName : ''
	const mostRecentUpdatedDate = params.mostRecentUpdatedDate
	const fileCount = params.fileCount
	const { t } = useTranslation('documents')
	const { t: tDetails } = useTranslation('document_details')

	return (
		<View style={{ backgroundColor: 'white', flex: 1, gap: 24 }}>
			<View
				style={{
					flexDirection: 'row',
					width: '100%',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<View
					style={{
						backgroundColor: colors.secondary,
						borderRadius: 12,
						padding: 12,
					}}
				>
					<FolderClosed size={24} color={colors.mutedForeground} />
				</View>

				<Pressable
					style={{ padding: 16 }}
					testID='back-button'
					onPress={() => router.back()}
				>
					<X size={24} color={colors.neutral['300']} />
				</Pressable>
			</View>
			<View
				style={{
					padding: 16,
					flexDirection: 'column',
					borderRadius: 8,
					borderColor: colors.neutral['30'],
					borderWidth: 1,
					gap: 32,
				}}
			>
				<Heading
					testID='document-folder-name'
					size='h6'
					style={{
						color: colors.neutral['500'],
						fontWeight: 'bold',
					}}
				>
					{tDetails(`${folderName}`)}
				</Heading>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						gap: 24,
					}}
				>
					<View style={{ flex: 1, gap: 8 }}>
						<Text style={{ color: colors.neutral['700'] }}>{t('files')}</Text>
						<Text
							size='base'
							style={{
								color: colors.neutral['300'],
							}}
						>
							{fileCount}
						</Text>
					</View>
					<View style={{ flex: 1, alignItems: 'flex-end', gap: 8 }}>
						<Text style={{ color: colors.neutral['700'] }}>
							{t('last_updated')}
						</Text>
						<Text
							size='base'
							style={{
								color: colors.neutral['300'],
							}}
						>
							{mostRecentUpdatedDate}
						</Text>
					</View>
				</View>
			</View>
			<View style={{ gap: 10, flex: 1 }}>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
						{t('files')}
					</Text>
					<Pressable
						style={{ padding: 8 }}
						testID='search-icon'
						onPress={() =>
							router.push(`/documents/search?folderName=${folderName}`)
						}
					>
						<Search size={20} color={colors.primary} />
					</Pressable>
				</View>
				<DocumentsList />
			</View>
		</View>
	)
}

export default DocumentFolder
