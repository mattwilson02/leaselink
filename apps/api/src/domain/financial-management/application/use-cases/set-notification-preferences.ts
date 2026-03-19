import { Either, left, right } from '@/core/either'
import { Client } from '@/domain/financial-management/enterprise/entities/client'
import { Injectable } from '@nestjs/common'
import { ClientsRepository } from '../repositories/clients-repository'
import { ClientNotFoundError } from './errors/client-not-found-error'

export interface SetNotificationPreferencesUseCaseRequest {
	clientId: string
	receivesEmailNotifications?: boolean
	receivesPushNotifications?: boolean
	receivesNotificationsForPortfolio?: boolean
	receivesNotificationsForDocuments?: boolean
}

type SetNotificationPreferencesUseCaseResponse = Either<
	ClientNotFoundError,
	{
		client: Client
	}
>

@Injectable()
export class SetNotificationPreferencesUseCase {
	constructor(private clientsRepository: ClientsRepository) {}

	async execute({
		clientId,
		receivesEmailNotifications,
		receivesPushNotifications,
		receivesNotificationsForPortfolio,
		receivesNotificationsForDocuments,
	}: SetNotificationPreferencesUseCaseRequest): Promise<SetNotificationPreferencesUseCaseResponse> {
		const client = await this.clientsRepository.findById(clientId)

		if (!client) {
			return left(new ClientNotFoundError())
		}

		if (receivesEmailNotifications !== undefined) {
			client.receivesEmailNotifications = receivesEmailNotifications
		}

		if (receivesPushNotifications !== undefined) {
			client.receivesPushNotifications = receivesPushNotifications
		}

		if (receivesNotificationsForPortfolio !== undefined) {
			client.receivesNotificationsForPortfolio =
				receivesNotificationsForPortfolio
		}

		if (receivesNotificationsForDocuments !== undefined) {
			client.receivesNotificationsForDocuments =
				receivesNotificationsForDocuments
		}

		await this.clientsRepository.update(client)

		return right({
			client,
		})
	}
}
