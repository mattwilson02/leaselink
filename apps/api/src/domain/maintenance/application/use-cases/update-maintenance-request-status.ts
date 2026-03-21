import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { MaintenanceRequest } from '../../enterprise/entities/maintenance-request'
import { MaintenanceRequestsRepository } from '../repositories/maintenance-requests-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { MaintenanceRequestNotFoundError } from './errors/maintenance-request-not-found-error'
import { InvalidMaintenanceStatusTransitionError } from './errors/invalid-maintenance-status-transition-error'
import { MaintenanceOnlyManagerCanUpdateStatusError } from './errors/maintenance-only-manager-can-update-status-error'
import {
	MAINTENANCE_STATUS_TRANSITIONS,
	isValidTransition,
	MaintenanceStatus,
} from '@leaselink/shared'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface UpdateMaintenanceRequestStatusUseCaseRequest {
	requestId: string
	userId: string
	userRole: 'manager' | 'tenant'
	status: string
	vendorId?: string | null
}

type UpdateMaintenanceRequestStatusUseCaseResponse = Either<
	| MaintenanceRequestNotFoundError
	| InvalidMaintenanceStatusTransitionError
	| MaintenanceOnlyManagerCanUpdateStatusError,
	{ request: MaintenanceRequest }
>

@Injectable()
export class UpdateMaintenanceRequestStatusUseCase {
	constructor(
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
		private propertiesRepository: PropertiesRepository,
		private createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async execute(
		input: UpdateMaintenanceRequestStatusUseCaseRequest,
	): Promise<UpdateMaintenanceRequestStatusUseCaseResponse> {
		const request = await this.maintenanceRequestsRepository.findById(
			input.requestId,
		)

		if (!request) {
			return left(new MaintenanceRequestNotFoundError())
		}

		const currentStatus = request.status as MaintenanceStatus
		const newStatus = input.status as MaintenanceStatus

		if (
			!isValidTransition(
				MAINTENANCE_STATUS_TRANSITIONS,
				currentStatus,
				newStatus,
			)
		) {
			return left(
				new InvalidMaintenanceStatusTransitionError(currentStatus, newStatus),
			)
		}

		// Role-based checks: only manager can move to IN_PROGRESS or RESOLVED
		if (
			(newStatus === MaintenanceStatus.IN_PROGRESS ||
				newStatus === MaintenanceStatus.RESOLVED) &&
			input.userRole !== 'manager'
		) {
			return left(new MaintenanceOnlyManagerCanUpdateStatusError())
		}

		request.status = newStatus

		if (newStatus === MaintenanceStatus.RESOLVED) {
			request.resolvedAt = new Date()
		}

		// Handle vendor assignment
		if (input.vendorId !== undefined) {
			request.vendorId =
				input.vendorId !== null ? new UniqueEntityId(input.vendorId) : null
		}

		const updatedRequest =
			await this.maintenanceRequestsRepository.update(request)

		// Send notification to the other party
		const notificationText = `Maintenance request '${request.title}' status changed to ${newStatus}`

		if (input.userRole === 'manager') {
			// Notify the tenant
			await this.createNotificationUseCase.execute({
				personId: request.tenantId.toString(),
				text: notificationText,
				notificationType: NotificationType.ACTION,
				actionType: ActionType.MAINTENANCE_UPDATE,
				linkedTransactionId: request.id.toString(),
			})
		} else {
			// Tenant closed — notify the manager
			const property = await this.propertiesRepository.findById(
				request.propertyId.toString(),
			)
			if (property) {
				await this.createNotificationUseCase.execute({
					personId: property.managerId.toString(),
					text: notificationText,
					notificationType: NotificationType.ACTION,
					actionType: ActionType.MAINTENANCE_UPDATE,
					linkedTransactionId: request.id.toString(),
				})
			}
		}

		return right({ request: updatedRequest })
	}
}
