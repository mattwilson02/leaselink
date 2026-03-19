import { UsersAuthRepository } from '@/domain/authentication/application/repositories/user-auth-repository'
import { EnvModule } from '@/infra/env/env.module'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth'
import { BetterAuthUsersRepository } from './repositories/better-auth-users-repository'
import { SessionRepository } from '@/domain/authentication/application/repositories/session-repository'
import { BetterAuthSessionRepository } from './repositories/better-auth-session-repository'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

@Module({
	imports: [HttpModule, EnvModule, DatabaseModule],
	providers: [
		PrismaService,
		BetterAuthService,
		{
			provide: UsersAuthRepository,
			useClass: BetterAuthUsersRepository,
		},
		{
			provide: SessionRepository,
			useClass: BetterAuthSessionRepository,
		},
	],
	exports: [BetterAuthService, UsersAuthRepository, SessionRepository],
})
export class BetterAuthModule {}
