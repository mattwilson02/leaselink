import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeMaintenanceRequest } from 'test/factories/make-maintenance-request'
import { makeProperty } from 'test/factories/make-property'
import { makeLease } from 'test/factories/make-lease'
import { InMemoryMaintenanceRequestsRepository } from 'test/repositories/prisma/in-memory-maintenance-requests-repository'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { CreateMaintenanceRequestUseCase } from './create-maintenance-request'
import { MaintenanceNoActiveLeaseError } from './errors/maintenance-no-active-lease-error'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import type { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { right } from '@/core/either'

class MockCreateNotificationUseCase {
	calls: any[] = []

	async execute(input: any) {
		this.calls.push(input)
		return right({ notification: {} as any })
	}
}

let inMemoryMaintenanceRequestsRepository: InMemoryMaintenanceRequestsRepository
let inMemoryLeasesRepository: InMemoryLeasesRepository
let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let mockCreateNotificationUseCase: MockCreateNotificationUseCase
let sut: CreateMaintenanceRequestUseCase

describe('Create maintenance request', () => {
	beforeEach(() => {
		inMemoryMaintenanceRequestsRepository =
			new InMemoryMaintenanceRequestsRepository()
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		mockCreateNotificationUseCase = new MockCreateNotificationUseCase()

		sut = new CreateMaintenanceRequestUseCase(
			inMemoryMaintenanceRequestsRepository,
			inMemoryLeasesRepository,
			inMemoryPropertiesRepository,
			mockCreateNotificationUseCase as unknown as CreateNotificationUseCase,
		)
	})

	it('should create a request with OPEN status and MEDIUM priority', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const property = makeProperty({
			managerId: new UniqueEntityId('manager-1'),
		})
		await inMemoryPropertiesRepository.create(property)

		const lease = makeLease({
			tenantId,
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute({
			tenantId: 'tenant-1',
			propertyId: property.id.toString(),
			title: 'Leaky faucet',
			description: 'The kitchen faucet is leaking',
			category: 'PLUMBING',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.request.status).toBe('OPEN')
			expect(result.value.request.priority).toBe('MEDIUM')
		}
		expect(inMemoryMaintenanceRequestsRepository.items).toHaveLength(1)
	})

	it('should use specified priority', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const property = makeProperty({
			managerId: new UniqueEntityId('manager-1'),
		})
		await inMemoryPropertiesRepository.create(property)

		const lease = makeLease({
			tenantId,
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute({
			tenantId: 'tenant-1',
			propertyId: property.id.toString(),
			title: 'Gas leak',
			description: 'Smell gas in the kitchen',
			category: 'OTHER',
			priority: 'EMERGENCY',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.request.priority).toBe('EMERGENCY')
		}
	})

	it('should reject if tenant has no active lease', async () => {
		const property = makeProperty()
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			tenantId: 'tenant-no-lease',
			propertyId: property.id.toString(),
			title: 'Broken window',
			description: 'Window is cracked',
			category: 'STRUCTURAL',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(MaintenanceNoActiveLeaseError)
	})

	it('should reject if active lease is on a different property', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const propertyA = makeProperty()
		const propertyB = makeProperty()
		await inMemoryPropertiesRepository.create(propertyA)
		await inMemoryPropertiesRepository.create(propertyB)

		const lease = makeLease({
			tenantId,
			propertyId: propertyA.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute({
			tenantId: 'tenant-1',
			propertyId: propertyB.id.toString(),
			title: 'Broken window',
			description: 'Window is cracked',
			category: 'STRUCTURAL',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(MaintenanceNoActiveLeaseError)
	})

	it('should send notification to manager on creation', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const tenantId = new UniqueEntityId('tenant-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const lease = makeLease({
			tenantId,
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		await inMemoryLeasesRepository.create(lease)

		await sut.execute({
			tenantId: 'tenant-1',
			propertyId: property.id.toString(),
			title: 'Leaky faucet',
			description: 'The kitchen faucet is leaking',
			category: 'PLUMBING',
		})

		expect(mockCreateNotificationUseCase.calls).toHaveLength(1)
		expect(mockCreateNotificationUseCase.calls[0].personId).toBe('manager-1')
	})

	it('should indicate EMERGENCY in notification text', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const tenantId = new UniqueEntityId('tenant-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const lease = makeLease({
			tenantId,
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		await inMemoryLeasesRepository.create(lease)

		await sut.execute({
			tenantId: 'tenant-1',
			propertyId: property.id.toString(),
			title: 'Gas leak',
			description: 'Smell gas',
			category: 'OTHER',
			priority: 'EMERGENCY',
		})

		expect(mockCreateNotificationUseCase.calls[0].text).toContain('EMERGENCY')
	})
})
