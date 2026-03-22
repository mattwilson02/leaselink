import { render, fireEvent, waitFor } from '@/utils/test-utils'
import NotificationItem from '../NotificationItem'
import type { GetNotificationsDTO } from '@/gen/index'
import type React from 'react'
import dayjs from 'dayjs'

jest.mock('react-native-gesture-handler', () => {
	return {
		Swipeable: ({ children }: { children: React.ReactNode }) => {
			return children
		},
		GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
			children,
		PanGestureHandler: ({ children }: { children: React.ReactNode }) =>
			children,
		State: {},
	}
})

jest.mock('jotai', () => ({
	useSetAtom: jest.fn().mockReturnValue(jest.fn()),
	atom: jest.fn(),
}))

jest.mock('@/app/(main)/notifications', () => ({
	notificationSnackbarAtom: jest.fn(),
}))

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
	const { View } = require('react-native')

	return ({
		children,
		testID,
		onSwipeableOpen,
		...props
	}: {
		children: React.ReactNode
		testID?: string
		onSwipeableOpen?: () => void
		[key: string]: unknown
	}) => (
		<View testID={testID} onSwipeableOpen={onSwipeableOpen} {...props}>
			{children}
		</View>
	)
})

jest.mock('react-native-reanimated', () => {
	const actualReanimated = jest.requireActual('react-native-reanimated/mock')
	return {
		...actualReanimated,
		useSharedValue: jest.fn(() => ({ value: 0 })),
		useAnimatedStyle: jest.fn((callback: () => Record<string, unknown>) => {
			try {
				return callback() || {}
			} catch {
				return {}
			}
		}),
		interpolate: jest.fn(() => 0),
	}
})

jest.mock('expo-notifications', () => ({
	setNotificationHandler: jest.fn(),
	addNotificationReceivedListener: jest.fn(() => ({
		remove: jest.fn(),
	})),
	addNotificationResponseReceivedListener: jest.fn(() => ({
		remove: jest.fn(),
	})),
	getPermissionsAsync: jest.fn(),
	requestPermissionsAsync: jest.fn(),
	getExpoPushTokenAsync: jest.fn(),
	setNotificationChannelAsync: jest.fn(),
}))

jest.mock('@/context/push-notification-context', () => ({
	PushNotificationProvider: ({ children }: { children: React.ReactNode }) =>
		children,
	usePushNotifications: jest.fn(() => ({
		expoPushToken: 'mock-token',
		notification: null,
		isLoading: false,
		error: null,
		sendTestNotification: jest.fn(),
	})),
}))

jest.mock('@/utils/register-for-push-notifications', () => ({
	registerForPushNotificationsAsync: jest.fn(),
}))

jest.mock('@/utils/format-date', () => ({
	formatDate: jest.fn((date: string) => {
		const dayjs = require('dayjs')
		const now = dayjs()
		const notifDate = dayjs(date)

		// Within last 5 minutes
		if (notifDate.isAfter(now.subtract(5, 'minutes'))) {
			return { type: 'alias', value: 'just_now' }
		}

		// Today
		if (notifDate.isSame(now, 'day')) {
			return { type: 'date', value: notifDate.format('HH:mm') }
		}

		// Yesterday
		if (notifDate.isSame(now.subtract(1, 'day'), 'day')) {
			return { type: 'alias', value: 'yesterday' }
		}

		// Older
		return { type: 'date', value: notifDate.format('DD MMM YYYY') }
	}),
}))

describe('NotificationItem', () => {
	const mockNotificationBase: GetNotificationsDTO = {
		id: '1',
		text: 'Test notification text',
		createdAt: new Date().toISOString(),
		isRead: false,
		notificationType: 'INFO',
		linkedTransactionId: null,
		linkedDocumentId: null,
		linkedPaymentId: null,
		actionType: null,
		isActionComplete: false,
		personId: 'person-id',
		updatedAt: null,
		archivedAt: null,
	}
	const mockRouter = {
		back: jest.fn(),
		replace: jest.fn(),
		push: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()

		const mockUpdateNotification = jest.fn().mockResolvedValue({})

		require('expo-router').useRouter = jest.fn().mockReturnValue(mockRouter)
		require('@/gen/index').useUpdateNotificationControllerUpdate = jest
			.fn()
			.mockReturnValue({
				mutateAsync: mockUpdateNotification,
			})
	})

	describe('Notification Display', () => {
		it('should render notification text correctly', () => {
			const { getByText } = render(
				<NotificationItem notification={mockNotificationBase} />,
			)

			expect(getByText('Test notification text')).toBeTruthy()
		})

		it('should show unread indicator for unread notifications', () => {
			const { getByTestId } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						isRead: false,
					}}
				/>,
			)

			const unreadIndicator = getByTestId('unread-indicator')
			expect(unreadIndicator.props.style).toMatchObject({
				backgroundColor: expect.not.stringMatching(/transparent/),
			})
		})

		it('should hide unread indicator for read notifications', () => {
			const { getByTestId } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						isRead: true,
					}}
				/>,
			)

			const unreadIndicator = getByTestId('unread-indicator')
			expect(unreadIndicator.props.style).toMatchObject({
				backgroundColor: 'transparent',
			})
		})

		it('should apply unread background styling for unread notifications', () => {
			const { getByTestId } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						isRead: false,
					}}
				/>,
			)

			const animatedView = getByTestId('notification-animated-container')
			const style = Array.isArray(animatedView.props.style)
				? animatedView.props.style.flat()
				: [animatedView.props.style]
			const hasBackground = style.some(
				(s) =>
					s &&
					typeof s === 'object' &&
					'backgroundColor' in s &&
					s.backgroundColor !== 'white',
			)
			expect(hasBackground).toBe(true)
		})
	})

	describe('Date Formatting', () => {
		it('should display "Just now" for recent notifications', () => {
			const recentDate = new Date().toISOString()
			const { getByText } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						createdAt: recentDate,
					}}
				/>,
			)

			expect(getByText('just_now')).toBeTruthy()
		})

		it('should display time for notifications from today', () => {
			const todayDate = dayjs().subtract(2, 'hours').toISOString()
			const { getByText } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						createdAt: todayDate,
					}}
				/>,
			)

			const expectedTime = dayjs(todayDate).format('HH:mm')
			expect(getByText(expectedTime)).toBeTruthy()
		})

		it('should display full date for older notifications', () => {
			const oldDate = dayjs().subtract(2, 'days').toISOString()
			const { getByText } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						createdAt: oldDate,
					}}
				/>,
			)

			const expectedDate = dayjs(oldDate).format('DD MMM YYYY')
			expect(getByText(expectedDate)).toBeTruthy()
		})
	})

	describe('Archived Notification', () => {
		it('should not render swipeable actions for archived notifications', () => {
			const { getByTestId } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						archivedAt: new Date().toISOString(),
					}}
				/>,
			)
			// Should still render the notification container
			expect(getByTestId('notification-1')).toBeTruthy()
			// Should not render swipeable (no parent Swipeable)
			// This is a structural check, so we check that the notification container is not wrapped in Swipeable
			// (RTL does not expose Swipeable directly, so this is a smoke test)
		})
	})

	describe('Go to Page Button', () => {
		it('should show "Go to page" and navigate to document details button when there is a linkedDocumentId', async () => {
			const { getByText, getByTestId } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						linkedTransactionId: null,
						linkedDocumentId: 'doc123',
					}}
				/>,
			)
			expect(getByText('go_to_page')).toBeTruthy()

			const button = getByTestId('linked-item-button')

			fireEvent.press(button)

			expect(button).toBeTruthy()
			await waitFor(() => {
				expect(mockRouter.push).toHaveBeenCalledWith('/documents/doc123')
			})
		})

		it('should not show "Go to page" button when there is no linkedTransactionId', () => {
			const { queryByText } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						linkedTransactionId: null,
						linkedDocumentId: null,
					}}
				/>,
			)
			expect(queryByText('go_to_page')).toBeNull()
		})
	})

	describe('Icon Background Colors', () => {
		it('should apply warning background for ACTION notifications', () => {
			const { getByTestId } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						notificationType: 'ACTION',
						actionType: 'SIGN_DOCUMENT',
					}}
				/>,
			)

			const iconContainer = getByTestId('notification-icon-container')
			expect(iconContainer.props.style).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						backgroundColor: expect.stringContaining('#fffbeb'),
					}),
				]),
			)
		})

		it('should apply success background for INFO notifications with links', () => {
			const { getByTestId } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						notificationType: 'INFO',
						linkedTransactionId: 'tx123',
					}}
				/>,
			)

			const iconContainer = getByTestId('notification-icon-container')
			expect(iconContainer.props.style).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						backgroundColor: expect.stringContaining('#f0fdf4'),
					}),
				]),
			)
		})

		it('should apply neutral background for generic notifications', () => {
			const { getByTestId } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						notificationType: 'INFO',
					}}
				/>,
			)

			const iconContainer = getByTestId('notification-icon-container')
			expect(iconContainer.props.style).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						backgroundColor: expect.stringContaining('#f4f4f5'),
					}),
				]),
			)
		})
	})

	// Note: This test would require setting up navigation mocks if you implement the TODO
	describe('User Interactions', () => {
		it('should handle notification press (TODO: mark as read functionality)', () => {
			const { getByTestId } = render(
				<NotificationItem notification={mockNotificationBase} />,
			)

			const container = getByTestId('notification-1')
			// Currently no onPress implemented, but test structure is ready
			expect(container).toBeTruthy()
		})

		it('should handle "Go to page" button press', () => {
			const { getByText } = render(
				<NotificationItem
					notification={{
						...mockNotificationBase,
						linkedDocumentId: 'doc123',
					}}
				/>,
			)

			const button = getByText('go_to_page')
			fireEvent.press(button)
			// Add expectations here when navigation logic is implemented
			expect(button).toBeTruthy()
		})
	})

	it('should update notification as read on press', async () => {
		const mockUpdateNotification = jest.fn().mockResolvedValue({})
		require('@/gen/index').useUpdateNotificationControllerUpdate = jest
			.fn()
			.mockReturnValue({
				mutateAsync: mockUpdateNotification,
			})

		const { getByTestId } = render(
			<NotificationItem notification={mockNotificationBase} />,
		)

		const container = getByTestId('notification-1')
		fireEvent.press(container)

		expect(mockUpdateNotification).toHaveBeenCalledWith({
			data: {
				isRead: true,
			},
			id: '1',
		})
	})

	it('should archive notification on swipe', async () => {
		const mockUpdateNotification = jest.fn().mockResolvedValue({})
		require('@/gen/index').useUpdateNotificationControllerUpdate = jest
			.fn()
			.mockReturnValue({
				mutateAsync: mockUpdateNotification,
			})

		const { getByTestId } = render(
			<NotificationItem notification={mockNotificationBase} />,
		)

		// Simulate swipe by firing the swipe callback
		fireEvent(getByTestId('swipeable-1'), 'onSwipeableOpen')
		expect(mockUpdateNotification).toHaveBeenCalledWith({
			id: '1',
			data: {
				isArchived: true,
			},
		})
	})
})
