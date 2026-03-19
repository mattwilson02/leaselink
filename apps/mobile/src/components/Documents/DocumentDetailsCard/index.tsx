import { Icon } from '@/components/Icon'
import type { GetDocumentsByClientIdControllerFindAllQueryParamsFoldersEnum } from '@/gen/index'
import { formatDate } from '@/utils/format-date'
import { getMimeType } from '@/utils/get-mime-type'
import { Heading, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

type Props = {
	name: string
	folder: GetDocumentsByClientIdControllerFindAllQueryParamsFoldersEnum
	createdAt: string
	fileSize: number
}

const DocumentDetailsCard = ({ name, folder, createdAt, fileSize }: Props) => {
	const { t } = useTranslation('document_details')
	const { t: dateT } = useTranslation('format_date')
	return (
		<View
			style={{
				padding: 16,
				borderWidth: 1,
				borderColor: colors.neutral['30'],
				borderRadius: 8,
				gap: 24,
			}}
		>
			<View style={{ gap: 12 }}>
				<Heading
					style={{ color: colors.neutral['600'] }}
					size='h6'
					fontWeight='bold'
				>
					{name}
				</Heading>
			</View>
			<View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
				<Icon.Icon
					size={18}
					color={colors.neutral['600']}
					strokeWidth={2}
					name='folder'
				/>
				<Text size='sm' style={{ color: colors.neutral['600'] }}>
					{t(folder)}
				</Text>
			</View>

			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<View style={{ gap: 8 }}>
					<Text style={{ color: colors.neutral['700'] }}>{t('size')}</Text>
					<Text style={{ color: colors.neutral['700'] }}>
						{fileSize
							? fileSize < 1024
								? `${fileSize.toFixed(1)} KB`
								: `${(fileSize / 1024).toFixed(1)} MB`
							: 'Unknown'}
					</Text>
				</View>
				<View style={{ gap: 8 }}>
					<Text style={{ color: colors.neutral['700'] }}>{t('type')}</Text>
					<Text style={{ color: colors.neutral['700'] }}>
						{getMimeType(name?.split('.').pop() || 'pdf')}
					</Text>
				</View>

				<View style={{ gap: 8 }}>
					<Text style={{ color: colors.neutral['700'] }}>{t('date')}</Text>
					<Text style={{ color: colors.neutral['700'] }}>
						{formatDate(createdAt).type === 'alias'
							? dateT(formatDate(createdAt).value)
							: formatDate(createdAt).value}
					</Text>
				</View>
			</View>
		</View>
	)
}

export default DocumentDetailsCard
