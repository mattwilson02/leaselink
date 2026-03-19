import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { LeasesRepository } from '@/domain/lease-management/application/repositories/leases-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { PaymentsRepository } from '../repositories/payments-repository'
import { StripeService } from '../stripe/stripe-service'
import { PaymentNotFoundError } from './errors/payment-not-found-error'
import { PaymentAlreadyPaidError } from './errors/payment-already-paid-error'
import { PaymentNotPayableError } from './errors/payment-not-payable-error'

export interface CreateCheckoutSessionUseCaseRequest {
	paymentId: string
	tenantId: string
	successUrl: string
	cancelUrl: string
}

type CreateCheckoutSessionUseCaseResponse = Either<
	PaymentNotFoundError | PaymentAlreadyPaidError | PaymentNotPayableError,
	{ url: string }
>

@Injectable()
export class CreateCheckoutSessionUseCase {
	constructor(
		private paymentsRepository: PaymentsRepository,
		private leasesRepository: LeasesRepository,
		private propertiesRepository: PropertiesRepository,
		private stripeService: StripeService,
	) {}

	async execute({
		paymentId,
		tenantId,
		successUrl,
		cancelUrl,
	}: CreateCheckoutSessionUseCaseRequest): Promise<CreateCheckoutSessionUseCaseResponse> {
		const payment = await this.paymentsRepository.findById(paymentId)

		if (!payment || payment.tenantId.toString() !== tenantId) {
			return left(new PaymentNotFoundError())
		}

		if (payment.status === 'PAID') {
			return left(new PaymentAlreadyPaidError())
		}

		if (payment.status === 'UPCOMING') {
			return left(new PaymentNotPayableError())
		}

		const lease = await this.leasesRepository.findById(
			payment.leaseId.toString(),
		)
		const property = lease
			? await this.propertiesRepository.findById(lease.propertyId.toString())
			: null

		const description = property
			? `Rent payment for ${property.address}`
			: 'Rent payment'

		const session = await this.stripeService.createCheckoutSession({
			amount: Math.round(payment.amount * 100), // convert to cents
			currency: 'usd',
			description,
			metadata: {
				paymentId: payment.id.toString(),
				leaseId: payment.leaseId.toString(),
				tenantId,
			},
			successUrl,
			cancelUrl,
		})

		payment.stripeCheckoutSessionId = session.sessionId
		await this.paymentsRepository.update(payment)

		return right({ url: session.url })
	}
}
