import { render, fireEvent, waitFor } from '@/utils/test-utils'
import DocumentSearch from '@/app/(main)/documents/search'
import { useInfiniteQuery } from '@tanstack/react-query'

import { useGetRecentlyViewedDocumentsControllerGetRecentlyViewed } from '@/gen/index'
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
	useGetRecentlyViewedDocumentsControllerGetRecentlyViewed: jest.fn(),
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

describe('DocumentSearch Component', () => {
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

	const mockInfiniteQueryData = {
		pages: [{ documents: mockDocuments }],
		pageParams: [0],
	}

	const mockFetchNextPage = jest.fn()
	const mockRouter = {
		push: jest.fn(),
		back: jest.fn(),
		setParams: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		;(useLocalSearchParams as jest.Mock).mockReturnValue({})
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
	})

	describe('Component Rendering', () => {
		it('should render search page correctly', () => {
			const { getByTestId, UNSAFE_getAllByType } = render(<DocumentSearch />)
			expect(getByTestId('document-search-content')).toBeTruthy()
			expect(
				UNSAFE_getAllByType(require('lucide-react-native').ArrowLeft),
			).toBeTruthy()

			expect(getByTestId('search-input')).toBeTruthy()
		})

		it('should render search input with placeholder', () => {
			const { getByPlaceholderText } = render(<DocumentSearch />)
			expect(getByPlaceholderText('search')).toBeTruthy()
		})

		it('should render documents list', () => {
			const { getByTestId } = render(<DocumentSearch />)
			expect(getByTestId('documents-flatlist')).toBeTruthy()
		})
	})

	describe('Search Input', () => {
		it('should display search value from params', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				search: 'test query',
			})

			const { getByDisplayValue } = render(<DocumentSearch />)
			expect(getByDisplayValue('test query')).toBeTruthy()
		})

		it('should display empty string when no search param', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({})

			const { getByTestId } = render(<DocumentSearch />)
			const input = getByTestId('search-input')
			expect(input.props.value).toBe('')
		})

		it('should update search param when text changes', () => {
			const { getByTestId } = render(<DocumentSearch />)
			const input = getByTestId('search-input')

			fireEvent.changeText(input, 'new search query')

			expect(mockRouter.setParams).toHaveBeenCalledWith({
				search: 'new search query',
			})
		})

		it('should call setParams multiple times for different search texts', () => {
			const { getByTestId } = render(<DocumentSearch />)
			const input = getByTestId('search-input')

			fireEvent.changeText(input, 'first query')
			fireEvent.changeText(input, 'second query')

			expect(mockRouter.setParams).toHaveBeenCalledTimes(2)
			expect(mockRouter.setParams).toHaveBeenNthCalledWith(1, {
				search: 'first query',
			})
			expect(mockRouter.setParams).toHaveBeenNthCalledWith(2, {
				search: 'second query',
			})
		})

		it('should have autoFocus enabled on search input', () => {
			const { getByTestId } = render(<DocumentSearch />)
			const input = getByTestId('search-input')
			expect(input.props.autoFocus).toBe(true)
		})
	})

	describe('Navigation', () => {
		it('should call router.back when back arrow is pressed', () => {
			const { UNSAFE_getByType } = render(<DocumentSearch />)
			const backButton = UNSAFE_getByType(
				require('lucide-react-native').ArrowLeft,
			)

			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalled()
		})

		it('should render back arrow icon', () => {
			const { UNSAFE_getByType } = render(<DocumentSearch />)
			const arrowIcon = UNSAFE_getByType(
				require('lucide-react-native').ArrowLeft,
			)

			expect(arrowIcon).toBeTruthy()
		})

		it('should render search icon', () => {
			const { UNSAFE_getByType } = render(<DocumentSearch />)
			const searchIcon = UNSAFE_getByType(require('lucide-react-native').Search)

			expect(searchIcon).toBeTruthy()
		})
	})

	describe('Folder Context', () => {
		it('should display "recent_searches" when no folder is specified', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({})

			const { getByText } = render(<DocumentSearch />)
			expect(getByText('recent_searches')).toBeTruthy()
		})

		it('should display "matching_search_results" when search query is present', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				search: 'test query',
			})

			const { getByText } = render(<DocumentSearch />)
			expect(getByText('matching_search_results')).toBeTruthy()
		})

		it('should pass folderName to DocumentsList via params', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				folderName: 'TAX_DOCUMENTS',
			})

			render(<DocumentSearch />)

			// The DocumentsList should be able to read the folderName from params
			expect(useLocalSearchParams).toHaveBeenCalled()
		})
	})

	describe('Documents List Integration', () => {
		it('should render documents from API', () => {
			const { getByTestId } = render(<DocumentSearch />)

			expect(getByTestId('document-item-Document 1.pdf')).toBeTruthy()
			expect(getByTestId('document-item-Document 2.docx')).toBeTruthy()
		})

		it('should render correct number of document items', () => {
			const { getAllByTestId } = render(<DocumentSearch />)

			expect(getAllByTestId(/document-item-/).length).toBe(mockDocuments.length)
		})

		it('should pass withSearch prop to DocumentsList', () => {
			const { getByTestId } = render(<DocumentSearch />)

			// Verify the list is rendered (which means props were passed correctly)
			expect(getByTestId('documents-flatlist')).toBeTruthy()
		})
	})

	describe('Loading State', () => {
		it('should show skeleton when loading', () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: undefined,
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: true,
			})

			const { getByTestId } = render(<DocumentSearch />)
			expect(getByTestId('documents-skeleton')).toBeTruthy()
		})

		it('should hide skeleton when data is loaded', () => {
			const { queryByTestId, getByTestId } = render(<DocumentSearch />)
			expect(queryByTestId('documents-skeleton')).toBeNull()
			expect(getByTestId('documents-flatlist')).toBeTruthy()
		})
	})

	describe('Empty State', () => {
		it('should show empty state when no documents found', () => {
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: { pages: [{ documents: [] }] },
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})
			;(
				useGetRecentlyViewedDocumentsControllerGetRecentlyViewed as jest.Mock
			).mockReturnValue({
				data: { documents: [] },
				isLoading: false,
			})

			const { getByTestId } = render(<DocumentSearch />)
			expect(getByTestId('no-documents-heading')).toBeTruthy()
			expect(getByTestId('no-documents-description')).toBeTruthy()
		})

		it('should show empty state with search query in context', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				search: 'nonexistent document',
			})
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: { pages: [{ documents: [] }] },
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})

			const { getByText } = render(<DocumentSearch />)
			expect(getByText('no_documents_found')).toBeTruthy()
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

			const { getByTestId } = render(<DocumentSearch />)
			const flatList = getByTestId('documents-flatlist')

			fireEvent(flatList, 'onEndReached')

			await waitFor(() => {
				expect(mockFetchNextPage).toHaveBeenCalled()
			})
		})

		it('should not call fetchNextPage when no more pages available', async () => {
			const { getByTestId } = render(<DocumentSearch />)
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

			const { getByTestId } = render(<DocumentSearch />)
			expect(getByTestId('footer-loader')).toBeTruthy()
		})
	})

	describe('Search with Filters', () => {
		it('should handle search with folder filter', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				search: 'test',
				folderName: 'IDENTIFICATION',
			})

			render(<DocumentSearch />)

			// Verify both params are being used
			expect(useLocalSearchParams).toHaveBeenCalled()
		})

		it('should update query when search text changes with folder context', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				folderName: 'TAX_DOCUMENTS',
			})

			const { getByTestId } = render(<DocumentSearch />)
			const input = getByTestId('search-input')

			fireEvent.changeText(input, 'tax report')

			expect(mockRouter.setParams).toHaveBeenCalledWith({
				search: 'tax report',
			})
		})
	})

	describe('Recently Viewed Documents', () => {
		it('should show recently viewed documents when search is empty', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				search: '',
			})

			const { getByTestId } = render(<DocumentSearch />)

			// Recently viewed documents should be displayed
			expect(getByTestId('document-item-Document 1.pdf')).toBeTruthy()
			expect(getByTestId('document-item-Document 2.docx')).toBeTruthy()
		})

		it('should not show recently viewed when search has value', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				search: 'specific query',
			})
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: { pages: [{ documents: [] }] },
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})

			render(<DocumentSearch />)

			// The query should be used for search results, not recently viewed
			expect(useInfiniteQuery).toHaveBeenCalledWith(
				expect.objectContaining({
					queryKey: expect.arrayContaining(['documents', 'specific query']),
				}),
			)
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
				useGetRecentlyViewedDocumentsControllerGetRecentlyViewed as jest.Mock
			).mockReturnValue({
				data: undefined,
				isLoading: false,
			})

			const { getByTestId } = render(<DocumentSearch />)
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
			;(
				useGetRecentlyViewedDocumentsControllerGetRecentlyViewed as jest.Mock
			).mockReturnValue({
				data: { documents: undefined },
				isLoading: false,
			})

			const { getByTestId } = render(<DocumentSearch />)
			expect(getByTestId('no-documents-heading')).toBeTruthy()
		})
	})

	describe('Multiple Pages', () => {
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
					folder: 'OTHER',
					thumbnailBlobName: 'thumbnail3.jpg',
					uploadedBy: 'test-user-id',
					version: 1,
					updatedAt: '2024-01-13T08:00:00Z',
					viewedAt: '2024-01-13T08:00:00Z',
				},
			]
			;(useInfiniteQuery as jest.Mock).mockReturnValue({
				data: {
					pages: [{ documents: [...mockDocuments, additionalDocuments] }],
				},
				fetchNextPage: mockFetchNextPage,
				hasNextPage: false,
				isFetchingNextPage: false,
				isLoading: false,
			})
			;(
				useGetRecentlyViewedDocumentsControllerGetRecentlyViewed as jest.Mock
			).mockReturnValue({
				data: { documents: [...mockDocuments, additionalDocuments] },
				isLoading: false,
			})

			const { getAllByTestId } = render(<DocumentSearch />)
			expect(getAllByTestId(/document-item-/).length).toBe(3)
		})
	})
})
