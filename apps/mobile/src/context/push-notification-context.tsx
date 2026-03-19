import { authClient } from '@/services/auth'
import { registerForPushNotificationsAsync } from '@/utils/register-for-push-notifications'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { createContext, useContext, useEffect, useState } from 'react'

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
})

interface NotificationContextType {
	expoPushToken: string | null
	isLoading: boolean
	error: string | null
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined,
)

export const usePushNotifications = (): NotificationContextType => {
	const context = useContext(NotificationContext)
	if (context === undefined) {
		throw new Error(
			'usePushNotifications must be used within a NotificationProvider',
		)
	}
	return context
}

export const PushNotificationProvider = ({
	children,
}: { children: React.ReactNode }) => {
	const router = useRouter()
	const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const session = authClient.useSession()

	const isSignedIn = !!session.data?.session?.token
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true

		const setupNotifications = async () => {
			try {
				const token = await registerForPushNotificationsAsync()
				if (isMounted) {
					setExpoPushToken(token ?? null)
					if (!token) {
						setError('Failed to get push notification token')
					}
				}
			} catch (err) {
				if (isMounted) {
					setError(
						err instanceof Error
							? err.message
							: 'Failed to register for push notifications',
					)
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		setupNotifications()

		const notificationListener = Notifications.addNotificationReceivedListener(
			(notification) => {
				if (isMounted) {
					return notification
				}
			},
		)

		const responseListener =
			Notifications.addNotificationResponseReceivedListener((response) => {
				const notificationData = response.notification.request.content.data
				if (notificationData?.notificationId && isSignedIn) {
					router.push('/notifications')
				}
			})

		return () => {
			isMounted = false
			notificationListener.remove()
			responseListener.remove()
		}
	}, [router, isSignedIn])

	const contextValue: NotificationContextType = {
		expoPushToken,
		isLoading,
		error,
	}

	return (
		<NotificationContext.Provider value={contextValue}>
			{children}
		</NotificationContext.Provider>
	)
}
