import { CreateLeaseUseCase } from './create-lease'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { makeProperty } from 'test/factories/make-property'
import { makeClient } from 'test/factories/make-client'
import { makeLease } from 'test/factories/make-lease'
import { PropertyStatus } from '@/domain/property-management/enterprise/entities/value-objects/property-status'
import { LeaseStatus } from '../../enterprise/entities/value-objects/lease-status'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { LeasePropertyNotAvailableError } from './errors/lease-property-not-available-error'
import { LeasePropertyHasActiveLeaseError } from './errors/lease-property-has-active-lease-error'
import { LeaseTenantHasActiveLeaseError } from './errors/lease-tenant-has-active-lease-error'
import type { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import type { GenerateLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-lease-payments'
import { right } from '@/core/either'
import { ActionType } from '@/domain/notification/enterprise/entities/notification'

class MockCreateNotificationUseCase {
	calls: any[] = []
	async execute(input: any) {
		this.calls.push(input)
		return right({ notification: {} as any })
	}
}

class MockGenerateLeasePaymentsUseCase {
	calls: any[] = []
	async execute(input: any) {
		this.calls.push(input)
		return right({ payments: [] })
	}
}

describe('CreateLeaseUseCase', () => {
	let inMemoryLeasesRepository: InMemoryLeasesRepository
	let inMemoryPropertiesRepository: InMemoryPropertiesRepository
	let inMemoryClientsRepository: InMemoryClientsRepository
	let mockCreateNotificationUseCase: MockCreateNotificationUseCase
	let mockGenerateLeasePaymentsUseCase: MockGenerateLeasePaymentsUseCase
	let sut: CreateLeaseUseCase

	beforeEach(() => {
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		inMemoryClientsRepository = new InMemoryClientsRepository()
		mockCreateNotificationUseCase = new MockCreateNotificationUseCase()
		mockGenerateLeasePaymentsUseCase = new MockGenerateLeasePaymentsUseCase()
		sut = new CreateLeaseUseCase(
			inMemoryLeasesRepository,
			inMemoryPropertiesRepository,
			inMemoryClientsRepository,
			mockCreateNotificationUseCase as unknown as CreateNotificationUseCase,
			mockGenerateLeasePaymentsUseCase as unknown as GenerateLeasePaymentsUseCase,
		)
	})

	it('should create a lease for a LISTED property', async () => {
		const property = makeProperty({
			status: PropertyStatus.create('LISTED'),
		})
		inMemoryPropertiesRepository.items.push(property)

		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			tenantId: tenant.id.toString(),
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.lease.status).toBe('PENDING')
		}
	})

	it('should reject if property not found', async () => {
		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		const result = await sut.execute({
			propertyId: 'non-existent-property',
			tenantId: tenant.id.toString(),
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(PropertyNotFoundError)
	})

	it('should reject if tenant not found', async () => {
		const property = makeProperty({ status: PropertyStatus.create('LISTED') })
		inMemoryPropertiesRepository.items.push(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			tenantId: 'non-existent-tenant',
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})

	it('should allow lease creation when property status is VACANT', async () => {
		const property = makeProperty({ status: PropertyStatus.create('VACANT') })
		inMemoryPropertiesRepository.items.push(property)

		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			tenantId: tenant.id.toString(),
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(result.isRight()).toBe(true)
	})

	it('should reject if property status is MAINTENANCE', async () => {
		const property = makeProperty({
			status: PropertyStatus.create('MAINTENANCE'),
		})
		inMemoryPropertiesRepository.items.push(property)

		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			tenantId: tenant.id.toString(),
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeasePropertyNotAvailableError)
	})

	it('should reject if property already has an active lease', async () => {
		const property = makeProperty({ status: PropertyStatus.create('LISTED') })
		inMemoryPropertiesRepository.items.push(property)

		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		const activeLease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(activeLease)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			tenantId: tenant.id.toString(),
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeasePropertyHasActiveLeaseError)
	})

	it('should send SIGN_LEASE notification to tenant on creation', async () => {
		const property = makeProperty({
			status: PropertyStatus.create('LISTED'),
		})
		inMemoryPropertiesRepository.items.push(property)

		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		await sut.execute({
			propertyId: property.id.toString(),
			tenantId: tenant.id.toString(),
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(mockCreateNotificationUseCase.calls).toHaveLength(1)
		expect(mockCreateNotificationUseCase.calls[0].personId).toBe(
			tenant.id.toString(),
		)
		expect(mockCreateNotificationUseCase.calls[0].actionType).toBe(
			ActionType.SIGN_LEASE,
		)
	})

	it('should auto-activate lease when start date is today or in the past', async () => {
		const property = makeProperty({ status: PropertyStatus.create('VACANT') })
		inMemoryPropertiesRepository.items.push(property)

		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			tenantId: tenant.id.toString(),
			startDate: today.toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.lease.status).toBe('ACTIVE')
		}

		expect(mockGenerateLeasePaymentsUseCase.calls).toHaveLength(1)
	})

	it('should set property status to OCCUPIED on auto-activation', async () => {
		const property = makeProperty({ status: PropertyStatus.create('VACANT') })
		inMemoryPropertiesRepository.items.push(property)

		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		const yesterday = new Date()
		yesterday.setDate(yesterday.getDate() - 1)
		yesterday.setHours(0, 0, 0, 0)

		await sut.execute({
			propertyId: property.id.toString(),
			tenantId: tenant.id.toString(),
			startDate: yesterday.toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		const updatedProperty = inMemoryPropertiesRepository.items.find(
			(p) => p.id.toString() === property.id.toString(),
		)
		expect(updatedProperty?.status).toBe('OCCUPIED')
	})

	it('should reject if tenant already has an active lease', async () => {
		const property = makeProperty({ status: PropertyStatus.create('LISTED') })
		inMemoryPropertiesRepository.items.push(property)

		const tenant = makeClient()
		inMemoryClientsRepository.items.push(tenant)

		const activeLease = makeLease({
			tenantId: tenant.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(activeLease)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			tenantId: tenant.id.toString(),
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2000,
			securityDeposit: 4000,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseTenantHasActiveLeaseError)
	})
})
