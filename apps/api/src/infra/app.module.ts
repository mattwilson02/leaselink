import { Module } from '@nestjs/common'
import { AuthModule } from '@thallesp/nestjs-better-auth'

import { ConfigModule } from '@nestjs/config'

import { envSchema } from './env/env'
import { EnvModule } from './env/env.module'
import { EventsModule } from './events/events.module'
import { HttpModule } from './http/http.module'
import { BlobStorageModule } from './blob-storage/blob-storage.module'
import { PushNotificationsModule } from './push-notifications/push-notifications.module'
import { APP_GUARD } from '@nestjs/core'
import { BetterAuthModule } from './auth/better-auth/better-auth.module'
import { EnhancedAuthGuard } from './auth/better-auth/guards/enhanced-auth-guard'
import { DatabaseModule } from './database/database.module'
import { auth } from 'auth'

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: (env) => envSchema.parse(env),
			isGlobal: true,
		}),
		EnvModule,
		HttpModule,
		EventsModule,
		BlobStorageModule,
		PushNotificationsModule,
		BetterAuthModule,
		DatabaseModule,
		AuthModule.forRoot({
			auth,
			disableGlobalAuthGuard: true,
		}),
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: EnhancedAuthGuard,
		},
	],
})
export class AppModule {}
