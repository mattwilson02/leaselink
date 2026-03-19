import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { NotificationRepository } from '../repositories/notification-repository'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'

interface MarkAllNotificationsAsReadUseCaseRequest {
	personId: string
}

type MarkAllNotificationsAsReadUseCaseResponse = Either<
	ClientNotFoundError,
	{ count: number }
>

@Injectable()
export class MarkAllNotificationsAsReadUseCase {
	constructor(
		private notificationRepository: NotificationRepository,
		private clientRepository: ClientsRepository,
	) {}

	async execute(
		request: MarkAllNotificationsAsReadUseCaseRequest,
	): Promise<MarkAllNotificationsAsReadUseCaseResponse> {
		const { personId } = request

		const client = await this.clientRepository.findById(personId)

		if (!client) {
			return left(new ClientNotFoundError())
		}

		const count = await this.notificationRepository.updateManyByPersonId({
			personId,
			condition: { isRead: false },
			updates: { isRead: true },
		})

		return right({ count })
	}
}
