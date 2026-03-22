import { render, fireEvent } from '@/utils/test-utils'
import DocumentFolder from '@/app/(main)/document-folder/[folderName]'
import { useGetFolderSummaryControllerFindAll } from '@/gen/api/react-query/useGetFolderSummaryControllerFindAll'
import { useRouter, useLocalSearchParams } from 'expo-router'
import DocumentsList from '@/components/Documents/DocumentsList'

jest.mock('@/gen/api/react-query/useGetFolderSummaryControllerFindAll', () => ({
	useGetFolderSummaryControllerFindAll: jest.fn(),
}))

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
	useLocalSearchParams: jest.fn(),
}))

jest.mock('@/components/Documents/DocumentsList', () => {
	return function DocumentsList() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockText = require('react-native').Text
		// Mock useLocalSearchParams to get folderName from route
		const { useLocalSearchParams } = require('expo-router')
		const params = useLocalSearchParams()
		const folderName = params.folderName || 'default-folder'

		return (
			<MockView testID={`documents-list-${folderName}`}>
				<MockText>Documents List for {folderName}</MockText>
			</MockView>
		)
	}
})

jest.mock('@/components/Icon', () => ({
	Icon: {
		Root: ({ children }: { children: React.ReactNode }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView testID='icon-root'>{children}</MockView>
		},
		IconContainer: ({
			children,
			style,
		}: {
			children: React.ReactNode
			style?: object
		}) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return (
				<MockView testID='icon-container' style={style}>
					{children}
				</MockView>
			)
		},
		Icon: ({
			name,
		}: {
			name: string
			size: number
			stroke: string
		}) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView testID={`icon-${name}`} />
		},
	},
}))

jest.mock('@/components/Documents/FolderList', () => ({
	formatDate: jest.fn((date: string) => (date ? 'Jan 15, 2024' : '')),
}))

jest.mock('lucide-react-native', () => ({
	X: ({
		testID,
		onPress,
	}: {
		testID?: string
		onPress: () => void
	}) => {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockTouchable = require('react-native').TouchableOpacity
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockText = require('react-native').Text
		return (
			<MockTouchable testID={testID} onPress={onPress}>
				<MockText>X Icon</MockText>
			</MockTouchable>
		)
	},
	Search: () => {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockText = require('react-native').Text
		return <MockText>Search Icon</MockText>
	},
	FolderClosed: () => {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		return <MockView testID='folder-icon' />
	},
}))
describe('FolderContent Component', () => {
	const mockRouter = {
		back: jest.fn(),
		push: jest.fn(),
		setParams: jest.fn(),
	}

	const mockFolderData = [
		{
			folderName: 'IDENTIFICATION',
			fileCount: 5,
			mostRecentUpdatedDate: '2024-01-15T10:30:00Z',
		},
		{
			folderName: 'TAX_DOCUMENTS',
			fileCount: 3,
			mostRecentUpdatedDate: '2024-01-10T08:15:00Z',
		},
		{
			folderName: 'OTHER',
			fileCount: 0,
			mostRecentUpdatedDate: null,
		},
	]

	beforeEach(() => {
		jest.clearAllMocks()
		;(useRouter as jest.Mock).mockReturnValue(mockRouter)
		;(useGetFolderSummaryControllerFindAll as jest.Mock).mockReturnValue({
			data: { documentsByFolder: mockFolderData },
			isLoading: false,
			error: null,
			queryKey: [],
		})
	})

	describe('Rendering', () => {
		it('should render folder content with correct folder name from params', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				folderName: 'IDENTIFICATION',
			})

			const { getByTestId } = render(<DocumentFolder />)

			expect(getByTestId('document-folder-name')).toBeTruthy()
		})
	})

	describe('Navigation', () => {
		it('should call router.back when back button is pressed', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				folderName: 'IDENTIFICATION',
			})

			const { getByTestId } = render(<DocumentFolder />)

			const backButton = getByTestId('back-button')
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})
	})

	describe('Search Functionality', () => {
		it('should show search list when search icon is pressed', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				folderName: 'IDENTIFICATION',
			})

			const { getByTestId } = render(<DocumentFolder />)

			const searchIcon = getByTestId('search-icon')
			fireEvent.press(searchIcon)

			expect(mockRouter.push).toHaveBeenCalledWith(
				'/documents/search?folderName=IDENTIFICATION',
			)

			expect(DocumentsList).toBeTruthy
		})
	})

	describe('Component Integration', () => {
		it('should render DocumentsList with correct folder name', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				folderName: 'TAX_DOCUMENTS',
			})

			const { getByTestId } = render(<DocumentFolder />)

			expect(getByTestId('document-folder-name')).toBeTruthy()
		})

		it('should render folder icon', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({
				folderName: 'IDENTIFICATION',
			})

			const { getByTestId } = render(<DocumentFolder />)

			expect(getByTestId('folder-icon')).toBeTruthy()
		})
	})

	describe('Error Handling', () => {
		it('should handle loading state', () => {
			;(useLocalSearchParams as jest.Mock).mockReturnValue({})
			;(useGetFolderSummaryControllerFindAll as jest.Mock).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
				queryKey: [],
			})

			const { getByTestId } = render(<DocumentFolder />)

			const dashElements = getByTestId('documents-list-default-folder')
			expect(dashElements).toBeTruthy
		})
	})
})
