import { Module } from '@nestjs/common'
import { PushNotificationRepository } from '@/domain/notification/application/repositories/push-notification-repository'

import { ExpoPushNotificationsRepository } from './repositories/expo-push-notifications-repository'

import { ExpoPushNotificationsService } from './expo-push-notifications/expo-push-notifications.service'

@Module({
	imports: [],
	providers: [
		ExpoPushNotificationsService,
		ExpoPushNotificationsRepository,
		{
			provide: PushNotificationRepository,
			useClass: ExpoPushNotificationsRepository,
		},
	],
	exports: [
		PushNotificationsModule,
		ExpoPushNotificationsRepository,
		PushNotificationRepository,
	],
	controllers: [],
})
export class PushNotificationsModule {}
