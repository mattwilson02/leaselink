import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Payment } from '@/domain/payment/enterprise/entities/payment'
import { PaymentStatus } from '@/domain/payment/enterprise/entities/value-objects/payment-status'
import { Prisma, Payment as PrismaPayment } from '@prisma/client'

export class PrismaPaymentMapper {
	static toDomain(raw: PrismaPayment): Payment {
		return Payment.create(
			{
				leaseId: new UniqueEntityId(raw.leaseId),
				tenantId: new UniqueEntityId(raw.tenantId),
				amount: raw.amount,
				dueDate: raw.dueDate,
				status: PaymentStatus.create(raw.status),
				stripeCheckoutSessionId: raw.stripeCheckoutSessionId,
				stripePaymentIntentId: raw.stripePaymentIntentId,
				paidAt: raw.paidAt,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(payment: Payment): Prisma.PaymentUncheckedCreateInput {
		return {
			id: payment.id.toString(),
			leaseId: payment.leaseId.toString(),
			tenantId: payment.tenantId.toString(),
			amount: payment.amount,
			dueDate: payment.dueDate,
			status: payment.status as any,
			stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
			stripePaymentIntentId: payment.stripePaymentIntentId,
			paidAt: payment.paidAt,
			createdAt: payment.createdAt,
			updatedAt: payment.updatedAt ?? undefined,
		}
	}
}
