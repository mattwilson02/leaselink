import { memo } from 'react'
import { View, Pressable } from 'react-native'
import { colors } from '@/design-system/theme'
import { Text } from '@/design-system/components/Typography'
import { DropdownMenuCompound } from '@/design-system/components/DropdownMenuCompound'
import { MoreVertical } from 'lucide-react-native'
import DocIcon from '@/assets/icons/doc.svg'
import { Icon } from '@/components/Icon'
import { useRouter } from 'expo-router'
import { useDownloadDocument } from '@/hooks/useDownloadDocument'
import { useTranslation } from 'react-i18next'
import { useViewDocumentByIdControllerViewDocument } from '@/gen/index'
import { queryClient } from '@/app/_layout'
import { formatDate } from '@/utils/format-date'

type Props = {
	name: string
	createdAt: string
	id: string
	size: number
	folder?: string
}

const DocumentItem = ({ name, id, createdAt, size }: Props) => {
	const { downloadDocument } = useDownloadDocument()
	const router = useRouter()
	const { t: dateT } = useTranslation('format_date')
	const { t } = useTranslation('documents')

	const { mutateAsync: viewDocument } =
		useViewDocumentByIdControllerViewDocument({
			mutation: {
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: [{ url: '/recently-viewed-documents' }],
					})
				},
			},
		})

	const openDocumentDetails = async () => {
		await viewDocument({ documentId: id })
		router.push(`/documents/${id}`)
	}

	return (
		<Pressable
			onPress={openDocumentDetails}
			testID='document-item-container'
			style={{
				padding: 16,
				flexDirection: 'row',
				justifyContent: 'space-between',
				borderRadius: 8,
				borderColor: colors.border,
				borderWidth: 1,
				backgroundColor: colors.card,
				alignItems: 'center',
			}}
		>
			<View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
				<DocIcon />
				<View style={{ gap: 4 }}>
					<Text style={{ color: colors.neutral['500'] }} fontWeight='bold'>
						{name}
					</Text>
					<View style={{ flexDirection: 'row', gap: 4 }}>
						<Text
							size='sm'
							style={{
								color: colors.neutral['300'],
							}}
						>
							{formatDate(createdAt).type === 'alias'
								? dateT(formatDate(createdAt).value)
								: formatDate(createdAt).value}
						</Text>
						<Text
							size='sm'
							style={{
								color: colors.neutral['300'],
							}}
						>
							-
						</Text>
						<Text
							size='sm'
							style={{
								color: colors.neutral['300'],
							}}
						>
							{size < 1024
								? `${size.toFixed(1)} KB`
								: `${(size / 1024).toFixed(1)} MB`}
						</Text>
					</View>
				</View>
			</View>

			<DropdownMenuCompound.Root>
				<DropdownMenuCompound.Trigger>
					<View onTouchEnd={(e) => e.stopPropagation()}>
						<MoreVertical size={20} color={colors.neutral['700']} />
					</View>
				</DropdownMenuCompound.Trigger>
				<DropdownMenuCompound.Content>
					<DropdownMenuCompound.Item
						testID='document-item-download'
						onPress={() => downloadDocument({ id, name })}
					>
						<View
							style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
							onTouchEnd={(e) => e.stopPropagation()}
						>
							<Icon.Icon
								name='download-01'
								size={16}
								color={colors.neutral['500']}
								strokeWidth={1.5}
							/>
							<Text style={{ color: colors.neutral['500'] }}>
								{t('download')}
							</Text>
						</View>
					</DropdownMenuCompound.Item>
				</DropdownMenuCompound.Content>
			</DropdownMenuCompound.Root>
		</Pressable>
	)
}

export default memo(DocumentItem)
