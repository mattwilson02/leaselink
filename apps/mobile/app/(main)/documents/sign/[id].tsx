import { useState } from 'react'
import {
	View,
	StyleSheet,
	ScrollView,
	Alert,
	ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { X, CheckCircle2 } from 'lucide-react-native'
import { Pressable } from 'react-native'
import {
	type DocumentDTO,
	useGetDocumentByIdControllerFindById,
} from '@/gen/index'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Text } from '@/design-system/components/Typography'
import { Heading } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import SignatureCanvasComponent from '@/components/Documents/SignatureCanvas'
import {
	useUploadSignatureImage,
	useSignDocument,
} from '@/hooks/use-sign-document'

const SignDocumentScreen = () => {
	const { id } = useLocalSearchParams<{ id: string }>()
	const router = useRouter()

	const [isSigning, setIsSigning] = useState(false)
	const [isSuccess, setIsSuccess] = useState(false)
	const [signatureConfirmed, setSignatureConfirmed] = useState(false)
	const [capturedBase64, setCapturedBase64] = useState<string | null>(null)

	const { data, isFetching } = useGetDocumentByIdControllerFindById<
		{ document: DocumentDTO },
		{ id: string }
	>(id)

	const { mutateAsync: generateUploadUrl } = useUploadSignatureImage(id)
	const { mutateAsync: signDocument } = useSignDocument(id)

	const handleSignature = (base64Png: string) => {
		setCapturedBase64(base64Png)
		setSignatureConfirmed(true)
	}

	const handleClear = () => {
		setCapturedBase64(null)
		setSignatureConfirmed(false)
	}

	const handleSubmit = async () => {
		if (!capturedBase64) {
			Alert.alert(
				'No signature',
				'Please draw your signature before submitting.',
			)
			return
		}

		setIsSigning(true)
		try {
			// Step 1: Get a pre-signed upload URL and blob name
			const { uploadUrl, blobName } = await generateUploadUrl()

			// Step 2: Convert base64 PNG to binary and upload via PUT
			const mobileAccessibleUploadUrl = uploadUrl.replace(
				'backend-blob-storage',
				'localhost',
			)
			const byteCharacters = atob(capturedBase64)
			const byteNumbers = new Array(byteCharacters.length)
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i)
			}
			const byteArray = new Uint8Array(byteNumbers)
			const blob = new Blob([byteArray], { type: 'image/png' })

			const uploadResponse = await fetch(mobileAccessibleUploadUrl, {
				method: 'PUT',
				headers: { 'Content-Type': 'image/png' },
				body: blob,
			})

			if (!uploadResponse.ok) {
				throw new Error(
					`Failed to upload signature image: ${uploadResponse.status}`,
				)
			}

			// Step 3: Record the signature on the document
			await signDocument({ signatureImageKey: blobName })

			setIsSuccess(true)
		} catch (_error) {
			Alert.alert(
				'Signing failed',
				'There was a problem signing the document. Please try again.',
			)
		} finally {
			setIsSigning(false)
		}
	}

	if (isSuccess) {
		return (
			<View style={styles.successContainer}>
				<View style={styles.successContent}>
					<CheckCircle2 size={64} color={colors.success[500]} />
					<Heading size='h5' fontWeight='bold' style={styles.successTitle}>
						Document Signed
					</Heading>
					<Text style={styles.successSubtitle}>
						Your signature has been recorded successfully.
					</Text>
					<Button.Root
						style={styles.doneButton}
						onPress={() => router.replace(`/documents/${id}`)}
					>
						<Button.Text>Back to Document</Button.Text>
					</Button.Root>
				</View>
			</View>
		)
	}

	return (
		<ScrollView
			style={styles.root}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps='handled'
		>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Heading size='h5' fontWeight='bold' style={styles.headerTitle}>
						Sign Document
					</Heading>
					{!isFetching && data?.document?.name ? (
						<Text size='sm' style={styles.documentName} numberOfLines={1}>
							{data.document.name}
						</Text>
					) : null}
				</View>
				<Pressable
					onPress={() => router.back()}
					style={styles.closeButton}
					testID='close-button'
				>
					<X size={24} color={colors.neutral['300']} />
				</Pressable>
			</View>

			{/* Divider */}
			<View style={styles.divider} />

			{/* Disclaimer */}
			<View style={styles.disclaimerContainer}>
				<Text size='sm' style={styles.disclaimerText}>
					By signing below, you acknowledge that you have read and agree to the
					terms of this document.
				</Text>
			</View>

			{/* Signature canvas */}
			<View style={styles.canvasSection}>
				<Text size='sm' fontWeight='semibold' style={styles.sectionLabel}>
					Your signature
				</Text>
				<SignatureCanvasComponent
					onSignature={handleSignature}
					onClear={handleClear}
				/>
				{signatureConfirmed ? (
					<View style={styles.capturedBadge}>
						<CheckCircle2 size={14} color={colors.success[600]} />
						<Text size='xs' style={styles.capturedText}>
							Signature captured
						</Text>
					</View>
				) : null}
			</View>

			{/* Submit */}
			<Button.Root
				onPress={handleSubmit}
				disabled={!signatureConfirmed || isSigning}
				loading={isSigning}
				style={styles.submitButton}
			>
				{isSigning ? (
					<ActivityIndicator size='small' color={colors.primaryForeground} />
				) : null}
				<Button.Text>Submit Signature</Button.Text>
			</Button.Root>
		</ScrollView>
	)
}

export default SignDocumentScreen

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: colors.background,
	},
	content: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 20,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	headerLeft: {
		flex: 1,
		gap: 2,
		paddingRight: 12,
	},
	headerTitle: {
		color: colors.neutral['800'],
	},
	documentName: {
		color: colors.neutral['500'],
	},
	closeButton: {
		padding: 8,
	},
	divider: {
		height: 1,
		backgroundColor: colors.border,
	},
	disclaimerContainer: {
		backgroundColor: colors.secondary,
		borderRadius: 8,
		padding: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	disclaimerText: {
		color: colors.neutral['600'],
		lineHeight: 20,
	},
	canvasSection: {
		gap: 8,
	},
	sectionLabel: {
		color: colors.neutral['700'],
	},
	capturedBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginTop: 2,
	},
	capturedText: {
		color: colors.success[600],
	},
	submitButton: {
		marginTop: 4,
	},
	successContainer: {
		flex: 1,
		backgroundColor: colors.background,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32,
	},
	successContent: {
		alignItems: 'center',
		gap: 16,
		maxWidth: 320,
	},
	successTitle: {
		color: colors.neutral['800'],
		textAlign: 'center',
	},
	successSubtitle: {
		color: colors.neutral['500'],
		textAlign: 'center',
	},
	doneButton: {
		marginTop: 8,
		minWidth: 200,
	},
})
