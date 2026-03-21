import { Either, left, right } from '@/core/either'
import { Injectable, Optional } from '@nestjs/common'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { LEASE_STATUS_TRANSITIONS, isValidTransition } from '@leaselink/shared'
import { LeaseStatus as SharedLeaseStatus } from '@leaselink/shared'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'
import { LeaseNotFoundError } from './errors/lease-not-found-error'
import { InvalidLeaseStatusTransitionError } from './errors/invalid-lease-status-transition-error'
import { LeaseActivationFutureStartError } from './errors/lease-activation-future-start-error'
import { LeaseStatusType } from '../../enterprise/entities/value-objects/lease-status'
import { GenerateLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-lease-payments'
import { PaymentsRepository } from '@/domain/payment/application/repositories/payments-repository'

export interface UpdateLeaseStatusUseCaseRequest {
	leaseId: string
	status: LeaseStatusType
}

type UpdateLeaseStatusUseCaseResponse = Either<
	| LeaseNotFoundError
	| InvalidLeaseStatusTransitionError
	| LeaseActivationFutureStartError,
	{ lease: Lease }
>

@Injectable()
export class UpdateLeaseStatusUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		private propertiesRepository: PropertiesRepository,
		private paymentsRepository: PaymentsRepository,
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
		const wasPending = currentStatus === 'PENDING'
		const newStatus = status as SharedLeaseStatus

		if (
			!isValidTransition(LEASE_STATUS_TRANSITIONS, currentStatus, newStatus)
		) {
			return left(new InvalidLeaseStatusTransitionError())
		}

		// Prevent manual activation of leases with future start dates
		if (status === 'ACTIVE') {
			const today = new Date()
			today.setUTCHours(0, 0, 0, 0)
			const leaseStart = new Date(lease.startDate)
			leaseStart.setUTCHours(0, 0, 0, 0)

			if (leaseStart > today) {
				return left(new LeaseActivationFutureStartError())
			}
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

		if (status === 'TERMINATED' || status === 'EXPIRED') {
			const property = await this.propertiesRepository.findById(
				lease.propertyId.toString(),
			)
			if (property && property.status === 'OCCUPIED') {
				property.status = 'VACANT'
				await this.propertiesRepository.update(property)
			}

			await this.paymentsRepository.deleteUnpaidByLeaseId(leaseId)
		}

		const updatedLease = await this.leasesRepository.update(lease)

		// Side effect: generate payment records only when transitioning from PENDING to ACTIVE
		// (prevents double-generation if lease was already auto-activated)
		if (
			status === 'ACTIVE' &&
			wasPending &&
			this.generateLeasePaymentsUseCase
		) {
			await this.generateLeasePaymentsUseCase.execute({ leaseId })
		}

		return right({ lease: updatedLease })
	}
}
