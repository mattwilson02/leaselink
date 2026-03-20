import { Payment } from '../../enterprise/entities/payment'

export interface PaymentsFilterParams {
	status?: string
	leaseId?: string
	tenantId?: string
	propertyId?: string
	managerId?: string
	page: number
	pageSize: number
}

export interface PaymentsByTenantParams {
	tenantId: string
	status?: string
	page: number
	pageSize: number
}

export interface PaymentsPaginatedResult {
	payments: Payment[]
	totalCount: number
}

export abstract class PaymentsRepository {
	abstract create(payment: Payment): Promise<void>
	abstract createMany(payments: Payment[]): Promise<void>
	abstract findById(paymentId: string): Promise<Payment | null>
	abstract findMany(
		params: PaymentsFilterParams,
	): Promise<PaymentsPaginatedResult>
	abstract findManyByTenant(
		params: PaymentsByTenantParams,
	): Promise<PaymentsPaginatedResult>
	abstract findByStripeSessionId(sessionId: string): Promise<Payment | null>
	abstract findPendingOverdue(gracePeriodDays: number): Promise<Payment[]>
	abstract findExistingForLease(
		leaseId: string,
		dueDate: Date,
	): Promise<Payment | null>
	abstract findUpcomingDueByDate(date: Date): Promise<Payment[]>
	abstract findPendingDueWithin(days: number): Promise<Payment[]>
	abstract update(payment: Payment): Promise<Payment>
	abstract deleteUnpaidByLeaseId(leaseId: string): Promise<number>
}
