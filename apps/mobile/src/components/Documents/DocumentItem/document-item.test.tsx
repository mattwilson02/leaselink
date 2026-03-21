import { render, fireEvent, waitFor } from '@/utils/test-utils'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Alert } from 'react-native'
import DocumentItem from '../DocumentItem'
import dayjs from 'dayjs'
import {
	useDownloadDocumentControllerGenerateDownloadUrl,
	useViewDocumentByIdControllerViewDocument,
} from '@/gen/index'

jest.mock('expo-file-system', () => ({
	downloadAsync: jest.fn().mockResolvedValue({
		status: 200,
		uri: 'file:///mock/path/test-document.pdf',
	}),
	documentDirectory: 'file:///mock/path/',
}))
jest.mock('expo-sharing', () => ({
	isAvailableAsync: jest.fn().mockResolvedValue(true),
	shareAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-router', () => ({
	useRouter: jest.fn(() => ({
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
	})),
}))

jest.mock('@/design-system/components/DropdownMenuCompound', () => ({
	DropdownMenuCompound: {
		Root: ({ children }: { children: React.ReactNode }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView>{children}</MockView>
		},
		Trigger: ({ children }: { children: React.ReactNode }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView>{children}</MockView>
		},
		Content: ({ children }: { children: React.ReactNode }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView>{children}</MockView>
		},
		Item: ({
			children,
			onPress,
			testID,
			...props
		}: {
			children: React.ReactNode
			onPress?: () => void
			testID?: string
			[key: string]: unknown
		}) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockPressable = require('react-native').Pressable
			return (
				<MockPressable onPress={onPress} testID={testID} {...props}>
					{children}
				</MockPressable>
			)
		},
	},
}))

jest.mock('@/gen/index', () => ({
	useDownloadDocumentControllerGenerateDownloadUrl: jest.fn(),
	useViewDocumentByIdControllerViewDocument: jest.fn(),
}))

jest.mock('@/utils/format-date', () => ({
	formatDate: jest.fn((date: string) => ({
		type: 'date',
		value: require('dayjs')(date).format('DD MMM, YYYY'),
	})),
}))

const mockRouter = {
	back: jest.fn(),
	push: jest.fn(),
	replace: jest.fn(),
}

describe('DocumentItem', () => {
	const mockDocument = {
		name: 'Test Document.pdf',
		createdAt: new Date().toISOString(),
		id: 'test-document-id',
		size: 1024,
	}

	beforeEach(() => {
		jest.clearAllMocks()
		;(require('expo-router').useRouter as jest.Mock).mockReturnValue(mockRouter)
		;(
			useDownloadDocumentControllerGenerateDownloadUrl as jest.Mock
		).mockReturnValue({
			mutateAsync: jest.fn().mockResolvedValue({
				downloadUrl: 'http://backend-blob-storage:10000/test-document.pdf',
			}),
		})
		;(useViewDocumentByIdControllerViewDocument as jest.Mock).mockReturnValue({
			mutateAsync: jest.fn().mockResolvedValue({
				document: {
					id: 'test-document-id',
					name: 'Test Document.pdf',
					createdAt: new Date().toISOString(),
					size: 1024,
				},
			}),
		})
		jest.spyOn(Sharing, 'isAvailableAsync').mockResolvedValue(true)
		jest.spyOn(Sharing, 'shareAsync').mockResolvedValue(undefined)
		jest.spyOn(Alert, 'alert').mockImplementation(() => {})
	})

	it('should call download and share logic when download is pressed', async () => {
		const { getByTestId } = render(
			<DocumentItem
				size={mockDocument.size}
				id={mockDocument.id}
				name={mockDocument.name}
				createdAt={mockDocument.createdAt}
			/>,
		)

		const downloadItem = getByTestId('document-item-download')
		fireEvent.press(downloadItem)

		await waitFor(() => {
			expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
				'http://localhost:10000/test-document.pdf',
				expect.stringContaining('Test_Document.pdf'),
			)
		})

		expect(Sharing.isAvailableAsync).toHaveBeenCalled()
		expect(Sharing.shareAsync).toHaveBeenCalledWith(
			'file:///mock/path/test-document.pdf',
			expect.objectContaining({
				mimeType: 'application/pdf',
				dialogTitle: 'Save Test Document.pdf',
			}),
		)
	})

	it('should call router.push when document item more details is pressed', async () => {
		const { getByTestId } = render(
			<DocumentItem
				size={mockDocument.size}
				id={mockDocument.id}
				name={mockDocument.name}
				createdAt={mockDocument.createdAt}
			/>,
		)

		const documentItem = getByTestId('document-item-container')
		fireEvent(documentItem, 'press')

		await waitFor(() => {
			expect(
				useViewDocumentByIdControllerViewDocument().mutateAsync,
			).toHaveBeenCalledWith({
				documentId: 'test-document-id',
			})
			expect(mockRouter.push).toHaveBeenCalledWith(
				`/documents/${mockDocument.id}`,
			)
		})
	})

	it('should render document name and creation date correctly', () => {
		const { getByText } = render(
			<DocumentItem
				size={mockDocument.size}
				id={mockDocument.id}
				name={mockDocument.name}
				createdAt={mockDocument.createdAt}
			/>,
		)

		expect(getByText(mockDocument.name)).toBeTruthy()
		// formatDate returns an object with type and value
		const formattedDate = dayjs(mockDocument.createdAt).format('DD MMM, YYYY')
		expect(getByText(formattedDate)).toBeTruthy()
	})

	it('should render file size correctly', () => {
		const { getByText } = render(
			<DocumentItem
				size={mockDocument.size}
				id={mockDocument.id}
				name={mockDocument.name}
				createdAt={mockDocument.createdAt}
			/>,
		)

		expect(getByText('1.0 MB')).toBeTruthy()
	})

	it('should render file size in KB if size is less than 1024', () => {
		const smallFile = {
			...mockDocument,
			size: 512,
		}

		const { getByText } = render(
			<DocumentItem
				size={smallFile.size}
				id={smallFile.id}
				name={smallFile.name}
				createdAt={smallFile.createdAt}
			/>,
		)

		expect(getByText('512.0 KB')).toBeTruthy()
	})

	it('should apply correct styles', () => {
		const { getByTestId } = render(
			<DocumentItem
				size={mockDocument.size}
				id={mockDocument.id}
				name={mockDocument.name}
				createdAt={mockDocument.createdAt}
			/>,
		)

		const container = getByTestId('document-item-container')
		expect(container.props.style).toEqual(
			expect.objectContaining({
				padding: 16,
				flexDirection: 'row',
				justifyContent: 'space-between',
				borderRadius: 8,
			}),
		)
	})
})
