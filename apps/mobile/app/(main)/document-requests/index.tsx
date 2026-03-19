import DocumentRequestsList from '@/components/Documents/DocumentRequestsList'
import { Icon } from '@/components/Icon'
import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

const DocumentRequests = () => {
	const router = useRouter()
	const { t } = useTranslation('document_requests')

	return (
		<View style={{ backgroundColor: 'white', flex: 1, gap: 20 }}>
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
							<Icon.IconContainer>
								<Icon.Icon name='upload-01' strokeWidth={2} />
							</Icon.IconContainer>
						</Icon.Root>
						<Pressable
							testID='back-button'
							onPress={() => router.replace('/documents')}
							style={{ padding: 16 }}
						>
							<X size={24} color={colors.neutral['300']} />
						</Pressable>
					</View>
					<View style={{ gap: 4 }}>
						<Text
							size='lg'
							style={{ color: colors.neutral['700'] }}
							fontWeight='bold'
						>
							{t('required_documents')}
						</Text>
						<Text size='sm' style={{ color: colors.neutral['500'] }}>
							{t('required_documents_description')}
						</Text>
					</View>
				</View>
			</View>

			<DocumentRequestsList showPreview={false} />
		</View>
	)
}

export default DocumentRequests

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 12,
		justifyContent: 'space-between',
	},
})
