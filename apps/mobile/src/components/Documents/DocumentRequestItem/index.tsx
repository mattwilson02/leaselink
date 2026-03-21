import { memo } from 'react'
import { Icon } from '@/components/Icon'
import type { iconRegistry } from '@/constants/icons'
import {
	documentRequestDTORequestTypeEnum,
	documentRequestDTOStatusEnum,
	type DocumentRequestDTORequestTypeEnum,
	type DocumentRequestDTOStatusEnum,
} from '@/gen/index'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

type Props = {
	requestType: DocumentRequestDTORequestTypeEnum
	status: DocumentRequestDTOStatusEnum
	requestId: string
}

export const requestTypeIcon: Record<
	DocumentRequestDTORequestTypeEnum,
	{ name: keyof typeof iconRegistry; strokeWidth: number }
> = {
	[documentRequestDTORequestTypeEnum.PROOF_OF_ADDRESS]: {
		name: 'home-03',
		strokeWidth: 1.33,
	},
	[documentRequestDTORequestTypeEnum.PROOF_OF_IDENTITY]: {
		name: 'passcode-lock',
		strokeWidth: 2,
	},
	[documentRequestDTORequestTypeEnum.SIGNED_LEASE]: {
		name: 'file-05',
		strokeWidth: 1.33,
	},
	[documentRequestDTORequestTypeEnum.MOVE_IN_CHECKLIST]: {
		name: 'check-verified-01',
		strokeWidth: 1.33,
	},
}

const statusConfig: Record<
	DocumentRequestDTOStatusEnum,
	{ label: string; background: string; text: string; border: string }
> = {
	[documentRequestDTOStatusEnum.PENDING]: {
		label: 'pending',
		background: colors.warning[50],
		text: colors.warning[600],
		border: colors.warning[100],
	},
	[documentRequestDTOStatusEnum.UPLOADED]: {
		label: 'uploaded',
		background: colors.success[50],
		text: colors.success[600],
		border: colors.success[100],
	},
	[documentRequestDTOStatusEnum.CANCELED]: {
		label: 'canceled',
		background: colors.error[50],
		text: colors.error[600],
		border: colors.error[100],
	},
}

const DocumentRequestItem = ({ requestType, status, requestId }: Props) => {
	const { t } = useTranslation('document_requests')
	const router = useRouter()

	const sc = statusConfig[status] ?? {
		label: status,
		background: colors.muted,
		text: colors.mutedForeground,
		border: colors.border,
	}

	return (
		<Pressable
			onPress={() =>
				router.push({
					pathname: '/upload-document',
					params: { requestId },
				})
			}
			testID='document-request-item-pressable'
			style={{
				padding: 10,
				flexDirection: 'row',
				justifyContent: 'space-between',
				borderRadius: 8,
				borderColor: colors.border,
				borderWidth: 1,
				alignItems: 'center',
				backgroundColor: colors.card,
			}}
		>
			<View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
				<Icon.Root>
					<Icon.IconContainer
						color={colors.neutral['30']}
						style={{ padding: 8, borderRadius: 8 }}
					>
						<Icon.Icon
							stroke={colors.neutral['600']}
							strokeWidth={requestTypeIcon[requestType].strokeWidth}
							name={requestTypeIcon[requestType].name}
							size={16}
						/>
					</Icon.IconContainer>
				</Icon.Root>
				<Text style={{ color: colors.neutral['500'] }} fontWeight='bold'>
					{t(requestType)}
				</Text>
			</View>
			<View
				style={{
					borderRadius: 16,
					borderWidth: 1,
					borderColor: sc.border,
					backgroundColor: sc.background,
					paddingHorizontal: 8,
					paddingVertical: 2,
				}}
			>
				<Text
					size='sm'
					style={{
						color: sc.text,
					}}
				>
					{t(sc.label)}
				</Text>
			</View>

			<ChevronRight size={20} color={colors.neutral['700']} />
		</Pressable>
	)
}

export default memo(DocumentRequestItem)
