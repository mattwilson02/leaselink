import { Either, right } from '@/core/either'
import { NotificationRepository } from '@/domain/notification/application/repositories/notification-repository'
import { Injectable } from '@nestjs/common'
import {
	Notification,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'

export interface GetNotificationsUseCaseRequest {
	personId: string
	offset?: number
	limit?: number
	notificationType?: NotificationType
	isArchived?: boolean
}

type GetNotificationsUseCaseResponse = Either<
	null,
	{
		notifications: Notification[]
	}
>

@Injectable()
export class GetNotificationsUseCase {
	constructor(private notificationsRepository: NotificationRepository) {}

	async execute({
		personId,
		offset = 0,
		limit = 10,
		notificationType,
		isArchived,
	}: GetNotificationsUseCaseRequest): Promise<GetNotificationsUseCaseResponse> {
		const notifications = await this.notificationsRepository.getManyByPersonId(
			personId,
			offset,
			limit,
			notificationType,
			isArchived,
		)

		return right({
			notifications,
		})
	}
}
