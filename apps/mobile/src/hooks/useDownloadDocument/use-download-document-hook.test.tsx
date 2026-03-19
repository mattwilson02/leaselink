import { renderHook, act, waitFor } from '@/utils/test-utils'
import { useDownloadDocument } from '.'
import { useDownloadDocumentControllerGenerateDownloadUrl } from '@/gen/index'
import { getMimeType } from '@/utils/get-mime-type'
import { Alert } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
	DefaultTheme: {},
	DarkTheme: {},
}))

// Mock the dependencies
jest.mock('@/gen/index', () => ({
	useDownloadDocumentControllerGenerateDownloadUrl: jest.fn(),
}))

jest.mock('@/utils/get-mime-type', () => ({
	getMimeType: jest.fn(),
}))

jest.mock('react-native', () => ({
	Alert: {
		alert: jest.fn(),
	},
}))

jest.mock('expo-file-system', () => ({
	documentDirectory: 'file:///mock/documents/',
	downloadAsync: jest.fn(),
}))

jest.mock('expo-sharing', () => ({
	isAvailableAsync: jest.fn(),
	shareAsync: jest.fn(),
}))

describe('useDownloadDocument', () => {
	const mockMutateAsync = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()
		;(
			useDownloadDocumentControllerGenerateDownloadUrl as jest.Mock
		).mockReturnValue({
			mutateAsync: mockMutateAsync,
		})
		;(getMimeType as jest.Mock).mockReturnValue('application/pdf')
		;(FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
			status: 200,
			uri: 'file:///mock/documents/test_document_123456789.pdf',
		})
		;(Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true)
		;(Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined)
	})

	it('should successfully download and share a document', async () => {
		const mockDownloadUrl =
			'http://backend-blob-storage:10000/documents/test.pdf'
		mockMutateAsync.mockResolvedValue({
			downloadUrl: mockDownloadUrl,
		})

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test document.pdf',
			})
		})

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				data: { documentId: 'test-doc-id' },
			})
			expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
				'http://localhost:10000/documents/test.pdf',
				expect.stringMatching(/test_document\.pdf_\d+\.pdf$/),
			)
			expect(Sharing.isAvailableAsync).toHaveBeenCalled()
			expect(Sharing.shareAsync).toHaveBeenCalledWith(
				'file:///mock/documents/test_document_123456789.pdf',
				{
					mimeType: 'application/pdf',
					dialogTitle: 'Save test document.pdf',
				},
			)
		})
	})

	it('should handle missing download URL', async () => {
		mockMutateAsync.mockResolvedValue({
			downloadUrl: null,
		})

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test.pdf',
			})
		})

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledWith('error', 'failed_download_url')
			expect(FileSystem.downloadAsync).not.toHaveBeenCalled()
		})
	})

	it('should replace backend-blob-storage with localhost in URL', async () => {
		const mockDownloadUrl =
			'http://backend-blob-storage:10000/documents/test.pdf'
		mockMutateAsync.mockResolvedValue({
			downloadUrl: mockDownloadUrl,
		})

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test.pdf',
			})
		})

		await waitFor(() => {
			expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
				'http://localhost:10000/documents/test.pdf',
				expect.any(String),
			)
		})
	})

	it('should handle download failure', async () => {
		mockMutateAsync.mockResolvedValue({
			downloadUrl: 'http://backend-blob-storage:10000/documents/test.pdf',
		})
		;(FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
			status: 404,
			uri: 'file:///mock/documents/test.pdf',
		})

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test.pdf',
			})
		})

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledWith('error', 'failed_download')
		})
	})

	it('should show alert when sharing is not available', async () => {
		mockMutateAsync.mockResolvedValue({
			downloadUrl: 'http://backend-blob-storage:10000/documents/test.pdf',
		})
		;(Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false)

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test.pdf',
			})
		})

		await waitFor(() => {
			expect(Sharing.shareAsync).not.toHaveBeenCalled()
			expect(Alert.alert).toHaveBeenCalledWith('success', 'file_downloaded')
		})
	})

	it('should handle API error when generating download URL', async () => {
		mockMutateAsync.mockRejectedValue(new Error('API Error'))

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test.pdf',
			})
		})

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledWith('error', 'failed_download')
			expect(FileSystem.downloadAsync).not.toHaveBeenCalled()
		})
	})

	it('should handle FileSystem download error', async () => {
		mockMutateAsync.mockResolvedValue({
			downloadUrl: 'http://backend-blob-storage:10000/documents/test.pdf',
		})
		;(FileSystem.downloadAsync as jest.Mock).mockRejectedValue(
			new Error('File system error'),
		)

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test.pdf',
			})
		})

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledWith('error', 'failed_download')
		})
	})

	it('should handle sharing error gracefully', async () => {
		mockMutateAsync.mockResolvedValue({
			downloadUrl: 'http://backend-blob-storage:10000/documents/test.pdf',
		})
		;(Sharing.shareAsync as jest.Mock).mockRejectedValue(
			new Error('Sharing error'),
		)

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test.pdf',
			})
		})

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledWith('error', 'failed_download')
		})
	})

	it('should use correct MIME type for different file extensions', async () => {
		mockMutateAsync.mockResolvedValue({
			downloadUrl: 'http://backend-blob-storage:10000/documents/test.docx',
		})
		;(getMimeType as jest.Mock).mockReturnValue(
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		)

		const { result } = renderHook(() => useDownloadDocument())

		await act(async () => {
			await result.current.downloadDocument({
				id: 'test-doc-id',
				name: 'test.docx',
			})
		})

		await waitFor(() => {
			expect(getMimeType).toHaveBeenCalledWith('docx')
			expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.any(String), {
				mimeType:
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				dialogTitle: 'Save test.docx',
			})
		})
	})
})
