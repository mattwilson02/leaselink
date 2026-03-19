import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Expo } from 'expo-server-sdk'

@Injectable()
export class ExpoPushNotificationsService implements OnModuleInit {
	private readonly logger = new Logger(ExpoPushNotificationsService.name)
	private expo: Expo

	async onModuleInit() {
		try {
			this.initializeExpo()
			this.logger.log(
				'ExpoPushNotificationsService initialized successfully ✅',
			)
		} catch (error) {
			this.logger.error(
				'Error initializing ExpoPushNotificationsService ❌',
				error,
			)
			throw error
		}
	}

	private initializeExpo() {
		this.expo = new Expo()
	}

	getExpoClient(): Expo {
		return this.expo
	}
}
