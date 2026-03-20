import { Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Injectable, Optional } from '@nestjs/common'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'
import { LeaseNotFoundError } from './errors/lease-not-found-error'
import { LeaseRenewalInvalidSourceError } from './errors/lease-renewal-invalid-source-error'
import { LeaseRenewalStartDateInvalidError } from './errors/lease-renewal-start-date-invalid-error'
import { LeaseRenewalAlreadyExistsError } from './errors/lease-renewal-already-exists-error'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'

export interface RenewLeaseUseCaseRequest {
	leaseId: string
	startDate: string
	endDate: string
	monthlyRent: number
	securityDeposit: number
}

type RenewLeaseUseCaseResponse = Either<
	| LeaseNotFoundError
	| LeaseRenewalInvalidSourceError
	| LeaseRenewalStartDateInvalidError
	| LeaseRenewalAlreadyExistsError,
	{ lease: Lease }
>

@Injectable()
export class RenewLeaseUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		@Optional()
		private createNotificationUseCase?: CreateNotificationUseCase,
	) {}

	async execute(
		request: RenewLeaseUseCaseRequest,
	): Promise<RenewLeaseUseCaseResponse> {
		const originalLease = await this.leasesRepository.findById(request.leaseId)

		if (!originalLease) {
			return left(new LeaseNotFoundError())
		}

		if (
			originalLease.status !== 'ACTIVE' &&
			originalLease.status !== 'EXPIRED'
		) {
			return left(new LeaseRenewalInvalidSourceError())
		}

		const newStartDate = new Date(request.startDate)
		if (newStartDate < originalLease.endDate) {
			return left(new LeaseRenewalStartDateInvalidError())
		}

		const existingRenewal =
			await this.leasesRepository.findPendingRenewalByLeaseId(request.leaseId)
		if (existingRenewal) {
			return left(new LeaseRenewalAlreadyExistsError())
		}

		const renewalLease = Lease.create({
			propertyId: originalLease.propertyId,
			tenantId: originalLease.tenantId,
			startDate: newStartDate,
			endDate: new Date(request.endDate),
			monthlyRent: request.monthlyRent,
			securityDeposit: request.securityDeposit,
			renewedFromLeaseId: new UniqueEntityId(request.leaseId),
		})

		await this.leasesRepository.create(renewalLease)

		if (this.createNotificationUseCase) {
			await this.createNotificationUseCase.execute({
				personId: originalLease.tenantId.toString(),
				text: 'A lease renewal is available for your review.',
				notificationType: NotificationType.ACTION,
				actionType: ActionType.LEASE_RENEWAL,
			})
		}

		return right({ lease: renewalLease })
	}
}
