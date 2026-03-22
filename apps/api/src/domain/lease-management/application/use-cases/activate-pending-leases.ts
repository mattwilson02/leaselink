import { Either, right } from '@/core/either'
import { Injectable, Optional } from '@nestjs/common'
import { LeasesRepository } from '../repositories/leases-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { GenerateLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-lease-payments'

type ActivatePendingLeasesUseCaseResponse = Either<
	never,
	{ activatedCount: number }
>

@Injectable()
export class ActivatePendingLeasesUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		private propertiesRepository: PropertiesRepository,
		@Optional()
		private generateLeasePaymentsUseCase?: GenerateLeasePaymentsUseCase,
	) {}

	async execute(): Promise<ActivatePendingLeasesUseCaseResponse> {
		const today = new Date()
		today.setUTCHours(23, 59, 59, 999)

		const pendingLeases =
			await this.leasesRepository.findPendingByStartDateBefore(today)

		let activatedCount = 0

		for (const lease of pendingLeases) {
			lease.status = 'ACTIVE'
			await this.leasesRepository.update(lease)

			// Update property to OCCUPIED
			const property = await this.propertiesRepository.findById(
				lease.propertyId.toString(),
			)
			if (property && property.status !== 'OCCUPIED') {
				property.status = 'OCCUPIED'
				await this.propertiesRepository.update(property)
			}

			// Expire original lease if this is a renewal
			if (lease.renewedFromLeaseId) {
				const originalLease = await this.leasesRepository.findById(
					lease.renewedFromLeaseId.toString(),
				)
				if (originalLease && originalLease.status === 'ACTIVE') {
					originalLease.status = 'EXPIRED'
					await this.leasesRepository.update(originalLease)
				}
			}

			// Generate payments
			if (this.generateLeasePaymentsUseCase) {
				await this.generateLeasePaymentsUseCase.execute({
					leaseId: lease.id.toString(),
				})
			}

			activatedCount++
		}

		return right({ activatedCount })
	}
}
