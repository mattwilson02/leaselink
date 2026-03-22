import { Payment } from '@/domain/payment/enterprise/entities/payment'

export interface PaymentHttpResponse {
	id: string
	leaseId: string
	tenantId: string
	amount: number
	dueDate: string
	status: string
	paidAt: string | null
	createdAt: string
	updatedAt: string | null
}

export class HttpPaymentPresenter {
	static toHTTP(payment: Payment): PaymentHttpResponse {
		return {
			id: payment.id.toString(),
			leaseId: payment.leaseId.toString(),
			tenantId: payment.tenantId.toString(),
			amount: payment.amount,
			dueDate: payment.dueDate.toISOString(),
			status: payment.status,
			paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
			createdAt:
				payment.createdAt instanceof Date
					? payment.createdAt.toISOString()
					: payment.createdAt,
			updatedAt: payment.updatedAt
				? payment.updatedAt instanceof Date
					? payment.updatedAt.toISOString()
					: payment.updatedAt
				: null,
		}
	}

	static toHTTPList(payments: Payment[]): PaymentHttpResponse[] {
		return payments.map(HttpPaymentPresenter.toHTTP)
	}
}
