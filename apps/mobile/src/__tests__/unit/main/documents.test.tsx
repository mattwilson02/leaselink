import { render, fireEvent, waitFor } from '@/utils/test-utils'
import Documents from '@/app/(main)/documents'
import { useInfiniteQuery } from '@tanstack/react-query'

import {
	useAuthControllerHandle,
	useGetDocumentRequestsByClientIdControllerFindAll,
	useGetRecentlyViewedDocumentsControllerGetRecentlyViewed,
} from '@/gen/index'
import { useLocalSearchParams, useRouter } from 'expo-router'

// Mock TanStack Query with queryOptions
jest.mock('@tanstack/react-query', () => ({
	...jest.requireActual('@tanstack/react-query'),
	useInfiniteQuery: jest.fn(),
	useQuery: jest.fn(() => ({
		data: undefined,
		isLoading: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		queryKey: [],
	})),
	queryOptions: jest.fn((options) => options), // Mock queryOptions to return the options object
}))

jest.mock('@/services/api', () => ({
	// biome-ignore lint/style/useNamingConvention: Config is opinionated
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
		request: jest.fn(),
	},
	client: jest.fn(),
}))

jest.mock('@/gen/index', () => ({
	useAuthControllerHandle: jest.fn(),
	useGetDocumentRequestsByClientIdControllerFindAll: jest.fn(),
	useGetRecentlyViewedDocumentsControllerGetRecentlyViewed: jest.fn(),
	// Add mock for the folder summary hook that's causing the issue
	useGetFolderSummaryControllerFindAll: jest.fn(),
	getFolderSummaryControllerFindAllQueryOptions: jest.fn(),
	documentRequestDTOStatusEnum: {
		// biome-ignore lint/style/useNamingConvention: <enum>
		UPLOADED: 'UPLOADED',
		// biome-ignore lint/style/useNamingConvention: <enum>
		PENDING: 'PENDING',
		// biome-ignore lint/style/useNamingConvention: <enum>
		CANCELED: 'CANCELED',
	},
	getDocumentsByClientIdControllerFindAllQueryParamsFoldersEnum: {
		// biome-ignore lint/style/useNamingConvention: <enum>
		IDENTIFICATION: 'IDENTIFICATION',
		// biome-ignore lint/style/useNamingConvention: <enum>
		INVESTMENT_STATEMENTS: 'INVESTMENT_STATEMENTS',
		// biome-ignore lint/style/useNamingConvention: <enum>
		SIGNED_DOCUMENTS: 'SIGNED_DOCUMENTS',
		// biome-ignore lint/style/useNamingConvention: <enum>
		CORRESPONDENTS: 'CORRESPONDENTS',
		// biome-ignore lint/style/useNamingConvention: <enum>
		TAX_DOCUMENTS: 'TAX_DOCUMENTS',
		// biome-ignore lint/style/useNamingConvention: <enum>
		OTHER: 'OTHER',
	},
}))

jest.mock('@/components/Documents/DocumentItem', () => {
	return function DocumentItem({
		name,
		createdAt,
	}: { name: string; createdAt: string }) {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockText = require('react-native').Text

		return (
			<MockView testID={`document-item-${name}`}>
				<MockText>{name}</MockText>
				<MockText>{createdAt}</MockText>
			</MockView>
		)
	}
})

jest.mock('@/components/Documents/DocumentRequestItem', () => {
	return function DocumentItem({
		requestId,
		requestType,
		status,
	}: {
		requestId: string
		requestType: string
		status: string
	}) {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockText = require('react-native').Text

		return (
			<MockView testID={`document-request-item-${requestId}`}>
				<MockText>{requestType}</MockText>
				<MockText>{status}</MockText>
			</MockView>
		)
	}
})

jest.mock('@/components/Documents/DocumentRequestsListSkeleton', () => {
	return function DocumentsListSkeleton() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View

		return <MockView testID='documents-request-skeleton' />
	}
})

jest.mock('@/components/Documents/DocumentsListSkeleton', () => {
	return function DocumentsListSkeleton() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View

		return <MockView testID='documents-skeleton' />
	}
})

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
	useLocalSearchParams: jest.fn(),
}))

// Mock DateTimePicker for date picker tests
jest.mock('@react-native-community/datetimepicker', () => {
	// biome-ignore lint/style/useNamingConvention: Mock component
	const MockView = require('react-native').View
	// biome-ignore lint/style/useNamingConvention: Mock component
	const MockText = require('react-native').Text

	return function MockDateTimePicker(props: {
		testID?: string
		value: Date
		mode: string
		display: string
		onChange: (event: unknown, date?: Date) => void
		minimumDate?: Date
		maximumDate?: Date
		style?: object
	}) {
		return (
			<MockView testID={props.testID || 'date-time-picker'}>
				<MockText>DateTimePicker Mock</MockText>
				{props.maximumDate && (
					<MockText testID='max-date-prop'>
						Max Date: {props.maximumDate.toISOString()}
					</MockText>
				)}
			</MockView>
		)
	}
})

describe('Documents Component', () => {
	// TODO: type documents and document request mocks
	const mockUser = {
		id: 'test-user-id',
	}

	const mockDocuments = [
		{
			id: '1',
			name: 'Document 1.pdf',
			createdAt: '2024-01-15T10:30:00Z',
			clientId: 'test-client-id',
			blobName: 'document1.pdf',
			contentKey: '1',
			fileSize: 1024,
			folder: 'OTHER',
			thumbnailBlobName: 'thumbnail1.jpg',
			downloadLink: 'https://example.com/document1.pdf',
			uploadedBy: 'test-user-id',
			version: 1,
			updatedAt: '2024-01-15T10:30:00Z',
		},
		{
			id: '2',
			name: 'Document 2.docx',
			createdAt: '2024-01-14T09:15:00Z',
			clientId: 'test-client-id',
			blobName: 'document2.docx',
			contentKey: '2',
			fileSize: 2048,
			folder: 'OTHER',
			thumbnailBlobName: 'thumbnail2.jpg',
			uploadedBy: 'test-user-id',
			version: 1,
			updatedAt: '2024-01-14T09:15:00Z',
		},
	]

	const mockDocumentRequests = [
		{
			id: 'request-1',
			requestType: 'PROOF_OF_ADDRESS',
			status: 'PENDING',
			clientId: 'test-client-id',
			documentId: '1',
			createdAt: '2024-01-15T10:30:00Z',
			updatedAt: '2024-01-15T10:30:00Z',
		},
		{
			id: 'request-2',
			requestType: 'PROOF_OF_ADDRESS',
			status: 'PENDING',
			clientId: 'test-client-id',
			documentId: '2',
			createdAt: '2024-01-14T09:15:00Z',
			updatedAt: '2024-01-14T09:15:00Z',
		},
	]

	const mockInfiniteQueryData = {
		pages: [{ documents: mockDocuments }],
		pageParams: [0],
	}

	const mockFetchNextPage = jest.fn()
	const mockRouter = {
		push: jest.fn(),
		setParams: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: mockUser,
		})
		;(useLocalSearchParams as jest.Mock).mockReturnValue({})
		;(
			useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
		).mockReturnValue({
			data: { documentRequests: mockDocumentRequests },
			isLoading: false,
		})
		;(
			useGetRecentlyViewedDocumentsControllerGetRecentlyViewed as jest.Mock
		).mockReturnValue({
			data: { documents: mockDocuments },
			isLoading: false,
		})
		;(useInfiniteQuery as jest.Mock).mockReturnValue({
			data: mockInfiniteQueryData,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		})
		;(useRouter as jest.Mock).mockReturnValue(mockRouter)

		// Mock any folder summary hooks that might be used
		const mockUseGetFolderSummaryControllerFindAll = require('@/gen/index')
			.useGetFolderSummaryControllerFindAll as jest.Mock
		mockUseGetFolderSummaryControllerFindAll.mockReturnValue({
			data: [],
			isLoading: false,
			error: null,
			queryKey: [],
		})
	})

	describe('User Authentication', () => {
		it('should render when user is authenticated', () => {
			const { getByText } = render(<Documents />)
			expect(getByText('documents')).toBeTruthy()
			expect(getByText('documents_description')).toBeTruthy()
		})
	})

	describe('API Query Configuration', () => {
		it('should configure useInfiniteQuery and call getDocumentRequests correct parameters', () => {
			render(<Documents />)

			expect(useInfiniteQuery).toHaveBeenCalledWith(
				expect.objectContaining({
					queryKey: ['documents', undefined, null, null, []],
					initialPageParam: 0,
				}),
			)

			expect(
				useGetDocumentRequestsByClientIdControllerFindAll,
			).toHaveBeenCalled()
		})

		it('should configure queryFn correctly', async () => {
			render(<Documents />)

			const queryConfig = (useInfiniteQuery as jest.Mock).mock.calls[0][0]
			expect(typeof queryConfig.queryFn).toBe('function')
			expect(typeof queryConfig.getNextPageParam).toBe('function')
		})

		it('should return undefined for next page when last page has fewer items than limit', () => {
			render(<Documents />)

			const queryConfig = (useInfiniteQuery as jest.Mock).mock.calls[0][0]
			const getNextPageParam = queryConfig.getNextPageParam

			const lastPage = { documents: [mockDocuments[0]] }
			const allPages = [lastPage]

			const result = getNextPageParam(lastPage, allPages)
			expect(result).toBeUndefined()
		})

		it('should return next page number when last page has full limit of items', () => {
			render(<Documents />)

			const queryConfig = (useInfiniteQuery as jest.Mock).mock.calls[0][0]
			const getNextPageParam = queryConfig.getNextPageParam

			const fullPageDocuments = Array(10).fill(mockDocuments[0])
			const lastPage = { documents: fullPageDocuments }
			const allPages = [lastPage]

			const result = getNextPageParam(lastPage, allPages)
			expect(result).toBe(1)
		})
	})

	describe('Loading State', () => {
		it('should show skeletons when loading', () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: undefined,
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: true,
			})
			;(
				useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
			).mockReturnValue({
				data: undefined,
				isLoading: true,
			})

			const { getByTestId } = render(<Documents />)
			expect(getByTestId('documents-skeleton')).toBeTruthy()
			expect(getByTestId('documents-request-skeleton')).toBeTruthy()
		})

		it('should hide skeletons when data is loaded', () => {
			const { queryByTestId, getByTestId } = render(<Documents />)
			expect(queryByTestId('documents-skeleton')).toBeNull()
			expect(getByTestId('documents-flatlist')).toBeTruthy()

			expect(queryByTestId('documents-request-skeleton')).toBeNull()
			expect(getByTestId('document-request-item-request-1')).toBeTruthy()
			expect(getByTestId('document-request-item-request-2')).toBeTruthy()
		})
	})

	describe('Empty State', () => {
		it('should show empty states when no documents exist', () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: { pages: [{ documents: [] }] },
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})
			;(
				useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
			).mockReturnValue({
				data: { documentRequests: [] },
				isLoading: false,
			})

			const { getByTestId } = render(<Documents />)
			expect(getByTestId('no-documents-heading')).toBeTruthy()
			expect(getByTestId('no-documents-description')).toBeTruthy()
		})

		it('should display correct empty state messages', () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: { pages: [{ documents: [] }] },
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})
			;(
				useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
			).mockReturnValue({
				data: { documentRequests: [] },
				isLoading: false,
			})

			const { getByText } = render(<Documents />)
			expect(getByText('no_documents_found')).toBeTruthy()
			expect(getByText('no_documents_description')).toBeTruthy()
		})
	})

	describe('Documents List', () => {
		it('should render documents and document requests correctly', () => {
			const { getByTestId } = render(<Documents />)

			expect(getByTestId('documents-flatlist')).toBeTruthy()
			expect(getByTestId('document-item-Document 1.pdf')).toBeTruthy()
			expect(getByTestId('document-item-Document 2.docx')).toBeTruthy()

			expect(getByTestId('document-requests-flatlist')).toBeTruthy()
			expect(getByTestId('document-request-item-request-1')).toBeTruthy()
			expect(getByTestId('document-request-item-request-2')).toBeTruthy()
		})

		it('should render correct number of document items and document request items', () => {
			const { getAllByTestId } = render(<Documents />)

			expect(getAllByTestId(/document-item-/).length).toBe(mockDocuments.length)
			expect(getAllByTestId(/document-request-item-/).length).toBe(
				mockDocumentRequests.length,
			)
		})

		it('should flatten documents from multiple pages', () => {
			const additionalDocuments = [
				{
					id: '3',
					name: 'Document 3.xlsx',
					createdAt: '2024-01-13T08:00:00Z',
					clientId: 'test-client-id',
					blobName: 'document3.xlsx',
					contentKey: '3',
					fileSize: 3072,
					folder: 'folder3',
					thumbnailBlobName: 'thumbnail3.jpg',
					uploadedBy: 'test-user-id',
					version: 1,
					updatedAt: '2024-01-13T08:00:00Z',
				},
			]
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: {
					pages: [
						{ documents: mockDocuments },
						{ documents: additionalDocuments },
					],
				},
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})

			const { getAllByTestId } = render(<Documents />)
			expect(getAllByTestId(/document-item-/).length).toBe(3)
		})
	})

	describe('Infinite Scrolling', () => {
		it('should call fetchNextPage when reaching end of list', async () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: mockInfiniteQueryData,
				fetchNextPage: mockFetchNextPage,
				hasNextPage: true,
				isFetchingNextPage: false,
				isLoading: false,
			})

			const { getByTestId } = render(<Documents />)
			const flatList = getByTestId('documents-flatlist')

			fireEvent(flatList, 'onEndReached')

			await waitFor(() => {
				expect(mockFetchNextPage).toHaveBeenCalled()
			})
		})

		it('should not call fetchNextPage when no more pages available', async () => {
			const { getByTestId } = render(<Documents />)
			const flatList = getByTestId('documents-flatlist')

			fireEvent(flatList, 'onEndReached')

			await new Promise((resolve) => setTimeout(resolve, 100))
			expect(mockFetchNextPage).not.toHaveBeenCalled()
		})

		it('should not call fetchNextPage when already fetching', async () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: mockInfiniteQueryData,
				fetchNextPage: mockFetchNextPage,
				hasNextPage: true,
				isFetchingNextPage: true,
				isLoading: false,
			})

			const { getByTestId } = render(<Documents />)
			const flatList = getByTestId('documents-flatlist')

			fireEvent(flatList, 'onEndReached')

			await new Promise((resolve) => setTimeout(resolve, 100))
			expect(mockFetchNextPage).not.toHaveBeenCalled()
		})

		it('should show loading indicator when fetching next page', () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: mockInfiniteQueryData,
				fetchNextPage: mockFetchNextPage,
				hasNextPage: true,
				isFetchingNextPage: true,
				isLoading: false,
			})

			const { getByTestId } = render(<Documents />)
			expect(getByTestId('footer-loader')).toBeTruthy()
		})

		it('should hide loading indicator when not fetching next page', () => {
			const { queryByTestId } = render(<Documents />)
			expect(queryByTestId('footer-loader')).toBeNull()
		})
	})

	describe('UI Elements', () => {
		it('should render header sections with correct text', () => {
			const { getByText } = render(<Documents />)
			expect(getByText('documents')).toBeTruthy()
			expect(getByText('documents_description')).toBeTruthy()

			expect(getByText('required_documents')).toBeTruthy()
			expect(getByText('see_more')).toBeTruthy()
		})

		it('should render files section with correct text', () => {
			const { getByText } = render(<Documents />)
			expect(getByText('all_files')).toBeTruthy()
		})
	})

	describe('Error Handling', () => {
		it('should handle undefined documents data gracefully', () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: undefined,
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})
			;(
				useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
			).mockReturnValue({
				data: undefined,
				isLoading: false,
			})

			const { getByTestId } = render(<Documents />)
			expect(getByTestId('no-documents-heading')).toBeTruthy()
			expect(getByTestId('no-documents-description')).toBeTruthy()
		})

		it('should handle pages with undefined documents array', () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: { pages: [{ documents: undefined }] },
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})

			const { getByTestId } = render(<Documents />)
			expect(getByTestId('no-documents-heading')).toBeTruthy()
		})
	})

	describe('Search Functionality', () => {
		it('should render search icon', () => {
			const { UNSAFE_getByType } = render(<Documents />)
			const searchIcon = UNSAFE_getByType(require('lucide-react-native').Search)

			expect(searchIcon).toBeTruthy()
		})

		it('should open search modal when search icon is pressed', () => {
			const { UNSAFE_getByType } = render(<Documents />)
			const searchIcon = UNSAFE_getByType(require('lucide-react-native').Search)

			fireEvent.press(searchIcon)

			expect(mockRouter.push).toHaveBeenCalledWith('/documents/search')
		})
	})

	describe('Documents Filters', () => {
		it('should clear filters and apply them when Apply button is pressed', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)

			expect(getByTestId('documents-filters-modal')).toBeTruthy()

			fireEvent.press(getByTestId('clear-filters-button'))
			fireEvent.press(getByTestId('apply-filters-button'))

			expect(mockRouter.setParams).toHaveBeenCalledWith({
				startDate: undefined,
				endDate: undefined,
				folders: undefined,
			})
		})
		it('should display selected date range when params are provided', async () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				startDate: '2025-09-01T00:00:00.000Z',
				endDate: '2025-09-07T00:00:00.000Z',
			})

			const { UNSAFE_getByType, getByText, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)

			expect(getByTestId('documents-filters-modal')).toBeTruthy()

			const modal = getByTestId('documents-filters-modal')

			fireEvent(modal, 'onShow')

			expect(getByText(/01 Sep, 2025/)).toBeTruthy()
			expect(getByText(/07 Sep, 2025/)).toBeTruthy()
		})

		it('should display partial date range when only start date is provided', async () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				startDate: '2025-09-01T00:00:00.000Z',
			})

			const { UNSAFE_getByType, getByText, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)

			expect(getByTestId('documents-filters-modal')).toBeTruthy()

			const modal = getByTestId('documents-filters-modal')

			fireEvent(modal, 'onShow')

			await waitFor(() => {
				expect(getByText(/01 Sep, 2025/)).toBeTruthy()
			})
		})

		it('should open date picker when date range button is pressed', () => {
			const { UNSAFE_getByType, getByTestId, queryByTestId } = render(
				<Documents />,
			)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)

			expect(queryByTestId('date-time-picker')).toBeFalsy()

			fireEvent.press(getByTestId('date-range-picker-button'))

			expect(queryByTestId('date-range-picker')).toBeTruthy()
		})

		it('should show correct preset button texts', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)

			expect(getByTestId('preset-today-button')).toBeTruthy()
			expect(getByTestId('preset-this-week-button')).toBeTruthy()
			expect(getByTestId('preset-this-month-button')).toBeTruthy()
		})

		it('should handle today preset correctly when Apply is pressed', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)
			fireEvent.press(getByTestId('preset-today-button'))
			fireEvent.press(getByTestId('apply-filters-button'))

			expect(mockRouter.setParams).toHaveBeenCalledWith({
				startDate: expect.any(String),
				endDate: expect.any(String),
				folders: undefined,
			})
		})

		it('should handle past week preset correctly when Apply is pressed', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)
			fireEvent.press(getByTestId('preset-this-week-button'))
			fireEvent.press(getByTestId('apply-filters-button'))

			expect(mockRouter.setParams).toHaveBeenCalledWith({
				startDate: expect.any(String),
				endDate: expect.any(String),
				folders: undefined,
			})

			const calls = mockRouter.setParams.mock.calls
			const lastCall = calls[calls.length - 1][0]
			const startDate = new Date(lastCall.startDate)
			const endDate = new Date(lastCall.endDate)
			const today = new Date()

			expect(endDate.getDate()).toBe(today.getDate())
			expect(endDate.getMonth()).toBe(today.getMonth())
			expect(endDate.getFullYear()).toBe(today.getFullYear())
			expect(endDate.getHours()).toBe(23)

			// Start date should be 6 days before today (7 days total including today)
			const expectedStartDate = new Date()
			expectedStartDate.setDate(today.getDate() - 6)
			expect(startDate.getDate()).toBe(expectedStartDate.getDate())
			expect(startDate.getHours()).toBe(0)
		})

		it('should handle past month preset correctly when Apply is pressed', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)
			fireEvent.press(getByTestId('preset-this-month-button'))
			fireEvent.press(getByTestId('apply-filters-button'))

			expect(mockRouter.setParams).toHaveBeenCalledWith({
				startDate: expect.any(String),
				endDate: expect.any(String),
				folders: undefined,
			})

			const calls = mockRouter.setParams.mock.calls
			const lastCall = calls[calls.length - 1][0]
			const startDate = new Date(lastCall.startDate)
			const endDate = new Date(lastCall.endDate)
			const today = new Date()

			expect(endDate.getDate()).toBe(today.getDate())
			expect(endDate.getMonth()).toBe(today.getMonth())
			expect(endDate.getFullYear()).toBe(today.getFullYear())
			expect(endDate.getHours()).toBe(23)

			// Start date should be 29 days before today (30 days total including today)
			const expectedStartDate = new Date()
			expectedStartDate.setDate(today.getDate() - 29)
			expect(startDate.getDate()).toBe(expectedStartDate.getDate())
			expect(startDate.getHours()).toBe(0)
		})

		it('should have proper accessibility testIDs for date picker elements', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)

			expect(getByTestId('date-range-picker-button')).toBeTruthy()
			expect(getByTestId('preset-today-button')).toBeTruthy()
			expect(getByTestId('preset-this-week-button')).toBeTruthy()
			expect(getByTestId('preset-this-month-button')).toBeTruthy()
		})

		it('should have Apply and Cancel buttons with proper testIDs', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)

			expect(getByTestId('apply-filters-button')).toBeTruthy()
			expect(getByTestId('cancel-filters-button')).toBeTruthy()
		})

		it('should not apply changes when Cancel button is pressed', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)
			fireEvent.press(getByTestId('preset-today-button'))
			fireEvent.press(getByTestId('cancel-filters-button'))

			expect(mockRouter.setParams).not.toHaveBeenCalled()
		})

		it('should apply preset changes only when Apply button is pressed', () => {
			const { UNSAFE_getByType, getByTestId } = render(<Documents />)
			const filterButton = UNSAFE_getByType(
				require('lucide-react-native').Filter,
			)

			fireEvent.press(filterButton)

			// Select preset but don't apply yet
			fireEvent.press(getByTestId('preset-today-button'))
			expect(mockRouter.setParams).not.toHaveBeenCalled()

			// Now apply the changes
			fireEvent.press(getByTestId('apply-filters-button'))
			expect(mockRouter.setParams).toHaveBeenCalledWith({
				startDate: expect.any(String),
				endDate: expect.any(String),
				folders: undefined,
			})
		})
	})
})
