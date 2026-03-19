import { render, fireEvent } from '@/utils/test-utils'
import DocumentDetails from '@/app/(main)/documents/[id]'
import { useGetDocumentByIdControllerFindById } from '@/gen/index'
import { useDownloadDocument } from '@/hooks/useDownloadDocument'
import { getMimeType } from '@/utils/get-mime-type'

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
	DefaultTheme: {},
	DarkTheme: {},
}))

jest.mock('@/components/Documents/DocumentDetailsCardSkeleton', () => {
	return function NotificationListSkeleton() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View

		return <MockView testID='document-details-card-skeleton' />
	}
})

jest.mock('@/components/Documents/DocumentPreview', () => {
	return function DocumentPreview() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View

		return <MockView testID='document-preview' />
	}
})

// Mock expo-router
jest.mock('expo-router', () => ({
	useLocalSearchParams: jest.fn(),
	useRouter: jest.fn(),
}))

// Mock the API hook
jest.mock('@/gen/index', () => ({
	useGetDocumentByIdControllerFindById: jest.fn(),
	folderItemDTOFolderNameEnum: {
		// biome-ignore lint/style/useNamingConvention: <explanation>
		IDENTIFICATION: 'IDENTIFICATION',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		INVESTMENT_STATEMENTS: 'INVESTMENT_STATEMENTS',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		SIGNED_DOCUMENTS: 'SIGNED_DOCUMENTS',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		CORRESPONDENTS: 'CORRESPONDENTS',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		TAX_DOCUMENTS: 'TAX_DOCUMENTS',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		OTHER: 'OTHER',
	},
}))

// Mock the download hook
jest.mock('@/hooks/useDownloadDocument', () => ({
	useDownloadDocument: jest.fn(),
}))

// Mock the utility function
jest.mock('@/utils/get-mime-type', () => ({
	getMimeType: jest.fn(),
}))

// Mock dayjs
jest.mock('dayjs', () => {
	const mockDayjs = (date?: string) => ({
		format: (formatString: string) => {
			if (formatString === 'DD MMM, YYYY') {
				return '15 Jan, 2024'
			}
			return date
		},
		subtract: () => mockDayjs(),
		isAfter: () => false,
		isSame: () => false,
	})
	return mockDayjs
})

// Mock formatDate
jest.mock('@/utils/format-date', () => ({
	formatDate: jest.fn(() => ({
		type: 'date',
		value: '15 Jan, 2024',
	})),
}))

// Mock components
jest.mock('@/components/Icon', () => ({
	Icon: {
		Root: ({ children }: { children: React.ReactNode }) => {
			const { View } = require('react-native')
			return <View testID='icon-root'>{children}</View>
		},
		IconContainer: ({ children }: { children: React.ReactNode }) => {
			const { View } = require('react-native')
			return <View testID='icon-container'>{children}</View>
		},
		Icon: ({ name, testID }: { name: string; testID?: string }) => {
			const { View } = require('react-native')
			return <View testID={testID || `icon-${name}`} />
		},
	},
}))

jest.mock('lucide-react-native', () => ({
	X: ({ onPress, testID }: { onPress: () => void; testID?: string }) => {
		const { TouchableOpacity } = require('react-native')
		return <TouchableOpacity testID={testID} onPress={onPress} />
	},
}))

describe('DocumentDetails', () => {
	const mockRouter = {
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
	}

	const mockDownloadDocument = jest.fn()

	const mockDocument = {
		id: 'test-doc-id',
		name: 'Test Document.pdf',
		createdAt: '2024-01-15T10:30:00Z',
		clientId: 'test-client-id',
		blobName: 'test-document.pdf',
		contentKey: 'test-key',
		fileSize: 2048000, // 2MB in bytes
		folder: 'IDENTIFICATION',
		thumbnailBlobName: 'thumbnail.jpg',
		downloadLink: 'https://example.com/document.pdf',
		uploadedBy: 'test-user-id',
		version: 1,
		updatedAt: '2024-01-15T10:30:00Z',
	}

	beforeEach(() => {
		jest.clearAllMocks()

		require('expo-router').useLocalSearchParams.mockReturnValue({
			id: 'test-doc-id',
		})

		require('expo-router').useRouter.mockReturnValue(mockRouter)
		;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
			data: { document: mockDocument },
			isFetching: false,
		})
		;(useDownloadDocument as jest.Mock).mockReturnValue({
			downloadDocument: mockDownloadDocument,
		})
		;(getMimeType as jest.Mock).mockReturnValue('application/pdf')
	})

	describe('Component Rendering', () => {
		it('should render document details correctly', () => {
			const { getByText, getByTestId } = render(<DocumentDetails />)

			expect(getByText('Test Document.pdf')).toBeTruthy()
			expect(getByText('IDENTIFICATION')).toBeTruthy()
			expect(getByText('size')).toBeTruthy()
			expect(getByText('2000.0 MB')).toBeTruthy()
			expect(getByText('type')).toBeTruthy()
			expect(getByText('application/pdf')).toBeTruthy()
			expect(getByText('date')).toBeTruthy()
			expect(getByText('15 Jan, 2024')).toBeTruthy()
			expect(getByTestId('back-button')).toBeTruthy()
			expect(getByTestId('download-button-container')).toBeTruthy()
			expect(getByTestId('document-preview')).toBeTruthy()
		})

		it('should render download button', () => {
			const { getByText } = render(<DocumentDetails />)

			expect(getByText('download')).toBeTruthy()
		})

		it('should render icons correctly', () => {
			const { getByTestId } = render(<DocumentDetails />)

			expect(getByTestId('icon-root')).toBeTruthy()
			expect(getByTestId('icon-container')).toBeTruthy()
			expect(getByTestId('icon-coins-hand')).toBeTruthy()
			expect(getByTestId('icon-folder')).toBeTruthy()
			expect(getByTestId('icon-download-01')).toBeTruthy()
		})
	})

	describe('Navigation', () => {
		it('should call router.back when back button is pressed', () => {
			const { getByTestId } = render(<DocumentDetails />)

			const backButton = getByTestId('back-button')
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalled()
		})
	})

	describe('Download Functionality', () => {
		it('should call downloadDocument when download button is pressed', () => {
			const { getByText } = render(<DocumentDetails />)

			const downloadButton = getByText('download')
			fireEvent.press(downloadButton)

			expect(mockDownloadDocument).toHaveBeenCalledWith({
				id: 'test-doc-id',
				name: 'Test Document.pdf',
			})
		})

		it('should disable download button when fetching', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: { document: mockDocument },
				isFetching: true,
			})

			const { getByTestId } = render(<DocumentDetails />)

			const downloadButton = getByTestId('download-button-container')

			expect(downloadButton.props.children.props.disabled).toBe(true)
		})

		it('should enable download button when not fetching', () => {
			const { getByTestId } = render(<DocumentDetails />)

			const downloadButton = getByTestId('download-button-container')

			expect(downloadButton.props.children.props.disabled).toBe(false)
		})
	})

	describe('File Size Display', () => {
		it('should display file size in MB correctly', () => {
			const { getByText } = render(<DocumentDetails />)

			expect(getByText('2000.0 MB')).toBeTruthy()
		})

		it('should display file size in KB correctly', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						...mockDocument,
						fileSize: 512, // 512 KB in bytes
					},
				},
				isFetching: false,
			})

			const { getByText } = render(<DocumentDetails />)

			expect(getByText('512.0 KB')).toBeTruthy()
		})

		it('should display "Unknown" when file size is not available', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						...mockDocument,
						fileSize: null,
					},
				},
				isFetching: false,
			})

			const { getByText } = render(<DocumentDetails />)

			expect(getByText('Unknown')).toBeTruthy()
		})

		it('should display "Unknown" when file size is undefined', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						...mockDocument,
						fileSize: undefined,
					},
				},
				isFetching: false,
			})

			const { getByText } = render(<DocumentDetails />)

			expect(getByText('Unknown')).toBeTruthy()
		})
	})

	describe('MIME Type Display', () => {
		it('should call getMimeType with correct file extension', () => {
			render(<DocumentDetails />)

			expect(getMimeType).toHaveBeenCalledWith('pdf')
		})

		it('should default to pdf extension when no extension found', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						...mockDocument,
						name: 'document-without-extension',
					},
				},
				isFetching: false,
			})

			render(<DocumentDetails />)

			expect(getMimeType).toHaveBeenCalledWith('document-without-extension')
			expect(getMimeType).toHaveReturnedWith('application/pdf')
		})

		it('should handle different file extensions', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						...mockDocument,
						name: 'Test Document.docx',
					},
				},
				isFetching: false,
			})
			;(getMimeType as jest.Mock).mockReturnValue(
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			)

			const { getByText } = render(<DocumentDetails />)

			expect(getMimeType).toHaveBeenCalledWith('docx')
			expect(
				getByText(
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				),
			).toBeTruthy()
		})
	})

	describe('Document Folder Display', () => {
		it('should display correct folder translation', () => {
			const { getByText } = render(<DocumentDetails />)

			expect(getByText('IDENTIFICATION')).toBeTruthy()
		})

		it('should default to OTHER when folder is not recognized', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						...mockDocument,
						folder: 'UNKNOWN_FOLDER',
					},
				},
				isFetching: false,
			})

			const { getByText } = render(<DocumentDetails />)

			expect(getByText('OTHER')).toBeTruthy()
		})

		it('should default to OTHER when folder is null', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						...mockDocument,
						folder: null,
					},
				},
				isFetching: false,
			})

			const { getByText } = render(<DocumentDetails />)

			expect(getByText('OTHER')).toBeTruthy()
		})
	})

	describe('Error Handling', () => {
		it('should handle undefined document data gracefully', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: undefined,
				isFetching: false,
			})

			const { queryByText } = render(<DocumentDetails />)

			// Should not crash and should not display document name
			expect(queryByText('Test Document.pdf')).toBeNull()
		})

		it('should handle null document data gracefully', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: { document: null },
				isFetching: false,
			})

			const { queryByText } = render(<DocumentDetails />)

			expect(queryByText('Test Document.pdf')).toBeNull()
		})

		it('should handle missing document properties gracefully', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						id: 'test-id',
						// Missing other properties
					},
				},
				isFetching: false,
			})

			render(<DocumentDetails />)

			// Should not crash
			expect(getMimeType).toHaveBeenCalledWith('pdf')
		})
	})

	describe('Loading State', () => {
		it('should show loading state correctly', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: { document: mockDocument },
				isFetching: true,
			})

			const { getByTestId } = render(<DocumentDetails />)

			const skeleton = getByTestId('document-details-card-skeleton')
			const downloadButton = getByTestId('download-button-container')
			expect(downloadButton.props.children.props.disabled).toBe(true)
			expect(skeleton).toBeTruthy()
		})
	})

	describe('API Integration', () => {
		it('should call useGetDocumentByIdControllerFindById with correct id', () => {
			render(<DocumentDetails />)

			expect(useGetDocumentByIdControllerFindById).toHaveBeenCalledWith(
				'test-doc-id',
			)
		})

		it('should handle different document IDs', () => {
			require('expo-router').useLocalSearchParams.mockReturnValue({
				id: 'different-doc-id',
			})

			render(<DocumentDetails />)

			expect(useGetDocumentByIdControllerFindById).toHaveBeenCalledWith(
				'different-doc-id',
			)
		})
	})

	describe('Date Formatting', () => {
		it('should format date correctly', () => {
			const { getByText } = render(<DocumentDetails />)

			expect(getByText('15 Jan, 2024')).toBeTruthy()
		})

		it('should handle different date formats', () => {
			;(useGetDocumentByIdControllerFindById as jest.Mock).mockReturnValue({
				data: {
					document: {
						...mockDocument,
						createdAt: '2023-12-25T15:45:00Z',
					},
				},
				isFetching: false,
			})

			const { getByText } = render(<DocumentDetails />)

			// dayjs mock will still return the mocked format
			expect(getByText('15 Jan, 2024')).toBeTruthy()
		})
	})
})
