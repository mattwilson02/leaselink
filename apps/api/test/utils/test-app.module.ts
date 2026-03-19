import { Module } from '@nestjs/common'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

import { envSchema } from '@/infra/env/env'
import { EnvModule } from '@/infra/env/env.module'
import { EventsModule } from '@/infra/events/events.module'
import { HttpModule } from '@/infra/http/http.module'
import { BlobStorageModule } from '@/infra/blob-storage/blob-storage.module'
import { PushNotificationsModule } from '@/infra/push-notifications/push-notifications.module'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { EnhancedAuthGuard } from '@/infra/auth/better-auth/guards/enhanced-auth-guard'
import { DatabaseModule } from '@/infra/database/database.module'
import { createAuthInstance } from '@/infra/auth/better-auth/auth-factory'

// This needs to imitate app.module.ts
export function createTestAppModule(prismaService: PrismaService) {
	const testAuth = createAuthInstance(prismaService)

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
				auth: testAuth,
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
	class TestAppModule {}

	return TestAppModule
}
