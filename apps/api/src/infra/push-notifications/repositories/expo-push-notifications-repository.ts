import { Injectable } from '@nestjs/common'
import {
	NotificationMessage,
	PushNotificationRepository,
} from '@/domain/notification/application/repositories/push-notification-repository'
import { ExpoPushNotificationsService } from '../expo-push-notifications/expo-push-notifications.service'
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'

export interface UploadUrlResult {
	success: boolean
	uploadUrl: string
	blobName: string
	expiresOn: string
}

export interface GenerateUploadUrlParams {
	fileName: string
	contentType?: string
}

@Injectable()
export class ExpoPushNotificationsRepository
	implements PushNotificationRepository
{
	constructor(
		private readonly pushNotificationsService: ExpoPushNotificationsService,
	) {}

	async sendSingleNotification(message: NotificationMessage) {
		if (!Expo.isExpoPushToken(message.token)) {
			throw new Error('Invalid Expo push token')
		}

		const expoPushMessage: ExpoPushMessage = {
			to: message.token,
			sound: 'default',
			title: message.title,
			body: message.body,
			data: message.data || {},
		}

		const chunks = this.pushNotificationsService
			.getExpoClient()
			.chunkPushNotifications([expoPushMessage])
		const tickets: ExpoPushTicket[] = []

		for (const chunk of chunks) {
			try {
				const ticketChunk = await this.pushNotificationsService
					.getExpoClient()
					.sendPushNotificationsAsync(chunk)
				tickets.push(...ticketChunk)
			} catch (error) {
				console.error('Error sending push notification chunk:', error)
				throw error
			}
		}

		return tickets.map((ticket) => {
			return {
				status: ticket.status,
			}
		})
	}

	validateToken(token: string): boolean {
		return Expo.isExpoPushToken(token)
	}
}
