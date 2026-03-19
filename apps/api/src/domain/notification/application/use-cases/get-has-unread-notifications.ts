import { Either, right } from '@/core/either'
import { NotificationRepository } from '@/domain/notification/application/repositories/notification-repository'
import { Injectable } from '@nestjs/common'

export interface GetHasUnreadNotificationsUseCaseRequest {
	personId: string
}

type GetHasUnreadNotificationsUseCaseResponse = Either<
	null,
	{
		hasUnreadNotifications: boolean
	}
>

@Injectable()
export class GetHasUnreadNotificationsUseCase {
	constructor(private notificationsRepository: NotificationRepository) {}

	async execute({
		personId,
	}: GetHasUnreadNotificationsUseCaseRequest): Promise<GetHasUnreadNotificationsUseCaseResponse> {
		const hasUnreadNotifications =
			await this.notificationsRepository.hasUnreadNotifications(personId)

		return right({
			hasUnreadNotifications,
		})
	}
}
