import { Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Injectable, Optional } from '@nestjs/common'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { GenerateLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-lease-payments'
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
		private propertiesRepository: PropertiesRepository,
		@Optional()
		private createNotificationUseCase?: CreateNotificationUseCase,
		@Optional()
		private generateLeasePaymentsUseCase?: GenerateLeasePaymentsUseCase,
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

		// Auto-activate if start date is today or in the past
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)
		const leaseStart = new Date(newStartDate)
		leaseStart.setUTCHours(0, 0, 0, 0)

		if (leaseStart <= today) {
			renewalLease.status = 'ACTIVE'
			await this.leasesRepository.update(renewalLease)

			// Expire the original lease
			if (originalLease.status === 'ACTIVE') {
				originalLease.status = 'EXPIRED'
				await this.leasesRepository.update(originalLease)
			}

			// Update property to OCCUPIED
			const property = await this.propertiesRepository.findById(
				originalLease.propertyId.toString(),
			)
			if (property && property.status !== 'OCCUPIED') {
				property.status = 'OCCUPIED'
				await this.propertiesRepository.update(property)
			}

			// Generate payments
			if (this.generateLeasePaymentsUseCase) {
				await this.generateLeasePaymentsUseCase.execute({
					leaseId: renewalLease.id.toString(),
				})
			}

			if (this.createNotificationUseCase) {
				await this.createNotificationUseCase.execute({
					personId: originalLease.tenantId.toString(),
					text: 'Your lease renewal is now active.',
					notificationType: NotificationType.INFO,
					actionType: ActionType.LEASE_RENEWAL,
				})
			}
		} else {
			if (this.createNotificationUseCase) {
				await this.createNotificationUseCase.execute({
					personId: originalLease.tenantId.toString(),
					text: 'A lease renewal is available for your review.',
					notificationType: NotificationType.ACTION,
					actionType: ActionType.LEASE_RENEWAL,
				})
			}
		}

		return right({ lease: renewalLease })
	}
}
