import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Client } from '@/domain/financial-management/enterprise/entities/client'
import { ClientStatus } from '@/domain/financial-management/enterprise/entities/value-objects/client-status'
import { OnboardingStatus } from '@/domain/financial-management/enterprise/entities/value-objects/onboarding-status'
import {
	Prisma,
	Client as PrismaClient,
	Employee as PrismaEmployee,
} from '@prisma/client'

type PrismaClientWithRelations = PrismaClient & { managedBy?: PrismaEmployee[] }

export class PrismaClientMapper {
	static toDomain(raw: PrismaClientWithRelations): Client {
		return Client.create(
			{
				name: raw.name,
				email: raw.email,
				status: ClientStatus.create(raw.status),
				onboardingStatus: OnboardingStatus.create(raw.onboardingStatus),
				managedBy:
					raw.managedBy?.map((employee) => new UniqueEntityId(employee.id)) ??
					[],
				phoneNumber: raw.phoneNumber,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
				deviceId: raw?.deviceId ? new UniqueEntityId(raw.deviceId) : null,
				pushToken: raw.pushToken ?? null,
				onboardingToken: raw.onboardingToken,
				profilePhoto: raw.profilePhoto ?? null,
				receivesEmailNotifications: raw.receivesEmailNotifications,
				receivesPushNotifications: raw.receivesPushNotifications,
				receivesNotificationsForPortfolio:
					raw.receivesNotificationsForMaintenance,
				receivesNotificationsForDocuments:
					raw.receivesNotificationsForDocuments,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(client: Client): Prisma.ClientUncheckedCreateInput {
		return {
			id: client.id.toString(),
			name: client.name,
			email: client.email,
			status: client.status,
			onboardingStatus: client.onboardingStatus,
			createdAt: client.createdAt,
			updatedAt: client.updatedAt,
			phoneNumber: client.phoneNumber,
			deviceId: client.deviceId ? client.deviceId.toString() : null,
			pushToken: client.pushToken ?? null,
			onboardingToken: client.onboardingToken ?? null,
			profilePhoto: client.profilePhoto ?? null,
			receivesEmailNotifications: client.receivesEmailNotifications ?? false,
			receivesPushNotifications: client.receivesPushNotifications ?? false,
			receivesNotificationsForMaintenance:
				client.receivesNotificationsForPortfolio ?? false,
			receivesNotificationsForDocuments:
				client.receivesNotificationsForDocuments ?? false,
		}
	}
}
