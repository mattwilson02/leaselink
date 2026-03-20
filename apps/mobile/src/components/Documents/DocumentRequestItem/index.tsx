import { memo } from 'react'
import { Icon } from '@/components/Icon'
import type { iconRegistry } from '@/constants/icons'
import {
	documentRequestDTORequestTypeEnum,
	documentRequestDTOStatusEnum,
	type DocumentRequestDTORequestTypeEnum,
	type DocumentRequestDTOStatusEnum,
} from '@/gen/index'
import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
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

const statusText: Record<
	DocumentRequestDTOStatusEnum,
	{ label: string; color: Record<string, string> }
> = {
	[documentRequestDTOStatusEnum.PENDING]: {
		label: 'pending',
		color: colors.warning,
	},
	[documentRequestDTOStatusEnum.UPLOADED]: {
		label: 'uploaded',
		color: colors.success,
	},
	[documentRequestDTOStatusEnum.CANCELED]: {
		label: 'canceled',
		color: colors.error,
	},
}

const DocumentRequestItem = ({ requestType, status, requestId }: Props) => {
	const { t } = useTranslation('document_requests')
	const router = useRouter()

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
				borderColor: colors.neutral['30'],
				borderWidth: 1,
				alignItems: 'center',
				backgroundColor: 'white',
				boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
			}}
		>
			<View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
				<Icon.Root>
					<Icon.IconContainer
						color={colors['primary-green']['100']}
						style={{ padding: 8, borderRadius: 8 }}
					>
						<Icon.Icon
							stroke={colors['primary-green']['500']}
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
					borderColor: statusText[status].color['100'],
					backgroundColor: statusText[status].color['50'],
					paddingHorizontal: 8,
					paddingVertical: 2,
				}}
			>
				<Text
					size='sm'
					style={{
						color: statusText[status].color['500'],
					}}
				>
					{t(statusText[status].label)}
				</Text>
			</View>

			<ChevronRight size={20} color={colors.neutral['700']} />
		</Pressable>
	)
}

export default memo(DocumentRequestItem)
