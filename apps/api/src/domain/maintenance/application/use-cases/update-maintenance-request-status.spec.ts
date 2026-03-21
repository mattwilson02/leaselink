import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeMaintenanceRequest } from 'test/factories/make-maintenance-request'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryMaintenanceRequestsRepository } from 'test/repositories/prisma/in-memory-maintenance-requests-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { UpdateMaintenanceRequestStatusUseCase } from './update-maintenance-request-status'
import { MaintenanceRequestNotFoundError } from './errors/maintenance-request-not-found-error'
import { InvalidMaintenanceStatusTransitionError } from './errors/invalid-maintenance-status-transition-error'
import { MaintenanceOnlyManagerCanUpdateStatusError } from './errors/maintenance-only-manager-can-update-status-error'
import { MaintenanceStatus } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-status'
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
let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let mockCreateNotificationUseCase: MockCreateNotificationUseCase
let sut: UpdateMaintenanceRequestStatusUseCase

describe('Update maintenance request status', () => {
	beforeEach(() => {
		inMemoryMaintenanceRequestsRepository =
			new InMemoryMaintenanceRequestsRepository()
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		mockCreateNotificationUseCase = new MockCreateNotificationUseCase()

		sut = new UpdateMaintenanceRequestStatusUseCase(
			inMemoryMaintenanceRequestsRepository,
			inMemoryPropertiesRepository,
			mockCreateNotificationUseCase as unknown as CreateNotificationUseCase,
		)
	})

	it('should transition OPEN -> IN_PROGRESS (manager)', async () => {
		const request = makeMaintenanceRequest()
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'manager-1',
			userRole: 'manager',
			status: 'IN_PROGRESS',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.request.status).toBe('IN_PROGRESS')
		}
	})

	it('should reject OPEN -> IN_PROGRESS (tenant)', async () => {
		const request = makeMaintenanceRequest()
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'tenant-1',
			userRole: 'tenant',
			status: 'IN_PROGRESS',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(
			MaintenanceOnlyManagerCanUpdateStatusError,
		)
	})

	it('should transition IN_PROGRESS -> RESOLVED (manager) and set resolvedAt', async () => {
		const request = makeMaintenanceRequest({
			status: MaintenanceStatus.create('IN_PROGRESS'),
		})
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'manager-1',
			userRole: 'manager',
			status: 'RESOLVED',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.request.status).toBe('RESOLVED')
			expect(result.value.request.resolvedAt).toBeInstanceOf(Date)
		}
	})

	it('should reject IN_PROGRESS -> RESOLVED (tenant)', async () => {
		const request = makeMaintenanceRequest({
			status: MaintenanceStatus.create('IN_PROGRESS'),
		})
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'tenant-1',
			userRole: 'tenant',
			status: 'RESOLVED',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(
			MaintenanceOnlyManagerCanUpdateStatusError,
		)
	})

	it('should transition RESOLVED -> CLOSED (manager)', async () => {
		const request = makeMaintenanceRequest({
			status: MaintenanceStatus.create('RESOLVED'),
		})
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'manager-1',
			userRole: 'manager',
			status: 'CLOSED',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.request.status).toBe('CLOSED')
		}
	})

	it('should transition RESOLVED -> CLOSED (tenant)', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const request = makeMaintenanceRequest({
			tenantId,
			status: MaintenanceStatus.create('RESOLVED'),
		})
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'tenant-1',
			userRole: 'tenant',
			status: 'CLOSED',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.request.status).toBe('CLOSED')
		}
	})

	it('should reject OPEN -> RESOLVED (skip)', async () => {
		const request = makeMaintenanceRequest()
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'manager-1',
			userRole: 'manager',
			status: 'RESOLVED',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(InvalidMaintenanceStatusTransitionError)
	})

	it('should reject any transition from CLOSED', async () => {
		const request = makeMaintenanceRequest({
			status: MaintenanceStatus.create('CLOSED'),
		})
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'manager-1',
			userRole: 'manager',
			status: 'OPEN',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(InvalidMaintenanceStatusTransitionError)
	})

	it('should return not found for non-existent request', async () => {
		const result = await sut.execute({
			requestId: 'non-existent',
			userId: 'manager-1',
			userRole: 'manager',
			status: 'IN_PROGRESS',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(MaintenanceRequestNotFoundError)
	})

	it('should assign vendor to request', async () => {
		const request = makeMaintenanceRequest()
		await inMemoryMaintenanceRequestsRepository.create(request)

		const vendorId = 'vendor-uuid-1234'
		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'manager-1',
			userRole: 'manager',
			status: 'IN_PROGRESS',
			vendorId,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.request.vendorId?.toString()).toBe(vendorId)
		}
	})

	it('should unassign vendor when vendorId is null', async () => {
		const request = makeMaintenanceRequest()
		request.vendorId = new UniqueEntityId('vendor-uuid-1234')
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			userId: 'manager-1',
			userRole: 'manager',
			status: 'IN_PROGRESS',
			vendorId: null,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.request.vendorId).toBeNull()
		}
	})

	it('should send notification to tenant when manager updates', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const request = makeMaintenanceRequest({ tenantId })
		await inMemoryMaintenanceRequestsRepository.create(request)

		await sut.execute({
			requestId: request.id.toString(),
			userId: 'manager-1',
			userRole: 'manager',
			status: 'IN_PROGRESS',
		})

		expect(mockCreateNotificationUseCase.calls).toHaveLength(1)
		expect(mockCreateNotificationUseCase.calls[0].personId).toBe('tenant-1')
	})

	it('should send notification to manager when tenant closes', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const tenantId = new UniqueEntityId('tenant-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const request = makeMaintenanceRequest({
			tenantId,
			propertyId: property.id,
			status: MaintenanceStatus.create('RESOLVED'),
		})
		await inMemoryMaintenanceRequestsRepository.create(request)

		await sut.execute({
			requestId: request.id.toString(),
			userId: 'tenant-1',
			userRole: 'tenant',
			status: 'CLOSED',
		})

		expect(mockCreateNotificationUseCase.calls).toHaveLength(1)
		expect(mockCreateNotificationUseCase.calls[0].personId).toBe('manager-1')
	})
})
