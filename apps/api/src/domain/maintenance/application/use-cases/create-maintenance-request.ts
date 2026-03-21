import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { MaintenanceRequest } from '../../enterprise/entities/maintenance-request'
import { MaintenanceRequestsRepository } from '../repositories/maintenance-requests-repository'
import { LeasesRepository } from '@/domain/lease-management/application/repositories/leases-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { MaintenanceNoActiveLeaseError } from './errors/maintenance-no-active-lease-error'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { MaintenanceCategory } from '../../enterprise/entities/value-objects/maintenance-category'
import { MaintenancePriority } from '../../enterprise/entities/value-objects/maintenance-priority'

export interface CreateMaintenanceRequestUseCaseRequest {
	tenantId: string
	propertyId: string
	title: string
	description: string
	category: string
	priority?: string
}

type CreateMaintenanceRequestUseCaseResponse = Either<
	MaintenanceNoActiveLeaseError,
	{ request: MaintenanceRequest }
>

@Injectable()
export class CreateMaintenanceRequestUseCase {
	constructor(
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
		private leasesRepository: LeasesRepository,
		private propertiesRepository: PropertiesRepository,
		private createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async execute(
		input: CreateMaintenanceRequestUseCaseRequest,
	): Promise<CreateMaintenanceRequestUseCaseResponse> {
		const activeLease = await this.leasesRepository.findActiveByTenant(
			input.tenantId,
		)

		if (
			!activeLease ||
			activeLease.propertyId.toString() !== input.propertyId
		) {
			return left(new MaintenanceNoActiveLeaseError())
		}

		const request = MaintenanceRequest.create({
			propertyId: new UniqueEntityId(input.propertyId),
			tenantId: new UniqueEntityId(input.tenantId),
			title: input.title,
			description: input.description,
			category: MaintenanceCategory.create(input.category),
			priority: input.priority
				? MaintenancePriority.create(input.priority)
				: undefined,
		})

		await this.maintenanceRequestsRepository.create(request)

		const property = await this.propertiesRepository.findById(input.propertyId)

		if (property) {
			const isEmergency = request.priority === 'EMERGENCY'
			const notificationText = isEmergency
				? `EMERGENCY: ${input.title}`
				: `New maintenance request: ${input.title}`

			await this.createNotificationUseCase.execute({
				personId: property.managerId.toString(),
				text: notificationText,
				notificationType: NotificationType.ACTION,
				actionType: ActionType.MAINTENANCE_UPDATE,
				linkedTransactionId: request.id.toString(),
			})
		}

		return right({ request })
	}
}
