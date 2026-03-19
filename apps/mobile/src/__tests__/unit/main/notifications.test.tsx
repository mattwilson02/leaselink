import { render, fireEvent, waitFor } from '@/utils/test-utils'
import Notifications from '@/app/(main)/notifications'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
	type GetNotificationsDTO,
	useAuthControllerHandle,
	useMarkAllNotificationsAsReadControllerMarkAllAsRead,
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
	useMarkAllNotificationsAsReadControllerMarkAllAsRead: jest.fn(() => ({
		mutateAsync: jest.fn(),
		isPending: false,
	})),
	useUpdateNotificationControllerUpdate: jest.fn(() => ({
		mutateAsync: jest.fn(),
	})),
}))

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
}))

jest.mock('@/components/Notifications/NotificationItem', () => {
	return function NotificationItem({
		notification,
	}: { notification: GetNotificationsDTO }) {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockText = require('react-native').Text

		return (
			<MockView testID={`notification-item-${notification.id}`}>
				<MockText>{notification.text}</MockText>
			</MockView>
		)
	}
})

jest.mock('@/components/Notifications/NotificationsListSkeleton', () => {
	return function NotificationListSkeleton() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View

		return <MockView testID='notifications-skeleton' />
	}
})

describe('Notifications Component', () => {
	const mockRouter = {
		back: jest.fn(),
		replace: jest.fn(),
		push: jest.fn(),
	}

	const mockUser = {
		id: 'test-user-id',
	}

	const mockNotifications = [
		{
			id: '1',
			text: 'First notification',
			createdAt: new Date().toISOString(),
			isRead: false,
			notificationType: 'INFO',
			linkedTransactionId: null,
			linkedDocumentId: 'doc1',
		},
		{
			id: '2',
			text: 'Second notification',
			createdAt: new Date().toISOString(),
			isRead: true,
			notificationType: 'ACTION',
			actionType: 'SIGN_DOCUMENT',
			linkedTransactionId: null,
			linkedDocumentId: null,
		},
	]

	const mockInfiniteQueryData = {
		pages: [{ notifications: mockNotifications }],
		pageParams: [0],
	}

	const mockFetchNextPage = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()

		require('expo-router').useRouter = jest.fn().mockReturnValue(mockRouter)
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: mockUser,
		})
		;(useInfiniteQuery as jest.Mock).mockReturnValue({
			data: mockInfiniteQueryData,
			fetchNextPage: mockFetchNextPage,
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		})
	})

	describe('User Authentication', () => {
		it('should render when user is authenticated', () => {
			const { getByTestId } = render(<Notifications />)
			expect(getByTestId('notifications-safe-area')).toBeTruthy()
		})
	})

	describe('API Query Configuration', () => {
		it('should configure useInfiniteQuery with correct parameters', () => {
			render(<Notifications />)

			expect(useInfiniteQuery).toHaveBeenCalledWith(
				expect.objectContaining({
					queryKey: ['notifications', undefined],
					initialPageParam: 0,
				}),
			)
		})

		it('should update query key when notification type changes', async () => {
			const { getByTestId, rerender } = render(<Notifications />)
			;(useInfiniteQuery as jest.Mock).mockImplementation(() => {
				return {
					data: mockInfiniteQueryData,
					fetchNextPage: mockFetchNextPage,
					hasNextPage: false,
					isFetchingNextPage: false,
					isLoading: false,
				}
			})

			const tabsRoot = getByTestId('tabs-root')
			fireEvent(tabsRoot, 'onValueChange', 'INFO')

			rerender(<Notifications />)

			await waitFor(() => {
				expect(useInfiniteQuery).toHaveBeenCalledWith(
					expect.objectContaining({
						queryKey: ['notifications', 'INFO'],
					}),
				)
			})
		})

		it('should configure queryFn correctly', async () => {
			render(<Notifications />)

			const queryConfig = (useInfiniteQuery as jest.Mock).mock.calls[0][0]
			expect(typeof queryConfig.queryFn).toBe('function')
			expect(typeof queryConfig.getNextPageParam).toBe('function')
		})

		it('should return undefined for next page when last page has fewer items than limit', () => {
			render(<Notifications />)

			const queryConfig = (useInfiniteQuery as jest.Mock).mock.calls[0][0]
			const getNextPageParam = queryConfig.getNextPageParam

			const lastPage = { notifications: [mockNotifications[0]] }
			const allPages = [lastPage]

			const result = getNextPageParam(lastPage, allPages)
			expect(result).toBeUndefined()
		})

		it('should return next page number when last page has full limit of items', () => {
			render(<Notifications />)

			const queryConfig = (useInfiniteQuery as jest.Mock).mock.calls[0][0]
			const getNextPageParam = queryConfig.getNextPageParam

			const fullPageNotifications = Array(10).fill(mockNotifications[0])
			const lastPage = { notifications: fullPageNotifications }
			const allPages = [lastPage]

			const result = getNextPageParam(lastPage, allPages)
			expect(result).toBe(1)
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

			const { getByTestId } = render(<Notifications />)
			expect(getByTestId('notifications-skeleton')).toBeTruthy()
		})

		it('should hide skeleton when data is loaded', () => {
			const { queryByTestId, getByTestId } = render(<Notifications />)
			expect(queryByTestId('notifications-skeleton')).toBeNull()
			expect(getByTestId('notifications-flatlist')).toBeTruthy()
		})
	})

	describe('Notifications List', () => {
		it('should render notifications correctly', () => {
			const { getByTestId } = render(<Notifications />)

			expect(getByTestId('notifications-flatlist')).toBeTruthy()
			expect(getByTestId('notification-item-1')).toBeTruthy()
			expect(getByTestId('notification-item-2')).toBeTruthy()
		})

		it('should render correct number of notification items', () => {
			const { getAllByTestId } = render(<Notifications />)

			expect(getAllByTestId(/notification-item-/).length).toBe(
				mockNotifications.length,
			)
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

			const { getByTestId } = render(<Notifications />)
			const flatList = getByTestId('notifications-flatlist')

			fireEvent(flatList, 'onEndReached')

			await waitFor(() => {
				expect(mockFetchNextPage).toHaveBeenCalled()
			})
		})

		it('should not call fetchNextPage when no more pages available', async () => {
			const { getByTestId } = render(<Notifications />)
			const flatList = getByTestId('notifications-flatlist')

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

			const { getByTestId } = render(<Notifications />)
			expect(getByTestId('footer-loader')).toBeTruthy()
		})
	})

	describe('Tab Navigation', () => {
		it('should render all tab triggers', () => {
			const { getByTestId } = render(<Notifications />)

			expect(getByTestId('tab-trigger-ALL')).toBeTruthy()
			expect(getByTestId('tab-trigger-INFO')).toBeTruthy()
			expect(getByTestId('tab-trigger-ACTION')).toBeTruthy()
		})

		it('should display correct heading for different tabs', () => {
			const { getByTestId } = render(<Notifications />)
			const heading = getByTestId('notifications-heading')
			expect(heading.props.children).toBe('all')
		})
	})

	describe('Mark All as Read', () => {
		it('calls markAllAsRead when the button is pressed', async () => {
			const mutateAsync: jest.Mock = jest.fn().mockResolvedValue({})
			;(
				useMarkAllNotificationsAsReadControllerMarkAllAsRead as jest.Mock
			).mockReturnValue({
				mutateAsync,
				isPending: false,
			})

			const { getByText } = render(<Notifications />)

			const button = getByText('mark_all_as_read')
			fireEvent.press(button)

			await waitFor(() => {
				expect(mutateAsync).toHaveBeenCalled()
			})
		})
	})
})
