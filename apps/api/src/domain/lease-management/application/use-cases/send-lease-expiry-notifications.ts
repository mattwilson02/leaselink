import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { LEASE_EXPIRY_NOTIFICATION_DAYS } from '@leaselink/shared'
import { LeasesRepository } from '../repositories/leases-repository'
import { NotificationRepository } from '@/domain/notification/application/repositories/notification-repository'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'

const DEDUP_WINDOW_DAYS = 7

type SendLeaseExpiryNotificationsUseCaseResponse = Either<
	never,
	{ notificationsSent: number }
>

@Injectable()
export class SendLeaseExpiryNotificationsUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		private notificationRepository: NotificationRepository,
		private propertiesRepository: PropertiesRepository,
		private createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async execute(): Promise<SendLeaseExpiryNotificationsUseCaseResponse> {
		let notificationsSent = 0

		const dedupWindow = new Date()
		dedupWindow.setDate(dedupWindow.getDate() - DEDUP_WINDOW_DAYS)

		for (const intervalDays of LEASE_EXPIRY_NOTIFICATION_DAYS) {
			const targetDate = new Date()
			targetDate.setDate(targetDate.getDate() + intervalDays)
			targetDate.setHours(0, 0, 0, 0)

			const rangeEnd = new Date(targetDate)
			rangeEnd.setDate(rangeEnd.getDate() + 1)

			const leases = await this.leasesRepository.findActiveExpiringBetween(
				targetDate,
				rangeEnd,
			)

			for (const lease of leases) {
				const tenantAlreadySent =
					await this.notificationRepository.existsByActionTypeAndLinkedId({
						actionType: ActionType.LEASE_EXPIRY,
						personId: lease.tenantId.toString(),
						linkedTransactionId: lease.id.toString(),
						createdAfter: dedupWindow,
					})

				if (!tenantAlreadySent) {
					await this.createNotificationUseCase.execute({
						personId: lease.tenantId.toString(),
						text: `Your lease expires in ${intervalDays} days. Contact your property manager about renewal.`,
						notificationType: NotificationType.ACTION,
						actionType: ActionType.LEASE_EXPIRY,
						linkedTransactionId: lease.id.toString(),
					})
					notificationsSent++
				}

				const property = await this.propertiesRepository.findById(
					lease.propertyId.toString(),
				)

				if (property) {
					const managerAlreadySent =
						await this.notificationRepository.existsByActionTypeAndLinkedId({
							actionType: ActionType.LEASE_EXPIRY,
							personId: property.managerId.toString(),
							linkedTransactionId: lease.id.toString(),
							createdAfter: dedupWindow,
						})

					if (!managerAlreadySent) {
						await this.createNotificationUseCase.execute({
							personId: property.managerId.toString(),
							text: `Lease for ${property.address} expires in ${intervalDays} days.`,
							notificationType: NotificationType.ACTION,
							actionType: ActionType.LEASE_EXPIRY,
							linkedTransactionId: lease.id.toString(),
						})
						notificationsSent++
					}
				}
			}
		}

		return right({ notificationsSent })
	}
}
