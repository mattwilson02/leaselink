import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { LeasesRepository } from '@/domain/lease-management/application/repositories/leases-repository'
import { GenerateLeasePaymentsUseCase } from './generate-lease-payments'

type GenerateAllLeasePaymentsUseCaseResponse = Either<
	never,
	{ totalGenerated: number }
>

@Injectable()
export class GenerateAllLeasePaymentsUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		private generateLeasePaymentsUseCase: GenerateLeasePaymentsUseCase,
	) {}

	async execute(): Promise<GenerateAllLeasePaymentsUseCaseResponse> {
		const activeLeases = await this.leasesRepository.findAllActive()

		let totalGenerated = 0

		for (const lease of activeLeases) {
			const result = await this.generateLeasePaymentsUseCase.execute({
				leaseId: lease.id.toString(),
			})

			if (result.isRight()) {
				totalGenerated += result.value.payments.length
			}
		}

		return right({ totalGenerated })
	}
}
