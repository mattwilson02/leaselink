import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	Payment,
	PaymentProps,
} from '@/domain/payment/enterprise/entities/payment'
import { PaymentStatus } from '@/domain/payment/enterprise/entities/value-objects/payment-status'
import { faker } from '@faker-js/faker'

export const makePayment = (
	override: Partial<PaymentProps> = {},
	id?: UniqueEntityId,
) => {
	const dueDate = new Date()
	dueDate.setDate(1)

	return Payment.create(
		{
			leaseId: new UniqueEntityId(),
			tenantId: new UniqueEntityId(),
			amount: faker.number.float({ min: 800, max: 5000, multipleOf: 0.01 }),
			dueDate,
			status: PaymentStatus.create('UPCOMING'),
			...override,
		},
		id,
	)
}
