import { useDownloadDocumentControllerGenerateDownloadUrl } from '@/gen/index'
import { getMimeType } from '@/utils/get-mime-type'
import { Alert } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useTranslation } from 'react-i18next'

export const useDownloadDocument = () => {
	const { mutateAsync } = useDownloadDocumentControllerGenerateDownloadUrl()
	const { t: alertsT } = useTranslation('alerts')
	const { t: errorT } = useTranslation('error')

	const downloadDocument = async ({
		id,
		name,
	}: { id: string; name: string }) => {
		try {
			const { downloadUrl } = await mutateAsync({ data: { documentId: id } })

			if (!downloadUrl) {
				Alert.alert(errorT('error'), alertsT('failed_download_url'))
				return
			}

			// TODO: remove this when we have a proper dev blob storage url
			// Replace Docker internal hostname with localhost for mobile app access
			// The backend generates URLs with 'backend-blob-storage' (Docker container name)
			// but the mobile app needs to use 'localhost' to access the exposed port
			const mobileAccessibleUrl = downloadUrl.replace(
				'backend-blob-storage',
				'localhost',
			)

			const fileExtension = name.split('.').pop() || 'pdf'
			const fileName = `${name.replace(/[^a-zA-Z0-9.-]/g, '_')}_${Date.now()}.${fileExtension}`
			const fileUri = `${FileSystem.documentDirectory}${fileName}`

			const downloadResult = await FileSystem.downloadAsync(
				mobileAccessibleUrl,
				fileUri,
			)

			if (downloadResult.status === 200) {
				const isAvailable = await Sharing.isAvailableAsync()

				if (isAvailable) {
					await Sharing.shareAsync(downloadResult.uri, {
						mimeType: getMimeType(fileExtension),
						dialogTitle: `Save ${name}`,
					})
				} else {
					Alert.alert(
						alertsT('success'),
						alertsT('file_downloaded', { path: downloadResult.uri }),
					)
				}
			} else {
				throw new Error(`Download failed with status: ${downloadResult.status}`)
			}
		} catch (_) {
			Alert.alert(errorT('error'), alertsT('failed_download'))
		}
	}

	return { downloadDocument }
}
