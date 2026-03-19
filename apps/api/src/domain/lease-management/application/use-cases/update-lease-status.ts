import { Either, left, right } from '@/core/either'
import { Injectable, Optional } from '@nestjs/common'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { LEASE_STATUS_TRANSITIONS, isValidTransition } from '@leaselink/shared'
import { LeaseStatus as SharedLeaseStatus } from '@leaselink/shared'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'
import { LeaseNotFoundError } from './errors/lease-not-found-error'
import { InvalidLeaseStatusTransitionError } from './errors/invalid-lease-status-transition-error'
import { LeaseStatusType } from '../../enterprise/entities/value-objects/lease-status'
import { GenerateLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-lease-payments'

export interface UpdateLeaseStatusUseCaseRequest {
	leaseId: string
	status: LeaseStatusType
}

type UpdateLeaseStatusUseCaseResponse = Either<
	LeaseNotFoundError | InvalidLeaseStatusTransitionError,
	{ lease: Lease }
>

@Injectable()
export class UpdateLeaseStatusUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		private propertiesRepository: PropertiesRepository,
		@Optional()
		private generateLeasePaymentsUseCase?: GenerateLeasePaymentsUseCase,
	) {}

	async execute({
		leaseId,
		status,
	}: UpdateLeaseStatusUseCaseRequest): Promise<UpdateLeaseStatusUseCaseResponse> {
		const lease = await this.leasesRepository.findById(leaseId)

		if (!lease) {
			return left(new LeaseNotFoundError())
		}

		const currentStatus = lease.status as SharedLeaseStatus
		const newStatus = status as SharedLeaseStatus

		if (
			!isValidTransition(LEASE_STATUS_TRANSITIONS, currentStatus, newStatus)
		) {
			return left(new InvalidLeaseStatusTransitionError())
		}

		lease.status = status

		if (status === 'ACTIVE') {
			const property = await this.propertiesRepository.findById(
				lease.propertyId.toString(),
			)
			if (property && property.status !== 'OCCUPIED') {
				property.status = 'OCCUPIED'
				await this.propertiesRepository.update(property)
			}

			if (lease.renewedFromLeaseId) {
				const originalLease = await this.leasesRepository.findById(
					lease.renewedFromLeaseId.toString(),
				)
				if (originalLease && originalLease.status === 'ACTIVE') {
					originalLease.status = 'EXPIRED'
					await this.leasesRepository.update(originalLease)
				}
			}
		}

		const updatedLease = await this.leasesRepository.update(lease)

		// Side effect: generate payment records when lease becomes ACTIVE
		if (status === 'ACTIVE' && this.generateLeasePaymentsUseCase) {
			await this.generateLeasePaymentsUseCase.execute({ leaseId })
		}

		return right({ lease: updatedLease })
	}
}
