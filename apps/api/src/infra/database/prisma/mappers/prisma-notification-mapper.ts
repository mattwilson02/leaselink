import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	type ActionType,
	Notification,
	type NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import type {
	Prisma,
	Notification as PrismaNotification,
	NotificationType as PrismaNotificationType,
	ActionType as PrismaActionType,
} from '@prisma/client'

export class PrismaNotificationMapper {
	static toDomain(raw: PrismaNotification): Notification {
		return Notification.create(
			{
				personId: new UniqueEntityId(raw.personId),
				text: raw.title,
				body: raw.body,
				notificationType: raw.notificationType as unknown as NotificationType,
				actionType: raw.actionType as unknown as ActionType,
				linkedDocumentId: raw.linkedDocumentId
					? new UniqueEntityId(raw.linkedDocumentId)
					: undefined,
				linkedTransactionId: raw.linkedMaintenanceRequestId
					? new UniqueEntityId(raw.linkedMaintenanceRequestId)
					: undefined,
				linkedPaymentId: raw.linkedPaymentId
					? new UniqueEntityId(raw.linkedPaymentId)
					: undefined,
				isRead: raw.isRead,
				isActionComplete: raw.isActionComplete,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
				archivedAt: raw.archivedAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(
		notification: Notification,
	): Prisma.NotificationUncheckedCreateInput {
		return {
			id: notification.id.toString(),
			personId: notification.personId.toString(),
			title: notification.text,
			body: notification.body || '',
			notificationType:
				notification.notificationType as string as PrismaNotificationType,
			actionType: notification.actionType as string as PrismaActionType,
			linkedDocumentId: notification.linkedDocumentId?.toString(),
			linkedMaintenanceRequestId: notification.linkedTransactionId?.toString(),
			linkedPaymentId: notification.linkedPaymentId?.toString(),
			isRead: notification.isRead,
			isActionComplete: notification.isActionComplete,
			createdAt: notification.createdAt,
			updatedAt: notification.updatedAt,
			archivedAt: notification.archivedAt,
		}
	}

	static toPrismaPartial(
		notification: Partial<Notification>,
	): Prisma.NotificationUpdateInput {
		return {
			title: notification.text,
			body: notification.body || '',
			notificationType:
				notification.notificationType as string as PrismaNotificationType,
			actionType: notification.actionType as string as PrismaActionType,
			linkedDocumentId: notification.linkedDocumentId?.toString(),
			linkedMaintenanceRequestId: notification.linkedTransactionId?.toString(),
			linkedPaymentId: notification.linkedPaymentId?.toString(),
			isRead: notification.isRead,
			isActionComplete: notification.isActionComplete,
			createdAt: notification.createdAt,
			updatedAt: notification.updatedAt,
			archivedAt: notification.archivedAt,
		}
	}
}
