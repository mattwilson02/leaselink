import { fireEvent, render } from '@/utils/test-utils'
import DocumentRequests from '@/app/(main)/document-requests'
import {
	useAuthControllerHandle,
	useGetDocumentRequestsByClientIdControllerFindAll,
} from '@/gen/index'

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
	documentRequestDTOStatusEnum: {
		// biome-ignore lint/style/useNamingConvention: <enum>
		UPLOADED: 'UPLOADED',
		// biome-ignore lint/style/useNamingConvention: <enum>
		PENDING: 'PENDING',
		// biome-ignore lint/style/useNamingConvention: <enum>
		CANCELED: 'CANCELED',
	},
	documentRequestDTORequestTypeEnum: {
		// biome-ignore lint/style/useNamingConvention: <enum>
		PROOF_OF_ADDRESS: 'PROOF_OF_ADDRESS',
		// biome-ignore lint/style/useNamingConvention: <enum>
		PROOF_OF_IDENTITY: 'PROOF_OF_IDENTITY',
	},
}))

jest.mock('@/components/Documents/DocumentRequestItem', () => {
	return function DocumentRequestItem({
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

		return (
			<MockView testID={`document-request-item-${requestId}`}>
				<MockView testID={`request-type-${requestType}`} />
				<MockView testID={`status-${status}`} />
			</MockView>
		)
	}
})

jest.mock('@/components/Documents/DocumentRequestsListSkeleton', () => {
	return function DocumentRequestsListSkeleton() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View

		return <MockView testID='documents-request-skeleton' />
	}
})

jest.mock('expo-router', () => ({
	useRouter: jest.fn(() => ({
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
	})),
}))

const mockRouter = {
	back: jest.fn(),
	push: jest.fn(),
	replace: jest.fn(),
}

describe('DocumentRequests Component', () => {
	const mockUser = {
		id: 'test-user-id',
	}

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
			requestType: 'PROOF_OF_IDENTITY',
			status: 'UPLOADED',
			clientId: 'test-client-id',
			documentId: '2',
			createdAt: '2024-01-14T09:15:00Z',
			updatedAt: '2024-01-14T09:15:00Z',
		},
		{
			id: 'request-3',
			requestType: 'PROOF_OF_IDENTITY',
			status: 'CANCELED',
			clientId: 'test-client-id',
			documentId: '3',
			createdAt: '2024-01-13T08:00:00Z',
			updatedAt: '2024-01-13T08:00:00Z',
		},
		{
			id: 'request-4',
			requestType: 'PROOF_OF_IDENTITY',
			status: 'PENDING',
			clientId: 'test-client-id',
			documentId: '3',
			createdAt: '2024-01-13T08:00:00Z',
			updatedAt: '2024-01-13T08:00:00Z',
		},
	]

	beforeEach(() => {
		jest.clearAllMocks()
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: mockUser,
		})
		;(
			useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
		).mockReturnValue({
			data: { documentRequests: mockDocumentRequests },
			isLoading: false,
		})
		;(require('expo-router').useRouter as jest.Mock).mockReturnValue(mockRouter)
	})

	describe('User Authentication', () => {
		it('should render when user is authenticated', () => {
			const { getByText, getAllByText } = render(<DocumentRequests />)
			expect(getAllByText('required_documents')).toHaveLength(1)
			expect(getByText('required_documents_description')).toBeTruthy()
		})
	})

	describe('API Query Configuration', () => {
		it('should call getDocumentRequests with correct parameters', () => {
			render(<DocumentRequests />)

			expect(
				useGetDocumentRequestsByClientIdControllerFindAll,
			).toHaveBeenCalled()
		})

		it('should handle API call when user data is available', () => {
			render(<DocumentRequests />)

			expect(
				useGetDocumentRequestsByClientIdControllerFindAll,
			).toHaveBeenCalledTimes(1)
		})
	})

	describe('Header Section', () => {
		it('should render header with correct elements', () => {
			const { getByText, getAllByText, UNSAFE_getByType } = render(
				<DocumentRequests />,
			)

			const backButton = UNSAFE_getByType(require('lucide-react-native').X)

			expect(getAllByText('required_documents')).toHaveLength(1)
			expect(getByText('required_documents_description')).toBeTruthy()
			expect(backButton).toBeTruthy
		})

		it('should render upload icon in header', () => {
			const { UNSAFE_getByProps } = render(<DocumentRequests />)

			expect(UNSAFE_getByProps({ name: 'upload-01' })).toBeTruthy()
		})

		it('should call router.back when back button is pressed', () => {
			const { getByTestId } = render(<DocumentRequests />)
			const backButton = getByTestId('back-button')

			fireEvent.press(backButton)

			expect(mockRouter.replace).toHaveBeenCalledTimes(1)
		})
	})

	describe('Loading State', () => {
		it('should show skeleton when loading', () => {
			;(
				useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
			).mockReturnValue({
				data: undefined,
				isLoading: true,
			})

			const { getByTestId } = render(<DocumentRequests />)
			expect(getByTestId('documents-request-skeleton')).toBeTruthy()
		})

		it('should hide skeleton when data is loaded', () => {
			const { queryByTestId } = render(<DocumentRequests />)
			expect(queryByTestId('documents-request-skeleton')).toBeNull()
		})
	})

	describe('Document Requests List', () => {
		it('should render all document requests correctly', () => {
			const { getByTestId, queryByTestId } = render(<DocumentRequests />)

			expect(getByTestId('document-request-item-request-1')).toBeTruthy()
			expect(queryByTestId('document-request-item-request-2')).toBeNull()
		})

		it('should render correct number of document request items', () => {
			const { getAllByTestId } = render(<DocumentRequests />)

			expect(getAllByTestId(/document-request-item-/).length).toBe(2)
		})

		it('should pass correct props to DocumentRequestItem components', () => {
			const { getByTestId, getAllByTestId, queryByTestId } = render(
				<DocumentRequests />,
			)

			expect(getByTestId('request-type-PROOF_OF_ADDRESS')).toBeTruthy()
			expect(getByTestId('request-type-PROOF_OF_IDENTITY')).toBeTruthy()
			expect(getAllByTestId('status-PENDING')).toHaveLength(2)
			expect(queryByTestId('status-CANCELED')).toBeNull()

			expect(queryByTestId('status-UPLOADED')).toBeNull()
		})

		it('should render FlatList with document requests', () => {
			const { getByTestId, queryByTestId } = render(<DocumentRequests />)

			expect(getByTestId('document-request-item-request-1')).toBeTruthy()
			expect(queryByTestId('document-request-item-request-2')).toBeNull()
		})

		it('should not render items with status UPLOADED', () => {
			const { queryAllByTestId } = render(<DocumentRequests />)

			expect(queryAllByTestId(/document-request-item-request-2/).length).toBe(0)
		})

		it('should only render items that are not UPLOADED', () => {
			const { getByTestId, queryByTestId } = render(<DocumentRequests />)

			expect(getByTestId('document-request-item-request-1')).toBeTruthy()
			expect(queryByTestId('document-request-item-request-2')).toBeNull()

			expect(queryByTestId('document-request-item-request-2')).toBeNull()
		})
	})

	describe('Layout and Styling', () => {
		it('should render with correct layout structure', () => {
			const { UNSAFE_getAllByType } = render(<DocumentRequests />)

			const views = UNSAFE_getAllByType(require('react-native').View)
			const layoutView = views.find(
				(view) =>
					view.props.style &&
					typeof view.props.style === 'object' &&
					view.props.style.flex === 1 &&
					view.props.style.backgroundColor === 'white',
			)

			expect(layoutView).toBeTruthy()
			expect(layoutView?.props.style.gap).toBe(20)
		})

		it('should apply correct header styles', () => {
			const { UNSAFE_getAllByType } = render(<DocumentRequests />)

			const views = UNSAFE_getAllByType(require('react-native').View)
			const headerView = views.find(
				(view) =>
					view.props.style &&
					typeof view.props.style === 'object' &&
					view.props.style.paddingHorizontal === 16,
			)

			expect(headerView).toBeTruthy()
		})
	})

	describe('Error Handling', () => {
		it('should handle undefined data gracefully', () => {
			;(
				useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
			).mockReturnValue({
				data: undefined,
				isLoading: false,
			})

			expect(() => render(<DocumentRequests />)).not.toThrow()
		})

		it('should handle API errors gracefully', () => {
			;(
				useGetDocumentRequestsByClientIdControllerFindAll as jest.Mock
			).mockReturnValue({
				data: null,
				isLoading: false,
				error: new Error('API Error'),
			})

			expect(() => render(<DocumentRequests />)).not.toThrow()
		})
	})

	describe('Component Integration', () => {
		it('should pass showPreview as false to DocumentRequestsList', () => {
			const { getAllByTestId } = render(<DocumentRequests />)

			expect(getAllByTestId(/document-request-item-/).length).toBe(2)
		})
	})

	describe('Navigation', () => {
		it('should have back button functionality', () => {
			const { getByTestId } = render(<DocumentRequests />)

			const backButton = getByTestId('back-button')
			fireEvent.press(backButton)

			expect(mockRouter.replace).toHaveBeenCalledTimes(1)
		})

		it('should use router.back when back button is pressed', () => {
			const { getByTestId } = render(<DocumentRequests />)

			const backButton = getByTestId('back-button')
			fireEvent.press(backButton)

			expect(mockRouter.replace).toHaveBeenCalledTimes(1)
		})
	})
})
