import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type {
	ExistsByActionTypeAndLinkedIdParams,
	NotificationRepository,
	UpdateManyByPersonIdParams,
} from '@/domain/notification/application/repositories/notification-repository'
import type {
	Notification,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { PrismaNotificationMapper } from '../mappers/prisma-notification-mapper'
import { ActionType } from '@prisma/client'

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
	constructor(private prisma: PrismaService) {}

	async updateManyByPersonId({
		personId,
		condition,
		updates,
	}: UpdateManyByPersonIdParams): Promise<number> {
		const data = PrismaNotificationMapper.toPrismaPartial(updates)

		const payload = await this.prisma.notification.updateMany({
			where: { personId, ...condition },
			data: data,
		})

		return payload.count
	}

	async create(notification: Notification): Promise<void> {
		const data = PrismaNotificationMapper.toPrisma(notification)

		await this.prisma.notification.create({
			data,
		})
	}

	async getManyByPersonId(
		personId: string,
		offset: number,
		limit: number,
		notificationType?: NotificationType,
		isArchived?: boolean,
	): Promise<Notification[]> {
		let archivedAtFilter: unknown = undefined

		if (isArchived === true) {
			archivedAtFilter = { not: null } // Only archived
		} else if (isArchived === false) {
			archivedAtFilter = null // Only non-archived
		}
		// If isArchived is undefined, no filter (all notifications)

		const notifications = await this.prisma.notification.findMany({
			where: {
				personId,
				...(notificationType && { notificationType }),
				...(archivedAtFilter !== undefined && { archivedAt: archivedAtFilter }),
			},
			skip: offset,
			take: limit,
			orderBy: {
				createdAt: 'desc',
			},
		})

		return notifications.map(PrismaNotificationMapper.toDomain)
	}

	async findById(notificationId: string): Promise<Notification | null> {
		const notification = await this.prisma.notification.findUnique({
			where: { id: notificationId },
		})

		return notification ? PrismaNotificationMapper.toDomain(notification) : null
	}

	async save(notification: Notification): Promise<void> {
		const data = PrismaNotificationMapper.toPrisma(notification)

		await this.prisma.notification.update({
			where: { id: notification.id.toString() },
			data,
		})
	}

	async hasUnreadNotifications(personId: string): Promise<boolean> {
		const count = await this.prisma.notification.count({
			where: {
				personId,
				isRead: false,
				archivedAt: null,
			},
		})

		return count > 0
	}

	async existsByActionTypeAndLinkedId(
		params: ExistsByActionTypeAndLinkedIdParams,
	): Promise<boolean> {
		const count = await this.prisma.notification.count({
			where: {
				actionType: params.actionType as ActionType,
				personId: params.personId,
				...(params.linkedTransactionId && {
					linkedMaintenanceRequestId: params.linkedTransactionId,
				}),
				...(params.linkedPaymentId && {
					linkedPaymentId: params.linkedPaymentId,
				}),
				createdAt: { gte: params.createdAfter },
			},
		})
		return count > 0
	}
}
