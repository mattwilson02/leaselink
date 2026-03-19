import { IdentityProviderRepository } from '@/domain/authentication/application/repositories/identity-provider-repository'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'
import { LeasesRepository } from '@/domain/lease-management/application/repositories/leases-repository'
import { MaintenanceRequestsRepository } from '@/domain/maintenance/application/repositories/maintenance-requests-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { PrismaClientsRepository } from './prisma/repositories/prisma-clients-repository'
import { PrismaIdentityProviderRepository } from './prisma/repositories/prisma-provider-repository'
import { PrismaLeasesRepository } from './prisma/repositories/prisma-leases-repository'
import { PrismaMaintenanceRequestsRepository } from './prisma/repositories/prisma-maintenance-requests-repository'
import { PrismaPropertiesRepository } from './prisma/repositories/prisma-properties-repository'
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
		{
			provide: PropertiesRepository,
			useClass: PrismaPropertiesRepository,
		},
		{
			provide: LeasesRepository,
			useClass: PrismaLeasesRepository,
		},
		{
			provide: MaintenanceRequestsRepository,
			useClass: PrismaMaintenanceRequestsRepository,
		},
	],
	exports: [
		PrismaService,
		ClientsRepository,
		IdentityProviderRepository,
		NotificationRepository,
		DocumentRepository,
		DocumentRequestRepository,
		PropertiesRepository,
		LeasesRepository,
		MaintenanceRequestsRepository,
	],
})
export class DatabaseModule {}
