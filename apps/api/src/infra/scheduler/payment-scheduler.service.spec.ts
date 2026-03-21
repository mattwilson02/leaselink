import { PaymentSchedulerService } from './payment-scheduler.service'
import { right } from '@/core/either'
import type { ActivateUpcomingPaymentsUseCase } from '@/domain/payment/application/use-cases/activate-upcoming-payments'
import type { GenerateAllLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-all-lease-payments'
import type { MarkOverduePaymentsUseCase } from '@/domain/payment/application/use-cases/mark-overdue-payments'
import type { EnvService } from '../env/env.service'

class MockActivateUpcomingPayments {
	calls = 0
	async execute() {
		this.calls++
		return right({ activatedCount: 5 })
	}
}

class MockGenerateAllLeasePayments {
	calls = 0
	async execute() {
		this.calls++
		return right({ totalGenerated: 10 })
	}
}

class MockMarkOverduePayments {
	calls = 0
	async execute() {
		this.calls++
		return right({ overdueCount: 2 })
	}
}

const makeEnvService = (enabled: boolean) =>
	({
		get: () => enabled,
	}) as unknown as EnvService

describe('PaymentSchedulerService', () => {
	describe('when SCHEDULER_ENABLED is true', () => {
		let activateUpcomingPayments: MockActivateUpcomingPayments
		let generateAllLeasePayments: MockGenerateAllLeasePayments
		let markOverduePayments: MockMarkOverduePayments
		let sut: PaymentSchedulerService

		beforeEach(() => {
			activateUpcomingPayments = new MockActivateUpcomingPayments()
			generateAllLeasePayments = new MockGenerateAllLeasePayments()
			markOverduePayments = new MockMarkOverduePayments()
			sut = new PaymentSchedulerService(
				activateUpcomingPayments as unknown as ActivateUpcomingPaymentsUseCase,
				generateAllLeasePayments as unknown as GenerateAllLeasePaymentsUseCase,
				markOverduePayments as unknown as MarkOverduePaymentsUseCase,
				makeEnvService(true),
			)
		})

		it('should call ActivateUpcomingPaymentsUseCase when SCHEDULER_ENABLED=true', async () => {
			await sut.handleUpcomingActivation()
			expect(activateUpcomingPayments.calls).toBe(1)
		})

		it('should call GenerateAllLeasePaymentsUseCase when SCHEDULER_ENABLED=true', async () => {
			await sut.handlePaymentGeneration()
			expect(generateAllLeasePayments.calls).toBe(1)
		})

		it('should call MarkOverduePaymentsUseCase when SCHEDULER_ENABLED=true', async () => {
			await sut.handleOverdueDetection()
			expect(markOverduePayments.calls).toBe(1)
		})
	})

	describe('when SCHEDULER_ENABLED is false', () => {
		let activateUpcomingPayments: MockActivateUpcomingPayments
		let generateAllLeasePayments: MockGenerateAllLeasePayments
		let markOverduePayments: MockMarkOverduePayments
		let sut: PaymentSchedulerService

		beforeEach(() => {
			activateUpcomingPayments = new MockActivateUpcomingPayments()
			generateAllLeasePayments = new MockGenerateAllLeasePayments()
			markOverduePayments = new MockMarkOverduePayments()
			sut = new PaymentSchedulerService(
				activateUpcomingPayments as unknown as ActivateUpcomingPaymentsUseCase,
				generateAllLeasePayments as unknown as GenerateAllLeasePaymentsUseCase,
				markOverduePayments as unknown as MarkOverduePaymentsUseCase,
				makeEnvService(false),
			)
		})

		it('should not call ActivateUpcomingPaymentsUseCase when SCHEDULER_ENABLED=false', async () => {
			await sut.handleUpcomingActivation()
			expect(activateUpcomingPayments.calls).toBe(0)
		})

		it('should not call GenerateAllLeasePaymentsUseCase when SCHEDULER_ENABLED=false', async () => {
			await sut.handlePaymentGeneration()
			expect(generateAllLeasePayments.calls).toBe(0)
		})

		it('should not call MarkOverduePaymentsUseCase when SCHEDULER_ENABLED=false', async () => {
			await sut.handleOverdueDetection()
			expect(markOverduePayments.calls).toBe(0)
		})
	})
})
