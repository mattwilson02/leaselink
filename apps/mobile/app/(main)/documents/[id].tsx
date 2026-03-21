import { Icon } from '@/components/Icon'
import {
	type DocumentDTO,
	type FolderItemDTOFolderNameEnum,
	useGetDocumentByIdControllerFindById,
} from '@/gen/index'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { X, CheckCircle2, PenLine } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'
import { useDownloadDocument } from '@/hooks/useDownloadDocument'
import DocumentPreview from '@/components/Documents/DocumentPreview'
import DocumentDetailsCardSkeleton from '@/components/Documents/DocumentDetailsCardSkeleton'
import DocumentDetailsCard, {} from '@/components/Documents/DocumentDetailsCard'
import { folderItemDTOFolderNameEnum } from '@/gen/index'
import { useSignatureQuery } from '@/hooks/use-sign-document'
import { formatDate } from '@/utils/format-date'

// Folders that support e-signatures (backend: SIGNABLE_FOLDERS)
const SIGNABLE_FOLDERS = ['LEASE_AGREEMENTS', 'SIGNED_DOCUMENTS'] as const

const DocumentDetails = () => {
	const { id } = useLocalSearchParams<{ id: string }>()
	const router = useRouter()
	const { t } = useTranslation('document_details')
	const { t: dateT } = useTranslation('format_date')

	const { downloadDocument } = useDownloadDocument()

	const { data, isFetching } = useGetDocumentByIdControllerFindById<
		{ document: DocumentDTO },
		{ id: string }
	>(id)

	const folder = data?.document?.folder ?? ''
	const isSignable = SIGNABLE_FOLDERS.includes(
		folder as (typeof SIGNABLE_FOLDERS)[number],
	)

	const { data: signature, isLoading: isSignatureLoading } =
		useSignatureQuery(id)

	const formattedSignedAt =
		signature?.signedAt
			? (() => {
					const result = formatDate(signature.signedAt)
					return result.type === 'alias' ? dateT(result.value) : result.value
				})()
			: null

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: 'white',
				gap: 20,
			}}
		>
			<View style={styles.header}>
				<View
					style={{
						flex: 1,
						gap: 16,
					}}
				>
					<View
						style={{
							flexDirection: 'row',
							width: '100%',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<Icon.Root>
							<Icon.IconContainer color={colors.neutral['20']}>
								<Icon.Icon
									name='coins-hand'
									stroke={colors.primary}
									strokeWidth={2}
								/>
							</Icon.IconContainer>
						</Icon.Root>
						<Pressable
							testID='back-button'
							onPress={() => router.back()}
							style={{ padding: 16 }}
						>
							<X size={24} color={colors.neutral['300']} />
						</Pressable>
					</View>
					{isFetching ? (
						<DocumentDetailsCardSkeleton />
					) : (
						<DocumentDetailsCard
							name={data?.document?.name || ''}
							folder={
								(Object.keys(folderItemDTOFolderNameEnum).find(
									(key) =>
										folderItemDTOFolderNameEnum[
											key as keyof typeof folderItemDTOFolderNameEnum
										] === data?.document?.folder,
								) as FolderItemDTOFolderNameEnum) ||
								folderItemDTOFolderNameEnum.OTHER
							}
							createdAt={data?.document?.createdAt || ''}
							fileSize={data?.document?.fileSize || 0}
						/>
					)}
					<View
						style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', maxWidth: '100%' }}
					>
						<View
							testID='download-button-container'
							style={{ flexDirection: 'row', maxWidth: '45%' }}
						>
							<Button.Root
								disabled={isFetching}
								style={{ gap: 4, flex: 1 }}
								onPress={() =>
									downloadDocument({
										id: data?.document.id || '',
										name: data?.document.name || '',
									})
								}
							>
								<Button.Prefix>
									<Icon.Icon
										name='download-01'
										size={20}
										stroke='white'
										fill='transparent'
									/>
								</Button.Prefix>
								<Button.Text style={{ flex: 1 }}>{t('download')}</Button.Text>
							</Button.Root>
						</View>

						{/* Signature section — only for signable folders */}
						{isSignable && !isFetching ? (
							isSignatureLoading ? null : signature ? (
								// Already signed — show badge
								<View style={styles.signedBadge} testID='signed-badge'>
									<CheckCircle2 size={14} color={colors.success[600]} />
									<Text size='xs' style={styles.signedBadgeText}>
										Signed{formattedSignedAt ? ` on ${formattedSignedAt}` : ''}
									</Text>
								</View>
							) : (
								// Not yet signed — show Sign button
								<Button.Root
									variant='outline'
									style={styles.signButton}
									onPress={() => router.push(`/documents/sign/${id}`)}
									testID='sign-document-button'
								>
									<Button.Prefix>
										<PenLine size={16} color={colors.foreground} />
									</Button.Prefix>
									<Button.Text>Sign Document</Button.Text>
								</Button.Root>
							)
						) : null}
					</View>
				</View>
			</View>

			<View style={styles.previewContainer}>
				<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
					{t('document_preview')}
				</Text>
				<DocumentPreview />
			</View>
		</View>
	)
}

export default DocumentDetails

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 12,
		justifyContent: 'space-between',
	},
	previewContainer: {
		gap: 24,
		flex: 1,
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 12,
		backgroundColor: 'white',
		overflow: 'hidden',
	},
	signButton: {
		gap: 4,
	},
	signedBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: colors.success[50],
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.success[100],
	},
	signedBadgeText: {
		color: colors.success[700],
		fontWeight: '500',
	},
})
