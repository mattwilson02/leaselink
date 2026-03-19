import { Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Injectable, Optional } from '@nestjs/common'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'
import { LeasePropertyNotAvailableError } from './errors/lease-property-not-available-error'
import { LeasePropertyHasActiveLeaseError } from './errors/lease-property-has-active-lease-error'
import { LeaseTenantHasActiveLeaseError } from './errors/lease-tenant-has-active-lease-error'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'

export interface CreateLeaseUseCaseRequest {
	propertyId: string
	tenantId: string
	startDate: string
	endDate: string
	monthlyRent: number
	securityDeposit: number
}

type CreateLeaseUseCaseResponse = Either<
	| PropertyNotFoundError
	| ClientNotFoundError
	| LeasePropertyNotAvailableError
	| LeasePropertyHasActiveLeaseError
	| LeaseTenantHasActiveLeaseError,
	{ lease: Lease }
>

@Injectable()
export class CreateLeaseUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		private propertiesRepository: PropertiesRepository,
		private clientsRepository: ClientsRepository,
		@Optional()
		private createNotificationUseCase?: CreateNotificationUseCase,
	) {}

	async execute(
		request: CreateLeaseUseCaseRequest,
	): Promise<CreateLeaseUseCaseResponse> {
		const property = await this.propertiesRepository.findById(
			request.propertyId,
		)
		if (!property) {
			return left(new PropertyNotFoundError(request.propertyId))
		}

		const tenant = await this.clientsRepository.findById(request.tenantId)
		if (!tenant) {
			return left(new ClientNotFoundError())
		}

		if (property.status !== 'LISTED' && property.status !== 'OCCUPIED') {
			return left(new LeasePropertyNotAvailableError())
		}

		const existingActiveLease =
			await this.leasesRepository.findActiveByProperty(request.propertyId)
		if (existingActiveLease) {
			return left(new LeasePropertyHasActiveLeaseError())
		}

		const tenantActiveLease = await this.leasesRepository.findActiveByTenant(
			request.tenantId,
		)
		if (tenantActiveLease) {
			return left(new LeaseTenantHasActiveLeaseError())
		}

		const lease = Lease.create({
			propertyId: new UniqueEntityId(request.propertyId),
			tenantId: new UniqueEntityId(request.tenantId),
			startDate: new Date(request.startDate),
			endDate: new Date(request.endDate),
			monthlyRent: request.monthlyRent,
			securityDeposit: request.securityDeposit,
		})

		await this.leasesRepository.create(lease)

		if (this.createNotificationUseCase) {
			await this.createNotificationUseCase.execute({
				personId: request.tenantId,
				text: 'A new lease has been created for you. Please review the details.',
				notificationType: NotificationType.ACTION,
				actionType: ActionType.SIGN_LEASE,
			})
		}

		return right({ lease })
	}
}
