import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaPaymentMapper } from '../mappers/prisma-payment-mapper'
import { Payment } from '@/domain/payment/enterprise/entities/payment'
import {
	PaymentsRepository,
	PaymentsFilterParams,
	PaymentsByTenantParams,
	PaymentsPaginatedResult,
} from '@/domain/payment/application/repositories/payments-repository'
import { Prisma, PAYMENT_STATUS } from '@prisma/client'

@Injectable()
export class PrismaPaymentsRepository implements PaymentsRepository {
	constructor(private prisma: PrismaService) {}

	async create(payment: Payment): Promise<void> {
		const data = PrismaPaymentMapper.toPrisma(payment)
		await this.prisma.payment.create({ data })
	}

	async createMany(payments: Payment[]): Promise<void> {
		const data = payments.map(PrismaPaymentMapper.toPrisma)
		await this.prisma.payment.createMany({ data })
	}

	async findById(paymentId: string): Promise<Payment | null> {
		const payment = await this.prisma.payment.findUnique({
			where: { id: paymentId },
		})
		return payment ? PrismaPaymentMapper.toDomain(payment) : null
	}

	async findMany(
		params: PaymentsFilterParams,
	): Promise<PaymentsPaginatedResult> {
		const where: Prisma.PaymentWhereInput = {}

		if (params.status) where.status = params.status as PAYMENT_STATUS
		if (params.leaseId) where.leaseId = params.leaseId
		if (params.tenantId) where.tenantId = params.tenantId
		if (params.propertyId) where.lease = { propertyId: params.propertyId }
		if (params.managerId) {
			where.lease = {
				...((where.lease as object) ?? {}),
				property: { managerId: params.managerId },
			}
		}

		const [payments, totalCount] = await Promise.all([
			this.prisma.payment.findMany({
				where,
				orderBy: { dueDate: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.payment.count({ where }),
		])

		return {
			payments: payments.map(PrismaPaymentMapper.toDomain),
			totalCount,
		}
	}

	async findManyByTenant(
		params: PaymentsByTenantParams,
	): Promise<PaymentsPaginatedResult> {
		const where: Prisma.PaymentWhereInput = { tenantId: params.tenantId }

		if (params.status) where.status = params.status as PAYMENT_STATUS

		const [payments, totalCount] = await Promise.all([
			this.prisma.payment.findMany({
				where,
				orderBy: { dueDate: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.payment.count({ where }),
		])

		return {
			payments: payments.map(PrismaPaymentMapper.toDomain),
			totalCount,
		}
	}

	async findByStripeSessionId(sessionId: string): Promise<Payment | null> {
		const payment = await this.prisma.payment.findFirst({
			where: { stripeCheckoutSessionId: sessionId },
		})
		return payment ? PrismaPaymentMapper.toDomain(payment) : null
	}

	async findPendingOverdue(gracePeriodDays: number): Promise<Payment[]> {
		const threshold = new Date()
		threshold.setDate(threshold.getDate() - gracePeriodDays)

		const payments = await this.prisma.payment.findMany({
			where: {
				status: 'PENDING',
				dueDate: { lt: threshold },
			},
		})

		return payments.map(PrismaPaymentMapper.toDomain)
	}

	async findUpcomingDueByDate(date: Date): Promise<Payment[]> {
		const payments = await this.prisma.payment.findMany({
			where: {
				status: 'UPCOMING',
				dueDate: { lte: date },
			},
		})

		return payments.map(PrismaPaymentMapper.toDomain)
	}

	async findExistingForLease(
		leaseId: string,
		dueDate: Date,
	): Promise<Payment | null> {
		// Match by the start of the day to the end of the day
		const dayStart = new Date(
			dueDate.getFullYear(),
			dueDate.getMonth(),
			dueDate.getDate(),
		)
		const dayEnd = new Date(
			dueDate.getFullYear(),
			dueDate.getMonth(),
			dueDate.getDate() + 1,
		)

		const payment = await this.prisma.payment.findFirst({
			where: {
				leaseId,
				dueDate: { gte: dayStart, lt: dayEnd },
			},
		})

		return payment ? PrismaPaymentMapper.toDomain(payment) : null
	}

	async findPendingDueWithin(days: number): Promise<Payment[]> {
		const now = new Date()
		const future = new Date()
		future.setDate(future.getDate() + days)

		const payments = await this.prisma.payment.findMany({
			where: {
				status: 'PENDING',
				dueDate: { gte: now, lte: future },
			},
		})
		return payments.map(PrismaPaymentMapper.toDomain)
	}

	async update(payment: Payment): Promise<Payment> {
		const data = PrismaPaymentMapper.toPrisma(payment)
		const updated = await this.prisma.payment.update({
			where: { id: payment.id.toString() },
			data,
		})
		return PrismaPaymentMapper.toDomain(updated)
	}

	async deleteUnpaidByLeaseId(leaseId: string): Promise<number> {
		const result = await this.prisma.payment.deleteMany({
			where: {
				leaseId,
				status: { in: ['PENDING', 'UPCOMING'] },
			},
		})
		return result.count
	}
}
