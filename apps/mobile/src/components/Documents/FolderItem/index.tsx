import { memo } from 'react'
import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { View, Pressable } from 'react-native'
import { Icon } from '@/components/Icon'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

type Props = {
	folderName: string
	fileCount: number
	size: number
	mostRecentUpdatedDate: string
}

const FolderItem = ({
	folderName,
	fileCount,
	size,
	mostRecentUpdatedDate,
}: Props) => {
	const router = useRouter()
	const { t } = useTranslation('documents')
	const { t: tDetails } = useTranslation('document_details')

	const handlePress = () => {
		router.push(
			`/document-folder/${encodeURIComponent(folderName)}?mostRecentUpdatedDate=${mostRecentUpdatedDate}&fileCount=${fileCount}`,
		)
	}

	return (
		<Pressable onPress={handlePress} testID='folder-item-container'>
			<Icon.Root>
				<Icon.IconContainer
					style={{
						borderColor: colors.neutral['30'],
						borderWidth: 1,
						height: 'auto',
						width: 'auto',
						backgroundColor: 'white',
					}}
				>
					<View style={{ gap: 10 }}>
						<Icon.Icon
							name='folder-icon'
							size={54}
							stroke={colors['primary-green']['500']}
						/>
						<Text
							style={{
								color: colors.neutral['500'],
								fontWeight: 'bold',
							}}
						>
							{tDetails(`${folderName}`)}
						</Text>
						<Text
							style={{
								color: colors.neutral['500'],
							}}
						>
							{fileCount} {fileCount !== 1 ? t('files') : t('file')} -{' '}
							{size < 1024
								? `${size.toFixed(1)} KB`
								: `${(size / 1024).toFixed(1)} MB`}
						</Text>
					</View>
				</Icon.IconContainer>
			</Icon.Root>
		</Pressable>
	)
}

export default memo(FolderItem)
