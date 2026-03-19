import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export async function registerForPushNotificationsAsync() {
	// biome-ignore lint/suspicious/noImplicitAnyLet: We need to declare token as any type to avoid TypeScript errors.
	let token

	if (Platform.OS === 'android') {
		Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#FF231F7C',
		})
	}

	if (Device.isDevice) {
		const { status: existingStatus } = await Notifications.getPermissionsAsync()
		let finalStatus = existingStatus

		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync()
			finalStatus = status
		}

		if (finalStatus !== 'granted') {
			alert('Failed to get push token for push notification!')
			return
		}

		try {
			token = await Notifications.getExpoPushTokenAsync({
				projectId:
					Constants.expoConfig?.extra?.eas.projectId ??
					Constants.easConfig?.projectId,
			})
		} catch (error) {
			console.error('Error getting Expo push token:', error)
		}
	} else console.error('Must use physical device for Push Notifications')

	return token?.data
}
