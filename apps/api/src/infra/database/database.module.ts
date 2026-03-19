import { IdentityProviderRepository } from '@/domain/authentication/application/repositories/identity-provider-repository'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'
import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { PrismaClientsRepository } from './prisma/repositories/prisma-clients-repository'
import { PrismaIdentityProviderRepository } from './prisma/repositories/prisma-provider-repository'
import { NotificationRepository } from '@/domain/notification/application/repositories/notification-repository'
import { PrismaNotificationRepository } from './prisma/repositories/prisma-notification-repository'
import { DocumentRepository } from '@/domain/document/application/repositories/document-repository'
import { PrismaDocumentRepository } from './prisma/repositories/prisma-document-repository'
import { DocumentRequestRepository } from '@/domain/document/application/repositories/document-request-repository'
import { PrismaDocumentRequestRepository } from './prisma/repositories/prisma-document-request-repository'

@Module({
	providers: [
		PrismaService,
		{
			provide: ClientsRepository,
			useClass: PrismaClientsRepository,
		},
		{
			provide: NotificationRepository,
			useClass: PrismaNotificationRepository,
		},
		{
			provide: DocumentRepository,
			useClass: PrismaDocumentRepository,
		},
		{
			provide: DocumentRequestRepository,
			useClass: PrismaDocumentRequestRepository,
		},
		{
			provide: IdentityProviderRepository,
			useClass: PrismaIdentityProviderRepository,
		},
	],
	exports: [
		PrismaService,
		ClientsRepository,
		IdentityProviderRepository,
		NotificationRepository,
		DocumentRepository,
		DocumentRequestRepository,
	],
})
export class DatabaseModule {}
