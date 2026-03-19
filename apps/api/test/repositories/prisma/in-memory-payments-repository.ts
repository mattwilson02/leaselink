import type {
	PaymentsRepository,
	PaymentsFilterParams,
	PaymentsByTenantParams,
	PaymentsPaginatedResult,
} from '@/domain/payment/application/repositories/payments-repository'
import type { Payment } from '@/domain/payment/enterprise/entities/payment'

export class InMemoryPaymentsRepository implements PaymentsRepository {
	public items: Payment[] = []

	async create(payment: Payment): Promise<void> {
		this.items.push(payment)
	}

	async createMany(payments: Payment[]): Promise<void> {
		this.items.push(...payments)
	}

	async findById(paymentId: string): Promise<Payment | null> {
		return this.items.find((p) => p.id.toString() === paymentId) ?? null
	}

	async findMany(
		params: PaymentsFilterParams,
	): Promise<PaymentsPaginatedResult> {
		let filtered = [...this.items]

		if (params.status) {
			filtered = filtered.filter((p) => p.status === params.status)
		}
		if (params.leaseId) {
			filtered = filtered.filter((p) => p.leaseId.toString() === params.leaseId)
		}
		if (params.tenantId) {
			filtered = filtered.filter(
				(p) => p.tenantId.toString() === params.tenantId,
			)
		}

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { payments: paginated, totalCount }
	}

	async findManyByTenant(
		params: PaymentsByTenantParams,
	): Promise<PaymentsPaginatedResult> {
		let filtered = this.items.filter(
			(p) => p.tenantId.toString() === params.tenantId,
		)

		if (params.status) {
			filtered = filtered.filter((p) => p.status === params.status)
		}

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { payments: paginated, totalCount }
	}

	async findByStripeSessionId(sessionId: string): Promise<Payment | null> {
		return (
			this.items.find((p) => p.stripeCheckoutSessionId === sessionId) ?? null
		)
	}

	async findPendingOverdue(gracePeriodDays: number): Promise<Payment[]> {
		const threshold = new Date()
		threshold.setDate(threshold.getDate() - gracePeriodDays)

		return this.items.filter(
			(p) => p.status === 'PENDING' && p.dueDate < threshold,
		)
	}

	async findExistingForLease(
		leaseId: string,
		dueDate: Date,
	): Promise<Payment | null> {
		return (
			this.items.find(
				(p) =>
					p.leaseId.toString() === leaseId &&
					p.dueDate.getFullYear() === dueDate.getFullYear() &&
					p.dueDate.getMonth() === dueDate.getMonth() &&
					p.dueDate.getDate() === dueDate.getDate(),
			) ?? null
		)
	}

	async update(payment: Payment): Promise<Payment> {
		const index = this.items.findIndex(
			(p) => p.id.toString() === payment.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = payment
		}
		return payment
	}
}
