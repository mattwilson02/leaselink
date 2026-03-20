import { Injectable } from '@nestjs/common'
import { type Either, right } from '@/core/either'
import { NotificationRepository } from '../repositories/notification-repository'

interface MarkAllNotificationsAsReadUseCaseRequest {
	personId: string
}

type MarkAllNotificationsAsReadUseCaseResponse = Either<null, { count: number }>

@Injectable()
export class MarkAllNotificationsAsReadUseCase {
	constructor(
		private notificationRepository: NotificationRepository,
	) {}

	async execute(
		request: MarkAllNotificationsAsReadUseCaseRequest,
	): Promise<MarkAllNotificationsAsReadUseCaseResponse> {
		const { personId } = request

		const count = await this.notificationRepository.updateManyByPersonId({
			personId,
			condition: { isRead: false },
			updates: { isRead: true },
		})

		return right({ count })
	}
}
